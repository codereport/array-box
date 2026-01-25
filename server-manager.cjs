#!/usr/bin/env node
/**
 * Array Box Server Manager
 * Launches APL and J servers with a terminal dashboard
 * 
 * Usage: node server-manager.js
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// ANSI escape codes for styling
const ansi = {
    clear: '\x1b[2J\x1b[H',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
    
    // Cursor
    hideCursor: '\x1b[?25l',
    showCursor: '\x1b[?25h',
    moveTo: (row, col) => `\x1b[${row};${col}H`,
};

// Server configuration
const servers = {
    bqn: {
        name: 'BQN (client)',
        script: null,  // Runs in browser
        port: null,
        color: ansi.green,
        symbol: 'BQN',
        process: null,
        status: 'browser',  // Always running in browser
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: 'JavaScript'
    },
    uiua: {
        name: 'Uiua (client)',
        script: null,  // Runs in browser via WASM
        port: null,
        color: ansi.yellow,
        symbol: 'UIA',
        process: null,
        status: 'browser',  // Always running in browser
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: 'WASM'
    },
    j: {
        name: 'J Server',
        script: 'j-server.cjs',
        port: 8080,
        color: ansi.cyan,
        symbol: 'J',
        process: null,
        status: 'stopped',
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: null
    },
    apl: {
        name: 'APL Server',
        script: 'apl-server.cjs',
        port: 8081,
        color: ansi.magenta,
        symbol: 'APL',
        process: null,
        status: 'stopped',
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: null
    }
};

// Log server port for receiving client-side execution logs
const LOG_SERVER_PORT = 8082;

// Request log (circular buffer)
const MAX_LOG_ENTRIES = 15;
const requestLog = [];

// Dashboard state
let dashboardInterval = null;
const startTime = Date.now();
const proxies = [];

// Format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Format timestamp
function formatTime(date) {
    return date.toTimeString().split(' ')[0];
}

// Truncate string with ellipsis
function truncate(str, maxLen) {
    if (!str) return '';
    str = str.replace(/\n/g, ' ').trim();
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
}

// Add to request log
function logRequest(serverKey, type, code, success, duration) {
    const entry = {
        time: new Date(),
        server: serverKey,
        type,
        code: code || '',
        success,
        duration
    };
    
    requestLog.unshift(entry);
    if (requestLog.length > MAX_LOG_ENTRIES) {
        requestLog.pop();
    }
    
    // Update server stats
    servers[serverKey].requests++;
    servers[serverKey].lastRequest = entry.time;
    if (!success) {
        servers[serverKey].errors++;
    }
    
    renderDashboard();
}

// Get terminal width
function getTerminalWidth() {
    return process.stdout.columns || 80;
}

// Draw a horizontal line
function drawLine(char = '─', width = null) {
    width = width || getTerminalWidth();
    return char.repeat(width);
}

// Center text
function centerText(text, width = null) {
    width = width || getTerminalWidth();
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
}

// Render the dashboard
function renderDashboard() {
    const width = getTerminalWidth();
    const now = Date.now();
    
    let output = ansi.clear;
    
    // Header - ASCII art title
    output += '\n';
    output += ansi.bold + ansi.cyan + '   ╭─────────────────────────────────────────────────────╮' + ansi.reset + '\n';
    output += ansi.bold + ansi.cyan + '   │  ' + ansi.yellow + '█▀█ █▀█ █▀█ █▀█ █▄█' + ansi.white + '   █▄▄ █▀█ ▀▄▀' + ansi.cyan + '   Server Manager │' + ansi.reset + '\n';
    output += ansi.bold + ansi.cyan + '   │  ' + ansi.yellow + '█▀█ █▀▄ █▀▄ █▀█ ░█░' + ansi.white + '   █▄█ █▄█ █░█' + ansi.cyan + '                  │' + ansi.reset + '\n';
    output += ansi.bold + ansi.cyan + '   ╰─────────────────────────────────────────────────────╯' + ansi.reset + '\n';
    
    // Uptime
    output += ansi.dim + `  Manager uptime: ${formatUptime(now - startTime)}` + ansi.reset + '\n\n';
    
    // Server status boxes
    output += ansi.bold + '  SERVER STATUS' + ansi.reset + '\n';
    output += '  ' + drawLine('─', Math.min(width - 4, 76)) + '\n';
    
    for (const [key, server] of Object.entries(servers)) {
        const statusColor = server.status === 'running' ? ansi.green : 
                           server.status === 'starting' ? ansi.yellow :
                           server.status === 'browser' ? ansi.green : ansi.red;
        const statusIcon = server.status === 'running' ? '●' : 
                          server.status === 'starting' ? '◐' :
                          server.status === 'browser' ? '◈' : '○';
        
        const uptime = server.startTime ? formatUptime(now - server.startTime) : '-';
        const lastReq = server.lastRequest ? formatTime(server.lastRequest) : 'none';
        
        output += `  ${server.color}${server.symbol} ${server.name}${ansi.reset}\n`;
        output += `    ${statusColor}${statusIcon} ${server.status.toUpperCase()}${ansi.reset}`;
        
        // Show port for server-based languages, or "in-browser" for client-side
        if (server.port) {
            output += `  │  Port: ${ansi.bold}${server.port}${ansi.reset}`;
        }
        output += `  │  Requests: ${ansi.cyan}${server.requests}${ansi.reset}`;
        if (server.errors > 0) {
            output += `  │  Errors: ${ansi.red}${server.errors}${ansi.reset}`;
        }
        output += '\n';
        
        if (server.executable) {
            output += `    ${ansi.dim}Executable: ${server.executable}${ansi.reset}\n`;
        }
        output += '\n';
    }
    
    // Request log
    output += ansi.bold + '  REQUEST LOG' + ansi.reset + '\n';
    output += '  ' + drawLine('─', Math.min(width - 4, 76)) + '\n';
    
    if (requestLog.length === 0) {
        output += ansi.dim + '  No requests yet...' + ansi.reset + '\n';
    } else {
        const codeWidth = Math.max(20, width - 50);
        
        for (const entry of requestLog) {
            const server = servers[entry.server];
            const statusIcon = entry.success ? ansi.green + '✓' : ansi.red + '✗';
            const time = formatTime(entry.time);
            const code = truncate(entry.code, codeWidth);
            const duration = entry.duration ? `${entry.duration}ms` : '';
            
            // Pad symbol to 3 chars for alignment (BQN, APL, J)
            const paddedSymbol = server.symbol.padEnd(3);
            
            output += `  ${ansi.dim}${time}${ansi.reset} `;
            output += `${server.color}${paddedSymbol}${ansi.reset} `;
            output += `${statusIcon}${ansi.reset} `;
            output += `${ansi.dim}${duration.padEnd(7)}${ansi.reset} `;
            output += `${code}\n`;
        }
    }
    
    output += '\n';
    
    // Footer
    output += '  ' + drawLine('─', Math.min(width - 4, 76)) + '\n';
    output += ansi.dim + '  Press Ctrl+C to stop all servers and exit' + ansi.reset + '\n';
    
    process.stdout.write(output);
}

// Start a server
function startServer(key) {
    const server = servers[key];
    server.status = 'starting';
    
    const scriptPath = path.join(__dirname, server.script);
    
    const proc = spawn('node', [scriptPath, server.port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    
    server.process = proc;
    
    // Handle stdout
    proc.stdout.on('data', (data) => {
        const text = data.toString();
        
        // Check for executable info
        const execMatch = text.match(/Using (J|APL) executable: (.+)/);
        if (execMatch) {
            server.executable = execMatch[2].trim();
        }
        
        // Check for server started
        if (text.includes('Server running on')) {
            server.status = 'running';
            server.startTime = Date.now();
            renderDashboard();
        }
    });
    
    // Handle stderr
    proc.stderr.on('data', (data) => {
        const text = data.toString();
        // Log errors but don't crash
        if (text.includes('Error')) {
            server.errors++;
        }
    });
    
    // Handle exit
    proc.on('close', (code) => {
        server.status = 'stopped';
        server.process = null;
        renderDashboard();
    });
    
    proc.on('error', (err) => {
        server.status = 'error';
        renderDashboard();
    });
}

// Create proxy server to intercept requests
function createProxyServer(targetKey) {
    const http = require('http');
    const server = servers[targetKey];
    const proxyPort = server.port;
    
    // Change the actual server port
    const actualPort = proxyPort + 100; // e.g., 8180 for J, 8181 for APL
    
    return { proxyPort, actualPort };
}

// Modified: Start servers with request logging via wrapper
function startServerWithLogging(key) {
    const server = servers[key];
    server.status = 'starting';
    
    const scriptPath = path.join(__dirname, server.script);
    
    const proc = spawn('node', [scriptPath, server.port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    
    server.process = proc;
    
    let buffer = '';
    
    // Handle stdout
    proc.stdout.on('data', (data) => {
        const text = data.toString();
        buffer += text;
        
        // Check for executable info
        const execMatch = text.match(/Using (J|APL) executable: (.+)/);
        if (execMatch) {
            server.executable = execMatch[2].trim();
        }
        
        // Check for server started
        if (text.includes('Server running on')) {
            server.status = 'running';
            server.startTime = Date.now();
            renderDashboard();
        }
    });
    
    // Handle stderr  
    proc.stderr.on('data', (data) => {
        const text = data.toString();
        if (text.includes('Error') || text.includes('error')) {
            server.errors++;
            renderDashboard();
        }
    });
    
    // Handle exit
    proc.on('close', (code) => {
        server.status = 'stopped';
        server.process = null;
        renderDashboard();
    });
    
    proc.on('error', (err) => {
        server.status = 'error';
        renderDashboard();
    });
}

// Create a request logger proxy
function createLoggerProxy(targetKey, targetPort, proxyPort) {
    const http = require('http');
    const server = servers[targetKey];
    
    const proxy = http.createServer((req, res) => {
        // Handle CORS preflight
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        const startTime = Date.now();
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            // Parse the code from the request
            let code = '';
            try {
                const data = JSON.parse(body);
                code = data.code || '';
            } catch (e) {}
            
            // Forward the request
            const options = {
                hostname: 'localhost',
                port: targetPort,
                path: req.url,
                method: req.method,
                headers: { ...req.headers }
            };
            
            const proxyReq = http.request(options, (proxyRes) => {
                const duration = Date.now() - startTime;
                
                let responseBody = '';
                proxyRes.on('data', chunk => {
                    responseBody += chunk.toString();
                });
                
                proxyRes.on('end', () => {
                    let success = true;
                    try {
                        const result = JSON.parse(responseBody);
                        success = result.success !== false;
                    } catch (e) {}
                    
                    // Log the request
                    if (req.url === '/eval' && req.method === 'POST') {
                        logRequest(targetKey, 'eval', code, success, duration);
                    }
                    
                    // Send response back to client
                    res.writeHead(proxyRes.statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(responseBody);
                });
            });
            
            proxyReq.on('error', (err) => {
                logRequest(targetKey, 'eval', code, false, Date.now() - startTime);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, output: 'Server unavailable' }));
            });
            
            if (body) {
                proxyReq.write(body);
            }
            proxyReq.end();
        });
    });
    
    proxy.on('error', (err) => {
        server.proxyError = err.message;
        renderDashboard();
    });
    
    proxy.listen(proxyPort, () => {
        proxies.push(proxy);
        server.proxyActive = true;
        renderDashboard();
    });
    
    return proxy;
}

// Main startup
async function main() {
    // Hide cursor and show initial dashboard
    process.stdout.write(ansi.hideCursor);
    renderDashboard();
    
    // Servers run on internal ports, proxies on external ports
    const jInternalPort = 8180;
    const aplInternalPort = 8181;
    const jExternalPort = 8080;
    const aplExternalPort = 8081;
    
    // Start J server
    servers.j.port = jExternalPort;
    const jScriptPath = path.join(__dirname, 'j-server.cjs');
    const jProc = spawn('node', [jScriptPath, String(jInternalPort)], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    servers.j.process = jProc;
    servers.j.status = 'starting';
    
    jProc.stdout.on('data', (data) => {
        const text = data.toString();
        const execMatch = text.match(/Using J executable: (.+)/);
        if (execMatch) servers.j.executable = execMatch[1].trim();
        
        const portMatch = text.match(/Server running on http:\/\/localhost:(\d+)/);
        if (portMatch) {
            servers.j.actualPort = parseInt(portMatch[1]);
            servers.j.status = 'running';
            servers.j.startTime = Date.now();
            
            // Create J proxy immediately when server is ready
            if (!servers.j.proxyActive && !servers.j.proxyError) {
                createLoggerProxy('j', jInternalPort, jExternalPort);
            }
            renderDashboard();
        }
    });
    jProc.stderr.on('data', () => {});
    jProc.on('close', () => { servers.j.status = 'stopped'; servers.j.process = null; renderDashboard(); });
    
    // Start APL server
    servers.apl.port = aplExternalPort;
    const aplScriptPath = path.join(__dirname, 'apl-server.cjs');
    const aplProc = spawn('node', [aplScriptPath, String(aplInternalPort)], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    servers.apl.process = aplProc;
    servers.apl.status = 'starting';
    
    aplProc.stdout.on('data', (data) => {
        const text = data.toString();
        const execMatch = text.match(/Using APL executable: (.+)/);
        if (execMatch) servers.apl.executable = execMatch[1].trim();
        
        const portMatch = text.match(/Server running on http:\/\/localhost:(\d+)/);
        if (portMatch) {
            servers.apl.actualPort = parseInt(portMatch[1]);
            servers.apl.status = 'running';
            servers.apl.startTime = Date.now();
            
            // Create APL proxy immediately when server is ready
            if (!servers.apl.proxyActive && !servers.apl.proxyError) {
                createLoggerProxy('apl', aplInternalPort, aplExternalPort);
            }
            renderDashboard();
        }
    });
    aplProc.stderr.on('data', () => {});
    aplProc.on('close', () => { servers.apl.status = 'stopped'; servers.apl.process = null; renderDashboard(); });
    
    // Create log server for client-side languages (BQN)
    const http = require('http');
    const logServer = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        if (req.method === 'POST' && req.url === '/log') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const { language, code, success, duration } = data;
                    
                    if (language && servers[language]) {
                        logRequest(language, 'eval', code, success, duration);
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request' }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });
    
    logServer.on('error', () => {}); // Silently handle errors
    logServer.listen(LOG_SERVER_PORT, () => {
        // Log server ready
    });
    proxies.push(logServer); // Add to proxies array for cleanup
    
    // Update dashboard periodically for uptime
    dashboardInterval = setInterval(renderDashboard, 1000);
    
    // Handle graceful shutdown
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

function shutdown() {
    process.stdout.write(ansi.showCursor);
    console.log('\n\nShutting down servers...');
    
    clearInterval(dashboardInterval);
    
    // Close proxies
    for (const proxy of proxies) {
        try {
            proxy.close();
        } catch (e) {}
    }
    
    for (const [key, server] of Object.entries(servers)) {
        if (server.process) {
            server.process.kill('SIGTERM');
            console.log(`  Stopped ${server.name}`);
        }
    }
    
    console.log('Goodbye!\n');
    process.exit(0);
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    // Ignore EADDRINUSE for proxies - they will retry
    if (err.code === 'EADDRINUSE') {
        return;
    }
    process.stdout.write(ansi.showCursor);
    console.error('Uncaught error:', err);
    shutdown();
});

// Run
main();
