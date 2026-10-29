const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openEditor(t, language) {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    t.after(() => page.close());
    // Serve the real app locally; documentation does not need interpreter runtimes.
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== ORIGIN || url.pathname.startsWith('/wasm/')) {
            await route.abort();
            return;
        }
        const file = url.pathname === '/' ? '/index.html' : url.pathname;
        await route.fulfill({ path: path.join(ROOT, file) }).catch(() =>
            route.fulfill({ status: 404, body: '' }));
    });
    await page.goto(`${ORIGIN}/?lang=${language}`);
    await page.locator('#languageButton.startup-spinning').waitFor();
    await page.keyboard.press('Space');
    await page.locator('#languageButton.startup-spinning').waitFor({ state: 'hidden' });
    await page.waitForFunction(lang =>
        document.getElementById('codeInput').classList.contains(lang), language);
    return page;
}

async function setCodeAndCaret(page, text, language, offset) {
    await page.evaluate(async ({ text, language, offset }) => {
        const { highlightCode } = await import('/src/syntax.js');
        const input = document.getElementById('codeInput');
        input.innerHTML = highlightCode(text, language);
        input.focus();
        const walker = document.createTreeWalker(input, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (offset <= node.length) {
                window.getSelection().setPosition(node, offset);
                return;
            }
            offset -= node.length;
        }
    }, { text, language, offset });
}

async function expectDocs(page, glyph) {
    await page.keyboard.press('F1');
    const tooltip = page.locator('#f1DocTooltip.show');
    await tooltip.waitFor();
    try {
        assert.equal(await tooltip.locator('.f1-doc-tooltip-glyph').textContent(), glyph);
    } finally {
        await page.keyboard.press('Escape');
    }
    assert.equal(await tooltip.count(), 0);
}

test('F1 prefers a highlighted glyph in either selection direction', async t => {
    const page = await openEditor(t, 'apl');
    const text = "F ← (⊃∘⌽+⍥⍎⊃)⎕D∘∩\nF 'Hello2Worl3d4!'";
    const start = text.indexOf('∘');

    for (const direction of ['left', 'right']) {
        await t.test(`APL glyph selected to the ${direction}`, async () => {
            await setCodeAndCaret(page, text, 'apl', start + (direction === 'left' ? 1 : 0));
            await page.keyboard.press(direction === 'left' ? 'Shift+ArrowLeft' : 'Shift+ArrowRight');
            assert.equal(await page.evaluate(() => window.getSelection().toString()), '∘');
            await expectDocs(page, '∘');
        });
    }
});

test('F1 preserves lookup at a collapsed caret and at the end of input', async t => {
    const page = await openEditor(t, 'apl');
    await setCodeAndCaret(page, '∘⌽', 'apl', 1);
    await expectDocs(page, '⌽');
    await setCodeAndCaret(page, '∘⌽', 'apl', 2);
    await expectDocs(page, '⌽');
});

test('F1 prefers selected J primitives over adjacent tokens', async t => {
    const page = await openEditor(t, 'j');
    for (const glyph of [':', 'i.', '{::']) {
        await t.test(`selected ${glyph}`, async () => {
            await setCodeAndCaret(page, `<${glyph}+`, 'j', 1 + glyph.length);
            for (let i = 0; i < glyph.length; i++) {
                await page.keyboard.press('Shift+ArrowLeft');
            }
            assert.equal(await page.evaluate(() => window.getSelection().toString()), glyph);
            await expectDocs(page, glyph);
        });
    }
});
