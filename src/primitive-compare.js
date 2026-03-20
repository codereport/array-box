/**
 * Cross-language Primitive Comparison
 * 
 * Comprehensive database mapping TinyAPL primitives to their equivalents
 * across Dyalog APL, BQN, J, Kap, and Uiua — with both monadic and
 * dyadic definitions.
 * 
 * Used by the Ctrl+Shift+C comparison table feature.
 */

/**
 * Primitive database keyed by TinyAPL glyph.
 * 
 * Each entry has:
 *   monad: { name, apl, bqn, j, kap, uiua } | null
 *   dyad:  { name, apl, bqn, j, kap, uiua } | null
 * 
 * null glyph = language has no single-primitive equivalent.
 */
export const primitiveMap = {
    // ═══════════════ ARITHMETIC ═══════════════
    '+': {
        monad: { name: 'Conjugate', apl: '+', bqn: '+', j: '+', kap: '+', uiua: null },
        dyad:  { name: 'Add',       apl: '+', bqn: '+', j: '+', kap: '+', uiua: '+' }
    },
    '-': {
        monad: { name: 'Negate',    apl: '-', bqn: '-', j: '-', kap: '-', uiua: null },
        dyad:  { name: 'Subtract',  apl: '-', bqn: '-', j: '-', kap: '-', uiua: '-' }
    },
    '×': {
        monad: { name: 'Sign',     apl: '×', bqn: '×', j: '*', kap: '×', uiua: '±' },
        dyad:  { name: 'Multiply', apl: '×', bqn: '×', j: '*', kap: '×', uiua: '×' }
    },
    '÷': {
        monad: { name: 'Reciprocal', apl: '÷', bqn: '÷', j: '%', kap: '÷', uiua: null },
        dyad:  { name: 'Divide',     apl: '÷', bqn: '÷', j: '%', kap: '÷', uiua: '÷' }
    },
    '*': {
        monad: { name: 'Exponential', apl: '*', bqn: '⋆', j: '^', kap: '*', uiua: null },
        dyad:  { name: 'Power',       apl: '*', bqn: '⋆', j: '^', kap: '*', uiua: null }
    },
    '⍟': {
        monad: { name: 'Natural Log', apl: '⍟', bqn: null, j: '^.', kap: '⍟', uiua: null },
        dyad:  { name: 'Logarithm',   apl: '⍟', bqn: null, j: '^.', kap: '⍟', uiua: null }
    },
    '|': {
        monad: { name: 'Magnitude', apl: '|', bqn: '|', j: '|', kap: '|', uiua: '⌵' },
        dyad:  { name: 'Residue',   apl: '|', bqn: '|', j: '|', kap: '|', uiua: '◿' }
    },
    '!': {
        monad: { name: 'Factorial', apl: '!', bqn: null, j: '!', kap: '!', uiua: null },
        dyad:  { name: 'Binomial',  apl: '!', bqn: null, j: '!', kap: '!', uiua: null }
    },
    '⌈': {
        monad: { name: 'Ceiling', apl: '⌈', bqn: '⌈', j: '>.', kap: '⌈', uiua: '⌈' },
        dyad:  { name: 'Maximum', apl: '⌈', bqn: '⌈', j: '>.', kap: '⌈', uiua: '↥' }
    },
    '⌊': {
        monad: { name: 'Floor',   apl: '⌊', bqn: '⌊', j: '<.', kap: '⌊', uiua: '⌊' },
        dyad:  { name: 'Minimum', apl: '⌊', bqn: '⌊', j: '<.', kap: '⌊', uiua: '↧' }
    },
    '○': {
        monad: { name: 'Pi Times', apl: '○', bqn: null, j: 'o.', kap: '○', uiua: null },
        dyad:  { name: 'Circular',  apl: '○', bqn: null, j: 'o.', kap: '○', uiua: null }
    },

    // ═══════════════ LOGIC & COMPARISON ═══════════════
    '~': {
        monad: { name: 'Not',     apl: '~', bqn: '¬', j: '-.', kap: '~', uiua: '¬' },
        dyad:  { name: 'Without', apl: '~', bqn: '¬∘∊/⊣', j: '-.', kap: '~', uiua: '▽¬⊸∊' }
    },
    '∧': {
        monad: null,
        dyad:  { name: 'And', apl: '∧', bqn: '∧', j: '*.', kap: '∧', uiua: null }
    },
    '∨': {
        monad: null,
        dyad:  { name: 'Or', apl: '∨', bqn: '∨', j: '+.', kap: '∨', uiua: null }
    },
    '⍲': {
        monad: null,
        dyad:  { name: 'Nand', apl: '⍲', bqn: null, j: null, kap: '⍲', uiua: null }
    },
    '⍱': {
        monad: null,
        dyad:  { name: 'Nor', apl: '⍱', bqn: null, j: null, kap: '⍱', uiua: null }
    },
    '<': {
        monad: null,
        dyad:  { name: 'Less Than', apl: '<', bqn: '<', j: '<', kap: '<', uiua: '<' }
    },
    '≤': {
        monad: null,
        dyad:  { name: 'Less or Equal', apl: '≤', bqn: '≤', j: '<:', kap: '≤', uiua: null }
    },
    '=': {
        monad: null,
        dyad:  { name: 'Equal', apl: '=', bqn: '=', j: '=', kap: '=', uiua: '=' }
    },
    '≥': {
        monad: { name: 'Last Cell', apl: '≢⍛⌷', bqn: '⊢˝', j: '{:', kap: '(1-⍨≢)⍛⌷', uiua: '⊣' },
        dyad:  { name: 'Greater or Equal', apl: '≥', bqn: '≥', j: '>:', kap: '≥', uiua: null }
    },
    '>': {
        monad: { name: 'First Cell', apl: '1∘⌷', bqn: '⊏', j: '{.', kap: '0⌷', uiua: '⊢' },
        dyad:  { name: 'Greater Than', apl: '>', bqn: '>', j: '>', kap: '>', uiua: '>' }
    },
    '≠': {
        monad: { name: 'Unique Mask', apl: null, bqn: null, j: null, kap: null, uiua: null },
        dyad:  { name: 'Not Equal',   apl: '≠', bqn: '≠', j: '~:', kap: '≠', uiua: '≠' }
    },

    // ═══════════════ ARRAY FUNCTIONS ═══════════════
    '⍳': {
        monad: { name: 'Index Generator', apl: '⍳', bqn: '↕', j: 'i.', kap: '⍳', uiua: '⇡' },
        dyad:  { name: 'Index Of',        apl: '⍳', bqn: '⊐', j: 'i.', kap: '⍳', uiua: '⊗' }
    },
    '⍴': {
        monad: { name: 'Shape',   apl: '⍴', bqn: '≢', j: '$', kap: '⍴', uiua: '△' },
        dyad:  { name: 'Reshape', apl: '⍴', bqn: '⥊', j: '$', kap: '⍴', uiua: '↯' }
    },
    ',': {
        monad: { name: 'Ravel',    apl: ',', bqn: '⥊', j: ',', kap: ',', uiua: '♭' },
        dyad:  { name: 'Laminate', apl: null, bqn: '≍', j: null, kap: null, uiua: null }
    },
    '⍪': {
        monad: { name: 'Table',         apl: '⍪', bqn: null, j: null, kap: '⍪', uiua: null },
        dyad:  { name: 'Catenate First', apl: '⍪', bqn: '∾', j: ',:', kap: '⍪', uiua: null }
    },
    '≢': {
        monad: { name: 'Tally',     apl: '≢', bqn: '≠', j: '#', kap: '≢', uiua: '⧻' },
        dyad:  { name: 'Not Match', apl: '≢', bqn: '≢', j: null, kap: '≢', uiua: null }
    },
    '≡': {
        monad: { name: 'Depth', apl: '≡', bqn: null, j: 'L.', kap: '≡', uiua: null },
        dyad:  { name: 'Match', apl: '≡', bqn: '≡', j: '-:', kap: '≡', uiua: null }
    },
    '⊂': {
        monad: { name: 'Enclose',             apl: '⊂', bqn: '<', j: '<', kap: '⊂', uiua: '□' },
        dyad:  { name: 'Partitioned Enclose', apl: '⊂', bqn: null, j: null, kap: '⊂', uiua: null }
    },
    '⊃': {
        monad: { name: 'First', apl: '⊃', bqn: '⊑', j: '>{.,', kap: '↑', uiua: '◇∘⊢♭' },
        dyad:  { name: 'Pick',  apl: '⊃', bqn: '⊑', j: null, kap: '⊃', uiua: null }
    },
    '⊆': {
        monad: { name: 'Nest',      apl: '⊆', bqn: null, j: null, kap: '⊆', uiua: null },
        dyad:  { name: 'Partition', apl: '⊆', bqn: '⊔', j: ';.', kap: '⊆', uiua: '⊜' }
    },
    '⊇': {
        monad: { name: 'Last', apl: '⊢/', bqn: '⊢´', j: '>{:,', kap: '⊢/', uiua: '◇∘⊣♭' },
        dyad:  { name: 'From', apl: '⌷', bqn: '⊏', j: '{', kap: null, uiua: '⊡' }
    },
    '↑': {
        monad: { name: 'Mix',  apl: '↑', bqn: '>', j: '>', kap: '⊃', uiua: '≡₀°□' },
        dyad:  { name: 'Take', apl: '↑', bqn: '↑', j: '{.', kap: '↑', uiua: '↙' }
    },
    '↓': {
        monad: { name: 'Split', apl: '↓', bqn: '<˘', j: '<"1', kap: '⊂⍤1', uiua: '≡□' },
        dyad:  { name: 'Drop',        apl: '↓', bqn: '↓', j: '}.', kap: '↓', uiua: '↘' }
    },
    '⌽': {
        monad: { name: 'Reverse', apl: '⌽', bqn: '⌽', j: '|.', kap: '⌽', uiua: '⇌' },
        dyad:  { name: 'Rotate',  apl: '⌽', bqn: '⌽', j: '|.', kap: '⌽', uiua: '↻' }
    },
    '⍉': {
        monad: { name: 'Transpose',    apl: '⍉', bqn: '⍉', j: '|:', kap: '⍉', uiua: '⍉' },
        dyad:  { name: 'Reorder Axes', apl: '⍉', bqn: '⍉', j: null, kap: '⍉', uiua: null }
    },
    '∪': {
        monad: { name: 'Unique', apl: '∪', bqn: '⍷', j: '~.', kap: '∪', uiua: '◴' },
        dyad:  { name: 'Union',  apl: '∪', bqn: null, j: null, kap: '∪', uiua: null }
    },
    '∩': {
        monad: null,
        dyad:  { name: 'Intersection', apl: '∩', bqn: null, j: null, kap: '∩', uiua: null }
    },
    '∊': {
        monad: { name: 'Enlist',    apl: '∊', bqn: null, j: ';', kap: '∊', uiua: null },
        dyad:  { name: 'Member Of', apl: '∊', bqn: '∊', j: 'e.', kap: '∊', uiua: null }
    },
    '⍸': {
        monad: { name: 'Where',          apl: '⍸', bqn: '/', j: 'I.', kap: '⍸', uiua: '⊚' },
        dyad:  { name: 'Interval Index', apl: '⍸', bqn: '⍋', j: 'I.', kap: '⍸', uiua: null }
    },
    '⍋': {
        monad: { name: 'Grade Up', apl: '⍋', bqn: '⍋', j: '/:', kap: '⍋', uiua: '⍏' },
        dyad:  null
    },
    '⍒': {
        monad: { name: 'Grade Down', apl: '⍒', bqn: '⍒', j: '\\:', kap: '⍒', uiua: '⍖' },
        dyad:  null
    },
    '⌷': {
        monad: null,
        dyad:  { name: 'Index', apl: '⌷', bqn: null, j: '{', kap: '⌷', uiua: null }
    },
    '?': {
        monad: { name: 'Roll', apl: '?', bqn: null, j: '?', kap: '?', uiua: '⚂' },
        dyad:  { name: 'Deal', apl: '?', bqn: null, j: '?', kap: '?', uiua: null }
    },

    // ═══════════════ STRUCTURAL ═══════════════
    '⊢': {
        monad: { name: 'Identity', apl: '⊢', bqn: '⊢', j: ']', kap: '⊢', uiua: '∘' },
        dyad:  { name: 'Right',    apl: '⊢', bqn: '⊢', j: ']', kap: '⊢', uiua: null }
    },
    '⊣': {
        monad: { name: 'Identity', apl: '⊣', bqn: '⊣', j: '[', kap: '⊣', uiua: null },
        dyad:  { name: 'Left',     apl: '⊣', bqn: '⊣', j: '[', kap: '⊣', uiua: null }
    },

    // ═══════════════ MODIFIERS ═══════════════
    '/': {
        monad: { name: 'Reduce', apl: '/', bqn: '´', j: '/', kap: '/', uiua: '/' },
        dyad:  null
    },
    '\\': {
        monad: { name: 'Scan', apl: '\\', bqn: '`', j: '\\', kap: '\\', uiua: '\\' },
        dyad:  null
    },
    '¨': {
        monad: { name: 'Each', apl: '¨', bqn: '¨', j: '"0', kap: '¨', uiua: '∵' },
        dyad:  null
    },
    '⍨': {
        monad: { name: 'Commute', apl: '⍨', bqn: '˜', j: '~', kap: '⍨', uiua: null },
        dyad:  null
    },
    '⊞': {
        monad: { name: 'Table', apl: '∘.', bqn: '⌜', j: null, kap: '⌻', uiua: '⊞' },
        dyad:  null
    },
    '⊸': {
        monad: { name: 'Before', apl: '⍛', bqn: '⊸', j: null, kap: '⍛', uiua: null },
        dyad:  null
    },
    '⟜': {
        monad: { name: 'After', apl: null, bqn: '⟜', j: null, kap: null, uiua: null },
        dyad:  null
    },
    '⍤': {
        monad: { name: 'Rank', apl: '⍤', bqn: '⎉', j: '"', kap: '⍤', uiua: null },
        dyad:  null
    },
    '⍥': {
        monad: { name: 'Over', apl: '⍥', bqn: '○', j: '&.', kap: '⍥', uiua: null },
        dyad:  null
    },

    // ═══════════════ SYNTAX ═══════════════
    '←': {
        monad: { name: 'Assign', apl: '←', bqn: '←', j: '=.', kap: '⇐', uiua: '←' },
        dyad:  null
    },
    '⍝': {
        monad: { name: 'Comment', apl: '⍝', bqn: '#', j: 'NB.', kap: '⍝', uiua: '#' },
        dyad:  null
    },
};

