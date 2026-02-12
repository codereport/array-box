/**
 * Open Graph Image Generator for ArrayBox
 * Generates preview images for social media sharing
 */

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// Satori is an ES module, so we need to use dynamic import
let satoriModule = null;
async function getSatori() {
    if (!satoriModule) {
        satoriModule = await import('satori');
    }
    return satoriModule.default;
}

// Padding around content
const PADDING = 50;

// Colors from theme.css (Dracula palette)
const COLORS = {
    bgGradientStart: '#111827',  // gray-900
    bgGradientMid: '#1f2937',    // gray-800
    bgGradientEnd: '#111827',    // gray-900
    text: '#e5e7eb',             // gray-200
    border: '#4b5563',           // gray-600
    inputBg: '#1f2937',          // gray-800
    // Dracula palette for syntax
    cyan: '#8BE9FD',
    green: '#50FA7B',
    yellow: '#F1FA8C',
    pink: '#FF79C6',
    purple: '#BD93F9',
    comment: '#6272A4',
    fg: '#F8F8F2',
};

// Syntax highlighting rules (simplified from syntax.js)
const syntaxRules = {
    bqn: {
        functions: ['+', '-', '×', '÷', '⋆', '√', '⌊', '⌈', '|', '¬', '∧', '∨',
            '<', '>', '≠', '=', '≤', '≥', '≡', '≢', '⊣', '⊢', '⥊', '∾', '≍', '⋈', 
            '↑', '↓', '↕', '«', '»', '⌽', '⍉', '/', '⊏', '⊐', '⊑', '⊒', '⊔', '!',
            '∊', '⍷', '⍋', '⍒'],
        monadic: ['˜', '˘', '¨', '⌜', '⁼', '´', '˝', '`'],
        dyadic: ['∘', '○', '⊸', '⟜', '⌾', '⊘', '◶', '⎉', '⚇', '⍟'],
        constants: ['∞', '¯', 'π'],
        comments: ['#'],
    },
    apl: {
        functions: ['+', '-', '×', '÷', '⌈', '⌊', '|', '!', '○', '*', '⍟', '?', '~',
            '<', '>', '=', '≠', '≤', '≥', '≡', '≢', '∧', '∨', '⍲', '⍱',
            '⍴', '⍳', ',', '⍪', '⌽', '⊖', '⍉', '↑', '↓', '⊂', '⊃', '⌷',
            '⊣', '⊢', '∪', '∩', '⊥', '⊤', '⍋', '⍒', '∊', '⍷', '⍸', '⊆',
            '⎕', '⍎', '⍕', '⍬', '∆', '∇', '⍞', '⌹'],
        monadic: ['/', '\\', '⌿', '⍀', '¨', '⍨'],
        dyadic: ['∘', '.', '⍤', '⍥', '⍣', '@', '⍠', '⌸', '⌺', '⌶', '⍛'],
        constants: ['¯'],
        comments: ['⍝'],
    },
    tinyapl: {
        functions: ['+', '-', '×', '÷', '*', '⍟', '√', '⌊', '⌈', '⸠', '⌹', '!', '|',
            '⊕', '⊗', '∡', 'ℜ', 'ℑ', '⧺', 'ⵧ', '⊥', '⊤',
            '=', '≠', '<', '≤', '≥', '>', '≡', '≢', '⊲', '⊴', '⊵', '⊳', '≈',
            '∧', '∨', '⍲', '⍱', '~', '∪', '∩', '§',
            '⍳', '⍸', '∊', '⍷', '⋷', '⋵', '⍴', 'ϼ', '?', '…', '⍮', '‥', '߹',
            '↑', '↓', '⊂', '⊆', '⫇', '⍋', '⍒', '⌿', ',', '⍪', '⌽', '⍉',
            '⊃', '⊇', '⌷', '⊢', '⊣', '⍎', '⍕', '↗', '⇂', '↾', '⊏', '⊐', '⨳', '⩔', '⩓'],
        monadic: ['/', '\\', '¨', 'ᐵ', 'ᑈ', 'ᑣ', 'ᑒ', '∙', '⊞', '◡', '◠',
            'ᓗ', 'ᓚ', '⌓', '⌸', '⌺', '∵', '⫤', '˝', '⥼', '⥽', '⍦', '⑴', '⤺'],
        dyadic: ['⍨', '∘', '⍛', '⊸', '⟜', '⸚', '«', '»', '⇾', '⇽', '⫣', '⊩',
            '⍤', '⍥', '⍣', '⁖', '⍢', '⎊', '@', '≈', '⬚', '○', '⍜', '⍫'],
        constants: ['¯', '∞', '⍬', '∻', '⦻', '∅'],
        comments: ['⍝'],
    },
    uiua: {
        monadic: ['¬', '±', '√', '○', '⌵', '⌈', '⌊', '⧻', '△', '⇡', '⊢', '⇌', 
            '♭', '¤', '⊚', '⊛', '◴', '⍏', '⍖', '⊝', 'ℂ', '⁅', '⍉', '⋯', '⍘', '⚙', '⸮', '⬛'],
        functions: ['+', '-', '×', '÷', '◿', 'ⁿ', 'ₙ', '=', '≠', '<', '>', '≤', '≥',
            '↧', '↥', '∠', '∨', '⊻', '⊼', '⊽', '⊂', '⊏', '⊡', '↯', '☇',
            '↙', '↘', '↻', '⊗', '∈', '⊟', '▽', '◫', '▩', '⤸', '◠', '≍', '⌕', '⦷', '⨂', '⊥'],
        dyadic: ['˙', '˜', '⊙', '⋅', '⟜', '⊸', '⤙', '⤚', '◡', '∩',
            '≡', '⍚', '⊞', '⧅', '⧈', '⊕', '⊜', '/', '∧', '\\', '⍥', '⌅', '°', '⌝', '⧋', '◇'],
        modifier: ['⊃', '⊓', '⍜', '⍢', '⬚', '⨬'],
        constants: ['η', 'π', 'τ', '∞', '¯'],
        comments: ['#'],
    },
    kap: {
        functions: ['+', '-', '×', '÷', '|', '⋆', '⍟', '=', '≠', '<', '>', '≤', '≥',
            '∧', '∨', '⍲', '⍱', '~', '√', '⌊', '⌈', '!',
            '⍴', '⍳', '⊢', '⊣', '⌷', '⊂', '⊃', ',', '⍪', '⍮', '↑', '↓',
            '?', '⌽', '⊖', '⍉', '∊', '⍷', '⍋', '⍒', '⍕', '⍎', '%',
            '⊆', '⊇', '⫇', '⍸', '∪', '⊤', '⊥', '∩', '⌸', '⌹', '…',
            '/', '⌿', '≡', '≢', '→', '≬'],
        monadic: ['¨', '⍨', '\\', '⍀', '⍤', '∵', '∥', '˝', '⍰'],
        dyadic: ['∘', '⍛', '⍥', '⍢', '«', '»', '∙', '⌻', '⍣'],
        constants: ['¯', '⍬'],
        comments: ['⍝'],
    },
    j: {
        functions: ['+', '-', '*', '%', '^', '$', '~', '|', ',', ';', '#',
            '{', '}', '[', ']', '"', '?', '!', '<', '>', '='],
        monadic: ['/', '\\'],
        dyadic: ['@', '&', '`', ':'],
        constants: [],
        comments: [],
    },
};

