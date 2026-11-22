const assert = require('node:assert/strict');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://arraybox.test';
const SCENE_IDS = [
    'yosemite', 'personal-lakeside', 'personal-lofoten', 'personal-wengen', 'personal-trondheim',
    'aurora', 'snow', 'bamboo', 'piran', 'clouds', 'creek', 'creek-willow', 'shore', 'shore-dusk',
];
const PERSONAL_DATES = {
    'personal-wengen': '2023-06-15',
    'personal-trondheim': '2024-06-14', 'personal-lofoten': '2024-06-18', 'personal-lakeside': '2025-10-01',
};
const PAINTED_SCENES = new Set(['creek', 'creek-willow', 'shore', 'shore-dusk', 'clouds']);
const PHOTOGRAPH_LOCATIONS = {
    yosemite: 'Yosemite National Park, California', aurora: 'Kvaløya, Norway',
    snow: 'Yergaki Nature Park, Siberia', bamboo: 'Kinosaki Onsen, Japan', piran: 'Piran, Slovenia',
    'personal-wengen': 'Lauterbrunnen Valley, Switzerland',
    'personal-trondheim': 'Nidelva, Trondheim, Norway', 'personal-lofoten': 'Reinebringen, Lofoten, Norway',
    'personal-lakeside': 'Minnowbrook, Blue Mountain Lake, New York',
};
const STILL_TREE_DETAILS = {
    creek: [0.055,0.38,0.075,0.09],
    'creek-willow': [0.10,0.10,0.14,0.17],
    'shore-dusk': [0.82,0.11,0.13,0.12],
};
// Rectangles lie inside visible rocks / ledges, using source-image coordinates.
const PROTECTED_WATER_DETAILS = {
    creek: [0.154,0.805,0.025,0.022],
    'creek-willow': [0.374,0.828,0.027,0.024],
    shore: [0.452,0.448,0.016,0.012],
    'shore-dusk': [0.55,0.633,0.035,0.027],
};
let browser;

before(async () => { browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); });
after(async () => { await browser?.close(); });

async function openEditor(t, { language = 'apl', nature3D = false, preserveNatureFrames = true, ...options } = {}) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, ...options });
    if (nature3D && preserveNatureFrames) await page.addInitScript(() => {
        // Preserve the framebuffer only in tests so pixels can be compared between frames.
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, options) {
            return getContext.call(this, type, type === 'webgl2' ? { ...options, preserveDrawingBuffer: true } : options);
        };
    });
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
        // The WebGL renderer has its own integration checks below.
        if (url.pathname === '/src/nature-3d.js' && !nature3D) return route.abort();
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
    const canvas = page.locator('.matrix-backdrop canvas.matrix-glyphs');
    await canvas.waitFor({ state: 'visible' });
    return canvas.evaluate(canvas => canvas.toDataURL());
}

async function pauseSceneFades(page) {
    await page.evaluate(() => {
        const animate = Element.prototype.animate;
        Element.prototype.animate = function(...args) {
            const animation = animate.apply(this, args);
            // Hold the fade before any browser round trips or GPU readbacks can
            // outlast it. Tests advance and finish the real animation explicitly.
            if (this.matches('.matrix-wallpaper')) animation.pause();
            return animation;
        };
    });
}

async function typeRainGlyph(page, key, glyph) {
    const { highlightCode } = await import('../src/syntax.js');
    await page.locator('#codeInput').focus();
    await page.keyboard.press('Backquote');
    await page.keyboard.press(key);
    // Colored tokens appear after the debounced highlighter; plain text has no
    // span. Ignore the browser's trailing empty line in a contenteditable field.
    await page.waitForFunction(({ glyph, needsSpan }) => {
        const input = document.getElementById('codeInput');
        return input.textContent.trimEnd() === glyph && (!needsSpan ||
            [...input.querySelectorAll('span')].some(span => span.textContent === glyph));
    }, { glyph, needsSpan: highlightCode(glyph, 'apl').startsWith('<span ') });
    return page.evaluate(glyph => {
        const input = document.getElementById('codeInput');
        const span = [...input.querySelectorAll('span')].find(span => span.textContent === glyph);
        const context = document.createElement('canvas').getContext('2d');
        context.fillStyle = getComputedStyle(span || input).color;
        return { expected: context.fillStyle, matches: window.rainPaint.filter(item => item.glyph === glyph) };
    }, glyph);
}

async function finishSceneCycle(page) {
    for (let i = 0; i < SCENE_IDS.length && await page.locator('.matrix-backdrop').count(); i++) {
        await page.keyboard.press('Control+Shift+m');
    }
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
}

