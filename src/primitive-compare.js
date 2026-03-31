/**
 * Cross-language Primitive Comparison
 *
 * Comprehensive database mapping TinyAPL primitives to their equivalents
 * across Dyalog APL, BQN, J, Kap, and Uiua — with both monadic and
 * dyadic definitions, plus rank annotations.
 *
 * Used by the Ctrl+Shift+C comparison table feature.
 *
 * Each valence object has one of these shapes:
 *   Scalar:       { name, scalar: true, apl, bqn, j, kap, uiua }
 *   Single rank:  { name, defaultRank, apl, bqn, j, kap, uiua }
 *   Multi rank:   { name, defaultRank, ranks: { [rank]: { apl, bqn, j, kap, uiua } } }
 *
 * Rank values:  S = scalar/pervasive, 0 = atoms, 1 = vectors, 2 = matrices, N = nested.
 * Monadic keys: 0, 1, 2, 'N'.  Dyadic keys: pairs like '0,1', '1,1', '0,N'.
 * null glyph = language has no single-primitive equivalent.
 */
export const primitiveMap = {
    // ═══════════════ ARITHMETIC ═══════════════
    '+': {
        monad: { name: 'Conjugate', scalar: true, apl: '+', bqn: '+', j: '+', kap: '+', uiua: null },
        dyad:  { name: 'Add',       scalar: true, apl: '+', bqn: '+', j: '+', kap: '+', uiua: '+' }
    },
    '-': {
        monad: { name: 'Negate',    scalar: true, apl: '-', bqn: '-', j: '-', kap: '-', uiua: null },
        dyad:  { name: 'Subtract',  scalar: true, apl: '-', bqn: '-', j: '-', kap: '-', uiua: '-' }
    },
    '×': {
        monad: { name: 'Sign',     scalar: true, apl: '×', bqn: '×', j: '*', kap: '×', uiua: '±' },
        dyad:  { name: 'Multiply', scalar: true, apl: '×', bqn: '×', j: '*', kap: '×', uiua: '×' }
    },
    '÷': {
        monad: { name: 'Reciprocal', scalar: true, apl: '÷', bqn: '÷', j: '%', kap: '÷', uiua: null },
        dyad:  { name: 'Divide',     scalar: true, apl: '÷', bqn: '÷', j: '%', kap: '÷', uiua: '÷' }
    },
    '*': {
        monad: { name: 'Exponential', scalar: true, apl: '*', bqn: '⋆', j: '^', kap: '*', uiua: null },
        dyad:  { name: 'Power',       scalar: true, apl: '*', bqn: '⋆', j: '^', kap: '*', uiua: null }
    },
    '⍟': {
        monad: { name: 'Natural Log', scalar: true, apl: '⍟', bqn: null, j: '^.', kap: '⍟', uiua: null },
        dyad:  { name: 'Logarithm',   scalar: true, apl: '⍟', bqn: null, j: '^.', kap: '⍟', uiua: null }
    },
    '|': {
        monad: { name: 'Magnitude', scalar: true, apl: '|', bqn: '|', j: '|', kap: '|', uiua: '⌵' },
        dyad:  { name: 'Residue',   scalar: true, apl: '|', bqn: '|', j: '|', kap: '|', uiua: '◿' }
    },
    '!': {
        monad: { name: 'Factorial', scalar: true, apl: '!', bqn: null, j: '!', kap: '!', uiua: null },
        dyad:  { name: 'Binomial',  scalar: true, apl: '!', bqn: null, j: '!', kap: '!', uiua: null }
    },
    '⌈': {
        monad: { name: 'Ceiling', scalar: true, apl: '⌈', bqn: '⌈', j: '>.', kap: '⌈', uiua: '⌈' },
        dyad:  { name: 'Maximum', scalar: true, apl: '⌈', bqn: '⌈', j: '>.', kap: '⌈', uiua: '↥' }
    },
    '⌊': {
        monad: { name: 'Floor',   scalar: true, apl: '⌊', bqn: '⌊', j: '<.', kap: '⌊', uiua: '⌊' },
        dyad:  { name: 'Minimum', scalar: true, apl: '⌊', bqn: '⌊', j: '<.', kap: '⌊', uiua: '↧' }
    },
    '○': {
        monad: { name: 'Pi Times', scalar: true, apl: '○', bqn: null, j: 'o.', kap: '○', uiua: null },
        dyad:  { name: 'Circular', scalar: true, apl: '○', bqn: null, j: 'o.', kap: '○', uiua: null }
    },

    // ═══════════════ LOGIC & COMPARISON ═══════════════
    '~': {
        monad: { name: 'Not',     scalar: true, apl: '~', bqn: '¬', j: '-.', kap: '~', uiua: '¬' },
        dyad:  { name: 'Without', defaultRank: '1,1', apl: '~', bqn: '¬∘∊/⊣', j: '-.', kap: '~', uiua: '▽¬⊸∊' }
    },
    '∧': {
        monad: null,
        dyad:  { name: 'And', scalar: true, apl: '∧', bqn: '∧', j: '*.', kap: '∧', uiua: null }
    },
    '∨': {
        monad: null,
        dyad:  { name: 'Or', scalar: true, apl: '∨', bqn: '∨', j: '+.', kap: '∨', uiua: null }
    },
    '⍲': {
        monad: null,
        dyad:  { name: 'Nand', scalar: true, apl: '⍲', bqn: null, j: null, kap: '⍲', uiua: null }
    },
    '⍱': {
        monad: null,
        dyad:  { name: 'Nor', scalar: true, apl: '⍱', bqn: null, j: null, kap: '⍱', uiua: null }
    },
    '<': {
        monad: null,
        dyad:  { name: 'Less Than', scalar: true, apl: '<', bqn: '<', j: '<', kap: '<', uiua: '<' }
    },
    '≤': {
        monad: null,
        dyad:  { name: 'Less or Equal', scalar: true, apl: '≤', bqn: '≤', j: '<:', kap: '≤', uiua: null }
    },
    '=': {
        monad: null,
        dyad:  { name: 'Equal', scalar: true, apl: '=', bqn: '=', j: '=', kap: '=', uiua: '=' }
    },
    '≥': {
        monad: { name: 'Last Cell', defaultRank: 1, apl: '⊢⌿', bqn: '⊢˝', j: '{:', kap: '⊢⌿', uiua: '⊣',
            ranks: {
                0: { bqn: null, apl: null}
            }
         }, // (1-⍨≢)⍛⌷
        dyad:  { name: 'Greater or Equal', scalar: true, apl: '≥', bqn: '≥', j: '>:', kap: '≥', uiua: null }
    },
    '>': {
        monad: { name: 'First Cell', defaultRank: 1, apl: '⊃', bqn: '⊏', j: '{.', kap: '↑', uiua: '⊢' ,
            ranks: {
                0: { bqn: null },
                2: { apl: '1∘⌷', kap: '0⌷'},
                'N': { apl: '1∘⌷', kap: '0⌷'}
            }
        },
        dyad:  { name: 'Greater Than', scalar: true, apl: '>', bqn: '>', j: '>', kap: '>', uiua: '>' }
    },
    '≠': {
        monad: { name: 'Unique Mask', defaultRank: 1, apl: null, bqn: null, j: null, kap: null, uiua: null },
        dyad:  { name: 'Not Equal',   scalar: true, apl: '≠', bqn: '≠', j: '~:', kap: '≠', uiua: '≠' }
    },

    // ═══════════════ ARRAY FUNCTIONS ═══════════════
    '⍳': {
        monad: {
            name: 'Index Generator',
            defaultRank: 0,
            ranks: {
                0: { apl: '⍳', bqn: '↕', j: 'i.', kap: '⍳', uiua: '⇡' },
                1: { apl: '⍳', bqn: '↕', j: 'i.', kap: '⍳', uiua: '⇡' },
            }
        },
        dyad: { name: 'Index Of', defaultRank: '1,1', apl: '⍳', bqn: '⊐', j: 'i.', kap: '⍳', uiua: '⊗' }
    },
    '⍴': {
        monad: { name: 'Shape',   defaultRank: 1, apl: '⍴', bqn: '≢', j: '$', kap: '⍴', uiua: '△' },
        dyad:  { name: 'Reshape', defaultRank: '1,1', apl: '⍴', bqn: '⥊', j: '$', kap: '⍴', uiua: '↯' }
    },
    ',': {
        monad: { name: 'Ravel',    defaultRank: 1, apl: ',', bqn: '⥊', j: ',', kap: ',', uiua: '♭' },
        dyad:  { name: 'Laminate', defaultRank: '1,1', apl: null, bqn: '≍', j: null, kap: null, uiua: null }
    },
    '⍪': {
        monad: { name: 'Table',          defaultRank: 1, apl: '⍪', bqn: null, j: null, kap: '⍪', uiua: null },
        dyad:  { name: 'Catenate First', defaultRank: '1,1', apl: '⍪', bqn: '∾', j: ',:', kap: '⍪', uiua: null }
    },
    '≢': {
        monad: { name: 'Tally',     defaultRank: 1, apl: '≢', bqn: '≠', j: '#', kap: '≢', uiua: '⧻' },
        dyad:  { name: 'Not Match', defaultRank: '1,1', apl: '≢', bqn: '≢', j: null, kap: '≢', uiua: null }
    },
    '≡': {
        monad: { name: 'Depth', defaultRank: 'N', apl: '≡', bqn: null, j: 'L.', kap: '≡', uiua: null },
        dyad:  { name: 'Match', defaultRank: '1,1', apl: '≡', bqn: '≡', j: '-:', kap: '≡', uiua: null }
    },
    '⊂': {
        monad: { name: 'Enclose',             defaultRank: 'N', apl: '⊂', bqn: '<', j: '<', kap: '⊂', uiua: '□' },
        dyad:  { name: 'Partitioned Enclose', defaultRank: '1,1', apl: '⊂', bqn: null, j: null, kap: '⊂', uiua: null }
    },
    '⊃': {
        monad: { name: 'First', defaultRank: 1, apl: '⊃', bqn: '⊑', j: '{.', kap: '↑', uiua: '⊢',
            ranks: {
                2: { j: '{.@,', uiua: '⊢♭'},
                'N': { j: '>@{.', uiua: '°□⊢♭'}
            }
        },
        dyad:  { name: 'Pick',  defaultRank: '0,N', apl: '⊃', bqn: '⊑', j: null, kap: '⊃', uiua: null }
    },
    '⊆': {
        monad: { name: 'Nest',      defaultRank: 'N', apl: '⊆', bqn: null, j: null, kap: '⊆', uiua: null },
        dyad:  { name: 'Partition', defaultRank: '1,1', apl: '⊆', bqn: '⊔', j: ';.', kap: '⊆', uiua: '⊜' }
    },
    '⊇': {
        monad: {
            name: 'Last', defaultRank: 1,
            apl: '⊢⌿', bqn: '⊢´', j: '{:', kap: '⊢⌿', uiua: '⊣',
            ranks: {
                0: { bqn: '⊢´⥊' },
                2: { j: '{:@,', kap: '⊢⌿,', bqn: '⊢´⥊', apl: '⊢⌿,', uiua: '⊣♭'},
                'N': { j: '>@{:', kap: '⊃⊢⌿', apl: '⊃⊢⌿', uiua: '°□⊣♭'}
            }
        },
        dyad:  {
            name: 'From',
            defaultRank: '0,1',
            ranks: {
                '0,1': { apl: '⌷', bqn: '⊏', j: '{', kap: null, uiua: '⊡' },
                '1,1': { apl: '⌷', bqn: '⊏', j: '{', kap: null, uiua: '⊡' },
            }
        }
    },
    '↑': {
        monad: { name: 'Mix', defaultRank: 'N', apl: '↑', bqn: '>', j: '>', kap: '⊃', uiua: '≡₀°□' },
        dyad:  {
            name: 'Take',
            defaultRank: '0,1',
            ranks: {
                '0,1': { apl: '↑', bqn: '↑', j: '{.', kap: '↑', uiua: '↙' },
                '1,1': { apl: '↑', bqn: '↑', j: '{.', kap: '↑', uiua: '↙' },
            }
        }
    },
    '↓': {
        monad: { name: 'Split', defaultRank: 2, apl: '↓', bqn: '<˘', j: '<"1', kap: '⊂⍤1', uiua: '≡□' },
        dyad:  {
            name: 'Drop',
            defaultRank: '0,1',
            ranks: {
                '0,1': { apl: '↓', bqn: '↓', j: '}.', kap: '↓', uiua: '↘' },
                '1,1': { apl: '↓', bqn: '↓', j: '}.', kap: '↓', uiua: '↘' },
            }
        }
    },
    '⌽': {
        monad: {
            name: 'Reverse',
            defaultRank: 1,
            ranks: {
                1: { apl: '⌽', bqn: '⌽', j: '|.', kap: '⌽', uiua: '⇌' },
                2: { apl: '⌽', bqn: '⌽', j: '|.', kap: '⌽', uiua: '⇌' },
            }
        },
        dyad: {
            name: 'Rotate',
            defaultRank: '0,1',
            ranks: {
                '0,1': { apl: '⌽', bqn: '⌽', j: '|.', kap: '⌽', uiua: '↻' },
                '0,2': { apl: '⌽', bqn: '⌽', j: '|.', kap: '⌽', uiua: '↻' },
            }
        }
    },
    '⍉': {
        monad: { name: 'Transpose', defaultRank: 2, apl: '⍉', bqn: '⍉', j: '|:', kap: '⍉', uiua: '⍉' },
        dyad:  { name: 'Reorder Axes', defaultRank: '1,2', apl: '⍉', bqn: '⍉', j: null, kap: '⍉', uiua: null }
    },
    '∪': {
        monad: { name: 'Unique', defaultRank: 1, apl: '∪', bqn: '⍷', j: '~.', kap: '∪', uiua: '◴' },
        dyad:  { name: 'Union',  defaultRank: '1,1', apl: '∪', bqn: null, j: null, kap: '∪', uiua: null }
    },
    '∩': {
        monad: null,
        dyad:  { name: 'Intersection', defaultRank: '1,1', apl: '∩', bqn: null, j: null, kap: '∩', uiua: null }
    },
    '∊': {
        monad: { name: 'Enlist',    defaultRank: 'N', apl: '∊', bqn: null, j: ';', kap: '∊', uiua: null },
        dyad:  { name: 'Member Of', defaultRank: '0,1', apl: '∊', bqn: '∊', j: 'e.', kap: '∊', uiua: null }
    },
    '⍸': {
        monad: { name: 'Where', defaultRank: 1, apl: '⍸', bqn: '/', j: 'I.', kap: '⍸', uiua: '⊚' },
        dyad:  { name: 'Interval Index', defaultRank: '1,1', apl: '⍸', bqn: '⍋', j: 'I.', kap: '⍸', uiua: null }
    },
    '⍋': {
        monad: { name: 'Grade Up', defaultRank: 1, apl: '⍋', bqn: '⍋', j: '/:', kap: '⍋', uiua: '⍏' },
        dyad:  null
    },
    '⍒': {
        monad: { name: 'Grade Down', defaultRank: 1, apl: '⍒', bqn: '⍒', j: '\\:', kap: '⍒', uiua: '⍖' },
        dyad:  null
    },
    '⊴': {
        monad: { name: 'Sort Up', defaultRank: 1, apl: '⊂⍤⍋⍛⌷', bqn: '∧', j: '/:~', kap: '∧', uiua: '⍆' },
        dyad:  null
    },
    '⊵': {
        monad: { name: 'Sort Down', defaultRank: 1, apl: '⊂⍤⍒⍛⌷', bqn: '∨', j: '\\:~', kap: '∨', uiua: '⇌⍆' },
        dyad:  null
    },
    '⌷': {
        monad: null,
        dyad:  { name: 'Index', defaultRank: '1,1', apl: '⌷', bqn: null, j: '{', kap: '⌷', uiua: null }
    },
    '?': {
        monad: { name: 'Roll', scalar: true, apl: '?', bqn: null, j: '?', kap: '?', uiua: '⚂' },
        dyad:  { name: 'Deal', defaultRank: '0,0', apl: '?', bqn: null, j: '?', kap: '?', uiua: null }
    },

    // ═══════════════ STRUCTURAL ═══════════════
    '⊢': {
        monad: { name: 'Identity', defaultRank: 1, apl: '⊢', bqn: '⊢', j: ']', kap: '⊢', uiua: '∘' },
        dyad:  { name: 'Right',    defaultRank: '1,1', apl: '⊢', bqn: '⊢', j: ']', kap: '⊢', uiua: null }
    },
    '⊣': {
        monad: { name: 'Identity', defaultRank: 1, apl: '⊣', bqn: '⊣', j: '[', kap: '⊣', uiua: null },
        dyad:  { name: 'Left',     defaultRank: '1,1', apl: '⊣', bqn: '⊣', j: '[', kap: '⊣', uiua: null }
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
 * Get the equivalent glyph for a language in a given valence and rank.
 * When rank is provided and rank-specific data exists, uses that.
 * Otherwise falls back to flat equivalents, then the other valence.
 */
export function getEquivalent(entry, langId, valence, rank) {
    if (!entry) return null;
    const v = entry[valence];
    if (v) {
        if (rank != null && v.ranks) {
            const rankData = v.ranks[rank];
            if (rankData && langId in rankData) return rankData[langId];
        }
        if (langId in v) return v[langId];
    }
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

/**
 * Check if a valence object is scalar (pervasive).
 */
export function isScalar(valenceObj) {
    return valenceObj?.scalar === true;
}

/**
 * Get the list of available rank keys for a valence, or null if no rank variants.
 */
export function getAvailableRanks(valenceObj) {
    if (!valenceObj || !valenceObj.ranks) return null;
    return Object.keys(valenceObj.ranks);
}

/**
 * Get the default rank for a valence, or null for scalar / unannotated valences.
 */
export function getDefaultRank(valenceObj) {
    if (!valenceObj) return null;
    if (valenceObj.scalar) return null;
    return valenceObj.defaultRank ?? null;
}
