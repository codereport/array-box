/**
 * Primitive Translation Module
 * 
 * Translates primitives between array languages based on their MONADIC definitions only.
 * When switching languages, corresponding primitives are automatically converted.
 */

/**
 * Cross-language primitive mappings based on MONADIC definitions.
 * Each group represents semantically equivalent primitives across languages.
 * 
 * Format: { apl, bqn, uiua, j, kap, tinyapl }
 * null means the language doesn't have a direct equivalent or it differs
 */
export const primitiveGroups = {
    // ========== SYNTAX ==========
    
    // Comments
    comment: {
        apl: '⍝',
        bqn: '#',
        uiua: '#',
        j: 'NB.',  // Special: word-based comment
        kap: '⍝',
        tinyapl: '⍝'
    },
    
    // Left argument (in dfns/blocks)
    leftArg: {
        apl: '⍺',
        bqn: '𝕨',
        uiua: null,     // Stack-based, no explicit args
        j: null,        // Uses 'x' as normal variable
        kap: '⍺',
        tinyapl: '⍺'
    },
    
    // Right argument (in dfns/blocks)
    rightArg: {
        apl: '⍵',
        bqn: '𝕩',
        uiua: null,     // Stack-based, no explicit args
        j: null,        // Uses 'y' as normal variable
        kap: '⍵',
        tinyapl: '⍵'
    },
    
    // Left operand (in dops/modifiers)
    // TinyAPL uses ⍶⍶ (two underbar-alphas) for left function operand
    // Dyalog uses ⍺⍺ (two alphas) for left operand
    leftOperand: {
        apl: '⍺⍺',      // Two alpha chars
        bqn: '𝔽',
        uiua: null,
        j: null,
        kap: null,
        tinyapl: '⍶⍶'   // Two underbar-alpha chars
    },
    
    // Right operand (in dops/modifiers)  
    // TinyAPL uses ⍹⍹ (two underbar-omegas) for right function operand
    // Dyalog uses ⍵⍵ (two omegas) for right operand
    rightOperand: {
        apl: '⍵⍵',      // Two omega chars
        bqn: '𝔾',
        uiua: null,
        j: null,
        kap: null,
        tinyapl: '⍹⍹'   // Two underbar-omega chars
    },
    
    // Self-reference in recursion
    selfRef: {
        apl: '∇',
        bqn: '𝕊',
        uiua: null,
        j: '$:',
        kap: '∇',
        tinyapl: '∇'
    },
    
    // ========== MONADIC FUNCTIONS ==========
    
    // Iota / Range / Index Generator (monadic: generate indices 0..n-1)
    iota: {
        apl: '⍳',
        bqn: '↕',
        uiua: '⇡',
        j: 'i.',
        kap: '⍳',
        tinyapl: '⍳'
    },
    
    // Tally / Length (monadic: count of major cells)
    tally: {
        apl: '≢',
        bqn: '≠',
        uiua: '⧻',
        j: '#',
        kap: '≢',
        tinyapl: '≢'
    },
    
    // Shape (monadic: dimensions of array)
    shape: {
        apl: '⍴',
        bqn: '≢',
        uiua: '△',
        j: '$',
        kap: '⍴',
        tinyapl: '⍴'
    },
    
    // Reverse (monadic: reverse along last axis)
    reverse: {
        apl: '⌽',
        bqn: '⌽',
        uiua: '⇌',
        j: '|.',
        kap: '⌽',
        tinyapl: '⌽'
    },
    
    // Transpose (monadic: reorder axes)
    transpose: {
        apl: '⍉',
        bqn: '⍉',
        uiua: '⍉',
        j: '|:',
        kap: '⍉',
        tinyapl: '⍉'
    },
    
    // Enclose / Box (monadic: wrap in scalar)
    enclose: {
        apl: '⊂',
        bqn: '<',
        uiua: '□',
        j: '<',
        kap: '⊂',
        tinyapl: '⊂'
    },
    
    // First / Disclose (monadic: get first element or unbox)
    first: {
        apl: '⊃',
        bqn: '⊑',
        uiua: '⊢',
        j: '>',         // Open in J
        kap: '⊃',
        tinyapl: '⊃'
    },
    
    // Unique (monadic: remove duplicates)
    unique: {
        apl: '∪',
        bqn: '⍷',
        uiua: '◴',
        j: '~.',
        kap: '∪',
        tinyapl: '∪'
    },
    
    // Where (monadic: indices of true/nonzero values)
    where: {
        apl: '⍸',
        bqn: '/',       // Indices in BQN
        uiua: '⊚',
        j: 'I.',
        kap: '⍸',
        tinyapl: '⍸'
    },
    
    // Grade Up (monadic: permutation for ascending sort)
    gradeUp: {
        apl: '⍋',
        bqn: '⍋',
        uiua: '⍏',
        j: '/:', 
        kap: '⍋',
        tinyapl: '⍋'
    },
    
    // Grade Down (monadic: permutation for descending sort)
    gradeDown: {
        apl: '⍒',
        bqn: '⍒',
        uiua: '⍖',
        j: '\\:',
        kap: '⍒',
        tinyapl: '⍒'
    },
    
    // Ravel (monadic: flatten to vector)
    ravel: {
        apl: ',',
        bqn: '⥊',
        uiua: '♭',
        j: ',',
        kap: ',',
        tinyapl: ','
    },
    
    // ========== ARITHMETIC ==========
    
    // Multiply / Times
    multiply: {
        apl: '×',
        bqn: '×',
        uiua: '×',
        j: '*',
        kap: '×',
        tinyapl: '×'
    },
    
    // ========== MODIFIERS ==========
    
    // Reduce / Fold (modifier: insert function between elements)
    reduce: {
        apl: '/',
        bqn: '´',
        uiua: '/',
        j: '/',
        kap: '/',
        tinyapl: '/'
    },
    
    // Scan (modifier: running reduce)
    scan: {
        apl: '\\',
        bqn: '`',
        uiua: '\\',
        j: '\\',
        kap: '\\',
        tinyapl: '\\'
    },
    
    // Table / Outer Product (modifier: all combinations)
    table: {
        apl: '∘.',      // Two-char sequence (jot-dot)
        bqn: '⌜',
        uiua: '⊞',
        j: null,        // J uses dyadic / which conflicts with reduce
        kap: '⌻',
        tinyapl: '⊞'
    },
    
    // Commute / Swap (modifier: swap arguments or duplicate)
    commute: {
        apl: '⍨',
        bqn: '˜',
        uiua: '˜',
        j: '~',
        kap: '⍨',
        tinyapl: '⍨'
    }
};

