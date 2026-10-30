const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');

const { stopExistingProcesses, stopProcessTrees } = require('../scripts/stop-public-processes.cjs');

async function fixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arraybox-processes-'));
    const children = [];
    t.after(async () => {
        await stopProcessTrees(children.map(child => child.pid), { timeoutMs: 100, log: () => {} });
        fs.rmSync(dir, { recursive: true, force: true });
    });
    async function start(script, source, { cwd = dir, executable = process.execPath, args = [], env = process.env } = {}) {
        const scriptPath = path.join(dir, script);
        fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
        if (source !== null) fs.writeFileSync(scriptPath, source);
        const child = spawn(executable, [scriptPath, ...args], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
        children.push(child);
        child.output = '';
        child.stdout.on('data', data => { child.output += data; });
        child.stderr.on('data', data => { child.output += data; });
        child.completion = new Promise(resolve => child.once('exit', (code, signal) => resolve([code, signal])));
        await new Promise((resolve, reject) => {
            child.once('error', reject);
            child.once('exit', code => reject(new Error(`Fixture exited before ready: ${code}\n${child.output}`)));
            child.stdout.once('data', data => {
                child.readyOutput = data.toString().trim();
                resolve();
            });
        });
        return child;
    }
    return { dir, start };
}

const idle = "console.log('ready'); setInterval(() => {}, 1000);";

test('restart stops existing servers and the port-3000 tunnel while preserving other processes', async t => {
    const { dir, start } = await fixture(t);
    const foreignDir = path.join(dir, 'other-project');
    fs.mkdirSync(foreignDir);
    const cloudflared = path.join(dir, 'cloudflared');
    fs.symlinkSync(process.execPath, cloudflared);

    const server = await start('servers/server-manager.cjs', idle);
    const serverExit = once(server, 'exit');
    const gateway = await start('servers/api-gateway.cjs', idle);
    const gatewayExit = once(gateway, 'exit');
    const orphan = await start('servers/dashboard-server.cjs', idle);
    const orphanExit = once(orphan, 'exit');
    const tunnel = await start('tunnel.cjs', idle, {
        executable: cloudflared, args: ['tunnel', '--url', 'http://localhost:3000']
    });
    const tunnelExit = once(tunnel, 'exit');
    const unrelatedTunnel = await start('other-tunnel.cjs', idle, {
        executable: cloudflared, args: ['tunnel', '--url=http://localhost:4000']
    });
    const foreign = await start('other-project/servers/server-manager.cjs', idle, { cwd: foreignDir });
    const unrelated = await start('unrelated.cjs', idle, { args: [path.join(dir, 'servers/apl-server.cjs')] });

    await stopExistingProcesses({ repoDir: dir, timeoutMs: 1000, log: () => {} });
    await Promise.all([serverExit, gatewayExit, orphanExit, tunnelExit]);
    assert.equal(unrelatedTunnel.exitCode, null);
    assert.equal(unrelatedTunnel.signalCode, null);
    assert.equal(foreign.exitCode, null);
    assert.equal(foreign.signalCode, null);
    assert.equal(unrelated.exitCode, null);
    assert.equal(unrelated.signalCode, null);
});

test('cleanup kills descendants and escalates when they ignore SIGTERM', async t => {
    const { dir, start } = await fixture(t);
    const childScript = path.join(dir, 'stubborn-child.cjs');
    fs.writeFileSync(childScript, "process.on('SIGTERM', () => {}); " + idle);
    const parent = await start('servers/server-manager.cjs', `
        const { spawn } = require('node:child_process');
        const child = spawn(process.execPath, [${JSON.stringify(childScript)}], { stdio: ['ignore', 'pipe', 'inherit'] });
        child.stdout.once('data', () => console.log(child.pid));
        setInterval(() => {}, 1000);
    `);
    const parentExit = once(parent, 'exit');
    const messages = [];
    await stopProcessTrees([parent.pid], { timeoutMs: 100, log: message => messages.push(message) });
    await parentExit;
    assert.ok(messages.some(message => message.includes('Force-stopping remaining processes')));
    const childStat = `/proc/${parent.readyOutput}/stat`;
    assert.ok(!fs.existsSync(childStat) || fs.readFileSync(childStat, 'utf8').includes(') Z '));
});

test('restart excludes the current launcher and its children', async t => {
    const { dir, start } = await fixture(t);
    const childScript = path.join(dir, 'servers/apl-server.cjs');
    fs.mkdirSync(path.dirname(childScript));
    fs.writeFileSync(childScript, idle);
    const launcher = await start('scripts/serve-public.sh', `
        const { spawn } = require('node:child_process');
        const child = spawn(process.execPath, [${JSON.stringify(childScript)}], { stdio: ['ignore', 'pipe', 'inherit'] });
        child.stdout.once('data', () => console.log(child.pid));
        setInterval(() => {}, 1000);
    `);
    await stopExistingProcesses({ repoDir: dir, excludePid: launcher.pid, log: () => {} });
    assert.equal(launcher.exitCode, null);
    assert.equal(launcher.signalCode, null);
    process.kill(Number(launcher.readyOutput), 0);
});

