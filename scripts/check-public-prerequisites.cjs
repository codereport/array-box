// Check the dependencies which server-manager otherwise hides when a child exits.
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { homedir } = require('node:os');

const repoDir = path.resolve(__dirname, '..');
const failures = [];
for (const file of [
    'servers/server-manager.cjs', 'servers/apl-server.cjs', 'servers/sandbox.cjs',
    'servers/api-gateway.cjs', 'docker/Dockerfile.apl', 'docker/Safe3.dyalog'
]) {
    if (!existsSync(path.join(repoDir, file))) failures.push(`Missing ArrayBox file: ${file}`);
}

// Use the same candidates and startup probe as apl-server.cjs.
const candidates = ['dyalog', '/opt/mdyalog/20.0/64/unicode/mapl', path.join(homedir(), 'dyalog/mapl')];
let apl = null;
for (const candidate of candidates) {
    const result = spawnSync(candidate, [], {
        input: 'exit 0\n', encoding: 'utf8', timeout: 3000,
        env: { ...process.env, ENABLE_CEF: '0', DYALOG_NOPOPUPS: '1' }
    });
    if (result.status === 0) {
        apl = candidate;
        break;
    }
}
if (!apl) {
    failures.push('Dyalog APL is missing or cannot start. Rerun setup.py --media-server-macbook online to download and install it from dyalog.com. For an offline install, put the official Linux x86_64 Unicode v20 installer from https://www.dyalog.com/download-zone.htm in ~/Downloads first.');
}

const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8', timeout: 6000 });
if (docker.status !== 0) {
    failures.push('Docker is unavailable to this terminal. Ensure docker.service is running; after setup adds your docker group, log out and back in or run newgrp docker before launching ArrayBox.');
    const detail = (docker.stderr || docker.error?.message || '').trim();
    if (detail) failures.push(detail);
}

if (failures.length) {
    for (const failure of failures) console.error(`ERROR: ${failure}`);
    process.exit(1);
}

if (process.argv.includes('--prepare')) {
    const image = 'arraybox-sandbox-apl';
    const inspect = spawnSync('docker', ['image', 'inspect', image], { stdio: 'ignore' });
    if (inspect.status !== 0) {
        console.log(`Building ${image} before starting the backend health-check timer...`);
        const build = spawnSync('docker', ['build', '-t', image, '-f', 'docker/Dockerfile.apl', 'docker'], {
            cwd: repoDir, stdio: 'inherit'
        });
        if (build.status !== 0) {
            console.error('ERROR: APL sandbox image build failed.');
            process.exit(1);
        }
    }
}
console.log(`Dyalog APL (${apl}) and Docker prerequisites passed.`);
