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
    if (code === 'Unsupported') return { type: 'function', repr: '⦅2 ⋄ _A ⋄ ⊢⦆' };
    if (code === 'StringBind') return { type: 'function', repr: '("<script>")∘(,)' };
    if (code === 'Da' || code === '⦅⌊0.5+⦅⦅×∘≢×(0+/)÷≢⦆⦅0=6|⊢⦆⊸⌿⦆⦆') return { type: 'function', repr: '⦅⌊ ⋄ 0.5 ⋄ + ⋄ ⦅⦅(×)∘(≢) ⋄ × ⋄ (0)(+)/ ⋄ ÷ ⋄ ≢⦆ ⋄ (⦅0 ⋄ = ⋄ 6 ⋄ | ⋄ ⊢⦆)⊸(⌿)⦆⦆' };
    if (code === '⦅⦅+/÷≠⦆⍪∘⦅×⊞⍨⍳⦆⦆') return { type: 'function', repr: '⦅⦅(+)/ ⋄ ÷ ⋄ ≠⦆ ⋄ (⍪)∘(⦅((×)⊞)⍨ ⋄ ⍳⦆)⦆' };
    if (code === 'EmptyTines') return { type: 'function', repr: '⦅(+)/ ⋄  ⋄ | ⋄  ⋄ (-)⌺ ⋄ (-)∘(a)⦆' };
    if (code === '⦅⌊/¯2⍕¨⍛⍪⍛⍎⌺⊢⦆') return { type: 'function', repr: '⦅(⌊)/ ⋄ ¯2 ⋄ ((((⍕)¨)⍛(⍪))⍛(⍎))⌺ ⋄ ⊢⦆' };
    if (code === '⦅2+⦆') return { type: 'function', repr: '⦅2 ⋄ +⦆' };
    if (code === '⦅+2⊢⦆') return { type: 'function', repr: '⦅+ ⋄ 2 ⋄ ⊢⦆' };
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

async function evaluate(page, code, { structure = true } = {}) {
    await page.evaluate(code => {
        const input = document.getElementById('codeInput');
        input.textContent = code;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
    }, code);
    await page.keyboard.press(structure ? 'Enter' : 'Control+Shift+Enter');
    await page.locator('#output.show').waitFor();
    await page.waitForFunction(() => !document.getElementById('loadingIndicator').classList.contains('show'));
}

test('TinyAPL function assignments and names render trees with hover explanations', async t => {
    const page = await openEditor(t);
    await evaluate(page, 'Ms ← ⍮¨⸚⦅≠⊆⊢⦆');
    assert.equal(await page.locator('#tinyaplEvaluationRoot').count(), 0, 'ordinary evaluation keeps the original train tree');
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
        ['Unsupported', '⦅2 ⋄ _A ⋄ ⊢⦆'],
    ]) {
        await evaluate(page, code);
        assert.equal(await page.locator('#explainTreeRoot').count(), 0);
        assert.equal(await page.locator('#output').textContent(), text);
        assert.equal(await page.locator('#output').evaluate(output => output.classList.contains('train-tree')), false);
    }
});

