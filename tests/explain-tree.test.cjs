const assert = require('node:assert/strict');
const { test } = require('node:test');

const SOURCE = '(⊃∘⌽,⍥⎕C⊃)';
const TREE = '   ┌─┼─┐\n   ∘ ⍥ ⊃\n ┌─┴┐┌┴┐\n ⊃  ⌽, ⎕C';

function sourceSpan(html, column) {
    const span = html.match(new RegExp(`<span class="([^"]*)" data-col="${column}"(?: data-groups="([^"]*)")?>(.*?)</span>`));
    assert.ok(span, `Missing source span at column ${column}`);
    return { classes: span[1].split(' '), groups: span[2], text: span[3] };
}

test('APL train output highlights the whole system function in the source and tree', async () => {
    const { renderAplExplainTree } = await import('../src/explain-tree.js');
    const { html } = renderAplExplainTree(SOURCE, TREE);
    const rows = html.split('\n');
    for (const column of [6, 7]) {
        assert.ok(sourceSpan(rows[0], column).classes.includes('syntax-function'));
    }
    assert.ok(rows.at(-1).includes('<span class="syntax-function">⎕C</span>'));
    assert.equal(rows[1], TREE.split('\n')[0]);
});

test('APL system-function letters belong to the same hover groups and operand as the quad', async () => {
    const { renderAplExplainTree } = await import('../src/explain-tree.js');
    const { html, groups } = renderAplExplainTree(SOURCE, TREE);
    const quad = sourceSpan(html.split('\n')[0], 6);
    const name = sourceSpan(html.split('\n')[0], 7);
    assert.ok(quad.groups);
    assert.equal(name.groups, quad.groups);
    const application = groups.find(group => group.type === '2-mod' && group.cols.includes(6));
    assert.deepEqual(application.parts.find(part => part.role === 'right').cols, [6, 7]);
});

test('APL system functions are highlighted when there are no hover groups', async () => {
    const { renderAplExplainTree } = await import('../src/explain-tree.js');
    const { html, groups } = renderAplExplainTree('⎕C', '⎕C\n');
    assert.deepEqual(groups, []);
    assert.equal(html, '<span class="syntax-function">⎕C</span>\n<span class="syntax-function">⎕C</span>');
});

test('APL train output supports longer system identifiers without coloring adjacent text', async () => {
    const { renderAplExplainTree } = await import('../src/explain-tree.js');
    for (const identifier of ['⎕UCS', '⎕JSON', '⎕c', '⎕Name2']) {
        const source = `(${identifier}+⌽)`;
        const { html, groups } = renderAplExplainTree(source, `┌─┼─┐\n${identifier} + ⌽`);
        const sourceRow = html.split('\n')[0];
        for (let column = 1; column <= identifier.length; column++) {
            const span = sourceSpan(sourceRow, column);
            assert.ok(span.classes.includes('syntax-function'), `${identifier}: column ${column}`);
            assert.equal(span.groups, sourceSpan(sourceRow, 1).groups);
        }
        assert.equal(sourceSpan(sourceRow, identifier.length + 1).text, '+');
        assert.equal(groups.length, 1);
        assert.deepEqual(groups[0].parts.find(part => part.role === 'f').cols,
            Array.from({ length: identifier.length }, (_, i) => i + 1));
        assert.ok(html.split('\n').at(-1).includes(`<span class="syntax-function">${identifier}</span>`));
    }

    const { html } = renderAplExplainTree('⎕ C', '⎕ C');
    assert.equal(html, '<span class="syntax-function">⎕</span> C\n<span class="syntax-function">⎕</span> C');
});
