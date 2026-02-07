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
const stats = require('./stats.cjs');

// Check for sandbox mode
const SANDBOX_MODE = process.argv.includes('--sandbox');
if (SANDBOX_MODE) {
    console.log('[Server Manager] Sandbox mode enabled - servers will run code in Docker containers');
}

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
    tinyapl: {
        name: 'TinyAPL (client)',
        script: null,  // Runs in browser via WASM
        port: null,
        color: ansi.magenta,
        symbol: 'TAP',
        process: null,
        status: 'browser',  // Always running in browser
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: 'WASM'
    },
    j: {
        name: 'J (client)',
        script: null,  // Runs in browser via WASM
        port: null,
        color: ansi.cyan,
        symbol: 'J',
        process: null,
        status: 'browser',  // Always running in browser
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: 'WASM'
    },
    kap: {
        name: 'Kap Server',
        script: 'kap-server.cjs',
        port: 8083,
        color: ansi.blue,
        symbol: 'KAP',
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
    },
    permalink: {
        name: 'Permalink',
        script: 'permalink-server.cjs',
        port: 8084,
        color: ansi.white,
        symbol: 'LNK',
        process: null,
        status: 'stopped',
        requests: 0,
        errors: 0,
        lastRequest: null,
        startTime: null,
        executable: 'JSON file'
    }
};

// Log server port for receiving client-side execution logs
const LOG_SERVER_PORT = 8082;