async function launcherFixture(t) {
    const { dir, start } = await fixture(t);
    const stateDir = path.join(dir, 'state', 'array-box');
    function write(file, source, mode = 0o644) {
        const target = path.join(dir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, source, { mode });
    }
    for (const script of ['serve-public.sh', 'stop-public-processes.cjs']) {
        write(`scripts/${script}`, fs.readFileSync(path.join(__dirname, '..', 'scripts', script)));
    }
    write('scripts/check-public-prerequisites.cjs', `
        console.log('Checking test prerequisites');
        if (process.env.ARRAYBOX_TEST_FAIL_PREPARE && process.argv.includes('--prepare')) process.exit(1);
    `);
    const recordPid = name => `
        require('node:fs').writeFileSync(
            require('node:path').join(process.env.XDG_STATE_HOME, 'array-box', '${name}.pid'),
            String(process.pid)
        );
    `;
    write('worker.cjs', recordPid('worker') + idle);
    write('servers/server-manager.cjs', `
        const { spawn } = require('node:child_process');
        const child = spawn(process.execPath, ['worker.cjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
        child.stdout.once('data', () => { ${recordPid('manager')} console.log('ready'); });
        setInterval(() => {}, 1000);
    `);
    write('servers/api-gateway.cjs', `
        if (process.env.ARRAYBOX_TEST_FAIL_GATEWAY) process.exit(1);
        ${recordPid('gateway')}
        ${idle}
    `);
    write('tunnel.cjs', recordPid('tunnel') + `
        console.log('https://fixture.trycloudflare.com');
        setInterval(() => {}, 1000);
    `);
    write('bin/cloudflared', '#!/usr/bin/env bash\nexec -a cloudflared node "$ARRAYBOX_TEST_DIR/tunnel.cjs" "$@"\n', 0o755);
    write('bin/curl', `#!/bin/sh
case "$*" in
    *127.0.0.1:3000/health*) service=gateway ;;
    *trycloudflare.com/health*) service=tunnel ;;
    *) service=manager ;;
esac
pid=$(cat "$XDG_STATE_HOME/array-box/$service.pid" 2>/dev/null) || exit 1
kill -0 "$pid" 2>/dev/null
`, 0o755);
    write('bin/ss', '#!/bin/sh\nif [ -n "$ARRAYBOX_TEST_OCCUPIED_PORT" ] && [ "$*" = "-H -ltn sport = :$ARRAYBOX_TEST_OCCUPIED_PORT" ]; then echo LISTEN; fi\n', 0o755);
    write('bin/sleep', '#!/bin/sh\nexec /usr/bin/sleep 0.05\n', 0o755);
    // Unrelated tunnels must not prevent startup; any deployment attempt must fail.
    write('bin/pgrep', '#!/bin/sh\nexit 0\n', 0o755);
    for (const command of ['docker', 'git']) write(`bin/${command}`, '#!/bin/sh\nexit 1\n', 0o755);
    return {
        start,
        launch: (args = [], overrides = {}) => start('scripts/serve-public.sh', null, {
            executable: 'bash', args: ['--no-deploy', ...args],
            env: {
                ...process.env,
                PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`,
                XDG_STATE_HOME: path.join(dir, 'state'),
                ARRAYBOX_TEST_DIR: dir,
                ...overrides
            }
        }),
        pids: () => ['manager', 'gateway', 'tunnel', 'worker']
            .map(name => Number(fs.readFileSync(path.join(stateDir, `${name}.pid`), 'utf8'))),
        stateDir
    };
}

async function waitForPublicStack(child) {
    const deadline = Date.now() + 5000;
    while (!child.output.includes('Array Box is running publicly.')) {
        assert.ok(child.exitCode === null && child.signalCode === null && Date.now() < deadline, child.output);
        await delay(20);
    }
}

function isAlive(pid) {
    try {
        const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
        return !['Z', 'X'].includes(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0]);
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    }
}

test('launcher replaces a running stack, leaves it alone during checks, and cleans up on shutdown', { timeout: 20000 }, async t => {
    const { launch, pids } = await launcherFixture(t);
    const original = await launch();
    await waitForPublicStack(original);
    const originalPids = pids();

    const check = await launch(['--check']);
    assert.deepEqual(await check.completion, [0, null], check.output);
    assert.ok(originalPids.every(isAlive));
    assert.equal(original.exitCode, null);

    const failedPreflight = await launch([], { ARRAYBOX_TEST_FAIL_PREPARE: '1' });
    assert.deepEqual(await failedPreflight.completion, [1, null], failedPreflight.output);
    assert.ok(originalPids.every(isAlive));
    assert.equal(original.exitCode, null);

    const replacement = await launch();
    await waitForPublicStack(replacement);
    await original.completion;
    assert.ok(originalPids.every(pid => !isAlive(pid)), replacement.output);
    const replacementPids = pids();
    assert.ok(replacementPids.every(isAlive));

    replacement.kill('SIGTERM');
    assert.deepEqual(await replacement.completion, [143, null], replacement.output);
    assert.ok(replacementPids.every(pid => !isAlive(pid)), replacement.output);
});

test('launcher refuses ports occupied by unrelated processes', { timeout: 10000 }, async t => {
    const { launch, start, stateDir } = await launcherFixture(t);
    const unrelated = await start('unrelated.cjs', idle);
    const launcher = await launch([], { ARRAYBOX_TEST_OCCUPIED_PORT: '3000' });
    assert.deepEqual(await launcher.completion, [1, null], launcher.output);
    assert.match(launcher.output, /Required ports are occupied by other processes: 3000/);
    assert.ok(isAlive(unrelated.pid));
    assert.ok(!fs.existsSync(path.join(stateDir, 'manager.pid')));
});

test('launcher cleans up the backend and its children when gateway startup fails', { timeout: 10000 }, async t => {
    const { launch, stateDir } = await launcherFixture(t);
    const launcher = await launch([], { ARRAYBOX_TEST_FAIL_GATEWAY: '1' });
    assert.deepEqual(await launcher.completion, [1, null], launcher.output);
    assert.match(launcher.output, /API gateway exited during startup/);
    for (const name of ['manager', 'worker']) {
        const pid = Number(fs.readFileSync(path.join(stateDir, `${name}.pid`), 'utf8'));
        assert.ok(!isAlive(pid), launcher.output);
    }
});
