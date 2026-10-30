// Stop an old public stack, including children left behind by its launcher.
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const stackScripts = new Set([
    'scripts/serve-public.sh',
    'servers/server-manager.cjs',
    'servers/api-gateway.cjs',
    'servers/dashboard-server.cjs',
    'servers/apl-server.cjs',
    'servers/permalink-server.cjs'
]);

function readProcess(pid) {
    try {
        const dir = `/proc/${pid}`;
        const stat = fs.readFileSync(`${dir}/stat`, 'utf8');
        const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
        return {
            pid,
            parentPid: Number(fields[1]),
            state: fields[0],
            started: fields[19],
            args: fs.readFileSync(`${dir}/cmdline`, 'utf8').split('\0').filter(Boolean),
            cwd: fs.readlinkSync(`${dir}/cwd`)
        };
    } catch {
        // Processes can exit while /proc is being read.
        return null;
    }
}

function listProcesses() {
    return fs.readdirSync('/proc')
        .filter(name => /^\d+$/.test(name))
        .map(name => readProcess(Number(name)))
        .filter(Boolean);
}

function belongsToStack(proc, repoDir) {
    const executable = path.basename(proc.args[0] || '');
    const script = proc.args.slice(1).find(arg => !arg.startsWith('-'));
    if (script && ['bash', 'sh', 'dash', 'node', 'nodejs'].includes(executable)) {
        const relative = path.relative(repoDir, path.resolve(proc.cwd, script));
        if (stackScripts.has(relative)) return true;
    }

    if (executable !== 'cloudflared' || proc.cwd !== repoDir) return false;
    const urlIndex = proc.args.indexOf('--url');
    const url = proc.args.find(arg => arg.startsWith('--url='))?.slice(6)
        || (urlIndex >= 0 ? proc.args[urlIndex + 1] : '');
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):3000\/?$/.test(url || '');
}

function isRunning(proc) {
    const current = readProcess(proc.pid);
    // Check the start time too, so a recycled PID never targets a new process.
    return current && current.started === proc.started && !['Z', 'X'].includes(current.state);
}

function signal(proc, name) {
    if (!isRunning(proc)) return;
    try {
        process.kill(proc.pid, name);
    } catch (error) {
        if (error.code !== 'ESRCH') throw error;
    }
}

async function stopProcessTrees(pids, {
    processes = listProcesses(),
    excludePid,
    timeoutMs = 5000,
    log = console.log
} = {}) {
    const selected = new Map();
    const protectedPids = new Set([process.pid]);
    function protect(pid) {
        if (!pid || protectedPids.has(pid)) return;
        protectedPids.add(pid);
        for (const child of processes.filter(candidate => candidate.parentPid === pid)) {
            protect(child.pid);
        }
    }
    protect(excludePid);
    function collect(pid) {
        if (protectedPids.has(pid) || selected.has(pid)) return;
        const proc = processes.find(candidate => candidate.pid === pid);
        if (!proc) return;
        selected.set(pid, proc);
        for (const child of processes.filter(candidate => candidate.parentPid === pid)) {
            collect(child.pid);
        }
    }
    for (const pid of pids) collect(pid);

    let running = [...selected.values()].filter(isRunning);
    if (!running.length) return;
    log(`Stopping Array Box processes (PIDs: ${running.map(proc => proc.pid).join(', ')})...`);
    for (const proc of running) signal(proc, 'SIGTERM');

    const deadline = Date.now() + timeoutMs;
    while (running.length && Date.now() < deadline) {
        await delay(100);
        running = running.filter(isRunning);
    }
    if (!running.length) return;

    log(`Force-stopping remaining processes (PIDs: ${running.map(proc => proc.pid).join(', ')})...`);
    for (const proc of running) signal(proc, 'SIGKILL');
    const killDeadline = Date.now() + 1000;
    while (running.length && Date.now() < killDeadline) {
        await delay(100);
        running = running.filter(isRunning);
    }
    if (running.length) {
        throw new Error(`Could not stop Array Box processes: ${running.map(proc => proc.pid).join(', ')}`);
    }
}

async function stopExistingProcesses({ repoDir, excludePid, ...options }) {
    repoDir = fs.realpathSync(repoDir);
    const processes = listProcesses();
    const pids = processes.filter(proc => belongsToStack(proc, repoDir)).map(proc => proc.pid);
    await stopProcessTrees(pids, { ...options, processes, excludePid });
}

module.exports = { stopExistingProcesses, stopProcessTrees };

if (require.main === module) {
    const [mode, ...args] = process.argv.slice(2);
    let task;
    if (mode === '--pids' && args.length && args.every(arg => /^[1-9]\d*$/.test(arg))) {
        task = stopProcessTrees(args.map(Number));
    } else if (mode === '--exclude' && args.length === 1 && /^[1-9]\d*$/.test(args[0])) {
        task = stopExistingProcesses({ repoDir: path.resolve(__dirname, '..'), excludePid: Number(args[0]) });
    } else {
        console.error('Usage: stop-public-processes.cjs --exclude PID | --pids PID...');
        process.exitCode = 1;
    }
    task?.catch(error => {
        console.error(`ERROR: ${error.message}`);
        process.exitCode = 1;
    });
}
