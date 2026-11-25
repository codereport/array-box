const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

function fixture() {
    const children = [], removed = [], timers = new Map(), handlers = {};
    let nextTimer = 0;
    const filename = path.resolve(__dirname, '../servers/sandbox.cjs');
    const sandboxRequire = createRequire(filename);
    const context = {
        module: { exports: {} }, __dirname: path.dirname(filename),
        process: { env: process.env, on(event, fn) { handlers[event] = fn; }, exit() {} },
        console: { log() {}, warn() {}, error() {} },
        setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        require(name) {
            if (name !== 'child_process') return sandboxRequire(name);
            return {
                execSync() { return ''; },
                execFileSync(command, args) {
                    assert.equal(command, 'docker');
                    assert.deepEqual(Array.from(args.slice(0, 2)), ['rm', '--force']);
                    removed.push(args[2]);
                    const child = children.find(child => child.name === args[2]);
                    if (child) {
                        child.exitCode = 137;
                        queueMicrotask(() => { child.emit('exit', 137); child.emit('close', 137); });
                    }
                },
                spawn(command, args) {
                    assert.equal(command, 'docker');
                    const child = new EventEmitter();
                    Object.assign(child, {
                        name: args[args.indexOf('--name') + 1], exitCode: null, signalCode: null,
                        stdout: new EventEmitter(), stderr: new EventEmitter(), writes: [],
                        stdin: { write(text) { child.writes.push(text); }, end() {} },
                        kill() { assert.fail('Cleanup must terminate the container, not just its client'); }
                    });
                    children.push(child);
                    return child;
                }
            };
        }
    };
    vm.runInNewContext(readFileSync(filename, 'utf8'), context, { filename });
    const sandbox = context.module.exports;
    sandbox.CONFIG.prewarmOnStartup = false;
    async function tick() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
    async function fire(delay) {
        const entry = [...timers].find(([, timer]) => timer.delay === delay);
        assert.ok(entry, `Missing ${delay}ms timer`);
        timers.delete(entry[0]); entry[1].fn(); await tick();
    }
    async function ready(child) {
        child.stdout.emit('data', Buffer.from('Copyright Dyalog\n'));
        await fire(200);
        child.stdout.emit('data', Buffer.from('___SAFE3_LOADED___\n'));
        await tick();
    }
    function complete(child, output = '2') {
        const input = child.writes.at(-1);
        const marker = type => input.match(new RegExp(`___ARRAYBOX_${type}_[a-z0-9]+___`))[0];
        child.stdout.emit('data', Buffer.from(`${marker('START')}\n${output}\n${marker('END')}\n${marker('RESET')}\n`));
        child.stderr.emit('data', Buffer.from(`\n${marker('RESET')}\n`));
    }
    return { sandbox, context, children, removed, handlers, tick, fire, ready, complete };
}

test('warm timeout removes the interpreter and the next evaluation recovers', async () => {
    const f = fixture();
    const pending = f.sandbox.executeInSandbox('apl', '{∇⍵}0', { timeout: 25 });
    await f.ready(f.children[0]);
    await f.fire(25);
    const result = await pending;
    assert.equal(result.success, false);
    assert.equal(result.timedOut, true);
    assert.equal(result.output, 'Execution timed out (0.025 seconds)');
    assert.deepEqual(f.removed, [f.children[0].name]);
    const next = f.sandbox.executeInSandbox('apl', '1+1');
    assert.equal(f.children.length, 2);
    await f.ready(f.children[1]); f.complete(f.children[1]);
    assert.equal((await next).output, '2');
    f.sandbox.cleanupWarmContainers();
});

test('cold timeout removes the container instead of killing only docker run', async () => {
    const f = fixture();
    f.sandbox.CONFIG.useWarmContainers = false;
    const pending = f.sandbox.executeInSandbox('apl', '{∇⍵}0', { timeout: 25, dyalogPath: '/test/dyalog' });
    await f.tick(); await f.fire(25);
    assert.equal((await pending).timedOut, true);
    assert.deepEqual(f.removed, [f.children[0].name]);
});

test('concurrent startup reserves separate interpreters and retires displaced containers', async () => {
    const f = fixture();
    const first = f.sandbox.executeInSandbox('apl', '1+1');
    const second = f.sandbox.executeInSandbox('apl', '2+2');
    assert.equal(f.children.length, 2);
    await f.ready(f.children[0]); await f.ready(f.children[1]);
    f.complete(f.children[0], '2');
    assert.equal((await first).output, '2');
    assert.deepEqual(f.removed, [f.children[0].name]);
    f.complete(f.children[1], '4');
    assert.equal((await second).output, '4');
    const third = f.sandbox.executeInSandbox('apl', '3+3');
    await f.tick();
    assert.equal(f.children.length, 2);
    f.complete(f.children[1], '6');
    assert.equal((await third).output, '6');
    f.sandbox.cleanupWarmContainers();
    assert.deepEqual(f.removed, f.children.map(child => child.name));
});

test('shutdown cleans up all concurrent interpreters including displaced busy ones', async () => {
    const f = fixture();
    const first = f.context.getWarmContainer('apl');
    const second = f.context.getWarmContainer('apl');
    assert.equal(f.children.length, 2);
    await f.ready(f.children[0]); await f.ready(f.children[1]);
    await Promise.all([first, second]);
    f.handlers.exit();
    assert.deepEqual(f.removed, f.children.map(child => child.name));
});

test('an interpreter that cannot reset after an error is terminated', async () => {
    const f = fixture();
    const pending = f.sandbox.executeInSandbox('apl', 'undefinedName');
    await f.ready(f.children[0]);
    f.children[0].stdout.emit('data', Buffer.from('VALUE ERROR\n'));
    await f.fire(100);
    assert.equal((await pending).success, false);
    assert.deepEqual(f.removed, []);
    await f.fire(2000);
    assert.deepEqual(f.removed, [f.children[0].name]);
});
