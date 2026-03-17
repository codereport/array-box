import { highlightTrainTreeGlyphs } from './syntax.js';

/**
 * Interactive explain-tree renderer for BQN, APL, and J train expressions.
 *
 * Each language's renderer parses the source expression directly to derive
 * hover groups — combinator groups (forks, atops, modifier applications) with
 * column indices that align with the per-character spans in row 0 of the output.
 *
 * BQN )explain output format (row 0 is the source expression, provided by eu.bqn):
 *
 *   +˜ (1-mod):    +∘- (2-mod):    -+ (atop):    +´÷≠ (fork):
 *    +˜              +∘-             -+             +´÷≠
 *    │               │ │             │              │  │
 *    +˜              +∘-             -+             +´ │
 *   ╶─┘             ╶─┘            ╶┘               └÷≠
 *                                                  ╶──┘
 *
 * APL (]boxing -trains=tree) and J ((9!:3)4) do not include the source
 * expression in their output — it is prepended manually as row 0.
 */

const BOX_CHARS = new Set([...`╷╶┌╵│└├╴┐─┬┘┤┴┼`]);

export const APL_COMBINATOR_INFO = {
    'fork': {
        name: '3-train (fork)',
        monad: '(f g h) ⍵ ≡ (f ⍵) g (h ⍵)',
        dyad:  '(f g h) ⍺ ⍵ ≡ (f ⍺ ⍵) g (h ⍺ ⍵)',
    },
    'atop': {
        name: '2-train (atop)',
        monad: '(f g) ⍵ ≡ f (g ⍵)',
        dyad:  '(f g) ⍺ ⍵ ≡ f (⍺ g ⍵)',
    },
    '1-mod': {
        name: '1-operator application',
        monad: '(f op) ⍵ ≡ f op ⍵',
        dyad:  '(f op) ⍺ ⍵ ≡ f op ⍺ ⍵',
    },
    '2-mod': {
        name: '2-operator application',
        monad: '(f op g) ⍵ ≡ f op g ⍵',
        dyad:  '(f op g) ⍺ ⍵ ≡ f op g ⍺ ⍵',
    },
};

export const BQN_COMBINATOR_INFO = {
    'fork': {
        name: '3-train (fork)',
        monad: '(f g h) 𝕩 ≡ (f 𝕩) g (h 𝕩)',
        dyad:  '(f g h) 𝕨 𝕩 ≡ (f 𝕨 𝕩) g (h 𝕨 𝕩)',
    },
    'atop': {
        name: '2-train (atop)',
        monad: '(f g) 𝕩 ≡ f (g 𝕩)',
        dyad:  '(f g) 𝕨 𝕩 ≡ f (g 𝕨 𝕩)',
    },
    '1-mod': {
        name: '1-modifier application',
        monad: '(𝔽 _m) 𝕩 ≡ 𝔽 _m 𝕩',
        dyad:  '(𝔽 _m) 𝕨 𝕩 ≡ 𝔽 _m 𝕨 𝕩',
    },
    '2-mod': {
        name: '2-modifier application',
        monad: '(𝔽 _m_ 𝔾) 𝕩 ≡ 𝔽 _m_ 𝔾 𝕩',
        dyad:  '(𝔽 _m_ 𝔾) 𝕨 𝕩 ≡ 𝔽 _m_ 𝔾 𝕨 𝕩',
    },
    'strand': {
        name: 'strand / list literal',
        monad: null,
        dyad:  null,
    },
};

// ---------------------------------------------------------------------------
// Pure-JS BQN expression parser
// ---------------------------------------------------------------------------

/**
 * Parse a BQN source expression and return hover groups.
 *
 * Column indices in the returned groups correspond directly to character
 * positions in `src` (no trimming), so they align with the `data-col`
 * attributes written by renderBqnExplainTree.
 *
 * Algorithm:
 *   1. Tokenize left-to-right, preserving column indices.
 *   2. Parse modifier applications left-to-right into derived-function nodes.
 *      BQN modifiers bind tighter than trains and left-to-right, so
 *      `f∘g˜` → `(f∘g)˜`.
 *   3. Build a train from the derived-function list using BQN's right-recursive
 *      fork/atop rules.
 *   4. Walk the resulting tree to extract groups, using depth to assign
 *      junctionRow so innermost groups sort first.
 *
 * @param {string} src  - raw first row of )explain output (not trimmed)
 * @returns {object[]}  - group objects compatible with renderBqnExplainTree
 */
