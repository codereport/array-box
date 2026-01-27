/**
 * Syntax highlighting for array languages
 * Provides syntax rules and highlighting functions for BQN, APL, J, and Uiua
 */

/**
 * Syntax highlighting token classifications for each language
 */
export const syntaxRules = {
    bqn: {
        // Functions (blue) - primitive functions
        functions: [
            '+', '-', '×', '÷', '⋆', '√', '⌊', '⌈', '|', '¬', '∧', '∨',
            '<', '>', '≠', '=', '≤', '≥', '≡', '≢',
            '⊣', '⊢', '⥊', '∾', '≍', '⋈', '↑', '↓', '↕', '«', '»',
            '⌽', '⍉', '/', '⊏', '⊐', '⊑', '⊒', '⊔', '!',
            '∊', '⍷', '⍋', '⍒'
        ],
        // 1-modifiers (green) - monadic operators/adverbs
        monadic: [
            '˜', '˘', '¨', '⌜', '⁼', '´', '˝', '`'
        ],
        // 2-modifiers (yellow) - dyadic operators/conjunctions  
        dyadic: [
            '∘', '○', '⊸', '⟜', '⌾', '⊘', '◶', '⎉', '⚇', '⍟'
        ],
        // Constants/number literals (purple) - used in numeric literals or represent constants
        constants: [
            '∞', '¯', 'π'
        ],
        // Comments (grey)
        comments: [
            '#'
        ],
        // Numbers pattern (no global flag - we check index manually)
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    },
    apl: {
        // Functions (blue) - primitive functions
        // Categories based on APL Wiki (https://aplwiki.com/wiki/Dyalog_APL):
        // - Arithmetic: +, -, ×, ÷, |, ⌊, ⌈, *, ⍟, !, ○
        // - Logic: ~, ?, ∧, ∨, ⍲, ⍱
        // - Comparison: <, ≤, =, ≥, >, ≠, ≡, ≢
        // - Structural: ⍴, ,, ⍪, ⌽, ⊖, ⍉, ↑, ↓, ⊂, ⊆, ∊, ⊃, ∩, ∪, ⊣, ⊢
        // - Search/Index: ⍳, ⍸, ⍒, ⍋, ⍷
        // - Numeric: ⊥, ⊤, ⌹
        // - I/O: ⍎, ⍕, ⌷
        functions: [
            '+', '-', '×', '÷', '⌈', '⌊', '|', '!', '○', '*', '⍟', '?', '~',
            '<', '>', '=', '≠', '≤', '≥', '≡', '≢', '∧', '∨', '⍲', '⍱',
            '⍴', '⍳', ',', '⍪', '⌽', '⊖', '⍉', '↑', '↓', '⊂', '⊃', '⌷',
            '⊣', '⊢', '∪', '∩', '⊥', '⊤', '⍋', '⍒', '∊', '⍷', '⍸', '⊆',
            '⎕', '⍎', '⍕', '⍬', '∆', '∇', '⍞',
            '⌹'  // Matrix Inverse / Matrix Divide
        ],
        // 1-modifiers (green) - monadic operators/adverbs
        monadic: [
            '/', '\\', '⌿', '⍀', '¨', '⍨'
        ],
        // 2-modifiers (yellow) - dyadic operators/conjunctions
        dyadic: [
            '∘', '.', '⍤', '⍥', '⍣', '@', '⍠', '⌸', '⌺', '⌶', '⍛'
        ],
        // Constants/number literals (purple)
        constants: [
            '¯'
        ],
        // Comments (grey)
        comments: [
            '⍝'
        ],
        // Numbers pattern
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    },
    j: {
        // Functions (blue) - J verbs (single character)
        functions: [
            '+', '-', '*', '%', '^', '$', '~', '|', ',', ';', '#',
            '{', '}', '[', ']', '"', '?', '!'
        ],
        // 1-modifiers / Adverbs (green) - single character
        monadic: [
            '/', '\\'
        ],
        // 2-modifiers / Conjunctions (yellow) - single character
        dyadic: [
            '@', '&', '`', ':'
        ],
        // Comparison verbs (also functions)
        comparison: ['<', '>', '='],
        // Multi-char tokens for J - digraphs ending in . or :
        multiChar: {
            // Verbs with . suffix
            functions: [
                // Structural/selection verbs
                '{.', '}.', '{:', '}:', ',.', ',:', '{::', 
                // Math verbs
                '<.', '>.', '+.', '*.', '-.', '%.', '^.', '|.',
                '$.',  '~.', '#.', '#:',
                // Comparison/logic
                '<:', '>:', '+:', '*:', '-:', '%:', '~:', '=.',
                // Special verbs
                '?.', '?:', '".', '":', '!.',
                // Named primitives
                'i.', 'i:', 'j.', 'o.', 'p.', 'p:', 'q.', 'q:', 'r.',
                'A.', 'C.', 'e.', 'E.', 'I.', 'L.', 's:', 'S:', 'u:', 'x:',
                // Control
                '$:', '[:', '_.'
            ],
            // Adverbs with . or : suffix
            monadic: [
                '/.', '\\.', 
                'b.', 'f.', 'M.',
                't.', 't:'
            ],
            // Conjunctions with . or : suffix
            dyadic: [
                '@.', '@:', '&.', '&:',
                '!:', 
                'd.', 'D.', 'D:',
                'F.', 'F:', 'F..', 'F.:' , 'F:.', 'F::',
                'H.', 'L:', 'S:', 'T.',
                '^:', '`:', '".'
            ],
            // Comments
            comments: [
                'NB.'
            ]
        },
        // Numbers pattern (J uses _ for negative, also infinity)
        numberPattern: /^_?(\d+\.?\d*|\.\d+)([ejrx][+-]?\d+\.?\d*)?/i
    },
    uiua: {
        // Monadic functions (green) - take 1 array argument
        monadic: [
            '¬', '±', '√', '○', '⌵', '⌈', '⌊', '⧻', '△', '⇡', '⊢', '⇌', 
            '♭', '¤', '⊚', '⊛', '◴', '⍏', '⍖', '⊝', 'ℂ', '⁅',
            '⍉', '⋯', '⍘', '⚙', '⸮', '⬛'
        ],
        // Dyadic functions (blue) - take 2 array arguments
        functions: [
            '+', '-', '×', '÷', '◿', 'ⁿ', 'ₙ', '=', '≠', '<', '>', '≤', '≥',
            '↧', '↥', '∠', '∨', '⊻', '⊼', '⊽', '⊂', '⊏', '⊡', '↯', '☇',
            '↙', '↘', '↻', '⊗', '∈', '⊟', '▽', '◫', '▩', '⤸', '◠',
            '≍', '⌕', '⦷', '⨂', '⊥'
        ],
        // 1-modifiers (yellow) - take 1 function argument
        // Matches uiuaGlyphs.monadicModifiers from keymap.js (popup source of truth)
        dyadic: [
            '˙', '˜', '⊙', '⋅', '⟜', '⊸', '⤙', '⤚', '◡', '∩',
            '≡', '⍚', '⊞', '⧅', '⧈', '⊕', '⊜',
            '/', '∧', '\\', '⍥',
            '⌅', '°', '⌝',
            '⧋', '◇'
        ],
        // 2-modifiers (pink) - take 2+ function arguments
        // Matches uiuaGlyphs.dyadicModifiers from keymap.js (popup source of truth)
        modifier: [
            '⊃', '⊓', '⍜', '⍢', '⬚', '⨬'
        ],
        // Constants/number literals (purple)
        constants: [
            'η', 'π', 'τ', '∞', '¯'
        ],
        // Subscript characters (should inherit color from preceding glyph)
        subscripts: '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ',
        // Numbers pattern
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    },
    kap: {
        // Functions (blue) - scalar and structural functions
        functions: [
            // Scalar functions (arithmetic, comparison, logical)
            '+', '-', '×', '÷', '|', '⋆', '⍟', '=', '≠', '<', '>', '≤', '≥',
            '∧', '∨', '⍲', '⍱', '~', '√', '⌊', '⌈', '!',
            // Structural functions
            '⍴', '⍳', '⊢', '⊣', '⌷', '⊂', '⊃', ',', '⍪', '⍮', '↑', '↓',
            '?', '⌽', '⊖', '⍉', '∊', '⍷', '⍋', '⍒', '⍕', '⍎', '%',
            '⊆', '⊇', '⫇', '⍸', '∪', '⊤', '⊥', '∩', '⌸', '⌹', '…',
            // Reduce/replicate (as functions)
            '/', '⌿',
            // Comparison functions
            '≡', '≢',
            // Flow control
            '→',
            // Specialized functions
            '≬'
        ],
        // 1-modifiers (green) - operators/adverbs
        monadic: [
            '¨', '⍨', '\\', '⍀', '⍤', '∵', '∥', '˝', '⍰'
        ],
        // 2-modifiers (yellow) - compositional operators
        dyadic: [
            '∘', '⍛', '⍥', '⍢', '«', '»', '∙', '⌻', '⍣'
        ],
        // Constants/number literals (purple)
        constants: [
            '¯', '⍬'
        ],
        // Comments (grey)
        comments: [
            '⍝'
        ],
        // Syntax/special elements (not highlighted differently)
        // '←', '⇐', '∇', 'λ', '⍞', '⍺', '⍵', '⎕', '⋄' - left as default
        // Numbers pattern (Kap uses ¯ for negative)
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    }
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Apply syntax highlighting to code
 * @param {string} text - Code to highlight
 * @param {string} language - Language identifier ('bqn', 'apl', 'j', 'uiua')
 * @returns {string} HTML with syntax highlighting spans
 */
export function highlightCode(text, language) {
    if (!text || !syntaxRules[language]) {
        return escapeHtml(text);
    }
    
    const rules = syntaxRules[language];
    const tokens = [];
    let i = 0;
    let lastGlyphType = 'default'; // Track last glyph type for subscript inheritance
    
    while (i < text.length) {
        const remainingText = text.substring(i);
        const char = text[i];
        
        // Check for numbers first (including negative numbers with ¯ or _)
        const numberMatch = remainingText.match(rules.numberPattern);
        if (numberMatch) {
            tokens.push({
                type: 'number',
                value: numberMatch[0]
            });
            lastGlyphType = 'number';
            i += numberMatch[0].length;
            continue;
        }
        
        // For Uiua: Check for subscript characters - inherit color from preceding glyph
        if (language === 'uiua' && rules.subscripts && rules.subscripts.includes(char)) {
            tokens.push({ type: lastGlyphType, value: char });
            i++;
            continue;
        }
        
        // Check for multi-character operators (J language)
        if (language === 'j' && rules.multiChar) {
            // Try longest matches first (3-char, then 2-char)
            let matched = false;
            
            for (const len of [3, 2]) {
                if (i + len > text.length) continue;
                const substr = text.substring(i, i + len);
                
                // Check comments first (NB.)
                if (rules.multiChar.comments && rules.multiChar.comments.includes(substr)) {
                    tokens.push({ type: 'comment', value: substr });
                    lastGlyphType = 'comment';
                    i += len;
                    matched = true;
                    break;
                } else if (rules.multiChar.functions.includes(substr)) {
                    tokens.push({ type: 'function', value: substr });
                    lastGlyphType = 'function';
                    i += len;
                    matched = true;
                    break;
                } else if (rules.multiChar.monadic.includes(substr)) {
                    tokens.push({ type: 'monadic', value: substr });
                    lastGlyphType = 'monadic';
                    i += len;
                    matched = true;
                    break;
                } else if (rules.multiChar.dyadic.includes(substr)) {
                    tokens.push({ type: 'dyadic', value: substr });
                    lastGlyphType = 'dyadic';
                    i += len;
                    matched = true;
                    break;
                }
            }
            
            if (matched) continue;
        }
        
        // Check single character
        if (rules.comments && rules.comments.includes(char)) {
            // Comments are grey
            tokens.push({ type: 'comment', value: char });
            lastGlyphType = 'comment';
        } else if (rules.constants && rules.constants.includes(char)) {
            // Constants like ∞, ¯, π are colored like numbers (purple)
            tokens.push({ type: 'number', value: char });
            lastGlyphType = 'number';
        } else if (rules.functions && rules.functions.includes(char)) {
            tokens.push({ type: 'function', value: char });
            lastGlyphType = 'function';
        } else if (rules.monadic && rules.monadic.includes(char)) {
            tokens.push({ type: 'monadic', value: char });
            lastGlyphType = 'monadic';
        } else if (rules.modifier && rules.modifier.includes(char)) {
            tokens.push({ type: 'modifier', value: char });
            lastGlyphType = 'modifier';
        } else if (rules.dyadic && rules.dyadic.includes(char)) {
            tokens.push({ type: 'dyadic', value: char });
            lastGlyphType = 'dyadic';
        } else if (rules.comparison && rules.comparison.includes(char)) {
            // J comparison verbs
            tokens.push({ type: 'function', value: char });
            lastGlyphType = 'function';
        } else {
            tokens.push({ type: 'default', value: char });
            // Don't reset lastGlyphType for whitespace/default chars
            // so subscripts after spaces still work
        }
        
        i++;
    }
    
    // Build HTML
    return tokens.map(token => {
        const escaped = escapeHtml(token.value);
            
        if (token.type === 'number') {
            return `<span class="syntax-number">${escaped}</span>`;
        } else if (token.type === 'function') {
            return `<span class="syntax-function">${escaped}</span>`;
        } else if (token.type === 'monadic') {
            return `<span class="syntax-monadic">${escaped}</span>`;
        } else if (token.type === 'modifier') {
            return `<span class="syntax-modifier">${escaped}</span>`;
        } else if (token.type === 'dyadic') {
            return `<span class="syntax-dyadic">${escaped}</span>`;
        } else if (token.type === 'comment') {
            return `<span class="syntax-comment">${escaped}</span>`;
        } else {
            return escaped;
        }
    }).join('');
}

/**
 * Get syntax class for a single symbol
 * This is the single source of truth for syntax classification
 * @param {string} symbol - Single character to classify
 * @param {string} language - Language identifier ('bqn', 'apl', 'j', 'uiua', 'kap')
 * @returns {string} CSS class name (e.g., 'syntax-function', 'syntax-monadic', etc.)
 */
export function getSyntaxClass(symbol, language) {
    if (!symbol) return 'syntax-default';
    
    const rules = syntaxRules[language];
    if (!rules) return 'syntax-default';
    
    if (rules.comments && rules.comments.includes(symbol)) {
        return 'syntax-comment';
    }
    if (rules.constants && rules.constants.includes(symbol)) {
        return 'syntax-number';
    }
    if (rules.functions && rules.functions.includes(symbol)) {
        return 'syntax-function';
    }
    if (rules.monadic && rules.monadic.includes(symbol)) {
        return 'syntax-monadic';
    }
    if (rules.dyadic && rules.dyadic.includes(symbol)) {
        return 'syntax-dyadic';
    }
    if (rules.modifier && rules.modifier.includes(symbol)) {
        return 'syntax-modifier';
    }
    
    return 'syntax-default';
}

// Default export for convenience
export default {
    syntaxRules,
    highlightCode,
    escapeHtml,
    getSyntaxClass
};
