const COLUMN_WIDTH = 38;
const ROW_HEIGHT = 36;
const FONT_SIZE = 32;
const FONT_FAMILIES = ['APL', 'Uiua', 'JetBrains Mono'];
const RAIN_FONT = `${FONT_SIZE}px ${FONT_FAMILIES.map(family => `"${family}"`).join(', ')}, monospace`;
const FRAME_INTERVAL = 1000 / 30;

export function installMatrixRain(initialGlyphs) {
    let glyphPool = [...initialGlyphs];
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

    function paint(elapsed = 0) {
        if (!context) return;
        context.clearRect(0, 0, width, height);
        for (const stream of streams) {
            stream.y += stream.speed * elapsed;
            if (stream.y - stream.glyphs.length * ROW_HEIGHT > height) {
                stream.y = -ROW_HEIGHT * (2 + Math.random() * 6);
            }
            // Let glyphs stay readable for a few seconds between changes.
            const changeChance = 1 - Math.exp(-elapsed * 0.3);
            for (let i = 0; i < stream.glyphs.length; i++) {
                if (Math.random() < changeChance) stream.glyphs[i] = randomGlyph();
                const y = Math.round(stream.y - i * ROW_HEIGHT);
                if (y < -ROW_HEIGHT || y > height) continue;
                context.globalAlpha = stream.opacity * (1 - i / stream.glyphs.length);
                context.fillText(stream.glyphs[i], stream.x, y);
            }
        }
        context.globalAlpha = 1;
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
            paint(elapsed);
        }
        frame = requestAnimationFrame(animate);
    }

    function updateAnimation() {
        cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
        if (!context || document.hidden) return;
        // Keep the wallpaper and a still frame of rain for reduced motion.
        if (reducedMotion.matches) paint();
        else frame = requestAnimationFrame(animate);
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
    return {
        setGlyphs(glyphs) {
            glyphPool = [...glyphs];
            if (context) resize();
        },
        destroy() {
            document.removeEventListener('keydown', onKeyDown, true);
            disable();
        }
    };
}