test('TinyAPL numeric tines render complete interactive trees with array-aware explanations', async t => {
    const page = await openEditor(t);
    await evaluate(page, '⦅⌊/¯2⍕¨⍛⍪⍛⍎⌺⊢⦆');
    assert.equal(await page.locator('#output').evaluate(output => output.classList.contains('train-tree')), true);
    assert.equal(await page.locator('#explainTreeRoot .explain-source-char').allTextContents()
        .then(chars => chars.join('')), '⦅⌊/¯2⍕¨⍛⍪⍛⍎⌺⊢⦆');
    assert.equal(await page.locator('#explainTreeRoot .syntax-number.explain-source-char').allTextContents()
        .then(chars => chars.join('')), '¯2');
    await page.locator('#explainTreeRoot [data-col="4"]').hover();
    await page.locator('#explainTooltip.show').waitFor();
    assert.equal(await page.locator('#explainTooltipName').textContent(), '3-train (left array)');
    assert.ok((await page.locator('#explainTooltipPattern').textContent()).includes('a G (H y)'));
    assert.equal(await page.locator('#explainTreeRoot .explain-role-tine').allTextContents()
        .then(chars => chars.join('')), '¯2⊢');

    for (const [code, name, pattern] of [
        ['⦅2+⦆', '2-train (left binding)', '⦅a⋄G⦆ y ≡ a G y'],
        ['⦅+2⊢⦆', '3-train (constant middle tine)', 'outer tines are ignored'],
    ]) {
        await evaluate(page, code);
        await page.locator('#explainTreeRoot [data-col="1"]').hover();
        await page.locator('#explainTooltip.show').waitFor();
        assert.equal(await page.locator('#explainTooltipName').textContent(), name);
        assert.ok((await page.locator('#explainTooltipPattern').textContent()).includes(pattern));
    }
});

