const assert = require('node:assert/strict');
const { test } = require('node:test');

const MIRROR = '((⍮)¨)⸚(⦅≠ ⋄ ⊆ ⋄ ⊢⦆)';
const TREE = '    ⸚\n  ┌─┴─┐\n  ¨ ┌─┼─┐\n┌─┘ ≠ ⊆ ⊢\n⍮';
const load = () => import('../src/tinyapl-tree.js');
const fn = repr => ({ type: 'function', repr });

test('TinyAPL Mirror renders its evaluated grouping as a Dyalog-style tree', async () => {
    const { formatTinyaplFunctionTree, renderTinyaplExplainTree } = await load();
    const tree = formatTinyaplFunctionTree(fn(MIRROR));
    assert.equal(tree.source, '⍮¨⸚⦅≠⊆⊢⦆');
    assert.equal(tree.text, TREE);
    assert.deepEqual(tree.groups.map(group => group.type), ['1-mod', 'fork', '2-mod']);
    assert.deepEqual(tree.groups.at(-1).parts, [
        { role: 'left', cols: [0, 1] },
        { role: 'modifier', cols: [2] },
        { role: 'right', cols: [4, 5, 6] },
    ]);
    const { html, groups } = renderTinyaplExplainTree(tree);
    assert.equal(groups, tree.groups);
    assert.match(html, /syntax-modifier-dyadic[^>]*data-col="2" data-groups="2">⸚/);
    assert.match(html, /syntax-modifier-monadic[^>]*data-col="1" data-groups="0,2">¨/);
    assert.ok(html.includes('<span class="syntax-function">⍮</span>'));
    assert.ok(!html.includes('syntax-function">─'));
});

test('TinyAPL modifier operands retain their parentheses, arity, and complete labels', async () => {
    const { formatTinyaplFunctionTree } = await load();
    const examples = [
        ['(+)∘((-)¨)', '+∘(-¨)', ['1-mod', '2-mod']],
        ['((+)∘(-))¨', '+∘-¨', ['2-mod', '1-mod']],
        ['(+)⍨', '+⍨', ['1-mod']],
        ['(+)⍨(2)', '+⍨2', ['2-mod']],
        ['(+)∙(×)', '+∙×', ['2-mod']],
        ['(⎕Unicode)¨', '⎕Unicode¨', ['1-mod']],
        ['(Foo)⸚(Bar)', 'Foo⸚Bar', ['2-mod']],
        ['({⍵+1})¨', '{⍵+1}¨', ['1-mod']],
    ];
    for (const [repr, source, types] of examples) {
        const tree = formatTinyaplFunctionTree(fn(repr));
        assert.ok(tree, repr);
        assert.equal(tree.source, source, repr);
        assert.deepEqual(tree.groups.map(group => group.type), types, repr);
    }
    const tree = formatTinyaplFunctionTree(fn('(⎕Unicode)¨'));
    assert.deepEqual(tree.groups[0].parts[0].cols, [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('TinyAPL nested and longer trains follow fork/atop rules and empty tines', async () => {
    const { formatTinyaplFunctionTree } = await load();
    const examples = [
        ['⦅+ ⋄ -⦆', '⦅+-⦆', ['atop']],
        ['⦅+ ⋄ - ⋄ × ⋄ ÷⦆', '⦅+-×÷⦆', ['fork', 'atop']],
        ['⦅+ ⋄ - ⋄ × ⋄ ÷ ⋄ ⌽⦆', '⦅+-×÷⌽⦆', ['fork', 'fork']],
        ['⦅⦅+ ⋄ -⦆ ⋄ × ⋄ ÷⦆', '⦅⦅+-⦆×÷⦆', ['atop', 'fork']],
        ['⦅ ⋄ + ⋄ -⦆', '⦅·+-⦆', ['atop']],
        ['⦅Foo ⋄ Bar ⋄ Baz⦆', '⦅Foo⋄Bar⋄Baz⦆', ['fork']],
        ['⦅(+)∘(Foo) ⋄ Bar ⋄ Baz⦆', '⦅+∘Foo⋄Bar⋄Baz⦆', ['2-mod', 'fork']],
    ];
    for (const [repr, source, types] of examples) {
        const tree = formatTinyaplFunctionTree(fn(repr));
        assert.ok(tree, repr);
        assert.equal(tree.source, source);
        assert.deepEqual(tree.groups.map(group => group.type), types);
        assert.ok(tree.groups.every(group => group.cols.every(col => Number.isInteger(col))));
    }
});

test('TinyAPL strings, data, opaque functions, and unsupported syntax retain ordinary output', async () => {
    const { formatTinyaplFunctionTree } = await load();
    for (const value of [null, { type: 'array', repr: MIRROR }, { type: 'adverb', repr: '/' },
        fn('+'), fn('{⍵+1}'), fn('(+'), fn('((+)¨)unknown'), fn('⦅2 ⋄ + ⋄ ⊢⦆'),
        fn('⦅+ ⋄ _A⦆'), fn('⦅+'), fn('⦅⦆'), fn('('.repeat(100) + '+' + ')'.repeat(100))]) {
        assert.equal(formatTinyaplFunctionTree(value), null, JSON.stringify(value));
    }
});

test('TinyAPL literal operands escape HTML and do not create fake modifier groups', async () => {
    const { formatTinyaplFunctionTree, renderTinyaplExplainTree } = await load();
    const tree = formatTinyaplFunctionTree(fn('("<script>⸚⍘"</script>")∘(+)'));
    assert.ok(tree);
    assert.equal(tree.groups.length, 1);
    const { html } = renderTinyaplExplainTree(tree);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;'));
    assert.ok(html.includes('syntax-string'));
});

test('TinyAPL tree detection recognizes fork, atop, and adverb trees for image export', async () => {
    const { isTrainTree } = await import('../src/syntax.js');
    for (const text of [TREE, '┌─┼─┐\n+ - ×', '┌┴┐\n+ -', '  ¨\n┌─┘\n+']) {
        assert.equal(isTrainTree(text, 'tinyapl'), true);
    }
    for (const text of ['⟨⟩', '┌→─┬──┐\n│ar│mp│\n└──┴──┘', MIRROR]) {
        assert.equal(isTrainTree(text, 'tinyapl'), false);
    }
});
