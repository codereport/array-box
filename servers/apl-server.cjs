#!/usr/bin/env node
/**
 * Local APL Server - Executes Dyalog APL code via local installation or Docker sandbox
 * Requires Dyalog APL to be installed and available as 'dyalog'
 * 
 * Usage: node apl-server.js [port] [--sandbox|--no-sandbox]
 * Default port: 8081
 * 
 * With --sandbox: Uses Docker container for isolated execution (recommended for shared use)
 * With --no-sandbox: Uses local APL installation directly (default for local dev)
 */

const http = require('http');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const sandbox = require('./sandbox.cjs');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 8081;
const USE_SANDBOX = process.argv.includes('--sandbox');
const NO_SANDBOX = process.argv.includes('--no-sandbox');

// Determine sandbox mode
let sandboxMode = USE_SANDBOX && !NO_SANDBOX;

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

// Security: In sandbox mode, Safe3.dyalog provides comprehensive security
// via token whitelisting. This blocks ⍎ (execute), ⎕SH, ⎕CMD, ⎕NA, and
// any attempt to bypass via ⎕UCS character construction.
//
// The blocklist below is a secondary defense for direct execution mode.
const APL_BLOCKED_PATTERNS = [
    /⎕SH\b/i,
    /⎕SHELL\b/i,
    /⎕CMD\b/i,
    /⎕NA\b/i,
];

function validateAPLCode(code) {
    // In sandbox mode, Safe3 handles all validation via whitelist
    // This blocklist is just for direct mode (which is NOT secure)
    if (sandboxMode) {
        return { valid: true };
    }
    
    for (const pattern of APL_BLOCKED_PATTERNS) {
        if (pattern.test(code)) {
            const match = code.match(pattern);
            return { 
                valid: false, 
                error: `NOT PERMITTED: ${match ? match[0] : 'System function'} is disabled` 
            };
        }
    }
    return { valid: true };
}

// Check sandbox availability on startup
(async () => {
    if (sandboxMode) {
        const available = await sandbox.isSandboxAvailable('apl');
        if (available) {
            console.log('[APL Server] Sandbox mode ENABLED - code runs in isolated Docker container');
        } else {
            console.log('[APL Server] Sandbox requested but unavailable - falling back to direct execution');
            sandboxMode = false;
        }
    } else {
        console.log('[APL Server] Running in direct execution mode (use --sandbox for isolation)');
    }
})();

// Execute code in sandbox
async function executeAPLCodeSandbox(code) {
    try {
        // Let the sandbox find the Dyalog path itself (handles symlinks properly)
        const result = await sandbox.executeInSandbox('apl', code);
        return result;  // Return full result with success flag
    } catch (e) {
        if (e.message === 'SANDBOX_UNAVAILABLE' || e.message === 'DYALOG_NOT_FOUND') {
            // Fall back to direct execution
            sandboxMode = false;
            return await executeAPLCodeDirect(code);
        }
        throw e;
    }
}

// Execute code directly (original implementation)
function executeAPLCodeDirect(code) {
    return new Promise((resolve, reject) => {
        // For multiline code, we need to handle it specially in Dyalog APL
        // Enable boxing with min style and train tree view (trains like (+/÷≢) display as tree)
        
        // Filter out empty lines and comment-only lines (⍝ comments out the rest of the line)
        const lines = code.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('⍝'));
        
        // Also strip inline comments from lines (anything after ⍝)
        const cleanedLines = lines.map(line => {
            const commentIndex = line.indexOf('⍝');
            return commentIndex >= 0 ? line.substring(0, commentIndex).trim() : line;
        }).filter(line => line);  // Remove any lines that became empty after stripping comments
        
        // Build the APL input
        // Send code directly without ⍎ (execute) wrapper to avoid quote escaping issues
        let aplInput;
        if (cleanedLines.length === 0) {
            // Only comments - return empty
            aplInput = `]boxing on -s=min -trains=tree\n⎕←''\n`;
        } else if (cleanedLines.length === 1) {
            // Single line - send directly with output
            aplInput = `]boxing on -s=min -trains=tree\n⎕←${cleanedLines[0]}\n`;
        } else {
            // Multiline - wrap in a dfn and execute it
            // The dfn runs each line and returns the last expression's result
            // We use ⋄ (statement separator) to join lines within the dfn
            const joinedCode = cleanedLines.join(' ⋄ ');
            aplInput = `]boxing on -s=min -trains=tree\n⎕←{${joinedCode}}⍬\n`;
        }
        
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
            // - Result to stdout (in batch mode runtime errors like "ERROR 206: ..." also go to stdout)
            // - Input echo and some errors to stderr
            
            // Match classic APL error names or Dyalog numeric errors (e.g. "ERROR 206: Undefined name")
            const aplErrorInOutput = (text) =>
                /(VALUE|DOMAIN|RANK|LENGTH|SYNTAX|INDEX|NONCE|LIMIT|DEFN|STACK|FILE|SYSTEM|INTERRUPT)\s+ERROR/.test(text) ||
                /ERROR\s+\d+:\s*/.test(text);
            
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
                    if (trimmed.startsWith('⎕←')) return false;  // Filter input echo
                    if (trimmed.includes(']boxing')) return false;
                    return true;
                })
                .join('\n')
                .trim();
            
            if (cleanError) {
                resolve({ success: false, output: cleanError });
            } else {
                // Return the stdout, filtering out ]boxing command output and input echo
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
                        // Filter out input echo (our commands)
                        if (trimmed.startsWith('⎕←')) return false;
                        return true;
                    })
                    .join('\n')
                    .replace(/^\n+/, '')   // Remove leading newlines only
                    .replace(/\n+$/, '');  // Remove trailing newlines only (preserve spaces for box-drawing)
                // Runtime errors (e.g. ERROR 206: Undefined name) often appear on stdout in batch mode
                const isError = aplErrorInOutput(cleanOutput);
                resolve({ success: !isError, output: cleanOutput });
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

// Main execution function - routes to sandbox or direct based on mode
async function executeAPLCode(code) {
    if (sandboxMode) {
        return executeAPLCodeSandbox(code);
    }
    return executeAPLCodeDirect(code);
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

                // Validate code for blocked commands
                const validation = validateAPLCode(code);
                if (!validation.valid) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, output: validation.error }));
                    return;
                }

                const result = await executeAPLCode(code);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                // Result is either {success, output} object from sandbox or string from direct
                if (typeof result === 'object' && result !== null) {
                    res.end(JSON.stringify({ success: result.success, output: result.output }));
                } else {
                    res.end(JSON.stringify({ success: true, output: result }));
                }
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
