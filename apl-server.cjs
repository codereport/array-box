#!/usr/bin/env node
/**
 * Local APL Server - Executes Dyalog APL code via local installation
 * Requires Dyalog APL to be installed and available as 'dyalog'
 * 
 * Usage: node apl-server.js [port]
 * Default port: 8081
 */

const http = require('http');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 8081;

// Find Dyalog executable
function findAPLExecutable() {
    const { homedir } = require('os');
    const path = require('path');
    
    const candidates = [
        'dyalog',
        '/opt/mdyalog/20.0/64/unicode/mapl',
        path.join(homedir(), 'dyalog/mapl')
    ];
    
    for (const cmd of candidates) {
        try {
            execSync(`echo "exit 0" | "${cmd}" 2>/dev/null`, { timeout: 3000, stdio: 'ignore' });
            return cmd;
        } catch (e) {
            // Try next candidate
        }
    }
    return null;
}

const aplExecutable = findAPLExecutable();

if (!aplExecutable) {
    console.error('Error: Dyalog APL interpreter not found.');
    console.error('Please ensure Dyalog APL is installed and "dyalog" is in your PATH.');
    process.exit(1);
}

console.log(`Using APL executable: ${aplExecutable}`);

function executeAPLCode(code) {
    return new Promise((resolve, reject) => {
        // Use ⍎ (execute) to evaluate and ⎕← to display the result
        // Escape single quotes in the code
        const escapedCode = code.replace(/'/g, "''");
        // Enable boxing with min style (only boxes nested/enclosed arrays, not simple arrays)
        const aplInput = `]boxing on -s=min\n⎕←⍎'${escapedCode}'\n`;
        
        // Run in batch mode (-b) to get cleaner output
        const aplProcess = spawn(aplExecutable, ['-b'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env, 
                DYALOG_NOPOPUPS: '1'
            }
        });

            let stdout = '';
            let stderr = '';
            let timedOut = false;

            aplProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            aplProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

        aplProcess.on('close', (exitCode) => {
            if (timedOut) {
                return; // Already rejected
            }
            
            // Dyalog outputs:
            // - Result to stdout
            // - Input echo and errors to stderr
            
            // Check if there's a real error in stderr (not just display errors or input echo)
            const cleanError = stderr
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    // Filter out display errors, input echo, and empty lines
                    if (!trimmed) return false;
                    if (trimmed.includes('ERR: Display.cpp')) return false;
                    if (trimmed.includes('ANGLE')) return false;
                    if (trimmed.includes('glX')) return false;
                    if (trimmed.includes('⎕←⍎')) return false;
                    if (trimmed.includes(']boxing')) return false;
                    return true;
                })
                .join('\n')
                .trim();
            
            if (cleanError) {
                resolve(cleanError);
            } else {
                // Return the stdout, filtering out ]boxing command output
                const cleanOutput = stdout
                    .split('\n')
                    .filter(line => {
                        const trimmed = line.trim();
                        // Filter out ]boxing output (e.g., "Was OFF -style=min")
                        if (trimmed.startsWith('Was ')) return false;
                        if (trimmed.match(/^Was (ON|OFF)/)) return false;
                        if (trimmed.includes('-style=')) return false;
                        // Filter out user command status/error messages (start with *)
                        if (trimmed.startsWith('*')) return false;
                        return true;
                    })
                    .join('\n')
                    .trim();
                resolve(cleanOutput);
            }
        });

        aplProcess.on('error', (err) => {
            if (!timedOut) {
                reject(new Error(`Error executing APL: ${err.message}`));
            }
        });

        // Set timeout
        const timeout = setTimeout(() => {
            timedOut = true;
            aplProcess.kill('SIGTERM');
            reject(new Error('APL execution timed out (10 seconds)'));
        }, 10000);

        aplProcess.on('close', () => {
            clearTimeout(timeout);
        });

        // Send input to APL
        aplProcess.stdin.write(aplInput);
        aplProcess.stdin.end();
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

                const result = await executeAPLCode(code);
                
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
    console.log(`APL Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
