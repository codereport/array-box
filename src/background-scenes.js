import { paintSceneArt } from './scene-art.js';

const asset = name => new URL(`../assets/backgrounds/${name}`, import.meta.url).href;

export const BACKGROUND_SCENES = [
    { id: 'yosemite', name: 'Yosemite', source: 'Original project wallpaper', location: 'Yosemite National Park, California', effect: 'rain',
        image: new URL('../assets/yosemite-violet.jpg', import.meta.url).href, ink: [255, 255, 255] },
    { id: 'personal-lakeside', name: 'Minnowbrook', location: 'Minnowbrook, Blue Mountain Lake, New York', photographer: 'Conor Shakory', date: '2025-10-01',
        effect: 'tide', tone: 'personal', pace: 0.3, image: asset('personal-lakeside.webp'), ink: [231, 240, 230] },
    { id: 'personal-lofoten', name: 'Lofoten', location: 'Reinebringen, Lofoten, Norway', photographer: 'Conor Shakory', date: '2024-06-18',
        effect: 'tide', tone: 'personal', pace: 0.3, image: asset('personal-lofoten.webp'), ink: [225, 236, 243] },
    { id: 'personal-wengen', name: 'Wengen', location: 'Lauterbrunnen Valley, Switzerland', photographer: 'Conor Shakory', date: '2023-06-15',
        effect: 'clouds', tone: 'personal', pace: 0.3, image: asset('personal-wengen.webp'), ink: [232, 239, 244] },
    { id: 'personal-trondheim', name: 'Trondheim', location: 'Nidelva, Trondheim, Norway', photographer: 'Conor Shakory', date: '2024-06-14',
        effect: 'tide', tone: 'personal', pace: 0.3, image: asset('personal-trondheim.webp'), ink: [239, 231, 220] },
    { id: 'aurora', name: 'Aurora', photographer: 'Stefan Szankowski', location: 'Kvaløya, Norway', effect: 'constellation',
        image: asset('aurora.jpg'), ink: [208, 233, 235] },
    { id: 'snow', name: 'Snowfall', photographer: 'Dmitrii Shirnin', location: 'Yergaki Nature Park, Siberia', effect: 'snowfall', tone: 'cool', glyphOpacity: 2.4,
        image: asset('snow.jpg'), ink: [247, 250, 255] },
    { id: 'bamboo', name: 'Bamboo', photographer: 'Kate Kasiutich', location: 'Kinosaki Onsen, Japan', effect: 'bamboo', tone: 'green',
        image: asset('bamboo.jpg'), ink: [224, 240, 207] },
    { id: 'piran', name: 'Piran', photographer: 'Josef Kali', location: 'Piran, Slovenia', effect: 'tide', tone: 'warm', pace: 0.3,
        image: asset('piran.jpg'), ink: [238, 232, 220] },
    { id: 'clouds', name: 'Cloudbreak', subtitle: 'Above the sleeping valley', effect: 'clouds', tone: 'painted',
        world: 'clouds', pace: 0.25, image: asset('clouds.webp'), ink: [232, 239, 248] },
    { id: 'creek', name: 'Windward', subtitle: 'A river through the highlands', effect: 'current', tone: 'painted',
        world: 'creek', pace: 0.25, image: asset('creek.webp'), ink: [224, 239, 230] },
    { id: 'creek-willow', name: 'Willow', subtitle: 'Light beneath the branches', effect: 'current', tone: 'painted',
        world: 'creek-willow', pace: 0.25, image: asset('creek-willow.webp'), ink: [224, 239, 230] },
    { id: 'shore', name: 'Seagrass', subtitle: 'Beyond the limestone cliffs', effect: 'shore', tone: 'painted',
        world: 'shore', pace: 0.25, image: asset('shore.webp'), ink: [235, 239, 228] },
    { id: 'shore-dusk', name: 'Moonlit', subtitle: 'The first light after sundown', effect: 'shore', tone: 'painted',
        world: 'shore-dusk', pace: 0.25, image: asset('shore-dusk.webp'), ink: [225, 231, 243] },
];

const TAU = Math.PI * 2;
const wrap = (value, size) => ((value + 30) % (size + 60) + size + 60) % (size + 60) - 30;

export function createAmbientField(width, height, glyphPool) {
    // Include every glyph once before repeating, even in the quieter scenes.
    const glyphs = [...glyphPool];
    for (let i = glyphs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [glyphs[i], glyphs[j]] = [glyphs[j], glyphs[i]];
    }
    const count = Math.max(glyphs.length, Math.ceil(width * height / 13500));
    const columns = Math.ceil(Math.sqrt(count * width / height));
    const rows = Math.ceil(count / columns);
    return {
        glyphs: Array.from({ length: count }, (_, index) => ({
            glyph: glyphs[index % glyphs.length],
            x: ((index % columns) + 0.25 + Math.random() * 0.5) * width / columns,
            y: (Math.floor(index / columns) + 0.25 + Math.random() * 0.5) * height / rows,
            phase: Math.random() * TAU,
            speed: 0.5 + Math.random(),
            depth: 0.6 + Math.random() * 0.8,
            opacity: 0.10 + Math.random() * 0.15,
        })),
        motes: Array.from({ length: Math.min(70, Math.ceil(width * height / 22000)) }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            phase: Math.random() * TAU,
            speed: 0.5 + Math.random(),
            radius: 0.5 + Math.random() * 1.1,
        })),
    };
}

