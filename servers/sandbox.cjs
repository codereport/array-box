#!/usr/bin/env node
/**
 * Docker Sandbox Module
 * Executes code in isolated Docker containers with strict security limits
 * 
 * Security features:
 * - Read-only filesystem
 * - tmpfs for scratch space
 * - No network access
 * - CPU and memory limits
 * - Unprivileged user
 * - Execution timeout
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
    // Resource limits
    memoryLimit: '256m',      // Maximum memory (increased for faster JVM)
    cpuLimit: '1.0',          // CPU cores (increased for faster startup)
    timeout: 10000,           // Execution timeout in ms
    
    // Container images (will be built on first use)
    images: {
        j: 'arraybox-sandbox-j',
        kap: 'arraybox-sandbox-kap',
        apl: 'arraybox-sandbox-apl'
    },
    
    // Paths to Dockerfiles
    dockerDir: path.join(__dirname, '..', 'docker'),
    
    // Whether sandbox is enabled (falls back to direct execution if false)
    enabled: true,
    
    // Warm container settings
    useWarmContainers: true,
    warmContainerIdleTimeout: 0,       // 0 = never kill idle containers (always warm)
    maxRequestsPerContainer: 500,      // Recycle container after N requests (security/isolation)
    prewarmOnStartup: true             // Start containers immediately on module load
};

// Warm container pool: language -> { container, busy, requestCount, lastUsed }
const warmPool = {};

// Track if Docker is available
let dockerAvailable = null;
let imagesBuilt = {};

/**
 * Find Dyalog APL installation path on host
 */
function findDyalogPath() {
    const fs = require('fs');
    const path = require('path');
    const { homedir } = require('os');
    const { execSync } = require('child_process');
    
    // First, try to find dyalog executable and resolve its real path
    const exeCandidates = ['/usr/bin/dyalog', '/usr/local/bin/dyalog'];
    for (const exe of exeCandidates) {
        if (fs.existsSync(exe)) {
            try {
                // Resolve symlink to find actual installation
                const realPath = fs.realpathSync(exe);
                const installDir = path.dirname(realPath);
                console.log(`[Sandbox] Found Dyalog at: ${installDir} (via ${exe})`);
                return installDir;
            } catch (e) {
                // If it's not a symlink, the directory containing it is the install dir
                const installDir = path.dirname(exe);
                // But /usr/bin isn't a valid install dir, so skip
            }
        }
    }
    
    // Try common installation directories
    const candidates = [
        '/opt/mdyalog/20.0/64/unicode',
        '/opt/mdyalog/19.0/64/unicode', 
        '/opt/mdyalog/18.2/64/unicode',
        '/opt/dyalog',
        '/usr/share/dyalog',
        path.join(homedir(), 'dyalog'),
        '/usr/local/dyalog'
    ];
    
    for (const dir of candidates) {
        const dyalogExe = path.join(dir, 'dyalog');
        const maplExe = path.join(dir, 'mapl');
        if (fs.existsSync(dyalogExe) || fs.existsSync(maplExe)) {
            console.log(`[Sandbox] Found Dyalog at: ${dir}`);
            return dir;
        }
    }
    
    console.warn('[Sandbox] Dyalog APL installation not found');
    return null;
}

/**
 * Check if Docker is available and running
 */
function checkDocker() {
    if (dockerAvailable !== null) return dockerAvailable;
    
    try {
        execSync('docker info', { stdio: 'ignore', timeout: 5000 });
        dockerAvailable = true;
        console.log('[Sandbox] Docker is available');
    } catch (e) {
        dockerAvailable = false;
        console.warn('[Sandbox] Docker not available, falling back to direct execution');
        console.warn('[Sandbox] To enable sandboxing, install and start Docker');
    }
    
    return dockerAvailable;
}

/**
 * Build a sandbox image if not already built
 */
