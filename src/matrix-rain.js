const COLUMN_WIDTH = 38;
const ROW_HEIGHT = 36;
const FONT_SIZE = 32;
const FONT_FAMILIES = ['APL', 'Uiua', 'JetBrains Mono'];
const RAIN_FONT = `${FONT_SIZE}px ${FONT_FAMILIES.map(family => `"${family}"`).join(', ')}, monospace`;
const FRAME_INTERVAL = 1000 / 30;
const HIGHLIGHT_HOLD_MS = 1000;
const HIGHLIGHT_FADE_MS = 1000;

export function installMatrixRain(initialGlyphs, inputElement, getGlyphColor = () => 'rgb(139, 233, 253)') {
    let glyphPool = [...initialGlyphs];
    const highlights = new Map();
    let pendingInsertion = null;
    const randomGlyph = () => glyphPool[Math.floor(Math.random() * glyphPool.length)];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let backdrop = null;
    let canvas = null;
    let context = null;
    let streams = [];
    let width = 0;
    let height = 0;
    let frame = null;
    let previousTime = null;
    let fontPromise = null;

    function paint(elapsed = 0, time = performance.now()) {
        if (!context) return;
        for (const [glyph, { started }] of highlights) {
            if (time - started >= HIGHLIGHT_HOLD_MS + HIGHLIGHT_FADE_MS) highlights.delete(glyph);
        }
        context.clearRect(0, 0, width, height);
        for (const stream of streams) {
            stream.y += stream.speed * elapsed;
            if (stream.y - stream.glyphs.length * ROW_HEIGHT > height) {
                stream.y = -ROW_HEIGHT * (2 + Math.random() * 6);
            }
            // Let glyphs stay readable for a few seconds between changes.
            const changeChance = 1 - Math.exp(-elapsed * 0.3);
            for (let i = 0; i < stream.glyphs.length; i++) {
                if (!highlights.has(stream.glyphs[i]) && Math.random() < changeChance) {
                    stream.glyphs[i] = randomGlyph();
                }
                const y = Math.round(stream.y - i * ROW_HEIGHT);
                if (y < -ROW_HEIGHT || y > height) continue;
                const highlight = highlights.get(stream.glyphs[i]);
                const strength = highlight ?
                    Math.min(1, (HIGHLIGHT_HOLD_MS + HIGHLIGHT_FADE_MS - (time - highlight.started)) / HIGHLIGHT_FADE_MS) : 0;
                const opacity = stream.opacity * (1 - i / stream.glyphs.length);
                context.globalAlpha = opacity + (1 - opacity) * strength;
                context.fillStyle = strength ?
                    `rgb(${highlight.color.map(channel => Math.round(255 + (channel - 255) * strength)).join(', ')})` : '#ffffff';
                if (strength) context.shadowColor = `rgb(${highlight.color.join(', ')})`;
                context.shadowBlur = 18 * strength;
                context.fillText(stream.glyphs[i], stream.x, y);
            }
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        if (!context) return;
        context.setTransform(scale, 0, 0, scale, 0, 0);
        context.font = RAIN_FONT;
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        // Keep multi-character primitives (especially J digraphs) intact and apart.
        const columnWidth = Math.max(COLUMN_WIDTH,
            Math.ceil(Math.max(...glyphPool.map(glyph => context.measureText(glyph).width))) + 8);
        streams = Array.from({ length: Math.ceil(width / columnWidth) }, (_, column) => {
            const glyphs = Array.from({ length: 12 + Math.floor(Math.random() * 13) }, randomGlyph);
            return {
                x: (column + 0.5) * columnWidth,
                y: Math.random() * (height + glyphs.length * ROW_HEIGHT),
                speed: 90 + Math.random() * 80,
                opacity: 0.25 + Math.random() * 0.4,
                glyphs
            };
        });
        paint();
    }

    function animate(time) {
        frame = null;
        if (previousTime === null || time - previousTime >= FRAME_INTERVAL) {
            const elapsed = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.1);
            previousTime = time;
            paint(reducedMotion.matches ? 0 : elapsed, time);
        }
        if (!reducedMotion.matches || highlights.size) frame = requestAnimationFrame(animate);
    }

    function updateAnimation() {
        cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
        if (!context || document.hidden) return;
        // Keep the wallpaper and a still frame of rain for reduced motion.
        if (reducedMotion.matches && !highlights.size) paint();
        else frame = requestAnimationFrame(animate);
    }

    function highlightInput(text) {
        if (!context || !text) return;
        let prefix = text;
        const selection = window.getSelection();
        if (selection?.rangeCount && inputElement.contains(selection.focusNode)) {
            const range = document.createRange();
            range.selectNodeContents(inputElement);
            range.setEnd(selection.focusNode, selection.focusOffset);
            prefix = range.toString();
        }
        const time = performance.now();
        let matched = false;
        for (const glyph of glyphPool) {
            // Match inserted Unicode glyphs and newly completed tokens such as J's i.
            if (text.includes(glyph) || prefix.endsWith(glyph)) {
                // The resolver reads computed editor colors, returned as RGB.
                const color = getGlyphColor(glyph).match(/[\d.]+/g).slice(0, 3).map(Number);
                highlights.set(glyph, { started: time, color });
                matched = true;
            }
        }
        if (!matched) return;
        paint();
        if (frame === null) updateAnimation();
    }

    function onBeforeInput(event) {
        // Prefix-key and multi-cursor insertion dispatch a plain input event.
        // Capture their text before an editor handler performs the insertion.
        pendingInsertion = !event.isComposing && event.inputType.startsWith('insert') ? event.data : null;
    }

    function onInput(event) {
        const text = event.data ?? pendingInsertion;
        pendingInsertion = null;
        if (!event.isComposing) highlightInput(text);
    }

    function onCompositionEnd(event) {
        pendingInsertion = null;
        highlightInput(event.data);
    }

    function disable() {
        cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', updateAnimation);
        reducedMotion.removeEventListener('change', updateAnimation);
        backdrop?.remove();
        backdrop = canvas = context = null;
        streams = [];
        highlights.clear();
        pendingInsertion = null;
        document.body.classList.remove('matrix-mode');
    }

    function toggle() {
        if (backdrop) {
            disable();
            return;
        }
        backdrop = document.createElement('div');
        backdrop.className = 'matrix-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        canvas = document.createElement('canvas');
        canvas.hidden = true;
        backdrop.append(canvas);
        document.body.prepend(backdrop);
        document.body.classList.add('matrix-mode');
        resize();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', updateAnimation);
        reducedMotion.addEventListener('change', updateAnimation);
        // Canvas does not wait for web fonts. Load the screensaver's primary and
        // fallback faces explicitly so the first frame uses the correct glyphs.
        fontPromise ??= Promise.allSettled(FONT_FAMILIES.map(family =>
            document.fonts.load(`${FONT_SIZE}px "${family}"`, glyphPool.join(''))));
        const enabledBackdrop = backdrop;
        fontPromise.then(() => {
            if (backdrop !== enabledBackdrop) return;
            context = canvas.getContext('2d');
            resize();
            canvas.hidden = false;
            updateAnimation();
        });
    }

    function onKeyDown(event) {
        if (event.isComposing || event.keyCode === 229 || !event.ctrlKey || !event.shiftKey ||
            event.altKey || event.metaKey || event.key.toLowerCase() !== 'm') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) toggle();
    }

    // Capture the chord before editor, multi-cursor, and keyboard-overlay handlers.
    document.addEventListener('keydown', onKeyDown, true);
    inputElement?.addEventListener('beforeinput', onBeforeInput, true);
    inputElement?.addEventListener('input', onInput);
    inputElement?.addEventListener('compositionend', onCompositionEnd);
    return {
        setGlyphs(glyphs) {
            glyphPool = [...glyphs];
            highlights.clear();
            pendingInsertion = null;
            if (context) {
                resize();
                updateAnimation();
            }
        },
        destroy() {
            document.removeEventListener('keydown', onKeyDown, true);
            inputElement?.removeEventListener('beforeinput', onBeforeInput, true);
            inputElement?.removeEventListener('input', onInput);
            inputElement?.removeEventListener('compositionend', onCompositionEnd);
            disable();
        }
    };
}
