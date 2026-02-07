/**
 * Array Box Configuration
 * 
 * Configure the backend URL for your deployment.
 * 
 * For LOCAL development (frontend and backend on same machine):
 *   - Leave BACKEND_URL as null (uses localhost directly)
 * 
 * For REMOTE deployment (GitHub Pages frontend + tunneled backend):
 *   - Set BACKEND_URL to your tunnel URL (e.g., from Cloudflare Tunnel or ngrok)
 *   - Example: 'https://your-tunnel-name.trycloudflare.com'
 *   - Example: 'https://abcd1234.ngrok-free.app'
 */

const ArrayBoxConfig = {
    // Set this to your tunnel URL when deploying to GitHub Pages
    // Leave as null for local development
    BACKEND_URL: 'https://penetration-dedicated-several-choice.trycloudflare.com',
    
    // Example configurations:
    // BACKEND_URL: 'https://arraybox.your-domain.com',     // Custom domain with Cloudflare Tunnel
    // BACKEND_URL: 'https://abc123.trycloudflare.com',     // Quick Cloudflare Tunnel
    // BACKEND_URL: 'https://xyz789.ngrok-free.app',        // ngrok free tier
    
    // Internal: Get the effective backend URL
    getBackendUrl() {
        if (this.BACKEND_URL) {
            // Remove trailing slash if present
            return this.BACKEND_URL.replace(/\/$/, '');
        }
        // Local development: use direct localhost URLs
        return null;
    },
    
    // Get URL for a specific service
    getServiceUrl(service) {
        const backendUrl = this.getBackendUrl();
        
        if (backendUrl) {
            // Production: use API gateway routes
            // Note: image is special - the gateway route is /api/image but we call /image/vertical
            // So we return /api which becomes /api/image/vertical
            const routes = {
                apl: `${backendUrl}/api/apl`,
                kap: `${backendUrl}/api/kap`,
                log: `${backendUrl}/api/log`,
                permalink: `${backendUrl}/api`,  // Becomes /api/p when /p is appended
                image: `${backendUrl}/api`        // Becomes /api/image when /image/vertical is appended
            };
            return routes[service] || backendUrl;
        }
        
        // Local development: use direct ports
        const localPorts = {
            apl: 'http://localhost:8081',
            log: 'http://localhost:8082',
            kap: 'http://localhost:8083',
            permalink: 'http://localhost:8084',
            image: 'http://localhost:8084'
        };
        return localPorts[service];
    },
    
    // Check if we're in remote/production mode
    isRemote() {
        return this.BACKEND_URL !== null;
    }
};

// Make available globally
window.ArrayBoxConfig = ArrayBoxConfig;
