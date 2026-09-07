#!/usr/bin/env node
/**
 * NARS2000 evaluation bridge.
 *
 * NARS2000 is a native Windows application and does not expose a portable
 * stdin evaluator. This server deliberately separates the HTTP surface from
 * the platform adapter. Configure either:
 *
 *   NARS2000_RUNNER=/absolute/path/to/runner
 *   NARS2000_RUNNER_ARGS='["optional", "arguments"]'
 *
 * The runner receives one UTF-8 JSON request on stdin and must write one JSON
 * response to stdout. See docs/nars2000-integration.md.
 *
 * Or forward to an existing compatible bridge:
 *
 *   NARS2000_UPSTREAM_URL=https://host.example/api/nars2000
 */

const http = require('http');
const { spawn } = require('child_process');

const DEFAULT_PORT = 8086;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024;
const DEFAULT_MAX_CONCURRENCY = 2;

function positiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseRunnerArgs(value) {
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((arg) => typeof arg !== 'string')) {
        throw new Error('NARS2000_RUNNER_ARGS must be a JSON array of strings');
    }
    return parsed;
}

function createConfig(env = process.env) {
    const config = {
        runner: env.NARS2000_RUNNER || null,
        runnerArgs: [],
        upstreamUrl: env.NARS2000_UPSTREAM_URL || null,
        timeoutMs: positiveInteger(env.NARS2000_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
        maxBodyBytes: positiveInteger(env.NARS2000_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES),
        maxOutputBytes: positiveInteger(env.NARS2000_MAX_OUTPUT_BYTES, DEFAULT_MAX_OUTPUT_BYTES),
        maxConcurrency: positiveInteger(env.NARS2000_MAX_CONCURRENCY, DEFAULT_MAX_CONCURRENCY),
        configurationError: null
    };

    try {
        config.runnerArgs = parseRunnerArgs(env.NARS2000_RUNNER_ARGS);
    } catch (error) {
        config.configurationError = error.message;
    }

    if (config.runner && config.upstreamUrl) {
        config.configurationError = 'Configure only one of NARS2000_RUNNER or NARS2000_UPSTREAM_URL';
    }

    if (config.upstreamUrl) {
        try {
            const url = new URL(config.upstreamUrl);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new Error('unsupported protocol');
            }
        } catch (_) {
            config.configurationError = 'NARS2000_UPSTREAM_URL must be an HTTP(S) URL';
        }
    }

    return config;
}

function getMode(config) {
    if (config.configurationError) return 'invalid';
    if (config.runner) return 'runner';
    if (config.upstreamUrl) return 'upstream';
    return 'unconfigured';
}

function validateResult(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('adapter response must be a JSON object');
    }
    if (typeof value.success !== 'boolean') {
        throw new Error('adapter response must contain a boolean success field');
    }
    if (typeof value.output !== 'string') {
        throw new Error('adapter response must contain a string output field');
    }
    return { success: value.success, output: value.output };
}

function evaluateWithRunner(code, config, spawnImpl = spawn) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let stdout = Buffer.alloc(0);
        let stderr = Buffer.alloc(0);
        let outputBytes = 0;
        let child;
        let timer = null;

        const finish = (error, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) reject(error);
            else resolve(value);
        };

        try {
            // Never invoke a shell: code is transferred only through stdin.
            child = spawnImpl(config.runner, config.runnerArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
                shell: false
            });
        } catch (error) {
            reject(error);
            return;
        }

        timer = setTimeout(() => {
            child.kill('SIGKILL');
            finish(new Error(`NARS2000 runner timed out after ${config.timeoutMs}ms`));
        }, config.timeoutMs);

        const append = (current, chunk) => {
            outputBytes += chunk.length;
            if (outputBytes > config.maxOutputBytes) {
                child.kill('SIGKILL');
                finish(new Error(`NARS2000 runner output exceeded ${config.maxOutputBytes} bytes`));
                return current;
            }
            return Buffer.concat([current, chunk]);
        };

        child.stdout.on('data', (chunk) => { stdout = append(stdout, chunk); });
        child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk); });
        child.on('error', (error) => finish(error));
        child.on('close', (exitCode) => {
            if (settled) return;
            const text = stdout.toString('utf8').trim();
            if (!text) {
                const detail = stderr.toString('utf8').trim();
                finish(new Error(detail || `NARS2000 runner exited with code ${exitCode}`));
                return;
            }
            try {
                finish(null, validateResult(JSON.parse(text)));
            } catch (error) {
                finish(new Error(`Invalid NARS2000 runner response: ${error.message}`));
            }
        });

        child.stdin.on('error', (error) => finish(error));
        child.stdin.end(JSON.stringify({ protocolVersion: 1, code }), 'utf8');
    });
}

