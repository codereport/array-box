#!/usr/bin/env node
/**
 * Local J Server - Executes J code via local J installation
 * Requires J to be installed and available in PATH as 'jconsole' or 'ijconsole'
 * 
 * Usage: node j-server.js [port]
 * Default port: 8080
 */

const http = require('http');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 8080;

// Find J executable
function findJExecutable() {
    const { homedir } = require('os');
    const path = require('path');
    
    const candidates = [
        'ijconsole',  // Prefer ijconsole - it's the console-only version
        'jconsole',
        'j',
        path.join(homedir(), 'j9.6/bin/ijconsole'),
        path.join(homedir(), 'j9.6/bin/jconsole'),
        '/usr/local/bin/jconsole',
        '/usr/bin/jconsole'
    ];
    
    for (const cmd of candidates) {
        try {
            // Just try to spawn it - some J versions don't support --version
            // Use DISPLAY='' to prevent any GUI windows
            execSync(`"${cmd}" -js -e "exit 0"`, { 
                timeout: 2000, 
                stdio: 'ignore',
                env: { ...process.env, DISPLAY: '' }
            });
            return cmd;
        } catch (e) {
            // Try next candidate
        }
    }
    return null;
}

const jExecutable = findJExecutable();

if (!jExecutable) {
    console.error('Error: J interpreter not found.');
    console.error('Tried: jconsole, ~/j9.6/bin/jconsole, and standard locations');
    console.error('Please ensure J is installed.');
    process.exit(1);
}

console.log(`Using J executable: ${jExecutable}`);

function executeJCode(code) {
    return new Promise((resolve, reject) => {
        // J script that evaluates the code and prints the result
        const jScript = `${code}\nexit 0\n`;

        // Run J in script mode to prevent GUI windows
        const jProcess = spawn(jExecutable, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env, 
                DISPLAY: '',           // Prevent X11 windows
                TERM: 'dumb'           // Simple terminal mode
            }
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        jProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        jProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        jProcess.on('close', (exitCode) => {
            if (timedOut) {
                return; // Already rejected
            }
            
            // Clean up J's REPL output
            let output = stdout.trim();
            
            // Remove the "exit 0" echo if present
            output = output.replace(/\s*exit 0\s*$/, '').trim();
            
            if (stderr.trim()) {
                resolve(stderr.trim());
            } else {
                resolve(output);
            }
        });

        jProcess.on('error', (err) => {
            if (!timedOut) {
                reject(new Error(`Error executing J: ${err.message}`));
            }
        });

        // Set timeout
        const timeout = setTimeout(() => {
            timedOut = true;
            jProcess.kill('SIGTERM');
            reject(new Error('J execution timed out (10 seconds)'));
        }, 10000);

        jProcess.on('close', () => {
            clearTimeout(timeout);
        });

        // Send code to J
        jProcess.stdin.write(jScript);
        jProcess.stdin.end();
    });
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

                const result = await executeJCode(code);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, output: result }));
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
    console.log(`J Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
