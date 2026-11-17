const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openEditor(t) {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    t.after(() => page.close());
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== ORIGIN ||
            (url.pathname.startsWith('/wasm/') && !url.pathname.startsWith('/wasm/uiua_wasm'))) {
            return route.abort();
        }
        const file = url.pathname === '/' ? '/index.html' : url.pathname;
        await route.fulfill({ path: path.join(ROOT, file) }).catch(() =>
            route.fulfill({ status: 404, body: '' }));
    });
    await page.goto(`${ORIGIN}/?lang=uiua`);
    await page.locator('#languageButton.startup-spinning').waitFor();
    await page.keyboard.press('Space');
    await page.locator('#languageButton.startup-spinning').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => window.uiuaWasm?.isReady());
    await page.waitForFunction(() => document.getElementById('codeInput').classList.contains('uiua'));
    return page;
}

async function setCode(page, text, anchor = text.length, head = anchor) {
    await page.evaluate(async ({ text, anchor, head }) => {
        const { highlightCode } = await import('/src/syntax.js');
        const input = document.getElementById('codeInput');
        input.dispatchEvent(new Event('pointerdown'));
        input.innerHTML = highlightCode(text, 'uiua');
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
        window.getSelection().setBaseAndExtent(...point(anchor), ...point(head));
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, { text, anchor, head });
}

async function selection(page) {
    return page.evaluate(() => {
        const input = document.getElementById('codeInput');
        const sel = window.getSelection();
        function offset(node, position) {
            const range = document.createRange();
            range.selectNodeContents(input);
            range.setEnd(node, position);
            return range.toString().length;
        }
        return {
            anchor: offset(sel.anchorNode, sel.anchorOffset),
            head: offset(sel.focusNode, sel.focusOffset),
            text: sel.toString(),
        };
    });
}

test('Uiua keyboard and docs exclude deprecated glyphs', async t => {
    const page = await openEditor(t);
    const deprecated = ['.', '∵', ':', '☇', '◰', '◫'];
    const docs = await page.evaluate(async glyphs => {
        const { getUiuaHoverContent } = await import('/src/keyboard.js');
        return glyphs.map(getUiuaHoverContent);
    }, deprecated);
    assert.deepEqual(docs, deprecated.map(() => null));

    await page.keyboard.press('Control+k');
    await page.locator('.array-keyboard-wrapper.show').waitFor();
    const keyboardGlyphs = await page.locator('.array-keyboard-glyph').allTextContents();
    for (const glyph of deprecated) assert.ok(!keyboardGlyphs.includes(glyph), glyph);
    assert.ok(keyboardGlyphs.includes('≡'));
    assert.ok(keyboardGlyphs.includes('⧈'));
    await page.keyboard.press('Escape');

    for (const glyph of deprecated) {
        await setCode(page, glyph);
        await page.keyboard.press('F1');
        assert.equal(await page.locator('#f1DocTooltip.show').count(), 0, glyph);
    }

    await setCode(page, '≡', 1);
    await page.keyboard.press('F1');
    const tooltip = page.locator('#f1DocTooltip.show');
    await tooltip.waitFor();
    assert.equal(await tooltip.locator('.f1-doc-tooltip-glyph').textContent(), '≡');
    assert.equal(await tooltip.locator('.f1-doc-tooltip-title-line').textContent(), 'rows');
    assert.equal(await tooltip.locator('a').getAttribute('href'), 'https://www.uiua.org/docs/rows');
});

test('Uiua prefixes use Rust matching rules and glyph colors while typing', async t => {
    const page = await openEditor(t);
    await setCode(page, '');
    await page.keyboard.type('ra');
    assert.equal(await page.locator('#codeInput span').count(), 0);
    await page.keyboard.type('n');
    await page.locator('#codeInput .syntax-uiua-function-monadic').waitFor();
    assert.equal(await page.locator('#codeInput').textContent(), 'ran');
    assert.deepEqual(await selection(page), { anchor: 3, head: 3, text: '' });

    const examples = [
        ['range', [['range', 'syntax-uiua-function-monadic']]],
        ['tab', [['tab', 'syntax-uiua-modifier-monadic']]],
        ['for', [['for', 'syntax-uiua-modifier-dyadic']]],
        ['fx', [['fx', 'syntax-uiua-function-monadic']]],
        ['each', [['eac', 'syntax-uiua-modifier-monadic'], ['h', 'syntax-uiua-modifier-monadic']]],
        ['revran', [['rev', 'syntax-uiua-function-monadic'], ['ran', 'syntax-uiua-function-monadic']]],
        ['avg', [['a', 'syntax-uiua-function-dyadic'], ['v', 'syntax-uiua-modifier-dyadic'],
            ['g', 'syntax-uiua-function-monadic'], ['', 'syntax-uiua-modifier-monadic'], ['', 'syntax-uiua-function-dyadic']]],
    ];
    for (const [text, expected] of examples) {
        await setCode(page, text);
        const actual = await page.locator('#codeInput span').evaluateAll(spans =>
            spans.map(span => [span.textContent, span.className]));
        assert.deepEqual(actual, expected, text);
    }
    for (const text of ['Range', 'rangeUnknown', 'randomidentifier', 're', '&range']) {
        await setCode(page, text);
        assert.equal(await page.locator('#codeInput span').count(), 0, text);
    }
});

test('Uiua prefix coloring respects strings, raw strings, characters, and comments', async t => {
    const page = await openEditor(t);
    await setCode(page, '"range reverse" @r # range reverse\n$ range reverse\n$$ range reverse');
    assert.equal(await page.locator('#codeInput [class^="syntax-uiua-"]').count(), 0);
    assert.equal(await page.locator('#codeInput .syntax-string').count(), 4);
    assert.equal(await page.locator('#codeInput .syntax-comment').count(), 1);
});

test('Uiua formatting preserves carets across prefix conversion and Unicode', async t => {
    const page = await openEditor(t);
    for (const prefix of ['', '"🦊" ', '"e\u0301" ', '# heading\n']) {
        const text = prefix + 'first reverse [1 2 3]\nrange 5';
        for (const offset of [prefix.length + 2, prefix.length + 5, prefix.length + 13, text.length]) {
            await setCode(page, text, offset);
            await page.keyboard.press('Control+f');
            await page.waitForFunction(() => document.getElementById('codeInput').textContent.includes('⇌'));
            const formatted = await page.locator('#codeInput').textContent();
            const expected = offset === text.length ? formatted.length :
                offset <= prefix.length + 5 ? formatted.indexOf('⊢') + 1 : formatted.indexOf('⇌') + 1;
            assert.deepEqual(await selection(page), { anchor: expected, head: expected, text: '' },
                JSON.stringify({ text, offset, formatted }));
        }
    }
});

test('Uiua formatting preserves forward and backward selections', async t => {
    const page = await openEditor(t);
    for (const backwards of [false, true]) {
        await setCode(page, 'first reverse [1 2 3]', backwards ? 5 : 0, backwards ? 0 : 5);
        await page.keyboard.press('Control+f');
        await page.waitForFunction(() => document.getElementById('codeInput').textContent.startsWith('⊢'));
        assert.deepEqual(await selection(page), {
            anchor: backwards ? 1 : 0, head: backwards ? 0 : 1, text: '⊢',
        });
    }
});

test('Uiua evaluation maps the caret using the original unaligned input', async t => {
    const page = await openEditor(t);
    const text = 'A ← 1\nLongName ← 2\nfirst reverse [1 2 3]';
    await setCode(page, text, text.indexOf('first') + 5);
    await page.keyboard.press('Enter');
    await page.locator('#output.show').waitFor();
    const formatted = await page.locator('#codeInput').textContent();
    const expected = formatted.indexOf('⊢') + 1;
    assert.deepEqual(await selection(page), { anchor: expected, head: expected, text: '' });
    assert.equal(await page.locator('#output').textContent(), '3');
});

test('Uiua compiler recommends better idioms on evaluation and formatting', async t => {
    const page = await openEditor(t);
    for (const key of ['Enter', 'Control+f']) {
        await setCode(page, 'first reverse [1 2 3]');
        await page.keyboard.press(key);
        const recommendations = page.locator('#uiuaDiagnostics:not([hidden])');
        await recommendations.waitFor();
        assert.match(await recommendations.textContent(), /Prefer.*last.*over.*⊢⇌/);
        if (key === 'Enter') assert.equal(await page.locator('#output').textContent(), '3');
    }

    await setCode(page, 'last [1 2 3]');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.getElementById('codeInput').textContent.includes('⊣'));
    assert.equal(await page.locator('#uiuaDiagnostics').isHidden(), true);
    assert.equal(await page.locator('#output').textContent(), '3');
});

test('evaluating Uiua selections preserves the rest of the editor', async t => {
    const page = await openEditor(t);
    const text = 'first reverse [1 2 3]\nrange 5';
    await setCode(page, text, 0, text.indexOf('\n'));
    await page.keyboard.press('Shift+Enter');
    await page.locator('#output.show').waitFor();
    assert.equal(await page.locator('#output').textContent(), '3');
    assert.equal(await page.locator('#codeInput').textContent(), text);
});