function position(item, effect, time, width, height) {
    const { x, y, phase, speed } = item;
    if (effect === 'snowfall') {
        return [wrap(x + Math.sin(time * 0.18 + phase) * 35 + time * speed * 4, width),
            wrap(y + time * speed * 25, height)];
    }
    if (['petals', 'leaves', 'bamboo'].includes(effect)) {
        return [wrap(x + Math.sin(time * 0.2 + phase) * 45 + time * speed * 5, width),
            wrap(y + time * speed * (effect === 'bamboo' ? 7 : 13), height)];
    }
    if (effect === 'drizzle') {
        return [wrap(x - time * speed * 5, width), wrap(y + time * speed * 62, height)];
    }
    if (effect === 'current') {
        const flowX = wrap(x + time * speed * 12, width);
        return [flowX, y + Math.sin(flowX / width * 7 + phase) * 18];
    }
    if (effect === 'shore' || effect === 'pond' || effect === 'caustics') {
        return [x + Math.sin(time * 0.14 + phase) * 12,
            y + Math.sin(time * 0.24 + x / width * 5) * (effect === 'shore' ? 18 : 6)];
    }
    if (effect === 'clouds') return [wrap(x - time * speed * 3, width), y + Math.sin(time * 0.06 + phase) * 9];
    if (['pollen', 'dust', 'embers', 'lanterns'].includes(effect)) {
        return [x + Math.sin(time * 0.13 + phase) * 17,
            wrap(y - time * speed * (effect === 'embers' ? 17 : effect === 'lanterns' ? 7 : 3), height)];
    }
    if (effect === 'orbit' || effect === 'silk') {
        return [x + Math.sin(time * 0.06 + phase) * 18, y + Math.cos(time * 0.08 + phase) * 12];
    }
    if (effect === 'snow') {
        return [wrap(x + Math.sin(time * 0.1 + phase) * 14, width), wrap(y + time * speed * 6, height)];
    }
    if (effect === 'sand') {
        return [wrap(x + time * speed * 12, width), y + Math.sin(time * 0.14 + phase) * 12];
    }
    if (effect === 'fireflies') {
        return [x + Math.sin(time * 0.13 + phase) * 15, y + Math.cos(time * 0.11 + phase) * 10];
    }
    if (effect === 'tide') {
        return [x + Math.sin(time * 0.12 + phase) * 8, y + Math.sin(time * 0.3 + x / width * 8) * 8];
    }
    return [x + Math.sin(time * 0.07 + phase) * 6, y + Math.cos(time * 0.06 + phase) * 5];
}

export function paintAmbientField(context, field, scene, time, width, height, drawGlyph) {
    const { effect } = scene;
    time *= scene.pace || 1;
    context.save();
    paintSceneArt(context, field, scene, time, width, height);
    if (effect === 'constellation') {
        context.strokeStyle = '#c4e9ed';
        context.lineWidth = 0.65;
        context.globalAlpha = 0.075;
        for (let i = 0; i < field.glyphs.length - 1; i += 3) {
            const a = position(field.glyphs[i], effect, time, width, height);
            const b = position(field.glyphs[i + 1], effect, time, width, height);
            if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 155) continue;
            context.beginPath();
            context.moveTo(...a);
            context.lineTo(...b);
            context.stroke();
        }
    } else if (effect === 'tide') {
        context.strokeStyle = '#c9dbef';
        context.lineWidth = 0.8;
        context.globalAlpha = 0.045;
        for (let row = 0; row < 5; row++) {
            context.beginPath();
            for (let x = 0; x <= width + 30; x += 30) {
                const y = height * (0.57 + row * 0.09) +
                    Math.sin(x / width * 8 + time * 0.2 + row) * (6 + row * 2);
                if (x === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            }
            context.stroke();
        }
    }

    if (!['tide', 'shore', 'pond', 'caustics', 'drizzle', 'lanterns'].includes(effect)) {
        const fireflies = effect === 'fireflies';
        context.fillStyle = fireflies ? '#e8e5a9' :
            ['sand', 'embers', 'dust'].includes(effect) ? '#f6d8a5' : effect === 'petals' ? '#f6cedd' : '#e3eff6';
        context.shadowColor = context.fillStyle;
        context.shadowBlur = fireflies ? 9 : 0;
        for (const mote of field.motes) {
            const [x, y] = position(mote, effect, time, width, height);
            context.globalAlpha = (fireflies ? 0.30 : 0.13) +
                (fireflies ? 0.24 : 0.07) * Math.sin(time * 0.35 + mote.phase);
            context.beginPath();
            context.arc(x, y, mote.radius, 0, TAU);
            context.fill();
        }
    }
    context.restore();

    for (const item of field.glyphs) {
        const [x, y] = position(item, effect, time, width, height);
        if (['snowfall', 'petals', 'leaves', 'bamboo'].includes(effect)) {
            context.save();
            context.translate(x, y);
            context.rotate(Math.sin(time * 0.14 + item.phase) * (effect === 'snowfall' ? 0.18 : 0.45));
            context.scale(item.depth, item.depth);
            drawGlyph(item.glyph, 0, 0, item.opacity);
            context.restore();
        } else drawGlyph(item.glyph, x, y, item.opacity);
    }
}