// Get color for a single character based on syntax rules
function getCharColor(char, lang) {
    const rules = syntaxRules[lang];
    if (!rules) return COLORS.fg;
    
    // Check number
    if (/\d/.test(char)) return COLORS.purple;
    
    // Check constants
    if (rules.constants && rules.constants.includes(char)) return COLORS.purple;
    
    if (lang === 'uiua') {
        // Uiua has different semantics
        if (rules.monadic && rules.monadic.includes(char)) return COLORS.cyan;
        if (rules.functions && rules.functions.includes(char)) return COLORS.green;
        if (rules.dyadic && rules.dyadic.includes(char)) return COLORS.yellow;
        if (rules.modifier && rules.modifier.includes(char)) return COLORS.pink;
    } else {
        // Other languages
        if (rules.functions && rules.functions.includes(char)) return COLORS.cyan;
        if (rules.monadic && rules.monadic.includes(char)) return COLORS.green;
        if (rules.dyadic && rules.dyadic.includes(char)) return COLORS.yellow;
    }
    
    return COLORS.fg;
}

// Tokenize a line with pattern-based syntax highlighting
function tokenizeLine(line, lang) {
    const rules = syntaxRules[lang];
    const tokens = [];
    let i = 0;
    
    while (i < line.length) {
        const remaining = line.slice(i);
        
        // Check for comment (rest of line)
        const commentChar = rules?.comments?.[0];
        if (commentChar && line[i] === commentChar) {
            tokens.push({ text: line.slice(i), color: COLORS.comment });
            break;
        }
        
        // Check for string literals
        if (line[i] === '"' || line[i] === "'") {
            const quote = line[i];
            let j = i + 1;
            while (j < line.length && line[j] !== quote) {
                if (line[j] === '\\' && j + 1 < line.length) j++; // skip escaped
                j++;
            }
            if (j < line.length) j++; // include closing quote
            tokens.push({ text: line.slice(i, j), color: COLORS.yellow });
            i = j;
            continue;
        }
        
        // Check for 2-modifier identifier (_Name_)
        const twoModMatch = remaining.match(/^_[A-Za-z][A-Za-z0-9]*_/);
        if (twoModMatch) {
            tokens.push({ text: twoModMatch[0], color: COLORS.yellow });
            i += twoModMatch[0].length;
            continue;
        }
        
        // Check for 1-modifier identifier (_name)
        const oneModMatch = remaining.match(/^_[A-Za-z][A-Za-z0-9]*/);
        if (oneModMatch) {
            tokens.push({ text: oneModMatch[0], color: COLORS.green });
            i += oneModMatch[0].length;
            continue;
        }
        
        // Check for function identifier (Capitalized)
        const funcMatch = remaining.match(/^[A-Z][A-Za-z0-9]*/);
        if (funcMatch) {
            tokens.push({ text: funcMatch[0], color: COLORS.cyan });
            i += funcMatch[0].length;
            continue;
        }
        
        // Check for number
        const numMatch = remaining.match(/^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
        if (numMatch) {
            tokens.push({ text: numMatch[0], color: COLORS.purple });
            i += numMatch[0].length;
            continue;
        }
        
        // Single character - use character-based coloring
        const char = line[i];
        tokens.push({ text: char, color: getCharColor(char, lang) });
        i++;
    }
    
    return tokens;
}

// Create colored text spans for Satori, handling newlines
function createColoredTextElements(text, lang) {
    const lines = text.split('\n');
    
    // Always wrap each line in a flex div (even single lines)
    // This ensures consistent layout with flexDirection: column container
    return lines.map((line, idx) => {
        const tokens = tokenizeLine(line, lang);
        const lineElements = tokens.map((token, tidx) => ({
            type: 'span',
            props: {
                key: tidx,
                style: { color: token.color, whiteSpace: 'pre' },
                children: token.text,
            },
        }));
        
        // Add empty space for empty lines to preserve height
        if (lineElements.length === 0) {
            lineElements.push({
                type: 'span',
                props: {
                    style: { color: COLORS.fg },
                    children: ' ',
                },
            });
        }
        return {
            type: 'div',
            props: {
                style: { display: 'flex' },
                children: lineElements,
            },
        };
    });
}

// Parse HTML table and convert to Satori table element
// Returns { element, width, height } or null
function parseHtmlTableToSatori(html) {
    if (!html || !html.includes('<table')) return null;
    
    // Extract table rows
    const rows = [];
    const rowMatches = html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs);
    
    for (const rowMatch of rowMatches) {
        const cells = [];
        const cellMatches = rowMatch[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs);
        for (const cellMatch of cellMatches) {
            cells.push(cellMatch[1]);
        }
        if (cells.length > 0) {
            rows.push(cells);
        }
    }
    
    if (rows.length === 0) return null;
    
    // Calculate cell dimensions
    const maxCellLen = rows.reduce((max, row) => 
        Math.max(max, ...row.map(cell => cell.length)), 0);
    const cellWidth = Math.max(50, maxCellLen * 18 + 16); // ~18px per char + padding
    const cellHeight = 50;
    const numCols = rows[0].length;
    const numRows = rows.length;
    
    // If table would be too wide (more than ~800px), return null to fall back to text
    const estimatedWidth = numCols * cellWidth;
    if (estimatedWidth > 800) {
        return null;
    }
    
    // Build Satori table structure
    const tableRows = rows.map((row, rowIdx) => ({
        type: 'div',
        props: {
            style: {
                display: 'flex',
            },
            children: row.map((cell, colIdx) => ({
                type: 'div',
                props: {
                    style: {
                        width: `${cellWidth}px`,
                        height: `${cellHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${COLORS.fg}`,
                        borderTop: rowIdx === 0 ? `1px solid ${COLORS.fg}` : 'none',
                        borderLeft: colIdx === 0 ? `1px solid ${COLORS.fg}` : 'none',
                        fontSize: '28px',
                        color: COLORS.fg,
                        fontFamily: 'ArrayLang',
                    },
                    children: cell,
                },
            })),
        },
    }));
    
    const element = {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
            },
            children: tableRows,
        },
    };
    
    return {
        element,
        width: numCols * cellWidth,
        height: numRows * cellHeight,
    };
}