async function ensureImage(language) {
    if (imagesBuilt[language]) return true;
    
    const imageName = CONFIG.images[language];
    const dockerfile = path.join(CONFIG.dockerDir, `Dockerfile.${language}`);
    
    // Check if image already exists
    try {
        execSync(`docker image inspect ${imageName}`, { stdio: 'ignore' });
        imagesBuilt[language] = true;
        console.log(`[Sandbox] Image ${imageName} already exists`);
        return true;
    } catch (e) {
        // Image doesn't exist, need to build
    }
    
    console.log(`[Sandbox] Building image ${imageName}...`);
    
    return new Promise((resolve, reject) => {
        const build = spawn('docker', [
            'build',
            '-t', imageName,
            '-f', dockerfile,
            CONFIG.dockerDir
        ], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let output = '';
        build.stdout.on('data', d => output += d.toString());
        build.stderr.on('data', d => output += d.toString());
        
        build.on('close', (code) => {
            if (code === 0) {
                imagesBuilt[language] = true;
                console.log(`[Sandbox] Successfully built ${imageName}`);
                resolve(true);
            } else {
                console.error(`[Sandbox] Failed to build ${imageName}:`);
                console.error(output);
                resolve(false);
            }
        });
        
        build.on('error', (err) => {
            console.error(`[Sandbox] Build error: ${err.message}`);
            resolve(false);
        });
    });
}

// End marker for detecting when output is complete
const END_MARKER = '___ARRAYBOX_END_' + Math.random().toString(36).slice(2) + '___';
const APL_ERROR_REGEX = /(VALUE|DOMAIN|RANK|LENGTH|SYNTAX|INDEX|NONCE|LIMIT|DEFN|STACK|FILE|SYSTEM|INTERRUPT) ERROR/;

function createAplMarkers() {
    const id = Math.random().toString(36).slice(2);
    return {
        start: `___ARRAYBOX_START_${id}___`,
        end: `___ARRAYBOX_END_${id}___`,
        reset: `___ARRAYBOX_RESET_${id}___`
    };
}
const APL_RESET_MARKER = '__RESET_DONE__';

function filterAplErrorOutput(stdout, stderr, code, markers = null) {
    const codeLines = new Set(code.split('\n').map(l => l.trim()).filter(l => l));
    let lines = `${stderr}\n${stdout}`.split('\n').filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('Dyalog APL')) return false;
        if (trimmed.startsWith('Serial number:')) return false;
        if (trimmed.startsWith('Copyright')) return false;
        if (trimmed.startsWith('+---')) return false;
        if (trimmed.startsWith('|')) return false;
        if (trimmed.startsWith('⎕←')) return false;
        if (trimmed.startsWith(']boxing')) return false;
        if (trimmed.startsWith('Was ')) return false;
        if (trimmed === 'clear ws') return false;
        if (trimmed === ')SIC') return false;
        if (trimmed === ')CLEAR') return false;
        if (trimmed === '') return false;
        if (markers && (trimmed === markers.start || trimmed === markers.end || trimmed === markers.reset)) return false;
        if (codeLines.has(trimmed)) return false;
        return true;
    });
    
    const lastErrorIndex = lines.reduce((idx, line, i) => (line.includes('ERROR') ? i : idx), -1);
    if (lastErrorIndex !== -1) {
        lines = lines.slice(lastErrorIndex);
    }
    
    return lines.join('\n').trim();
}

/**
 * Start a warm container for a language
 */
async function startWarmContainer(language, options = {}) {
    const imageName = CONFIG.images[language];
    
    // User IDs for different base images
    const uidMap = { j: 1000, apl: 1000, kap: 1001 };
    const uid = uidMap[language] || 1000;
    
    const dockerArgs = [
        'run',
        '--rm',
        '-i',
        '--init',
        '--read-only',
        '--tmpfs', '/tmp:rw,exec,nosuid,size=32m',
        '--network=none',
        `--memory=${CONFIG.memoryLimit}`,
        `--cpus=${CONFIG.cpuLimit}`,
        '--security-opt=no-new-privileges',
        '--pids-limit=64',
    ];
    
    if (language !== 'kap') {
        dockerArgs.push('--cap-drop=ALL');
    }
    
    if (language === 'apl') {
        const dyalogPath = options.dyalogPath || findDyalogPath();
        if (dyalogPath) {
            dockerArgs.push('-v', `${dyalogPath}:/opt/dyalog:ro`);
        }
        dockerArgs.push('--tmpfs', `/home/sandbox:rw,exec,uid=${uid},gid=${uid},size=16m`);
    }
    
    if (language === 'kap') {
        dockerArgs.push('--tmpfs', `/home/sandbox:rw,exec,uid=${uid},gid=${uid},size=16m`);
    }
    
    // Override entrypoint to keep container running with a shell-like interface
    if (language === 'j') {
        dockerArgs.push('--entrypoint', '/home/sandbox/j9.6/bin/jconsole');
    } else if (language === 'kap') {
        dockerArgs.push('--entrypoint', '/opt/kap/bin/kap-jvm-text');
        dockerArgs.push(imageName);
        dockerArgs.push('--tty', '--no-lineeditor');
    } else if (language === 'apl') {
        dockerArgs.push('--entrypoint', '/opt/dyalog/mapl');
    }
    
    if (language !== 'kap') {
        dockerArgs.push(imageName);
    }
    
    const container = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
        process: container,
        stdin: container.stdin,
        stdout: container.stdout,
        stderr: container.stderr,
        busy: false,
        requestCount: 0,
        lastUsed: Date.now(),
        language
    };
}

/**
 * Get or create a warm container for a language
 */
