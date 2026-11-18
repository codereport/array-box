const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
let browser;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openEditor(t, { language = 'apl', ...options } = {}) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, ...options });
    page.setDefaultTimeout(5000);
    t.after(() => page.close());
    const errors = [];
    const wallpaperRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
        if (request.url().endsWith('/assets/yosemite-violet.jpg')) wallpaperRequests.push(request.url());
    });
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== ORIGIN) return route.abort();
        // Keep Kap's iframe same-origin while leaving interpreters out of these UI tests.
        if (url.pathname === '/wasm/kap/kap-loader.html') {
            return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html></html>' });
        }
        if (url.pathname.startsWith('/wasm/')) return route.abort();
        const file = url.pathname === '/' ? '/index.html' : url.pathname;
        await route.fulfill({ path: path.join(ROOT, file) }).catch(() =>
            route.fulfill({ status: 404, body: '' }));
    });
    await page.goto(`${ORIGIN}/?lang=${language}`);
    await page.locator('#languageButton.startup-spinning').waitFor();
    await page.keyboard.press('Space');
    await page.locator('#languageButton.startup-spinning').waitFor({ state: 'hidden' });
    await page.waitForFunction(lang => document.getElementById('codeInput').classList.contains(lang), language);
    return { page, errors, wallpaperRequests };
}

async function snapshot(page) {
    const canvas = page.locator('.matrix-backdrop canvas');
    await canvas.waitFor({ state: 'visible' });
    return canvas.evaluate(canvas => canvas.toDataURL());
}

test('hidden shortcut toggles the wallpaper and rain without changing editor selection', async t => {
    const { page, errors, wallpaperRequests } = await openEditor(t);
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    assert.equal(wallpaperRequests.length, 0, 'wallpaper is loaded only when enabled');
    const originalBackground = await page.locator('body').evaluate(body => getComputedStyle(body).background);

    await page.locator('#codeInput').fill('1 + 2');
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+ArrowRight');
    const selectedText = await page.evaluate(() => getSelection().toString());
    assert.equal(selectedText, '1');

    const wallpaper = page.waitForResponse('**/assets/yosemite-violet.jpg');
    await page.keyboard.press('Control+Shift+m');
    assert.equal((await wallpaper).status(), 200);
    await page.locator('body.matrix-mode .matrix-backdrop canvas').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#codeInput').textContent(), '1 + 2');
    assert.equal(await page.locator('#codeInput').evaluate(input => input === document.activeElement), true);
    assert.equal(await page.evaluate(() => getSelection().toString()), selectedText);
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('.matrix-backdrop').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    assert.equal(await page.locator('#codeInput').evaluate(input => {
        const rect = input.getBoundingClientRect();
        return input.contains(document.elementFromPoint(rect.x + 20, rect.y + 20));
    }), true, 'the backdrop stays behind the interactive editor');

    const firstFrame = await snapshot(page);
    await page.waitForFunction(previous =>
        document.querySelector('.matrix-backdrop canvas').toDataURL() !== previous, firstFrame);
    await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    assert.equal(await page.locator('body.matrix-mode').count(), 0);
    assert.equal(await page.locator('body').evaluate(body => getComputedStyle(body).background), originalBackground);

    // Repeated toggles must leave no duplicate layers or callbacks using removed canvases.
    for (let i = 0; i < 6; i++) await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    await page.keyboard.press('Control+Shift+m');
    await page.reload();
    assert.equal(await page.locator('.matrix-backdrop').count(), 0, 'each visit starts in the normal mode');
    assert.deepEqual(errors, []);
});

test('the shortcut works over overlays, ignores held keys and composition, and stays out of Help', async t => {
    const { page, errors } = await openEditor(t);
    await page.evaluate(() => {
        for (const options of [
            { ctrlKey: true },
            { ctrlKey: true, shiftKey: true, altKey: true },
            { ctrlKey: true, shiftKey: true, isComposing: true },
            { ctrlKey: true, shiftKey: true, keyCode: 229 },
            { ctrlKey: true, shiftKey: true, repeat: true },
        ]) document.getElementById('codeInput').dispatchEvent(new KeyboardEvent('keydown', {
            key: 'M', bubbles: true, cancelable: true, ...options
        }));
    });
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    await page.keyboard.press('Control+k');
    await page.locator('.array-keyboard-wrapper.show').waitFor();
    await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').count(), 1);
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'M', ctrlKey: true, shiftKey: true, repeat: true, bubbles: true
    })));
    assert.equal(await page.locator('.matrix-backdrop').count(), 1, 'holding the shortcut does not flicker the mode');
    await page.keyboard.press('Control+h');
    await page.locator('#helpScreen.show').waitFor();
    assert.doesNotMatch(await page.locator('#helpScreen').textContent(), /matrix|rain|shift\s*\+\s*m/i);
    await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    assert.equal(await page.locator('#helpScreen.show').count(), 1);
    assert.deepEqual(errors, []);
});