// Font file paths
const FONT_DIR = path.join(__dirname, '..', 'fonts');
const FONTS = {
    bqn: path.join(FONT_DIR, 'BQN386.ttf'),
    uiua: path.join(FONT_DIR, 'Uiua386.ttf'),
    apl: path.join(FONT_DIR, 'Apl385.ttf'),
    j: path.join(FONT_DIR, 'JetBrainsMono-Regular.ttf'),
    kap: path.join(FONT_DIR, 'APL387.ttf'),
    tinyapl: path.join(FONT_DIR, 'TinyAPL386.ttf'),
};

// Load font for a specific language
function loadFont(lang) {
    const fontPath = FONTS[lang] || FONTS.apl;
    return fs.readFileSync(fontPath);
}

// Get display name for language
function getLangDisplayName(lang) {
    const names = {
        bqn: 'BQN',
        uiua: 'Uiua',
        apl: 'APL',
        j: 'J',
        kap: 'Kap',
        tinyapl: 'TinyAPL',
    };
    return names[lang] || lang.toUpperCase();
}

// Get logo path for language
function getLogoPath(lang) {
    const logos = {
        bqn: path.join(__dirname, '..', 'assets', 'bqn.svg'),
        uiua: path.join(__dirname, '..', 'assets', 'uiua.png'),
        apl: path.join(__dirname, '..', 'assets', 'apl.png'),
        j: path.join(__dirname, '..', 'assets', 'j_logo.png'),
        kap: path.join(__dirname, '..', 'assets', 'kap.png'),
        tinyapl: path.join(__dirname, '..', 'assets', 'tinyapl.svg'),
    };
    return logos[lang] || logos.apl;
}

