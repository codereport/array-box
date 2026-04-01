/**
 * Syntax highlighting for array languages
 * Provides syntax rules and highlighting functions for BQN, APL, J, and Uiua
 */

/**
 * Syntax highlighting token classifications for each language
 */
export const syntaxRules = {
    bqn: {
        // String delimiter (double quote) - BQN uses " for strings, ' for characters
        stringDelimiter: '"',
        charDelimiter: "'",
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
        // String delimiter (single quote) - APL uses ' for strings, doubled for escape: 'it''s'
        stringDelimiter: "'",
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
        stringDelimiter: "'",
        // Functions (cyan) - J verbs (single character)
        functions: [
            '+', '-', '*', '%', '^', '$', '|', ',', ';', '#',
            '{', '}', '[', ']', '"', '?', '!'
        ],
        // 1-modifiers / Adverbs (green) - single character
        monadic: [
            '/', '\\', '~'
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
                '{.', '}.', '{:', '}:', ',.', ',:', '{::', '/:', '\\:',
                // Math verbs
                '<.', '>.', '+.', '*.', '-.', '%.', '^.', '|.', '|:',
                '$.',  '~.', '#.', '#:',
                // Comparison/logic
                '<:', '>:', '+:', '*:', '-:', '%:', '~:', '=.',
                // Special verbs
                '?.', '?:', '".', '":', '!.',
                // Named primitives
                'i.', 'i:', 'j.', 'o.', 'p.', 'p:', 'q.', 'q:', 'r.',
                'A.', 'C.', 'e.', 'E.', 'I.', 'L.', 's:', 'u:', 'x:',
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
        // String delimiter (double quote) - Uiua uses " for strings, @ for character literals
        stringDelimiter: '"',
        charPrefix: '@',
        // Monadic functions (cyan) - take 1 array argument
        monadic: [
            '¬', '±', '√', '⌵', '⌈', '⌊', '⧻', '△', '⇡', '⊢', '⊣', '⇌',
            '♭', '¤', '⊚', '⊛', '◴', '⍏', '⍖', '⁅',
            '⍉', '⋯', '⨪', 'ₑ', '∿', '⍆', '⧆', '◰', '□', '⋕'
        ],
        // Dyadic functions (green) - take 2 array arguments
        functions: [
            '+', '-', '×', '÷', '◿', 'ⁿ', '=', '≠', '<', '>', '≤', '≥',
            '↧', '↥', '∠', '∨', 'ℂ', '⊂', '⊏', '⊡', '↯', '☇',
            '↙', '↘', '↻', '⊗', '∊', '⊟', '▽', '◫', '⤸',
            '≍', '⌕', '⦷', '⨂', '⊥'
        ],
        // 1-modifiers (pink) - take 1 function argument
        // Matches uiuaGlyphs.monadicModifiers from keymap.js (popup source of truth)
        dyadic: [
            '∘', '◌', '˙', '˜', '⊙', '⋅', '⟜', '⊸', '⤙', '⤚', '◠', '◡', '∩',
            '≡', '∵', '⍚', '⊞', '⧅', '⧈', '⊕', '⊜',
            '/', '∧', '\\', '⍥',
            '⌅', '°', '⌝',
            '⧋', '◇', '∪', '⍩'
        ],
        // 2-modifiers (yellow) - take 2+ function arguments
        // Matches uiuaGlyphs.dyadicModifiers from keymap.js (popup source of truth)
        modifier: [
            '⊃', '⊓', '⍜', '⍢', '⬚', '⨬', '⍣'
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
        // Numbers pattern — _ is Uiua's array separator (2_3 ≡ [2 3])
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(_¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?)*/i
    },
    kap: {
        // String delimiter (single quote) - Kap uses ' for strings like APL
        stringDelimiter: '"',
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
        // String delimiters - TinyAPL uses both ' (char vectors) and " (strings with escapes)
        stringDelimiters: ["'", '"'],
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
        // Only match if the digit is NOT continuing an identifier (e.g. IO, var2)
        const prevChar = i > 0 ? text[i - 1] : '';
        const isPartOfIdentifier = /[A-Za-z0-9_]/.test(prevChar);
        const numberMatch = !isPartOfIdentifier && remainingText.match(rules.numberPattern);
        if (numberMatch) {
            tokens.push({
                type: 'number',
                value: numberMatch[0]
            });
            lastGlyphType = 'number';
            i += numberMatch[0].length;
            continue;
        }
        
        // Check for strings
        // Support both single stringDelimiter and array of stringDelimiters
        const stringDelimiters = rules.stringDelimiters || (rules.stringDelimiter ? [rules.stringDelimiter] : []);
        if (stringDelimiters.includes(char)) {
            const delimiter = char;
            let stringEnd = i + 1;
            let isComplete = false;
            
            // For single-quote delimiters (APL, Kap), doubled quotes are escapes
            // For double-quote delimiters (BQN, Uiua) and TinyAPL strings, backslash/⍘ is escape
            // TinyAPL: ' uses doubled escapes, " uses ⍘ escape
            const useDoubleEscape = delimiter === "'" && language !== 'bqn';
            const escapeChar = language === 'tinyapl' && delimiter === '"' ? '⍘' : '\\';
            
            while (stringEnd < text.length) {
                const c = text[stringEnd];
                if (c === delimiter) {
                    if (useDoubleEscape && stringEnd + 1 < text.length && text[stringEnd + 1] === delimiter) {
                        // Doubled delimiter is escape, skip both
                        stringEnd += 2;
                        continue;
                    }
                    // Found closing delimiter
                    isComplete = true;
                    stringEnd++; // Include the closing delimiter
                    break;
                } else if (!useDoubleEscape && c === escapeChar && stringEnd + 1 < text.length) {
                    // Escape character, skip next character
                    stringEnd += 2;
                } else if (c === '\n') {
                    // Newline typically ends an incomplete string (except in multiline strings)
                    break;
                } else {
                    stringEnd++;
                }
            }
            
            const stringValue = text.substring(i, stringEnd);
            tokens.push({
                type: isComplete ? 'string' : 'string-incomplete',
                value: stringValue
            });
            lastGlyphType = isComplete ? 'string' : 'string-incomplete';
            i = stringEnd;
            continue;
        }
        
        // Check for BQN character literals ('x')
        if (language === 'bqn' && rules.charDelimiter && char === rules.charDelimiter) {
            // BQN character literal: 'x' (single char after ')
            // The quote itself plus one character
            let charEnd = i + 1;
            let isComplete = false;
            
            if (charEnd < text.length && text[charEnd] !== '\n') {
                charEnd++; // Include the character
                isComplete = true;
            }
            
            const charValue = text.substring(i, charEnd);
            tokens.push({
                type: isComplete ? 'string' : 'string-incomplete',
                value: charValue
            });
            lastGlyphType = isComplete ? 'string' : 'string-incomplete';
            i = charEnd;
            continue;
        }
        
        // Check for Uiua character literals (@x)
        if (language === 'uiua' && rules.charPrefix && char === rules.charPrefix) {
            // Uiua character literal: @x (single char after @)
            let charEnd = i + 1;
            let isComplete = false;
            
            if (charEnd < text.length && text[charEnd] !== '\n' && text[charEnd] !== ' ') {
                charEnd++; // Include the character
                isComplete = true;
            }
            
            const charValue = text.substring(i, charEnd);
            tokens.push({
                type: isComplete ? 'string' : 'string-incomplete',
                value: charValue
            });
            lastGlyphType = isComplete ? 'string' : 'string-incomplete';
            i = charEnd;
            continue;
        }
        
        // Check for system functions (⎕Name) in APL-family languages (APL, TinyAPL, Kap)
        // These are highlighted as functions including the leading ⎕
        if ((language === 'apl' || language === 'tinyapl' || language === 'kap') && char === '⎕') {
            // Match ⎕ followed by alphanumeric identifier (system function name)
            const sysMatch = remainingText.match(/^⎕[A-Za-z][A-Za-z0-9]*/);
            if (sysMatch) {
                tokens.push({ type: 'function', value: sysMatch[0] });
                lastGlyphType = 'function';
                i += sysMatch[0].length;
                continue;
            }
            // Just ⎕ alone - still a function (I/O)
            tokens.push({ type: 'function', value: char });
            lastGlyphType = 'function';
            i++;
            continue;
        }
        
        // Check for system functions (•Name) in BQN
        // These are highlighted as functions including the leading •
        if (language === 'bqn' && char === '•') {
            // Match • followed by alphanumeric identifier (system function name)
            const sysMatch = remainingText.match(/^•[A-Za-z][A-Za-z0-9]*/);
            if (sysMatch) {
                tokens.push({ type: 'function', value: sysMatch[0] });
                lastGlyphType = 'function';
                i += sysMatch[0].length;
                continue;
            }
            // Just • alone - still a function
            tokens.push({ type: 'function', value: char });
            lastGlyphType = 'function';
            i++;
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
        
        // J explicit definition delimiters {{ }} — plain/default, not function-colored
        if (language === 'j' && i + 1 < text.length) {
            const pair = text[i] + text[i + 1];
            if (pair === '{{' || pair === '}}') {
                tokens.push({ type: 'default', value: pair });
                i += 2;
                continue;
            }
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
    if (tokenType === 'string') return 'syntax-string';
    if (tokenType === 'string-incomplete') return 'syntax-string-incomplete';
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

/**
 * Detect if output is a train tree vs regular boxed array display.
 *
 * J's (9!:3)4 and APL's ]boxing -trains=tree both use box-drawing chars,
 * but so does regular boxed noun output. We distinguish them:
 *
 *  - J verb trees contain only primitive tokens (symbols like +, i., @:).
 *    Boxed noun output contains data (digits, multi-letter strings).
 *  - APL fork trees have ┼ on the same line as ┌ (e.g. ┌─┼─┐).
 *    Boxed arrays never place ┼ on a ┌-line.
 *
 * @param {string} text     - the raw output text
 * @param {string} language - 'j' | 'apl' (other languages return false)
 */
export function isTrainTree(text, language) {
    if (!text || typeof text !== 'string') return false;
    if (!/[┌┐└┘─┼│├┤┬┴]/.test(text)) return false;

    if (language === 'j') {
        // Strip box-drawing and whitespace to get cell content only.
        const content = text.replace(/[┌┐└┘─┬┴│├┤┼\s]/g, '');
        if (!content) return false;
        // Digits never appear inside J verb-tree cells.
        if (/\d/.test(content)) return false;
        // Remove recognised multi-char primitives (letter(s) + dot/colon: i., E., s:, …).
        const rest = content.replace(/[a-zA-Z]+[.:]/g, '');
        // Any remaining letters are data, not J primitives.
        if (/[a-zA-Z]/.test(rest)) return false;
        return true;
    }

    if (language === 'apl') {
        // APL fork trees use ┼ at the junction: ┌─┼─┐
        // In boxed arrays ┼ only appears on ├-lines, never on ┌-lines.
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.includes('┌') && line.includes('┼')) return true;
        }
        return false;
    }

    return false;
}


/**
 * Highlight primitives in train tree output. Box-drawing and whitespace stay plain.
 * Handles J multi-char tokens (e.g. i., @:, NB.) as well as single-char glyphs.
 */
export function highlightTrainTreeGlyphs(text, language = 'apl') {
    if (!text || typeof text !== 'string') return '';
    const rules = syntaxRules[language];
    const parts = [];
    for (let i = 0; i < text.length; i++) {
        // For J, try multi-char tokens first (3-char, then 2-char)
        if (language === 'j' && rules && rules.multiChar) {
            let matched = false;
            for (const len of [3, 2]) {
                if (i + len > text.length) continue;
                const substr = text.substring(i, i + len);
                let cls = null;
                if (rules.multiChar.functions && rules.multiChar.functions.includes(substr)) {
                    cls = 'syntax-function';
                } else if (rules.multiChar.monadic && rules.multiChar.monadic.includes(substr)) {
                    cls = 'syntax-modifier-monadic';
                } else if (rules.multiChar.dyadic && rules.multiChar.dyadic.includes(substr)) {
                    cls = 'syntax-modifier-dyadic';
                }
                if (cls) {
                    parts.push(`<span class="${cls}">${escapeHtml(substr)}</span>`);
                    i += len - 1;
                    matched = true;
                    break;
                }
            }
            if (matched) continue;
        }

        // Try number pattern before single-char glyph lookup
        if (rules && rules.numberPattern) {
            const remaining = text.substring(i);
            const numMatch = remaining.match(rules.numberPattern);
            if (numMatch) {
                parts.push(`<span class="syntax-number">${escapeHtml(numMatch[0])}</span>`);
                i += numMatch[0].length;
                continue;
            }
        }

        const c = text[i];
        const cls = getSyntaxClass(c, language);
        if (cls !== 'syntax-default') {
            parts.push(`<span class="${cls}">${escapeHtml(c)}</span>`);
        } else {
            parts.push(escapeHtml(c));
        }
    }
    return parts.join('');
}

// Default export for convenience
export default {
    syntaxRules,
    highlightCode,
    escapeHtml,
    getSyntaxClass,
    isTrainTree,
    highlightTrainTreeGlyphs
};