test('reduced motion keeps a still backdrop and responds to motion preferences and resizing', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce', deviceScaleFactor: 2 });
    await page.keyboard.press('Control+Shift+m');
    const still = await snapshot(page);
    const painted = await page.locator('.matrix-backdrop canvas').evaluate(canvas => {
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        return data.some((value, i) => i % 4 === 3 && value > 0);
    });
    assert.equal(painted, true, 'reduced motion still includes the white glyphs');
    await page.waitForTimeout(150);
    assert.equal(await snapshot(page), still);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(previous =>
        document.querySelector('.matrix-backdrop canvas').toDataURL() !== previous, still);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Allow the media-query change event to settle before sampling the still frame.
    await page.waitForTimeout(50);
    const stopped = await snapshot(page);
    await page.waitForTimeout(150);
    assert.equal(await snapshot(page), stopped);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('.matrix-backdrop canvas').width === 780);
    assert.deepEqual(await page.locator('.matrix-backdrop canvas').evaluate(canvas => ({
        width: canvas.width, height: canvas.height,
        visibleWidth: canvas.getBoundingClientRect().width,
        visibleHeight: canvas.getBoundingClientRect().height,
    })), { width: 780, height: 1688, visibleWidth: 390, visibleHeight: 844 });
    await page.keyboard.press('Control+Shift+m');
    assert.deepEqual(errors, []);
});

test('rain waits for the screensaver fonts before drawing, including after a quick toggle', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    let releaseFont;
    const fontGate = new Promise(resolve => { releaseFont = resolve; });
    t.after(() => releaseFont());
    await page.route('**/fonts/Uiua386.ttf', async route => {
        await fontGate;
        await route.fulfill({ path: path.join(ROOT, 'fonts/Uiua386.ttf') });
    });
    const fontRequest = page.waitForRequest('**/fonts/Uiua386.ttf');
    await page.keyboard.press('Control+Shift+m');
    await fontRequest;
    assert.equal(await page.locator('.matrix-backdrop canvas').isVisible(), false,
        'the canvas does not display substitute glyphs while the font loads');
    await page.keyboard.press('Control+Shift+m');
    await page.keyboard.press('Control+Shift+m');
    releaseFont();
    await page.locator('.matrix-backdrop canvas').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.matrix-backdrop').count(), 1);
    assert.deepEqual(await page.evaluate(() => ['APL', 'Uiua', 'JetBrains Mono'].map(family =>
        [...document.fonts].some(font => font.family === family && font.status === 'loaded'))),
    [true, true, true]);
    assert.deepEqual(errors, []);
});

async function captureRain(page) {
    await page.evaluate(() => {
        window.rainGlyphsDrawn = new Set();
        window.rainColumnWidths = new Map();
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function(text, x, ...args) {
            if (this.canvas.closest('.matrix-backdrop')) {
                window.rainGlyphsDrawn.add(text);
                window.rainColumnWidths.set(x, Math.max(window.rainColumnWidths.get(x) || 0,
                    this.measureText(text).width));
            }
            return fillText.call(this, text, x, ...args);
        };
    });
}

async function allowedGlyphs() {
    const keymap = await import('../src/keymap.js');
    const { syntaxRules } = await import('../src/syntax.js');
    const flatten = value => typeof value === 'string' ? [value] :
        value && typeof value === 'object' ? Object.values(value).flatMap(flatten) : [];
    return Object.fromEntries(Object.entries(syntaxRules).map(([language, rules]) =>
        [language, new Set(flatten([rules, keymap[`${language}Keymap`], keymap[`${language}Glyphs`]]))]));
}

