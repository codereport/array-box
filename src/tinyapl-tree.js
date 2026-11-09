import { syntaxRules, getSyntaxClass } from './syntax.js';
import { layoutFunctionTree, renderFunctionExplainTree } from './explain-tree.js';

export const TINYAPL_COMBINATOR_INFO = {
    fork: {
        name: '3-train (fork)',
        monad: '⦅F⋄G⋄H⦆ y ≡ (F y) G (H y)',
        dyad: 'x ⦅F⋄G⋄H⦆ y ≡ (x F y) G (x H y)',
    },
    atop: {
        name: '2-train (atop)',
        monad: '⦅F⋄G⦆ y ≡ F (G y)',
        dyad: 'x ⦅F⋄G⦆ y ≡ F (x G y)',
    },
    '1-mod': {
        name: 'Adverb application',
        monad: '(F A) y',
        dyad: 'x (F A) y',
    },
    '2-mod': {
        name: 'Conjunction application',
        monad: '(F C G) y',
        dyad: 'x (F C G) y',
    },
};

const RULES = syntaxRules.tinyapl;
const FUNCTIONS = new Set(RULES.functions);
const MODIFIERS = new Set([...RULES.monadic, ...RULES.dyadic]);
const CONSTANTS = new Set(RULES.constants);
const PAIRS = { '(': ')', '⦅': '⦆', '{': '}', '⟨': '⟩', '⟪': '⟫', '⦋': '⦌' };

// Parse the interpreter's representation, never an unevaluated editor selection.
// Derived functions parenthesize their operands and trains separate their tines
// with diamonds. Unknown syntax must fall back intact instead of drawing a
// plausible but incomplete tree.
function parseRepresentation(representation) {
    const chars = [...representation];
    let pos = 0;
    const skip = () => { while (/\s/.test(chars[pos] ?? '') && pos < chars.length) pos++; };
    const leaf = (text, kind = 'function', css = 'syntax-function') => ({ type: 'func', text, kind, css });

    function quoted() {
        const start = pos;
        const quote = chars[pos++];
        while (pos < chars.length) {
            const ch = chars[pos++];
            if (ch === '⍘') { pos++; continue; }
            if (ch === quote) return chars.slice(start, pos).join('');
        }
        throw new Error('Unclosed literal');
    }

    function opaque() {
        const start = pos;
        const stack = [PAIRS[chars[pos++]]];
        while (pos < chars.length && stack.length) {
            const ch = chars[pos];
            if (ch === '"' || ch === "'") { quoted(); continue; }
            if (PAIRS[ch]) stack.push(PAIRS[ch]);
            else if (ch === stack.at(-1)) stack.pop();
            pos++;
        }
        if (stack.length) throw new Error('Unclosed operand');
        const text = chars.slice(start, pos).join('');
        if (text.includes('\n')) throw new Error('Multiline operand');
        return leaf(text, chars[start] === '{' ? 'function' : 'array',
            chars[start] === '{' ? null : 'syntax-number');
    }

    function train(tines) {
        if (!tines.length || tines.some(tine => tine && tine.kind !== 'function')) {
            throw new Error('Unsupported train tines');
        }
        function build(ts) {
            if (ts.length === 1 && ts[0]) return ts[0];
            if (ts.length === 2 && ts.every(Boolean)) {
                return { type: 'atop', f: ts[0], g: ts[1], kind: 'function' };
            }
            if (ts.length < 3) throw new Error('Incomplete train');
            const offset = ts.length % 2 === 0 ? 1 : 2;
            const rest = build(ts.slice(offset));
            if (offset === 1) {
                if (!ts[0]) throw new Error('Empty atop');
                return { type: 'atop', f: ts[0], g: rest, kind: 'function' };
            }
            if (!ts[1]) throw new Error('Missing middle tine');
            return ts[0] ? { type: 'fork', f: ts[0], g: ts[1], h: rest, kind: 'function' }
                : { type: 'atop', f: ts[1], g: rest, kind: 'function' };
        }
        return { ...build(tines), trainTines: tines };
    }

    function primary(depth) {
        skip();
        if (depth > 50) throw new Error('Function tree is too deep');
        const ch = chars[pos];
        if (ch === '(') {
            pos++;
            const node = expression(depth + 1);
            skip();
            if (chars[pos++] !== ')') throw new Error('Unclosed group');
            return node;
        }
        if (ch === '⦅') {
            pos++;
            const tines = [];
            for (;;) {
                skip();
                if (chars[pos] === '⦆') { pos++; break; }
                if (pos >= chars.length) throw new Error('Unclosed train');
                tines.push(chars[pos] === '⋄' ? null : expression(depth + 1));
                skip();
                if (chars[pos] === '⋄') { pos++; continue; }
                if (chars[pos] !== '⦆') throw new Error('Missing train separator');
            }
            return train(tines);
        }
        if (ch === '"' || ch === "'") return leaf(quoted(), 'array', 'syntax-string');
        if (PAIRS[ch]) return opaque();
        const remaining = chars.slice(pos).join('');
        const number = remaining.match(RULES.numberPattern);
        if (number) {
            pos += [...number[0]].length;
            return leaf(number[0], 'array', 'syntax-number');
        }
        if (CONSTANTS.has(ch)) { pos++; return leaf(ch, 'array', 'syntax-number'); }
        if (FUNCTIONS.has(ch)) { pos++; return leaf(ch); }
        const identifier = remaining.match(/^(?:⎕)?[\p{L}_∆⍙][\p{L}\p{N}_∆⍙]*(?:→[\p{L}_∆⍙][\p{L}\p{N}_∆⍙]*)*/u);
        if (identifier && !MODIFIERS.has(ch)) {
            if (identifier[0].startsWith('_')) throw new Error('Modifier train');
            pos += [...identifier[0]].length;
            return { ...leaf(identifier[0]), named: true };
        }
        throw new Error('Unsupported function representation');
    }

    function expression(depth = 0) {
        let node = primary(depth);
        for (;;) {
            skip();
            const glyph = chars[pos];
            if (!MODIFIERS.has(glyph)) break;
            pos++;
            const modifier = leaf(glyph, 'modifier', getSyntaxClass(glyph, 'tinyapl'));
            skip();
            // TinyAPL also has modifiers with both arities, including ⍨ and ∙.
            // The canonical representation wraps every right operand in ().
            if (chars[pos] === '(') {
                node = { type: '2-mod', left: node, modifier, right: primary(depth + 1), kind: 'function' };
            } else {
                node = { type: '1-mod', operand: node, modifier, kind: 'function' };
            }
        }
        return node;
    }

    const root = expression();
    skip();
    if (pos !== chars.length) throw new Error('Unparsed function representation');
    return root;
}

