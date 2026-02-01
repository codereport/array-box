#!/usr/bin/env node
/**
 * Stats Tracking Module
 * Tracks and persists usage statistics for the Array Box dashboard
 */

const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join(__dirname, '..', 'storage', 'stats.json');

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
    
    // Time series data at multiple granularities
    timeSeries: {
        // 5-minute buckets for last 24 hours
        fiveMin: {
            visitors: [],      // [{timestamp, count}]
            evaluations: []    // [{timestamp, count}]
        },
        // Hourly buckets for last week
        hourly: {
            visitors: [],
            evaluations: []
        },
        // Daily buckets for all time
        daily: {
            visitors: [],
            evaluations: []
        }
    },
    
    // Session tracking (for unique visitors)
    sessions: {},  // sessionId -> lastSeen timestamp
    
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
                    fiveMin: { visitors: oldVisitors, evaluations: oldEvals },
                    hourly: { visitors: [], evaluations: [] },
                    daily: { visitors: [], evaluations: [] }
                };
            }
            
            // Ensure sessions exists
            if (!stats.sessions) {
                stats.sessions = {};
            }
            
            // Clean old sessions (older than 24 hours)
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            for (const [sessionId, lastSeen] of Object.entries(stats.sessions)) {
                if (lastSeen < cutoff) {
                    delete stats.sessions[sessionId];
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
    
    // Hourly data: keep last 7 days
    const hourlyCutoff = now - 7 * 24 * 60 * 60 * 1000;
    stats.timeSeries.hourly.visitors = stats.timeSeries.hourly.visitors.filter(
        point => point.timestamp > hourlyCutoff
    );
    stats.timeSeries.hourly.evaluations = stats.timeSeries.hourly.evaluations.filter(
        point => point.timestamp > hourlyCutoff
    );
    
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

// Record a visitor
function recordVisitor(sessionId) {
    if (!stats) loadStats();
    
    const isNew = !stats.sessions[sessionId];
    stats.sessions[sessionId] = Date.now();
    
    if (isNew) {
        stats.totalVisitors++;
        addToTimeSeries('visitors');
        saveStats();
        notifyListeners();
    }
    
    return isNew;
}

// Record an evaluation
function recordEvaluation(language, success) {
    if (!stats) loadStats();
    
    const lang = language.toLowerCase();
    if (!stats.languages[lang]) {
        stats.languages[lang] = { evaluations: 0, successes: 0, failures: 0 };
    }
    
    stats.totalEvaluations++;
    stats.languages[lang].evaluations++;
    
    if (success) {
        stats.languages[lang].successes++;
    } else {
        stats.languages[lang].failures++;
    }
    
    addToTimeSeries('evaluations');
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

// Get current stats (for dashboard)
function getStats() {
    if (!stats) loadStats();
    
    return {
        totalVisitors: stats.totalVisitors,
        totalEvaluations: stats.totalEvaluations,
        totalPermalinks: stats.totalPermalinks,
        languages: stats.languages,
        timeSeries: stats.timeSeries,
        activeVisitors: Object.keys(stats.sessions).length,
        lastUpdated: stats.lastUpdated
    };
}

// Get time series for a specific range
function getTimeSeriesForRange(range) {
    if (!stats) loadStats();
    
    const now = Date.now();
    let granularity, cutoff;
    
    switch (range) {
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
        evaluations: data.evaluations.filter(p => p.timestamp > cutoff)
    };
}

// Subscribe to stats updates
function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

// Initialize
loadStats();

// Auto-save every minute
setInterval(saveStats, 60 * 1000);

module.exports = {
    recordVisitor,
    recordEvaluation,
    recordPermalink,
    getStats,
    getTimeSeriesForRange,
    subscribe,
    loadStats
};
