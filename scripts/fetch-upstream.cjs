/** Download upstream data with bounded retries and useful failure details. */
const { setTimeout: sleep } = require('node:timers/promises');

const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const maxRetryDelayMs = 120_000;

async function fetchUpstream(url, readBody, {
    timeoutMs = 60_000,
    maxAttempts = 3,
    token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
    fetchImpl = globalThis.fetch,
    sleepImpl = sleep,
    warn = console.warn,
} = {}) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let retryDelayMs = 1000 * 2 ** (attempt - 1);
        try {
            const signal = AbortSignal.timeout(timeoutMs);
            let currentUrl = new URL(url);
            let response;
            for (let redirects = 0; ; redirects++) {
                const headers = { 'User-Agent': 'array-box-upstream-sync' };
                if (currentUrl.origin === 'https://api.github.com') {
                    headers.Accept = 'application/vnd.github+json';
                    if (token) headers.Authorization = `Bearer ${token}`;
                }
                response = await fetchImpl(currentUrl.href, { headers, signal, redirect: 'manual' });
                if (!redirectStatuses.has(response.status)) break;
                await response.body?.cancel();
                const location = response.headers.get('location');
                if (!location || redirects >= 5) {
                    throw Object.assign(new Error(`Invalid or excessive redirects at ${currentUrl}`), { retryable: false });
                }
                // Rebuild headers for each destination so credentials stay on the GitHub API.
                currentUrl = new URL(location, currentUrl);
            }

            if (!response.ok) {
                const body = (await response.text()).replace(/\s+/g, ' ').trim().slice(0, 500);
                const retryAfter = response.headers.get('retry-after');
                const remaining = response.headers.get('x-ratelimit-remaining');
                const reset = response.headers.get('x-ratelimit-reset');
                const rateLimited = response.status === 429 || (response.status === 403 &&
                    (remaining === '0' || retryAfter !== null || /rate limit|abuse/i.test(body)));
                const details = [body];
                for (const name of ['retry-after', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
                    const value = response.headers.get(name);
                    if (value !== null) details.push(`${name}=${value}`);
                }
                if (retryAfter !== null) {
                    const delay = /^\d+(\.\d+)?$/.test(retryAfter)
                        ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now();
                    if (Number.isFinite(delay)) retryDelayMs = Math.max(retryDelayMs, delay);
                }
                if (remaining === '0' && reset !== null && Number.isFinite(Number(reset))) {
                    retryDelayMs = Math.max(retryDelayMs, Number(reset) * 1000 - Date.now());
                } else if (rateLimited && retryAfter === null) {
                    retryDelayMs = Math.max(retryDelayMs, 60_000 * 2 ** (attempt - 1));
                }
                throw Object.assign(new Error(`HTTP ${response.status} at ${currentUrl}: ${details.filter(Boolean).join('; ')}`), {
                    retryable: rateLimited || response.status === 408 || response.status >= 500,
                });
            }

            // Read the entire body within the attempt so interrupted downloads also retry.
            return await readBody(response);
        } catch (cause) {
            const reason = cause.name === 'TimeoutError' || cause.name === 'AbortError'
                ? `timed out after ${timeoutMs}ms` : cause.message;
            const detail = cause.cause?.code || cause.cause?.message;
            const error = new Error(`GET ${url} failed (attempt ${attempt}/${maxAttempts}): ${reason}${detail ? ` (${detail})` : ''}`, { cause });
            if (cause.retryable === false || attempt === maxAttempts) throw error;
            if (retryDelayMs > maxRetryDelayMs) {
                throw new Error(`${error.message}; required retry delay exceeds ${maxRetryDelayMs}ms`, { cause });
            }
            warn(`${error.message}; retrying in ${Math.ceil(retryDelayMs)}ms`);
            await sleepImpl(Math.ceil(retryDelayMs));
        }
    }
}

function fetchText(url, options) {
    return fetchUpstream(url, response => response.text(), options);
}

function fetchBuffer(url, options) {
    return fetchUpstream(url, async response => Buffer.from(await response.arrayBuffer()), options);
}

module.exports = { fetchText, fetchBuffer };
