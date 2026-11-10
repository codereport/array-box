import { getSyntaxClass, highlightCode } from './syntax.js';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

const COMPOSITIONS = new Set(['∘', '⍛', '○', '⍜', '⊸', '⟜', '⇾', '⇽', '⸚', '⁖']);
const children = node => ['f', 'g', 'h', 'operand', 'left', 'right']
    .map(key => node[key]).filter(Boolean);
const isExplicitFork = node => node.type === '2-mod' && node.modifier.text === '»' &&
    node.left?.type === '2-mod' && node.left.modifier.text === '«';
const canExpand = node => node.type === 'atop' || node.type === 'fork' || isExplicitFork(node) ||
    (node.type === '1-mod' && node.modifier.text === '⍨') ||
    (node.type === '2-mod' && COMPOSITIONS.has(node.modifier.text) &&
        // Array overloads of hooks and forks have different meanings. Keep the
        // whole call visible until their routing has been explicitly modeled.
        (['∘', '⍛', '○', '⍜'].includes(node.modifier.text) ||
            (node.left.kind !== 'array' && node.right.kind !== 'array')));

export function tinyaplExpandableGroups(root) {
    const groups = [];
    function walk(node) {
        if (canExpand(node)) groups.push(node.id);
        children(node).forEach(walk);
    }
    walk(root);
    return groups;
}

class ValenceError extends Error {}

/** Symbolic calls only: constructing a diagram never executes user code. */
export function buildTinyaplEvaluation(tree, { valence = 1, expanded = new Set(['root']), collapsed = new Set() } = {}) {
    const nodes = [];
    const scopes = [];
    const add = data => {
        if (nodes.length >= 400) throw new ValenceError('This diagram is large. Collapse a group to explore it in smaller parts.');
        const node = { id: nodes.length, ...data };
        nodes.push(node);
        return node.id;
    };
    const args = valence === 2
        ? [add({ kind: 'input', label: 'x', args: [] }), add({ kind: 'input', label: 'y', args: [] })]
        : [add({ kind: 'input', label: 'y', args: [] })];
    const constant = fn => add({ kind: 'constant', label: fn.label, fn, args: [] });

    function apply(fn, inputs, depth = 0, key = 'root') {
        if (depth > 80) throw new ValenceError('Collapse a group to explore this deeply nested function.');
        if (fn.kind === 'array') return constant(fn);
        const dyad = inputs.length === 2;
        const x = inputs[0], y = inputs.at(-1);
        const glyph = fn.modifier?.text;
        // Report known valence restrictions even when the call is collapsed.
        if (glyph === '⸚' && !dyad) throw new ValenceError('Mirror (⸚) is dyadic. Choose x y to see its argument flow.');
        if (fn.type === 'atop' && dyad && ((fn.f.kind === 'array') !== (fn.g.kind === 'array'))) {
            throw new ValenceError('This binding is monadic. Choose y to see its argument flow.');
        }
        if (['∘', '⍛'].includes(glyph) && dyad && ((fn.left.kind === 'array') !== (fn.right.kind === 'array'))) {
            throw new ValenceError('This binding is monadic. Choose y to see its argument flow.');
        }
        const expandable = canExpand(fn);
        if (!expandable || collapsed.has(key) || !(expanded.has(fn.id) || expanded.has(key))) {
            return add({ kind: 'call', label: fn.label, fn, args: inputs, expandable, key });
        }
        // Use the call's position, so two uses of the same source function can
        // be opened independently. Source IDs still support Expand all.
        let callIndex = 0;
        const call = (operand, input) => apply(operand, input, depth + 1, `${key}.${callIndex++}`);
        let result;
        if (fn.type === 'atop') {
            if (fn.f.kind === 'array' && fn.g.kind === 'array') result = constant(fn.f);
            else if (fn.f.kind === 'array') result = call(fn.g, [constant(fn.f), y]);
            else if (fn.g.kind === 'array') result = call(fn.f, [y, constant(fn.g)]);
            else result = call(fn.f, [call(fn.g, inputs)]);
        } else if (fn.type === 'fork' || isExplicitFork(fn)) {
            const [f, g, h] = fn.type === 'fork' ? [fn.f, fn.g, fn.h] : [fn.left.left, fn.left.right, fn.right];
            result = g.kind === 'array' ? constant(g) : call(g, [call(f, inputs), call(h, inputs)]);
        } else if (glyph === '⍨') {
            result = fn.operand.kind === 'array' ? constant(fn.operand)
                : call(fn.operand, dyad ? [y, x] : [y, y]);
        } else {
            const f = fn.left, g = fn.right;
            if (glyph === '⁖') result = call(dyad ? g : f, inputs);
            else if (glyph === '⸚') result = call(f, [call(g, [y, x]), call(g, [x, y])]);
            else if (['∘', '⍛', '○', '⍜'].includes(glyph)) {
                const reverse = glyph === '⍛' || glyph === '⍜';
                const over = glyph === '○' || glyph === '⍜';
                const outer = reverse ? g : f, inner = reverse ? f : g;
                if (outer.kind === 'array' || inner.kind === 'array') {
                    if (outer.kind === 'array' && inner.kind === 'array') {
                        // These overloads are left as a single honest call.
                        return add({ kind: 'call', label: fn.label, fn, args: inputs, expandable: false });
                    }
                    const func = outer.kind === 'array' ? inner : outer;
                    if (dyad && over) result = call(func, inputs);
                    else if (dyad) throw new ValenceError('This binding is monadic. Choose y to see its argument flow.');
                    else result = call(func, outer.kind === 'array'
                        ? [constant(outer), y] : [y, constant(inner)]);
                } else result = call(outer, dyad && over
                    ? [call(inner, [x]), call(inner, [y])] : [call(inner, inputs)]);
            } else if (glyph === '⊸') result = call(g, [call(f, [x]), y]);
            else if (glyph === '⟜') result = call(f, [x, call(g, [y])]);
            else if (glyph === '⇾') result = call(g, [call(f, inputs), y]);
            else if (glyph === '⇽') result = call(f, [x, call(g, inputs)]);
        }
        scopes.push({ fn, result, key });
        return result;
    }

    try {
        const result = apply(tree.root, args);
        // Constants and valence selectors can leave intermediate inputs unused.
        // Keep x/y at the bottom, but never connect them to a constant result.
        const reachable = new Set(args);
        function visit(id) {
            if (reachable.has(id) && nodes[id].kind !== 'input') return;
            reachable.add(id);
            nodes[id].args.forEach(visit);
        }
        visit(result);
        return { nodes: nodes.filter(node => reachable.has(node.id)), result, scopes, valence };
    } catch (error) {
        if (error instanceof ValenceError) return { error: error.message, nodes: [], scopes: [], valence };
        throw error;
    }
}

