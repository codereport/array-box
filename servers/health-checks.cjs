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

function publicFailure(detail) {
    return {
        apl: status('APL', false, detail),
        site: status('Site', false, detail)
    };
}

async function checkPublishedServices({
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
        return publicFailure(`Could not read local config.js: ${error.message}`);
    }

    if (!expectedBackendUrl) {
        return publicFailure('Local config.js has no production BACKEND_URL');
    }

    let deployedBackendUrl;
    try {
        const deployedConfig = await fetchText(publicConfigUrl, { fetchImpl, timeoutMs });
        deployedBackendUrl = normalizeBackendUrl(extractBackendUrl(deployedConfig));
    } catch (error) {
        return publicFailure(`Could not read the published config.js: ${error.message}`);
    }

    if (deployedBackendUrl !== expectedBackendUrl) {
        return publicFailure(
            `Published config.js is stale (published: ${deployedBackendUrl || 'null'}, local: ${expectedBackendUrl})`
        );
    }

    const [aplResult, metricsResult] = await Promise.allSettled([
        checkJsonHealth(`${deployedBackendUrl}/api/apl/health`, { fetchImpl, timeoutMs }),
        checkJsonHealth(`${deployedBackendUrl}/api/log/health`, { fetchImpl, timeoutMs })
    ]);
    const failures = [];
    if (aplResult.status === 'rejected') failures.push(`APL: ${aplResult.reason.message}`);
    if (metricsResult.status === 'rejected') failures.push(`metrics: ${metricsResult.reason.message}`);

    return {
        apl: status('APL', aplResult.status === 'fulfilled', aplResult.status === 'fulfilled'
            ? 'Public APL health check passed'
            : `Public APL health check failed: ${aplResult.reason.message}`),
        site: status('Site', failures.length === 0, failures.length === 0
            ? 'Published config, APL, and metrics routes are healthy'
            : `Public backend route failed: ${failures.join('; ')}`)
    };
}

async function checkPublicBackend(options = {}) {
    const { site } = await checkPublishedServices(options);
    return site;
}

async function checkDashboardServices(options = {}) {
    const shared = {
        fetchImpl: options.fetchImpl,
        timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS
    };

    const [localApl, permalink, published] = await Promise.all([
        checkLocalService({ name: 'APL', port: 8081, ...shared }),
        checkLocalService({ name: 'Permalink', port: 8084, ...shared }),
        checkPublishedServices({
            publicConfigUrl: options.publicConfigUrl,
            localConfigPath: options.localConfigPath,
            ...shared
        })
    ]);

    const apl = {
        ...localApl,
        status: localApl.status === 'up' && published.apl.status === 'up' ? 'up' : 'down',
        detail: `${localApl.detail}; ${published.apl.detail}`,
        localStatus: localApl.status,
        publicStatus: published.apl.status
    };

    return { apl, permalink, site: published.site };
}

module.exports = {
    checkDashboardServices,
    checkJsonHealth,
    checkLocalService,
    checkPublicBackend,
    extractBackendUrl,
    normalizeBackendUrl
};
