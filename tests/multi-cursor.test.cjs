const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openEditor(t, language = 'apl') {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    t.after(() => page.close());
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== ORIGIN || url.pathname.startsWith('/wasm/')) return route.abort();
        const file = url.pathname === '/' ? '/index.html' : url.pathname;
        await route.fulfill({ path: path.join(ROOT, file) }).catch(() =>
            route.fulfill({ status: 404, body: '' }));
    });
    await page.goto(`${ORIGIN}/?lang=${language}`);
    await page.locator('#languageButton.startup-spinning').waitFor();
    await page.keyboard.press('Space');
    await page.locator('#languageButton.startup-spinning').waitFor({ state: 'hidden' });
    await page.waitForFunction(lang => document.getElementById('codeInput').classList.contains(lang), language);
    return page;
}

async function setCode(page, text, offset) {
    await page.evaluate(async ({ text, offset }) => {
        const { highlightCode } = await import('/src/syntax.js');
        const input = document.getElementById('codeInput');
        input.dispatchEvent(new Event('pointerdown'));
        input.innerHTML = highlightCode(text, input.classList[1]);
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
        window.getSelection().setPosition(input, input.childNodes.length);
    }, { text, offset });
}

async function expectText(page, text) {
    assert.equal(await page.locator('#codeInput').textContent(), text);
}

test('typing and word selection edit every cursor and survive highlighting', async t => {
    const page = await openEditor(t);
    await setCode(page, 'one plus\ntwo plus\nsix plus', 4);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Control+Shift+ArrowDown');
    assert.equal(await page.locator('.multi-cursor-caret').count(), 3);
    await page.keyboard.type('X');
    await expectText(page, 'one Xplus\ntwo Xplus\nsix Xplus');
    await page.waitForTimeout(100); // The app debounces syntax highlighting by 50ms.
    await page.keyboard.press('Control+Shift+ArrowRight');
    assert.equal(await page.locator('.multi-cursor-selection').count(), 3);
    await page.keyboard.type('end');
    await expectText(page, 'one Xend\ntwo Xend\nsix Xend');
    await page.keyboard.press('Control+ArrowLeft');
    await page.keyboard.press('Control+Shift+ArrowRight');
    await page.keyboard.press('Backspace');
    await expectText(page, 'one \ntwo \nsix ');
});

test('short and empty lines retain the requested column without duplicate cursors', async t => {
    const page = await openEditor(t);
    await setCode(page, 'abcdef\nx\n\nabcdef', 5);
    for (let i = 0; i < 5; i++) await page.keyboard.press('Control+Shift+ArrowDown');
    assert.equal(await page.locator('.multi-cursor-caret').count(), 4);
    await page.keyboard.type(':');
    await expectText(page, 'abcde:f\nx:\n:\nabcde:f');
    await page.keyboard.press('Backspace');
    await expectText(page, 'abcdef\nx\n\nabcdef');
});

test('adding cursors above and replacing backwards selections supports BQN surrogate pairs', async t => {
    const page = await openEditor(t, 'bqn');
    const text = '𝕩+𝕩\n𝕩+𝕩\n𝕩+𝕩';
    await setCode(page, text, text.length);
    await page.keyboard.press('Control+Shift+ArrowUp');
    await page.keyboard.press('Control+Shift+ArrowUp');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.type('0');
    await expectText(page, '𝕩+0\n𝕩+0\n𝕩+0');
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');
    await expectText(page, '+0\n+0\n+0');
});

test('prefix glyphs, paste, undo, and redo apply to all selections', async t => {
    const page = await openEditor(t);
    await setCode(page, 'a\nb', 1);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Backquote');
    await page.keyboard.press('i');
    await expectText(page, 'a⍳\nb⍳');
    await page.evaluate(() => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', '<x>');
        document.getElementById('codeInput').dispatchEvent(new ClipboardEvent('paste', {
            clipboardData, bubbles: true, cancelable: true
        }));
    });
    await expectText(page, 'a⍳<x>\nb⍳<x>');
    await page.keyboard.press('Control+z');
    await expectText(page, 'a⍳\nb⍳');
    await page.keyboard.press('Control+Shift+z');
    await expectText(page, 'a⍳<x>\nb⍳<x>');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    await expectText(page, 'a\nb');
    await page.keyboard.press('Control+y');
    await expectText(page, 'a⍳\nb⍳');
});

test('Escape and a mouse click return to a single cursor', async t => {
    const page = await openEditor(t);
    await setCode(page, 'abc\nabc', 1);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.multi-cursor-caret').count(), 0);
    await page.keyboard.type('X');
    await expectText(page, 'aXbc\nabc');
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.locator('#codeInput').click();
    assert.equal(await page.locator('.multi-cursor-caret').count(), 0);
});