export function tinyaplEvaluationExpression(model, id = model.result) {
    const byId = new Map(model.nodes.map(node => [node.id, node]));
    let remaining = 180;
    function expression(nodeId, nested = false) {
        if (--remaining < 0) return '…';
        const node = byId.get(nodeId);
        if (node.kind !== 'call') return node.label;
        const args = node.args.map(arg => expression(arg, true));
        const label = node.fn.type === 'func' ? node.label : `(${node.label})`;
        const text = args.length === 2 ? `${args[0]} ${label} ${args[1]}` : `${label} ${args[0]}`;
        return nested ? `(${text})` : text;
    }
    return expression(id);
}

function layout(model) {
    const nodes = new Map(model.nodes.map(node => [node.id, { ...node, rank: 0 }]));
    const gap = 44;
    function measure(id) {
        const node = nodes.get(id);
        if (node.width !== undefined) return node.width;
        node.labelWidth = Math.max(32, [...node.label].length * 20);
        node.boxWidth = node.labelWidth + (node.expandable ? 52 : 24);
        const branches = [...new Set(node.args)].filter(arg => nodes.get(arg).kind !== 'input');
        node.branches = branches;
        node.width = Math.max(node.boxWidth + 36, branches.reduce((sum, arg) => sum + measure(arg), 0) + gap * (branches.length - 1), 136);
        return node.width;
    }
    const width = Math.max(420, measure(model.result) + 64);
    const placed = new Set();
    function place(id, x, rank) {
        const node = nodes.get(id);
        // Propagate the longest route through shared intermediate values.
        if (placed.has(id) && rank <= node.rank) return;
        node.rank = Math.max(node.rank, rank);
        if (!placed.has(id)) { node.x = x; placed.add(id); }
        const total = node.branches.reduce((sum, arg) => sum + nodes.get(arg).width, 0) + gap * (node.branches.length - 1);
        let left = node.x - total / 2;
        for (const arg of node.branches) {
            const child = nodes.get(arg);
            place(arg, left + child.width / 2, node.rank + 1);
            left += child.width + gap;
        }
    }
    place(model.result, width / 2, 0);
    const maxRank = Math.max(...[...nodes.values()].filter(n => n.kind !== 'input').map(n => n.rank));
    const inputs = [...nodes.values()].filter(n => n.kind === 'input');
    inputs.forEach((node, i) => {
        node.x = inputs.length === 1 ? width / 2 : width / 2 + (i ? 1 : -1) * Math.min(110, width / 4);
        node.rank = maxRank + 1;
        node.boxWidth = 40;
    });
    nodes.forEach(node => { node.y = 34 + node.rank * 88; });
    return { nodes: [...nodes.values()], width, height: 34 + (maxRank + 1) * 88 + 48 };
}

