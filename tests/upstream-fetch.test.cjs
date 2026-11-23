const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { once } = require('node:events');
const { test } = require('node:test');
const { fetchText, fetchBuffer } = require('../scripts/fetch-upstream.cjs');

const kapUrl = 'https://codeberg.org/loke/array/raw/branch/master/docs/reference.asciidoc';
const apiUrl = 'https://api.github.com/repos/RubenVerg/tinyapl/contents/docs/pages/glyphs?ref=beta';

function downloader(responses, overrides = {}) {
    const calls = [];
    const delays = [];
    const warnings = [];
    const options = {
        token: '',
        fetchImpl: async (url, options) => {
            calls.push({ url, ...options });
            assert.ok(responses.length, 'unexpected extra request');
            const response = responses.shift();
            if (response instanceof Error) throw response;
            return response;
        },
        sleepImpl: async ms => { delays.push(ms); },
        warn: message => { warnings.push(message); },
        ...overrides,
    };
    return {
        calls, delays, warnings,
        text: (url = kapUrl) => fetchText(url, options),
        buffer: (url = kapUrl) => fetchBuffer(url, options),
    };
}

test('upstream downloads recover from temporary server and network failures with backoff', async () => {
    const networkError = new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
    const download = downloader([
        new Response('temporarily unavailable', { status: 503 }),
        networkError,
        new Response('Kap ∀ reference'),
    ]);
    assert.equal(await download.text(), 'Kap ∀ reference');
    assert.deepEqual(download.delays, [1000, 2000]);
    assert.notEqual(download.calls[0].signal, download.calls[1].signal);
    assert.match(download.warnings[0], /codeberg\.org.*attempt 1\/3.*HTTP 503.*temporarily unavailable/);
    assert.match(download.warnings[1], /ECONNRESET/);
});

test('upstream downloads stop after three failures and include the source URL', async () => {
    const download = downloader(Array.from({ length: 3 }, () => new DOMException('aborted', 'TimeoutError')));
    await assert.rejects(download.text(), error => {
        assert.ok(error.message.includes(kapUrl));
        assert.match(error.message, /attempt 3\/3.*timed out after 60000ms/);
        return true;
    });
    assert.equal(download.calls.length, 3);
    assert.deepEqual(download.delays, [1000, 2000]);
});

test('GitHub credentials stay on the API across relative and cross-origin redirects', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/RubenVerg/tinyapl/beta/docs/pages/glyphs/a.mdx';
    const download = downloader([
        new Response(null, { status: 301, headers: { location: '/renamed' } }),
        new Response(null, { status: 302, headers: { location: rawUrl } }),
        new Response(null, { status: 307, headers: { location: kapUrl } }),
        new Response('docs'),
    ], { token: 'test-token' });
    assert.equal(await download.text(apiUrl), 'docs');
    assert.equal(download.calls[1].url, 'https://api.github.com/renamed');
    assert.deepEqual(download.calls.map(call => call.headers.Authorization), [
        'Bearer test-token', 'Bearer test-token', undefined, undefined,
    ]);
});

test('public downloads work without a GitHub token', async () => {
    const download = downloader([new Response('[]')]);
    assert.equal(await download.text(apiUrl), '[]');
    assert.equal(download.calls[0].headers.Authorization, undefined);
    assert.equal(download.calls[0].headers.Accept, 'application/vnd.github+json');
});

test('GitHub primary rate limits wait for the reset time', async t => {
    t.mock.method(Date, 'now', () => 1_800_000_000_000);
    const download = downloader([
        new Response('{"message":"API rate limit exceeded"}', {
            status: 403,
            headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000003' },
        }),
        new Response('[]'),
    ]);
    assert.equal(await download.text(apiUrl), '[]');
    assert.deepEqual(download.delays, [3000]);
    assert.match(download.warnings[0], /HTTP 403.*API rate limit exceeded.*x-ratelimit-remaining=0.*x-ratelimit-reset=1800000003/);
});

test('GitHub secondary rate limits wait at least a minute with increasing backoff', async () => {
    const download = downloader([
        new Response('{"message":"You have exceeded a secondary rate limit"}', { status: 403 }),
        new Response('{"message":"You have exceeded a secondary rate limit"}', { status: 403 }),
        new Response('[]'),
    ]);
    assert.equal(await download.text(apiUrl), '[]');
    assert.deepEqual(download.delays, [60_000, 120_000]);
});

test('upstream rate limits honor Retry-After seconds and HTTP dates', async t => {
    t.mock.method(Date, 'now', () => 1_800_000_000_000);
    const download = downloader([
        new Response('slow down', { status: 429, headers: { 'retry-after': '3' } }),
        new Response('slow down', { status: 429, headers: { 'retry-after': new Date(Date.now() + 4000).toUTCString() } }),
        new Response('ok'),
    ]);
    assert.equal(await download.text(), 'ok');
    assert.deepEqual(download.delays, [3000, 4000]);
});

test('long rate limits fail with diagnostics instead of retrying too early', async t => {
    t.mock.method(Date, 'now', () => 1_800_000_000_000);
    for (const headers of [
        { 'retry-after': '3600' },
        { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800003600' },
    ]) {
        const download = downloader([new Response('rate limit exceeded', { status: 403, headers })]);
        await assert.rejects(download.text(apiUrl), /HTTP 403.*rate limit exceeded.*required retry delay exceeds/);
        assert.equal(download.calls.length, 1);
        assert.deepEqual(download.delays, []);
    }
});

test('permanent HTTP errors fail immediately with response details', async () => {
    for (const status of [401, 403, 404]) {
        const download = downloader([new Response('resource not accessible', { status })]);
        await assert.rejects(download.text(), new RegExp(`HTTP ${status}.*resource not accessible`));
        assert.equal(download.calls.length, 1);
        assert.deepEqual(download.delays, []);
    }
});

test('redirect loops fail without retrying indefinitely', async () => {
    const download = downloader(Array.from({ length: 6 }, () =>
        new Response(null, { status: 302, headers: { location: kapUrl } })));
    await assert.rejects(download.text(), /excessive redirects/);
    assert.equal(download.calls.length, 6);
    assert.deepEqual(download.delays, []);
});

test('binary upstream downloads retry interrupted bodies without corrupting bytes', async () => {
    const broken = new Response(new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array([0, 1]));
            controller.error(new Error('connection reset during body'));
        },
    }));
    const bytes = Buffer.from([0, 1, 0, 0, 255, 128]);
    const download = downloader([broken, new Response(bytes)]);
    assert.deepEqual(await download.buffer(), bytes);
    assert.deepEqual(download.delays, [1000]);
});

test('upstream timeout covers both response headers and stalled response bodies', async t => {
    const server = createServer((req, res) => {
        if (req.url === '/body') {
            res.writeHead(200);
            res.write('incomplete body');
        }
    });
    t.after(() => {
        server.closeAllConnections();
        server.close();
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    for (const path of ['/headers', '/body']) {
        const url = `http://127.0.0.1:${server.address().port}${path}`;
        await assert.rejects(fetchText(url, { timeoutMs: 50, maxAttempts: 1 }), error => {
            assert.ok(error.message.includes(url));
            assert.match(error.message, /timed out after 50ms/);
            return true;
        });
    }
});
