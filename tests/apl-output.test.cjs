const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { extractAplFunctionResult } = require('../servers/apl-output.cjs');

const leaf = text => ['leaf', text];
const tree = (...children) => ['tree', children];
const OUTPUT = ' ⊃∘⌽  +⍥ ∇sûre_execute  ⊃';
const REPRESENTATION = tree(leaf('⊃∘⌽'), tree(leaf('+'), leaf('⍥'), leaf('∇sûre_execute')), leaf('⊃'));
const EXPECTED = ' ┌───┼──┐\n ∘   ⍥  ⊃\n┌┴┐ ┌┴┐\n⊃ ⌽ + ⍎';
const MARKER = '___ARRAYBOX_FUNCTION_test___';

test('function-result metadata preserves the raw output and tree grouping', () => {
    assert.deepEqual(extractAplFunctionResult(`${OUTPUT}\n${MARKER}${JSON.stringify(REPRESENTATION)}`, MARKER), {
        output: OUTPUT,
        isAplFunction: true,
        aplFunctionTree: REPRESENTATION
    });
});

test('numeric and text results are not identified as functions', () => {
    for (const output of ['6', '∇sûre_execute', '  ⊃  ⍎  ', `${MARKER}other-request___`]) {
        const marker = output.startsWith(MARKER) ? '___ARRAYBOX_FUNCTION_different___' : MARKER;
        assert.deepEqual(extractAplFunctionResult(output, marker), { output, isAplFunction: false });
    }
});

test('unsupported function metadata keeps the original result available', () => {
    assert.deepEqual(extractAplFunctionResult(`${OUTPUT}\n${MARKER}not-json`, MARKER), {
        output: OUTPUT, isAplFunction: true
    });
});

test('Safe3 execute results render as a tree with the original primitive', async () => {
    const { formatAplFunctionOutput, renderAplExplainTree } = await import('../src/explain-tree.js');
    const output = formatAplFunctionOutput(OUTPUT, REPRESENTATION);
    assert.equal(output, EXPECTED);
    const { html, groups } = renderAplExplainTree('(⊃∘⌽+⍥⍎⊃)', output);
    assert.ok(html.includes('<span class="syntax-function">⍎</span>'));
    assert.ok(!html.includes('sûre_'));
    assert.ok(groups.some(group => group.type === 'fork'));
});

test('structured metadata preserves parentheses lost in Dyalog flat output', async () => {
    const { formatAplFunctionOutput } = await import('../src/explain-tree.js');
    const representation = tree(tree(leaf('∇sûre_execute'), leaf('+')), leaf('∘'), leaf('⌽'));
    assert.equal(formatAplFunctionOutput('  ∇sûre_execute + ∘⌽', representation), '  ∘\n ┌┴─┐\n┌┴┐ ⌽\n⍎ +');
});

test('opaque function representations can use a complete original primitive expression', async () => {
    const { formatAplFunctionOutput } = await import('../src/explain-tree.js');
    assert.equal(formatAplFunctionOutput(OUTPUT, leaf(OUTPUT), '(⊃∘⌽+⍥⍎⊃)'), EXPECTED);
    assert.equal(formatAplFunctionOutput('  ∇sûre_execute + ∘⌽', undefined, '((⍎+)∘⌽)'),
        '  ∘\n ┌┴─┐\n┌┴┐ ⌽\n⍎ +');
    assert.equal(formatAplFunctionOutput(OUTPUT, undefined, 'F←(⊃∘⌽+⍥⍎⊃) ⋄ F'), OUTPUT);
});