function parseBqnExprGroups(src) {
    if (!src || !src.trim()) return [];

    // Complete BQN glyph sets
    const FUNC_GLYPHS = new Set([...`+-×÷⋆√⌊⌈|¬∧∨<>≠=≤≥≡≢⊣⊢⥊∾≍⋈↑↓↕«»⌽⍉/⍋⍒⊏⊑⊐⊒∊⍷⊔!𝕎𝕏𝔽𝔾𝕊`]);
    const MOD1_GLYPHS = new Set([...`˜˘¨⌜⁼´˝\``]);
    const MOD2_GLYPHS = new Set([...`∘○⊸⟜⌾⊘◶⎉⚇⍟`]);

    // ---------------------------------------------------------------------------
    // Step 1: Tokenize
    // Each token: { type: 'func'|'mod1'|'mod2', cols: number[] }
    // cols = column indices of the characters belonging to this token.
    // ---------------------------------------------------------------------------
    const chars = [...src]; // Unicode-safe split preserves column indices
    const tokens = [];
    let i = 0;

    while (i < chars.length) {
        const ch = chars[i];

        // Bracketed span: treat entire ( ... ) or { ... } as a single func token
        if (ch === '(' || ch === '{') {
            const close = ch === '(' ? ')' : '}';
            const cols = [i];
            let depth = 1;
            i++;
            while (i < chars.length && depth > 0) {
                if (chars[i] === ch)    depth++;
                if (chars[i] === close) depth--;
                cols.push(i);
                i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        // Single-glyph function
        if (FUNC_GLYPHS.has(ch)) {
            tokens.push({ type: 'func', cols: [i] });
            i++;
            continue;
        }

        // Single-glyph 1-modifier
        if (MOD1_GLYPHS.has(ch)) {
            tokens.push({ type: 'mod1', cols: [i] });
            i++;
            continue;
        }

        // Single-glyph 2-modifier
        if (MOD2_GLYPHS.has(ch)) {
            tokens.push({ type: 'mod2', cols: [i] });
            i++;
            continue;
        }

        // Uppercase letter = function (handles F, MyFn, etc.)
        if (ch >= 'A' && ch <= 'Z') {
            const cols = [i];
            i++;
            while (i < chars.length && chars[i] >= 'a' && chars[i] <= 'z') {
                cols.push(i);
                i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        // •Name = system function
        if (ch === '•') {
            const cols = [i];
            i++;
            while (i < chars.length && /\w/.test(chars[i])) {
                cols.push(i);
                i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        // _name_ = 2-modifier, _name = 1-modifier
        if (ch === '_') {
            const cols = [i];
            i++;
            while (i < chars.length && /\w/.test(chars[i])) {
                cols.push(i);
                i++;
            }
            if (i < chars.length && chars[i] === '_') {
                cols.push(i);
                i++;
                tokens.push({ type: 'mod2', cols });
            } else {
                tokens.push({ type: 'mod1', cols });
            }
            continue;
        }

        // Numeric literal (constant function tine): ¯?[0-9][0-9.e¯]*
        if ((ch >= '0' && ch <= '9') || (ch === '¯' && i + 1 < chars.length && chars[i + 1] >= '0' && chars[i + 1] <= '9')) {
            const cols = [i];
            i++;
            while (i < chars.length && (chars[i] >= '0' && chars[i] <= '9' || chars[i] === '.' || chars[i] === 'e' || chars[i] === 'E' || chars[i] === '¯')) {
                cols.push(i); i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        // Everything else (spaces, 𝕩𝕨𝕣𝕤, letters, etc.): skip
        i++;
    }

    // ---------------------------------------------------------------------------
    // Step 2: Parse modifier applications left-to-right into derived-function nodes
    //
    // After consuming a func token, greedily consume any trailing modifiers:
    //   func mod1            → 1-mod application
    //   func mod2 func       → 2-mod application (right operand is next single func)
    // These bind left-to-right, so f∘g˜ → (f∘g)˜.
    // ---------------------------------------------------------------------------
    const dervs = [];
    let ti = 0;

    while (ti < tokens.length) {
        if (tokens[ti].type !== 'func') { ti++; continue; } // stray modifier — skip

        let cur = tokens[ti];
        ti++;

        for (;;) {
            if (ti < tokens.length && tokens[ti].type === 'mod1') {
                const modTok = tokens[ti];
                cur = {
                    type: '1-mod',
                    cols: [...cur.cols, ...modTok.cols],
                    operand: cur,
                    modifier: modTok,
                };
                ti++;
            } else if (
                ti < tokens.length &&
                tokens[ti].type === 'mod2' &&
                ti + 1 < tokens.length &&
                tokens[ti + 1].type === 'func'
            ) {
                const modTok   = tokens[ti];
                const rightTok = tokens[ti + 1];
                cur = {
                    type: '2-mod',
                    cols: [...cur.cols, ...modTok.cols, ...rightTok.cols],
                    left: cur,
                    modifier: modTok,
                    right: rightTok,
                };
                ti += 2;
            } else {
                break;
            }
        }

        dervs.push(cur);
    }

    if (dervs.length === 0) return [];

    // ---------------------------------------------------------------------------
    // Step 3: Build train from the derived-function list
    //
    // BQN trains are right-recursive:
    //   n=1: just the function (no group)
    //   n=2: atop(d[0], d[1])
    //   n=3: fork(d[0], d[1], d[2])
    //   n even: atop(d[0], makeTrain(d[1..]))
    //   n odd:  fork(d[0], d[1], makeTrain(d[2..]))
    // ---------------------------------------------------------------------------
    function makeTrain(ds) {
        const n = ds.length;
        if (n === 1) return ds[0];
        if (n === 2) return {
            type: 'atop',
            f: ds[0], g: ds[1],
            cols: [...ds[0].cols, ...ds[1].cols],
        };
        const rest = makeTrain(ds.slice(n % 2 === 0 ? 1 : 2));
        if (n % 2 === 0) {
            return {
                type: 'atop',
                f: ds[0], g: rest,
                cols: [...ds[0].cols, ...rest.cols],
            };
        }
        return {
            type: 'fork',
            f: ds[0], g: ds[1], h: rest,
            cols: [...ds[0].cols, ...ds[1].cols, ...rest.cols],
        };
    }

    const trainRoot = makeTrain(dervs);

    // ---------------------------------------------------------------------------
    // Step 4: Walk the tree to extract groups
    //
    // Each compound node (1-mod, 2-mod, atop, fork) produces a group containing
    // all the source column indices of its constituent tokens.
    //
    // junctionRow: -depth  so innermost (deepest) groups get the most-negative
    // value and sort first in colToGroups — the hover code uses ids[0] as the
    // "innermost" group for tooltip and highlighting.
    // ---------------------------------------------------------------------------
    const groups = [];

    function extractGroups(node, depth) {
        // Leaf token: no compound structure — just return its column indices
        if (!node.operand && !node.left && !node.f) return node.cols;

        let allCols;
        let parts;
        switch (node.type) {
            case '1-mod': {
                const opCols  = extractGroups(node.operand,   depth + 1);
                const modCols = extractGroups(node.modifier,  depth + 1);
                allCols = [...opCols, ...modCols];
                parts = [
                    { role: 'operand',  cols: opCols  },
                    { role: 'modifier', cols: modCols },
                ];
                break;
            }
            case '2-mod': {
                const leftCols  = extractGroups(node.left,     depth + 1);
                const modCols   = extractGroups(node.modifier, depth + 1);
                const rightCols = extractGroups(node.right,    depth + 1);
                allCols = [...leftCols, ...modCols, ...rightCols];
                parts = [
                    { role: 'left',     cols: leftCols  },
                    { role: 'modifier', cols: modCols   },
                    { role: 'right',    cols: rightCols },
                ];
                break;
            }
            case 'atop': {
                const fCols = extractGroups(node.f, depth + 1);
                const gCols = extractGroups(node.g, depth + 1);
                allCols = [...fCols, ...gCols];
                // f is applied last (outer) → center; g is applied first (inner) → tine
                parts = [
                    { role: 'f', cols: fCols },
                    { role: 'g', cols: gCols },
                ];
                break;
            }
            case 'fork': {
                const fCols = extractGroups(node.f, depth + 1);
                const gCols = extractGroups(node.g, depth + 1);
                const hCols = extractGroups(node.h, depth + 1);
                allCols = [...fCols, ...gCols, ...hCols];
                parts = [
                    { role: 'f', cols: fCols },
                    { role: 'g', cols: gCols },
                    { role: 'h', cols: hCols },
                ];
                break;
            }
            default:
                return node.cols;
        }

        groups.push({
            id: groups.length,
            type: node.type,
            cols: allCols,
            junctionRow: -depth,
            parts,
        });

        return allCols;
    }

    extractGroups(trainRoot, 0);
    return groups;
}

function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const BQN_FUNCTIONS   = new Set([...`+-×÷⋆√⌊⌈|¬∧∨<>≠=≤≥≡≢⊣⊢⥊∾≍⋈↑↓↕«»⌽⍉/⍋⍒⊏⊑⊐⊒∊⍷⊔!`]);
const BQN_MOD1_GLYPHS = new Set([...`˜˘¨⌜⁼´˝\``]);
const BQN_MOD2_GLYPHS = new Set([...`∘○⊸⟜⌾◶⍟⊘⎉⚇`]);

function bqnSyntaxClass(ch) {
    if (BQN_FUNCTIONS.has(ch))   return 'syntax-function';
    if (BQN_MOD1_GLYPHS.has(ch)) return 'syntax-modifier-monadic';
    if (BQN_MOD2_GLYPHS.has(ch)) return 'syntax-modifier-dyadic';
    return null;
}

/**
 * Render the )explain tree as interactive HTML.
 *
 * Row 0 (the source expression) is rendered with per-character
 * `explain-source-char` spans so hovering a glyph triggers highlighting
 * of the combinator group it belongs to in the diagram below.
 *
 * Groups are derived by parsing the source expression directly (row 0),
 * which guarantees column alignment with the rendered HTML spans.
 *
 * @param {string} text  - raw )explain output
 * @returns {{ html: string, groups: object[] }}
 */
export function renderBqnExplainTree(text) {
    const rows = text.split('\n');
    while (rows.length > 0 && rows[rows.length - 1].trim() === '') rows.pop();

    // Parse the raw first row as a BQN expression to get hover groups.
    // Using rows[0] directly (no trimming) ensures column indices match
    // the data-col attributes on the rendered spans.
    const hoverGroups = parseBqnExprGroups(rows[0] || '');

    if (hoverGroups.length === 0) {
        return { html: esc(text), groups: [] };
    }

    const grid = rows.map(r => [...r]);

    // Build col → groupId[] map for row 0 hover targets.
    // Each leaf member's source column maps to the groups it participates in,
    // sorted innermost-first (most-negative junctionRow = deepest nesting = tightest binding).
    const groupById = new Map(hoverGroups.map(g => [g.id, g]));
    const colToGroups = new Map(); // col → groupId[]
    for (const group of hoverGroups) {
        for (const col of group.cols) {
            if (!colToGroups.has(col)) colToGroups.set(col, []);
            colToGroups.get(col).push(group.id);
        }
    }
    for (const [, ids] of colToGroups) {
        ids.sort((a, b) => groupById.get(a).junctionRow - groupById.get(b).junctionRow);
    }

    const htmlRows = [];

    for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        let html = '';

        if (r === 0) {
            // Row 0: source expression — each char gets its own span so the
            // user can hover individual glyphs to trigger group highlighting.
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const groupIds = colToGroups.get(c);
                const syntaxClass = bqnSyntaxClass(ch);
                const classes = ['explain-source-char', syntaxClass].filter(Boolean).join(' ');
                if (groupIds && groupIds.length > 0) {
                    html += `<span class="${classes}" data-col="${c}" data-groups="${groupIds.join(',')}">${esc(ch)}</span>`;
                } else {
                    html += `<span class="${classes}" data-col="${c}">${esc(ch)}</span>`;
                }
            }
        } else {
            // Rows 1+: connector/junction rows — plain syntax highlighting only.
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const singleGlyph = !BOX_CHARS.has(ch) && ch !== ' ';
                const syntaxClass = singleGlyph ? bqnSyntaxClass(ch) : null;
                if (syntaxClass) {
                    html += `<span class="${syntaxClass}">${esc(ch)}</span>`;
                } else {
                    html += esc(ch);
                }
            }
        }

        htmlRows.push(html);
    }

    return { html: htmlRows.join('\n'), groups: hoverGroups };
}

// ---------------------------------------------------------------------------
// APL expression parser + renderer
// ---------------------------------------------------------------------------

// Glyph sets derived from syntaxRules.apl in syntax.js.
// Functions: all single-char APL primitive functions
const APL_FUNC_GLYPHS = new Set([
    ...`+-×÷⌈⌊|!○*⍟?~<>≤≥=≠≡≢∧∨⍲⍱⍴⍳,⍪⌽⊖⍉↑↓⊂⊃⌷⊣⊢∪∩⊥⊤⍋⍒∊⍷⍸⊆⎕⍎⍕⍬∆∇⍞⌹`,
]);
// 1-operators (monadic operators / adverbs)
const APL_MOD1_GLYPHS = new Set([...`/\\⌿⍀¨⍨`]);
// 2-operators (dyadic operators / conjunctions)
const APL_MOD2_GLYPHS = new Set([...`∘.⍤⍥⍣@⍠⌸⌺⌶⍛`]);

function aplSyntaxClass(ch) {
    if (APL_FUNC_GLYPHS.has(ch))  return 'syntax-function';
    if (APL_MOD1_GLYPHS.has(ch))  return 'syntax-modifier-monadic';
    if (APL_MOD2_GLYPHS.has(ch))  return 'syntax-modifier-dyadic';
    return null;
}

/**
 * Parse an APL source expression and return hover groups.
 *
 * Identical algorithm to parseBqnExprGroups — APL trains share the same
 * right-recursive fork/atop structure and left-to-right operator binding.
 * Only the glyph sets differ.
 *
 * @param {string} src
 * @returns {object[]}
 */
function parseAplExprGroups(src) {
    if (!src || !src.trim()) return [];

    // If the entire expression is wrapped in outer parens — e.g. "(+/÷≠)" —
    // strip them so the inner train is parsed as individual tokens.
    // Column indices are adjusted by colOffset so they still align with the
    // original source string used to render row 0.
    let colOffset = 0;
    {
        const cs = [...src];
        let s = 0; while (s < cs.length && cs[s] === ' ') s++;
        let e = cs.length - 1; while (e > s && cs[e] === ' ') e--;
        if (cs[s] === '(') {
            let depth = 0, matchAt = -1;
            for (let k = s; k <= e; k++) {
                if (cs[k] === '(') depth++;
                else if (cs[k] === ')') { depth--; if (depth === 0) { matchAt = k; break; } }
            }
            if (matchAt === e) { colOffset = s + 1; src = src.slice(s + 1, e); }
        }
    }

    // Step 1: Tokenize
    const chars = [...src];
    const tokens = [];
    let i = 0;

    while (i < chars.length) {
        const ch = chars[i];

        // Bracketed span: treat entire ( ... ) or { ... } as a single func token
        if (ch === '(' || ch === '{') {
            const close = ch === '(' ? ')' : '}';
            const cols = [i + colOffset];
            let depth = 1;
            i++;
            while (i < chars.length && depth > 0) {
                if (chars[i] === ch)    depth++;
                if (chars[i] === close) depth--;
                cols.push(i + colOffset);
                i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        if (APL_FUNC_GLYPHS.has(ch)) { tokens.push({ type: 'func', cols: [i + colOffset] }); i++; continue; }
        if (APL_MOD1_GLYPHS.has(ch)) { tokens.push({ type: 'mod1', cols: [i + colOffset] }); i++; continue; }
        if (APL_MOD2_GLYPHS.has(ch)) { tokens.push({ type: 'mod2', cols: [i + colOffset] }); i++; continue; }

        // Numeric literal (constant function tine): ¯?[0-9][0-9.eE¯]*
        if ((ch >= '0' && ch <= '9') || (ch === '¯' && i + 1 < chars.length && chars[i + 1] >= '0' && chars[i + 1] <= '9')) {
            const cols = [i + colOffset];
            i++;
            while (i < chars.length && (chars[i] >= '0' && chars[i] <= '9' || chars[i] === '.' || chars[i] === 'e' || chars[i] === 'E' || chars[i] === '¯')) {
                cols.push(i + colOffset); i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        // Everything else (spaces, ¯, ⍺, ⍵, letters, etc.): skip
        i++;
    }

    // Step 2: Parse modifier applications left-to-right into derived-function nodes
    const dervs = [];
    let ti = 0;

    while (ti < tokens.length) {
        if (tokens[ti].type !== 'func') { ti++; continue; }

        let cur = tokens[ti];
        ti++;

        for (;;) {
            if (ti < tokens.length && tokens[ti].type === 'mod1') {
                const modTok = tokens[ti];
                cur = {
                    type: '1-mod',
                    cols: [...cur.cols, ...modTok.cols],
                    operand: cur,
                    modifier: modTok,
                };
                ti++;
            } else if (
                ti < tokens.length &&
                tokens[ti].type === 'mod2' &&
                ti + 1 < tokens.length &&
                tokens[ti + 1].type === 'func'
            ) {
                const modTok   = tokens[ti];
                const rightTok = tokens[ti + 1];
                cur = {
                    type: '2-mod',
                    cols: [...cur.cols, ...modTok.cols, ...rightTok.cols],
                    left: cur,
                    modifier: modTok,
                    right: rightTok,
                };
                ti += 2;
            } else {
                break;
            }
        }

        dervs.push(cur);
    }

    if (dervs.length === 0) return [];

    // Step 3: Build train (right-recursive fork/atop — same rules as BQN)
    function makeTrain(ds) {
        const n = ds.length;
        if (n === 1) return ds[0];
        if (n === 2) return {
            type: 'atop',
            f: ds[0], g: ds[1],
            cols: [...ds[0].cols, ...ds[1].cols],
        };
        const rest = makeTrain(ds.slice(n % 2 === 0 ? 1 : 2));
        if (n % 2 === 0) {
            return {
                type: 'atop',
                f: ds[0], g: rest,
                cols: [...ds[0].cols, ...rest.cols],
            };
        }
        return {
            type: 'fork',
            f: ds[0], g: ds[1], h: rest,
            cols: [...ds[0].cols, ...ds[1].cols, ...rest.cols],
        };
    }

    const trainRoot = makeTrain(dervs);

    // Step 4: Walk tree to extract groups
    const groups = [];

    function extractGroups(node, depth) {
        if (!node.operand && !node.left && !node.f) return node.cols;

        let allCols;
        let parts;
        switch (node.type) {
            case '1-mod': {
                const opCols  = extractGroups(node.operand,   depth + 1);
                const modCols = extractGroups(node.modifier,  depth + 1);
                allCols = [...opCols, ...modCols];
                parts = [
                    { role: 'operand',  cols: opCols  },
                    { role: 'modifier', cols: modCols },
                ];
                break;
            }
            case '2-mod': {
                const leftCols  = extractGroups(node.left,     depth + 1);
                const modCols   = extractGroups(node.modifier, depth + 1);
                const rightCols = extractGroups(node.right,    depth + 1);
                allCols = [...leftCols, ...modCols, ...rightCols];
                parts = [
                    { role: 'left',     cols: leftCols  },
                    { role: 'modifier', cols: modCols   },
                    { role: 'right',    cols: rightCols },
                ];
                break;
            }
            case 'atop': {
                const fCols = extractGroups(node.f, depth + 1);
                const gCols = extractGroups(node.g, depth + 1);
                allCols = [...fCols, ...gCols];
                parts = [
                    { role: 'f', cols: fCols },
                    { role: 'g', cols: gCols },
                ];
                break;
            }
            case 'fork': {
                const fCols = extractGroups(node.f, depth + 1);
                const gCols = extractGroups(node.g, depth + 1);
                const hCols = extractGroups(node.h, depth + 1);
                allCols = [...fCols, ...gCols, ...hCols];
                parts = [
                    { role: 'f', cols: fCols },
                    { role: 'g', cols: gCols },
                    { role: 'h', cols: hCols },
                ];
                break;
            }
            default:
                return node.cols;
        }

        groups.push({
            id: groups.length,
            type: node.type,
            cols: allCols,
            junctionRow: -depth,
            parts,
        });

        return allCols;
    }

    extractGroups(trainRoot, 0);
    return groups;
}

/**
 * Render an APL train tree as interactive HTML.
 *
 * Unlike BQN's )explain output, Dyalog's ]boxing -trains=tree does not
 * include the source expression as the first row. This function prepends
 * `source` as row 0, then renders the tree rows below it.
 *
 * @param {string} source   - the APL expression that was evaluated
 * @param {string} treeText - the raw ]boxing train tree output
 * @returns {{ html: string, groups: object[] }}
 */
export function renderAplExplainTree(source, treeText) {
    const treeLines = treeText.split('\n');
    while (treeLines.length > 0 && treeLines[treeLines.length - 1].trim() === '') treeLines.pop();

    // Center the source expression above the tree (tree always starts at col 0).
    const treeWidth   = treeLines.reduce((m, l) => Math.max(m, [...l].length), 0);
    const sourceWidth = [...source].length;
    const centerPad   = ' '.repeat(Math.max(0, Math.floor((treeWidth - sourceWidth) / 2)));

    const rows = [source, ...treeLines];

    const hoverGroups = parseAplExprGroups(source);

    if (hoverGroups.length === 0) {
        // No parseable groups: just prepend source plainly and highlight the tree
        const sourceHtml = [...source].map(ch => {
            const cls = aplSyntaxClass(ch);
            return cls ? `<span class="${cls}">${esc(ch)}</span>` : esc(ch);
        }).join('');
        const treeHtml = treeLines.map(line => {
            return [...line].map(ch => {
                const singleGlyph = !BOX_CHARS.has(ch) && ch !== ' ';
                const cls = singleGlyph ? aplSyntaxClass(ch) : null;
                return cls ? `<span class="${cls}">${esc(ch)}</span>` : esc(ch);
            }).join('');
        }).join('\n');
        return { html: centerPad + sourceHtml + '\n' + treeHtml, groups: [] };
    }

    const grid = rows.map(r => [...r]);

    // Build col → groupId[] map for row 0 hover targets
    const groupById = new Map(hoverGroups.map(g => [g.id, g]));
    const colToGroups = new Map();
    for (const group of hoverGroups) {
        for (const col of group.cols) {
            if (!colToGroups.has(col)) colToGroups.set(col, []);
            colToGroups.get(col).push(group.id);
        }
    }
    for (const [, ids] of colToGroups) {
        ids.sort((a, b) => groupById.get(a).junctionRow - groupById.get(b).junctionRow);
    }

    const htmlRows = [];

    for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        let html = '';

        if (r === 0) {
            // Row 0: source expression — interactive spans
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const groupIds = colToGroups.get(c);
                const syntaxClass = aplSyntaxClass(ch);
                const classes = ['explain-source-char', syntaxClass].filter(Boolean).join(' ');
                if (groupIds && groupIds.length > 0) {
                    html += `<span class="${classes}" data-col="${c}" data-groups="${groupIds.join(',')}">${esc(ch)}</span>`;
                } else {
                    html += `<span class="${classes}" data-col="${c}">${esc(ch)}</span>`;
                }
            }
        } else {
            // Rows 1+: tree connector rows — plain APL syntax highlighting
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const singleGlyph = !BOX_CHARS.has(ch) && ch !== ' ';
                const syntaxClass = singleGlyph ? aplSyntaxClass(ch) : null;
                if (syntaxClass) {
                    html += `<span class="${syntaxClass}">${esc(ch)}</span>`;
                } else {
                    html += esc(ch);
                }
            }
        }

        htmlRows.push(r === 0 ? centerPad + html : html);
    }

    return { html: htmlRows.join('\n'), groups: hoverGroups };
}
// ---------------------------------------------------------------------------

export const J_COMBINATOR_INFO = {
    'fork': {
        name: '3-train (fork)',
        monad: '(f g h) y = (f y) g (h y)',
        dyad:  'x (f g h) y = (x f y) g (x h y)',
    },
    'atop': {
        // J 2-train is a hook, not an atop — the left verb is used dyadically
        name: '2-train (hook)',
        monad: '(u v) y = u y (v y)',
        dyad:  'x (u v) y = x u (v y)',
    },
    '1-mod': {
        name: 'adverb application',
        monad: '(u A) y = u A y',
        dyad:  'x (u A) y = x u A y',
    },
    '2-mod': {
        name: 'conjunction application',
        monad: '(u C v) y = u C v y',
        dyad:  'x (u C v) y = x u C v y',
    },
};

// J glyph sets (single-character tokens)
const J_FUNC_GLYPHS = new Set([...`+-*%^$~|,;#{}[]"?!<>=`]);
const J_MOD1_GLYPHS = new Set([...`/\\`]);
const J_MOD2_GLYPHS = new Set([...`@&\`:`]);

// Multi-character J tokens — sets are checked longest-first in the tokenizer.
// Sourced from syntaxRules.j.multiChar in syntax.js.
const J_MC3_MOD2 = new Set(['F..', 'F.:', 'F:.', 'F::']);
const J_MC3_FUNC = new Set(['{::']);

const J_MC2_FUNC = new Set([
    '{.', '}.', '{:', '}:', ',.', ',:', '<.', '>.', '+.', '*.', '-.', '%.', '^.',
    '|.', '$.', '~.', '#.', '#:', '<:', '>:', '+:', '*:', '-:', '%:', '~:', '=.',
    '?.', '?:', '".', '":', '!.', 'i.', 'i:', 'j.', 'o.', 'p.', 'p:', 'q.', 'q:',
    'r.', 'A.', 'C.', 'e.', 'E.', 'I.', 'L.', 's:', 'u:', 'x:', '$:', '[:', '_.',
]);
const J_MC2_MOD1 = new Set(['/.', '\\.', 'b.', 'f.', 'M.', 't.', 't:']);
const J_MC2_MOD2 = new Set([
    '@.', '@:', '&.', '&:', '!:', 'd.', 'D.', 'D:', 'F.', 'F:', 'H.', 'L:', 'S:', 'T.',
    '^:', '`:', '".',
]);

/**
 * Tokenize a J source expression into { type, cols } tokens.
 * Handles multi-char tokens (3-char then 2-char before single-char),
 * string literals, and NB. comments.
 *
 * @param {string} src
 * @returns {object[]}
 */
function tokenizeJ(src) {
    const chars = [...src];
    const n = chars.length;
    const tokens = [];
    let i = 0;

    while (i < n) {
        const ch = chars[i];

        // NB. comment — skip to end of line
        if (ch === 'N' && i + 2 < n && chars[i + 1] === 'B' && chars[i + 2] === '.') {
            while (i < n && chars[i] !== '\n') i++;
            continue;
        }

        // String literal '...' — skip (doubled ' is escape)
        if (ch === "'") {
            i++;
            while (i < n) {
                if (chars[i] === "'") {
                    i++;
                    if (i < n && chars[i] === "'") { i++; continue; }
                    break;
                }
                i++;
            }
            continue;
        }

        // Bracketed sub-expression ( ... ) → single func token
        if (ch === '(') {
            const cols = [i];
            let depth = 1;
            i++;
            while (i < n && depth > 0) {
                if (chars[i] === '(') depth++;
                if (chars[i] === ')') depth--;
                cols.push(i);
                i++;
            }
            tokens.push({ type: 'func', cols });
            continue;
        }

        // Try 3-char tokens first
        if (i + 2 < n) {
            const s3 = chars[i] + chars[i + 1] + chars[i + 2];
            if (J_MC3_MOD2.has(s3)) { tokens.push({ type: 'mod2', cols: [i, i + 1, i + 2] }); i += 3; continue; }
            if (J_MC3_FUNC.has(s3)) { tokens.push({ type: 'func', cols: [i, i + 1, i + 2] }); i += 3; continue; }
        }

        // Try 2-char tokens
        if (i + 1 < n) {
            const s2 = chars[i] + chars[i + 1];
            if (J_MC2_MOD2.has(s2)) { tokens.push({ type: 'mod2', cols: [i, i + 1] }); i += 2; continue; }
            if (J_MC2_MOD1.has(s2)) { tokens.push({ type: 'mod1', cols: [i, i + 1] }); i += 2; continue; }
            if (J_MC2_FUNC.has(s2)) { tokens.push({ type: 'func', cols: [i, i + 1] }); i += 2; continue; }
        }

        // Single-char tokens
        if (J_FUNC_GLYPHS.has(ch)) { tokens.push({ type: 'func', cols: [i] }); i++; continue; }
        if (J_MOD1_GLYPHS.has(ch)) { tokens.push({ type: 'mod1', cols: [i] }); i++; continue; }
        if (J_MOD2_GLYPHS.has(ch)) { tokens.push({ type: 'mod2', cols: [i] }); i++; continue; }

        // Numeric literal (constant function tine): [0-9][0-9._e]* or _[0-9]... (J negative)
        // Type 'noun' so train parsing treats them as func but they get no syntax colour.
        if (ch >= '0' && ch <= '9') {
            const cols = [i];
            i++;
            while (i < n && (chars[i] >= '0' && chars[i] <= '9' || chars[i] === '.' || chars[i] === 'e' || chars[i] === '_')) {
                cols.push(i); i++;
            }
            tokens.push({ type: 'noun', cols });
            continue;
        }
        if (ch === '_' && i + 1 < n && chars[i + 1] >= '0' && chars[i + 1] <= '9') {
            const cols = [i];
            i++;
            while (i < n && (chars[i] >= '0' && chars[i] <= '9' || chars[i] === '.' || chars[i] === 'e' || chars[i] === '_')) {
                cols.push(i); i++;
            }
            tokens.push({ type: 'noun', cols });
            continue;
        }

        // Everything else (spaces, letters not part of a token): skip
        i++;
    }

    return tokens;
}

/**
 * Parse a J source expression and return hover groups plus a column→CSS class map.
 * The colToClass map is used for syntax colouring of row 0 in renderJExplainTree
 * and correctly handles multi-char tokens (e.g. i., @:) as a unit.
 *
 * @param {string} src
 * @returns {{ groups: object[], colToClass: Map<number, string> }}
 */
function parseJExprGroups(src) {
    if (!src || !src.trim()) return { groups: [], colToClass: new Map() };

    // Strip outer parens if the entire source is wrapped in matching ( ... )
    // so "(+/ % #)" is parsed like "+/ % #" but with column indices preserved.
    let colOffset = 0;
    {
        const cs = [...src];
        let s = 0; while (s < cs.length && cs[s] === ' ') s++;
        let e = cs.length - 1; while (e > s && cs[e] === ' ') e--;
        if (cs[s] === '(') {
            let depth = 0, matchAt = -1;
            for (let k = s; k <= e; k++) {
                if (cs[k] === '(') depth++;
                else if (cs[k] === ')') { depth--; if (depth === 0) { matchAt = k; break; } }
            }
            if (matchAt === e) { colOffset = s + 1; src = src.slice(s + 1, e); }
        }
    }

    let tokens = tokenizeJ(src);

    // Shift all column indices so they align with the original (pre-strip) source
    if (colOffset > 0) {
        tokens = tokens.map(tok => ({ ...tok, cols: tok.cols.map(c => c + colOffset) }));
    }

    // Build col → CSS class map from token types
    const colToClass = new Map();
    for (const tok of tokens) {
        if (tok.type === 'noun') continue; // nouns are uncoloured
        const cls = tok.type === 'func' ? 'syntax-function'
                  : tok.type === 'mod1' ? 'syntax-modifier-monadic'
                  : 'syntax-modifier-dyadic';
        for (const c of tok.cols) colToClass.set(c, cls);
    }

    // Parse modifier applications left-to-right into derived-function nodes
    const dervs = [];
    let ti = 0;

    while (ti < tokens.length) {
        if (tokens[ti].type !== 'func' && tokens[ti].type !== 'noun') { ti++; continue; }
        let cur = tokens[ti];
        ti++;

        for (;;) {
            if (ti < tokens.length && tokens[ti].type === 'mod1') {
                const modTok = tokens[ti];
                cur = {
                    type: '1-mod',
                    cols: [...cur.cols, ...modTok.cols],
                    operand: cur,
                    modifier: modTok,
                };
                ti++;
            } else if (
                ti < tokens.length &&
                tokens[ti].type === 'mod2' &&
                ti + 1 < tokens.length &&
                (tokens[ti + 1].type === 'func' || tokens[ti + 1].type === 'noun')
            ) {
                const modTok   = tokens[ti];
                const rightTok = tokens[ti + 1];
                cur = {
                    type: '2-mod',
                    cols: [...cur.cols, ...modTok.cols, ...rightTok.cols],
                    left: cur,
                    modifier: modTok,
                    right: rightTok,
                };
                ti += 2;
            } else {
                break;
            }
        }

        dervs.push(cur);
    }

    if (dervs.length === 0) return { groups: [], colToClass };

    // Build train — same right-recursive fork/hook structure as APL/BQN
    // (J calls the 2-train a "hook" but the structural parsing is identical)
    function makeTrain(ds) {
        const n = ds.length;
        if (n === 1) return ds[0];
        if (n === 2) return {
            type: 'atop',   // stored as 'atop'; tooltip shows "2-train (hook)" via J_COMBINATOR_INFO
            f: ds[0], g: ds[1],
            cols: [...ds[0].cols, ...ds[1].cols],
        };
        const rest = makeTrain(ds.slice(n % 2 === 0 ? 1 : 2));
        if (n % 2 === 0) {
            return {
                type: 'atop',
                f: ds[0], g: rest,
                cols: [...ds[0].cols, ...rest.cols],
            };
        }
        return {
            type: 'fork',
            f: ds[0], g: ds[1], h: rest,
            cols: [...ds[0].cols, ...ds[1].cols, ...rest.cols],
        };
    }

    const trainRoot = makeTrain(dervs);

    // Walk tree to extract groups
    const groups = [];

    function extractGroups(node, depth) {
        if (!node.operand && !node.left && !node.f) return node.cols;

        let allCols;
        let parts;
        switch (node.type) {
            case '1-mod': {
                const opCols  = extractGroups(node.operand,   depth + 1);
                const modCols = extractGroups(node.modifier,  depth + 1);
                allCols = [...opCols, ...modCols];
                parts = [
                    { role: 'operand',  cols: opCols  },
                    { role: 'modifier', cols: modCols },
                ];
                break;
            }
            case '2-mod': {
                const leftCols  = extractGroups(node.left,     depth + 1);
                const modCols   = extractGroups(node.modifier, depth + 1);
                const rightCols = extractGroups(node.right,    depth + 1);
                allCols = [...leftCols, ...modCols, ...rightCols];
                parts = [
                    { role: 'left',     cols: leftCols  },
                    { role: 'modifier', cols: modCols   },
                    { role: 'right',    cols: rightCols },
                ];
                break;
            }
            case 'atop': {
                const fCols = extractGroups(node.f, depth + 1);
                const gCols = extractGroups(node.g, depth + 1);
                allCols = [...fCols, ...gCols];
                parts = [
                    { role: 'f', cols: fCols },
                    { role: 'g', cols: gCols },
                ];
                break;
            }
            case 'fork': {
                const fCols = extractGroups(node.f, depth + 1);
                const gCols = extractGroups(node.g, depth + 1);
                const hCols = extractGroups(node.h, depth + 1);
                allCols = [...fCols, ...gCols, ...hCols];
                parts = [
                    { role: 'f', cols: fCols },
                    { role: 'g', cols: gCols },
                    { role: 'h', cols: hCols },
                ];
                break;
            }
            default:
                return node.cols;
        }

        groups.push({
            id: groups.length,
            type: node.type,
            cols: allCols,
            junctionRow: -depth,
            parts,
        });

        return allCols;
    }

    extractGroups(trainRoot, 0);
    return { groups, colToClass };
}

/**
 * Render a J train tree as interactive HTML.
 *
 * Like renderAplExplainTree, the source expression is prepended as row 0
 * since J's (9!:3)4 output does not include it.  J multi-char tokens
 * (i., @:, etc.) are handled both for hover grouping and for syntax colouring.
 *
 * @param {string} source   - the J expression that was evaluated
 * @param {string} treeText - the raw (9!:3)4 train tree output
 * @returns {{ html: string, groups: object[] }}
 */
export function renderJExplainTree(source, treeText) {
    const treeLines = treeText.split('\n');
    while (treeLines.length > 0 && treeLines[treeLines.length - 1].trim() === '') treeLines.pop();

    // Center the source expression above the tree (tree always starts at col 0).
    const treeWidth   = treeLines.reduce((m, l) => Math.max(m, [...l].length), 0);
    const sourceWidth = [...source].length;
    const centerPad   = ' '.repeat(Math.max(0, Math.floor((treeWidth - sourceWidth) / 2)));

    const { groups: hoverGroups, colToClass } = parseJExprGroups(source);
    const sourceChars = [...source];

    if (hoverGroups.length === 0) {
        // No parseable groups: plain source row + highlighted tree
        const sourceHtml = sourceChars.map((ch, c) => {
            const cls = colToClass.get(c) || null;
            const classes = ['explain-source-char', cls].filter(Boolean).join(' ');
            return `<span class="${classes}" data-col="${c}">${esc(ch)}</span>`;
        }).join('');
        const treeHtml = treeLines.map(line => highlightTrainTreeGlyphs(line, 'j')).join('\n');
        return { html: centerPad + sourceHtml + '\n' + treeHtml, groups: [] };
    }

    // Build col → groupId[] map for hover targets
    const groupById = new Map(hoverGroups.map(g => [g.id, g]));
    const colToGroups = new Map();
    for (const group of hoverGroups) {
        for (const col of group.cols) {
            if (!colToGroups.has(col)) colToGroups.set(col, []);
            colToGroups.get(col).push(group.id);
        }
    }
    for (const [, ids] of colToGroups) {
        ids.sort((a, b) => groupById.get(a).junctionRow - groupById.get(b).junctionRow);
    }

    // Row 0: source expression — interactive spans with multi-char-aware syntax class
    let row0Html = '';
    for (let c = 0; c < sourceChars.length; c++) {
        const ch = sourceChars[c];
        const groupIds = colToGroups.get(c);
        const syntaxClass = colToClass.get(c) || null;
        const classes = ['explain-source-char', syntaxClass].filter(Boolean).join(' ');
        if (groupIds && groupIds.length > 0) {
            row0Html += `<span class="${classes}" data-col="${c}" data-groups="${groupIds.join(',')}">${esc(ch)}</span>`;
        } else {
            row0Html += `<span class="${classes}" data-col="${c}">${esc(ch)}</span>`;
        }
    }

    // Rows 1+: reuse highlightTrainTreeGlyphs which handles J multi-char tokens
    const treeHtml = treeLines.map(line => highlightTrainTreeGlyphs(line, 'j')).join('\n');

    return { html: centerPad + row0Html + '\n' + treeHtml, groups: hoverGroups };
}
