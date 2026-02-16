#!/usr/bin/env node
/**
 * Stats Tracking Module
 * Tracks and persists usage statistics for the Array Box dashboard
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATS_FILE = path.join(__dirname, '..', 'storage', 'stats.json');

// Hash an IP address so we don't store raw IPs on disk
function hashIP(ip) {
    return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').substring(0, 16);
}

// Extract client IP from an HTTP request (handles proxies)
function getClientIP(req) {
    // X-Forwarded-For: client, proxy1, proxy2 — take the first (original client)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    // X-Real-IP (nginx)
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'].trim();
    }
    // CF-Connecting-IP (Cloudflare)
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'].trim();
    }
    // Direct connection
    return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

// Max recent evaluations to keep
const MAX_RECENT_EVALS = 50;

// Default stats structure
const defaultStats = {
    // Totals
    totalVisitors: 0,
    totalEvaluations: 0,
    totalPermalinks: 0,
    
    // Per-language stats
    languages: {
        bqn: { evaluations: 0, successes: 0, failures: 0 },
        apl: { evaluations: 0, successes: 0, failures: 0 },
        j: { evaluations: 0, successes: 0, failures: 0 },
        uiua: { evaluations: 0, successes: 0, failures: 0 },
        kap: { evaluations: 0, successes: 0, failures: 0 },
        tinyapl: { evaluations: 0, successes: 0, failures: 0 }
    },
    
    // Recent evaluations log (newest first)
    recentEvaluations: [],
    
    // Time series data at multiple granularities
    timeSeries: {
        // 5-minute buckets for last 24 hours
        fiveMin: {
            visitors: [],      // [{timestamp, count}]
            evaluations: [],   // [{timestamp, count}] - total
            evalsByLang: [],   // [{timestamp, bqn, apl, j, uiua, kap, tinyapl}]
            successesByLang: [] // [{timestamp, bqn, apl, j, uiua, kap, tinyapl}] - success counts
        },
        // Hourly buckets for last week
        hourly: {
            visitors: [],
            evaluations: [],
            evalsByLang: [],
            successesByLang: []
        },
        // Daily buckets for all time
        daily: {
            visitors: [],
            evaluations: [],
            evalsByLang: [],
            successesByLang: []
        }
    },
    
    // IP-based unique visitor tracking (persistent, never pruned)
    knownIPs: [],  // Array of IP address hashes seen all-time
    
    // Session tracking (for active visitors in last 24h)
    sessions: {},  // IP -> lastSeen timestamp
    
    // Last updated
    lastUpdated: null
};

// In-memory stats
let stats = null;

// Event listeners for real-time updates
const listeners = new Set();

// Load stats from file
function loadStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const data = fs.readFileSync(STATS_FILE, 'utf8');
            stats = JSON.parse(data);
            
            // Ensure all languages exist
            for (const lang of ['bqn', 'apl', 'j', 'uiua', 'kap', 'tinyapl']) {
                if (!stats.languages[lang]) {
                    stats.languages[lang] = { evaluations: 0, successes: 0, failures: 0 };
                }
            }
            
            // Ensure timeSeries exists with new structure
            if (!stats.timeSeries || !stats.timeSeries.fiveMin) {
                // Migrate old structure to new
                const oldVisitors = stats.timeSeries?.visitors || [];
                const oldEvals = stats.timeSeries?.evaluations || [];
                stats.timeSeries = {
                    fiveMin: { visitors: oldVisitors, evaluations: oldEvals, evalsByLang: [] },
                    hourly: { visitors: [], evaluations: [], evalsByLang: [] },
                    daily: { visitors: [], evaluations: [], evalsByLang: [] }
                };
            }
            
            // Ensure evalsByLang and successesByLang exist in all granularities
            for (const granularity of ['fiveMin', 'hourly', 'daily']) {
                if (!stats.timeSeries[granularity].evalsByLang) {
                    stats.timeSeries[granularity].evalsByLang = [];
                }
                if (!stats.timeSeries[granularity].successesByLang) {
                    stats.timeSeries[granularity].successesByLang = [];
                }
            }
            
            // Ensure recentEvaluations exists
            if (!stats.recentEvaluations) {
                stats.recentEvaluations = [];
            }
            
            // Ensure sessions exists
            if (!stats.sessions) {
                stats.sessions = {};
            }
            
            // Ensure knownIPs exists (migrate from old session-based tracking)
            if (!stats.knownIPs) {
                stats.knownIPs = [];
            }
            
            // Clean old sessions (older than 24 hours) — sessions are now IP-based for active tracking
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            for (const [key, lastSeen] of Object.entries(stats.sessions)) {
                if (lastSeen < cutoff) {
                    delete stats.sessions[key];
                }
            }
            
            // Clean old time series data (keep last 24 hours)
            cleanTimeSeries();
        } else {
            stats = JSON.parse(JSON.stringify(defaultStats));
        }
    } catch (e) {
        console.error('Error loading stats:', e.message);
        stats = JSON.parse(JSON.stringify(defaultStats));
    }
    return stats;
}

// Save stats to file
function saveStats() {
    try {
        stats.lastUpdated = new Date().toISOString();
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error('Error saving stats:', e.message);
    }
}

// Clean old time series data
function cleanTimeSeries() {
    const now = Date.now();
    
    // 5-minute data: keep last 24 hours
    const fiveMinCutoff = now - 24 * 60 * 60 * 1000;
    stats.timeSeries.fiveMin.visitors = stats.timeSeries.fiveMin.visitors.filter(
        point => point.timestamp > fiveMinCutoff
    );
    stats.timeSeries.fiveMin.evaluations = stats.timeSeries.fiveMin.evaluations.filter(
        point => point.timestamp > fiveMinCutoff
    );
    if (stats.timeSeries.fiveMin.evalsByLang) {
        stats.timeSeries.fiveMin.evalsByLang = stats.timeSeries.fiveMin.evalsByLang.filter(
            point => point.timestamp > fiveMinCutoff
        );
    }
    if (stats.timeSeries.fiveMin.successesByLang) {
        stats.timeSeries.fiveMin.successesByLang = stats.timeSeries.fiveMin.successesByLang.filter(
            point => point.timestamp > fiveMinCutoff
        );
    }
    
    // Hourly data: keep last 7 days
    const hourlyCutoff = now - 7 * 24 * 60 * 60 * 1000;
    stats.timeSeries.hourly.visitors = stats.timeSeries.hourly.visitors.filter(
        point => point.timestamp > hourlyCutoff
    );
    stats.timeSeries.hourly.evaluations = stats.timeSeries.hourly.evaluations.filter(
        point => point.timestamp > hourlyCutoff
    );
    if (stats.timeSeries.hourly.evalsByLang) {
        stats.timeSeries.hourly.evalsByLang = stats.timeSeries.hourly.evalsByLang.filter(
            point => point.timestamp > hourlyCutoff
        );
    }
    if (stats.timeSeries.hourly.successesByLang) {
        stats.timeSeries.hourly.successesByLang = stats.timeSeries.hourly.successesByLang.filter(
            point => point.timestamp > hourlyCutoff
        );
    }
    
    // Daily data: keep forever (all time)
}

// Get bucket timestamps for different granularities
function getBucketTimestamp(granularity) {
    const now = Date.now();
    switch (granularity) {
        case 'fiveMin':
            return now - (now % (5 * 60 * 1000));
        case 'hourly':
            return now - (now % (60 * 60 * 1000));
        case 'daily':
            return now - (now % (24 * 60 * 60 * 1000));
        default:
            return now;
    }
}

// Add to a specific time series bucket
function addToBucket(granularity, series, count = 1) {
    const bucket = getBucketTimestamp(granularity);
    const data = stats.timeSeries[granularity][series];
    const lastPoint = data.slice(-1)[0];
    
    if (lastPoint && lastPoint.timestamp === bucket) {
        lastPoint.count += count;
    } else {
        data.push({ timestamp: bucket, count });
    }
}

// Add to all time series granularities
function addToTimeSeries(series, count = 1) {
    addToBucket('fiveMin', series, count);
    addToBucket('hourly', series, count);
    addToBucket('daily', series, count);
    
    cleanTimeSeries();
}

// Add to per-language evaluation bucket
function addToLangBucket(granularity, lang, count = 1) {
    const bucket = getBucketTimestamp(granularity);
    const data = stats.timeSeries[granularity].evalsByLang;
    if (!data) return;
    
    const lastPoint = data.slice(-1)[0];
    
    if (lastPoint && lastPoint.timestamp === bucket) {
        lastPoint[lang] = (lastPoint[lang] || 0) + count;
    } else {
        const newPoint = { timestamp: bucket, bqn: 0, apl: 0, j: 0, uiua: 0, kap: 0, tinyapl: 0 };
        newPoint[lang] = count;
        data.push(newPoint);
    }
}

// Add to per-language success bucket
function addToSuccessBucket(granularity, lang, count = 1) {
    const bucket = getBucketTimestamp(granularity);
    const data = stats.timeSeries[granularity].successesByLang;
    if (!data) return;
    
    const lastPoint = data.slice(-1)[0];
    
    if (lastPoint && lastPoint.timestamp === bucket) {
        lastPoint[lang] = (lastPoint[lang] || 0) + count;
    } else {
        const newPoint = { timestamp: bucket, bqn: 0, apl: 0, j: 0, uiua: 0, kap: 0, tinyapl: 0 };
        newPoint[lang] = count;
        data.push(newPoint);
    }
}

// Add to all per-language time series granularities
function addToLangTimeSeries(lang, count = 1) {
    addToLangBucket('fiveMin', lang, count);
    addToLangBucket('hourly', lang, count);
    addToLangBucket('daily', lang, count);
}

// Add to all per-language success time series granularities
function addToSuccessTimeSeries(lang, count = 1) {
    addToSuccessBucket('fiveMin', lang, count);
    addToSuccessBucket('hourly', lang, count);
    addToSuccessBucket('daily', lang, count);
}

// Notify all listeners of stats update
function notifyListeners() {
    const data = getStats();
    for (const listener of listeners) {
        try {
            listener(data);
        } catch (e) {
            // Remove failed listeners
            listeners.delete(listener);
        }
    }
}

// Record a visitor by IP address
// - totalVisitors: incremented only for IPs never seen before (true unique count)
// - sessions: tracks recent IPs for the "Active (24h)" metric
// - Time series: records a data point whenever a new 24h session starts
function recordVisitor(ip) {
    if (!stats) loadStats();
    
    const ipHash = hashIP(ip);
    
    // Check if this is an all-time new unique visitor
    const isNewUnique = !stats.knownIPs.includes(ipHash);
    if (isNewUnique) {
        stats.knownIPs.push(ipHash);
        stats.totalVisitors++;
    }
    
    // Track for "Active (24h)" — session keyed by IP hash
    const isNewSession = !stats.sessions[ipHash];
    stats.sessions[ipHash] = Date.now();
    
    if (isNewSession) {
        addToTimeSeries('visitors');
    }
    
    if (isNewUnique || isNewSession) {
        saveStats();
        notifyListeners();
    }
    
    return isNewUnique;
}

// Record an evaluation
function recordEvaluation(language, success, code, duration) {
    if (!stats) loadStats();
    
    const lang = language.toLowerCase();
    if (!stats.languages[lang]) {
        stats.languages[lang] = { evaluations: 0, successes: 0, failures: 0 };
    }
    
    stats.totalEvaluations++;
    stats.languages[lang].evaluations++;
    
    if (success) {
        stats.languages[lang].successes++;
        addToSuccessTimeSeries(lang);
    } else {
        stats.languages[lang].failures++;
    }
    
    // Add to recent evaluations log
    stats.recentEvaluations.unshift({
        timestamp: Date.now(),
        language: lang,
        success: !!success,
        code: (code || '').substring(0, 200),  // Truncate long code
        duration: duration || null
    });
    if (stats.recentEvaluations.length > MAX_RECENT_EVALS) {
        stats.recentEvaluations = stats.recentEvaluations.slice(0, MAX_RECENT_EVALS);
    }
    
    addToTimeSeries('evaluations');
    addToLangTimeSeries(lang);
    hasUnsavedChanges = true;
    saveStats();
    notifyListeners();
}

// Record a permalink creation
function recordPermalink() {
    if (!stats) loadStats();
    
    stats.totalPermalinks++;
    saveStats();
    notifyListeners();
}

// Get current stats (for dashboard) - always reload from file to get fresh data
function getStats() {
    loadStats();  // Always reload to get latest data from other processes
    
    return {
        totalVisitors: stats.totalVisitors,
        totalEvaluations: stats.totalEvaluations,
        totalPermalinks: stats.totalPermalinks,
        languages: stats.languages,
        timeSeries: stats.timeSeries,
        activeVisitors: Object.keys(stats.sessions).length,
        recentEvaluations: (stats.recentEvaluations || []).slice(0, 20),
        lastUpdated: stats.lastUpdated
    };
}

// Get recent evaluations (for dashboard)
function getRecentEvaluations(count = 20) {
    if (!stats) loadStats();
    return (stats.recentEvaluations || []).slice(0, count);
}

// Get time series for a specific range - always reload from file to get fresh data
function getTimeSeriesForRange(range) {
    loadStats();  // Always reload to get latest data from other processes
    
    const now = Date.now();
    let granularity, cutoff;
    
    switch (range) {
        case '1h':
            granularity = 'fiveMin';
            cutoff = now - 60 * 60 * 1000;
            break;
        case '3h':
            granularity = 'fiveMin';
            cutoff = now - 3 * 60 * 60 * 1000;
            break;
        case '6h':
            granularity = 'fiveMin';
            cutoff = now - 6 * 60 * 60 * 1000;
            break;
        case '12h':
            granularity = 'fiveMin';
            cutoff = now - 12 * 60 * 60 * 1000;
            break;
        case '24h':
            granularity = 'fiveMin';
            cutoff = now - 24 * 60 * 60 * 1000;
            break;
        case '1w':
            granularity = 'hourly';
            cutoff = now - 7 * 24 * 60 * 60 * 1000;
            break;
        case '1m':
            granularity = 'daily';
            cutoff = now - 30 * 24 * 60 * 60 * 1000;
            break;
        case '1y':
            granularity = 'daily';
            cutoff = now - 365 * 24 * 60 * 60 * 1000;
            break;
        case 'all':
        default:
            granularity = 'daily';
            cutoff = 0;
            break;
    }
    
    const data = stats.timeSeries[granularity];
    return {
        visitors: data.visitors.filter(p => p.timestamp > cutoff),
        evaluations: data.evaluations.filter(p => p.timestamp > cutoff),
        evalsByLang: (data.evalsByLang || []).filter(p => p.timestamp > cutoff),
        successesByLang: (data.successesByLang || []).filter(p => p.timestamp > cutoff)
    };
}

// Subscribe to stats updates
function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

// Initialize
loadStats();

// Track if this instance has made changes (to avoid overwriting data from other processes)
let hasUnsavedChanges = false;

// Auto-save every 10 seconds, but only if this instance made changes
setInterval(() => {
    if (hasUnsavedChanges) {
        saveStats();
        hasUnsavedChanges = false;
    }
}, 10 * 1000);

module.exports = {
    recordVisitor,
    recordEvaluation,
    recordPermalink,
    getStats,
    getRecentEvaluations,
    getTimeSeriesForRange,
    subscribe,
    loadStats,
    getClientIP
};