async function getWarmContainer(language, options = {}) {
    // Check if we have a valid warm container
    if (warmPool[language]) {
        const container = warmPool[language];
        const processExited = container.process && (container.process.exitCode !== null || container.process.signalCode !== null);
        // Check if container is still running
        if (container.process && !container.process.killed && !processExited) {
            // Check if we should recycle it
            if (container.requestCount >= CONFIG.maxRequestsPerContainer) {
                console.log(`[Sandbox] Recycling ${language} container after ${container.requestCount} requests`);
                container.process.kill();
                delete warmPool[language];
            } else if (!container.busy) {
                return container;
            }
        } else {
            delete warmPool[language];
        }
    }
    
    // Start a new warm container
    console.log(`[Sandbox] Starting warm container for ${language}...`);
    const container = await startWarmContainer(language, options);
    warmPool[language] = container;
    
    // Wait for container to be ready (read and discard initial output)
    await new Promise((resolve) => {
        let initStdout = '';
        let initStderr = '';
        let resolved = false;
        
        const finish = () => {
            if (resolved) return;
            resolved = true;
            container.stdout.removeListener('data', onStdout);
            container.stderr.removeListener('data', onStderr);
            resolve();
        };
        
        const checkReady = () => {
            if (resolved) return;
            // For APL, wait for the Copyright line in either stdout or stderr
            // Then wait a bit more to drain any remaining output
            if (language === 'apl' && (initStdout.includes('Copyright') || initStderr.includes('Copyright'))) {
                setTimeout(finish, 200);  // Extra delay to drain all banner output
            }
        };
        
        const onStdout = (data) => {
            initStdout += data.toString();
            checkReady();
        };
        const onStderr = (data) => {
            initStderr += data.toString();
            checkReady();
        };
        
        container.stdout.on('data', onStdout);
        container.stderr.on('data', onStderr);
        
        // Timeout
        setTimeout(() => {
            finish();
        }, language === 'kap' ? 8000 : 3000);  // Kap JVM needs more time
    });
    
    console.log(`[Sandbox] Warm container for ${language} ready`);
    
    // For APL, load Safe3.dyalog for secure execution
    if (language === 'apl') {
        await loadSafe3(container);
    }
    
    return container;
}

/**
 * Load Safe3.dyalog into APL container for secure execution
 * Safe3 provides application-level sandboxing via token whitelisting
 * This blocks ⍎ (execute), ⎕SH, ⎕CMD, ⎕NA and other dangerous operations
 */
async function loadSafe3(container) {
    return new Promise((resolve) => {
        let output = '';
        let resolved = false;
        const SAFE3_LOADED_MARKER = '___SAFE3_LOADED___';
        
        const onData = (data) => {
            output += data.toString();
            if (output.includes(SAFE3_LOADED_MARKER)) {
                if (!resolved) {
                    resolved = true;
                    container.stdout.removeListener('data', onData);
                    container.stderr.removeListener('data', onStderr);
                    console.log('[Sandbox] Safe3.dyalog loaded successfully');
                    resolve();
                }
            }
        };
        
        const onStderr = (data) => {
            output += data.toString();
            if (output.includes(SAFE3_LOADED_MARKER)) {
                if (!resolved) {
                    resolved = true;
                    container.stdout.removeListener('data', onData);
                    container.stderr.removeListener('data', onStderr);
                    console.log('[Sandbox] Safe3.dyalog loaded successfully');
                    resolve();
                }
            }
        };
        
        container.stdout.on('data', onData);
        container.stderr.on('data', onStderr);
        
        // Load Safe3.dyalog and configure timeout
        const timeoutSeconds = Math.floor(CONFIG.timeout / 1000);
        container.stdin.write(`⎕FIX 'file:///opt/Safe3.dyalog'\nSafe3.DefaultTimeout←${timeoutSeconds}\n⎕←'${SAFE3_LOADED_MARKER}'\n`);
        
        // Timeout fallback
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                container.stdout.removeListener('data', onData);
                container.stderr.removeListener('data', onStderr);
                console.warn('[Sandbox] Safe3.dyalog load timeout - continuing anyway');
                resolve();
            }
        }, 5000);
    });
}

/**
 * Execute code using warm container
 */
