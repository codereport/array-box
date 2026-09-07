const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
    createConfig,
    createNars2000Server,
    evaluateWithRunner,
    evaluateWithUpstream,
    getMode,
    parseRunnerArgs,
    validateResult
} = require('../servers/nars2000-server.cjs');

const fixture = path.join(__dirname, 'fixtures', 'nars2000-runner.cjs');

function listen(options) {
    const instance = createNars2000Server(options);
    return new Promise((resolve, reject) => {
        instance.server.once('error', reject);
        instance.server.listen(0, '127.0.0.1', () => {
            const { port } = instance.server.address();
            resolve({
                ...instance,
                baseUrl: `http://127.0.0.1:${port}`,
                close: () => new Promise((done) => instance.server.close(done))
            });
        });
    });
}

test('runner arguments and adapter configuration are strictly validated', () => {
    assert.deepEqual(parseRunnerArgs('["--workspace","test.apl"]'), ['--workspace', 'test.apl']);
    assert.throws(() => parseRunnerArgs('"--unsafe"'), /JSON array/);
    assert.throws(() => parseRunnerArgs('[1]'), /JSON array of strings/);

    const empty = createConfig({});
    assert.equal(getMode(empty), 'unconfigured');

    const conflict = createConfig({
        NARS2000_RUNNER: '/runner',
        NARS2000_UPSTREAM_URL: 'https://example.test/nars'
    });
    assert.equal(getMode(conflict), 'invalid');
    assert.match(conflict.configurationError, /only one/);

    const invalidUrl = createConfig({ NARS2000_UPSTREAM_URL: 'file:///nars' });
    assert.equal(getMode(invalidUrl), 'invalid');
});

test('adapter results require explicit success and output fields', () => {
    assert.deepEqual(validateResult({ success: true, output: '3', ignored: true }), {
        success: true,
        output: '3'
    });
    assert.throws(() => validateResult({ output: '3' }), /boolean success/);
    assert.throws(() => validateResult({ success: true, output: 3 }), /string output/);
});

test('unconfigured bridge is healthy enough to diagnose but not ready to evaluate', async (t) => {
    const app = await listen({ env: {} });
    t.after(app.close);

    const healthResponse = await fetch(`${app.baseUrl}/health`);
    const health = await healthResponse.json();
    assert.equal(healthResponse.status, 200);
    assert.equal(health.status, 'degraded');
    assert.equal(health.ready, false);
    assert.equal(health.mode, 'unconfigured');

    const evalResponse = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '1+2' })
    });
    const result = await evalResponse.json();
    assert.equal(evalResponse.status, 503);
    assert.equal(result.success, false);
    assert.match(result.output, /not configured/);
});

test('configured process runner receives JSON on stdin and returns evaluation JSON', async (t) => {
    const app = await listen({
        env: {
            NARS2000_RUNNER: process.execPath,
            NARS2000_RUNNER_ARGS: JSON.stringify([fixture])
        }
    });
    t.after(app.close);

    const health = await (await fetch(`${app.baseUrl}/health`)).json();
    assert.equal(health.status, 'ok');
    assert.equal(health.ready, true);
    assert.equal(health.mode, 'runner');

    const response = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '1+2' })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, output: 'nars:1:1+2' });

    const interpreterError = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'FAIL' })
    });
    assert.equal(interpreterError.status, 200);
    assert.deepEqual(await interpreterError.json(), { success: false, output: 'DOMAIN ERROR' });
});

test('bridge validates request bodies and enforces runner timeouts', async (t) => {
    const config = createConfig({
        NARS2000_RUNNER: process.execPath,
        NARS2000_RUNNER_ARGS: JSON.stringify([fixture]),
        NARS2000_TIMEOUT_MS: '25',
        NARS2000_MAX_BODY_BYTES: '32'
    });
    const app = await listen({ config });
    t.after(app.close);

    const empty = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '' })
    });
    assert.equal(empty.status, 400);

    const oversized = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'x'.repeat(64) })
    });
    assert.equal(oversized.status, 413);

    const timedOut = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'TIMEOUT' })
    });
    assert.equal(timedOut.status, 502);
    assert.match((await timedOut.json()).output, /timed out/);
});

test('process helper can be tested without the HTTP server', async () => {
    const config = createConfig({
        NARS2000_RUNNER: process.execPath,
        NARS2000_RUNNER_ARGS: JSON.stringify([fixture])
    });
    assert.deepEqual(await evaluateWithRunner('2×3', config), {
        success: true,
        output: 'nars:1:2×3'
    });
});

test('upstream adapter appends the eval route and validates its response', async () => {
    const config = createConfig({ NARS2000_UPSTREAM_URL: 'https://nars.example/api/nars2000' });
    let request;
    const result = await evaluateWithUpstream('3√8', config, async (url, options) => {
        request = { url: url.toString(), options };
        return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ success: true, output: '2' })
        };
    });

    assert.deepEqual(result, { success: true, output: '2' });
    assert.equal(request.url, 'https://nars.example/api/nars2000/eval');
    assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), { code: '3√8' });
});

test('bridge rejects excess concurrency while an evaluation is active', async (t) => {
    const app = await listen({
        env: {
            NARS2000_RUNNER: process.execPath,
            NARS2000_RUNNER_ARGS: JSON.stringify([fixture]),
            NARS2000_TIMEOUT_MS: '1000',
            NARS2000_MAX_CONCURRENCY: '1'
        }
    });
    t.after(app.close);

    const first = fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'TIMEOUT' })
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await fetch(`${app.baseUrl}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '1+2' })
    });

    assert.equal(second.status, 429);
    assert.match((await second.json()).output, /busy/);
    assert.equal((await first).status, 200);
});
