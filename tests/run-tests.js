#!/usr/bin/env node
/**
 * Primitive rank test runner.
 *
 * Derives expressions from primitiveMap + standard inputs, then
 * evaluates in each language via Playwright (headless browser).
 *
 * Usage:  node tests/run-tests.js
 *         npm test
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { tests, inputs } from './primitive-tests.js';
import { primitiveMap, getEquivalent } from '../src/primitive-compare.js';
import { syntaxRules } from '../src/syntax.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 9753;
const APL_URL = 'http://localhost:8081';
const RUNTIME_TIMEOUT = 60_000;
const ALL_LANGS = ['tinyapl', 'apl', 'kap', 'bqn', 'j', 'uiua'];

const rgb = (r, g, b) => s => `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m`;
const c = {
    green:  s => `\x1b[32m${s}\x1b[0m`,
    red:    s => `\x1b[31m${s}\x1b[0m`,
    yellow: s => `\x1b[33m${s}\x1b[0m`,
    cyan:   s => `\x1b[36m${s}\x1b[0m`,
    dim:    s => `\x1b[2m${s}\x1b[0m`,
    bold:   s => `\x1b[1m${s}\x1b[0m`,
    // Dracula syntax colors
    fn:     rgb(139, 233, 253),  // #8BE9FD cyan — functions
    mod1:   rgb(80, 250, 123),   // #50FA7B green — 1-modifiers
    mod2:   rgb(241, 250, 140),  // #F1FA8C yellow — 2-modifiers
    num:    rgb(189, 147, 249),  // #BD93F9 purple — numbers
    str:    rgb(241, 250, 140),  // #F1FA8C yellow — strings
};

function colorGlyph(glyph) {
    const apl = syntaxRules.apl;
    for (const ch of glyph) {
        if (apl.monadic.includes(ch)) return c.mod1(glyph);
        if (apl.dyadic.includes(ch)) return c.mod2(glyph);
    }
    return c.fn(glyph);
}

// ── name → primitiveMap index ────────────────────────

const nameIndex = {};
for (const [glyph, entry] of Object.entries(primitiveMap)) {
    if (entry.monad?.name) {
        nameIndex[entry.monad.name] = { glyph, valence: 'monad', entry };
    }
    if (entry.dyad?.name) {
        nameIndex[entry.dyad.name] = { glyph, valence: 'dyad', entry };
    }
}

// ── input formatting ─────────────────────────────────

const SIMPLE_NUMS = /^[\d\s.¯]+$/;

function formatInputForLang(str, lang) {
    if (lang === 'bqn' && SIMPLE_NUMS.test(str) && str.includes(' ')) {
        return str.trim().replace(/\s+/g, '‿');
    }
    if (lang === 'uiua' && SIMPLE_NUMS.test(str) && str.includes(' ')) {
        return '[' + str.trim() + ']';
    }
    if (lang === 'tinyapl' && str.includes(' ')) {
        return null;
    }
    return str;
}

function getInputForLang(rank, lang) {
    const rankInputs = inputs[rank];
    if (!rankInputs) return null;
    if (lang in rankInputs) return rankInputs[lang];
    return rankInputs.default ?? null;
}

function buildExpression(glyph, valence, inputStr, lang) {
    if (valence === 'monad') {
        return '(' + glyph + ')' + inputStr;
    }
    const [left, right] = inputStr;
    if (lang === 'uiua') return glyph + ' ' + right + ' ' + left;
    return left + '(' + glyph + ')' + right;
}

const DEPTH_GLYPH = { tinyapl: '≡', apl: '≡', kap: '≡', j: '1+L.', bqn: '≡', uiua: null };

function buildDepthExpression(mainExpr, lang) {
    const dg = DEPTH_GLYPH[lang];
    if (!dg) return null;
    return dg + '(' + mainExpr + ')';
}

// ── static server ────────────────────────────────────

const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
    '.ttf': 'font/ttf', '.kap': 'text/plain',
};

function startStaticServer() {
    return new Promise((res) => {
        const server = createServer((req, rsp) => {
            const url = new URL(req.url, `http://localhost:${PORT}`);
            let filePath = resolve(ROOT, '.' + url.pathname);
            if (url.pathname === '/') filePath = resolve(ROOT, 'index.html');
            if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
                rsp.writeHead(404); rsp.end(); return;
            }
            const stat = readFileSync(filePath);
            const ext = extname(filePath);
            rsp.writeHead(200, {
                'Content-Type': MIME[ext] || 'application/octet-stream',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            });
            rsp.end(stat);
        });
        server.listen(PORT, () => res(server));
    });
}

async function checkAplServer() {
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch(`${APL_URL}/eval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: '1' }),
            signal: ctrl.signal,
        }).catch(() => null);
        clearTimeout(timer);
        return r && r.ok;
    } catch { return false; }
}

// ── output normalization ─────────────────────────────

function normalizeOutput(s) {
    if (s == null) return '';
    s = s.trim();
    // BQN unit array: ┌· · VALUE ┘ (strip outer box first)
    s = s.replace(/^┌[·\s]*·\s*/g, '').replace(/\s*┘$/g, '').trim();
    // Box display (TinyAPL, Kap, APL): strip box-drawing lines,
    // extract content from between │ or | delimiters
    const BOX = /[┌┐└┘─│┬┴→←~|⊂⊃∊]/;
    if (BOX.test(s)) {
        const BOX_LINE = /^[┌┐└┘─│┬┴→←~|⊂⊃∊\s]+$/;
        const lines = s.split('\n').map(l => l.trim())
            .filter(l => !BOX_LINE.test(l))
            .map(l => {
                l = l.replace(/^[│|]\s*/, '').replace(/\s*[│|]$/, '');
                l = l.replace(/[│|]/g, ' ');
                return l;
            });
        s = lines.join('\n').trim();
    }
    // BQN list brackets (after box stripping to catch inner ⟨⟩)
    s = s.replace(/^[⟨‹]\s*/, '').replace(/\s*[⟩›]$/, '').trim();
    // Uiua box markers and square brackets
    s = s.replace(/^□+/, '').trim();
    if (s.startsWith('[') && s.endsWith(']') && !s.includes('\n')) s = s.slice(1, -1).trim();
    return s.replace(/\s+/g, ' ');
}

