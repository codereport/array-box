const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const executable = [
    process.env.ARRAYBOX_DYALOG,
    ...(process.env.PATH || '').split(path.delimiter).map(dir => path.join(dir, 'dyalog')),
    '/opt/mdyalog/20.0/64/unicode/mapl', path.join(homedir(), 'dyalog/mapl')
].find(candidate => candidate && existsSync(candidate));

test('Safe3 preserves execution and supplies the actual covered function tree', {
    skip: executable ? false : 'Dyalog is not installed; set ARRAYBOX_DYALOG to run this integration test'
}, async () => {
    const safe3 = path.resolve(__dirname, '../docker/Safe3.dyalog').replace(/'/g, "''");
    const result = spawnSync(executable, ['-b'], {
        input: [
            `⎕FIX 'file://${safe3}'`,
            "r←Safe3.Exec '(⊃∘⌽+⍥⍎⊃)'",
            "⍞←'TREE:',Safe3.LastResultTree,⎕UCS 10",
            "r←Safe3.Exec '((⍎+)∘⌽)'",
            "⍞←'NESTED:',Safe3.LastResultTree,⎕UCS 10",
            "r←Safe3.Exec '⍎''1+2'''",
            "⍞←'VALUE:',(⍕r),' TYPE:',(⍕Safe3.LastResultIsFunction),⎕UCS 10",
            ')OFF', ''
        ].join('\n'),
        encoding: 'utf8', timeout: 15000,
        env: { ...process.env, ENABLE_CEF: '0', DYALOG_NOPOPUPS: '1' }
    });
    assert.equal(result.status, 0, result.error?.message || result.stderr);
    const metadata = prefix => {
        const line = result.stdout.split('\n').find(line => line.startsWith(prefix));
        assert.ok(line, `Missing ${prefix} metadata: ${result.stdout}\n${result.stderr}`);
        return JSON.parse(line.slice(prefix.length));
    };
    const { formatAplFunctionOutput } = await import('../src/explain-tree.js');
    assert.equal(formatAplFunctionOutput(' ∇sûre_execute', metadata('TREE:'), '(⊃∘⌽+⍥⍎⊃)'),
        ' ┌───┼──┐\n ∘   ⍥  ⊃\n┌┴┐ ┌┴┐\n⊃ ⌽ + ⍎');
    assert.equal(formatAplFunctionOutput(' ∇sûre_execute', metadata('NESTED:'), '((⍎+)∘⌽)'),
        '  ∘\n ┌┴─┐\n┌┴┐ ⌽\n⍎ +');
    assert.ok(result.stdout.includes('VALUE:3 TYPE:0'), result.stdout);
});