// Load logo as base64 data URI
function loadLogoAsDataUri(lang) {
    const logoPath = getLogoPath(lang);
    try {
        const data = fs.readFileSync(logoPath);
        const ext = path.extname(logoPath).slice(1);
        const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
        return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (e) {
        console.error('Error loading logo:', e.message);
        return null;
    }
}

/**
 * Generate an OG image for a permalink
 * @param {string} code - The code snippet
 * @param {string} lang - The language (bqn, uiua, apl, j, kap, tinyapl)
 * @param {string} [result] - Optional result to display (plain text)
 * @param {string} [resultHtml] - Optional HTML result (for TinyAPL tables)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateOGImage(code, lang, result = null, resultHtml = null) {
    const fontData = loadFont(lang);
    const logoDataUri = loadLogoAsDataUri(lang);
    
    // Use full code - image will size dynamically
    const displayCode = code;
    
    // Try to parse HTML table for visual display (TinyAPL)
    const tableInfo = resultHtml ? parseHtmlTableToSatori(resultHtml) : null;
    const tableElement = tableInfo ? tableInfo.element : null;
    
    // Use full result - image will size dynamically, trim trailing whitespace for centering
    const displayResult = (!tableElement && result) ? trimTrailingWhitespace(result) : null;
    
    // Create colored code elements
    const codeElements = createColoredTextElements(displayCode, lang);
    
    // Calculate dimensions
    const codeFontSize = 48;
    const resultFontSize = 32;
    const boxPadding = 30;
    const boxBorder = 3;  // Border width on boxes
    const gap = 20;
    
    // TinyAPL uses tighter line-height (matching .output.tinyapl CSS)
    const resultLineHeight = lang === 'tinyapl' ? 0.85 : 1.2;
    
    // Header dimensions (logo 80px + gap + text)
    const headerHeight = 80;
    const headerTextWidth = 'ArrayBox'.length * 22; // ~22px per char at 36px font
    const headerWidth = 80 + 20 + headerTextWidth; // logo + gap + text
    
    // Code box dimensions (content + padding + border)
    const codeCharWidth = 29; // ~29px per char at 48px
    const codeMaxLineLen = displayCode.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
    const codeLineCount = displayCode.split('\n').length;
    const codeContentWidth = codeMaxLineLen * codeCharWidth;
    const codeContentHeight = codeLineCount * (codeFontSize * 1.2);
    const codeBoxWidth = codeContentWidth + boxPadding * 2 + boxBorder * 2;
    const codeBoxHeight = codeContentHeight + boxPadding * 2 + boxBorder * 2;
    
    // Result dimensions (content + padding + border)
    let resultBoxWidth = 0;
    let resultBoxHeight = 0;
    
    if (tableInfo) {
        // Table dimensions
        resultBoxWidth = tableInfo.width + boxPadding * 2 + boxBorder * 2;
        resultBoxHeight = tableInfo.height + boxPadding * 2 + boxBorder * 2;
    } else if (displayResult) {
        const resultCharWidth = 19; // ~19px per char at 32px
        const resultMaxLineLen = displayResult.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
        const resultLineCount = displayResult.split('\n').length;
        const resultContentWidth = resultMaxLineLen * resultCharWidth;
        const resultContentHeight = resultLineCount * (resultFontSize * resultLineHeight);
        resultBoxWidth = resultContentWidth + boxPadding * 2 + boxBorder * 2;
        resultBoxHeight = resultContentHeight + boxPadding * 2 + boxBorder * 2;
    }
    
    const hasResult = tableElement || displayResult;
    
    // Calculate total dimensions based on layout
    let contentWidth, contentHeight;
    
    if (hasResult) {
        // Horizontal layout: left side + gap + right side
        const leftWidth = Math.max(headerWidth, codeBoxWidth);
        const leftHeight = headerHeight + gap + codeBoxHeight;
        const rightWidth = resultBoxWidth;
        const rightHeight = resultBoxHeight;
        
        contentWidth = leftWidth + gap * 2 + rightWidth;
        contentHeight = Math.max(leftHeight, rightHeight);
    } else {
        // Vertical layout: just header + code
        contentWidth = Math.max(headerWidth, codeBoxWidth);
        contentHeight = headerHeight + gap + codeBoxHeight;
    }
    
    // Calculate dimensions with padding
    let WIDTH = contentWidth + PADDING * 2;
    let HEIGHT = contentHeight + PADDING * 2;
    
    // Enforce 1.91:1 aspect ratio for social media compatibility
    const targetRatio = 1.91;
    const currentRatio = WIDTH / HEIGHT;
    
    if (currentRatio < targetRatio) {
        // Too tall - increase width
        WIDTH = Math.ceil(HEIGHT * targetRatio);
    } else if (currentRatio > targetRatio) {
        // Too wide - increase height
        HEIGHT = Math.ceil(WIDTH / targetRatio);
    }
    
    // Ensure minimum dimensions while maintaining ratio
    const MIN_WIDTH = 600;
    const MIN_HEIGHT = 315;
    if (WIDTH < MIN_WIDTH) {
        WIDTH = MIN_WIDTH;
        HEIGHT = Math.ceil(WIDTH / targetRatio);
    }
    if (HEIGHT < MIN_HEIGHT) {
        HEIGHT = MIN_HEIGHT;
        WIDTH = Math.ceil(HEIGHT * targetRatio);
    }
    
    // Build the left side (logo/title + code)
    const leftSide = {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            },
            children: [
                // Header with logo and ArrayBox text
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            marginBottom: `${gap}px`,
                        },
                        children: [
                            logoDataUri ? {
                                type: 'img',
                                props: {
                                    src: logoDataUri,
                                    width: 60,
                                    height: 60,
                                    style: { objectFit: 'contain' },
                                },
                            } : null,
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontSize: '28px',
                                        color: COLORS.text,
                                        fontWeight: 600,
                                    },
                                    children: 'ArrayBox',
                                },
                            },
                        ].filter(Boolean),
                    },
                },
                // Code box
                {
                    type: 'div',
                    props: {
                        style: {
                            background: COLORS.inputBg,
                            border: `3px solid ${COLORS.border}`,
                            borderRadius: '16px',
                            padding: `${boxPadding}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                        children: {
                            type: 'div',
                            props: {
                                style: {
                                    fontSize: `${codeFontSize}px`,
                                    fontFamily: 'ArrayLang',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                },
                                children: codeElements,
                            },
                        },
                    },
                },
            ],
        },
    };
    
    // Build the right side (result) if exists
    let rightSide = null;
    if (tableElement) {
        rightSide = {
            type: 'div',
            props: {
                style: {
                    background: COLORS.inputBg,
                    border: `3px solid ${COLORS.border}`,
                    borderRadius: '16px',
                    padding: `${boxPadding}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                children: tableElement,
            },
        };
    } else if (displayResult) {
        rightSide = {
            type: 'div',
            props: {
                style: {
                    background: COLORS.inputBg,
                    border: `3px solid ${COLORS.border}`,
                    borderRadius: '16px',
                    padding: `${boxPadding}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                children: {
                    type: 'div',
                    props: {
                        style: {
                            fontSize: `${resultFontSize}px`,
                            color: COLORS.fg,
                            fontFamily: 'ArrayLang',
                            lineHeight: resultLineHeight,
                            whiteSpace: 'pre',
                            textAlign: 'left',  // Left-align to preserve box-drawing structure
                        },
                        children: displayResult,
                    },
                },
            },
        };
    }
    
    // Build the main content - horizontal layout if result exists, vertical otherwise
    const children = hasResult ? [
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: `${gap * 2}px`,
                },
                children: [leftSide, rightSide].filter(Boolean),
            },
        },
    ] : [leftSide];
    
    // Create the SVG using satori
    const satori = await getSatori();
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
                    padding: `${PADDING}px`,
                },
                children,
            },
        },
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
                {
                    name: 'ArrayLang',
                    data: fontData,
                    weight: 400,
                    style: 'normal',
                },
            ],
        }
    );
    
    // Convert SVG to PNG
    const resvg = new Resvg(svg, {
        background: COLORS.bgGradientStart,
        fitTo: {
            mode: 'width',
            value: WIDTH,
        },
    });
    
    const pngData = resvg.render();
    return pngData.asPng();
}

/**
 * Trim trailing whitespace from each line of text.
 * This ensures proper visual centering in boxes.
 */
function trimTrailingWhitespace(text) {
    if (!text) return text;
    return text.split('\n').map(line => line.trimEnd()).join('\n');
}

/**
 * Generate a vertical layout image (for clipboard copy)
 * No forced aspect ratio - just wraps content with padding
 * @param {string} code - The code snippet
 * @param {string} lang - The language
 * @param {string} [result] - Optional result to display (plain text)
 * @param {string} [resultHtml] - Optional HTML result (for TinyAPL tables)
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateVerticalImage(code, lang, result = null, resultHtml = null) {
    const fontData = loadFont(lang);
    const logoDataUri = loadLogoAsDataUri(lang);
    
    const displayCode = code;
    const tableInfo = resultHtml ? parseHtmlTableToSatori(resultHtml) : null;
    const tableElement = tableInfo ? tableInfo.element : null;
    // Trim trailing whitespace from result for proper centering
    const displayResult = (!tableElement && result) ? trimTrailingWhitespace(result) : null;
    
    // Create colored code elements
    const codeElements = createColoredTextElements(displayCode, lang);
    
    // Calculate dimensions
    const codeFontSize = 48;
    const resultFontSize = 32;
    const boxPadding = 30;
    const boxBorder = 3;  // Border width on boxes
    const gap = 20;
    
    // TinyAPL uses tighter line-height (matching .output.tinyapl CSS)
    const resultLineHeight = lang === 'tinyapl' ? 0.85 : 1.2;
    
    // Header dimensions - logo 60px, text ~28px fits within logo height
    const logoSize = 60;
    const headerHeight = logoSize;
    
    // Code box dimensions (content + padding + border)
    const codeCharWidth = 29;
    const codeMaxLineLen = displayCode.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
    const codeLineCount = displayCode.split('\n').length;
    const codeContentWidth = codeMaxLineLen * codeCharWidth;
    const codeContentHeight = codeLineCount * (codeFontSize * 1.2);
    const codeBoxWidth = codeContentWidth + boxPadding * 2 + boxBorder * 2;
    const codeBoxHeight = codeContentHeight + boxPadding * 2 + boxBorder * 2;
    
    // Result dimensions (content + padding + border)
    let resultBoxWidth = 0;
    let resultBoxHeight = 0;
    
    if (tableInfo) {
        resultBoxWidth = tableInfo.width + boxPadding * 2 + boxBorder * 2;
        resultBoxHeight = tableInfo.height + boxPadding * 2 + boxBorder * 2;
    } else if (displayResult) {
        const resultCharWidth = 19;
        const resultMaxLineLen = displayResult.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
        const resultLineCount = displayResult.split('\n').length;
        const resultContentWidth = resultMaxLineLen * resultCharWidth;
        const resultContentHeight = resultLineCount * (resultFontSize * resultLineHeight);
        resultBoxWidth = resultContentWidth + boxPadding * 2 + boxBorder * 2;
        resultBoxHeight = resultContentHeight + boxPadding * 2 + boxBorder * 2;
    }
    
    const hasResult = tableElement || displayResult;
    
    // Make both boxes the same width (max of the two) for visual consistency
    const unifiedBoxWidth = Math.max(codeBoxWidth, resultBoxWidth, 200);
    
    // Vertical layout: stack everything with consistent PADDING on all sides
    const contentWidth = unifiedBoxWidth;
    let contentHeight = headerHeight + gap + codeBoxHeight;
    if (hasResult) {
        contentHeight += gap + resultBoxHeight;
    }
    
    // Use PADDING consistently on all four sides
    const WIDTH = contentWidth + PADDING * 2;
    const HEIGHT = contentHeight + PADDING * 2;
    
    // Build header
    const header = {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                height: `${headerHeight}px`,
            },
            children: [
                logoDataUri ? {
                    type: 'img',
                    props: {
                        src: logoDataUri,
                        width: logoSize,
                        height: logoSize,
                        style: { objectFit: 'contain' },
                    },
                } : null,
                {
                    type: 'div',
                    props: {
                        style: {
                            fontSize: '28px',
                            color: COLORS.text,
                            fontWeight: 600,
                        },
                        children: 'ArrayBox',
                    },
                },
            ].filter(Boolean),
        },
    };
    
    // Build code box (use unified width for consistent appearance)
    const codeBox = {
        type: 'div',
        props: {
            style: {
                width: `${unifiedBoxWidth}px`,
                background: COLORS.inputBg,
                border: `3px solid ${COLORS.border}`,
                borderRadius: '16px',
                padding: `${boxPadding}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
            },
            children: {
                type: 'div',
                props: {
                    style: {
                        fontSize: `${codeFontSize}px`,
                        fontFamily: 'ArrayLang',
                        lineHeight: 1.2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                    },
                    children: codeElements,
                },
            },
        },
    };
    
    // Build result box if needed (use unified width for consistent appearance)
    let resultBox = null;
    if (tableElement) {
        resultBox = {
            type: 'div',
            props: {
                style: {
                    width: `${unifiedBoxWidth}px`,
                    background: COLORS.inputBg,
                    border: `3px solid ${COLORS.border}`,
                    borderRadius: '16px',
                    padding: `${boxPadding}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                },
                children: tableElement,
            },
        };
    } else if (displayResult) {
        // Split result into lines and render each as a separate div for precise centering
        const resultLines = displayResult.split('\n');
        const resultLineElements = resultLines.map((line, idx) => ({
            type: 'div',
            props: {
                key: idx,
                style: {
                    whiteSpace: 'pre',
                },
                children: line,
            },
        }));
        
        resultBox = {
            type: 'div',
            props: {
                style: {
                    width: `${unifiedBoxWidth}px`,
                    background: COLORS.inputBg,
                    border: `3px solid ${COLORS.border}`,
                    borderRadius: '16px',
                    padding: `${boxPadding}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                },
                children: {
                    type: 'div',
                    props: {
                    style: {
                        fontSize: `${resultFontSize}px`,
                        color: COLORS.fg,
                        fontFamily: 'ArrayLang',
                        lineHeight: resultLineHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',  // Keep lines left-aligned relative to each other
                    },
                        children: resultLineElements,
                    },
                },
            },
        };
    }
    
    // Create the SVG using satori
    const satori = await getSatori();
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background: `linear-gradient(135deg, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientMid} 50%, ${COLORS.bgGradientEnd} 100%)`,
                    padding: `${PADDING}px`,
                    gap: `${gap}px`,
                },
                children: [header, codeBox, resultBox].filter(Boolean),
            },
        },
        {
            width: WIDTH,
            fonts: [
                {
                    name: 'ArrayLang',
                    data: fontData,
                    weight: 400,
                    style: 'normal',
                },
            ],
        }
    );
    
    // Convert SVG to PNG
    const resvg = new Resvg(svg, {
        background: COLORS.bgGradientStart,
        fitTo: {
            mode: 'width',
            value: WIDTH,
        },
    });
    
    const pngData = resvg.render();
    return pngData.asPng();
}

/**
 * Generate and save an OG image
 * @param {string} shortCode - The permalink code (e.g., 'wkZ7')
 * @param {string} code - The code snippet
 * @param {string} lang - The language
 * @param {string} [result] - Optional result to display (plain text)
 * @param {string} [resultHtml] - Optional HTML result (for TinyAPL tables)
 * @returns {Promise<string>} Path to the saved image
 */
async function generateAndSaveOGImage(shortCode, code, lang, result = null, resultHtml = null) {
    const ogDir = path.join(__dirname, '..', 'storage', 'og');
    
    // Ensure directory exists
    if (!fs.existsSync(ogDir)) {
        fs.mkdirSync(ogDir, { recursive: true });
    }
    
    const imagePath = path.join(ogDir, `${shortCode}.png`);
    const pngBuffer = await generateOGImage(code, lang, result, resultHtml);
    fs.writeFileSync(imagePath, pngBuffer);
    
    return imagePath;
}

module.exports = {
    generateOGImage,
    generateVerticalImage,
    generateAndSaveOGImage,
    getLangDisplayName,
};
