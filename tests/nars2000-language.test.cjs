const assert = require('node:assert/strict');
const test = require('node:test');

test('NARS2000 authoring modules expose keyboard, syntax, docs, and editor metadata', async () => {
    const [{ nars2000Keymap, getKeymapInfo }, { syntaxRules, highlightCode }, editor, docs, keyboard] = await Promise.all([
        import('../src/keymap.js'),
        import('../src/syntax.js'),
        import('../src/editor-features.js'),
        import('../src/nars2000-docs.js'),
        import('../src/keyboard.js')
    ]);

    assert.equal(nars2000Keymap.R, '√');
    assert.equal(nars2000Keymap.p, 'π');
    assert.equal(nars2000Keymap.S, '∫');
    assert.equal(nars2000Keymap.D, '∂');
    assert.equal(nars2000Keymap.B, '⍡');
    assert.equal(getKeymapInfo('nars2000').keymap, nars2000Keymap);

    assert.ok(syntaxRules.nars2000.functions.includes('√'));
    assert.ok(syntaxRules.nars2000.monadic.includes('∫'));
    assert.ok(syntaxRules.nars2000.multiChar.functions.includes('..'));
    const highlighted = highlightCode("2..5 ∫ ⎕IO ⍝ note", 'nars2000');
    assert.match(highlighted, /syntax-function">\.\.<\/span>/);
    assert.match(highlighted, /syntax-modifier-monadic">∫<\/span>/);
    assert.match(highlighted, /syntax-function">⎕IO<\/span>/);
    assert.match(highlighted, /syntax-comment">⍝ note<\/span>/);

    assert.deepEqual(editor.assignmentOperators.nars2000, ['←']);
    assert.equal(editor.commentTokens.nars2000, '⍝');
    assert.equal(editor.toggleComment('x←1', 'nars2000', 0, 3).text, '⍝ x←1');

    assert.equal(docs.nars2000GlyphDocs['π'].monad.name, 'Prime Factors');
    assert.equal(docs.nars2000GlyphDocs['∫'].monad.name, 'Integral');
    assert.equal(docs.nars2000GlyphDocs['∅'].monad.name, 'NaN');
    assert.equal(docs.nars2000GlyphDocs['⌸'], undefined);
    assert.equal(keyboard.nars2000GlyphNames['..'], 'sequence');
    assert.equal(keyboard.nars2000GlyphNames['⊆'], 'subset');
});

test('NARS2000 shares common APL primitive equivalents without losing its identity', async () => {
    const comparison = await import('../src/primitive-compare.js');
    const translation = await import('../src/primitive-translate.js');

    assert.ok(comparison.compareLanguages.some((language) => language.id === 'nars2000'));
    assert.equal(comparison.getEquivalent(comparison.primitiveMap['⍴'], 'nars2000', 'dyad', '1,1'), '⍴');
    assert.equal(comparison.getEquivalent(comparison.primitiveMap['×'], 'nars2000', 'dyad'), '×');
    assert.equal(comparison.getEquivalent(comparison.primitiveMap['⊆'], 'nars2000', 'dyad'), null);

    assert.equal(translation.translatePrimitives('↕5', 'bqn', 'nars2000'), '⍳5');
    assert.equal(translation.translatePrimitives('⍴', 'nars2000', 'bqn'), '≢');
    assert.equal(translation.translatePrimitives('⊸', 'bqn', 'nars2000'), '⊸');
    assert.ok(translation.hasTranslation('nars2000', 'j'));
    assert.ok(translation.getTranslatablePrimitives('bqn', 'nars2000').some(
        ({ from, to }) => from === '↕' && to === '⍳'
    ));
});

test('Open Graph generation recognizes NARS2000 identity and font coverage', async () => {
    const { generateOGImage, getLangDisplayName } = require('../servers/og-generator.cjs');
    assert.equal(getLangDisplayName('nars2000'), 'NARS2000');
    const image = await generateOGImage('2..5', 'nars2000', '2 3 4 5');
    assert.equal(image.subarray(1, 4).toString('ascii'), 'PNG');
    assert.ok(image.length > 1000);
});
