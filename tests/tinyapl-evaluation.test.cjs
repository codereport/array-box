const assert = require('node:assert/strict');
const { test } = require('node:test');

async function diagram(repr, valence = 1, expandAll = true) {
    const { formatTinyaplFunctionTree } = await import('../src/tinyapl-tree.js');
    const { buildTinyaplEvaluation, tinyaplExpandableGroups, tinyaplEvaluationExpression } = await import('../src/tinyapl-evaluation.js');
    const tree = formatTinyaplFunctionTree({ type: 'function', repr });
    assert.ok(tree, repr);
    const expanded = expandAll ? new Set(tinyaplExpandableGroups(tree.root)) : new Set([tree.root.id]);
    const model = buildTinyaplEvaluation(tree, { valence, expanded });
    return { tree, model, expression: model.error ? null : tinyaplEvaluationExpression(model) };
}

test('TinyAPL evaluation follows train and explicit fork argument routing', async () => {
    for (const [repr, monad, dyad] of [
        ['⦅F ⋄ G⦆', 'F (G y)', 'F (x G y)'],
        ['⦅F ⋄ G ⋄ H⦆', '(F y) G (H y)', '(x F y) G (x H y)'],
        ['((F)«(G))»(H)', '(F y) G (H y)', '(x F y) G (x H y)'],
        ['⦅F ⋄ G ⋄ H ⋄ I⦆', 'F ((G y) H (I y))', 'F ((x G y) H (x I y))'],
        ['⦅ ⋄ F ⋄ G⦆', 'F (G y)', 'F (x G y)'],
    ]) {
        assert.equal((await diagram(repr)).expression, monad, repr);
        assert.equal((await diagram(repr, 2)).expression, dyad, repr);
    }
});

test('TinyAPL combinators compose argument routing in both valences', async () => {
    for (const [glyph, monad, dyad] of [
        ['∘', 'F (G y)', 'F (x G y)'],
        ['⍛', 'G (F y)', 'G (x F y)'],
        ['○', 'F (G y)', '(G x) F (G y)'],
        ['⍜', 'G (F y)', '(F x) G (F y)'],
        ['⊸', '(F y) G y', '(F x) G y'],
        ['⟜', 'y F (G y)', 'x F (G y)'],
        ['⇾', '(F y) G y', '(x F y) G y'],
        ['⇽', 'y F (G y)', 'x F (x G y)'],
        ['⁖', 'F y', 'x G y'],
    ]) {
        const repr = `(F)${glyph}(G)`;
        assert.equal((await diagram(repr)).expression, monad, glyph);
        assert.equal((await diagram(repr, 2)).expression, dyad, glyph);
    }
    assert.equal((await diagram('(F)⍨')).expression, 'y F y');
    assert.equal((await diagram('(F)⍨', 2)).expression, 'y F x');
});

test('TinyAPL Mirror swaps argument order and composes nested fork calls', async () => {
    const repr = '((⍮)¨)⸚(⦅≠ ⋄ ⊆ ⋄ ⊢⦆)';
    const { expression, model } = await diagram(repr, 2);
    assert.equal(expression, '((y ≠ x) ⊆ (y ⊢ x)) (⍮¨) ((x ≠ y) ⊆ (x ⊢ y))');
    assert.equal(model.nodes.filter(n => n.kind === 'input').length, 2, 'shared x/y inputs');
    assert.equal(model.nodes.filter(n => n.kind === 'call').length, 7);
    assert.equal((await diagram(repr, 2, false)).model.nodes.filter(n => n.expandable).length, 2);
    assert.match((await diagram(repr)).model.error, /Mirror.*dyadic/);
});

test('TinyAPL array tines bind and produce constants without false argument edges', async () => {
    for (const [repr, expected] of [
        ['⦅2 ⋄ F⦆', '2 F y'], ['⦅F ⋄ 2⦆', 'y F 2'],
        ['(2)∘(F)', '2 F y'], ['(F)∘(2)', 'y F 2'],
        ['(2)⍛(F)', 'y F 2'], ['(F)⍛(2)', '2 F y'],
        ['⦅2 ⋄ G ⋄ H⦆', '2 G (H y)'],
        ['⦅F ⋄ G ⋄ 3⦆', '(F y) G 3'],
        ['⦅2 ⋄ G ⋄ 3⦆', '2 G 3'],
    ]) assert.equal((await diagram(repr)).expression, expected, repr);
    for (const repr of ['⦅2 ⋄ 3⦆', '⦅F ⋄ 2 ⋄ H⦆', '(2)⍨']) {
        const { model, expression } = await diagram(repr, 2);
        assert.equal(expression, '2', repr);
        assert.ok(model.nodes.every(n => n.args.length === 0), repr);
    }
    for (const repr of ['⦅2 ⋄ F⦆', '(F)∘(2)', '(2)⍛(F)']) {
        assert.match((await diagram(repr, 2)).model.error, /binding is monadic/, repr);
    }
    assert.equal((await diagram('(2)○(F)', 2)).expression, 'x F y');
    assert.equal((await diagram('(F)⍜(2)', 2)).expression, 'x F y');
});

test('TinyAPL evaluation leaves traversal modifiers opaque and survives serialization', async () => {
    const { tree, model, expression } = await diagram('((F)¨)∘((G)/)', 2);
    assert.equal(expression, '(F¨) (x (G/) y)');
    assert.equal(model.nodes.filter(n => n.kind === 'call').length, 2);
    assert.ok(model.nodes.every(n => !n.expandable));
    const { buildTinyaplEvaluation, tinyaplEvaluationExpression } = await import('../src/tinyapl-evaluation.js');
    assert.equal(tinyaplEvaluationExpression(buildTinyaplEvaluation(JSON.parse(JSON.stringify(tree)), { valence: 2 })), expression);
    assert.ok(!JSON.stringify(tree.root).includes('trainTines'));
});