async function assertLanguageRain(page, allowed, language) {
    await page.locator('.matrix-backdrop canvas').waitFor({ state: 'visible' });
    const glyphs = await page.evaluate(() => [...window.rainGlyphsDrawn]);
    assert.ok(glyphs.length > 10, `${language} draws a varied set of glyphs`);
    assert.deepEqual(glyphs.filter(glyph => !allowed[language].has(glyph)), [],
        `${language} rain contains only that language's glyphs`);
    if (language === 'j') {
        assert.ok(glyphs.some(glyph => glyph.length > 1), 'J primitives remain whole tokens');
        const columns = await page.evaluate(() => [...window.rainColumnWidths].sort((a, b) => a[0] - b[0]));
        const widest = Math.max(...columns.map(([, width]) => width));
        for (let i = 1; i < columns.length; i++) {
            assert.ok(columns[i][0] - columns[i - 1][0] > widest, 'J tokens do not overlap adjacent columns');
        }
    }
}

test('rain uses the initial language from the URL for all six languages', async t => {
    const allowed = await allowedGlyphs();
    for (const language of ['apl', 'bqn', 'uiua', 'j', 'kap', 'tinyapl']) {
        await t.test(language, async t => {
            const { page, errors } = await openEditor(t, { language, reducedMotion: 'reduce' });
            await captureRain(page);
            await page.keyboard.press('Control+Shift+m');
            await assertLanguageRain(page, allowed, language);
            assert.deepEqual(errors, []);
        });
    }
});

test('switching language replaces the entire rain glyph set even with reduced motion', async t => {
    const allowed = await allowedGlyphs();
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await captureRain(page);
    await page.keyboard.press('Control+Shift+m');
    await assertLanguageRain(page, allowed, 'apl');
    for (const language of ['bqn', 'uiua', 'j', 'kap', 'tinyapl', 'apl']) {
        await page.evaluate(() => {
            window.rainGlyphsDrawn.clear();
            window.rainColumnWidths.clear();
        });
        await page.keyboard.press('Control+ArrowDown');
        assert.equal(await page.locator(`#codeInput.${language}`).count(), 1);
        await assertLanguageRain(page, allowed, language);
    }
    // Language changes made with rain off must also apply on the next toggle.
    await page.keyboard.press('Control+Shift+m');
    await page.keyboard.press('Control+ArrowDown');
    await page.evaluate(() => window.rainGlyphsDrawn.clear());
    await page.keyboard.press('Control+Shift+m');
    await assertLanguageRain(page, allowed, 'bqn');
    assert.deepEqual(errors, []);
});

async function captureRainHighlights(page) {
    await page.evaluate(() => {
        window.rainPaint = [];
        const clearRect = CanvasRenderingContext2D.prototype.clearRect;
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.clearRect = function(...args) {
            if (this.canvas.closest('.matrix-backdrop')) window.rainPaint = [];
            return clearRect.apply(this, args);
        };
        CanvasRenderingContext2D.prototype.fillText = function(glyph, ...args) {
            if (this.canvas.closest('.matrix-backdrop')) {
                window.rainPaint.push({ glyph, color: this.fillStyle, shadowColor: this.shadowColor,
                    alpha: this.globalAlpha, glow: this.shadowBlur });
            }
            return fillText.call(this, glyph, ...args);
        };
    });
}

test('prefix-key glyphs light up matching rain and fade back to the same still frame', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await captureRainHighlights(page);
    await page.keyboard.press('Control+Shift+m');
    const baseline = await snapshot(page);
    const [key, glyph] = await page.evaluate(async () => {
        const { aplKeymap } = await import('/src/keymap.js');
        return Object.entries(aplKeymap).find(([key, glyph]) => /^[a-z]$/.test(key) &&
            window.rainPaint.some(item => item.glyph === glyph));
    });
    await page.locator('#codeInput').focus();
    await page.keyboard.press('Backquote');
    await page.keyboard.press(key);
    assert.equal(await page.locator('#codeInput').textContent(), glyph);
    const painted = await page.evaluate(() => window.rainPaint);
    assert.ok(painted.filter(item => item.glyph === glyph).every(item => item.alpha === 1 && item.glow > 0));
    assert.ok(painted.filter(item => item.glyph !== glyph).every(item => item.glow === 0 && item.color === '#ffffff'));
    assert.notEqual(await snapshot(page), baseline);

    await page.waitForTimeout(650);
    assert.ok(await page.evaluate(glyph => window.rainPaint.filter(item => item.glyph === glyph)
        .every(item => item.alpha === 1), glyph), 'matching glyphs stay bright before fading');
    await page.waitForFunction(glyph => window.rainPaint.some(item =>
        item.glyph === glyph && item.glow > 0 && item.alpha < 1), glyph);
    await page.waitForFunction(() => window.rainPaint.every(item => item.glow === 0));
    assert.equal(await snapshot(page), baseline, 'fading restores the original glyph positions, colors, and opacity');
    await page.waitForTimeout(150);
    assert.equal(await snapshot(page), baseline, 'reduced-motion rain stays still after the highlight ends');
    assert.deepEqual(errors, []);
});

