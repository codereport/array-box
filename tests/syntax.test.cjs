const assert = require('node:assert/strict');
const { test } = require('node:test');

const load = () => import('../src/syntax.js');

test('Uiua sided subscripts inherit function and modifier colors', async () => {
    const { highlightCode } = await load();
    const examples = [
        ['⊂', 'syntax-uiua-function-dyadic'],
        ['⧈', 'syntax-uiua-modifier-monadic'],
        ['⊓', 'syntax-uiua-modifier-dyadic'],
    ];
    for (const [glyph, cssClass] of examples) {
        for (const side of ['⌞', '⌟']) {
            assert.equal(highlightCode(glyph + side, 'uiua'),
                `<span class="${cssClass}">${glyph}</span><span class="${cssClass}">${side}</span>`);
        }
    }

    // The expression reported in #231 has a right-sided stencil subscript.
    assert.match(highlightCode('Mvmi ← /↧⧈⌟˜⍜∩⊥₁₀⊂', 'uiua'),
        /<span class="syntax-uiua-modifier-monadic">⧈<\/span><span class="syntax-uiua-modifier-monadic">⌟<\/span>/);
});

test('Uiua mixed subscripts keep their color until the next primitive', async () => {
    const { highlightCode } = await load();
    for (const side of ['⌞', '⌟']) {
        assert.equal(highlightCode(`∩₃${side}₂⊟₃`, 'uiua'),
            '<span class="syntax-uiua-modifier-monadic">∩</span>' +
            '<span class="syntax-uiua-modifier-monadic">₃</span>' +
            `<span class="syntax-uiua-modifier-monadic">${side}</span>` +
            '<span class="syntax-uiua-modifier-monadic">₂</span>' +
            '<span class="syntax-uiua-function-dyadic">⊟</span>' +
            '<span class="syntax-uiua-function-dyadic">₃</span>');
    }
});

test('Uiua sided subscripts preserve string, character, and comment highlighting', async () => {
    const { highlightCode } = await load();
    assert.equal(highlightCode('"⌞⌟" @⌞ @⌟ # ⌞⌟', 'uiua'),
        '<span class="syntax-string">&quot;⌞⌟&quot;</span> ' +
        '<span class="syntax-string">@⌞</span> ' +
        '<span class="syntax-string">@⌟</span> ' +
        '<span class="syntax-comment"># ⌞⌟</span>');
    assert.equal(highlightCode('⌞⌟', 'uiua'), '⌞⌟');
    assert.equal(highlightCode('+⌞⌟', 'apl'), '<span class="syntax-function">+</span>⌞⌟');
});
