const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT_MS = 4000;
const DEFAULT_PUBLIC_CONFIG_URL = 'https://arraybox.dev/config.js';
const DEFAULT_LOCAL_CONFIG_PATH = path.join(__dirname, '..', 'config.js');

function extractBackendUrl(configSource) {
    // Match the first real BACKEND_URL assignment. In config.js that appears
    // before the commented examples, so those examples cannot mask a null value.
    const match = configSource.match(/\bBACKEND_URL\s*:\s*(null|(['"`])([^'"`\r\n]*)\2)/);
    if (!match) {
        throw new Error('BACKEND_URL was not found');
    }
    return match[1] === 'null' ? null : match[3];
}

function normalizeBackendUrl(backendUrl) {
    if (!backendUrl) return null;
    return backendUrl.replace(/\/+$/, '');
}

async function fetchText(targetUrl, { fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetchImpl(targetUrl, {
            headers: {
                'Accept': 'application/json, text/javascript, text/plain;q=0.9',
                'Cache-Control': 'no-cache'
            },
            redirect: 'follow',
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        if (error && error.name === 'AbortError') {
            throw new Error(`timed out after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function checkJsonHealth(targetUrl, options = {}) {
    const body = await fetchText(targetUrl, options);
    let data;
    try {
        data = JSON.parse(body);
    } catch {
        throw new Error('health endpoint returned invalid JSON');
    }

    if (data.status !== 'ok') {
        throw new Error(`health endpoint reported ${data.status || 'an unknown status'}`);
    }
}

function status(name, isUp, detail, extra = {}) {
    return {
        name,
        status: isUp ? 'up' : 'down',
        detail,
        ...extra
    };
}

async function checkLocalService({ name, port, path: healthPath = '/health', fetchImpl, timeoutMs }) {
    try {
        await checkJsonHealth(`http://127.0.0.1:${port}${healthPath}`, { fetchImpl, timeoutMs });
        return status(name, true, 'Local health check passed', { port });
    } catch (error) {
        return status(name, false, `Local health check failed: ${error.message}`, { port });
    }
}

async function checkPublicBackend({
    publicConfigUrl = DEFAULT_PUBLIC_CONFIG_URL,
    localConfigPath = DEFAULT_LOCAL_CONFIG_PATH,
    fetchImpl,
    timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
    let expectedBackendUrl;
    try {
        expectedBackendUrl = normalizeBackendUrl(
            extractBackendUrl(fs.readFileSync(localConfigPath, 'utf8'))
        );
    } catch (error) {
        return status('Site', false, `Could not read local config.js: ${error.message}`);
    }

    if (!expectedBackendUrl) {
        return status('Site', false, 'Local config.js has no production BACKEND_URL');
    }

    let deployedBackendUrl;
    try {
        const deployedConfig = await fetchText(publicConfigUrl, { fetchImpl, timeoutMs });
        deployedBackendUrl = normalizeBackendUrl(extractBackendUrl(deployedConfig));
    } catch (error) {
        return status('Site', false, `Could not read the published config.js: ${error.message}`);
    }

    if (deployedBackendUrl !== expectedBackendUrl) {
        return status(
            'Site',
            false,
            `Published config.js is stale (published: ${deployedBackendUrl || 'null'}, local: ${expectedBackendUrl})`
        );
    }

    try {
        await Promise.all([
            checkJsonHealth(`${deployedBackendUrl}/api/apl/health`, { fetchImpl, timeoutMs })
                .catch((error) => { throw new Error(`APL: ${error.message}`); }),
            checkJsonHealth(`${deployedBackendUrl}/api/log/health`, { fetchImpl, timeoutMs })
                .catch((error) => { throw new Error(`metrics: ${error.message}`); })
        ]);
        return status('Site', true, 'Published config, APL, and metrics routes are healthy');
    } catch (error) {
        return status('Site', false, `Public backend route failed: ${error.message}`);
    }
}

async function checkDashboardServices(options = {}) {
    const shared = {
        fetchImpl: options.fetchImpl,
        timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS
    };

    const [apl, permalink, site] = await Promise.all([
        checkLocalService({ name: 'APL', port: 8081, ...shared }),
        checkLocalService({ name: 'Permalink', port: 8084, ...shared }),
        checkPublicBackend({
            publicConfigUrl: options.publicConfigUrl,
            localConfigPath: options.localConfigPath,
            ...shared
        })
    ]);

    return { apl, permalink, site };
}

module.exports = {
    checkDashboardServices,
    checkJsonHealth,
    checkLocalService,
    checkPublicBackend,
    extractBackendUrl,
    normalizeBackendUrl
};