async function evaluateWithUpstream(code, config, fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('This Node.js version does not provide fetch for NARS2000 upstream mode');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
        const base = config.upstreamUrl.endsWith('/') ? config.upstreamUrl : `${config.upstreamUrl}/`;
        const response = await fetchImpl(new URL('eval', base), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
            signal: controller.signal
        });
        const body = await response.text();
        if (Buffer.byteLength(body) > config.maxOutputBytes) {
            throw new Error(`NARS2000 upstream output exceeded ${config.maxOutputBytes} bytes`);
        }
        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch (_) {
            throw new Error(`NARS2000 upstream returned non-JSON (${response.status})`);
        }
        if (!response.ok) {
            throw new Error(parsed.output || parsed.error || `NARS2000 upstream returned ${response.status}`);
        }
        return validateResult(parsed);
    } finally {
        clearTimeout(timer);
    }
}

function readJsonBody(req, maxBytes) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let bytes = 0;
        let tooLarge = false;
        req.on('data', (chunk) => {
            bytes += chunk.length;
            if (bytes > maxBytes) {
                tooLarge = true;
                return;
            }
            chunks.push(chunk);
        });
        req.on('error', reject);
        req.on('end', () => {
            if (tooLarge) {
                const error = new Error(`Request body exceeds ${maxBytes} bytes`);
                error.statusCode = 413;
                reject(error);
                return;
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch (_) {
                const error = new Error('Request body must be valid JSON');
                error.statusCode = 400;
                reject(error);
            }
        });
    });
}

function sendJson(res, statusCode, body) {
    const payload = JSON.stringify(body);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
    });
    res.end(payload);
}

function createNars2000Server(options = {}) {
    const config = options.config || createConfig(options.env);
    const spawnImpl = options.spawnImpl || spawn;
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    let activeRequests = 0;

    const server = http.createServer(async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.method === 'GET' && req.url === '/health') {
            const mode = getMode(config);
            sendJson(res, 200, {
                status: mode === 'runner' || mode === 'upstream' ? 'ok' : 'degraded',
                ready: mode === 'runner' || mode === 'upstream',
                mode,
                activeRequests,
                maxConcurrency: config.maxConcurrency,
                error: config.configurationError
            });
            return;
        }

        if (req.method !== 'POST' || req.url !== '/eval') {
            sendJson(res, 404, { success: false, error: 'Not found' });
            return;
        }

        const mode = getMode(config);
        if (mode === 'invalid') {
            sendJson(res, 503, { success: false, output: `NARS2000 bridge configuration error: ${config.configurationError}` });
            return;
        }
        if (mode === 'unconfigured') {
            sendJson(res, 503, {
                success: false,
                output: 'NARS2000 runner is not configured. Set NARS2000_RUNNER or NARS2000_UPSTREAM_URL; see docs/nars2000-integration.md.'
            });
            return;
        }
        if (activeRequests >= config.maxConcurrency) {
            sendJson(res, 429, { success: false, output: 'NARS2000 runner is busy. Try again shortly.' });
            return;
        }

        let body;
        try {
            body = await readJsonBody(req, config.maxBodyBytes);
        } catch (error) {
            sendJson(res, error.statusCode || 400, { success: false, error: error.message });
            return;
        }

        if (!body || typeof body.code !== 'string' || body.code.trim() === '') {
            sendJson(res, 400, { success: false, error: 'code must be a non-empty string' });
            return;
        }

        activeRequests++;
        try {
            const result = mode === 'runner'
                ? await evaluateWithRunner(body.code, config, spawnImpl)
                : await evaluateWithUpstream(body.code, config, fetchImpl);
            sendJson(res, 200, result);
        } catch (error) {
            const message = error.name === 'AbortError'
                ? `NARS2000 bridge timed out after ${config.timeoutMs}ms`
                : error.message || String(error);
            sendJson(res, 502, { success: false, output: message });
        } finally {
            activeRequests--;
        }
    });

    return { server, config };
}

function startFromCli() {
    const port = positiveInteger(process.argv[2], DEFAULT_PORT);
    const { server, config } = createNars2000Server();
    server.listen(port, '0.0.0.0', () => {
        const mode = getMode(config);
        console.log(`NARS2000 server running on http://localhost:${port}`);
        console.log(`NARS2000 adapter mode: ${mode}`);
    });
    return server;
}

if (require.main === module) {
    startFromCli();
}

module.exports = {
    createConfig,
    createNars2000Server,
    evaluateWithRunner,
    evaluateWithUpstream,
    getMode,
    parseRunnerArgs,
    validateResult,
    startFromCli
};