// ── language eval dispatch ───────────────────────────

const LANG_EVAL = {
    bqn:     (code) => window.cbqnWasm.eval(code),
    uiua:    (code) => window.uiuaWasm.eval(code),
    j:       (code) => window.jWasm.eval(code),
    kap:     (code) => window.kapJs.eval(code),
    tinyapl: (code) => window.tinyaplWasm.eval(code),
    apl:     async (code) => {
        const r = await fetch('http://localhost:8081/eval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const d = await r.json();
        return { success: d.success !== false, output: d.output || d.result || d.error || '' };
    },
};

const LANG_READY = {
    bqn:     'window.cbqnWasm && window.cbqnWasm.isReady()',
    uiua:    'window.uiuaWasm && window.uiuaWasm.isReady()',
    j:       'window.jWasm && window.jWasm.isReady()',
    kap:     'window.kapJs && window.kapJs.isReady()',
    tinyapl: 'window.tinyaplWasm && window.tinyaplWasm.isReady()',
};

async function waitForRuntimes(page, langs) {
    const start = Date.now();
    const pending = new Set(langs);
    while (pending.size > 0 && Date.now() - start < RUNTIME_TIMEOUT) {
        for (const lang of [...pending]) {
            const check = LANG_READY[lang];
            if (!check) { pending.delete(lang); continue; }
            const ready = await page.evaluate(check).catch(() => false);
            if (ready) pending.delete(lang);
        }
        if (pending.size > 0) await new Promise(r => setTimeout(r, 500));
    }
    return pending;
}

async function evalInLang(page, lang, code) {
    const fn = LANG_EVAL[lang];
    if (!fn) throw new Error(`No eval for ${lang}`);
    return page.evaluate(fn, code);
}

// ── main ─────────────────────────────────────────────

const server = await startStaticServer();
console.log(`Static server on http://localhost:${PORT}`);

const aplAvailable = await checkAplServer();
console.log(`APL server: ${aplAvailable ? c.green('available') : c.yellow('not reachable (APL tests will be skipped)')}`);

const activeLangs = new Set(ALL_LANGS);
if (!aplAvailable) activeLangs.delete('apl');

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('pageerror', (err) => console.error('  PAGE ERROR:', err.message));

console.log('Loading ArrayBox...');
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });

const wasmLangs = [...activeLangs].filter(l => l !== 'apl');
console.log(`Waiting for runtimes: ${wasmLangs.join(', ')}...`);
const notReady = await waitForRuntimes(page, wasmLangs);
if (notReady.size > 0) {
    console.error(`Timed out waiting for: ${[...notReady].join(', ')}`);
    for (const lang of notReady) activeLangs.delete(lang);
}
console.log(`${c.green('Ready:')} ${[...activeLangs].map(l => c.cyan(l)).join(', ')}\n`);

let passed = 0;
let failed = 0;
let skipped = 0;

