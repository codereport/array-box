#!/usr/bin/env node
/**
 * Permalink Server for ArrayBox
 * Stores and retrieves short permalinks (4-char codes)
 * 
 * Usage: node permalink-server.cjs [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2]) || 8084;
const STORAGE_FILE = path.join(__dirname, '..', 'storage', 'permalinks.json');
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Load permalinks from file
function loadPermalinks() {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            const data = fs.readFileSync(STORAGE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading permalinks:', e.message);
    }
    return {};
}

// Save permalinks to file
function savePermalinks(permalinks) {
    try {
        const dir = path.dirname(STORAGE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(permalinks, null, 2));
        return true;
    } catch (e) {
        console.error('Error saving permalinks:', e.message);
        return false;
    }
}

// Generate random 4-char code
function generateCode() {
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return code;
}

// Increment code for collision handling
function incrementCode(code) {
    const chars = code.split('');
    for (let i = chars.length - 1; i >= 0; i--) {
        const idx = CHARS.indexOf(chars[i]);
        if (idx < CHARS.length - 1) {
            chars[i] = CHARS[idx + 1];
            return chars.join('');
        }
        chars[i] = CHARS[0];
    }
    return CHARS[0] + chars.join('');
}

// In-memory cache
let permalinks = loadPermalinks();

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // GET /p/:code - Retrieve permalink
    if (req.method === 'GET' && req.url.startsWith('/p/')) {
        const code = req.url.slice(3);
        const data = permalinks[code];
        
        if (data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, ...data }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Not found' }));
        }
        return;
    }

    // POST /p - Create permalink
    if (req.method === 'POST' && req.url === '/p') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { lang, code } = JSON.parse(body);
                
                if (!lang || !code) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Missing lang or code' }));
                    return;
                }

                const content = { lang, code };
                const contentStr = JSON.stringify(content);

                // Check for existing identical content
                for (const [key, value] of Object.entries(permalinks)) {
                    if (JSON.stringify(value) === contentStr) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, id: key }));
                        return;
                    }
                }

                // Generate new code
                let newCode = generateCode();
                while (permalinks[newCode]) {
                    newCode = incrementCode(newCode);
                }

                // Store and save
                permalinks[newCode] = content;
                if (savePermalinks(permalinks)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, id: newCode }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Failed to save' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', count: Object.keys(permalinks).length }));
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`Permalink server running on http://localhost:${PORT}`);
    console.log(`Storage: ${STORAGE_FILE}`);
    console.log(`Loaded ${Object.keys(permalinks).length} permalinks`);
});