test('hidden shortcut cycles backgrounds without changing editor selection', async t => {
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
    await page.locator('body.matrix-mode .matrix-backdrop canvas.matrix-glyphs').waitFor({ state: 'attached' });
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
        document.querySelector('.matrix-backdrop canvas.matrix-glyphs').toDataURL() !== previous, firstFrame);
    await finishSceneCycle(page);
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    assert.equal(await page.locator('body.matrix-mode').count(), 0);
    assert.equal(await page.locator('body').evaluate(body => getComputedStyle(body).background), originalBackground);

    // Repeated cycles must leave no duplicate layers or callbacks using removed canvases.
    for (let i = 0; i < (SCENE_IDS.length + 1) * 2; i++) await page.keyboard.press('Control+Shift+m');
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
    await finishSceneCycle(page);
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    assert.equal(await page.locator('#helpScreen.show').count(), 1);
    assert.deepEqual(errors, []);
});

test('the backdrop grid selects any scene, preserves editor selection, and can turn the mode off', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await page.locator('#codeInput').fill('1 + 2');
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+ArrowRight');
    const selected = await page.evaluate(() => getSelection().toString());
    await page.keyboard.press('Control+Shift+g');
    const picker = page.getByRole('dialog', { name: 'Backdrops' });
    await picker.waitFor();
    assert.equal(await page.locator('.matrix-backdrop').count(), 0, 'browsing alone does not enable a backdrop');
    assert.deepEqual(await picker.locator('.backdrop-card').evaluateAll(cards => cards.map(card => card.dataset.scene)), SCENE_IDS);
    assert.doesNotMatch(await picker.textContent(), /OpenAI|Hardergrat|Stillwater|\bBled\b/);
    await picker.getByRole('button', { name: 'Use Minnowbrook', exact: true }).click();
    assert.equal(await page.locator('.backdrop-picker').count(), 0);
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'personal-lakeside');
    assert.equal(await page.locator('#codeInput').textContent(), '1 + 2');
    assert.equal(await page.evaluate(() => getSelection().toString()), selected);
    assert.equal(await page.locator('#codeInput').evaluate(input => input === document.activeElement), true);
    assert.match(await page.locator('.matrix-scene-credit').textContent(), /^Conor Shakory · Oct 1, 2025$/);
    await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'personal-lofoten', 'cycling continues after the chosen scene');
    await page.keyboard.press('Control+Shift+g');
    assert.equal(await picker.locator('.backdrop-card[aria-pressed="true"]').getAttribute('data-scene'), 'personal-lofoten');
    await picker.getByRole('button', { name: 'Use Windward', exact: true }).click();
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'creek');
    assert.equal(await page.locator('.matrix-scene-credit').count(), 0);
    await page.keyboard.press('Control+Shift+g');
    await picker.getByRole('button', { name: 'Turn backdrops off', exact: true }).click();
    assert.equal(await page.locator('.matrix-backdrop, .backdrop-picker').count(), 0);
    assert.deepEqual(errors, []);
});

test('the grid supports keyboard navigation, Escape and narrow screens over the keyboard overlay', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    await page.locator('#codeInput').fill('1 + 2');
    await page.keyboard.press('Control+k');
    await page.locator('.array-keyboard-wrapper.show').waitFor();
    await page.keyboard.press('Control+Shift+g');
    const picker = page.getByRole('dialog', { name: 'Backdrops' });
    await picker.waitFor();
    assert.equal(await picker.locator('.backdrop-card:focus').getAttribute('data-scene'), 'yosemite');
    assert.ok(await picker.locator('.backdrop-card-preview').first().evaluate(preview => {
        const bounds = preview.getBoundingClientRect();
        return bounds.height > 70 && Math.abs(bounds.width/bounds.height - 16/9) < 0.05;
    }), 'mobile thumbnails retain their full aspect ratio and scroll instead of shrinking');
    await page.keyboard.press('ArrowRight');
    assert.equal(await picker.locator('.backdrop-card:focus').getAttribute('data-scene'), 'personal-lakeside');
    await page.keyboard.press('ArrowDown');
    assert.equal(await picker.locator('.backdrop-card:focus').getAttribute('data-scene'), 'personal-wengen');
    await page.keyboard.press('End');
    assert.equal(await picker.locator('.backdrop-card:focus').getAttribute('data-scene'), 'shore-dusk');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.backdrop-picker').count(), 0);
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'personal-lakeside');
    assert.equal(await page.locator('#codeInput').textContent(), '1 + 2', 'picker keys never enter code');
    await page.keyboard.press('Control+Shift+g');
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'G', ctrlKey: true, shiftKey: true, repeat: true, bubbles: true,
    })));
    assert.equal(await picker.count(), 1, 'holding the shortcut does not flicker the picker');
    await page.keyboard.press('Escape');
    assert.equal(await picker.count(), 0);
    assert.equal(await page.locator('.array-keyboard-wrapper.show').count(), 1, 'Escape closes the picker only');
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'personal-lakeside');
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('reduced motion keeps a still backdrop and responds to motion preferences and resizing', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce', deviceScaleFactor: 2 });
    await page.keyboard.press('Control+Shift+m');
    const still = await snapshot(page);
    const painted = await page.locator('.matrix-backdrop canvas.matrix-glyphs').evaluate(canvas => {
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        return data.some((value, i) => i % 4 === 3 && value > 0);
    });
    assert.equal(painted, true, 'reduced motion still includes the white glyphs');
    await page.waitForTimeout(150);
    assert.equal(await snapshot(page), still);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(previous =>
        document.querySelector('.matrix-backdrop canvas.matrix-glyphs').toDataURL() !== previous, still);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Allow the media-query change event to settle before sampling the still frame.
    await page.waitForTimeout(50);
    const stopped = await snapshot(page);
    await page.waitForTimeout(150);
    assert.equal(await snapshot(page), stopped);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('.matrix-backdrop canvas.matrix-glyphs').width === 780);
    assert.deepEqual(await page.locator('.matrix-backdrop canvas.matrix-glyphs').evaluate(canvas => ({
        width: canvas.width, height: canvas.height,
        visibleWidth: canvas.getBoundingClientRect().width,
        visibleHeight: canvas.getBoundingClientRect().height,
    })), { width: 780, height: 1688, visibleWidth: 390, visibleHeight: 844 });
    await finishSceneCycle(page);
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
    assert.equal(await page.locator('.matrix-backdrop canvas.matrix-glyphs').isVisible(), false,
        'the canvas does not display substitute glyphs while the font loads');
    await finishSceneCycle(page);
    await page.keyboard.press('Control+Shift+m');
    releaseFont();
    await page.locator('.matrix-backdrop canvas.matrix-glyphs').waitFor({ state: 'visible' });
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
    await page.locator('.matrix-backdrop canvas.matrix-glyphs').waitFor({ state: 'visible' });
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
    await finishSceneCycle(page);
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

    await finishSceneCycle(page);
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