/** Return a serializable tree only for an actual, fully understood function value. */
export function formatTinyaplFunctionTree(value) {
    if (value?.type !== 'function' || typeof value.repr !== 'string' || value.repr.length > 16000) return null;
    try {
        const root = parseRepresentation(value.repr);
        if (root.type === 'func') return null;
        const chars = [];
        const classes = [];
        const append = text => chars.push(...text);
        const containsName = node => node?.named ||
            ['operand', 'left', 'right', 'f', 'g', 'h'].some(key => node?.[key] && containsName(node[key]));
        function emit(node) {
            if (node.trainTines) {
                append('⦅');
                // Adjacent names would merge into one identifier in a compact train.
                const separated = node.trainTines.some(tine => containsName(tine));
                node.trainTines.forEach((tine, i) => {
                    if (separated && i) append('⋄');
                    if (tine) emit(tine);
                    else if (!separated) append('·');
                });
                append('⦆');
            } else if (node.type === 'func') {
                node.cols = [...node.text].map((ch, i) => {
                    const col = chars.length + i;
                    classes[col] = node.css ?? getSyntaxClass(ch, 'tinyapl');
                    return col;
                });
                append(node.text);
            } else if (node.type === '1-mod') {
                emit(node.operand);
                emit(node.modifier);
            } else if (node.type === '2-mod') {
                emit(node.left);
                emit(node.modifier);
                const wrap = !node.right.trainTines && node.right.type !== 'func';
                if (wrap) append('(');
                emit(node.right);
                if (wrap) append(')');
            }
        }
        emit(root);

        const groups = [];
        function collect(node, depth = 0) {
            if (node.type === 'func') return node.cols;
            const children = node.type === '1-mod' ? [['operand', node.operand], ['modifier', node.modifier]]
                : node.type === '2-mod' ? [['left', node.left], ['modifier', node.modifier], ['right', node.right]]
                : node.type === 'atop' ? [['f', node.f], ['g', node.g]]
                : [['f', node.f], ['g', node.g], ['h', node.h]];
            const parts = children.map(([role, child]) => ({ role, cols: collect(child, depth + 1) }));
            const cols = parts.flatMap(part => part.cols);
            groups.push({ id: groups.length, type: node.type, cols, junctionRow: -depth, parts });
            return cols;
        }
        collect(root);
        return {
            source: chars.join(''),
            text: layoutFunctionTree(root, [], 0, null).lines.join('\n'),
            groups,
            classes,
        };
    } catch {
        return null;
    }
}

export function renderTinyaplExplainTree(tree) {
    return renderFunctionExplainTree(tree.source, tree.text, tree.groups, 'tinyapl', tree.classes);
}
