const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
const WASI_URL = 'https://unpkg.com/@bjorn3/browser_wasi_shim@0.4.1/dist/';
const WASI_ROOT = path.dirname(require.resolve('@bjorn3/browser_wasi_shim'));
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openEditor(t) {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    t.after(() => page.close());
    // Run the bundled interpreter and real loader. Serve its pinned WASI shim
    // from node_modules so these regressions run without internet access.
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.href.startsWith(WASI_URL)) {
            return route.fulfill({ path: path.join(WASI_ROOT, url.href.slice(WASI_URL.length)) });
        }
        if (url.origin !== ORIGIN) return route.abort();
        if (url.pathname.startsWith('/wasm/') && !url.pathname.startsWith('/wasm/tinyapl/')) {
            return route.abort();
        }
        const file = url.pathname === '/' ? '/index.html' : url.pathname;
        await route.fulfill({ path: path.join(ROOT, file) }).catch(() =>
            route.fulfill({ status: 404, body: '' }));
    });
    await page.goto(`${ORIGIN}/?lang=tinyapl`);
    await page.locator('#languageButton.startup-spinning').waitFor();
    await page.keyboard.press('Space');
    await page.locator('#languageButton.startup-spinning').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => window.tinyaplWasm?.isReady());
    return page;
}

async function evaluate(page, code) {
    await page.evaluate(code => {
        const input = document.getElementById('codeInput');
        input.textContent = code;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
    }, code);
    await page.keyboard.press('Enter');
    await page.locator('#output.show').waitFor();
    assert.equal(await page.locator('#loadingIndicator.show').count(), 0);
    assert.equal(await page.locator('#codeInput').textContent(), code);
    return page.locator('#output').textContent();
}

test('issue #274: a multiline TinyAPL identity function returns its argument', async t => {
    const page = await openEditor(t);
    const code = 'F ← {\n⍵\n}\nF 10';
    assert.equal(await evaluate(page, code), '10');
    assert.equal(await evaluate(page, code.replaceAll('\n', '\r\n')), '10');
});

test('issue #274: multiline TinyAPL functions preserve stdout and the final result', async t => {
    const page = await openEditor(t);
    const code = `Rd ← {
⍵
}

⍝ The original issue calls the function several times.
t ← "zeroonetwothreeeightfivesixsevenninefour"
⎕ ← Rd "zrozerotwotwotwo"
⎕ ← Rd "sveeeinght"
⎕ ← Rd "onenineninefive"
⎕ ← Rd t
Rd "ninenineninenine"`;
    assert.equal(await evaluate(page, code),
        'zrozerotwotwotwo\nsveeeinght\nonenineninefive\nzeroonetwothreeeightfivesixsevenninefour\nninenineninenine');
});

test('multiline TinyAPL bodies retain statements, nesting, and explicit separators', async t => {
    const page = await openEditor(t);
    for (const [code, expected] of [
        ['F ← {\nx ← ⍵+1\nx×2\n}\nF 10', '22'],
        ['F ← {\nG ← {\n⍵+1\n}\nG ⍵\n}\nF 10', '11'],
        ['F ← {\nx ← ⍵+1 ⋄\nx×2\n}\nF 10', '22'],
        ['F ← {\n\n⍝ comment\n⍵\n\n}\nF 10', '10'],
        ['F ← {⍵ ⋄}\nF 10', '⟨⟩'],
        ['_Twice ← _{\n⍵ ⍶⍶ ⍵\n}\n+_Twice 10', '20'],
    ]) {
        assert.equal(await evaluate(page, code), expected, code);
    }
});

test('TinyAPL line handling preserves quoted glyphs, escapes, and inline comments', async t => {
    const page = await openEditor(t);
    for (const [code, expected] of [
        ['F ← { ⍝ opening\n⍵ ⍝ result\n⍝ } ignored\n}\nF "⍝ { }"', '⍝ { }'],
        ['"a⍘"⍝}b" ⍝ actual comment', 'a"⍝}b'],
        ["'⍝ }'", '⍝ }'],
        ['"a\nb"', 'a\nb'],
        ['F ← {\n⟃ } " ⍝\nignored ⟄ ⍵\n}\nF 10', '10'],
    ]) {
        const result = await page.evaluate(code => window.tinyaplWasm.eval(code), code);
        assert.equal(result.success, true, code);
        assert.equal(result.output, expected, code);
    }
});

test('issue #276: returning a defined TinyAPL function completes and allows further evaluation', async t => {
    const page = await openEditor(t);
    assert.equal(await evaluate(page, 'F ← {\n⍵\n}'), '{...}');
    assert.equal(await evaluate(page, 'F 10'), '10');
    assert.equal(await evaluate(page, 'F'), '{...}');
    assert.equal(await evaluate(page, 'G ← {⍵+1}'), '{...}');
    assert.equal(await evaluate(page, 'G 10'), '11');
    assert.equal(await page.locator('#output.error').count(), 0);
});

test('TinyAPL native errors are reported as failures and do not prevent the next evaluation', async t => {
    const page = await openEditor(t);
    const result = await page.evaluate(() => window.tinyaplWasm.eval('Missing'));
    assert.equal(result.success, false);
    assert.match(result.output, /error/i);
    await evaluate(page, 'F ← {\n⍵\n}\nF 10');
    assert.equal(await page.locator('#output.error').count(), 0);
});