// Request log (circular buffer)
const MAX_LOG_ENTRIES = 10;
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
    
    // Record to persistent stats for web dashboard
    if (type === 'eval') {
        stats.recordEvaluation(serverKey, success, code, duration);
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
    
    // Server status boxes - 3 per row
    output += ansi.bold + '  SERVER STATUS' + ansi.reset + ansi.dim + `  (uptime: ${formatUptime(now - startTime)})` + ansi.reset + '\n';
    output += '  ' + drawLine('─', Math.min(width - 4, 76)) + '\n';
    
    const serverEntries = Object.entries(servers);
    const colWidth = 24;
    
    for (let i = 0; i < serverEntries.length; i += 3) {
        const row = serverEntries.slice(i, i + 3);
        
        // Line 1: Name with symbol
        let line1 = '  ';
        for (const [key, server] of row) {
            const nameStr = `${server.symbol} ${server.name}`;
            line1 += `${server.color}${nameStr.padEnd(colWidth)}${ansi.reset}`;
        }
        output += line1 + '\n';
        
        // Line 2: Status icon and status text
        let line2 = '  ';
        for (const [key, server] of row) {
            const statusColor = server.status === 'running' ? ansi.green : 
                               server.status === 'starting' ? ansi.yellow :
                               server.status === 'browser' ? ansi.green : ansi.red;
            const statusIcon = server.status === 'running' ? '●' : 
                              server.status === 'starting' ? '◐' :
                              server.status === 'browser' ? '◈' : '○';
            const statusStr = `${statusIcon} ${server.status.toUpperCase()}`;
            line2 += `${statusColor}${statusStr.padEnd(colWidth)}${ansi.reset}`;
        }
        output += line2 + '\n';
        
        // Line 3: Port or type
        let line3 = '  ';
        for (const [key, server] of row) {
            let info = '';
            if (server.port) {
                info = `Port: ${server.port}`;
            } else {
                info = server.executable || '';
            }
            line3 += `${ansi.dim}${info.padEnd(colWidth)}${ansi.reset}`;
        }
        output += line3 + '\n';
        
        // Line 4: Requests count
        let line4 = '  ';
        for (const [key, server] of row) {
            let reqStr = `Req: ${ansi.cyan}${server.requests}${ansi.reset}`;
            if (server.errors > 0) {
                reqStr += ` ${ansi.red}Err: ${server.errors}${ansi.reset}`;
            }
            // Pad without ANSI codes
            const visibleLen = `Req: ${server.requests}` + (server.errors > 0 ? ` Err: ${server.errors}` : '');
            line4 += reqStr + ' '.repeat(Math.max(0, colWidth - visibleLen.length));
        }
        output += line4 + '\n\n';
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
    
    // Start the web dashboard server
    const dashboardPort = 8085;
    const dashboardScriptPath = path.join(__dirname, 'dashboard-server.cjs');
    const dashboardProc = spawn('node', [dashboardScriptPath, String(dashboardPort), '0.0.0.0'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    
    dashboardProc.stdout.on('data', (data) => {
        const text = data.toString();
        // Extract dashboard URL for display
        const match = text.match(/Local network: (http:\/\/[\d.]+:\d+)/);
        if (match) {
            servers.dashboard = servers.dashboard || {
                name: 'Dashboard',
                port: dashboardPort,
                color: ansi.white,
                symbol: 'WEB',
                process: dashboardProc,
                status: 'running',
                requests: 0,
                errors: 0,
                lastRequest: null,
                startTime: Date.now(),
                executable: match[1]
            };
            renderDashboard();
        }
    });
    dashboardProc.stderr.on('data', () => {});
    dashboardProc.on('close', () => {
        if (servers.dashboard) {
            servers.dashboard.status = 'stopped';
            servers.dashboard.process = null;
            renderDashboard();
        }
    });
    
    // Servers run on internal ports, proxies on external ports
    const aplInternalPort = 8181;
    const aplExternalPort = 8081;
    
    // J is client-side only (WASM) - no server to start
    
    // Start APL server
    servers.apl.port = aplExternalPort;
    const aplScriptPath = path.join(__dirname, 'apl-server.cjs');
    const aplArgs = [aplScriptPath, String(aplInternalPort)];
    if (SANDBOX_MODE) aplArgs.push('--sandbox');
    const aplProc = spawn('node', aplArgs, {
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
    
    // Start Kap server
    const kapInternalPort = 8183;
    const kapExternalPort = 8083;
    servers.kap.port = kapExternalPort;
    const kapScriptPath = path.join(__dirname, 'kap-server.cjs');
    const kapArgs = [kapScriptPath, String(kapInternalPort)];
    if (SANDBOX_MODE) kapArgs.push('--sandbox');
    const kapProc = spawn('node', kapArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    servers.kap.process = kapProc;
    servers.kap.status = 'starting';
    
    kapProc.stdout.on('data', (data) => {
        const text = data.toString();
        const execMatch = text.match(/Using Kap executable: (.+)/);
        if (execMatch) servers.kap.executable = execMatch[1].trim();
        
        const portMatch = text.match(/Server running on http:\/\/localhost:(\d+)/);
        if (portMatch) {
            servers.kap.actualPort = parseInt(portMatch[1]);
            servers.kap.status = 'running';
            servers.kap.startTime = Date.now();
            
            // Create Kap proxy immediately when server is ready
            if (!servers.kap.proxyActive && !servers.kap.proxyError) {
                createLoggerProxy('kap', kapInternalPort, kapExternalPort);
            }
            renderDashboard();
        }
    });
    kapProc.stderr.on('data', () => {});
    kapProc.on('close', () => { servers.kap.status = 'stopped'; servers.kap.process = null; renderDashboard(); });
    
    // Start Permalink server
    const permalinkPort = 8084;
    servers.permalink.port = permalinkPort;
    const permalinkScriptPath = path.join(__dirname, 'permalink-server.cjs');
    const permalinkProc = spawn('node', [permalinkScriptPath, String(permalinkPort)], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: __dirname
    });
    servers.permalink.process = permalinkProc;
    servers.permalink.status = 'starting';
    
    permalinkProc.stdout.on('data', (data) => {
        const text = data.toString();
        const portMatch = text.match(/Permalink server running on http:\/\/localhost:(\d+)/);
        if (portMatch) {
            servers.permalink.status = 'running';
            servers.permalink.startTime = Date.now();
            renderDashboard();
        }
        const loadedMatch = text.match(/Loaded (\d+) permalinks/);
        if (loadedMatch) {
            servers.permalink.requests = parseInt(loadedMatch[1]);
            renderDashboard();
        }
    });
    permalinkProc.stderr.on('data', () => {});
    permalinkProc.on('close', () => { servers.permalink.status = 'stopped'; servers.permalink.process = null; renderDashboard(); });
    
    // Create log server for client-side languages (BQN, Uiua, TinyAPL) and visitor tracking
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
        } else if (req.method === 'POST' && req.url === '/visitor') {
            // Track visitor
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    stats.recordVisitor(data.sessionId || generateSessionId());
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request' }));
                }
            });
        } else if (req.method === 'POST' && req.url === '/permalink') {
            // Track permalink creation
            stats.recordPermalink();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        } else {
            res.writeHead(404);
            res.end();
        }
    });
    
    function generateSessionId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
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
