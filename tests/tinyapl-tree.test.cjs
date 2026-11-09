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
        fn('+'), fn('{⍵+1}'), fn('(+'), fn('((+)¨)unknown'), fn('⦅2 ⋄ _A ⋄ ⊢⦆'),
        fn('⦅+ ⋄ _A⦆'), fn('⦅+'), fn('⦅⦆'), fn('('.repeat(100) + '+' + ')'.repeat(100))]) {
        assert.equal(formatTinyaplFunctionTree(value), null, JSON.stringify(value));
    }
});

test('TinyAPL array tines render the complete evaluated train from issue #243', async () => {
    const { formatTinyaplFunctionTree, renderTinyaplExplainTree, TINYAPL_COMBINATOR_INFO } = await load();
    const tree = formatTinyaplFunctionTree(fn('⦅(⌊)/ ⋄ ¯2 ⋄ ((((⍕)¨)⍛(⍪))⍛(⍎))⌺ ⋄ ⊢⦆'));
    assert.ok(tree);
    assert.equal(tree.source, '⦅⌊/¯2⍕¨⍛⍪⍛⍎⌺⊢⦆');
    assert.deepEqual(tree.groups.map(group => group.type), ['1-mod', '1-mod', '2-mod', '2-mod', '1-mod', 'fork', 'atop']);
    const fork = tree.groups.find(group => group.type === 'fork');
    assert.deepEqual(fork.parts[0], { role: 'f', cols: [3, 4] });
    assert.equal(fork.combinator, 'fork-left-array');
    assert.equal(TINYAPL_COMBINATOR_INFO[fork.combinator].monad, '⦅a⋄G⋄H⦆ y ≡ a G (H y)');
    assert.match(tree.text, /¯2/);
    for (const glyph of ['⌊', '/', '⍕', '¨', '⍛', '⍪', '⍎', '⌺', '⊢']) {
        assert.ok(tree.text.includes(glyph), glyph);
    }
    const { html } = renderTinyaplExplainTree(tree);
    assert.match(html, /syntax-number[^>]*data-col="3" data-groups="5,6">¯/);
    assert.match(html, /syntax-number[^>]*data-col="4" data-groups="5,6">2/);
});

test('TinyAPL array trains preserve literal tines and distinguish binding from constants', async () => {
    const { formatTinyaplFunctionTree, TINYAPL_COMBINATOR_INFO } = await load();
    for (const [repr, source, combinator] of [
        ['⦅2 ⋄ +⦆', '⦅2+⦆', 'atop-left-array'],
        ['⦅+ ⋄ 2⦆', '⦅+2⦆', 'atop-right-array'],
        ['⦅2 ⋄ 3⦆', '⦅2⋄3⦆', 'atop-arrays'],
        ['⦅2 ⋄ + ⋄ ⊢⦆', '⦅2+⊢⦆', 'fork-left-array'],
        ['⦅⊢ ⋄ + ⋄ 2⦆', '⦅⊢+2⦆', 'fork-right-array'],
        ['⦅2 ⋄ + ⋄ 3⦆', '⦅2+3⦆', 'fork-arrays'],
        ['⦅+ ⋄ 2 ⋄ ⊢⦆', '⦅+2⊢⦆', 'fork-constant'],
        ['⦅⟨1 ⋄ 2⟩ ⋄ , ⋄ ⊢⦆', '⦅⟨1 ⋄ 2⟩,⊢⦆', 'fork-left-array'],
        ['⦅"ab" ⋄ , ⋄ ⊢⦆', '⦅"ab",⊢⦆', 'fork-left-array'],
    ]) {
        const tree = formatTinyaplFunctionTree(fn(repr));
        assert.ok(tree, repr);
        assert.equal(tree.source, source, repr);
        assert.equal(tree.groups.at(-1).combinator, combinator, repr);
        assert.ok(TINYAPL_COMBINATOR_INFO[combinator], repr);
    }
    assert.equal(TINYAPL_COMBINATOR_INFO['atop-left-array'].dyad, null);
    assert.equal(TINYAPL_COMBINATOR_INFO['atop-right-array'].dyad, null);
});

test('TinyAPL compact trains preserve empty tines without adding diamonds around named operands', async () => {
    const { formatTinyaplFunctionTree, renderTinyaplExplainTree } = await load();
    // Actual interpreter representation of issue #242's ⦅+/·|·-⌺-∘\'a\'⦆.
    const tree = formatTinyaplFunctionTree(fn('⦅(+)/ ⋄  ⋄ | ⋄  ⋄ (-)⌺ ⋄ (-)∘(a)⦆'));
    assert.equal(tree.source, '⦅+/·|·-⌺-∘a⦆');
    assert.equal(tree.text, '  ┌─┴─┐\n  / ┌─┴──┐\n┌─┘ |   ┌┴─┐\n+       ⌺  ∘\n      ┌─┘ ┌┴┐\n      -   - a');
    assert.deepEqual(tree.groups.at(-1).cols, [1, 2, 4, 6, 7, 8, 9, 10]);
    assert.ok(!renderTinyaplExplainTree(tree).html.includes('⋄'));

    for (const [repr, source] of [
        ['⦅Foo ⋄  ⋄ Bar ⋄ +⦆', '⦅Foo·Bar+⦆'],
        ['⦅Foo ⋄ (+)∘(Bar)⦆', '⦅Foo+∘Bar⦆'],
        ['⦅(Foo)∘(+) ⋄ Bar⦆', '⦅Foo∘+Bar⦆'],
    ]) {
        assert.equal(formatTinyaplFunctionTree(fn(repr)).source, source);
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
