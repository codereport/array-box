const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    checkLocalService,
    checkPublicBackend,
    extractBackendUrl
} = require('../servers/health-checks.cjs');

function response(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => body
    };
}

function withLocalConfig(backendUrl, callback) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arraybox-health-'));
    const configPath = path.join(dir, 'config.js');
    fs.writeFileSync(configPath, `const ArrayBoxConfig = { BACKEND_URL: '${backendUrl}' };`);
    return callback(configPath).finally(() => fs.rmSync(dir, { recursive: true, force: true }));
}

test('extractBackendUrl ignores later commented examples', () => {
    const config = `
        const ArrayBoxConfig = {
            BACKEND_URL: null,
            // BACKEND_URL: 'https://example.trycloudflare.com'
        };
    `;
    assert.equal(extractBackendUrl(config), null);
});

test('local check does not treat an HTTP 404 response as healthy', async () => {
    const result = await checkLocalService({
        name: 'APL',
        port: 8081,
        fetchImpl: async () => response('not found', 404)
    });

    assert.equal(result.status, 'down');
    assert.match(result.detail, /HTTP 404/);
});

test('public check fails when config.js was changed locally but not published', async () => {
    await withLocalConfig('https://new-tunnel.trycloudflare.com', async (localConfigPath) => {
        const result = await checkPublicBackend({
            localConfigPath,
            publicConfigUrl: 'https://arraybox.dev/config.js',
            fetchImpl: async () => response(
                "const ArrayBoxConfig = { BACKEND_URL: 'https://old-tunnel.trycloudflare.com' };"
            )
        });

        assert.equal(result.status, 'down');
        assert.match(result.detail, /Published config\.js is stale/);
    });
});

test('public check fails when the deployed tunnel cannot reach backend routes', async () => {
    await withLocalConfig('https://new-tunnel.trycloudflare.com', async (localConfigPath) => {
        const requestedUrls = [];
        const result = await checkPublicBackend({
            localConfigPath,
            publicConfigUrl: 'https://arraybox.dev/config.js',
            fetchImpl: async (url) => {
                requestedUrls.push(url);
                if (url.endsWith('/config.js')) {
                    return response(
                        "const ArrayBoxConfig = { BACKEND_URL: 'https://new-tunnel.trycloudflare.com' };"
                    );
                }
                throw new Error('tunnel is offline');
            }
        });

        assert.deepEqual(requestedUrls, [
            'https://arraybox.dev/config.js',
            'https://new-tunnel.trycloudflare.com/api/apl/health',
            'https://new-tunnel.trycloudflare.com/api/log/health'
        ]);
        assert.equal(result.status, 'down');
        assert.match(result.detail, /Public backend route failed/);
    });
});

test('public check fails when metrics are unavailable even if APL is healthy', async () => {
    await withLocalConfig('https://new-tunnel.trycloudflare.com', async (localConfigPath) => {
        const result = await checkPublicBackend({
            localConfigPath,
            publicConfigUrl: 'https://arraybox.dev/config.js',
            fetchImpl: async (url) => {
                if (url.endsWith('/config.js')) {
                    return response(
                        "const ArrayBoxConfig = { BACKEND_URL: 'https://new-tunnel.trycloudflare.com' };"
                    );
                }
                if (url.endsWith('/api/apl/health')) {
                    return response(JSON.stringify({ status: 'ok' }));
                }
                return response('not found', 404);
            }
        });

        assert.equal(result.status, 'down');
        assert.match(result.detail, /metrics: HTTP 404/);
    });
});

test('public check passes only when published config, APL, and metrics routes are healthy', async () => {
    await withLocalConfig('https://new-tunnel.trycloudflare.com/', async (localConfigPath) => {
        const result = await checkPublicBackend({
            localConfigPath,
            publicConfigUrl: 'https://arraybox.dev/config.js',
            fetchImpl: async (url) => {
                if (url.endsWith('/config.js')) {
                    return response(
                        "const ArrayBoxConfig = { BACKEND_URL: 'https://new-tunnel.trycloudflare.com' };"
                    );
                }
                return response(JSON.stringify({ status: 'ok' }));
            }
        });

        assert.equal(result.status, 'up');
    });
});