for (const test of tests) {
    const info = nameIndex[test.name];
    if (!info) {
        console.log(`  ? ${test.name} — not found in primitiveMap`);
        skipped++;
        continue;
    }

    const { glyph, valence, entry } = info;
    const isDyadic = valence === 'dyad';
    const rankKey = test.rank;

    // Parse dyadic rank pair for input lookup
    let leftRank, rightRank;
    if (isDyadic && typeof rankKey === 'string' && rankKey.includes(',')) {
        [leftRank, rightRank] = rankKey.split(',');
    }

    const header = `${colorGlyph(glyph)} ${test.name.toLowerCase()} ${c.dim(`(${valence} rank ${rankKey})`)}`;
    const langResults = [];

    for (const lang of ALL_LANGS) {
        if (!activeLangs.has(lang)) { skipped++; continue; }

        // Check per-test overrides: null = skip, string = replacement glyph
        const override = test.overrides?.[lang];
        if (override === null) { skipped++; continue; }

        let equiv;
        if (override !== undefined) {
            equiv = override;
        } else if (lang === 'tinyapl') {
            equiv = glyph;
        } else {
            equiv = getEquivalent(entry, lang, valence, rankKey);
        }
        if (!equiv) { skipped++; continue; }

        // Build input
        let inputStr;
        if (isDyadic) {
            if (!test.input || test.input.length < 2) {
                skipped++; continue;
            }
            const left = formatInputForLang(test.input[0], lang);
            const right = formatInputForLang(test.input[1], lang);
            if (left == null || right == null) { skipped++; continue; }
            inputStr = [left, right];
        } else {
            const inp = getInputForLang(rankKey, lang);
            if (inp == null) { skipped++; continue; }
            inputStr = inp;
        }

        const expression = buildExpression(equiv, valence, inputStr, lang);

        try {
            const result = await evalInLang(page, lang, expression);
            if (!result || result.success === false) {
                langResults.push({ lang, ok: false, expr: expression, reason: `error: ${result?.output || 'no output'}` });
                failed++;
                continue;
            }

            if (test.expected == null) {
                langResults.push({ lang, ok: true });
                passed++;
                continue;
            }

            const actual = normalizeOutput(result.output);
            const expected = normalizeOutput(test.expected);
            if (actual !== expected) {

                langResults.push({ lang, ok: false, expr: expression, reason: `expected "${expected}" got "${actual}"` });
                failed++;
                continue;
            }

            if (test.expected_depth != null) {
                let depthActual;
                if (lang === 'uiua') {
                    const raw = (result.output || '').trim();
                    const boxes = raw.match(/^□*/)[0].length;
                    depthActual = String(boxes + 1);
                } else {
                    const depthExpr = buildDepthExpression(expression, lang);
                    if (!depthExpr) { langResults.push({ lang, ok: true }); passed++; continue; }
                    const depthResult = await evalInLang(page, lang, depthExpr);
                    depthActual = normalizeOutput(depthResult?.output);
                }
                if (depthActual !== String(test.expected_depth)) {
                    const depthExpr = buildDepthExpression(expression, lang) || '(counted □ prefixes)';
                    langResults.push({ lang, ok: false, expr: depthExpr, reason: `depth: expected ${test.expected_depth} got ${depthActual}` });
                    failed++;
                    continue;
                }
            }

            langResults.push({ lang, ok: true });
            passed++;
        } catch (err) {
            langResults.push({ lang, ok: false, expr: expression, reason: `exception: ${err.message}` });
            failed++;
        }
    }

    const allOk = langResults.length > 0 && langResults.every(r => r.ok);

    if (allOk) {
        const langs = langResults.map(r => c.dim(r.lang)).join(', ');
        console.log(`  ${c.green('✓')} ${c.bold(header)}  [${langs}]`);
    } else if (langResults.length === 0) {
        console.log(`  ${c.yellow('-')} ${c.dim(header)}  [all skipped]`);
    } else {
        console.log(`  ${c.red('✗')} ${c.bold(header)}`);
        for (const f of langResults.filter(r => !r.ok)) {
            console.log(`      ${c.red(f.lang)}: ${f.reason}`);
            console.log(`        ${c.dim('expr:')} ${c.dim(f.expr)}`);
        }
        for (const s of langResults.filter(r => r.ok)) {
            console.log(`      ${c.green(s.lang)}: ok`);
        }
    }
}

const summary = [
    c.green(`${passed} passed`),
    failed > 0 ? c.red(`${failed} failed`) : c.dim(`${failed} failed`),
    c.yellow(`${skipped} skipped`),
].join(c.dim(', '));
console.log(`\n  ${summary}`);

await browser.close();
server.close();
process.exit(failed > 0 ? 1 : 0);
