import { BACKGROUND_SCENES, createAmbientField, paintAmbientField } from './background-scenes.js';
import { createBackdropPicker } from './backdrop-picker.js';

const COLUMN_WIDTH = 38;
const ROW_HEIGHT = 36;
const FONT_SIZE = 32;
const FONT_FAMILIES = ['APL', 'Uiua', 'JetBrains Mono'];
const RAIN_FONT = `${FONT_SIZE}px ${FONT_FAMILIES.map(family => `"${family}"`).join(', ')}, monospace`;
const FRAME_INTERVAL = 1000 / 30;
const HIGHLIGHT_HOLD_MS = 1000;
const HIGHLIGHT_FADE_MS = 1000;
const SCENE_FADE_MS = 1000;

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
    let ambientField = null;
    let sceneIndex = -1;
    let sceneTime = 0;
    let activePhoto = null;
    let sceneStatus = null;
    let statusTimer = null;
    const preloadedPhotos = new Map();
    const retiringBackdrops = new Set();
    let width = 0;
    let height = 0;
    let frame = null;
    let previousTime = null;
    let fontPromise = null;
    let nature = null;
    let natureCanvas = null;
    let naturePromise = null;
    let natureVersion = 0;
    const picker = createBackdropPicker(() => sceneIndex, selectScene, inputElement);

    function drawGlyph(glyph, x, y, opacity, time) {
        const highlight = highlights.get(glyph);
        const strength = highlight ?
            Math.min(1, (HIGHLIGHT_HOLD_MS + HIGHLIGHT_FADE_MS - (time - highlight.started)) / HIGHLIGHT_FADE_MS) : 0;
        const scene = BACKGROUND_SCENES[sceneIndex];
        const ink = scene.ink;
        opacity = Math.min(1, opacity * (scene.glyphOpacity || 1));
        context.globalAlpha = opacity + (1 - opacity) * strength;
        context.fillStyle = `rgb(${ink.map((channel, index) => Math.round(channel +
            ((highlight?.color[index] ?? channel) - channel) * strength)).join(', ')})`;
        if (strength) context.shadowColor = `rgb(${highlight.color.join(', ')})`;
        context.shadowBlur = 18 * strength;
        context.fillText(glyph, x, y);
    }

    function paint(elapsed = 0, time = performance.now()) {
        if (!context) return;
        for (const [glyph, { started }] of highlights) {
            if (time - started >= HIGHLIGHT_HOLD_MS + HIGHLIGHT_FADE_MS) highlights.delete(glyph);
        }
        context.clearRect(0, 0, width, height);
        sceneTime += elapsed;
        const scene = BACKGROUND_SCENES[sceneIndex];
        if (scene.world) nature?.render(sceneTime);
        if (scene.effect !== 'rain') {
            paintAmbientField(context, ambientField, scene, sceneTime, width, height,
                (glyph, x, y, opacity) => drawGlyph(glyph, x, y, opacity, time));
        }
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
                const opacity = stream.opacity * (1 - i / stream.glyphs.length);
                drawGlyph(stream.glyphs[i], stream.x, y, opacity, time);
            }
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        nature?.resize(width, height);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        if (!context) return;
        context.setTransform(scale, 0, 0, scale, 0, 0);
        const rain = BACKGROUND_SCENES[sceneIndex].effect === 'rain';
        context.font = rain ? RAIN_FONT : RAIN_FONT.replace(`${FONT_SIZE}px`, `${width < 600 ? 18 : 22}px`);
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        streams = [];
        ambientField = null;
        if (!rain) {
            ambientField = createAmbientField(width, height, glyphPool);
            paint();
            return;
        }
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
        if (reducedMotion.matches) {
            backdrop?.querySelectorAll('.matrix-wallpaper').forEach(photo => {
                photo.getAnimations().forEach(animation => animation.finish());
            });
        }
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

    function removeWallpaper(photo) {
        photo.getAnimations().forEach(animation => animation.cancel());
        photo.remove();
    }

    function freezeCanvases() {
        // Each outgoing scene keeps its exact last frame while the shared live
        // canvases are moved into the next (still transparent) scene.
        for (const live of [canvas, natureCanvas]) {
            const layer = live?.closest('.matrix-wallpaper.is-visible');
            if (!layer || live.hidden) continue;
            if (live === natureCanvas && !live.classList.contains('is-visible')) continue;
            const still = live === natureCanvas ? nature?.snapshot() : document.createElement('canvas');
            if (!still) continue;
            if (live === canvas) {
                still.width = live.width;
                still.height = live.height;
                still.getContext('2d').drawImage(live, 0, 0);
            }
            still.className = live === canvas ? 'matrix-frozen-glyphs' : 'matrix-frozen-nature';
            live.before(still);
        }
    }

    function removeCoveredLayers(photo) {
        // Only layers beneath this now-opaque scene are safe to discard. This
        // also preserves an interrupted crossfade during rapid shortcut presses.
        if (!backdrop || photo.parentElement !== backdrop) return;
        for (const older of [...backdrop.children]) {
            if (older === photo) break;
            if (older.classList.contains('matrix-wallpaper')) removeWallpaper(older);
        }
    }

    function preloadNextPhoto() {
        const next = BACKGROUND_SCENES[sceneIndex + 1];
        for (const [url] of preloadedPhotos) {
            if (url !== next?.image) preloadedPhotos.delete(url);
        }
        if (!next || preloadedPhotos.has(next.image)) return;
        const image = new Image();
        image.decoding = 'async';
        image.fetchPriority = 'low';
        image.src = next.image;
        preloadedPhotos.set(next.image, image);
        image.decode().catch(() => {});
    }

    function revealScene(photo) {
        if (!backdrop || activePhoto !== photo) return;
        photo.classList.add('is-visible');
        if (reducedMotion.matches) {
            removeCoveredLayers(photo);
        } else {
            photo.style.willChange = 'opacity';
            // Explicit keyframes work even when a cached image is decoded in the
            // same frame that its layer is inserted; CSS transitions can skip it.
            const fade = photo.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: SCENE_FADE_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both',
            });
            fade.finished.then(() => {
                fade.cancel();
                photo.style.removeProperty('will-change');
                removeCoveredLayers(photo);
            }).catch(() => {});
        }
        // Decode the following photo ahead of the next shortcut press.
        preloadNextPhoto();
    }

    async function updateNature(scene, photo = activePhoto) {
        const version = ++natureVersion;
        natureCanvas?.classList.remove('is-visible');
        nature?.setScene(null);
        if (!scene.world) return;
        // Load the 3D engine only when an animated nature scene is visited.
        try {
            naturePromise ??= import('./nature-3d.js');
            const { createNature3D } = await naturePromise;
            if (!backdrop || version !== natureVersion) return;
            if (!nature) {
                natureCanvas = document.createElement('canvas');
                natureCanvas.className = 'matrix-nature';
                canvas.before(natureCanvas);
                natureCanvas.addEventListener('webglcontextlost', event => {
                    event.preventDefault();
                    if (event.currentTarget !== natureCanvas) return;
                    natureCanvas?.classList.remove('is-visible');
                    if (backdrop) delete backdrop.dataset.renderer;
                    if (activePhoto) delete activePhoto.dataset.renderer;
                });
                natureCanvas.addEventListener('webglcontextrestored', async event => {
                    if (event.currentTarget !== natureCanvas) return;
                    const current = BACKGROUND_SCENES[sceneIndex];
                    if (!current?.world || !nature) return;
                    await updateNature(current);
                });
                nature = createNature3D(natureCanvas);
            }
            const loadingNature = nature;
            await nature.setScene(scene.world);
            if (!backdrop || version !== natureVersion || nature !== loadingNature) return;
            nature.resize(width, height);
            nature.render(sceneTime);
            natureCanvas.dataset.scene = scene.id;
            natureCanvas.classList.toggle('is-visible', nature.available());
            if (nature.available()) {
                backdrop.dataset.renderer = '3d';
                photo.dataset.renderer = '3d';
            }
        } catch {
            if (!backdrop || version !== natureVersion) return;
            // Keep the local still background usable on devices without WebGL.
            nature?.dispose();
            nature = null;
            natureCanvas?.remove();
            natureCanvas = null;
        }
    }

    function applyScene() {
        const scene = BACKGROUND_SCENES[sceneIndex];
        freezeCanvases();
        backdrop.dataset.scene = scene.id;
        backdrop.dataset.tone = scene.tone || '';
        delete backdrop.dataset.renderer;
        document.body.dataset.matrixScene = scene.id;
        sceneTime = 0;
        highlights.clear();
        pendingInsertion = null;
        const photo = document.createElement('div');
        photo.className = 'matrix-wallpaper';
        photo.dataset.scene = scene.id;
        photo.dataset.tone = scene.tone || '';
        const poster = document.createElement('img');
        poster.alt = '';
        poster.decoding = 'async';
        poster.draggable = false;
        photo.append(poster, canvas);
        if (natureCanvas) canvas.before(natureCanvas);
        activePhoto = photo;
        const enabledBackdrop = backdrop;
        poster.src = scene.image;
        backdrop.append(photo);
        // Remove unshown requests only after moving the live canvases out of them.
        for (const pending of backdrop.querySelectorAll('.matrix-wallpaper:not(.is-visible)')) {
            if (pending !== photo) removeWallpaper(pending);
        }
        const imageReady = poster.decode().catch(() => {});
        const worldReady = updateNature(scene, photo);
        Promise.all([imageReady, worldReady]).then(() => {
            if (backdrop === enabledBackdrop) revealScene(photo);
        });

        sceneStatus.replaceChildren();
        const count = document.createElement('span');
        count.className = 'matrix-scene-count';
        count.textContent = `${String(sceneIndex + 1).padStart(2, '0')} / ${String(BACKGROUND_SCENES.length).padStart(2, '0')}`;
        const title = document.createElement('strong');
        title.textContent = scene.name;
        const subtitle = document.createElement('small');
        subtitle.className = 'matrix-scene-location';
        subtitle.textContent = scene.location || scene.subtitle;
        sceneStatus.append(count, title, subtitle);
        const creditName = scene.photographer || scene.source;
        sceneStatus.classList.toggle('has-credit', Boolean(creditName));
        if (creditName) {
            const credit = document.createElement('small');
            credit.className = 'matrix-scene-credit';
            credit.textContent = creditName;
            if (scene.date) {
                const date = document.createElement('time');
                date.dateTime = scene.date;
                date.textContent = new Intl.DateTimeFormat('en', {
                    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                }).format(new Date(`${scene.date}T00:00:00Z`));
                credit.append(' · ', date);
            }
            sceneStatus.append(credit);
        }
        sceneStatus.classList.add('is-visible');
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => sceneStatus?.classList.remove('is-visible'), 2600);
        resize();
        updateAnimation();
    }

    function disable() {
        const retiring = backdrop;
        if (retiring && !reducedMotion.matches) {
            freezeCanvases();
            for (const photo of retiring.querySelectorAll('.matrix-wallpaper')) {
                photo.style.opacity = getComputedStyle(photo).opacity;
                photo.getAnimations().forEach(animation => animation.cancel());
            }
        }
        natureVersion++;
        nature?.dispose();
        nature = null;
        natureCanvas?.remove();
        natureCanvas = null;
        canvas?.remove();
        cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', updateAnimation);
        reducedMotion.removeEventListener('change', updateAnimation);
        clearTimeout(statusTimer);
        preloadedPhotos.clear();
        sceneStatus?.remove();
        if (retiring && !reducedMotion.matches) {
            retiring.className = 'matrix-retiring-backdrop';
            retiringBackdrops.add(retiring);
            document.body.classList.add('matrix-retiring');
            const fade = retiring.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: SCENE_FADE_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both',
            });
            fade.finished.catch(() => {}).then(() => {
                retiring.remove();
                retiringBackdrops.delete(retiring);
                if (!retiringBackdrops.size) document.body.classList.remove('matrix-retiring');
            });
        } else retiring?.remove();
        backdrop = canvas = context = null;
        activePhoto = sceneStatus = ambientField = null;
        sceneIndex = -1;
        sceneTime = 0;
        streams = [];
        highlights.clear();
        pendingInsertion = null;
        document.body.classList.remove('matrix-mode');
        delete document.body.dataset.matrixScene;
    }

    function cycle() {
        selectScene(backdrop ? sceneIndex + 1 : 0);
    }

    function selectScene(index) {
        if (index < 0 || index >= BACKGROUND_SCENES.length) {
            disable();
            return;
        }
        if (backdrop) {
            if (sceneIndex === index) return;
            sceneIndex = index;
            applyScene();
            return;
        }
        sceneIndex = index;
        backdrop = document.createElement('div');
        backdrop.className = 'matrix-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        canvas = document.createElement('canvas');
        canvas.className = 'matrix-glyphs';
        canvas.hidden = true;
        backdrop.append(canvas);
        document.body.prepend(backdrop);
        sceneStatus = document.createElement('div');
        sceneStatus.className = 'matrix-scene-status';
        sceneStatus.setAttribute('role', 'status');
        sceneStatus.setAttribute('aria-live', 'polite');
        sceneStatus.setAttribute('aria-atomic', 'true');
        document.body.append(sceneStatus);
        document.body.classList.add('matrix-mode');
        applyScene();
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
        if (event.isComposing || event.keyCode === 229) return;
        const key = event.key.toLowerCase();
        if (event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey && ['m', 'g'].includes(key)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!event.repeat) {
                if (key === 'g') picker.toggle();
                else { picker.close();cycle(); }
            }
        } else if (picker.isOpen()) {
            // Keep global editor / keyboard-overlay handlers out of the modal;
            // native Tab, Enter and Space behavior still works normally.
            picker.handleKeyDown(event);
            event.stopImmediatePropagation();
        }
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
            picker.destroy();
            document.removeEventListener('keydown', onKeyDown, true);
            inputElement?.removeEventListener('beforeinput', onBeforeInput, true);
            inputElement?.removeEventListener('input', onInput);
            inputElement?.removeEventListener('compositionend', onCompositionEnd);
            disable();
            for (const retired of retiringBackdrops) {
                retired.getAnimations().forEach(animation => animation.cancel());
                retired.remove();
            }
            retiringBackdrops.clear();
            document.body.classList.remove('matrix-retiring');
        }
    };
}