test('plain-text APL glyphs glow with the editor text color', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await captureRainHighlights(page);
    // Ambient scenes include every glyph, so these cases do not depend on random rain.
    await page.keyboard.press('Control+Shift+m');
    await page.keyboard.press('Control+Shift+m');
    await snapshot(page);
    for (const [key, glyph] of [['w', '⍵'], ['a', '⍺'], ['f', '_']]) {
        const { expected, matches } = await typeRainGlyph(page, key, glyph);
        assert.equal(await page.locator('#codeInput span').count(), 0, 'plain text needs no syntax span');
        assert.ok(matches.length, `${glyph} appears in the scene`);
        for (const item of matches) {
            assert.equal(item.alpha, 1);
            assert.equal(item.color, expected);
            assert.equal(item.shadowColor, expected);
            assert.ok(item.glow > 0);
        }
        await page.locator('#codeInput').fill('');
    }
    assert.deepEqual(errors, []);
});

test('the shortcut visits every local scene, preserves glyph glow in each, then returns to the editor', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await captureRainHighlights(page);
    for (const [index, scene] of SCENE_IDS.entries()) {
        await page.keyboard.press('Control+Shift+m');
        await snapshot(page);
        assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), scene);
        assert.equal(await page.locator('.matrix-scene-status .matrix-scene-count').textContent(),
            `${String(index + 1).padStart(2, '0')} / ${SCENE_IDS.length}`);
        assert.match(await page.locator('.matrix-scene-status strong').textContent(), /^\p{L}+$/u,
            'every scene has a single-word name');
        if (PHOTOGRAPH_LOCATIONS[scene]) {
            assert.equal(await page.locator('.matrix-scene-location').textContent(), PHOTOGRAPH_LOCATIONS[scene],
                'photographs show their actual location beneath the name');
        }
        const credit = page.locator('.matrix-scene-credit');
        assert.ok(!(await page.locator('.matrix-scene-status').textContent()).includes('OpenAI'));
        if (PAINTED_SCENES.has(scene)) {
            assert.equal(await credit.count(), 0, 'generated-image credit text stays hidden');
        } else {
            assert.ok((await credit.textContent()).trim(), 'photographs show their photographer or source');
            const creditBounds = await credit.boundingBox();
            const locationBounds = await page.locator('.matrix-scene-location').boundingBox();
            assert.ok(creditBounds.y >= locationBounds.y + locationBounds.height, 'credits appear below the location');
        }
        if (PERSONAL_DATES[scene]) {
            const date = PERSONAL_DATES[scene];
            const formatted = new Intl.DateTimeFormat('en', {
                year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
            }).format(new Date(`${date}T00:00:00Z`));
            assert.equal(await credit.textContent(), `Conor Shakory · ${formatted}`);
            assert.equal(await credit.locator('time').getAttribute('datetime'), date);
        } else if (!PAINTED_SCENES.has(scene)) {
            assert.equal(await credit.locator('time').count(), 0, 'unknown capture dates remain omitted');
        }
        const knownCredit = { aurora: 'Stefan Szankowski' }[scene];
        if (knownCredit) assert.equal(await credit.textContent(), knownCredit);
        assert.ok(await page.evaluate(() => window.rainPaint.every(item => item.glow === 0)),
            'a new scene does not inherit the previous glyph highlight');
        await page.waitForFunction(() => {
            const photo = [...document.querySelectorAll('.matrix-wallpaper img')].at(-1);
            return photo?.complete && photo.naturalWidth >= 1000;
        });
        const photo = await page.locator('.matrix-wallpaper img').last().getAttribute('src');
        assert.ok(photo.startsWith(ORIGIN + '/assets/'));
        const extension = PAINTED_SCENES.has(scene) || PERSONAL_DATES[scene] ? 'webp' : 'jpg';
        assert.ok(photo.endsWith(scene === 'yosemite' ? '/yosemite-violet.jpg' : `/${scene}.${extension}`));

        const [key, glyph] = await page.evaluate(async () => {
            const { aplKeymap } = await import('/src/keymap.js');
            return Object.entries(aplKeymap).find(([key, glyph]) => /^[a-z]$/.test(key) &&
                window.rainPaint.some(item => item.glyph === glyph));
        });
        const { expected, matches } = await typeRainGlyph(page, key, glyph);
        assert.ok(matches.length, `${scene} includes the typed glyph`);
        for (const item of matches) {
            assert.equal(item.alpha, 1, `${scene} highlights matches`);
            assert.equal(item.color, expected, `${scene} keeps syntax colors`);
            assert.equal(item.shadowColor, expected, `${scene} keeps the glow color`);
            assert.ok(item.glow > 0);
        }
        await page.locator('#codeInput').fill('');
    }
    await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').count(), 0);
    assert.equal(await page.locator('.matrix-scene-status').count(), 0);
    assert.equal(await page.locator('body').getAttribute('data-matrix-scene'), null);
    await page.keyboard.press('Control+Shift+m');
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'yosemite');
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('ambient scenes stay still with reduced motion, animate when allowed, and follow language changes', async t => {
    const { page, errors } = await openEditor(t, { language: 'j', reducedMotion: 'reduce', deviceScaleFactor: 2 });
    const allowed = await allowedGlyphs();
    await captureRain(page);
    await page.keyboard.press('Control+Shift+m');
    for (const scene of SCENE_IDS.slice(1)) {
        await page.evaluate(() => window.rainGlyphsDrawn.clear());
        await page.keyboard.press('Control+Shift+m');
        assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), scene);
        const still = await snapshot(page);
        await page.waitForTimeout(100);
        assert.equal(await snapshot(page), still, `${scene} respects reduced motion`);
        const glyphs = await page.evaluate(() => [...window.rainGlyphsDrawn]);
        assert.ok(glyphs.length > 10);
        assert.deepEqual(glyphs.filter(glyph => !allowed.j.has(glyph)), [], `${scene} uses complete J glyphs`);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForFunction(still => document.querySelector('.matrix-backdrop canvas.matrix-glyphs').toDataURL() !== still, still);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(50);
    }
    for (const language of ['kap', 'tinyapl', 'apl', 'bqn', 'uiua', 'j']) {
        await page.evaluate(() => window.rainGlyphsDrawn.clear());
        await page.keyboard.press('Control+ArrowDown');
        const glyphs = await page.evaluate(() => [...window.rainGlyphsDrawn]);
        assert.ok(glyphs.length > 10);
        assert.deepEqual(glyphs.filter(glyph => !allowed[language].has(glyph)), [], language);
        assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), SCENE_IDS.at(-1));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('.matrix-backdrop canvas.matrix-glyphs').width === 780);
    const resized = await snapshot(page);
    await page.waitForTimeout(100);
    assert.equal(await snapshot(page), resized);
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('every decoded scene crossfades, retaining outgoing crops and colors including Lofoten', async t => {
    const { page, errors } = await openEditor(t, { viewport: { width: 720, height: 450 } });
    await pauseSceneFades(page);
    await page.evaluate(async () => {
        const { BACKGROUND_SCENES } = await import('/src/background-scenes.js');
        // Hold decoded images in memory to exercise the cached-image path.
        window.cachedWallpapers = await Promise.all(BACKGROUND_SCENES.map(async scene => {
            const image = new Image();image.src = scene.image;await image.decode();return image;
        }));
    });
    for (const scene of SCENE_IDS) {
        const outgoing = await page.locator('.matrix-wallpaper').last().evaluateAll(layers => {
            const layer = layers[0];if (!layer) return null;
            const image = layer.querySelector('img');
            return { scene: layer.dataset.scene, position: getComputedStyle(image).objectPosition,
                filter: getComputedStyle(image).filter, wash: getComputedStyle(layer, '::before').backgroundImage };
        });
        await page.keyboard.press('Control+Shift+m');
        await page.waitForFunction(scene => {
            const layer = document.querySelector(`.matrix-wallpaper[data-scene="${scene}"]`);
            return layer?.classList.contains('is-visible') && layer.getAnimations().length === 1;
        }, scene);
        const blend = await page.evaluate(({ scene, outgoing }) => {
            const layer = document.querySelector(`.matrix-wallpaper[data-scene="${scene}"]`);
            const animation = layer.getAnimations()[0];animation.pause();
            const opacities = [0,250,500,750,1000].map(time => {
                animation.currentTime = time;return Number(getComputedStyle(layer).opacity);
            });
            animation.currentTime = 500;
            let previous = null;
            if (outgoing) {
                const old = document.querySelector(`.matrix-wallpaper[data-scene="${outgoing.scene}"]`);
                const image = old.querySelector('img');
                previous = { scene: old.dataset.scene, position: getComputedStyle(image).objectPosition,
                    filter: getComputedStyle(image).filter, wash: getComputedStyle(old, '::before').backgroundImage };
            }
            return { opacities, previous, position: getComputedStyle(layer.querySelector('img')).objectPosition,
                decoded: layer.querySelector('img').naturalWidth > 0 };
        }, { scene, outgoing });
        assert.equal(blend.decoded, true);
        assert.equal(blend.opacities[0], 0, `${scene} starts transparent, even from cache`);
        assert.equal(blend.opacities.at(-1), 1);
        assert.ok(blend.opacities.every((opacity, i, all) => !i || opacity > all[i-1]), `${scene} has a gradual fade`);
        assert.deepEqual(blend.previous, outgoing, 'the outgoing image keeps its own crop, grade and wash');
        if (scene === 'personal-lofoten') assert.equal(blend.position, '50% 0%', 'Lofoten retains its skyline');
        await page.evaluate(scene => document.querySelector(`.matrix-wallpaper[data-scene="${scene}"]`).getAnimations()[0].finish(), scene);
        await page.waitForFunction(() => document.querySelectorAll('.matrix-wallpaper').length === 1);
    }
    await finishSceneCycle(page);
    const exit = page.locator('.matrix-retiring-backdrop');
    assert.equal(await exit.count(), 1, 'returning to the editor also fades');
    const exitOpacity = await exit.evaluate(layer => {
        const animation = layer.getAnimations()[0];animation.pause();animation.currentTime = 500;
        return Number(getComputedStyle(layer).opacity);
    });
    assert.ok(exitOpacity > 0 && exitOpacity < 1);
    await exit.evaluate(layer => layer.getAnimations()[0].finish());
    await exit.waitFor({ state: 'detached' });
    assert.equal(await page.locator('body.matrix-retiring').count(), 0);
    assert.deepEqual(errors, []);
});

