#!/usr/bin/env node
/**
 * Generate an OG image showing all supported languages in a 2x3 grid
 * with logos and version strings beneath each one.
 * 
 * Uses the same satori + resvg approach as generate-og-default.cjs
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const FONT_DIR = path.join(__dirname, '..', 'fonts');
const OUTPUT = path.join(__dirname, '..', 'assets', 'og-languages.png');

const COLORS = {
    bgGradientStart: '#111827',
    bgGradientMid: '#1f2937',
    bgGradientEnd: '#111827',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    border: '#4b5563',
    inputBg: '#1f2937',
    fg: '#F8F8F2',
};

// Language definitions: 2 rows x 3 cols
const LANGS = [
    // Row 1
    { name: 'APL',     version: 'Dyalog v20.0',     file: 'apl.png' },
    { name: 'BQN',     version: 'CBQN 0.11',        file: 'bqn.svg' },
    { name: 'Uiua',    version: '0.18.0-dev.7',      file: 'uiua.png' },
    // Row 2
    { name: 'J',       version: 'J9.7.0-beta10',    file: 'j_logo.png' },
    { name: 'Kap',     version: '2026-02-08',        file: 'kap.png' },
    { name: 'TinyAPL', version: '0.13-beta',         file: 'tinyapl.svg' },
];

function loadLogoDataUri(filename) {
    const logoPath = path.join(__dirname, '..', 'assets', filename);
    try {
        const data = fs.readFileSync(logoPath);
        const ext = path.extname(filename).slice(1);
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
        return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (e) {
        console.error(`Failed to load logo: ${filename}`, e.message);
        return null;
    }
}

async function generate() {
    const satoriModule = await import('satori');
    const satori = satoriModule.default;

    const jbMonoRegular = fs.readFileSync(path.join(FONT_DIR, 'JetBrainsMono-Regular.ttf'));
    const jbMonoBold = fs.readFileSync(path.join(FONT_DIR, 'JetBrainsMono-Bold.ttf'));
    const dejaVuFont = fs.readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');

    const WIDTH = 1280;
    const HEIGHT = 720;

    // Build a single language cell: logo + name + version
    function langCell(lang) {
        const logo = loadLogoDataUri(lang.file);
        return {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '300px',
                    gap: '8px',
                },
                children: [
                    logo ? {
                        type: 'img',
                        props: {
                            src: logo,
                            width: 140,
                            height: 140,
                            style: { objectFit: 'contain' },
                        },
                    } : null,
                    {
                        type: 'div',
                        props: {
                            style: {
                                fontSize: '20px',
                                fontFamily: 'JetBrainsMono',
                                fontWeight: 700,
                                color: COLORS.fg,
                            },
                            children: lang.name,
                        },
                    },
                    {
                        type: 'div',
                        props: {
                            style: {
                                fontSize: '14px',
                                fontFamily: 'JetBrainsMono',
                                color: COLORS.textMuted,
                            },
                            children: lang.version,
                        },
                    },
                ].filter(Boolean),
            },
        };
    }

    // Build grid rows
    const row1 = LANGS.slice(0, 3).map(langCell);
    const row2 = LANGS.slice(3, 6).map(langCell);

    const gridRow = (cells) => ({
        type: 'div',
        props: {
            style: {
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '80px',
            },
            children: cells,
        },
    });

    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientMid} 50%, ${COLORS.bgGradientEnd} 100%)`,
                    padding: '10px 16px',
                    gap: '40px',
                },
                children: [
                    // Grid row 1
                    gridRow(row1),
                    // Grid row 2
                    gridRow(row2),
                ],
            },
        },
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
                {
                    name: 'JetBrainsMono',
                    data: jbMonoRegular,
                    weight: 400,
                    style: 'normal',
                },
                {
                    name: 'JetBrainsMono',
                    data: jbMonoBold,
                    weight: 700,
                    style: 'normal',
                },
                {
                    name: 'Symbols',
                    data: dejaVuFont,
                    weight: 400,
                    style: 'normal',
                },
            ],
        }
    );

    const resvg = new Resvg(svg, {
        background: COLORS.bgGradientStart,
        fitTo: { mode: 'width', value: WIDTH },
    });

    const pngData = resvg.render();
    fs.writeFileSync(OUTPUT, pngData.asPng());
    console.log(`Generated languages OG image: ${OUTPUT}`);
    console.log(`Size: ${fs.statSync(OUTPUT).size} bytes`);
}

generate().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
