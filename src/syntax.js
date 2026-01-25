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
        // Numbers pattern (no global flag - we check index manually)
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    },
    apl: {
        // Functions (blue) - primitive functions
        functions: [
            '+', '-', '×', '÷', '⌈', '⌊', '|', '!', '○', '*', '⍟', '?', '~',
            '<', '>', '=', '≠', '≤', '≥', '≡', '≢', '∧', '∨', '⍲', '⍱',
            '⍴', '⍳', ',', '⍪', '⌽', '⊖', '⍉', '↑', '↓', '⊂', '⊃', '⌷',
            '⊣', '⊢', '∪', '∩', '⊥', '⊤', '⍋', '⍒', '∊', '⍷', '⍸', '⊆',
            '⎕', '⍎', '⍕', '⍬', '∆', '∇', '⍞'
        ],
        // 1-modifiers (green) - monadic operators/adverbs
        monadic: [
            '/', '\\', '⌿', '⍀', '¨', '⍨'
        ],
        // 2-modifiers (yellow) - dyadic operators/conjunctions
        dyadic: [
            '∘', '.', '⍤', '⍥', '⍣', '@', '⍠', '⌸', '⌺', '⌶', '⍛'
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
            ]
        },
        // Numbers pattern (J uses _ for negative, also infinity)
        numberPattern: /^_?(\d+\.?\d*|\.\d+)([ejrx][+-]?\d+\.?\d*)?/i
    },
    uiua: {
        // Monadic functions (green) - take 1 array argument
        monadic: [
            '¬', '±', '√', '○', '⌵', '⌈', '⌊', '⧻', '△', '⇡', '⊢', '⇌', 
            '♭', '¤', '⊚', '⊛', '◴', '⍏', '⍖', '⊝', 'ℂ', '⁅', '°', '¯',
            '⍉', '⋯', '⍜', '⍘', '⬚', 'η', 'π', 'τ', '∞', '⚙', '◌', '⸮',
            '∩', '⍣', '⊓', '⊙', '⋅', '⬛'
        ],
        // Dyadic functions (blue) - take 2 array arguments
        functions: [
            '+', '-', '×', '÷', '◿', 'ⁿ', 'ₙ', '=', '≠', '<', '>', '≤', '≥',
            '↧', '↥', '∠', '∧', '∨', '⊻', '⊼', '⊽', '⊂', '⊏', '⊡', '↯', '☇',
            '↙', '↘', '↻', '⊗', '∈', '⊟', '▽', '◫', '▩', '⊞', '⊃', '⍥',
            '⊜', '⊕', '⬚', '⤸', '⤙', '◠'
        ],
        // 1-modifiers (orange) - take 1 function argument
        modifier: [
            '/', '\\', '∵', '≡', '⍢', '◡', '⚂', '⋕', '`', '¨'
        ],
        // 2-modifiers (yellow) - take 2+ function arguments
        dyadic: [
            '⊃', '⊓', '⊩', '⊔', '◇', '◰', '∘', '⊸', '⟜', '⊙', '⋅', '⍣'
        ],
        // Subscript characters (should inherit color from preceding glyph)
        subscripts: '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ',
        // Numbers pattern
        numberPattern: /^¯?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i
    }
};

/**
 * Escape HTML special characters
 * Note: We don't convert spaces to &nbsp; because CSS white-space: pre-wrap
 * handles space preservation, and &nbsp; becomes U+00A0 which breaks Uiua
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
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
                
                if (rules.multiChar.functions.includes(substr)) {
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
        if (rules.functions && rules.functions.includes(char)) {
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
        } else {
            return escaped;
        }
    }).join('');
}

// Default export for convenience
export default {
    syntaxRules,
    highlightCode,
    escapeHtml
};
