#!/usr/bin/env node
/**
 * Array Box Dashboard Server
 * Web-based real-time statistics dashboard
 * 
 * Usage: node dashboard-server.cjs [port] [bind-address]
 * Default: port 8085, bind to 0.0.0.0 (all interfaces)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const stats = require('./stats.cjs');

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 8085;
const BIND_ADDRESS = process.argv[3] || '0.0.0.0';

// SSE clients
const clients = new Set();

// Dashboard HTML
const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Array Box Dashboard</title>
    <style>
        :root {
            --bg-primary: #000000;
            --bg-secondary: #1a1b26;
            --bg-tertiary: #2a2e3f;
            --text-primary: #c0caf5;
            --text-secondary: #a9b1d6;
            --text-muted: #565f89;
            --accent-blue: #7aa2f7;
            --accent-green: #9ece6a;
            --accent-red: #f7768e;
            --accent-yellow: #e0af68;
            --accent-purple: #bb9af7;
            --accent-cyan: #7dcfff;
            --accent-orange: #ff9e64;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--bg-tertiary);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 5px;
            background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header .subtitle {
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        
        .connection-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-top: 10px;
        }
        
        .connection-status.connected {
            background: rgba(158, 206, 106, 0.2);
            color: var(--accent-green);
        }
        
        .connection-status.disconnected {
            background: rgba(247, 118, 142, 0.2);
            color: var(--accent-red);
        }
        
        .connection-status .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }
        
        .stat-card .value {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 5px;
            font-variant-numeric: tabular-nums;
        }
        
        .stat-card .label {
            color: var(--text-muted);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-card .value { color: var(--text-primary); }
        
        .section {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .section h2 {
            font-size: 1.2rem;
            margin-bottom: 20px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .languages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .language-card {
            background: var(--bg-primary);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .language-card .logo {
            width: 64px;
            height: 64px;
            flex-shrink: 0;
        }
        
        .language-card .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .language-card .info {
            flex: 1;
            text-align: center;
        }
        
        .language-card .name {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 1.1rem;
        }
        
        .language-card .name.bqn { color: #2b7067; }
        .language-card .name.apl { color: #3cb371; }
        .language-card .name.j { color: #2196f3; }
        .language-card .name.uiua { color: #e54ed0; }
        .language-card .name.kap { color: #ffffff; }
        .language-card .name.tinyapl { color: #94e044; }
        
        .language-card .count {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .language-card .success-rate {
            display: flex;
            justify-content: center;
            gap: 15px;
            font-size: 0.85rem;
        }
        
        .language-card .success {
            color: var(--accent-green);
        }
        
        .language-card .failure {
            color: var(--accent-red);
        }
        
        .chart-container {
            height: 450px;
            position: relative;
        }
        
        #activityChart {
            width: 100%;
            height: 100%;
        }
        
        .chart-legend {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px 20px;
            margin-top: 15px;
        }
        
        .chart-legend .item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .chart-legend .dot {
            width: 12px;
            height: 12px;
            border-radius: 3px;
        }
        
        .chart-legend .lang-bqn .dot { background: #2b7067; }
        .chart-legend .lang-apl .dot { background: #3cb371; }
        .chart-legend .lang-j .dot { background: #2196f3; }
        .chart-legend .lang-uiua .dot { background: #e54ed0; }
        .chart-legend .lang-kap .dot { background: #ffffff; }
        .chart-legend .lang-tinyapl .dot { background: #94e044; }
        
        .charts-row {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
        }
        
        @media (max-width: 900px) {
            .charts-row {
                grid-template-columns: 1fr;
            }
        }
        
        .pie-section {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .pie-container {
            position: relative;
            width: 200px;
            height: 200px;
        }
        
        #pieChart {
            width: 100%;
            height: 100%;
        }
        
        .pie-legend {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-top: 15px;
        }
        
        .pie-legend .item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .pie-legend .dot {
            width: 10px;
            height: 10px;
            border-radius: 2px;
        }
        
        .pie-legend .item.bqn .dot { background: #2b7067; }
        .pie-legend .item.apl .dot { background: #3cb371; }
        .pie-legend .item.j .dot { background: #2196f3; }
        .pie-legend .item.uiua .dot { background: #e54ed0; }
        .pie-legend .item.kap .dot { background: #ffffff; }
        .pie-legend .item.tinyapl .dot { background: #94e044; }
        
        .pie-center-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            pointer-events: none;
        }
        
        .pie-center-text .total {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--text-primary);
        }
        
        .pie-center-text .label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .section-header h2 {
            margin-bottom: 0;
        }
        
        .time-range-select {
            background: var(--bg-primary);
            color: var(--text-primary);
            border: 1px solid var(--bg-tertiary);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.9rem;
            cursor: pointer;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .time-range-select:hover {
            border-color: var(--accent-blue);
        }
        
        .time-range-select:focus {
            border-color: var(--accent-cyan);
        }
        
        .recent-activity {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .activity-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            border-bottom: 1px solid var(--bg-tertiary);
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-item .time {
            color: var(--text-muted);
            font-size: 0.8rem;
            min-width: 60px;
        }
        
        .activity-item .badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .activity-item .badge.bqn { background: rgba(158, 206, 106, 0.2); color: var(--accent-green); }
        .activity-item .badge.apl { background: rgba(187, 154, 247, 0.2); color: var(--accent-purple); }
        .activity-item .badge.j { background: rgba(125, 207, 255, 0.2); color: var(--accent-cyan); }
        .activity-item .badge.uiua { background: rgba(224, 175, 104, 0.2); color: var(--accent-yellow); }
        .activity-item .badge.kap { background: rgba(122, 162, 247, 0.2); color: var(--accent-blue); }
        .activity-item .badge.tinyapl { background: rgba(255, 158, 100, 0.2); color: var(--accent-orange); }
        
        .activity-item .status {
            margin-left: auto;
        }
        
        .activity-item .status.success { color: var(--accent-green); }
        .activity-item .status.failure { color: var(--accent-red); }
        
        .no-data {
            text-align: center;
            color: var(--text-muted);
            padding: 40px;
        }
        
        @media (max-width: 600px) {
            body { padding: 10px; }
            .header h1 { font-size: 1.8rem; }
            .stat-card .value { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Array Box Dashboard</h1>
        <p class="subtitle">Real-time usage statistics</p>
        <div id="connectionStatus" class="connection-status disconnected">
            <span class="dot"></span>
            <span class="text">Connecting...</span>
        </div>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card visitors">
            <div class="value" id="totalVisitors">0</div>
            <div class="label">Total Visitors</div>
        </div>
        <div class="stat-card evaluations">
            <div class="value" id="totalEvaluations">0</div>
            <div class="label">Code Evaluations</div>
        </div>
        <div class="stat-card permalinks">
            <div class="value" id="totalPermalinks">0</div>
            <div class="label">Shareable Links</div>
        </div>
        <div class="stat-card active">
            <div class="value" id="activeVisitors">0</div>
            <div class="label">Active (24h)</div>
        </div>
    </div>
    
    <div class="section">
        <div class="charts-row">
            <div class="activity-chart-section">
                <div class="section-header">
                    <h2>Activity</h2>
                    <select id="timeRange" class="time-range-select">
                        <option value="1h" selected>Last 1 Hour</option>
                        <option value="12h">Last 12 Hours</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="1w">Last Week</option>
                        <option value="1m">Last Month</option>
                        <option value="1y">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
                <div class="chart-container">
                    <canvas id="activityChart"></canvas>
                </div>
                <div class="chart-legend">
                    <div class="item lang-bqn">
                        <span class="dot"></span>
                        <span>BQN</span>
                    </div>
                    <div class="item lang-apl">
                        <span class="dot"></span>
                        <span>APL</span>
                    </div>
                    <div class="item lang-j">
                        <span class="dot"></span>
                        <span>J</span>
                    </div>
                    <div class="item lang-uiua">
                        <span class="dot"></span>
                        <span>Uiua</span>
                    </div>
                    <div class="item lang-kap">
                        <span class="dot"></span>
                        <span>Kap</span>
                    </div>
                    <div class="item lang-tinyapl">
                        <span class="dot"></span>
                        <span>TinyAPL</span>
                    </div>
                </div>
            </div>
            <div class="pie-section">
                <h2 style="margin-bottom: 15px; color: var(--text-secondary); font-size: 1.1rem;">By Language</h2>
                <div class="pie-container">
                    <canvas id="pieChart"></canvas>
                    <div class="pie-center-text">
                        <div class="total" id="pieTotal">0</div>
                        <div class="label">Total</div>
                    </div>
                </div>
                <div class="pie-legend" id="pieLegend">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Requests by Language</h2>
        <div class="languages-grid" id="languagesGrid">
            <!-- Populated by JS -->
        </div>
    </div>
    
    <script>
        // State
        let currentStats = null;
        let eventSource = null;
        let chartData = { visitors: [], evaluations: [], evalsByLang: [] };
        let currentTimeRange = '1h';
        
        // Format numbers with commas
        function formatNumber(n) {
            return n.toLocaleString();
        }
        
        // Fetch time series data for specific range
        async function fetchTimeSeriesForRange(range) {
            try {
                const response = await fetch('/timeseries?range=' + range);
                const data = await response.json();
                chartData = data;
                drawChart();
            } catch (e) {
                console.error('Error fetching time series:', e);
            }
        }
        
        // Update the dashboard with new stats
        function updateDashboard(data) {
            currentStats = data;
            
            // Update totals
            document.getElementById('totalVisitors').textContent = formatNumber(data.totalVisitors);
            document.getElementById('totalEvaluations').textContent = formatNumber(data.totalEvaluations);
            document.getElementById('totalPermalinks').textContent = formatNumber(data.totalPermalinks);
            document.getElementById('activeVisitors').textContent = formatNumber(data.activeVisitors);
            
            // Update languages
            const languagesGrid = document.getElementById('languagesGrid');
            const languages = ['bqn', 'apl', 'j', 'uiua', 'kap', 'tinyapl'];
            const langNames = { bqn: 'BQN', apl: 'APL', j: 'J', uiua: 'Uiua', kap: 'Kap', tinyapl: 'TinyAPL' };
            const langLogos = { 
                bqn: '/assets/bqn.svg', 
                apl: '/assets/apl.png', 
                j: '/assets/j_logo.png', 
                uiua: '/assets/uiua.png', 
                kap: '/assets/kap.png', 
                tinyapl: '/assets/tinyapl.svg' 
            };
            
            languagesGrid.innerHTML = languages.map(lang => {
                const langData = data.languages[lang] || { evaluations: 0, successes: 0, failures: 0 };
                return \`
                    <div class="language-card">
                        <div class="logo">
                            <img src="\${langLogos[lang]}" alt="\${langNames[lang]} logo">
                        </div>
                        <div class="info">
                            <div class="name \${lang}">\${langNames[lang]}</div>
                            <div class="count">\${formatNumber(langData.evaluations)}</div>
                            <div class="success-rate">
                                <span class="success">✓ \${formatNumber(langData.successes)}</span>
                                <span class="failure">✗ \${formatNumber(langData.failures)}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
            
            // Update chart data from the appropriate time series
            if (['1h', '12h', '24h'].includes(currentTimeRange) && data.timeSeries?.fiveMin) {
                chartData = data.timeSeries.fiveMin;
            }
            // For other ranges, we fetch separately to avoid sending too much data via SSE
            drawChart();
            drawPieChart(data.languages);
        }
        
        // Draw the pie chart
        function drawPieChart(languages) {
            const canvas = document.getElementById('pieChart');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size for retina displays
            const dpr = window.devicePixelRatio || 1;
            const size = 200;
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            canvas.style.width = size + 'px';
            canvas.style.height = size + 'px';
            ctx.scale(dpr, dpr);
            
            const centerX = size / 2;
            const centerY = size / 2;
            const outerRadius = 90;
            const innerRadius = 55; // Donut hole
            
            // Language colors (from logos)
            const colors = {
                bqn: '#2b7067',
                apl: '#3cb371',
                j: '#2196f3',
                uiua: '#e54ed0',
                kap: '#ffffff',
                tinyapl: '#94e044'
            };
            
            const langNames = { bqn: 'BQN', apl: 'APL', j: 'J', uiua: 'Uiua', kap: 'Kap', tinyapl: 'TinyAPL' };
            const langOrder = ['bqn', 'apl', 'j', 'uiua', 'kap', 'tinyapl'];
            
            // Calculate total and prepare data
            let total = 0;
            const data = [];
            for (const lang of langOrder) {
                const count = languages[lang]?.evaluations || 0;
                total += count;
                if (count > 0) {
                    data.push({ lang, count, color: colors[lang] });
                }
            }
            
            // Update center text
            document.getElementById('pieTotal').textContent = formatNumber(total);
            
            // Clear
            ctx.clearRect(0, 0, size, size);
            
            if (total === 0) {
                // Draw empty state
                ctx.beginPath();
                ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
                ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
                ctx.fillStyle = '#2a2e3f';
                ctx.fill();
                
                // Update legend
                document.getElementById('pieLegend').innerHTML = '<span style="color: var(--text-muted);">No data yet</span>';
                return;
            }
            
            // Draw pie slices
            let startAngle = -Math.PI / 2; // Start at top
            
            for (const item of data) {
                const sliceAngle = (item.count / total) * Math.PI * 2;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = item.color;
                ctx.fill();
                
                startAngle += sliceAngle;
            }
            
            // Draw inner circle (donut hole)
            ctx.beginPath();
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1b26';
            ctx.fill();
            
            // Update legend
            const legendHTML = data.map(item => {
                const pct = ((item.count / total) * 100).toFixed(1);
                return \`
                    <div class="item \${item.lang}">
                        <span class="dot"></span>
                        <span>\${langNames[item.lang]} (\${pct}%)</span>
                    </div>
                \`;
            }).join('');
            document.getElementById('pieLegend').innerHTML = legendHTML;
        }
        
        // Get bucket size and time range based on selection
        function getTimeRangeConfig(range) {
            const now = Date.now();
            switch (range) {
                case '1h':
                    return { start: now - 60 * 60 * 1000, bucketSize: 60 * 1000, format: 'minute' };
                case '12h':
                    return { start: now - 12 * 60 * 60 * 1000, bucketSize: 30 * 60 * 1000, format: 'hour' };
                case '24h':
                    return { start: now - 24 * 60 * 60 * 1000, bucketSize: 60 * 60 * 1000, format: 'hour' };
                case '1w':
                    return { start: now - 7 * 24 * 60 * 60 * 1000, bucketSize: 6 * 60 * 60 * 1000, format: 'day' };
                case '1m':
                    return { start: now - 30 * 24 * 60 * 60 * 1000, bucketSize: 24 * 60 * 60 * 1000, format: 'date' };
                case '1y':
                    return { start: now - 365 * 24 * 60 * 60 * 1000, bucketSize: 7 * 24 * 60 * 60 * 1000, format: 'month' };
                case 'all':
                default:
                    // For all time, find the earliest data point
                    let earliest = now;
                    for (const point of chartData.visitors || []) {
                        if (point.timestamp < earliest) earliest = point.timestamp;
                    }
                    for (const point of chartData.evaluations || []) {
                        if (point.timestamp < earliest) earliest = point.timestamp;
                    }
                    const span = now - earliest;
                    const bucketSize = Math.max(24 * 60 * 60 * 1000, span / 50); // At least daily, max 50 buckets
                    return { start: earliest, bucketSize, format: 'date' };
            }
        }
        
        // Format time label based on format type
        function formatTimeLabel(timestamp, format) {
            const date = new Date(timestamp);
            switch (format) {
                case 'minute':
                    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
                case 'hour':
                    return date.getHours().toString().padStart(2, '0') + ':00';
                case 'day':
                    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                case 'date':
                    return (date.getMonth() + 1) + '/' + date.getDate();
                case 'month':
                    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                default:
                    return date.toLocaleDateString();
            }
        }
        
        // Language colors for chart (from logos)
        const langColors = {
            bqn: '#2b7067',
            apl: '#3cb371',
            j: '#2196f3',
            uiua: '#e54ed0',
            kap: '#ffffff',
            tinyapl: '#94e044'
        };
        const langOrder = ['bqn', 'apl', 'j', 'uiua', 'kap', 'tinyapl'];
        
        // Draw the activity chart
        function drawChart() {
            const canvas = document.getElementById('activityChart');
            const ctx = canvas.getContext('2d');
            const rect = canvas.parentElement.getBoundingClientRect();
            
            // Set canvas size for retina displays
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.scale(dpr, dpr);
            
            const width = rect.width;
            const height = rect.height;
            const padding = { top: 20, right: 20, bottom: 30, left: 50 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            
            // Clear
            ctx.clearRect(0, 0, width, height);
            
            // Get time range config
            const config = getTimeRangeConfig(currentTimeRange);
            const { start, bucketSize, format } = config;
            const now = Date.now();
            
            // Aggregate data into buckets
            const buckets = {};
            for (let t = start; t <= now; t += bucketSize) {
                const bucket = Math.floor(t / bucketSize) * bucketSize;
                buckets[bucket] = { 
                    bqn: 0, apl: 0, j: 0, uiua: 0, kap: 0, tinyapl: 0 
                };
            }
            
            // Fill in per-language evaluation data
            for (const point of chartData.evalsByLang || []) {
                const bucket = Math.floor(point.timestamp / bucketSize) * bucketSize;
                if (buckets[bucket]) {
                    for (const lang of langOrder) {
                        buckets[bucket][lang] += point[lang] || 0;
                    }
                }
            }
            
            const times = Object.keys(buckets).map(Number).sort((a, b) => a - b);
            
            // Calculate stacked totals for max value
            const stackedTotals = times.map(t => {
                let total = 0;
                for (const lang of langOrder) {
                    total += buckets[t][lang];
                }
                return total;
            });
            
            const maxValue = Math.max(1, ...stackedTotals);
            
            // Draw grid
            ctx.strokeStyle = '#2a2e3f';
            ctx.lineWidth = 1;
            
            // Horizontal grid lines
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
                
                // Y-axis labels
                const value = Math.round(maxValue * (1 - i / 4));
                ctx.fillStyle = '#565f89';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(value.toString(), padding.left - 8, y + 4);
            }
            
            // X-axis labels
            ctx.textAlign = 'center';
            const labelInterval = Math.max(1, Math.ceil(times.length / 6));
            for (let i = 0; i < times.length; i += labelInterval) {
                const x = padding.left + (i / (times.length - 1 || 1)) * chartWidth;
                const label = formatTimeLabel(times[i], format);
                ctx.fillText(label, x, height - 8);
            }
            
            // Draw stacked area chart for evaluations (bottom to top)
            function drawStackedArea() {
                if (times.length < 2) return;
                
                // Calculate cumulative values for stacking
                const cumulative = times.map(() => 0);
                
                for (const lang of langOrder) {
                    const values = times.map((t, i) => {
                        const prev = cumulative[i];
                        cumulative[i] += buckets[t][lang];
                        return { bottom: prev, top: cumulative[i] };
                    });
                    
                    // Draw area for this language
                    ctx.beginPath();
                    
                    // Top edge (left to right)
                    for (let i = 0; i < values.length; i++) {
                        const x = padding.left + (i / (values.length - 1)) * chartWidth;
                        const y = padding.top + chartHeight - (values[i].top / maxValue) * chartHeight;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    
                    // Bottom edge (right to left)
                    for (let i = values.length - 1; i >= 0; i--) {
                        const x = padding.left + (i / (values.length - 1)) * chartWidth;
                        const y = padding.top + chartHeight - (values[i].bottom / maxValue) * chartHeight;
                        ctx.lineTo(x, y);
                    }
                    
                    ctx.closePath();
                    ctx.fillStyle = langColors[lang];
                    ctx.globalAlpha = lang === 'kap' ? 1 : 0.7;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }
            
            drawStackedArea();
        }
        
        // Connect to SSE stream
        function connect() {
            if (eventSource) {
                eventSource.close();
            }
            
            eventSource = new EventSource('/events');
            
            eventSource.onopen = () => {
                const status = document.getElementById('connectionStatus');
                status.className = 'connection-status connected';
                status.querySelector('.text').textContent = 'Live';
            };
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    updateDashboard(data);
                } catch (e) {
                    console.error('Error parsing SSE data:', e);
                }
            };
            
            eventSource.onerror = () => {
                const status = document.getElementById('connectionStatus');
                status.className = 'connection-status disconnected';
                status.querySelector('.text').textContent = 'Reconnecting...';
                
                // Reconnect after 3 seconds
                setTimeout(connect, 3000);
            };
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (currentStats) {
                drawChart();
                drawPieChart(currentStats.languages);
            }
        });
        
        // Handle time range selection
        document.getElementById('timeRange').addEventListener('change', (e) => {
            currentTimeRange = e.target.value;
            if (['1h', '12h', '24h'].includes(currentTimeRange) && currentStats?.timeSeries?.fiveMin) {
                // Use data already in memory for short ranges
                chartData = currentStats.timeSeries.fiveMin;
                drawChart();
            } else {
                // Fetch data for other ranges
                fetchTimeSeriesForRange(currentTimeRange);
            }
        });
        
        // Start
        connect();
        
        // Also fetch initial data via regular HTTP
        fetch('/stats')
            .then(res => res.json())
            .then(updateDashboard)
            .catch(console.error);
        
        // Poll every 10 seconds for more responsive updates
        setInterval(() => {
            fetch('/stats')
                .then(res => res.json())
                .then(updateDashboard)
                .catch(console.error);
        }, 10000);
    </script>
</body>
</html>`;

// Server
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

    // Dashboard page
    if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboardHTML);
        return;
    }
    
    // Serve assets (logos)
    if (req.method === 'GET' && req.url.startsWith('/assets/')) {
        const filename = req.url.slice('/assets/'.length);
        // Prevent path traversal
        if (filename.includes('..') || filename.includes('/')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        const assetsDir = path.join(__dirname, '..', 'assets');
        const filePath = path.join(assetsDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        
        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    // Stats API
    if (req.method === 'GET' && req.url === '/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats.getStats()));
        return;
    }
    
    // Time series API for specific range
    if (req.method === 'GET' && req.url.startsWith('/timeseries')) {
        const url = new URL(req.url, 'http://localhost');
        const range = url.searchParams.get('range') || '24h';
        const data = stats.getTimeSeriesForRange(range);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
    }

    // SSE stream for real-time updates
    if (req.method === 'GET' && req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send initial data
        res.write(`data: ${JSON.stringify(stats.getStats())}\n\n`);

        // Subscribe to updates
        const unsubscribe = stats.subscribe((data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        });

        // Keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
            res.write(': keepalive\n\n');
        }, 30000);

        // Clean up on close
        req.on('close', () => {
            unsubscribe();
            clearInterval(keepAlive);
            clients.delete(res);
        });

        clients.add(res);
        return;
    }

    // Record visitor (called from frontend)
    if (req.method === 'POST' && req.url === '/visitor') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const isNew = stats.recordVisitor(data.sessionId || generateSessionId());
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, isNew }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    // Record evaluation (called from server-manager proxy)
    if (req.method === 'POST' && req.url === '/eval') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                stats.recordEvaluation(data.language, data.success);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }

    // Record permalink
    if (req.method === 'POST' && req.url === '/permalink') {
        stats.recordPermalink();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    // 404
    res.writeHead(404);
    res.end('Not found');
});

function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

server.listen(PORT, BIND_ADDRESS, () => {
    console.log(`Dashboard server running on http://${BIND_ADDRESS}:${PORT}`);
    if (BIND_ADDRESS === '0.0.0.0') {
        // Show local IP for convenience
        const os = require('os');
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`  Local network: http://${iface.address}:${PORT}`);
                }
            }
        }
    }
});

module.exports = { server, stats };
