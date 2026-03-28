/**
 * Primitive rank test cases.
 *
 * Tests are derived from the primitiveMap in src/primitive-compare.js.
 * The runner looks up glyphs by name, constructs expressions using
 * standard inputs, and evaluates in each language.
 *
 * To add tests: append to the `tests` array.
 * To change a glyph: edit primitiveMap — tests automatically pick it up.
 */

/**
 * Standard inputs per rank, per language.
 * Use 'default' for APL-family syntax (APL, TinyAPL, Kap).
 * Override specific languages as needed.
 * null = skip that language for this rank.
 */
export const inputs = {
    0: { default: '5' },
    1: { default: '1 2 3 4 5', bqn: '1‿2‿3‿4‿5', uiua: '[1 2 3 4 5]', tinyapl: '1‿2‿3‿4‿5' },
    2: { default: '3 3⍴⍳9', bqn: '1+3‿3⥊↕9', j: '1+i. 3 3', uiua: '+1↯3_3⇡9', tinyapl: '1+3‿3⍴⍳9', kap: '1+3 3⍴⍳9' },
    N: { default: '(1 2 3)(4 5 6)', bqn: '⟨1‿2‿3,4‿5‿6⟩', j: '1 2 3;4 5 6', uiua: '{1_2_3 4_5_6}', tinyapl: '↓1+2‿3⍴⍳6' },
};

/**
 * Test cases.
 *
 * - name:     Matches monad.name or dyad.name in primitiveMap.
 * - rank:     Which standard input to use (0, 1, 2, 'N', or dyadic pair like '1,1').
 * - input:    (dyadic only) [leftStr, rightStr] in default APL-like syntax.
 *             Auto-formatted for BQN (spaces → ‿) and Uiua (wrap in []).
 * - expected: Output string (after normalization), or null for success-only check.
 */
export const tests = [
    // ─── ⊃ First / Pick ───
    { name: 'First',      rank: 0, expected: '5' },
    { name: 'First',      rank: 1, expected: '1' },
    { name: 'First',      rank: 2, expected: '1' },
    { name: 'First',      rank: 'N', expected: '1 2 3', expected_depth: 1 },

    // ─── ⊇ Last / From ───
    { name: 'Last',       rank: 0, expected: '5' },
    { name: 'Last',       rank: 1, expected: '5' },
    { name: 'Last',       rank: 2, expected: '9' },
    { name: 'Last',       rank: 'N', expected: '4 5 6', expected_depth: 1 },

    // ─── > First Cell / Greater Than ───
    { name: 'First Cell', rank: 0, expected: '5' },
    { name: 'First Cell', rank: 1, expected: '1' },
    { name: 'First Cell', rank: 2, expected: '1 2 3' },
    { name: 'First Cell', rank: 'N', expected: '1 2 3', expected_depth: 2 },

    // ─── ≥ Last Cell / Greater or Equal ───
    { name: 'Last Cell',  rank: 0, expected: '5' },
    { name: 'Last Cell',  rank: 1, expected: '5' },
    { name: 'Last Cell',  rank: 2, expected: '7 8 9' },

    // ─── ~ Not / Without ───
    { name: 'Without',    rank: '1,1', input: ['1 2 3 4 5', '2 4'], expected: '1 3 5' },

    // ─── ↑ Mix / Take ───
    { name: 'Mix',        rank: 'N', expected: null },

    // ─── ↓ Split / Drop ───
    { name: 'Split',      rank: 2, expected: null },
];
