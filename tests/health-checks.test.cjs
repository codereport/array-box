const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    checkDashboardServices,
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

const BACKEND_URL = 'https://new-tunnel.trycloudflare.com';

function healthyDashboardFetch(overrides = {}) {
    return async (url, options) => {
        if (overrides[url]) return overrides[url](options);
        if (url.endsWith('/config.js')) {
            return response(`const ArrayBoxConfig = { BACKEND_URL: '${BACKEND_URL}' };`);
        }
        return response(JSON.stringify({ status: 'ok' }));
    };
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

test('dashboard marks APL down when Cloudflare returns 530 despite a healthy local server', async () => {
    await withLocalConfig(BACKEND_URL, async (localConfigPath) => {
        const result = await checkDashboardServices({
            localConfigPath,
            fetchImpl: healthyDashboardFetch({
                [`${BACKEND_URL}/api/apl/health`]: () => response('error code: 1033', 530),
                [`${BACKEND_URL}/api/log/health`]: () => response('error code: 1033', 530)
            })
        });

        assert.equal(result.apl.status, 'down');
        assert.equal(result.apl.localStatus, 'up');
        assert.equal(result.apl.publicStatus, 'down');
        assert.match(result.apl.detail, /Public APL health check failed: HTTP 530/);
        assert.equal(result.site.status, 'down');
        assert.equal(result.permalink.status, 'up');
    });
});

test('dashboard restores APL to green after the public tunnel recovers', async () => {
    await withLocalConfig(BACKEND_URL, async (localConfigPath) => {
        let offline = true;
        const options = {
            localConfigPath,
            fetchImpl: healthyDashboardFetch({
                [`${BACKEND_URL}/api/apl/health`]: () => {
                    if (offline) throw new TypeError('fetch failed');
                    return response(JSON.stringify({ status: 'ok' }));
                }
            })
        };

        assert.equal((await checkDashboardServices(options)).apl.status, 'down');
        offline = false;
        const recovered = await checkDashboardServices(options);
        assert.equal(recovered.apl.status, 'up');
        assert.equal(recovered.apl.publicStatus, 'up');
        assert.equal(recovered.site.status, 'up');
    });
});

test('dashboard does not mark APL down when only public metrics fail', async () => {
    await withLocalConfig(BACKEND_URL, async (localConfigPath) => {
        const result = await checkDashboardServices({
            localConfigPath,
            fetchImpl: healthyDashboardFetch({
                [`${BACKEND_URL}/api/log/health`]: () => response('not found', 404)
            })
        });

        assert.equal(result.apl.status, 'up');
        assert.equal(result.site.status, 'down');
        assert.match(result.site.detail, /metrics: HTTP 404/);
    });
});

test('dashboard marks APL down if the published configuration cannot be checked', async () => {
    await withLocalConfig(BACKEND_URL, async (localConfigPath) => {
        const result = await checkDashboardServices({
            localConfigPath,
            fetchImpl: healthyDashboardFetch({
                'https://arraybox.dev/config.js': () => { throw new TypeError('fetch failed'); }
            })
        });

        assert.equal(result.apl.status, 'down');
        assert.equal(result.apl.localStatus, 'up');
        assert.match(result.apl.detail, /Could not read the published config.js/);
    });
});

test('dashboard times out an unresponsive public APL route', async () => {
    await withLocalConfig(BACKEND_URL, async (localConfigPath) => {
        const result = await checkDashboardServices({
            localConfigPath,
            timeoutMs: 20,
            fetchImpl: healthyDashboardFetch({
                [`${BACKEND_URL}/api/apl/health`]: ({ signal }) => new Promise((resolve, reject) => {
                    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
                })
            })
        });

        assert.equal(result.apl.status, 'down');
        assert.match(result.apl.detail, /Public APL health check failed: timed out after 20ms/);
    });
});

test('dashboard still marks APL down if its local server fails', async () => {
    await withLocalConfig(BACKEND_URL, async (localConfigPath) => {
        const result = await checkDashboardServices({
            localConfigPath,
            fetchImpl: healthyDashboardFetch({
                'http://127.0.0.1:8081/health': () => response('unavailable', 503)
            })
        });

        assert.equal(result.apl.status, 'down');
        assert.equal(result.apl.localStatus, 'down');
        assert.equal(result.apl.publicStatus, 'up');
        assert.match(result.apl.detail, /Local health check failed: HTTP 503/);
    });
});
