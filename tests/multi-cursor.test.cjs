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

async function setCode(page, text, offset, head = offset) {
    await page.evaluate(async ({ text, offset, head }) => {
        const { highlightCode } = await import('/src/syntax.js');
        const input = document.getElementById('codeInput');
        input.dispatchEvent(new Event('pointerdown'));
        input.innerHTML = highlightCode(text, input.classList[1]);
        input.focus();
        function point(position) {
            const walker = document.createTreeWalker(input, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (position <= node.length) return [node, position];
                position -= node.length;
            }
            return [input, input.childNodes.length];
        }
        window.getSelection().setBaseAndExtent(...point(offset), ...point(head));
    }, { text, offset, head });
}

async function expectText(page, text) {
    assert.equal(await page.locator('#codeInput').textContent(), text);
}

test('deleting the final character keeps a single empty input line', async t => {
    const page = await openEditor(t);
    await setCode(page, '', 0);
    await page.evaluate(() => document.fonts.ready);
    const emptyHeight = (await page.locator('#codeInput').boundingBox()).height;

    for (const [text, key, offset] of [
        ['a', 'Backspace', 1], ['+', 'Backspace', 1], ['𝕩', 'Backspace', 2],
        ['a', 'Delete', 0], ['a', 'Control+Backspace', 1],
    ]) {
        await setCode(page, text, offset);
        await page.keyboard.press(key);
        await page.waitForTimeout(100); // Wait for the debounced syntax renderer.
        const cleared = await page.locator('#codeInput').evaluate(input => ({
            text: input.innerText, html: input.innerHTML,
            height: input.getBoundingClientRect().height,
        }));
        assert.equal(cleared.text, '', JSON.stringify({ inputBefore: text, key, ...cleared }));
        assert.equal(cleared.html, '', 'the empty input shows its placeholder instead of a line break');
        assert.ok(Math.abs(cleared.height - emptyHeight) <= 1, 'clearing the input does not add a line');
        await page.keyboard.type('x');
        await page.waitForTimeout(100);
        await expectText(page, 'x');
    }
});

test('empty-input normalization preserves intentional blank lines', async t => {
    const page = await openEditor(t);
    await setCode(page, '', 0);
    for (const text of ['\n', '\n\n']) {
        await page.keyboard.press('Shift+Enter');
        await page.waitForTimeout(100);
        await expectText(page, text);
    }
    for (const text of ['\n', '']) {
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(100);
        await expectText(page, text);
    }

    for (const [text, offset, key, expected] of [
        ['a\n', 0, 'Delete', '\n'],
        ['\na', 2, 'Backspace', '\n'],
        ['a\n\n', 0, 'Delete', '\n\n'],
    ]) {
        await setCode(page, text, offset);
        // Let the real renderer install the trailing-line caret marker.
        await page.locator('#codeInput').dispatchEvent('input');
        await page.waitForTimeout(100);
        await page.keyboard.press(key);
        await page.waitForTimeout(100);
        const actual = await page.locator('#codeInput').evaluate(input => ({ text: input.textContent, html: input.innerHTML }));
        assert.equal(actual.text, expected, JSON.stringify({ inputBefore: text, key, ...actual }));
    }

    await setCode(page, 'delete all\nlines', 0, 16);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#codeInput').innerText(), '');
});

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
    // Query and measure together so a redraw cannot detach the nodes in between.
    const insertionCarets = await page.evaluate(() =>
        [...document.querySelectorAll('.multi-cursor-caret')].map(element => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        }));
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
    assert.equal(appearance.carets.length, 0);
    assert.equal(insertionCarets.length, 3); // Includes the primary cursor.
    for (const [i, band] of appearance.bands.entries()) {
        assert.equal(band.background, 'rgb(255, 85, 85)');
        assert.equal(band.height, appearance.lineHeight);
        if (i > 0) assert.equal(band.top, appearance.bands[i - 1].bottom);
    }
    for (const caret of insertionCarets) {
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
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.multi-cursor-selection').count(), 0);
    assert.equal(await page.locator('.multi-cursor-caret').count(), 3);
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

test('tapping Shift inverts the selection and highlights every exact occurrence', async t => {
    const page = await openEditor(t);
    const text = 'value+value\nvalue Value';
    await setCode(page, text, 6, 11);
    const initial = await page.locator('#codeInput').evaluate(input => ({
        background: getComputedStyle(input, '::selection').backgroundColor,
        color: getComputedStyle(input, '::selection').color
    }));
    assert.deepEqual(initial, { background: 'rgb(255, 85, 85)', color: 'rgb(255, 255, 255)' });
    await page.keyboard.press('Shift');
    const appearance = await page.evaluate(() => {
        const input = document.getElementById('codeInput');
        return {
            ranges: [...CSS.highlights.get('arraybox-multi-selection')].map(range => range.toString()),
            backgrounds: [...document.querySelectorAll('.multi-cursor-selection')].map(band =>
                getComputedStyle(band).backgroundColor),
            colors: [input, ...input.querySelectorAll('span')].map(element =>
                getComputedStyle(element, '::highlight(arraybox-multi-selection)').color),
            primaryColor: getComputedStyle(input, '::selection').color
        };
    });
    assert.deepEqual(appearance.ranges, ['value', 'value', 'value']);
    assert.deepEqual(appearance.backgrounds, Array(3).fill('rgb(255, 255, 255)'));
    assert.ok(appearance.colors.every(color => color === 'rgb(255, 85, 85)'));
    assert.equal(appearance.primaryColor, 'rgb(255, 85, 85)');
    await expectText(page, text);
    if (process.env.ARRAYBOX_OCCURRENCE_SCREENSHOT) {
        await page.locator('#codeInput').screenshot({ path: process.env.ARRAYBOX_OCCURRENCE_SCREENSHOT });
    }
    await page.keyboard.type('new');
    await page.waitForTimeout(100);
    await page.keyboard.type('Name');
    await expectText(page, 'newName+newName\nnewName Value');
    assert.equal(await page.locator('.multi-cursor-caret').count(), 3);
});

test('Backspace and Delete replace all matches and keep later typing linked', async t => {
    const page = await openEditor(t);
    for (const key of ['Backspace', 'Delete']) {
        await setCode(page, 'name:name\nname', 0, 4);
        await page.keyboard.press('Shift');
        await page.keyboard.press(key);
        await expectText(page, ':\n');
        await page.keyboard.type('x');
        await expectText(page, 'x:x\nx');
    }
});

test('paste replaces matches across syntax spans and undo/redo restores their selections', async t => {
    const page = await openEditor(t);
    const text = 'a+1 a+1\na+1';
    await setCode(page, text, 4, 7);
    await page.keyboard.press('Shift');
    await page.evaluate(() => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', '<b>\r\n𝕩');
        document.getElementById('codeInput').dispatchEvent(new ClipboardEvent('paste', {
            clipboardData, bubbles: true, cancelable: true
        }));
    });
    const replaced = '<b>\n𝕩 <b>\n𝕩\n<b>\n𝕩';
    await expectText(page, replaced);
    assert.equal(await page.locator('#codeInput b').count(), 0);
    await page.keyboard.press('Control+z');
    await expectText(page, text);
    assert.equal(await page.evaluate(() => CSS.highlights.get('arraybox-multi-selection').size), 3);
    assert.equal(await page.locator('#codeInput.occurrence-edit-active').count(), 1);
    assert.equal(await page.evaluate(() => window.getSelection().toString()), 'a+1');
    await page.keyboard.press('Control+Shift+z');
    await expectText(page, replaced);
    assert.equal(await page.locator('.multi-cursor-caret').count(), 3);
    await page.keyboard.press('Control+z');
    await page.keyboard.type('z');
    await expectText(page, 'z z\nz');
});