/**
 * Build translation maps from source language to target language
 * Returns { forward: Map<sourceGlyph, targetGlyph>, backward: Map<targetGlyph, sourceGlyph> }
 */
function buildTranslationMap(fromLang, toLang) {
    const forward = new Map();
    const backward = new Map();
    
    for (const [name, group] of Object.entries(primitiveGroups)) {
        const fromGlyph = group[fromLang];
        const toGlyph = group[toLang];
        
        // Skip if either language doesn't have this primitive
        if (fromGlyph === null || toGlyph === null) continue;
        
        // Skip if they're the same glyph (no translation needed)
        if (fromGlyph === toGlyph) continue;
        
        forward.set(fromGlyph, toGlyph);
        backward.set(toGlyph, fromGlyph);
    }
    
    return { forward, backward };
}

// Cache for translation maps
const translationCache = new Map();

/**
 * Clear the translation cache (useful when mappings change)
 */
export function clearTranslationCache() {
    translationCache.clear();
}

/**
 * Get or create translation map between two languages
 */
function getTranslationMap(fromLang, toLang) {
    const key = `${fromLang}->${toLang}`;
    if (!translationCache.has(key)) {
        translationCache.set(key, buildTranslationMap(fromLang, toLang));
    }
    return translationCache.get(key);
}

/**
 * Translate code from one array language to another
 * 
 * @param {string} code - Source code to translate
 * @param {string} fromLang - Source language ('apl', 'bqn', 'uiua', 'j', 'kap', 'tinyapl')
 * @param {string} toLang - Target language
 * @returns {string} - Translated code
 */
export function translatePrimitives(code, fromLang, toLang) {
    if (fromLang === toLang) return code;
    
    const { forward } = getTranslationMap(fromLang, toLang);
    
    if (forward.size === 0) return code;
    
    // Sort by length descending to handle multi-char sequences first (e.g., ∘. before ∘)
    const sortedGlyphs = [...forward.keys()].sort((a, b) => b.length - a.length);
    
    // Build a regex that matches any source glyph (escaped for regex special chars)
    const escapedGlyphs = sortedGlyphs.map(g => g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(escapedGlyphs.join('|'), 'g');
    
    // Single-pass replacement: only looks at the ORIGINAL code, no cascading
    // Each match is looked up in the forward map and replaced once
    const result = code.replace(pattern, (match) => forward.get(match) || match);
    
    return result;
}

/**
 * Check if translation is available between two languages
 */
export function hasTranslation(fromLang, toLang) {
    if (fromLang === toLang) return false;
    const { forward } = getTranslationMap(fromLang, toLang);
    return forward.size > 0;
}

/**
 * Get list of translatable primitives between two languages
 * Returns array of { from, to, name } objects
 */
export function getTranslatablePrimitives(fromLang, toLang) {
    const result = [];
    
    for (const [name, group] of Object.entries(primitiveGroups)) {
        const fromGlyph = group[fromLang];
        const toGlyph = group[toLang];
        
        if (fromGlyph !== null && toGlyph !== null && fromGlyph !== toGlyph) {
            result.push({ from: fromGlyph, to: toGlyph, name });
        }
    }
    
    return result;
}

export default {
    translatePrimitives,
    hasTranslation,
    getTranslatablePrimitives,
    clearTranslationCache,
    primitiveGroups
};
