/**
 * Syntax highlighting for array languages
 * Provides syntax rules and highlighting functions for BQN, APL, J, and Uiua
 */

/**
 * Syntax highlighting token classifications for each language
 */
export const syntaxRules = {
    bqn: {
        // Functions (cyan) - primitive functions
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
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i,
        // User-defined identifier patterns (capitalized = function, _prefix = 1-mod, _prefix_suffix_ = 2-mod)
        identifierPatterns: {
            twoModifier: /^_[A-Za-z][A-Za-z0-9]*_/,   // _Name_ = 2-modifier
            oneModifier: /^_[A-Za-z][A-Za-z0-9]*/,    // _name = 1-modifier (checked after 2-mod)
            function: /^[A-Z][A-Za-z0-9]*/            // Name = function (capitalized)
        }
    },
    apl: {
        // Functions (cyan) - primitive functions
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
        // Functions (cyan) - J verbs (single character)
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
        // Monadic functions (cyan) - take 1 array argument
        monadic: [
            '¬', '±', '√', '○', '⌵', '⌈', '⌊', '⧻', '△', '⇡', '⊢', '⇌', 
            '♭', '¤', '⊚', '⊛', '◴', '⍏', '⍖', '⊝', 'ℂ', '⁅',
            '⍉', '⋯', '⍘', '⚙', '⸮', '⬛'
        ],
        // Dyadic functions (green) - take 2 array arguments
        functions: [
            '+', '-', '×', '÷', '◿', 'ⁿ', 'ₙ', '=', '≠', '<', '>', '≤', '≥',
            '↧', '↥', '∠', '∨', '⊻', '⊼', '⊽', '⊂', '⊏', '⊡', '↯', '☇',
            '↙', '↘', '↻', '⊗', '∈', '⊟', '▽', '◫', '▩', '⤸', '◠',
            '≍', '⌕', '⦷', '⨂', '⊥'
        ],
        // 1-modifiers (pink) - take 1 function argument
        // Matches uiuaGlyphs.monadicModifiers from keymap.js (popup source of truth)
        dyadic: [
            '˙', '˜', '⊙', '⋅', '⟜', '⊸', '⤙', '⤚', '◡', '∩',
            '≡', '⍚', '⊞', '⧅', '⧈', '⊕', '⊜',
            '/', '∧', '\\', '⍥',
            '⌅', '°', '⌝',
            '⧋', '◇'
        ],
        // 2-modifiers (yellow) - take 2+ function arguments
        // Matches uiuaGlyphs.dyadicModifiers from keymap.js (popup source of truth)
        modifier: [
            '⊃', '⊓', '⍜', '⍢', '⬚', '⨬'
        ],
        // Constants/number literals (purple)
        constants: [
            'η', 'π', 'τ', '∞', '¯'
        ],
        // Comments (grey)
        comments: [
            '#'
        ],
        // Subscript characters (should inherit color from preceding glyph)
        subscripts: '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ',
        // Numbers pattern
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    },
    kap: {
        // Functions (cyan) - scalar and structural functions
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
    },
    tinyapl: {
        // Functions (cyan) - primitive functions
        // Based on https://beta.tinyapl.rubenverg.com/
        functions: [
            // Arithmetic
            '+', '-', '×', '÷', '*', '⍟', '√', '⌊', '⌈', '⸠', '⌹', '!', '|',
            // Complex numbers
            '⊕', '⊗', '∡', 'ℜ', 'ℑ', '⧺', 'ⵧ', '⊥', '⊤',
            // Comparison
            '=', '≠', '<', '≤', '≥', '>', '≡', '≢', '⊲', '⊴', '⊵', '⊳', '≈',
            // Logic
            '∧', '∨', '⍲', '⍱', '~',
            // Set operations
            '∪', '∩', '§',
            // Property functions
            '⍳', '⍸', '∊', '⍷', '⋷', '⋵', '⍴', 'ϼ',
            // Array creation
            '?', '…', '⍮', '‥', '߹',
            // Manipulation
            '↑', '↓', '⊂', '⊆', '⫇', '⍋', '⍒', '⌿', ',', '⍪', '⌽', '⍉',
            // Lookup
            '⊃', '⊇', '⌷', '⊢', '⊣',
            // Misc
            '⍎', '⍕', '↗', '⇂', '↾', '⊏', '⊐',
            // New in 0.13
            '⨳', '⩔', '⩓'
        ],
        // 1-modifiers (green) - operators/adverbs
        monadic: [
            '/', '\\', '¨', 'ᐵ', 'ᑈ', 'ᑣ', 'ᑒ', '∙', '⊞', '◡', '◠',
            'ᓗ', 'ᓚ', '⌓', '⌸', '⌺', '∵', '⫤',
            // New in 0.13
            '˝', '⥼', '⥽', '⍦', '⑴', '⤺'
        ],
        // 2-modifiers (yellow) - combinators/conjunctions
        dyadic: [
            '⍨', '∘', '⍛', '⊸', '⟜', '⸚', '«', '»', '⇾', '⇽', '⫣', '⊩',
            '⍤', '⍥', '⍣', '⁖', '⍢', '⎊', '@', '≈', '⬚',
            // New in 0.13
            '○', '⍜', '⍫'
        ],
        // Constants/number literals (purple)
        constants: [
            '¯', '∞', '⍬', '∻', '⦻', '∅'
        ],
        // Comments (grey)
        comments: [
            '⍝'
        ],
        // Block comments (grey) - inline comments with start/end delimiters
        blockComment: {
            start: '⟃',
            end: '⟄'
        },
        // Syntax elements (not highlighted - left as default)
        // '←', '→', '⍺', '⍵', '⍶', '⍹', '∇', '⋄', ':', '■', '⟨', '⟩', '⦅', '⦆', '⎕', '⍞', '⏨', 'ᴊ'
        // Numbers pattern (TinyAPL uses ¯ for negative, ∞ for infinity, ⏨ for exponent, ᴊ for complex)
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(⏨[+-]?\d+)?(ᴊ¯?\d+\.?\d*)?/i,
        // User-defined identifier patterns (capitalized = function, _prefix = 1-mod, _prefix_suffix_ = 2-mod)
        identifierPatterns: {
            twoModifier: /^_[A-Za-z][A-Za-z0-9]*_/,   // _Name_ = 2-modifier
            oneModifier: /^_[A-Za-z][A-Za-z0-9]*/,    // _name = 1-modifier (checked after 2-mod)
            function: /^[A-Z][A-Za-z0-9]*/            // Name = function (capitalized)
        }
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
        
        // Check for user-defined identifier patterns (BQN, TinyAPL)
        // Capitalized = function, _prefix = 1-modifier, _prefix_suffix_ = 2-modifier
        if (rules.identifierPatterns) {
            // Check 2-modifier first (more specific pattern)
            const twoModMatch = remainingText.match(rules.identifierPatterns.twoModifier);
            if (twoModMatch) {
                tokens.push({ type: 'dyadic', value: twoModMatch[0] });
                lastGlyphType = 'dyadic';
                i += twoModMatch[0].length;
                continue;
            }
            
            // Check 1-modifier (underscore prefix only)
            const oneModMatch = remainingText.match(rules.identifierPatterns.oneModifier);
            if (oneModMatch) {
                tokens.push({ type: 'monadic', value: oneModMatch[0] });
                lastGlyphType = 'monadic';
                i += oneModMatch[0].length;
                continue;
            }
            
            // Check function (capitalized word)
            const funcMatch = remainingText.match(rules.identifierPatterns.function);
            if (funcMatch) {
                tokens.push({ type: 'function', value: funcMatch[0] });
                lastGlyphType = 'function';
                i += funcMatch[0].length;
                continue;
            }
        }
        
        // For Uiua: Check for subscript characters - inherit color from preceding glyph
        if (language === 'uiua' && rules.subscripts && rules.subscripts.includes(char)) {
            tokens.push({ type: lastGlyphType, value: char });
            i++;
            continue;
        }
        
        // Check for block comments (TinyAPL ⟃...⟄)
        // Everything from start to end delimiter (or end of text) is a comment
        if (rules.blockComment && char === rules.blockComment.start) {
            const endPos = text.indexOf(rules.blockComment.end, i + 1);
            const commentEnd = endPos === -1 ? text.length : endPos + 1;
            const commentText = text.substring(i, commentEnd);
            tokens.push({ type: 'comment', value: commentText });
            lastGlyphType = 'comment';
            i = commentEnd;
            continue;
        }
        
        // Check for single-character comment primitives (BQN #, APL/Kap/TinyAPL ⍝)
        // Everything from the comment character to end of line is a comment
        if (rules.comments && rules.comments.includes(char)) {
            // Find the end of the line
            const lineEnd = text.indexOf('\n', i);
            const commentEnd = lineEnd === -1 ? text.length : lineEnd;
            const commentText = text.substring(i, commentEnd);
            tokens.push({ type: 'comment', value: commentText });
            lastGlyphType = 'comment';
            i = commentEnd;
            continue;
        }
        
        // Check for multi-character operators (J language)
        if (language === 'j' && rules.multiChar) {
            // Try longest matches first (3-char, then 2-char)
            let matched = false;
            
            for (const len of [3, 2]) {
                if (i + len > text.length) continue;
                const substr = text.substring(i, i + len);
                
                // Check comments first (NB.) - capture rest of line as comment
                if (rules.multiChar.comments && rules.multiChar.comments.includes(substr)) {
                    const lineEnd = text.indexOf('\n', i);
                    const commentEnd = lineEnd === -1 ? text.length : lineEnd;
                    const commentText = text.substring(i, commentEnd);
                    tokens.push({ type: 'comment', value: commentText });
                    lastGlyphType = 'comment';
                    i = commentEnd;
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
        // Note: Single-char comments (like # or ⍝) are handled earlier with full line capture
        if (rules.constants && rules.constants.includes(char)) {
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
    
    // Build HTML - map token types to CSS classes based on language
    return tokens.map(token => {
        const escaped = escapeHtml(token.value);
        const cssClass = getTokenCssClass(token.type, language);
        
        if (cssClass) {
            return `<span class="${cssClass}">${escaped}</span>`;
        } else {
            return escaped;
        }
    }).join('');
}

/**
 * Map token type to CSS class based on language
 * Uiua has different semantics (monadic/dyadic functions AND modifiers)
 * Other languages have functions + monadic/dyadic modifiers
 * @param {string} tokenType - Token type from parser
 * @param {string} language - Language identifier
 * @returns {string|null} CSS class name or null for default
 */
function getTokenCssClass(tokenType, language) {
    // Shared classes
    if (tokenType === 'number') return 'syntax-number';
    if (tokenType === 'comment') return 'syntax-comment';
    if (tokenType === 'default') return null;
    
    if (language === 'uiua') {
        // Uiua: distinguishes monadic/dyadic for both functions and modifiers
        // monadic = monadic functions, functions = dyadic functions
        // dyadic = 1-modifiers, modifier = 2-modifiers
        if (tokenType === 'monadic') return 'syntax-uiua-function-monadic';
        if (tokenType === 'function') return 'syntax-uiua-function-dyadic';
        if (tokenType === 'dyadic') return 'syntax-uiua-modifier-monadic';
        if (tokenType === 'modifier') return 'syntax-uiua-modifier-dyadic';
    } else {
        // Other languages (APL, BQN, J, Kap, TinyAPL)
        // functions = all functions, monadic = 1-modifiers, dyadic = 2-modifiers
        if (tokenType === 'function') return 'syntax-function';
        if (tokenType === 'monadic') return 'syntax-modifier-monadic';
        if (tokenType === 'dyadic') return 'syntax-modifier-dyadic';
    }
    
    return null;
}

/**
 * Get syntax class for a single symbol
 * This is the single source of truth for syntax classification
 * @param {string} symbol - Single character to classify
 * @param {string} language - Language identifier ('bqn', 'apl', 'j', 'uiua', 'kap')
 * @returns {string} CSS class name (e.g., 'syntax-function', 'syntax-modifier-monadic', etc.)
 */
export function getSyntaxClass(symbol, language) {
    if (!symbol) return 'syntax-default';
    
    const rules = syntaxRules[language];
    if (!rules) return 'syntax-default';
    
    // Shared classifications
    if (rules.comments && rules.comments.includes(symbol)) {
        return 'syntax-comment';
    }
    // Block comment delimiters (TinyAPL ⟃ ⟄)
    if (rules.blockComment && (symbol === rules.blockComment.start || symbol === rules.blockComment.end)) {
        return 'syntax-comment';
    }
    if (rules.constants && rules.constants.includes(symbol)) {
        return 'syntax-number';
    }
    
    // Language-specific classifications
    if (language === 'uiua') {
        // Uiua: monadic/dyadic functions AND monadic/dyadic modifiers
        if (rules.monadic && rules.monadic.includes(symbol)) {
            return 'syntax-uiua-function-monadic';
        }
        if (rules.functions && rules.functions.includes(symbol)) {
            return 'syntax-uiua-function-dyadic';
        }
        if (rules.dyadic && rules.dyadic.includes(symbol)) {
            return 'syntax-uiua-modifier-monadic';
        }
        if (rules.modifier && rules.modifier.includes(symbol)) {
            return 'syntax-uiua-modifier-dyadic';
        }
    } else {
        // Other languages: functions + monadic/dyadic modifiers
        if (rules.functions && rules.functions.includes(symbol)) {
            return 'syntax-function';
        }
        if (rules.monadic && rules.monadic.includes(symbol)) {
            return 'syntax-modifier-monadic';
        }
        if (rules.dyadic && rules.dyadic.includes(symbol)) {
            return 'syntax-modifier-dyadic';
        }
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