function svgLabel(node, tree) {
    if (!node.fn) return escape(node.label);
    return [...node.label].map((ch, i) => {
        const col = node.fn.cols?.[i];
        const cls = node.fn.type === 'func' ? tree.classes[col] : getSyntaxClass(ch, 'tinyapl');
        return `<tspan${cls ? ` class="${escape(cls)}"` : ''}>${escape(ch)}</tspan>`;
    }).join('');
}

function renderDiagram(model, tree) {
    const { nodes, width, height } = layout(model);
    const byId = new Map(nodes.map(node => [node.id, node]));
    const paths = nodes.flatMap(node => node.args.map((arg, port) => {
        const input = byId.get(arg);
        const endX = node.x + (node.args.length === 2 ? (port ? 12 : -12) : 0);
        const endY = node.y + 27, startY = input.y - 27;
        const bendY = (startY + endY) / 2;
        return `<path class="eval-edge" data-from="${arg}" data-to="${node.id}" data-port="${port}" d="M ${input.x} ${startY} C ${input.x} ${bendY}, ${endX} ${bendY}, ${endX} ${endY}"/>`;
    })).join('');
    const glyphs = nodes.map(node => {
        const expandable = node.expandable;
        const title = node.kind === 'input' ? `${node.label}: ${node.label === 'x' ? 'left' : 'right'} argument`
            : node.kind === 'constant' ? `Constant ${node.label}`
                : `${expandable ? 'Expand ' : ''}${node.label} · ${node.args.length === 2 ? 'dyadic' : 'monadic'} call`;
        return `<g class="eval-node eval-${node.kind}${expandable ? ' eval-expandable' : ''}" data-node="${node.id}"${node.fn ? ` data-cols="${node.fn.cols.join(',')}"` : ''}
            ${expandable ? `data-expand="${node.key}" role="button" tabindex="0" aria-label="${escape(title)}" aria-expanded="false"` : 'tabindex="0" role="group"'}>
            <title>${escape(title)}</title>
            <rect class="eval-node-bg" x="${node.x - node.boxWidth / 2}" y="${node.y - 26}" width="${node.boxWidth}" height="52" rx="12"/>
            <text x="${node.x - (expandable ? 12 : 0)}" y="${node.y}" text-anchor="middle" dominant-baseline="central">${svgLabel(node, tree)}</text>
            ${expandable ? `<text class="eval-plus" x="${node.x + node.boxWidth / 2 - 17}" y="${node.y}" text-anchor="middle" dominant-baseline="central">+</text>` : ''}
            ${node.kind === 'input' ? `<text class="eval-input-caption" x="${node.x}" y="${node.y + 37}" text-anchor="middle">${node.label === 'x' ? 'left' : 'right'} argument</text>` : ''}
        </g>`;
    }).join('');
    return `<svg class="eval-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:${width}px" role="group" aria-label="Evaluation diagram. Arguments flow from bottom to top.">
        ${paths}${glyphs}</svg>`;
}

// Prefer a single line at a readable font size. Toolbar expressions wrap
// when even the minimum font size cannot fit, without a horizontal scrollbar.
function fitText(element, maximum, minimum) {
    if (!element) return;
    const source = element.classList.contains('eval-source');
    if (source) element.classList.remove('eval-source-wrap');
    let size = maximum;
    element.style.fontSize = `${size}px`;
    while (element.scrollWidth > element.clientWidth && size > minimum) {
        size = Math.max(minimum, size - 0.5);
        element.style.fontSize = `${size}px`;
    }
    if (source && element.scrollWidth > element.clientWidth) element.classList.add('eval-source-wrap');
}