test('multi-cursor newlines, deletion undo, and merged selections preserve text', async t => {
    const page = await openEditor(t);
    await setCode(page, 'abc\nabc', 3);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Control+Backspace');
    await expectText(page, '\n');
    await page.keyboard.press('Control+z');
    await expectText(page, 'abc\nabc');
    assert.equal(await page.evaluate(() => window.getSelection().isCollapsed), true);
    await page.keyboard.press('Shift+Enter');
    await expectText(page, 'abc\n\nabc\n');
    assert.equal(await page.locator('.multi-cursor-caret').count(), 2);
    await page.keyboard.type('x');
    await expectText(page, 'abc\nx\nabc\nx');

    await setCode(page, 'abc\ndef', 1);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Control+Shift+Home');
    await page.keyboard.type('X');
    await expectText(page, 'Xef'); // Intersecting selections replace their union once.
});

test('input history uses Alt+arrows and leaves unsaved code intact', async t => {
    const page = await openEditor(t);
    await page.route('**/eval', route => route.fulfill({ json: { success: true, output: '1' } }));
    await setCode(page, '1+1', 3);
    await page.keyboard.press('Enter');
    await page.locator('#output.show').waitFor();
    await setCode(page, 'draft\ndraft', 2);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.type('X');
    await expectText(page, 'drXaft\ndrXaft');
    await page.keyboard.press('Alt+ArrowUp');
    await expectText(page, '1+1');
    assert.equal(await page.locator('.multi-cursor-caret').count(), 0);
    await page.keyboard.press('Alt+ArrowDown');
    await expectText(page, 'drXaft\ndrXaft');
});

test('a cursor can be added immediately after inserting a native newline', async t => {
    const page = await openEditor(t);
    await setCode(page, 'abcd', 2);
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Control+Shift+ArrowUp');
    await page.keyboard.type('X');
    await expectText(page, 'Xab\nXcd');
});

test('selection appearance uses solid touching red bands, white text, and identical carets', async t => {
    const page = await openEditor(t);
    const text = 'Da 18 5 7 11\nDa 6 12 18 24\nDa 3 9 15 21';
    await setCode(page, text, 0);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Shift+End');
    await page.evaluate(() => document.fonts.ready);
    const appearance = await page.evaluate(() => {
        const input = document.getElementById('codeInput');
        function boxes(selector) {
            return [...document.querySelectorAll(selector)].map(element => {
                const box = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return { top: box.top, bottom: box.bottom, width: box.width, height: box.height, background: style.backgroundColor };
            });
        }
        return {
            bands: boxes('.multi-cursor-selection'),
            carets: boxes('.multi-cursor-caret'),
            lineHeight: parseFloat(getComputedStyle(input).lineHeight),
            nativeCaret: getComputedStyle(input).caretColor,
            nativeBackground: getComputedStyle(input, '::selection').backgroundColor,
            textColors: [input, ...input.querySelectorAll('span')].map(element =>
                getComputedStyle(element, '::highlight(arraybox-multi-selection)').color),
            highlightedText: [...CSS.highlights.get('arraybox-multi-selection')].map(range => range.toString())
        };
    });
    assert.equal(appearance.bands.length, 3); // Multiple syntax spans share one band.
    assert.equal(appearance.carets.length, 3); // Includes the primary cursor.
    for (const [i, band] of appearance.bands.entries()) {
        assert.equal(band.background, 'rgb(255, 85, 85)');
        assert.equal(band.height, appearance.lineHeight);
        if (i > 0) assert.equal(band.top, appearance.bands[i - 1].bottom);
    }
    for (const caret of appearance.carets) {
        assert.equal(caret.width, 2);
        assert.equal(caret.height, appearance.lineHeight);
    }
    assert.equal(appearance.nativeCaret, 'rgba(0, 0, 0, 0)');
    assert.equal(appearance.nativeBackground, 'rgba(0, 0, 0, 0)');
    assert.ok(appearance.textColors.every(color => color === 'rgb(255, 255, 255)'));
    assert.deepEqual(appearance.highlightedText, text.split('\n'));
    await expectText(page, text);
    if (process.env.ARRAYBOX_MULTI_CURSOR_SCREENSHOT) {
        await page.locator('#codeInput').screenshot({ path: process.env.ARRAYBOX_MULTI_CURSOR_SCREENSHOT });
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.multi-cursor-active').count(), 0);
    assert.equal(await page.evaluate(() => CSS.highlights.get('arraybox-multi-selection').size), 0);
});

test('deleting at multiple cursors leaves no undeletable trailing line', async t => {
    const page = await openEditor(t);
    await setCode(page, 'Da 18\nDa 18\nDa 18', 5);
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Control+Shift+ArrowDown');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Backspace');
    await expectText(page, 'Da 18\nDa 18\nDa 18');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+End');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await expectText(page, 'Da 18\nDa 18\nDa 18');
    const remaining = await page.evaluate(() => {
        const input = document.getElementById('codeInput');
        return { text: input.innerText, after: getComputedStyle(input, '::after').content };
    });
    assert.equal(remaining.text, 'Da 18\nDa 18\nDa 18');
    assert.equal(remaining.after, 'none');
});