/**
 * Language display order and metadata for the comparison table.
 */
export const compareLanguages = [
    { id: 'tinyapl', name: 'TinyAPL', logo: 'assets/tinyapl.svg', fontClass: 'font-tinyapl' },
    { id: 'apl',     name: 'Dyalog',  logo: 'assets/apl.png',     fontClass: 'font-apl' },
    { id: 'kap',     name: 'Kap',     logo: 'assets/kap.png',     fontClass: 'font-kap' },
    { id: 'bqn',     name: 'BQN',     logo: 'assets/bqn.svg',     fontClass: 'font-bqn' },
    { id: 'j',       name: 'J',       logo: 'assets/j_logo.svg',  fontClass: 'font-j' },
    { id: 'uiua',    name: 'Uiua',    logo: 'assets/uiua.png',    fontClass: 'font-uiua' },
];

/**
 * Look up a primitive by glyph (TinyAPL).
 * Returns the entry from primitiveMap, or null if not found.
 */
export function lookupPrimitive(glyph) {
    return primitiveMap[glyph] || null;
}

/**
 * Parse space-separated primitives from input text.
 * Handles multi-character tokens and filters out empty strings.
 */
export function parsePrimitives(text) {
    return text.trim().split(/\s+/).filter(s => s.length > 0);
}

/**
 * Get the display name for a primitive in a given valence.
 * Falls back to the other valence if the requested one doesn't exist.
 */
export function getPrimitiveName(entry, valence) {
    if (!entry) return null;
    if (valence === 'monad' && entry.monad) return entry.monad.name;
    if (valence === 'dyad' && entry.dyad) return entry.dyad.name;
    if (entry.monad) return entry.monad.name;
    if (entry.dyad) return entry.dyad.name;
    return null;
}

/**
 * Get the equivalent glyph for a language in a given valence.
 * Returns the glyph string, or null if no equivalent.
 */
export function getEquivalent(entry, langId, valence) {
    if (!entry) return null;
    const v = entry[valence];
    if (v && langId in v) return v[langId];
    const fallback = valence === 'monad' ? entry.dyad : entry.monad;
    if (fallback && langId in fallback) return fallback[langId];
    return null;
}

/**
 * Check if a primitive entry has a given valence.
 */
export function hasValence(entry, valence) {
    return entry && entry[valence] !== null && entry[valence] !== undefined;
}