async function executeWithWarmContainer(language, code, options = {}) {
    const container = await getWarmContainer(language, options);
    if (container.process && (container.process.exitCode !== null || container.process.signalCode !== null)) {
        throw new Error('Warm container exited');
    }
    container.busy = true;
    container.requestCount++;
    container.lastUsed = Date.now();
    
    return new Promise((resolve, reject) => {
        let output = '';
        let stderrOutput = '';
        let timeoutId;
        
        const cleanup = () => {
            container.busy = false;
            container.stdout.removeListener('data', onData);
            container.stderr.removeListener('data', onStderr);
            if (timeoutId) clearTimeout(timeoutId);
            if (errorCheckTimeout) clearTimeout(errorCheckTimeout);
        };
        
        let resolved = false;
        let aplMarkers = null;
        let aplCodeLines = null;  // Lines to filter as echoed input (the wrapped code, not original)
        let aplSawStart = false;
        let resetDone = false;
        let errorCheckTimeout = null;
        
        let onData;
        let onStderr;
        
        const clearTimers = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (errorCheckTimeout) clearTimeout(errorCheckTimeout);
        };
        
        const finalizeReset = () => {
            if (resetDone) return;
            resetDone = true;
            cleanup();
        };
        
        const resolveAplError = () => {
            if (resolved) return;
            resolved = true;
            
            // Remove request listeners
            container.stdout.removeListener('data', onData);
            container.stderr.removeListener('data', onStderr);
            clearTimers();
            
            const errorOutput = filterAplErrorOutput(output, stderrOutput, code, aplMarkers);
            resolve({
                success: false,
                output: errorOutput || 'Execution error',
                warm: true
            });
            
            // Reset APL state - use a marker to know when cleanup is done
            let resetOutput = '';
            
            const onResetData = (data) => {
                const str = data.toString();
                resetOutput += str;
                if (resetOutput.includes(APL_RESET_MARKER)) {
                    container.stdout.removeListener('data', onResetData);
                    container.stderr.removeListener('data', onResetStderr);
                    container.busy = false;  // Now safe for next request
                }
            };
            const onResetStderr = (data) => {
                const str = data.toString();
                resetOutput += str; // Check stderr for marker too
                 if (resetOutput.includes(APL_RESET_MARKER)) {
                    container.stdout.removeListener('data', onResetData);
                    container.stderr.removeListener('data', onResetStderr);
                    container.busy = false;  // Now safe for next request
                }
            };
            
            container.stdout.on('data', onResetData);
            container.stderr.on('data', onResetStderr);
            
            // Exit suspension, clear workspace, print marker
            // Use expression to clear vars instead of )CLEAR command to avoid pipe issues
            // We must escape the reset marker to prevent it from being interpreted if inside a string
            // Use )SIC to clear state indicator completely - CRITICAL for error recovery
            const resetMarker = aplMarkers ? aplMarkers.reset : '___ARRAYBOX_RESET___';
            container.stdin.write(`\n)SIC\n⎕EX ⎕NL ¯1\n⎕←'${resetMarker}'\n`);
            
            // Fallback timeout in case marker never arrives
            setTimeout(() => {
                container.stdout.removeListener('data', onResetData);
                container.stderr.removeListener('data', onResetStderr);
                container.busy = false;
            }, 2000);
        };
        
        const checkAplMarkers = () => {
            if (language !== 'apl' || !aplMarkers) return;
            const combined = `${output}\n${stderrOutput}`;
            if (!aplSawStart && combined.includes(aplMarkers.start)) {
                aplSawStart = true;
            }
            if (aplSawStart && resolved && combined.includes(aplMarkers.reset)) {
                finalizeReset();
            }
        };
        
        const extractAplResult = () => {
            let section = output;
            const startIdx = section.indexOf(aplMarkers.start);
            if (startIdx !== -1) {
                section = section.slice(startIdx + aplMarkers.start.length);
            }
            const endIdx = section.indexOf(aplMarkers.end);
            if (endIdx !== -1) {
                section = section.slice(0, endIdx);
            }
            return section.trim();
        };
        
        onStderr = (data) => {
            stderrOutput += data.toString();
            checkAplMarkers();
            
            // For APL, if we detect an error, return quickly
            if (language === 'apl' && stderrOutput.includes('ERROR') && !errorCheckTimeout && !resolved) {
                // If we detect an error, we wait a brief moment to ensure we got the full error message
                errorCheckTimeout = setTimeout(() => {
                    resolveAplError();
                }, 100);
            }
        };
        
        onData = (data) => {
            output += data.toString();
            checkAplMarkers();
            
            if (language === 'apl' && APL_ERROR_REGEX.test(output) && !errorCheckTimeout && !resolved) {
                errorCheckTimeout = setTimeout(() => {
                    resolveAplError();
                }, 100);
            }
            
            // Check for end marker
            if (!resolved && language !== 'apl' && output.includes(END_MARKER)) {
                resolved = true;
                clearTimers();
                // Remove everything after (and including) the end marker
                let result = output.split(END_MARKER)[0].trim();
                
                // Include stderr (error messages) in the output, but filter out Dyalog banner
                if (stderrOutput.trim()) {
                    let errorLines = stderrOutput.split('\n').filter(line => {
                        const trimmed = line.trim();
                        // Filter out Dyalog APL banner lines
                        if (trimmed.startsWith('Dyalog APL')) return false;
                        if (trimmed.startsWith('Serial number:')) return false;
                        if (trimmed.startsWith('Copyright')) return false;
                        if (trimmed.startsWith('+---')) return false;
                        if (trimmed.startsWith('|')) return false;
                        if (trimmed.startsWith(']boxing')) return false;
                        if (trimmed.startsWith('Was ')) return false;
                        if (trimmed === 'clear ws') return false;
                        if (trimmed === ')CLEAR') return false;
                        if (trimmed === '') return false;
                        return true;
                    });
                    let errorOutput = errorLines.join('\n').trim();
                    if (errorOutput) {
                        result = result ? result + '\n' + errorOutput : errorOutput;
                    }
                }
                
                // Language-specific cleanup
                if (language === 'kap') {
                    let lines = result.split('\n');
                    // Remove empty prompts, end marker echo, and stray quotes
                    lines = lines.filter(line => {
                        const trimmed = line.trim();
                        if (trimmed === '⊢') return false;
                        if (trimmed.includes(END_MARKER)) return false;
                        if (trimmed === '"' || trimmed === '""') return false;  // Stray quotes from marker
                        return true;
                    });
                    // Remove ⊢ prefix from results
                    result = lines.map(line => line.startsWith('⊢ ') ? line.substring(2) : line).join('\n').trim();
                    // Remove trailing quote if present
                    if (result.endsWith('\n"')) {
                        result = result.slice(0, -2).trim();
                    }
                    
                    // Check for Kap errors
                    const isKapError = result.includes('Error at:') || 
                                      result.includes('Error:') ||
                                      stderrOutput.includes('Error');
                    if (isKapError) {
                        resolve({
                            success: false,
                            output: result || stderrOutput.trim(),
                            warm: true
                        });
                        cleanup();
                        return;
                    }
                } else if (language === 'apl') {
                    // Filter echoed input from the END (preserves result if it matches input)
                    let lines = result.split('\n');
                    // Use the wrapped code lines for filtering (not raw code, to avoid filtering results)
                    const codeLines = aplCodeLines || new Set(code.split('\n').map(l => l.trim()).filter(l => l));
                    
                    // First pass: filter indented lines and system responses
                    lines = lines.filter(line => {
                        const trimmed = line.trim();
                        if (line.startsWith(' ')) return false;  // Indented = echoed
                        if (trimmed === '') return false;
                        if (trimmed === 'clear ws') return false;
                        if (trimmed === ')SIC') return false;
                        return true;
                    });
                    
                    // Second pass: remove trailing lines that match user input (echoed)
                    while (lines.length > 0) {
                        const lastLine = lines[lines.length - 1].trim();
                        if (codeLines.has(lastLine)) {
                            lines.pop();
                        } else {
                            break;
                        }
                    }
                    
                    result = lines.join('\n').trim();
                } else if (language === 'j') {
                    // Remove NB. comments
                    result = result.replace(/\s*NB\..*$/gm, '').trim();
                    
                    // Remove echoed input lines
                    // J's jconsole echoes each input line with leading whitespace
                    const codeLines = new Set(code.split('\n').map(l => l.trim()).filter(l => l));
                    let lines = result.split('\n');
                    lines = lines.filter(line => {
                        const trimmed = line.trim();
                        if (trimmed === '') return false;
                        // J echoes input lines with leading spaces - remove them
                        if (codeLines.has(trimmed)) return false;
                        // Also remove the echo/clear commands we injected
                        if (trimmed.startsWith("echo '") || trimmed === "clear''") return false;
                        return true;
                    });
                    result = lines.join('\n').trim();
                    
                    // Check for J errors (format: |error type)
                    const J_ERROR_REGEX = /^\|(?:domain|syntax|value|index|rank|length|limit|control|stack|nonce|spelling|open|locative|interface|assertion|parse|locale) error/im;
                    if (J_ERROR_REGEX.test(result) || J_ERROR_REGEX.test(stderrOutput)) {
                        resolve({
                            success: false,
                            output: result || stderrOutput.trim(),
                            warm: true
                        });
                        cleanup();
                        return;
                    }
                }
                
                resolve({
                    success: true,
                    output: result,
                    warm: true
                });
                cleanup();
            } else if (!resolved && language === 'apl' && aplMarkers && aplSawStart) {
                const combined = `${output}\n${stderrOutput}`;
                if (combined.includes(aplMarkers.end)) {
                    resolved = true;
                    clearTimers();
                    let result = extractAplResult();
                    
                    // Include stderr (error messages) in the output, but filter out Dyalog banner
                    if (stderrOutput.trim()) {
                        let errorLines = stderrOutput.split('\n').filter(line => {
                            const trimmed = line.trim();
                            // Filter out Dyalog APL banner lines
                            if (trimmed.startsWith('Dyalog APL')) return false;
                            if (trimmed.startsWith('Serial number:')) return false;
                            if (trimmed.startsWith('Copyright')) return false;
                            if (trimmed.startsWith('+---')) return false;
                            if (trimmed.startsWith('|')) return false;
                            if (trimmed.startsWith(']boxing')) return false;
                            if (trimmed.startsWith('Was ')) return false;
                            if (trimmed === 'clear ws') return false;
                            if (trimmed === ')CLEAR') return false;
                            if (trimmed === '') return false;
                            if (trimmed === aplMarkers.start || trimmed === aplMarkers.end || trimmed === aplMarkers.reset) return false;
                            return true;
                        });
                        let errorOutput = errorLines.join('\n').trim();
                        if (errorOutput) {
                            result = result ? result + '\n' + errorOutput : errorOutput;
                        }
                    }
                    
                    // Filter echoed input from the END (preserves result if it matches input)
                    let lines = result.split('\n');
                    // Use the wrapped code lines for filtering (not raw code, to avoid filtering results)
                    const codeLines = aplCodeLines || new Set(code.split('\n').map(l => l.trim()).filter(l => l));
                    
                    // First pass: filter indented lines and system responses
                    lines = lines.filter(line => {
                        const trimmed = line.trim();
                        if (line.startsWith(' ')) return false;  // Indented = echoed
                        if (trimmed === '') return false;
                        if (trimmed === 'clear ws') return false;
                        if (trimmed === ')SIC') return false;
                        if (trimmed === aplMarkers.start || trimmed === aplMarkers.end || trimmed === aplMarkers.reset) return false;
                        return true;
                    });
                    
                    // Second pass: remove trailing lines that match user input (echoed)
                    while (lines.length > 0) {
                        const lastLine = lines[lines.length - 1].trim();
                        if (codeLines.has(lastLine)) {
                            lines.pop();
                        } else {
                            break;
                        }
                    }
                    
                    result = lines.join('\n').trim();
                    
                    resolve({
                        success: true,
                        output: result,
                        warm: true
                    });
                    
                    if (combined.includes(aplMarkers.reset)) {
                        finalizeReset();
                    }
                }
            }
        };
        
        container.stdout.on('data', onData);
        container.stderr.on('data', onStderr);
        
        // Build input with code, end marker, then state clearing
        // State is cleared after each request, ready for the next one
        let input;
        if (language === 'j') {
            // clear'' removes all user-defined names (run after to clear state)
            input = `${code}\necho '${END_MARKER}'\nclear''\n`;
        } else if (language === 'kap') {
            // Kap has no workspace clear command - state may persist
            // Container recycling every 500 requests provides isolation
            input = `${code}\n⊢"${END_MARKER}"\n`;
        } else if (language === 'apl') {
            aplMarkers = createAplMarkers();
            // Use Safe3.Exec for secure execution
            // Safe3 provides:
            // - Token whitelisting (blocks ⍎, ⎕SH, ⎕CMD, ⎕NA, etc.)
            // - Wrapped ⍎ that validates code before execution
            // - Execution in isolated namespace
            // - Timeout enforcement
            
            // Escape single quotes in user code for APL string
            // APL escapes quotes by doubling them: 'it''s' 
            const escapedCode = code.replace(/'/g, "''");
            
            // Store for filtering
            aplCodeLines = new Set([`Safe3.Exec`]);
            
            // Build Safe3.Exec call wrapped in :Trap to catch security errors
            // Without :Trap, ⎕SIGNAL from Safe3 would prevent end markers from printing
            input = `]boxing on -s=min\n)SIC\n⎕←'${aplMarkers.start}'\n:Trap 0 ⋄ ⎕←Safe3.Exec '${escapedCode}' ⋄ :Else ⋄ ⎕←⎕DMX.EM,': ',⎕DMX.Message ⋄ :EndTrap\n)SIC\n⎕←'${aplMarkers.end}'\n⎕←'${aplMarkers.reset}'\n`;
        }
        
        // Set timeout
        timeoutId = setTimeout(() => {
            if (resolved) return;
            resolved = true;
            cleanup();
            
            if (language === 'apl') {
                // APL timeouts are handled by returning stderr/partial output below.
            }
            
            // Filter Dyalog banner from stderr
            let filteredStderr = '';
            if (stderrOutput.trim()) {
                let errorLines = stderrOutput.split('\n').filter(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('Dyalog APL')) return false;
                    if (trimmed.startsWith('Serial number:')) return false;
                    if (trimmed.startsWith('Copyright')) return false;
                    if (trimmed.startsWith('+---')) return false;
                    if (trimmed.startsWith('|')) return false;
                    if (trimmed.startsWith('⎕←')) return false;
                    if (trimmed.startsWith(']boxing')) return false;
                    if (trimmed.startsWith('Was ')) return false;
                    if (trimmed === 'clear ws') return false;
                    if (trimmed === ')SIC') return false;
                    if (trimmed === ')CLEAR') return false;
                    if (trimmed === '') return false;
                    return true;
                });
                filteredStderr = errorLines.join('\n').trim();
            }
            
            // If we have stderr output (error messages), return that
            if (filteredStderr) {
                resolve({
                    success: false,
                    output: filteredStderr,
                    warm: true
                });
            } else {
                resolve({
                    success: false,
                    output: output.trim() || 'Execution timed out',
                    warm: true
                });
            }
        }, CONFIG.timeout);
        
        // Send code
        container.stdin.write(input);
    });
}

