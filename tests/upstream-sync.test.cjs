const { test } = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../scripts/sync-upstream-primitives.mjs');

test('TinyAPL keyboard parser handles shorter rows, escapes, and Prefix sentinel', async () => {
    const { parseTinyKeyboard } = await load();
    const rows = Array.from({ length: 46 }, (_, i) =>
        `  ['Key${i}', 'a', 'A', undefined, undefined, undefined, undefined],`);
    rows.push("  ['Space', 'Space', 'Space', '‿', 'Prefix', undefined],");
    rows.push("  ['Backslash', '\\\\', '|', '⊢', '⊣', undefined, undefined],");
    const parsed = parseTinyKeyboard(`const keyboard = [\n${rows.join('\n')}\n].map(([code]) => ({ code }));`);
    assert.equal(parsed.length, 48);
    assert.equal(parsed.find(row => row.code === 'Space').symPS, '`');
    assert.equal(parsed.find(row => row.code === 'Space').symPPS, undefined);
    assert.equal(parsed.find(row => row.code === 'Backslash').sym, '\\');
});

test('name audit uses every TinyAPL overload and catches stale labels', async () => {
    const { documentedNames, findNameDifferences } = await import('../scripts/check-primitive-names.mjs');
    const docs = {
        '⌺': {
            monad: { name: 'On Pairs' },
            dyad: { name: 'On Infixes' },
            overloads: [{ name: 'On Infixes' }, { name: 'On Pairs' }],
        },
    };
    assert.deepEqual(documentedNames('tinyapl', docs['⌺']), ['on pairs', 'on infixes']);
    assert.deepEqual(findNameDifferences('tinyapl', { '⌺': 'stencil' }, docs), [
        { glyph: '⌺', current: 'stencil', expected: 'on pairs / on infixes', docUrl: undefined },
    ]);
});

test('name audit detects duplicate glyph keys before JavaScript overwrites them', async () => {
    const { duplicateGlyphKeys, removeDuplicateGlyphKeys } = await import('../scripts/check-primitive-names.mjs');
    const code = "export const kapGlyphNames = {\n    '≬': 'create list',\n    \"≬\": 'between',\n};";
    assert.deepEqual(duplicateGlyphKeys(code, 'kapGlyphNames'), ['≬']);
    const fixed = removeDuplicateGlyphKeys(code, 'kapGlyphNames');
    assert.deepEqual(fixed.removed, ['≬']);
    assert.match(fixed.code, /'≬': 'create list'/);
    assert.doesNotMatch(fixed.code, /between/);
});

test('Uiua unknown classes use argument count or modifier arity', async () => {
    const { classifyUiua } = await load();
    assert.deepEqual(classifyUiua({ class: 'GeometricAlgebra', args: 1 }), ['monadicArray', 'monadic']);
    assert.deepEqual(classifyUiua({ class: 'Misc', args: 2 }), ['dyadicArray', 'functions']);
    assert.deepEqual(classifyUiua({ class: 'Misc', modifier_args: 2 }), ['dyadicModifiers', 'modifier']);
});

test('retired Uiua glyphs can be removed from any array position', async () => {
    const { removeGlyphLiteral } = await load();
    const compact = text => text.replace(/\s+/g, '');
    assert.equal(compact(removeGlyphLiteral("['a', 'b', 'c']", "'a'")), "['b','c']");
    assert.equal(compact(removeGlyphLiteral("['a', 'b', 'c']", "'b'")), "['a','c']");
    assert.equal(compact(removeGlyphLiteral("['a', 'b', 'c']", "'c'")), "['a','b']");
});

test('Kap source headings produce live source-line hover links', async () => {
    const { kapHeadings, fixKapLinks } = await load();
    const headings = Array.from({ length: 75 }, (_, i) => `=== \`${String.fromCodePoint(0x2200 + i)}\`: Name ${i}`);
    headings[0] = '=== `∀`: For all';
    const parsed = kapHeadings(headings.join('\n'));
    assert.deepEqual(parsed.get('∀'), { line: 1, name: 'For all' });
    parsed.set('\\', { line: 76, name: 'Scan' });
    const code = 'export const kapGlyphDocs = {\n    "∀": { "docUrl": "https://old.example/#bad" },\n    "\\\\": { "docUrl": "https://old.example/#bad" },\n    "?": { "docUrl": "https://old.example/#bad" }\n};';
    const updated = fixKapLinks(code, parsed);
    assert.match(updated, /reference\.asciidoc\?display=source#L1/);
    assert.match(updated, /reference\.asciidoc\?display=source#L76/);
    assert.match(updated, /"\?": \{ "docUrl": "https:\/\/codeberg\.org\/loke\/array\/src\/branch\/master\/docs\/reference\.asciidoc" \}/);
});

test('TinyAPL updated prefix mappings insert the expected glyphs', async () => {
    const { createKeyboardHandler } = await import('../src/keymap.js');
    const handlers = {};
    const input = {
        value: '', selectionStart: 0, selectionEnd: 0,
        addEventListener: (name, handler) => { handlers[name] = handler; },
        removeEventListener: () => {},
        dispatchEvent: () => {},
    };
    createKeyboardHandler(input, 'tinyapl');
    const press = (code, key, shiftKey = false) => handlers.keydown({
        code, key, shiftKey, getModifierState: () => shiftKey,
        preventDefault: () => {}, ctrlKey: false, altKey: false, metaKey: false,
    });
    press('Backquote', '`'); press('Backquote', '`'); press('Backquote', '`');
    assert.equal(input.value, '⋄');
    press('Backquote', '`'); press('Backquote', '`'); press('KeyA', 'A', true);
    assert.equal(input.value, '⋄µ');
});
