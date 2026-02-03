#!/usr/bin/env node
/**
 * Local Kap Server - Executes Kap code via local Kap installation or Docker sandbox
 * Requires Kap JVM to be installed
 * 
 * Usage: node kap-server.cjs [port] [--sandbox|--no-sandbox]
 * Default port: 8083
 * 
 * With --sandbox: Uses Docker container for isolated execution (recommended for shared use)
 * With --no-sandbox: Uses local Kap installation directly (default for local dev)
 */

const http = require('http');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const path = require('path');
const { homedir } = require('os');
const sandbox = require('./sandbox.cjs');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 8083;
const USE_SANDBOX = process.argv.includes('--sandbox');
const NO_SANDBOX = process.argv.includes('--no-sandbox');

// Determine sandbox mode
let sandboxMode = USE_SANDBOX && !NO_SANDBOX;

// Find Kap executable
function findKapExecutable() {
    const candidates = [
        'kap-jvm',
        path.join(homedir(), 'Downloads/gui/bin/kap-jvm'),
        path.join(homedir(), 'Downloads/kap-jvm-build-linux/gui/bin/kap-jvm'),
        path.join(homedir(), 'kap/gui/bin/kap-jvm'),
        '/usr/local/bin/kap-jvm',
        '/usr/bin/kap-jvm'
    ];
    
    for (const cmd of candidates) {
        try {
            execSync(`"${cmd}" --help`, { 
                timeout: 5000, 
                stdio: 'ignore'
            });
            return cmd;
        } catch (e) {
            // Try next candidate
        }
    }
    return null;
}

const kapExecutable = findKapExecutable();

// In sandbox mode, we don't need a local Kap installation
if (!kapExecutable && !USE_SANDBOX) {
    console.error('Error: Kap interpreter not found.');
    console.error('Tried: kap-jvm, ~/Downloads/gui/bin/kap-jvm, ~/Downloads/kap-jvm-build-linux/gui/bin/kap-jvm, and standard locations');
    console.error('Please ensure Kap JVM is installed, or use --sandbox mode.');
    process.exit(1);
}

if (kapExecutable) {
    console.log(`Using Kap executable: ${kapExecutable}`);
} else {
    console.log('No local Kap installation found - using Docker sandbox');
}

// Check sandbox availability on startup
(async () => {
    if (sandboxMode) {
        const available = await sandbox.isSandboxAvailable('kap');
        if (available) {
            console.log('[Kap Server] Sandbox mode ENABLED - code runs in isolated Docker container');
        } else if (kapExecutable) {
            console.log('[Kap Server] Sandbox requested but unavailable - falling back to direct execution');
            sandboxMode = false;
        } else {
            console.error('[Kap Server] Sandbox unavailable and no local Kap installation - cannot start');
            process.exit(1);
        }
    } else {
        console.log('[Kap Server] Running in direct execution mode (use --sandbox for isolation)');
    }
})();

// Execute code in sandbox
async function executeKapCodeSandbox(code) {
    try {
        const result = await sandbox.executeInSandbox('kap', code);
        return { success: result.success, output: result.output };
    } catch (e) {
        if (e.message === 'SANDBOX_UNAVAILABLE') {
            // Only fall back to direct execution if we have a local Kap
            if (kapExecutable) {
                sandboxMode = false;
                return executeKapCodeDirect(code);
            }
            throw new Error('Sandbox unavailable and no local Kap installation');
        }
        throw e;
    }
}

// Execute code directly (original implementation)
function executeKapCodeDirect(code) {
    return new Promise((resolve, reject) => {
        // Use TTY mode with no line editor for clean stdin/stdout
        const kapProcess = spawn(kapExecutable, ['--tty', '--no-lineeditor'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env, 
                DISPLAY: '',  // Prevent GUI windows
            }
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        kapProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        kapProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        kapProcess.on('close', (exitCode) => {
            if (timedOut) {
                return; // Already rejected
            }
            
            // Parse output - Kap prefixes results with "⊢ "
            let output = stdout.trim();
            
            // Split by lines and filter out empty prompts
            let lines = output.split('\n');
            
            // Remove trailing empty prompt (⊢ with nothing after)
            lines = lines.filter(line => line.trim() !== '⊢');
            
            // Remove the ⊢ prefix from result lines
            let result = lines.map(line => {
                if (line.startsWith('⊢ ')) {
                    return line.substring(2);
                }
                return line;
            }).join('\n').trim();
            
            // Check for errors
            const isError = result.includes('Error at:') || 
                           result.includes('Error:') ||
                           stderr.includes('Error');
            
            // Filter out JLine warnings from stderr
            const filteredStderr = stderr.split('\n')
                .filter(line => !line.includes('WARNING:') && !line.includes('jline'))
                .join('\n').trim();
            
            if (filteredStderr) {
                resolve({ success: false, output: filteredStderr });
            } else if (isError) {
                resolve({ success: false, output: result });
            } else {
                resolve({ success: true, output: result });
            }
        });

        kapProcess.on('error', (err) => {
            if (!timedOut) {
                reject(new Error(`Error executing Kap: ${err.message}`));
            }
        });

        // Set timeout
        const timeout = setTimeout(() => {
            timedOut = true;
            kapProcess.kill('SIGTERM');
            reject(new Error('Kap execution timed out (10 seconds)'));
        }, 10000);

        kapProcess.on('close', () => {
            clearTimeout(timeout);
        });

        // Send code to Kap and close stdin to signal EOF
        kapProcess.stdin.write(code + '\n');
        kapProcess.stdin.end();
    });
}

// Main execution function - routes to sandbox or direct based on mode
async function executeKapCode(code) {
    if (sandboxMode) {
        return executeKapCodeSandbox(code);
    }
    return executeKapCodeDirect(code);
}

const server = http.createServer((req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/eval') {
        let body = '';
        
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const code = data.code || '';

                if (!code) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, output: 'No code provided' }));
                    return;
                }

                const result = await executeKapCode(code);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    output: error.message || String(error) 
                }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Kap Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