test('completed J tokens glow, repeated typing extends the highlight, and toggling clears it', async t => {
    const { page, errors } = await openEditor(t, { language: 'j', reducedMotion: 'reduce' });
    await captureRainHighlights(page);
    await page.keyboard.press('Control+Shift+m');
    await snapshot(page);
    const token = await page.evaluate(() => window.rainPaint.find(item =>
        item.glyph.length > 1 && /^[a-z][.:]$/i.test(item.glyph))?.glyph);
    assert.ok(token, 'the rain contains a J digraph to type');
    await page.locator('#codeInput').focus();
    await page.keyboard.type(token);
    assert.ok(await page.evaluate(token => window.rainPaint.some(item =>
        item.glyph === token && item.alpha === 1 && item.glow > 0), token));
    await page.waitForTimeout(800);
    await page.keyboard.type(token);
    await page.waitForTimeout(500);
    assert.ok(await page.evaluate(token => window.rainPaint.filter(item => item.glyph === token)
        .every(item => item.alpha === 1 && item.glow > 0), token), 'typing again restarts the hold time');
    assert.equal(await page.locator('#codeInput').textContent(), token.repeat(2));

    await page.keyboard.press('Control+Shift+m');
    await page.keyboard.press('Control+Shift+m');
    await snapshot(page);
    assert.ok(await page.evaluate(() => window.rainPaint.every(item => item.glow === 0)));
    assert.deepEqual(errors, []);
});

test('rain glyphs and their glow match editor syntax colors in every language', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await captureRainHighlights(page);
    await page.keyboard.press('Control+Shift+m');
    await snapshot(page);
    const cases = {
        apl: ['+', '¨', '∘', '¯'],
        bqn: ['+', '¨', '∘', 'π'],
        uiua: ['√', '+', '/', '⊃', 'π'],
        j: ['+', '/.', '@.', 'a.'],
        kap: ['+', '¨', '∘', '¯'],
        tinyapl: ['+', '¨', '∘', '∞'],
    };
    for (const [language, glyphs] of Object.entries(cases)) {
        if (language !== 'apl') await page.keyboard.press('Control+ArrowDown');
        assert.equal(await page.locator(`#codeInput.${language}`).count(), 1);
        // Resample the random rain until each representative color has a visible glyph.
        await page.evaluate(glyphs => {
            for (let i = 0; i < 20 && !glyphs.every(glyph =>
                window.rainPaint.some(item => item.glyph === glyph)); i++) {
                window.dispatchEvent(new Event('resize'));
            }
        }, glyphs);
        await page.locator('#codeInput').focus();
        await page.keyboard.insertText(glyphs.join(' '));
        await page.waitForFunction(glyphs => glyphs.every(glyph =>
            [...document.querySelectorAll('#codeInput span')].some(span => span.textContent === glyph)), glyphs);
        const { expected, drawn } = await page.evaluate(glyphs => {
            const context = document.createElement('canvas').getContext('2d');
            const expected = Object.fromEntries([...document.querySelectorAll('#codeInput span')]
                .filter(span => glyphs.includes(span.textContent)).map(span => {
                    context.fillStyle = getComputedStyle(span).color;
                    return [span.textContent, context.fillStyle];
                }));
            return { expected, drawn: window.rainPaint.filter(item => glyphs.includes(item.glyph)) };
        }, glyphs);
        assert.ok(new Set(Object.values(expected)).size >= 4, `${language} covers four different editor colors`);
        for (const glyph of glyphs) {
            const matches = drawn.filter(item => item.glyph === glyph);
            assert.ok(matches.length, `${language} ${glyph} appears in the rain`);
            for (const item of matches) {
                assert.equal(item.color, expected[glyph], `${language} ${glyph} matches the editor`);
                assert.equal(item.shadowColor, expected[glyph], `${language} ${glyph} has the same glow color`);
                assert.equal(item.alpha, 1);
                assert.ok(item.glow > 0);
            }
        }
        await page.locator('#codeInput').fill('');
    }
    assert.deepEqual(errors, []);
});