test('backwards matches preserve the original cursor when Escape exits editing', async t => {
    const page = await openEditor(t, 'bqn');
    await setCode(page, '𝕩+𝕩\n𝕩', 5, 3);
    await page.keyboard.press('Shift');
    assert.equal(await page.evaluate(() => CSS.highlights.get('arraybox-multi-selection').size), 3);
    await page.keyboard.type('𝕨');
    await expectText(page, '𝕨+𝕨\n𝕨');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);
    assert.equal(await page.evaluate(() => CSS.highlights.get('arraybox-multi-selection').size), 0);
    await page.keyboard.type('!');
    await expectText(page, '𝕨+𝕨!\n𝕨');
    await setCode(page, '𝕩+𝕩', 0, 2);
    await page.keyboard.press('Shift');
    await page.locator('#codeInput').click();
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);
});

test('a unique match inverts and empty selections do not activate occurrence editing', async t => {
    const page = await openEditor(t);
    await setCode(page, 'unique', 0, 6);
    await page.keyboard.press('Shift');
    assert.equal(await page.locator('#codeInput.occurrence-edit-active').count(), 1);
    assert.equal(await page.locator('.multi-cursor-selection').count(), 1);
    await page.keyboard.type('only');
    await expectText(page, 'only');
    await page.keyboard.press('Control+z');
    await expectText(page, 'onl');
    await page.keyboard.press('Escape');
    await setCode(page, 'empty', 2);
    await page.keyboard.press('Shift');
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);
    await expectText(page, 'empty');
});

test('literal matching handles punctuation, multiline text, and overlapping occurrences', async t => {
    const page = await openEditor(t);
    for (const [text, anchor, head, expected] of [
        ['.* .* .x', 0, 2, 'X X .x'],
        ['ab\ncd ab\ncd', 0, 5, 'X X'],
        ['banana ana', 3, 6, 'banX X'],
        ['aaaaaa', 2, 4, 'XXX']
    ]) {
        await setCode(page, text, anchor, head);
        await page.keyboard.press('Shift');
        await page.keyboard.type('X');
        await expectText(page, expected);
    }
});

test('Shift shortcuts and uppercase typing do not activate matching selections', async t => {
    const page = await openEditor(t);
    await setCode(page, 'word word', 0, 1);
    await page.keyboard.press('Shift+ArrowRight');
    assert.equal(await page.evaluate(() => window.getSelection().toString()), 'wo');
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);
    await page.keyboard.press('Shift+A');
    await expectText(page, 'Ard word');
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);

    // A modifier chord must not arm a later Shift release either.
    await setCode(page, 'word word', 0, 4);
    await page.keyboard.press('Control+Shift');
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);
    // Selecting with a held Shift still activates only on a separate tap.
    await setCode(page, 'word word', 0);
    await page.keyboard.down('Shift');
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.up('Shift');
    assert.equal(await page.locator('.occurrence-edit-active').count(), 0);
    await page.keyboard.press('Shift');
    assert.equal(await page.locator('.multi-cursor-selection').count(), 2);
});