/** Mount a disposable view. All handlers belong to this output, not document. */
export function mountTinyaplEvaluation(host, tree, { onResize = () => {} } = {}) {
    const expandable = tinyaplExpandableGroups(tree.root);
    const state = { valence: 1, expanded: new Set(['root']), collapsed: new Set() };
    // Pick the usable valence for the initial view (notably Mirror).
    if (buildTinyaplEvaluation(tree, state).error && !buildTinyaplEvaluation(tree, { ...state, valence: 2 }).error) state.valence = 2;
    host.classList.add('tinyapl-evaluation');

    const button = (action, label, active = false, extra = '') =>
        `<button type="button" data-action="${action}" aria-pressed="${active}" ${extra}>${label}</button>`;

    function render() {
        const model = buildTinyaplEvaluation(tree, state);
        host.innerHTML = `<div class="eval-toolbar">
            <div class="eval-switch eval-valence" role="group" aria-label="Arguments">${button('monad', 'y', state.valence === 1, 'aria-label="Monadic: y"')}${button('dyad', 'x y', state.valence === 2, 'aria-label="Dyadic: x y"')}</div>
            <div class="eval-source" aria-label="Function">${[...tree.source].map((ch, i) => `<span data-source-col="${i}" class="${escape(tree.classes[i] ?? '')}">${escape(ch)}</span>`).join('')}</div>
            <div class="eval-actions">
                <button type="button" data-action="expand-all" aria-label="Expand all" aria-keyshortcuts="Control+Shift+E" title="Expand all (Ctrl+Shift+E)" ${!expandable.length ? 'disabled' : ''}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m0-5 6 6m7-6h5v5m0-5-6 6M3 16v5h5m-5 0 6-6m12 1v5h-5m5 0-6-6"/></svg>
                </button>
                <button type="button" data-action="reset" aria-label="Reset" aria-keyshortcuts="Control+Shift+R" title="Reset (Ctrl+Shift+R)">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.6 6.4M3 4v7h7"/></svg>
                </button>
            </div>
        </div>
        <div class="eval-body">
            ${model.error ? `<div class="eval-unavailable" role="status">${escape(model.error)}</div>` : `
            <div class="eval-canvas">${renderDiagram(model, tree)}</div>
            <div class="eval-scopes" aria-label="Expanded groups">${[...model.scopes].reverse().map(({ fn, key, result }) =>
                `<button type="button" data-collapse="${key}" data-scope-result="${result}" aria-label="Collapse ${escape(fn.label)}"><span aria-hidden="true">−</span> ${highlightCode(fn.label, 'tinyapl')}</button>`).join('')}</div>
            <div class="eval-inspector" aria-live="polite"><div class="eval-inspector-label">RESULT</div><div class="eval-expression">${highlightCode(`r ← ${tinyaplEvaluationExpression(model)}`, 'tinyapl')}</div></div>`}
            <div class="eval-help">${model.error ? 'Switch arguments to explore another valence.' : 'Read upwards · Hover to trace arguments · Click + to expand'}</div></div>`;
        host._evaluationModel = model;
        onResize();
    }

    // The editor supplies the height remaining below its input. Scale the SVG
    // in both dimensions so there is one complete diagram, without an inner
    // scrolling viewport or clipping its arguments at the bottom.
    host._fitToHeight = height => {
        fitText(host.querySelector('.eval-source'), 26, 11);
        fitText(host.querySelector('.eval-expression'), 19, 10);
        host.querySelectorAll('.eval-scopes button').forEach(el => fitText(el, 15, 10));
        const canvas = host.querySelector('.eval-canvas');
        const svg = host.querySelector('.eval-svg');
        if (!canvas || !svg) return;
        const { width, height: naturalHeight } = svg.viewBox.baseVal;
        const otherHeight = host.offsetHeight - svg.getBoundingClientRect().height;
        const scale = Math.min(1, canvas.clientWidth / width, Math.max(100, height - otherHeight - 1) / naturalHeight);
        svg.style.width = `${width * scale}px`;
        svg.style.height = `${naturalHeight * scale}px`;
    };

    function setExpression(text) {
        const expression = host.querySelector('.eval-expression');
        if (!expression) return;
        expression.innerHTML = highlightCode(text, 'tinyapl');
        fitText(expression, 19, 10);
        onResize();
    }

    function activate(target) {
        if (target.dataset.expand !== undefined) {
            state.expanded.add(target.dataset.expand);
            state.collapsed.delete(target.dataset.expand);
        } else if (target.dataset.collapse !== undefined) {
            state.expanded.delete(target.dataset.collapse);
            state.collapsed.add(target.dataset.collapse);
        }
        else switch (target.dataset.action) {
            case 'monad': state.valence = 1; break;
            case 'dyad': state.valence = 2; break;
            case 'expand-all': state.expanded = new Set(expandable); state.collapsed.clear(); break;
            case 'reset': state.expanded = new Set(['root']); state.collapsed.clear(); break;
            default: return;
        }
        const expandId = target.dataset.expand;
        const collapseId = target.dataset.collapse;
        const action = target.dataset.action;
        const wasKeyboard = target === document.activeElement;
        render();
        if (wasKeyboard) host.querySelector(expandId !== undefined ? `[data-collapse="${expandId}"]`
            : collapseId !== undefined ? `[data-expand="${collapseId}"]` : `[data-action="${action}"]`)?.focus();
    }
    host.addEventListener('click', event => {
        const target = event.target.closest('[data-action], [data-expand], [data-collapse]');
        if (target) activate(target);
    });
    host.addEventListener('keydown', event => {
        // Keep the editor's global typing shortcut from stealing space/enter.
        if (event.key === ' ' || event.key === 'Enter') {
            event.stopPropagation();
            const target = event.target.closest('[data-expand]');
            if (target) { event.preventDefault(); activate(target); }
        }
    });

    function clearTrace() {
        host.querySelectorAll('.eval-trace, .eval-dim, .eval-source-active').forEach(el => el.classList.remove('eval-trace', 'eval-dim', 'eval-source-active'));
        const model = host._evaluationModel;
        if (model?.error) return;
        const label = host.querySelector('.eval-inspector-label');
        const expression = host.querySelector('.eval-expression');
        // Replacing the view can fire focusout while its new DOM is mounting.
        if (!label || !expression) return;
        label.textContent = 'RESULT';
        setExpression(`r ← ${tinyaplEvaluationExpression(model)}`);
    }
    function trace(event) {
        const target = event.target.closest('[data-node], [data-source-col], [data-scope-result]');
        if (!target) return;
        clearTrace();
        const model = host._evaluationModel;
        if (model.error) return;
        const active = new Set();
        const nodeMap = new Map(model.nodes.map(node => [node.id, node]));
        function visit(id) {
            if (active.has(id)) return;
            active.add(id);
            nodeMap.get(id).args.forEach(visit);
        }
        const selected = model.nodes.filter(node => target.dataset.node !== undefined || target.dataset.scopeResult !== undefined
            ? node.id === Number(target.dataset.node ?? target.dataset.scopeResult)
            : node.fn?.cols?.includes(Number(target.dataset.sourceCol)));
        if (selected.length === 1 && selected[0].kind === 'input') {
            active.add(selected[0].id);
            // An argument traces forward through the calls that consume it.
            for (const node of model.nodes) {
                if (node.args.some(id => active.has(id))) active.add(node.id);
            }
        } else selected.forEach(node => visit(node.id));
        if (!selected.length) return;
        host.querySelectorAll('[data-node]').forEach(el => el.classList.add(active.has(Number(el.dataset.node)) ? 'eval-trace' : 'eval-dim'));
        host.querySelectorAll('.eval-edge[data-to]').forEach(el => el.classList.add(active.has(Number(el.dataset.from)) && active.has(Number(el.dataset.to)) ? 'eval-trace' : 'eval-dim'));
        const cols = new Set(selected.flatMap(node => node.fn?.cols ?? []));
        host.querySelectorAll('[data-source-col]').forEach(el => { if (cols.has(Number(el.dataset.sourceCol))) el.classList.add('eval-source-active'); });
        const node = selected[0];
        host.querySelector('.eval-inspector-label').textContent = node.kind === 'input' ? 'ARGUMENT'
            : node.kind === 'constant' ? 'CONSTANT' : `${node.args.length === 2 ? 'DYADIC' : 'MONADIC'} CALL${node.expandable ? ' · CLICK TO EXPAND' : ''}`;
        setExpression(tinyaplEvaluationExpression(model, node.id));
    }
    host.addEventListener('mouseover', trace);
    host.addEventListener('focusin', trace);
    host.addEventListener('mouseout', event => {
        const previous = event.target.closest('[data-node], [data-source-col], [data-scope-result]');
        if (previous && !previous.contains(event.relatedTarget)) clearTrace();
    });
    host.addEventListener('focusout', clearTrace);
    render();
    document.fonts.ready.then(() => { if (host.isConnected) onResize(); });
}