test('live 3D crossfades retain the outgoing frame and interrupted blends without a preserved WebGL buffer', async t => {
    const { page, errors } = await openEditor(t, { nature3D: true, preserveNatureFrames: false,
        reducedMotion: 'reduce', viewport: { width: 720, height: 405 } });
    await pauseSceneFades(page);
    for (let i = 0; i <= SCENE_IDS.indexOf('creek'); i++) await page.keyboard.press('Control+Shift+m');
    await page.waitForFunction(() => document.querySelector('.matrix-wallpaper.is-visible[data-scene="creek"] canvas.matrix-nature.is-visible'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => Number(document.querySelector('canvas.matrix-nature').dataset.time) > 0.1);
    await page.keyboard.press('Control+Shift+m');
    const oldFrame = page.locator('.matrix-wallpaper[data-scene="creek"] canvas.matrix-frozen-nature');
    await oldFrame.waitFor();
    assert.ok(await oldFrame.evaluate(canvas => {
        const pixels = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        let visible = 0;
        for (let i=0;i<pixels.length;i+=40) if (pixels[i+3] === 255 && pixels[i]+pixels[i+1]+pixels[i+2] > 70) visible++;
        return visible > canvas.width*canvas.height/40;
    }), 'the outgoing 3D frame is real image data, rather than a discarded / black WebGL buffer');
    const frozen = await oldFrame.evaluate(canvas => canvas.toDataURL());
    await page.waitForFunction(() => document.querySelector('.matrix-wallpaper[data-scene="creek-willow"]').getAnimations().length === 1);
    await page.evaluate(() => {
        const animation = document.querySelector('.matrix-wallpaper[data-scene="creek-willow"]').getAnimations()[0];
        animation.pause();animation.currentTime = 500;
    });
    await page.waitForTimeout(100);
    assert.equal(await oldFrame.evaluate(canvas => canvas.toDataURL()), frozen, 'the outgoing view stays fixed during the blend');
    assert.equal(await page.locator('canvas.matrix-nature').count(), 1, 'the two scenes still share one live GPU context');
    await page.keyboard.press('Control+Shift+m');
    await page.waitForFunction(() => document.querySelector('.matrix-wallpaper[data-scene="shore"]').getAnimations().length === 1);
    assert.equal(await page.locator('.matrix-wallpaper[data-scene="creek-willow"]').evaluate(layer => Number(getComputedStyle(layer).opacity)) > 0.5, true,
        'a rapid scene change preserves the partially blended outgoing scene');
    assert.equal(await page.locator('.matrix-wallpaper[data-scene="creek"]').count(), 1, 'its previous view remains beneath it');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelectorAll('.matrix-wallpaper').length === 1);
    assert.equal(await page.locator('.matrix-wallpaper').getAttribute('data-scene'), 'shore');
    assert.equal(await page.locator('.matrix-wallpaper').evaluate(layer => layer.getAnimations().length), 0);
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('a late photograph cannot replace a newer scene', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    let releasePhoto;
    const photoGate = new Promise(resolve => { releasePhoto = resolve; });
    t.after(() => releasePhoto());
    await page.route('**/assets/backgrounds/personal-lakeside.webp', async route => {
        await photoGate;
        await route.fulfill({ path: path.join(ROOT, 'assets/backgrounds/personal-lakeside.webp') });
    });
    const request = page.waitForRequest('**/assets/backgrounds/personal-lakeside.webp');
    await page.keyboard.press('Control+Shift+m');
    await snapshot(page);
    await page.keyboard.press('Control+Shift+m');
    await request;
    await page.keyboard.press('Control+Shift+m');
    await page.waitForFunction(() => [...document.querySelectorAll('.matrix-wallpaper img')].some(photo =>
        photo.src.endsWith('/personal-lofoten.webp') && photo.complete && photo.naturalWidth > 0));
    releasePhoto();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-scene'), 'personal-lofoten');
    assert.ok((await page.locator('.matrix-wallpaper img').last().getAttribute('src')).endsWith('/personal-lofoten.webp'));
    assert.ok(await page.locator('.matrix-wallpaper').count() <= 2);
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('nature glyphs use gentle local motion without loading video', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    const clipsRequested = [];
    page.on('request', request => {
        if (request.url().endsWith('.mp4')) clipsRequested.push(request.url());
    });
    await page.evaluate(() => {
        window.glyphPositions = [];
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        const clearRect = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function(...args) {
            if (this.canvas.closest('.matrix-backdrop')) window.glyphPositions = [];
            return clearRect.apply(this, args);
        };
        CanvasRenderingContext2D.prototype.fillText = function(glyph, x, y, ...args) {
            if (this.canvas.closest('.matrix-backdrop')) window.glyphPositions.push({glyph, x, y});
            return fillText.call(this, glyph, x, y, ...args);
        };
    });
    for (const scene of SCENE_IDS) {
        await page.keyboard.press('Control+Shift+m');
        if (!PAINTED_SCENES.has(scene)) continue;
        const initial = await snapshot(page);
        const image = page.locator('.matrix-wallpaper img').last();
        const source = await image.getAttribute('src');
        const positions = await page.evaluate(() => window.glyphPositions);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        // Flush styles after CDP media emulation so Chromium dispatches the
        // MediaQueryList change before we wait on the canvas animation.
        await page.locator('.matrix-glyphs').evaluate(canvas => getComputedStyle(canvas).opacity);
        await page.waitForFunction(positions => window.glyphPositions.some((glyph, index) =>
            glyph.x !== positions[index]?.x || glyph.y !== positions[index]?.y), positions);
        await page.waitForTimeout(150);
        const animated = await snapshot(page);
        assert.equal(await image.getAttribute('src'), source, 'the illustration stays still');
        const moved = await page.evaluate(() => window.glyphPositions);
        assert.equal(moved.length, positions.length);
        for (let index = 0; index < moved.length; index++) {
            const dx = Math.abs(moved[index].x - positions[index].x);
            const dy = Math.abs(moved[index].y - positions[index].y);
            // Ignore a glyph wrapping at the viewport edge.
            if (dx < 100 && dy < 100) assert.ok(Math.hypot(dx, dy) < 3,
                `${scene} glyph motion stays subtle`);
        }
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(50);
        const stopped = await snapshot(page);
        await page.waitForTimeout(100);
        assert.equal(await snapshot(page), stopped, 'all ambient motion stops for reduced motion');
        assert.ok(initial !== animated, `${scene} includes a changing ambient layer`);
        assert.equal(await page.locator('.matrix-backdrop video').count(), 0);
    }
    assert.deepEqual(clipsRequested, []);
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('snowflakes remain visible over the dimmed snow', async t => {
    const { page, errors } = await openEditor(t, { reducedMotion: 'reduce' });
    await captureRainHighlights(page);
    for (const scene of SCENE_IDS.slice(0, SCENE_IDS.indexOf('snow') + 1)) {
        await page.keyboard.press('Control+Shift+m');
        if (scene !== 'snow') continue;
        await snapshot(page);
        const filter = await page.locator('.matrix-wallpaper img').last().evaluate(img => getComputedStyle(img).filter);
        const saturation = Number(filter.match(/saturate\(([\d.]+)\)/)[1]);
        const brightness = Number(filter.match(/brightness\(([\d.]+)\)/)[1]);
        assert.ok(saturation <= 0.45);
        assert.ok(brightness < 0.7);
        if (scene === 'snow') {
            const alpha = await page.evaluate(() => window.rainPaint.map(item => item.alpha));
            assert.ok(alpha.length > 50);
            assert.ok(Math.min(...alpha) >= 0.23, 'flakes keep a visible baseline opacity');
        }
    }
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});

test('nature scenes render animated 3D geometry, pause their world, preserve glyph colors, and release the GPU', async t => {
    const { page, errors } = await openEditor(t, { nature3D: true, reducedMotion: 'reduce', viewport: { width: 720, height: 405 } });
    const shaderErrors = [];
    page.on('console', message => {
        if (message.type() === 'error' && /WebGL|shader/i.test(message.text())) shaderErrors.push(message.text());
    });
    await captureRainHighlights(page);
    const worlds = new Set([...PAINTED_SCENES]);
    for (const scene of SCENE_IDS) {
        await page.keyboard.press('Control+Shift+m');
        if (!worlds.has(scene)) continue;
        await page.waitForFunction(scene => {
            const canvas = document.querySelector('canvas.matrix-nature.is-visible');
            return canvas?.dataset.scene === scene && Number(canvas.dataset.triangles) > 10000;
        }, scene);
        const canvas = page.locator('canvas.matrix-nature');
        assert.equal(await canvas.count(), 1, 'all worlds reuse one WebGL context');
        assert.equal(await canvas.evaluate(canvas => canvas.getContext('webgl2').isContextLost()), false);
        assert.ok(await canvas.evaluate(canvas => {
            const gl = canvas.getContext('webgl2'), pixel = new Uint8Array(4);
            gl.readPixels(120, 120, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return pixel[3] === 255 && pixel.slice(0,3).some(channel => channel > 20);
        }), `${scene} renders visible pixels`);
        const still = await canvas.evaluate(canvas => canvas.toDataURL());
        const stationaryRegions = [PROTECTED_WATER_DETAILS[scene], STILL_TREE_DETAILS[scene]].filter(Boolean);
        if (stationaryRegions.length) await canvas.evaluate((canvas, regions) => {
            const gl = canvas.getContext('webgl2');
            window.stationaryNatureSamples = regions.map(region => {
                const x = Math.round(canvas.width * region[0]), y = Math.round(canvas.height * (1-region[1]-region[3]));
                const width = Math.max(1,Math.floor(canvas.width * region[2])), height = Math.max(1,Math.floor(canvas.height * region[3]));
                const pixels = new Uint8Array(width*height*4);
                gl.readPixels(x,y,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
                return {x,y,width,height,pixels};
            });
        }, stationaryRegions);
        if (['creek', 'creek-willow'].includes(scene)) await canvas.evaluate((canvas, scene) => {
            const gl = canvas.getContext('webgl2');
            const region = scene === 'creek' ? [0.58,0.04,0.35,0.30] : [0.16,0.10,0.21,0.27];
            const x = Math.floor(canvas.width * region[0]), y = Math.floor(canvas.height * region[1]);
            const width = Math.floor(canvas.width * region[2]), height = Math.floor(canvas.height * region[3]);
            const pixels = new Uint8Array(width * height * 4);
            gl.readPixels(x,y,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
            window.surfaceMotionSample = { x, y, width, height, pixels };
        }, scene);
        await page.waitForTimeout(100);
        assert.ok(await canvas.evaluate((canvas, still) => canvas.toDataURL() === still, still), `${scene} is static with reduced motion`);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForFunction(() => Number(document.querySelector('canvas.matrix-nature').dataset.time) > 0.2);
        await page.waitForFunction(still => document.querySelector('canvas.matrix-nature').toDataURL() !== still, still);
        if (stationaryRegions.length) {
            await page.waitForFunction(() => Number(document.querySelector('canvas.matrix-nature').dataset.time) > 1.1);
            const maximumChange = await canvas.evaluate(canvas => {
                const gl = canvas.getContext('webgl2');
                return Math.max(...window.stationaryNatureSamples.map(before => {
                    const pixels = new Uint8Array(before.pixels.length);
                    gl.readPixels(before.x,before.y,before.width,before.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
                    return pixels.reduce((maximum, value, i) => Math.max(maximum,Math.abs(value-before.pixels[i])),0);
                }));
            });
            assert.ok(maximumChange <= 2, `${scene}: rocks and tree canopies stay fixed (${maximumChange})`);
        }
        if (['creek', 'creek-willow'].includes(scene)) {
            await page.waitForFunction(() => Number(document.querySelector('canvas.matrix-nature').dataset.time) > 0.9);
            const motion = await canvas.evaluate(canvas => {
                const gl = canvas.getContext('webgl2'), before = window.surfaceMotionSample;
                const pixels = new Uint8Array(before.pixels.length);
                gl.readPixels(before.x,before.y,before.width,before.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
                let changed = 0, error = 0;
                for (let i=0; i<pixels.length; i+=4) {
                    const difference = Math.abs(pixels[i]-before.pixels[i]) + Math.abs(pixels[i+1]-before.pixels[i+1]) + Math.abs(pixels[i+2]-before.pixels[i+2]);
                    error += difference;
                    if (difference > 12) changed++;
                }
                const count = pixels.length / 4;
                return { changedFraction: changed/count, meanColorChange: error/(count*3) };
            });
            const grass = scene === 'creek';
            assert.ok(motion.changedFraction > (grass ? 0.18 : 0.14) && motion.meanColorChange > (grass ? 4 : 1.5),
                `${grass ? 'wind moves the foreground grass' : 'currents and ripples move across Willow'}: ${JSON.stringify(motion)}`);
        }

        if (scene === 'creek-willow') {
            await page.evaluate(() => {
                Object.defineProperty(document, 'hidden', { configurable: true, value: true });
                document.dispatchEvent(new Event('visibilitychange'));
            });
            const hiddenTime = await canvas.getAttribute('data-time');
            await page.waitForTimeout(150);
            assert.equal(await canvas.getAttribute('data-time'), hiddenTime, 'the 3D world pauses in a hidden tab');
            await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
        }
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(100);
        const stopped = await canvas.evaluate(canvas => canvas.toDataURL());
        await page.waitForTimeout(100);
        assert.ok(await canvas.evaluate((canvas, still) => canvas.toDataURL() === still, stopped), `${scene} stops all world motion`);
        await page.locator('#codeInput').focus();
        await page.keyboard.press('Backquote');await page.keyboard.press('i');
        await page.waitForFunction(() => [...document.querySelectorAll('#codeInput span')].some(span => span.textContent === '⍳'));
        const highlight = await page.evaluate(() => {
            const span = [...document.querySelectorAll('#codeInput span')].find(span => span.textContent === '⍳');
            const color = document.createElement('canvas').getContext('2d');color.fillStyle = getComputedStyle(span).color;
            return { expected: color.fillStyle, glyphs: window.rainPaint.filter(item => item.glyph === '⍳') };
        });
        assert.ok(highlight.glyphs.length);
        for (const glyph of highlight.glyphs) {
            assert.equal(glyph.color, highlight.expected);assert.equal(glyph.alpha, 1);assert.ok(glyph.glow > 0);
        }
        await page.locator('#codeInput').fill('');
        await canvas.evaluate(canvas => { window.testNatureCanvas = canvas; });
    }
    await finishSceneCycle(page);
    await page.waitForFunction(() => window.testNatureCanvas.getContext('webgl2').isContextLost());
    assert.equal(await page.locator('canvas.matrix-nature').count(), 0);
    assert.deepEqual(shaderErrors, []);
    assert.deepEqual(errors, []);
});

test('a late landscape load cannot replace a newer world or recreate a disabled backdrop', async t => {
    const { page, errors } = await openEditor(t, { nature3D: true, reducedMotion: 'reduce', viewport: { width: 720, height: 450 } });
    let release;
    const held = new Promise(resolve => { release = resolve; });
    const requests = [];
    await page.route('**/assets/backgrounds/creek.webp', async route => {
        requests.push(route.request());
        await held;
        await route.abort();
    });
    for (let i = 0; i <= SCENE_IDS.indexOf('creek'); i++) await page.keyboard.press('Control+Shift+m');
    await page.locator('canvas.matrix-nature').waitFor({ state: 'attached' });
    await page.waitForFunction(() => [...document.images].some(image => image.src.endsWith('/creek.webp')));
    assert.ok(requests.length, 'the old landscape is loading');
    await page.keyboard.press('Control+Shift+m');
    await page.waitForFunction(() => document.querySelector('canvas.matrix-nature.is-visible')?.dataset.scene === 'creek-willow');
    const failed = page.waitForEvent('requestfailed', { predicate: request => request.url().endsWith('/creek.webp') });
    release();
    await failed;
    await page.waitForTimeout(100);
    assert.equal(await page.locator('canvas.matrix-nature.is-visible').getAttribute('data-scene'), 'creek-willow');
    assert.equal(await page.locator('.matrix-backdrop').getAttribute('data-renderer'), '3d');

    await finishSceneCycle(page);
    let resume;
    const pending = new Promise(resolve => { resume = resolve; });
    await page.unroute('**/assets/backgrounds/creek.webp');
    await page.route('**/assets/backgrounds/creek.webp', async route => {
        await pending;
        await route.fulfill({ path: path.join(ROOT, 'assets/backgrounds/creek.webp') });
    });
    for (let i = 0; i <= SCENE_IDS.indexOf('creek'); i++) await page.keyboard.press('Control+Shift+m');
    await page.locator('canvas.matrix-nature').waitFor({ state: 'attached' });
    await finishSceneCycle(page);
    const loaded = page.waitForEvent('response', { predicate: response => response.url().endsWith('/creek.webp') });
    resume();
    await loaded;
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.matrix-backdrop, canvas.matrix-nature, .matrix-scene-status').count(), 0);
    assert.deepEqual(errors, []);
});

test('a device without WebGL keeps the still scene and the interactive glyph layer', async t => {
    const { page, errors } = await openEditor(t, { nature3D: true, reducedMotion: 'reduce' });
    await page.evaluate(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
            return type === 'webgl2' ? null : getContext.call(this, type, ...args);
        };
    });
    for (let i = 0; i <= SCENE_IDS.indexOf('creek'); i++) await page.keyboard.press('Control+Shift+m');
    await snapshot(page);
    await page.waitForFunction(() => !document.querySelector('canvas.matrix-nature'));
    await page.waitForFunction(() => [...document.querySelectorAll('.matrix-wallpaper img')].at(-1)?.naturalWidth > 0);
    await page.locator('#codeInput').focus();await page.keyboard.type('1 + 2');
    assert.equal(await page.locator('#codeInput').textContent(), '1 + 2');
    await finishSceneCycle(page);
    assert.deepEqual(errors, []);
});