test('issue #246 renders partial application in both TinyAPL tree views', async t => {
    const page = await openEditor(t);
    const code = '⦅⌊0.5+⦅⦅×∘≢×(0+/)÷≢⦆⦅0=6|⊢⦆⊸⌿⦆⦆';
    await evaluate(page, code);
    assert.equal(await page.locator('#explainTreeRoot .explain-source-char').allTextContents()
        .then(chars => chars.join('')), code);
    await page.locator(`#explainTreeRoot [data-col="${code.indexOf('0+/')}"]`).hover();
    await page.locator('#explainTooltip.show').waitFor();
    assert.equal(await page.locator('#explainTooltipName').textContent(), 'Left argument binding');
    assert.match(await page.locator('#explainTooltipPattern').textContent(), /a F y/);

    await evaluate(page, 'Da');
    assert.equal(await page.locator('#explainTreeRoot').count(), 1, 'named function results keep the evaluated structure');
    await evaluate(page, code, { structure: false });
    await page.locator('[data-action="expand-all"]').click();
    assert.equal(await page.locator('.eval-unavailable').count(), 0);
    assert.ok((await page.locator('.eval-expression').textContent()).includes('0 (+/)'));
    assert.ok((await page.locator('.eval-call text').allTextContents()).includes('+/'));
    assert.equal(await page.locator('#codeInput').textContent(), code);
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

test('Ctrl+Shift+Enter evaluates the TinyAPL selection in either direction without changing the input', async t => {
    const page = await openEditor(t);
    const code = 'DoNotEvaluate ⋄ ⦅2+⦆ ⋄ MoreCode';
    for (const backwards of [false, true]) {
        await page.evaluate(({ code, backwards }) => {
            const input = document.getElementById('codeInput');
            input.textContent = code;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
            const start = code.indexOf('⦅');
            const end = code.indexOf('⦆') + 1;
            window.getSelection().setBaseAndExtent(input.firstChild, backwards ? end : start,
                input.firstChild, backwards ? start : end);
        }, { code, backwards });
        await page.keyboard.press('Control+Shift+Enter');
        await page.locator('.eval-svg').waitFor();
        assert.equal(await page.locator('.eval-source').textContent(), '⦅2+⦆');
        assert.equal(await page.locator('.eval-expression').textContent(), 'r ← 2 + y');
        assert.equal(await page.locator('#codeInput').textContent(), code);
    }
    // Ordinary evaluation always returns to the original tree, including
    // when the preceding evaluation used the shortcut and a selection remains.
    await page.keyboard.press('Enter');
    await page.locator('#explainTreeRoot').waitFor();
    assert.equal(await page.locator('.eval-svg').count(), 0);
    assert.ok((await page.locator('#explainTreeRoot').textContent()).includes('⍮¨⸚⦅≠⊆⊢⦆'));
    assert.equal(await page.locator('#codeInput').textContent(), code);
});

test('Shift+Enter keeps the original TinyAPL selection tree and inserts a newline without a selection', async t => {
    const page = await openEditor(t);
    await page.evaluate(() => {
        const input = document.getElementById('codeInput');
        input.textContent = '⦅2+⦆';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        window.getSelection().selectAllChildren(input);
    });
    await page.keyboard.press('Shift+Enter');
    await page.locator('#explainTreeRoot').waitFor();
    assert.equal(await page.locator('#tinyaplEvaluationRoot').count(), 0);
    assert.ok((await page.locator('#explainTreeRoot').textContent()).includes('⦅2+⦆'));
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+Enter');
    assert.match(await page.locator('#codeInput').innerText(), /\n/);
});

test('Ctrl+Shift+Enter preserves linked TinyAPL selections', async t => {
    const page = await openEditor(t);
    const code = '⦅2+⦆ ⋄ ⦅2+⦆';
    await page.evaluate(code => {
        const input = document.getElementById('codeInput');
        input.textContent = code;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        window.getSelection().setBaseAndExtent(input.firstChild, 0, input.firstChild, '⦅2+⦆'.length);
    }, code);
    await page.keyboard.press('Shift');
    assert.equal(await page.locator('#codeInput.occurrence-edit-active').count(), 1);
    await page.keyboard.press('Control+Shift+Enter');
    await page.locator('.eval-svg').waitFor();
    assert.equal(await page.locator('.eval-source').textContent(), '⦅2+⦆');
    assert.equal(await page.locator('#codeInput').textContent(), code);
});

test('TinyAPL evaluation opens directly without a view toggle and supports expansion and tracing', async t => {
    const page = await openEditor(t);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await evaluate(page, 'Ms', { structure: false });
    assert.equal(await page.locator('[aria-label="Tree view"], [data-action="structure"], [data-action="evaluation"]').count(), 0);
    assert.equal(await page.locator('#explainTreeRoot').count(), 0);
    assert.equal(await page.locator('[data-action="dyad"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.eval-expandable').count(), 2);
    const initial = await page.locator('.eval-expression').textContent();
    assert.ok(initial.includes('y (⦅≠⊆⊢⦆) x'));
    await page.locator('.eval-expandable').first().click();
    assert.equal(await page.locator('.eval-expandable').count(), 1, 'only the clicked call expands');
    assert.equal(await page.locator('.eval-call').count(), 5);
    await page.locator('[data-action="expand-all"]').click();
    assert.equal(await page.locator('.eval-expandable').count(), 0);
    assert.equal(await page.locator('.eval-call').count(), 7);
    assert.ok((await page.locator('.eval-expression').textContent()).includes('(y ≠ x) ⊆ (y ⊢ x)'));
    await page.locator('.eval-input').first().hover();
    assert.ok(await page.locator('.eval-edge.eval-trace').count() > 0);
    assert.equal(await page.locator('.eval-input.eval-dim').count(), 1);
    await page.locator('.eval-call').last().hover();
    assert.ok(await page.locator('.eval-source-active').count() > 0);
    await page.locator('[data-action="monad"]').click();
    assert.match(await page.locator('.eval-unavailable').textContent(), /Mirror.*dyadic/);
    await page.locator('[data-action="dyad"]').click();
    assert.equal(await page.locator('.eval-call').count(), 7);
    await page.locator('[data-action="reset"]').click();
    assert.equal(await page.locator('.eval-expandable').count(), 2);
    assert.equal(await page.locator('#codeInput').textContent(), 'Ms');
    assert.deepEqual(errors, []);
});

test('TinyAPL evaluation supports keyboard expansion and constant results', async t => {
    const page = await openEditor(t);
    await evaluate(page, 'Ms', { structure: false });
    await page.locator('.eval-expandable').first().focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('.eval-call').count(), 5);
    assert.equal(await page.locator('.eval-node:focus').count(), 1);
    await page.keyboard.press('Control+Shift+R');
    assert.equal(await page.locator('.eval-expandable').count(), 2);
    assert.equal(await page.locator('#codeInput').textContent(), 'Ms');
    await page.locator('[data-action="expand-all"]').click();
    assert.equal(await page.locator('.eval-call').count(), 7);
    await evaluate(page, '⦅+2⊢⦆', { structure: false });
    assert.equal(await page.locator('.eval-call').count(), 0);
    assert.equal(await page.locator('.eval-edge[data-to]').count(), 0);
    assert.equal(await page.locator('.eval-constant text').textContent(), '2');
    await page.locator('[data-action="dyad"]').click();
    assert.equal(await page.locator('.eval-input').count(), 2);
    assert.equal(await page.locator('.eval-edge[data-to]').count(), 0);
    await evaluate(page, 'StringBind', { structure: false });
    assert.equal(await page.locator('#output script').count(), 0);
    assert.equal(await page.locator('.eval-constant text').textContent(), '"<script>"');
    assert.ok((await page.locator('.eval-expression').textContent()).includes('"<script>"'));
});

test('TinyAPL collapsed labels use the same syntax colors as the result expression', async t => {
    const page = await openEditor(t);
    await evaluate(page, 'Da', { structure: false });
    const colors = await page.locator('.eval-expandable').first().evaluate(node => {
        const expression = document.querySelector('.eval-expression');
        return {
            plain: getComputedStyle(node.querySelector('text')).fill,
            expectedPlain: getComputedStyle(expression).color,
            tokens: ['syntax-number', 'syntax-function', 'syntax-modifier-monadic', 'syntax-modifier-dyadic'].map(cls => {
                const token = node.querySelector(`tspan.${cls}`);
                return {
                    cls,
                    text: token?.textContent,
                    fill: token && getComputedStyle(token).fill,
                    expected: getComputedStyle(expression.querySelector(`.${cls}`)).color,
                };
            }),
        };
    });
    assert.equal(colors.plain, colors.expectedPlain, 'brackets keep the normal text color');
    for (const { cls, text, fill, expected } of colors.tokens) {
        assert.ok(text, cls);
        assert.equal(fill, expected, cls);
    }
    assert.equal(colors.tokens[0].text, '0.5', 'numbers are highlighted as complete tokens');
});

test('TinyAPL evaluation expand/reset shortcuts work from the editor and diagram', async t => {
    const page = await openEditor(t);
    const resetIsHandled = () => page.evaluate(() => {
        const event = new KeyboardEvent('keydown', {
            key: 'R', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true,
        });
        document.dispatchEvent(event);
        return event.defaultPrevented;
    });
    assert.equal(await resetIsHandled(), false, 'ordinary browser shortcuts remain available without an evaluation');

    await evaluate(page, 'Ms', { structure: false });
    for (const selector of ['#codeInput', '.eval-expandable']) {
        await page.locator(selector).first().focus();
        await page.keyboard.press('Control+Shift+E');
        assert.equal(await page.locator('.eval-expandable').count(), 0);
        assert.equal(await page.locator('.eval-call').count(), 7);
        await page.keyboard.press('Control+Shift+R');
        assert.equal(await page.locator('.eval-expandable').count(), 2);
        assert.equal(await page.locator('#codeInput').textContent(), 'Ms', 'reset preserves code and avoids a page reload');
    }

    // Replacing the output must target the current view, rather than an old one.
    const code = '⦅⦅+/÷≠⦆⍪∘⦅×⊞⍨⍳⦆⦆';
    await evaluate(page, code, { structure: false });
    const initial = await page.locator('.eval-expandable').count();
    await page.keyboard.press('Control+Shift+E');
    assert.equal(await page.locator('.eval-expandable').count(), 0);
    await page.keyboard.press('Control+Shift+R');
    assert.equal(await page.locator('.eval-expandable').count(), initial);
    assert.equal(await page.locator('#codeInput').textContent(), code);

    await evaluate(page, code);
    assert.equal(await resetIsHandled(), false, 'the structure view does not intercept browser reload');
});

test('TinyAPL evaluation controls remain usable in a narrow viewport', async t => {
    const page = await openEditor(t);
    await page.setViewportSize({ width: 600, height: 900 });
    await evaluate(page, 'Ms', { structure: false });
    for (const selector of ['[data-action="dyad"]', '[data-action="expand-all"]', '[data-action="reset"]']) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= 600, selector);
    }
    await page.locator('[data-action="expand-all"]').click();
    assert.equal(await page.locator('.eval-call').count(), 7);
});

