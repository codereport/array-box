const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

// Replace only the interpreter module; run the real loader, formatter, editor,
// and hover handlers without a network dependency on the WASI shim's CDN.
const INTERPRETER = `
let write;
export async function newContext(input, output) { write = output; return 1; }
export async function runCode(ctx, code) {
    if (code === '"code text"') return { type: 'array', shown: '⍮¨⸚⦅≠⊆⊢⦆' };
    if (code === '"earth" Ms "empty"') return { type: 'array', shown: '┌──┬──┐\\n│ar│mp│\\n└──┴──┘' };
    if (code === 'Unsupported') return { type: 'function', repr: '⦅2 ⋄ + ⋄ ⊢⦆' };
    if (code === 'EmptyTines') return { type: 'function', repr: '⦅(+)/ ⋄  ⋄ | ⋄  ⋄ (-)⌺ ⋄ (-)∘(a)⦆' };
    if (code.startsWith('⎕')) await write('<before>\\n');
    return { type: 'function', repr: '((⍮)¨)⸚(⦅≠ ⋄ ⊆ ⋄ ⊢⦆)' };
}
export async function show(value) { return value.shown ?? value.repr; }
`;

async function openEditor(t) {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    t.after(() => page.close());
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== ORIGIN) return route.abort();
        if (url.pathname === '/wasm/tinyapl/tinyapl.js') {
            return route.fulfill({ contentType: 'text/javascript', body: INTERPRETER });
        }
        if (url.pathname.startsWith('/wasm/')) return route.abort();
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
    await page.waitForFunction(() => !document.getElementById('loadingIndicator').classList.contains('show'));
}

test('TinyAPL function assignments and names render trees with hover explanations', async t => {
    const page = await openEditor(t);
    await evaluate(page, 'Ms ← ⍮¨⸚⦅≠⊆⊢⦆');
    const treeSpacing = await page.locator('#output').evaluate(output => {
        const reference = document.createElement('div');
        reference.className = 'output apl';
        reference.style.fontSize = getComputedStyle(output).fontSize;
        document.body.appendChild(reference);
        const actual = getComputedStyle(output).lineHeight;
        const expected = getComputedStyle(reference).lineHeight;
        reference.remove();
        return { actual, expected };
    });
    assert.equal(treeSpacing.actual, treeSpacing.expected, 'TinyAPL trees use Dyalog row spacing');
    assert.ok((await page.locator('#explainTreeRoot').textContent()).includes('⍮¨⸚⦅≠⊆⊢⦆'));
    assert.equal(await page.locator('#explainTreeRoot .explain-source-char[data-groups]').count(), 6);
    await page.locator('#explainTreeRoot [data-col="5"]').hover();
    await page.locator('#explainTooltip.show').waitFor();
    assert.equal(await page.locator('#explainTooltipName').textContent(), '3-train (fork)');
    assert.equal(await page.locator('#explainTreeRoot .explain-role-center').textContent(), '⊆');
    assert.ok((await page.locator('#explainTooltipPattern').textContent()).includes('x ⦅F⋄G⋄H⦆ y'));
    await evaluate(page, 'Ms');
    assert.ok((await page.locator('#explainTreeRoot').textContent()).includes('┌─┼─┐'));
});

test('TinyAPL function trees preserve stdout and leave text, arrays, and unsupported values alone', async t => {
    const page = await openEditor(t);
    await evaluate(page, '⎕ ← "<before>" ⋄ Ms');
    assert.ok((await page.locator('#output').textContent()).startsWith('<before>\n'));
    assert.equal(await page.locator('#output before').count(), 0);
    assert.equal(await page.locator('#explainTreeRoot').count(), 1);
    for (const [code, text] of [
        ['"code text"', '⍮¨⸚⦅≠⊆⊢⦆'],
        ['"earth" Ms "empty"', '┌──┬──┐\n│ar│mp│\n└──┴──┘'],
        ['Unsupported', '⦅2 ⋄ + ⋄ ⊢⦆'],
    ]) {
        await evaluate(page, code);
        assert.equal(await page.locator('#explainTreeRoot').count(), 0);
        assert.equal(await page.locator('#output').textContent(), text);
        assert.equal(await page.locator('#output').evaluate(output => output.classList.contains('train-tree')), false);
    }
});

test('TinyAPL trains display empty tines as middle dots without extra diamonds', async t => {
    const page = await openEditor(t);
    await evaluate(page, 'EmptyTines');
    assert.equal(await page.locator('#explainTreeRoot .explain-source-char').allTextContents()
        .then(chars => chars.join('')), '⦅+/·|·-⌺-∘a⦆');
    await page.locator('#explainTreeRoot [data-col="4"]').hover();
    await page.locator('#explainTooltip.show').waitFor();
    assert.equal(await page.locator('#explainTooltipName').textContent(), '2-train (atop)');
    assert.equal(await page.locator('#explainTreeRoot .explain-role-center').textContent(), '|');
});
