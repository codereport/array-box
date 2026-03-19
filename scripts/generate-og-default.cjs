#!/usr/bin/env node
/**
 * Generate a default OG image for ArrayBox
 * This creates a static 1200x630 social preview image for the site.
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const FONT_DIR = path.join(__dirname, '..', 'fonts');
const OUTPUT = path.join(__dirname, '..', 'assets', 'og-default.png');

const COLORS = {
    bgGradientStart: '#111827',
    bgGradientMid: '#1f2937',
    bgGradientEnd: '#111827',
    text: '#e5e7eb',
    border: '#4b5563',
    inputBg: '#1f2937',
    cyan: '#8BE9FD',
    green: '#50FA7B',
    yellow: '#F1FA8C',
    pink: '#FF79C6',
    purple: '#BD93F9',
    fg: '#F8F8F2',
};

// Load all language logos as data URIs
function loadLogoDataUri(filename) {
    const logoPath = path.join(__dirname, '..', 'assets', filename);
    try {
        const data = fs.readFileSync(logoPath);
        const ext = path.extname(filename).slice(1);
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
        return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (e) {
        return null;
    }
}

async function generate() {
    const satoriModule = await import('satori');
    const satori = satoriModule.default;
    
    // TinyAPL font for sample code, JetBrains Mono for title/subtitle
    const tinyaplFont = fs.readFileSync(path.join(FONT_DIR, 'TinyAPL386.ttf'));
    const jbMonoRegular = fs.readFileSync(path.join(FONT_DIR, 'JetBrainsMono-Regular.ttf'));
    const jbMonoBold = fs.readFileSync(path.join(FONT_DIR, 'JetBrainsMono-Bold.ttf'));
    // DejaVu Sans for the ⬢ hexagon glyph (not in JetBrains Mono or APL fonts)
    const dejaVuFont = fs.readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
    
    const WIDTH = 1200;
    const HEIGHT = 630;
    
    // Language logos and names
    const langs = [
        { name: 'APL', file: 'apl.png' },
        { name: 'BQN', file: 'bqn.svg' },
        { name: 'Uiua', file: 'uiua.png' },
        { name: 'J', file: 'j_logo.svg' },
        { name: 'Kap', file: 'kap.png' },
        { name: 'TinyAPL', file: 'tinyapl.svg' },
    ];
    
    const langIcons = langs.map(l => ({
        logo: loadLogoDataUri(l.file),
        name: l.name,
    })).filter(l => l.logo);
    
    // Build language icon row
    const langRow = langIcons.map(l => ({
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
            },
            children: [
                {
                    type: 'img',
                    props: {
                        src: l.logo,
                        width: 64,
                        height: 64,
                        style: { objectFit: 'contain' },
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            fontSize: '18px',
                            fontFamily: 'JetBrainsMono',
                            color: COLORS.text,
                            opacity: 0.8,
                        },
                        children: l.name,
                    },
                },
            ],
        },
    }));
    
    // Sample code: ×⊞⍨⍳3 (TinyAPL syntax highlighting)
    // ×  = function (cyan)
    // ⊞  = monadic modifier (green)
    // ⍨  = dyadic modifier (yellow)
    // ⍳  = function (cyan)
    // 3  = number (purple)
    const codeTokens = [
        { ch: '×', color: COLORS.cyan },
        { ch: '⊞', color: COLORS.green },
        { ch: '⍨', color: COLORS.yellow },
        { ch: '⍳', color: COLORS.cyan },
        { ch: '3', color: COLORS.purple },
    ];
    const codeChars = codeTokens.map((t, i) => ({
        type: 'span',
        props: {
            key: i,
            style: { color: t.color, whiteSpace: 'pre' },
            children: t.ch,
        },
    }));
    
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
                    padding: '50px',
                    gap: '30px',
                },
                children: [
                    // Title: ⬢ ArrayBox
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                            },
                            children: [
                                {
                                    type: 'span',
                                    props: {
                                        style: {
                                            fontSize: '44px',
                                            fontFamily: 'Symbols',
                                            color: COLORS.fg,
                                        },
                                        children: '⬢',
                                    },
                                },
                                {
                                    type: 'span',
                                    props: {
                                        style: {
                                            fontSize: '52px',
                                            fontFamily: 'JetBrainsMono',
                                            fontWeight: 700,
                                            color: COLORS.fg,
                                        },
                                        children: 'ArrayBox',
                                    },
                                },
                            ],
                        },
                    },
                    // Tagline
                    {
                        type: 'div',
                        props: {
                            style: {
                                fontSize: '24px',
                                fontFamily: 'JetBrainsMono',
                                color: COLORS.text,
                                opacity: 0.9,
                                textAlign: 'center',
                            },
                            children: 'An online playground for array programming languages',
                        },
                    },
                    // Sample code in a box
                    {
                        type: 'div',
                        props: {
                            style: {
                                background: COLORS.inputBg,
                                border: `3px solid ${COLORS.border}`,
                                borderRadius: '16px',
                                padding: '20px 40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '48px',
                                fontFamily: 'ArrayLang',
                            },
                            children: codeChars,
                        },
                    },
                    // Language icons row
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '32px',
                                marginTop: '10px',
                            },
                            children: langRow,
                        },
                    },
                ],
            },
        },
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
                {
                    name: 'ArrayLang',
                    data: tinyaplFont,
                    weight: 400,
                    style: 'normal',
                },
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
    console.log(`Generated default OG image: ${OUTPUT}`);
    console.log(`Size: ${fs.statSync(OUTPUT).size} bytes`);
}

generate().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