test('expanded TinyAPL diagrams fit the viewport with a highlighted, single-line result', async t => {
    const page = await openEditor(t);
    const code = '⦅⦅+/÷≠⦆⍪∘⦅×⊞⍨⍳⦆⦆';
    await evaluate(page, code, { structure: false });
    await page.locator('[data-action="expand-all"]').click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.eval-heading, .eval-experiment, .eval-result-label, .eval-result-edge, .eval-input-caption, .eval-scopes, [data-collapse], .eval-inspector, .eval-inspector-label, .eval-help').count(), 0);
    assert.equal(await page.locator('.eval-toolbar .eval-source').textContent(), code);
    assert.ok(await page.locator('.eval-expression .syntax-function').count() > 0);
    assert.ok(await page.locator('.eval-expression .syntax-modifier-monadic').count() > 0);

    for (const viewport of [{ width: 1542, height: 983 }, { width: 1131, height: 1212 }, { width: 1280, height: 720 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const sizes = await page.locator('#output').evaluate(output => {
            const result = output.querySelector('.eval-expression');
            const source = output.querySelector('.eval-source').getBoundingClientRect();
            const valence = output.querySelector('.eval-valence').getBoundingClientRect();
            const actions = output.querySelector('.eval-actions').getBoundingClientRect();
            const canvas = output.querySelector('.eval-canvas');
            return {
                verticalOverflow: output.scrollHeight - output.clientHeight,
                horizontalOverflow: output.scrollWidth - output.clientWidth,
                canvasOverflow: canvas.scrollHeight - canvas.clientHeight,
                resultOverflow: result.scrollWidth - result.clientWidth,
                resultHeight: result.clientHeight,
                lineHeight: parseFloat(getComputedStyle(result).lineHeight),
                whiteSpace: getComputedStyle(result).whiteSpace,
                toolbarOrder: valence.right <= source.left && source.right <= actions.left,
                bottom: output.getBoundingClientRect().bottom,
            };
        });
        assert.ok(sizes.verticalOverflow <= 1, JSON.stringify({ viewport, sizes }));
        assert.ok(sizes.horizontalOverflow <= 1, JSON.stringify({ viewport, sizes }));
        assert.ok(sizes.canvasOverflow <= 1, JSON.stringify({ viewport, sizes }));
        assert.ok(sizes.resultOverflow <= 1, JSON.stringify({ viewport, sizes }));
        assert.ok(sizes.resultHeight <= sizes.lineHeight + 1, 'result uses one line');
        assert.equal(sizes.whiteSpace, 'pre');
        assert.ok(sizes.toolbarOrder, 'expression sits between argument and action controls');
        assert.ok(sizes.bottom <= viewport.height - 45, 'panel leaves space for the footer');
    }

    await page.locator('.eval-call').first().hover();
    assert.ok(await page.locator('.eval-expression .syntax-function').count() > 0, 'hover expression stays highlighted');
    await page.mouse.move(0, 0);
    assert.ok((await page.locator('.eval-expression').textContent()).startsWith('r ←'));
    assert.ok(await page.locator('.eval-expression .syntax-modifier-monadic').count() > 0, 'restored result stays highlighted');
});
