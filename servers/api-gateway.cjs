#!/usr/bin/env node
/**
 * Array Box API Gateway
 * 
 * A unified reverse proxy that consolidates all backend services under a single port.
 * This makes it easy to expose all services through a single tunnel.
 * 
 * Routes:
 *   /api/j/*     -> J server (8080)
 *   /api/apl/*   -> APL server (8081)
 *   /api/log/*   -> Log server (8082)
 *   /api/p/*     -> Permalink server (8084)
 *   /api/image/* -> OG image server (8084)
 * 
 * Usage: node api-gateway.cjs [port] [--production]
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const GATEWAY_PORT = parseInt(process.argv[2]) || 3000;
const IS_PRODUCTION = process.argv.includes('--production');

// Internal service ports (these run locally)
const SERVICES = {
    j: { port: 8080, path: '/api/j' },
    apl: { port: 8081, path: '/api/apl' },
    log: { port: 8082, path: '/api/log' },
    permalink: { port: 8084, path: '/api/p' },
    image: { port: 8084, path: '/api/image' }
};

// CORS headers for cross-origin requests (GitHub Pages -> your laptop)
function setCorsHeaders(res, origin) {
    // In production, you might want to restrict this to your GitHub Pages domain
    const allowedOrigin = IS_PRODUCTION 
        ? (origin || '*')  // In production, echo the origin or use wildcard
        : '*';             // In development, allow all
    
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

// Forward request to internal service
function proxyRequest(req, res, targetPort, targetPath) {
    const origin = req.headers.origin;
    setCorsHeaders(res, origin);
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Collect request body
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
        body = Buffer.concat(body);
        
        const options = {
            hostname: 'localhost',
            port: targetPort,
            path: targetPath,
            method: req.method,
            headers: {
                ...req.headers,
                host: `localhost:${targetPort}`
            }
        };
        
        const proxyReq = http.request(options, (proxyRes) => {
            // Copy status and headers from upstream
            const headers = { ...proxyRes.headers };
            // Ensure CORS headers are set even on proxied responses
            headers['Access-Control-Allow-Origin'] = origin || '*';
            
            res.writeHead(proxyRes.statusCode, headers);
            proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
            console.error(`Proxy error to port ${targetPort}:`, err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: `Service unavailable (port ${targetPort})`,
                details: err.message
            }));
        });
        
        if (body.length > 0) {
            proxyReq.write(body);
        }
        proxyReq.end();
    });
}

// Route request to appropriate service
function routeRequest(req, res) {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;
    
    // Health check endpoint
    if (pathname === '/health' || pathname === '/api/health') {
        setCorsHeaders(res, req.headers.origin);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            services: Object.keys(SERVICES)
        }));
        return;
    }
    
    // J server: /api/j/eval -> localhost:8080/eval
    if (pathname.startsWith('/api/j/')) {
        const targetPath = pathname.replace('/api/j', '') + (parsedUrl.search || '');
        proxyRequest(req, res, SERVICES.j.port, targetPath || '/');
        return;
    }
    
    // APL server: /api/apl/eval -> localhost:8081/eval
    if (pathname.startsWith('/api/apl/')) {
        const targetPath = pathname.replace('/api/apl', '') + (parsedUrl.search || '');
        proxyRequest(req, res, SERVICES.apl.port, targetPath || '/');
        return;
    }
    
    // Log server: /api/log/* -> localhost:8082/*
    if (pathname.startsWith('/api/log/')) {
        const targetPath = pathname.replace('/api/log', '') + (parsedUrl.search || '');
        proxyRequest(req, res, SERVICES.log.port, targetPath || '/');
        return;
    }
    
    // Permalink server: /api/p/* -> localhost:8084/p/*
    if (pathname.startsWith('/api/p')) {
        // Keep /p in the path for permalink server
        const targetPath = pathname.replace('/api', '') + (parsedUrl.search || '');
        proxyRequest(req, res, SERVICES.permalink.port, targetPath);
        return;
    }
    
    // OG Image server: /api/image/* -> localhost:8084/image/*
    if (pathname.startsWith('/api/image')) {
        const targetPath = pathname.replace('/api', '') + (parsedUrl.search || '');
        proxyRequest(req, res, SERVICES.image.port, targetPath);
        return;
    }
    
    // Not found
    setCorsHeaders(res, req.headers.origin);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        error: 'Not found',
        hint: 'Available routes: /api/j/*, /api/apl/*, /api/log/*, /api/p/*, /api/image/*'
    }));
}

// Create and start the gateway server
const server = http.createServer(routeRequest);

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   Array Box API Gateway                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Gateway running on: http://localhost:${GATEWAY_PORT.toString().padEnd(24)}║
║  Mode: ${IS_PRODUCTION ? 'Production'.padEnd(53) : 'Development'.padEnd(53)}║
╠═══════════════════════════════════════════════════════════════╣
║  Routes:                                                      ║
║    /api/j/*     -> J server (${SERVICES.j.port})                          ║
║    /api/apl/*   -> APL server (${SERVICES.apl.port})                        ║
║    /api/log/*   -> Log server (${SERVICES.log.port})                        ║
║    /api/p/*     -> Permalink server (${SERVICES.permalink.port})                    ║
║    /api/image/* -> OG image generator (${SERVICES.image.port})                  ║
║    /health      -> Health check                               ║
╚═══════════════════════════════════════════════════════════════╝

To expose via Cloudflare Tunnel:
  cloudflared tunnel --url http://localhost:${GATEWAY_PORT}

To expose via ngrok:
  ngrok http ${GATEWAY_PORT}
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down API gateway...');
    server.close(() => {
        console.log('Gateway closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});