test('other covers retain operator structure and system-function labels', async () => {
    const { formatAplFunctionOutput } = await import('../src/explain-tree.js');
    assert.equal(formatAplFunctionOutput(' ∇sûre_format ¨', tree(leaf('∇sûre_format'), leaf('¨'))), '  ¨\n┌─┘\n⍕');
    assert.equal(formatAplFunctionOutput(' ∇sûre_NL ¨', tree(leaf('∇sûre_NL'), leaf('¨'))), '   ¨\n ┌─┘\n⎕NL');
    assert.equal(formatAplFunctionOutput('wrapped power', tree(
        leaf('#.Safe3.[Namespace] . ∇sûre_execute'), leaf('∇sûre_power'), leaf('2')
    )), ' ⍣\n┌┴┐\n⍎ 2');
});

test('ordinary output, quoted cover names, and unsupported trees remain unchanged', async () => {
    const { formatAplFunctionOutput } = await import('../src/explain-tree.js');
    for (const output of ['6', '∇sûre_execute', '┌─┼─┐\n+ - ×']) {
        assert.equal(formatAplFunctionOutput(output), output);
    }
    assert.equal(formatAplFunctionOutput('original', leaf("{'∇sûre_execute'}")), 'original');
    assert.equal(formatAplFunctionOutput('original', leaf('∇sûre_execute_extra')), 'original');
    for (const representation of [[], ['invalid', []], tree(leaf('∇sûre_execute')), tree(leaf('∇sûre_execute'), leaf('['), leaf('1'))]) {
        assert.equal(formatAplFunctionOutput('original', representation), 'original');
    }
});

for (const [warm, metadataStream] of [[true, 'stdout'], [true, 'stderr'], [false, 'stdout'], [false, 'stderr']]) {
    test(`${warm ? 'warm' : 'cold'} sandbox transports function metadata on ${metadataStream} separately from output`, async () => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        let input = '';
        child.stdin = {
            write(text) {
                input += text;
                if (warm) queueMicrotask(reply);
            },
            end() { queueMicrotask(reply); }
        };
        function reply() {
            const marker = input.match(/___ARRAYBOX_FUNCTION_[a-z0-9]+___/)[0];
            const metadata = `${marker}${JSON.stringify(REPRESENTATION)}`;
            const payload = metadataStream === 'stdout' ? `${OUTPUT}\n${metadata}` : OUTPUT;
            const stdout = warm
                ? `${input.match(/___ARRAYBOX_START_[a-z0-9]+___/)[0]}\n${payload}\n${input.match(/___ARRAYBOX_END_[a-z0-9]+___/)[0]}\n${input.match(/___ARRAYBOX_RESET_[a-z0-9]+___/)[0]}\n`
                : payload;
            if (metadataStream === 'stderr') child.stderr.emit('data', Buffer.from(`${metadata}\n`));
            child.stdout.emit('data', Buffer.from(stdout));
            if (!warm) child.emit('close', 0);
        }
        const module = { exports: {} };
        const filename = path.resolve(__dirname, '../servers/sandbox.cjs');
        const context = {
            module, __dirname: path.dirname(filename),
            process: { env: process.env, on() {} },
            console: { log() {}, warn() {}, error() {} },
            setTimeout: (fn, delay) => delay === 1000 ? 0 : setTimeout(fn, delay), clearTimeout,
            container: { ...child, process: { exitCode: null, signalCode: null } },
            require(name) {
                if (name === 'child_process') return { spawn: () => child, execSync: () => '' };
                if (name === './apl-output.cjs') return { extractAplFunctionResult };
                return require(name);
            }
        };
        vm.runInNewContext(readFileSync(filename, 'utf8') + '\ngetWarmContainer = async () => container;', context, { filename });
        module.exports.CONFIG.useWarmContainers = warm;
        const result = await module.exports.executeInSandbox('apl', '(⊃∘⌽+⍥⍎⊃)', { dyalogPath: '/test/dyalog' });
        assert.equal(result.success, true);
        assert.equal(result.output.trim(), OUTPUT.trim());
        assert.equal(result.isAplFunction, true);
        assert.deepEqual(result.aplFunctionTree, REPRESENTATION);
        assert.ok(input.includes('⍞←'), 'Metadata must bypass print-width wrapping');
    });
}