/**
 * Execute code in a sandboxed Docker container
 */
function executeInSandbox(language, code, options = {}) {
    return new Promise(async (resolve, reject) => {
        // Try warm container first if enabled
        if (CONFIG.useWarmContainers) {
            try {
                const result = await executeWithWarmContainer(language, code, options);
                return resolve(result);
            } catch (e) {
                console.log(`[Sandbox] Warm container failed, falling back to cold start: ${e.message}`);
                // Fall through to cold start
            }
        }
        // Check if sandbox is available
        if (!CONFIG.enabled || !checkDocker()) {
            // Fall back to returning an error - caller should use direct execution
            return reject(new Error('SANDBOX_UNAVAILABLE'));
        }
        
        // Ensure image is built
        const imageReady = await ensureImage(language);
        if (!imageReady) {
            return reject(new Error('SANDBOX_IMAGE_BUILD_FAILED'));
        }
        
        const imageName = CONFIG.images[language];
        const timeout = options.timeout || CONFIG.timeout;
        
        // User IDs for different base images (Debian=1000, Ubuntu=1001)
        const uidMap = { j: 1000, apl: 1000, kap: 1001 };
        const uid = uidMap[language] || 1000;
        
        // Build Docker run command with security restrictions
        const dockerArgs = [
            'run',
            '--rm',                              // Remove container after exit
            '-i',                                // Interactive (for stdin)
            '--init',                            // Use tini for faster signal handling
            '--read-only',                       // Read-only filesystem
            '--tmpfs', '/tmp:rw,exec,nosuid,size=32m',  // Temp space (exec needed for some runtimes)
            '--network=none',                    // No network access
            `--memory=${CONFIG.memoryLimit}`,    // Memory limit
            `--cpus=${CONFIG.cpuLimit}`,         // CPU limit
            '--security-opt=no-new-privileges',  // No privilege escalation
            '--pids-limit=64',                   // Limit number of processes (JVM needs threads)
        ];
        
        // Skip cap-drop for JVM-based languages (Kap) - it slows startup significantly
        if (language !== 'kap') {
            dockerArgs.push('--cap-drop=ALL');
        }
        
        // Language-specific options
        if (language === 'apl') {
            // Mount Dyalog from host - find the dyalog executable path
            const dyalogPath = options.dyalogPath || findDyalogPath();
            if (dyalogPath) {
                dockerArgs.push('-v', `${dyalogPath}:/opt/dyalog:ro`);
            } else {
                return reject(new Error('DYALOG_NOT_FOUND'));
            }
            // APL needs writable home directory for .dyalog config
            dockerArgs.push('--tmpfs', `/home/sandbox:rw,exec,uid=${uid},gid=${uid},size=16m`);
        }
        
        if (language === 'kap') {
            // Kap needs writable home directory for .kap config
            dockerArgs.push('--tmpfs', `/home/sandbox:rw,exec,uid=${uid},gid=${uid},size=16m`);
        }
        
        dockerArgs.push(imageName);
        
        // Start container
        const container = spawn('docker', dockerArgs, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let finished = false;
        
        container.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        container.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        // Set timeout
        const timeoutId = setTimeout(() => {
            if (!finished) {
                timedOut = true;
                container.kill('SIGKILL');
            }
        }, timeout);
        
        container.on('close', (exitCode) => {
            finished = true;
            clearTimeout(timeoutId);
            
            if (timedOut) {
                resolve({
                    success: false,
                    output: `Execution timed out (${timeout / 1000} seconds)`,
                    timedOut: true
                });
            } else {
                // Clean up output based on language
                let output = stdout.trim();
                const error = stderr.trim();
                
                // Language-specific output cleaning
                if (language === 'kap') {
                    // Kap prefixes results with "⊢ " - remove it
                    let lines = output.split('\n');
                    lines = lines.filter(line => line.trim() !== '⊢');
                    output = lines.map(line => {
                        if (line.startsWith('⊢ ')) {
                            return line.substring(2);
                        }
                        return line;
                    }).join('\n').trim();
                    
                    // Check for Kap errors
                    const isError = output.includes('Error at:') || output.includes('Error:');
                    resolve({
                        success: !isError,
                        output: output,
                        exitCode
                    });
                    return;
                }
                
                if (language === 'j') {
                    // Remove echoed input lines
                    // J's jconsole echoes each input line with leading whitespace
                    const codeLines = new Set(code.split('\n').map(l => l.trim()).filter(l => l));
                    let lines = output.split('\n');
                    lines = lines.filter(line => {
                        const trimmed = line.trim();
                        if (trimmed === '') return false;
                        // J echoes input lines with leading spaces - remove them
                        if (codeLines.has(trimmed)) return false;
                        // Also remove the exit command we injected
                        if (trimmed === 'exit 0') return false;
                        return true;
                    });
                    output = lines.join('\n').trim();
                }
                
                if (language === 'apl') {
                    // Remove Dyalog banner and clean up output
                    let lines = output.split('\n');
                    // Find where actual output starts (after Copyright line)
                    let startIdx = 0;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('Copyright (c) Dyalog')) {
                            startIdx = i + 1;
                            break;
                        }
                    }
                    lines = lines.slice(startIdx);
                    // Remove input echo and empty prompts
                    lines = lines.filter(line => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('⎕←')) return false;
                        if (trimmed.startsWith(']boxing')) return false;
                        if (trimmed.startsWith('Was ')) return false;
                        if (trimmed === '') return false;
                        return true;
                    });
                    output = lines.join('\n').trim();
                }
                
                if (error && !output) {
                    output = error;
                }
                
                resolve({
                    success: exitCode === 0 && !error.includes('Error'),
                    output: output || error,
                    exitCode
                });
            }
        });
        
        container.on('error', (err) => {
            finished = true;
            clearTimeout(timeoutId);
            reject(new Error(`Container error: ${err.message}`));
        });
        
        // Send code to container stdin
        let input = code;
        if (language === 'j') {
            input = `${code}\nexit 0\n`;
        } else if (language === 'apl') {
            // APL-specific preprocessing for mapl (batch mode)
            // Use Safe3.Exec for secure execution
            const escapedCode = code.replace(/'/g, "''");
            const timeoutSeconds = Math.floor(timeout / 1000);
            
            // Load Safe3, configure timeout, enable boxing, execute safely
            // Wrap in :Trap to catch security errors and still produce output
            input = `⎕FIX 'file:///opt/Safe3.dyalog'\nSafe3.DefaultTimeout←${timeoutSeconds}\n]boxing on -s=min\n:Trap 0 ⋄ ⎕←Safe3.Exec '${escapedCode}' ⋄ :Else ⋄ ⎕←⎕DMX.EM,': ',⎕DMX.Message ⋄ :EndTrap\n`;
        } else if (language === 'kap') {
            input = code + '\n';
        }
        
        container.stdin.write(input);
        container.stdin.end();
    });
}

/**
 * Check if sandbox is available for a language
 */
async function isSandboxAvailable(language) {
    if (!CONFIG.enabled || !checkDocker()) {
        return false;
    }
    return ensureImage(language);
}

/**
 * Enable or disable sandbox mode
 */
function setSandboxEnabled(enabled) {
    CONFIG.enabled = enabled;
    console.log(`[Sandbox] Sandbox mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get sandbox status
 */
function getStatus() {
    return {
        enabled: CONFIG.enabled,
        dockerAvailable: checkDocker(),
        imagesBuilt: { ...imagesBuilt },
        config: {
            memoryLimit: CONFIG.memoryLimit,
            cpuLimit: CONFIG.cpuLimit,
            timeout: CONFIG.timeout
        }
    };
}

/**
 * Cleanup warm containers
 */
function cleanupWarmContainers() {
    for (const [language, container] of Object.entries(warmPool)) {
        if (container.process && !container.process.killed) {
            console.log(`[Sandbox] Stopping warm container for ${language}`);
            container.process.kill();
        }
        delete warmPool[language];
    }
}

// Cleanup on process exit
process.on('exit', cleanupWarmContainers);
process.on('SIGINT', () => { cleanupWarmContainers(); process.exit(); });
process.on('SIGTERM', () => { cleanupWarmContainers(); process.exit(); });

// Periodically clean up idle containers (if timeout is set)
if (CONFIG.warmContainerIdleTimeout > 0) {
    setInterval(() => {
        const now = Date.now();
        for (const [language, container] of Object.entries(warmPool)) {
            if (!container.busy && (now - container.lastUsed) > CONFIG.warmContainerIdleTimeout) {
                console.log(`[Sandbox] Stopping idle warm container for ${language}`);
                if (container.process && !container.process.killed) {
                    container.process.kill();
                }
                delete warmPool[language];
            }
        }
    }, 60000);  // Check every minute
}

/**
 * Pre-warm all containers on startup
 */
async function prewarmContainers() {
    if (!CONFIG.prewarmOnStartup || !CONFIG.enabled) return;
    if (!checkDocker()) {
        console.log('[Sandbox] Docker not available, skipping pre-warm');
        return;
    }
    
    console.log('[Sandbox] Pre-warming containers...');
    const languages = ['j', 'apl', 'kap'];
    
    for (const lang of languages) {
        try {
            // Ensure image exists
            const imageReady = await ensureImage(lang);
            if (!imageReady) {
                console.log(`[Sandbox] Skipping ${lang} - image not available`);
                continue;
            }
            
            // Start warm container
            await getWarmContainer(lang);
            console.log(`[Sandbox] ${lang.toUpperCase()} container warmed`);
        } catch (e) {
            console.log(`[Sandbox] Failed to pre-warm ${lang}: ${e.message}`);
        }
    }
    
    console.log('[Sandbox] All containers pre-warmed and ready');
}

// Pre-warm containers when module is loaded (async)
setTimeout(() => {
    prewarmContainers().catch(e => console.error('[Sandbox] Pre-warm error:', e));
}, 1000);  // Small delay to let the server start first

module.exports = {
    executeInSandbox,
    isSandboxAvailable,
    setSandboxEnabled,
    getStatus,
    checkDocker,
    cleanupWarmContainers,
    prewarmContainers,
    CONFIG
};
