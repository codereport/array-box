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
    <title>⬢ ArrayBox Dashboard</title>
    <style>
        @font-face { font-family: 'BQN'; src: url('/fonts/BQN386.ttf') format('truetype'); }
        @font-face { font-family: 'APL'; src: url('/fonts/APL387.ttf') format('truetype'); }
        @font-face { font-family: 'J'; src: url('/fonts/Apl385.ttf') format('truetype'); }
        @font-face { font-family: 'Uiua'; src: url('/fonts/Uiua386.ttf') format('truetype'); }
        @font-face { font-family: 'Kap'; src: url('/fonts/APL387.ttf') format('truetype'); }
        @font-face { font-family: 'TinyAPL'; src: url('/fonts/APL387.ttf') format('truetype'); }
        
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
            margin: 0;
            padding: 0;
        }
        
        .dashboard-layout {
            display: flex;
            min-height: 100vh;
        }
        
        .dashboard-main {
            flex: 1;
            min-width: 0;
            padding: 20px;
            transition: flex 0.25s ease;
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
        
        .status-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        
        .connection-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
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
        
        .server-indicators {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .server-indicator {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            background: rgba(86, 95, 137, 0.2);
            color: var(--text-muted);
            transition: all 0.3s ease;
        }
        
        .server-indicator.up {
            background: rgba(158, 206, 106, 0.15);
            color: var(--accent-green);
        }
        
        .server-indicator.down {
            background: rgba(247, 118, 142, 0.15);
            color: var(--accent-red);
        }
        
        .server-indicator .srv-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
        }
        
        .server-indicator.up .srv-dot {
            animation: pulse 3s infinite;
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
            min-width: 0;
            overflow: hidden;
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
            font-size: 0.9rem;
            font-weight: 600;
        }
        
        .language-card .success {
            color: #4ade80;  /* Soft green */
            text-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
        }
        
        .language-card .failure {
            color: #ff4444;  /* Bright red */
            text-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
        }
        
        .language-card .percentage {
            font-size: 1.8rem;
            font-weight: bold;
            color: #2b7067;  /* BQN green for 95%+ */
            text-shadow: 0 0 10px rgba(43, 112, 103, 0.4);
            min-width: 70px;
            text-align: right;
        }
        
        .language-card .percentage.tier-90 {
            color: #3cb371;  /* APL green for 90-94% */
            text-shadow: 0 0 10px rgba(60, 179, 113, 0.4);
        }
        
        .language-card .percentage.tier-80 {
            color: #94e044;  /* TinyAPL green for 80-89% */
            text-shadow: 0 0 10px rgba(148, 224, 68, 0.4);
        }
        
        .language-card .percentage.low {
            color: #ffaa00;  /* Orange for 50-79% */
            text-shadow: 0 0 10px rgba(255, 170, 0, 0.4);
        }
        
        .language-card .percentage.critical {
            color: #ff4444;  /* Red for <50% */
            text-shadow: 0 0 10px rgba(255, 68, 68, 0.4);
        }
        
        .chart-container {
            height: 450px;
            position: relative;
            overflow: hidden;
        }
        
        #activityChart {
            width: 100%;
            height: 100%;
            display: block;
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
            min-width: 0;
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

        .chart-controls {
            display: inline-flex;
            gap: 10px;
            align-items: center;
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
        
        /* Evals panel (inline, pushes content) */
        .eval-panel {
            width: 0;
            overflow: hidden;
            background: var(--bg-secondary);
            border-left: 1px solid var(--bg-tertiary);
            transition: width 0.25s ease;
            flex-shrink: 0;
        }
        
        .eval-panel.visible {
            width: 600px;
        }
        
        .eval-panel-inner {
            width: 600px;
            padding: 20px;
            overflow-y: auto;
            height: 100vh;
            position: sticky;
            top: 0;
            box-sizing: border-box;
        }
        
        .eval-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--bg-tertiary);
        }
        
        .eval-panel-header h2 {
            font-size: 1.2rem;
            color: var(--text-primary);
        }
        
        
        .eval-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .eval-table th {
            text-align: left;
            padding: 10px 12px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--bg-tertiary);
        }
        
        .eval-table td {
            padding: 10px 12px;
            border-bottom: 1px solid rgba(42, 46, 63, 0.5);
            font-size: 0.9rem;
            vertical-align: top;
        }
        
        .eval-table tr:hover td {
            background: rgba(42, 46, 63, 0.3);
        }
        
        .eval-table .eval-status {
            white-space: nowrap;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .eval-table .eval-status .icon { margin-right: 4px; }
        .eval-table .eval-status .icon.success { color: var(--accent-green); }
        .eval-table .eval-status .icon.failure { color: var(--accent-red); }
        
        .eval-table .eval-status .dur { font-size: 0.8rem; }
        .eval-table .eval-status .dur.bqn { color: #2b7067; }
        .eval-table .eval-status .dur.apl { color: #3cb371; }
        .eval-table .eval-status .dur.j { color: #2196f3; }
        .eval-table .eval-status .dur.uiua { color: #e54ed0; }
        .eval-table .eval-status .dur.kap { color: #ffffff; }
        .eval-table .eval-status .dur.tinyapl { color: #94e044; }
        
        .eval-table .eval-code {
            font-family: monospace;
            font-size: 1.6rem;
            color: var(--text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .eval-table .eval-code.lang-bqn { font-family: 'BQN', monospace; }
        .eval-table .eval-code.lang-apl { font-family: 'APL', monospace; }
        .eval-table .eval-code.lang-j { font-family: 'J', monospace; }
        .eval-table .eval-code.lang-uiua { font-family: 'Uiua', monospace; }
        .eval-table .eval-code.lang-kap { font-family: 'Kap', monospace; }
        .eval-table .eval-code.lang-tinyapl { font-family: 'TinyAPL', monospace; }
        
        .eval-table .eval-time {
            color: var(--text-muted);
            font-size: 0.8rem;
            white-space: nowrap;
        }
        
        .eval-no-data {
            text-align: center;
            color: var(--text-muted);
            padding: 60px 20px;
            font-size: 1rem;
        }
        
        
        @media (max-width: 600px) {
            .dashboard-main { padding: 10px; }
            .header h1 { font-size: 1.8rem; }
            .stat-card .value { font-size: 2rem; }
            .status-bar { gap: 8px; }
            .server-indicator { padding: 3px 7px; font-size: 0.7rem; }
            .eval-panel.visible { width: 90vw; }
            .eval-panel-inner { width: 90vw; }
        }
    </style>
</head>
<body>
    <div class="dashboard-layout">
    <div class="dashboard-main">
    <div class="header">
        <h1>⬢ ArrayBox Dashboard</h1>
        <p class="subtitle">Real-time usage statistics</p>
        <div class="status-bar">
            <div id="connectionStatus" class="connection-status disconnected">
                <span class="dot"></span>
                <span class="text">Connecting...</span>
            </div>
            <div class="server-indicators" id="serverIndicators">
                <div class="server-indicator" id="srv-apl" title="APL Server (port 8081)">
                    <span class="srv-dot"></span>
                    <span>APL</span>
                </div>
                <div class="server-indicator" id="srv-permalink" title="Permalink Server (port 8084)">
                    <span class="srv-dot"></span>
                    <span>Link</span>
                </div>
            </div>
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
                    <div class="chart-controls">
                        <select id="timeRange" class="time-range-select">
                            <option value="1h" selected>Last 1 Hour</option>
                            <option value="3h">Last 3 Hours</option>
                            <option value="6h">Last 6 Hours</option>
                            <option value="12h">Last 12 Hours</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="1w">Last Week</option>
                            <option value="1m">Last Month</option>
                            <option value="1y">Last Year</option>
                            <option value="all">All Time</option>
                        </select>
                        <select id="viewMode" class="time-range-select">
                            <option value="interval" selected>Per Interval</option>
                            <option value="cumulative">Cumulative</option>
                        </select>
                    </div>
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
                    <div class="item lang-tinyapl">
                        <span class="dot"></span>
                        <span>TinyAPL</span>
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
        <h2 id="languagesTitle">Requests by Language</h2>
        <div class="languages-grid" id="languagesGrid">
            <!-- Populated by JS -->
        </div>
    </div>
    
    </div><!-- end dashboard-main -->
    
    <!-- Evals panel -->
    <div class="eval-panel" id="evalPanel">
        <div class="eval-panel-inner">
            <div class="eval-panel-header">
                <h2>Evals</h2>
            </div>
            <div id="evalTableContainer">
                <div class="eval-no-data">No evaluations recorded yet.</div>
            </div>
        </div>
    </div>
    
    </div><!-- end dashboard-layout -->
    
    <script>
        // State
        let currentStats = null;
        let eventSource = null;
        let chartData = { visitors: [], evaluations: [], evalsByLang: [], successesByLang: [] };
        let currentTimeRange = '1h';
        let currentViewMode = 'interval';
        let evalPanelVisible = false;
        let evals = [];
        
        // Format numbers with commas
        function formatNumber(n) {
            return n.toLocaleString();
        }
        
        // Get time cutoff for current time range
        function getTimeCutoff(range) {
            const now = Date.now();
            switch (range) {
                case '1h': return now - 60 * 60 * 1000;
                case '3h': return now - 3 * 60 * 60 * 1000;
                case '6h': return now - 6 * 60 * 60 * 1000;
                case '12h': return now - 12 * 60 * 60 * 1000;
                case '24h': return now - 24 * 60 * 60 * 1000;
                case '1w': return now - 7 * 24 * 60 * 60 * 1000;
                case '1m': return now - 30 * 24 * 60 * 60 * 1000;
                case '1y': return now - 365 * 24 * 60 * 60 * 1000;
                case 'all': return 0;
                default: return 0;
            }
        }
        
        // Aggregate time series data by language for current time window
        function aggregateByLanguage(evalsByLang, successesByLang, cutoff) {
            const langOrder = ['bqn', 'apl', 'tinyapl', 'j', 'uiua', 'kap'];
            const result = {};
            
            for (const lang of langOrder) {
                result[lang] = { evaluations: 0, successes: 0, failures: 0 };
            }
            
            // Sum up evaluations (filtered by cutoff)
            for (const point of evalsByLang || []) {
                if (point.timestamp >= cutoff) {
                    for (const lang of langOrder) {
                        result[lang].evaluations += point[lang] || 0;
                    }
                }
            }
            
            // Sum up successes (filtered by cutoff)
            let hasSuccessData = false;
            for (const point of successesByLang || []) {
                if (point.timestamp >= cutoff) {
                    hasSuccessData = true;
                    for (const lang of langOrder) {
                        result[lang].successes += point[lang] || 0;
                    }
                }
            }
            
            // If no success data in time series, estimate from all-time success rates
            if (!hasSuccessData && currentStats) {
                for (const lang of langOrder) {
                    const allTime = currentStats.languages[lang] || {};
                    const allTimeTotal = allTime.evaluations || 0;
                    const allTimeSuccesses = allTime.successes || 0;
                    const successRate = allTimeTotal > 0 ? allTimeSuccesses / allTimeTotal : 0;
                    // Estimate successes based on all-time success rate
                    result[lang].successes = Math.round(result[lang].evaluations * successRate);
                }
            }
            
            // Calculate failures
            for (const lang of langOrder) {
                result[lang].failures = result[lang].evaluations - result[lang].successes;
            }
            
            return result;
        }
        
        // Get filtered language data based on current time range
        function getFilteredLanguageData() {
            if (currentTimeRange === 'all' && currentStats) {
                // For "all time", use the all-time stats
                return currentStats.languages;
            }
            // Otherwise, aggregate from time series with time cutoff
            const cutoff = getTimeCutoff(currentTimeRange);
            return aggregateByLanguage(chartData.evalsByLang, chartData.successesByLang, cutoff);
        }
        
        // Fetch time series data for specific range
        async function fetchTimeSeriesForRange(range) {
            try {
                const response = await fetch('/timeseries?range=' + range);
                const data = await response.json();
                chartData = data;
                drawChart();
                // Update pie chart and language cards with filtered data
                updateFilteredComponents();
            } catch (e) {
                console.error('Error fetching time series:', e);
            }
        }
        
        // Get time range label for display
        function getTimeRangeLabel(range) {
            switch (range) {
                case '1h': return 'Last Hour';
                case '3h': return 'Last 3 Hours';
                case '6h': return 'Last 6 Hours';
                case '12h': return 'Last 12 Hours';
                case '24h': return 'Last 24 Hours';
                case '1w': return 'Last Week';
                case '1m': return 'Last Month';
                case '1y': return 'Last Year';
                case 'all': return 'All Time';
                default: return 'All Time';
            }
        }
        
        // Update pie chart and language cards with time-filtered data
        function updateFilteredComponents() {
            const filteredLangs = getFilteredLanguageData();
            drawPieChart(filteredLangs);
            updateLanguageCards(filteredLangs);
            
            // Update section title to show time range
            const timeLabel = getTimeRangeLabel(currentTimeRange);
            document.getElementById('languagesTitle').textContent = 'Requests by Language (' + timeLabel + ')';
        }
        
        // Update language cards with given language data
        function updateLanguageCards(languages) {
            const languagesGrid = document.getElementById('languagesGrid');
            const allLanguages = ['bqn', 'apl', 'j', 'uiua', 'kap', 'tinyapl'];
            const langNames = { bqn: 'BQN', apl: 'APL', j: 'J', uiua: 'Uiua', kap: 'Kap', tinyapl: 'TinyAPL' };
            const langLogos = { 
                bqn: '/assets/bqn.svg', 
                apl: '/assets/apl.png', 
                j: '/assets/j_logo.png', 
                uiua: '/assets/uiua.png', 
                kap: '/assets/kap.png', 
                tinyapl: '/assets/tinyapl.svg' 
            };
            
            // Sort languages by total requests (most to least)
            const sortedLanguages = [...allLanguages].sort((a, b) => {
                const aEvals = (languages[a] || {}).evaluations || 0;
                const bEvals = (languages[b] || {}).evaluations || 0;
                return bEvals - aEvals;
            });
            
            languagesGrid.innerHTML = sortedLanguages.map(lang => {
                const langData = languages[lang] || { evaluations: 0, successes: 0, failures: 0 };
                const total = langData.evaluations || 0;
                const successes = langData.successes || 0;
                const failures = langData.failures || 0;
                const percentage = total > 0 ? Math.round((successes / total) * 100) : 0;
                // Color tiers: 95+ BQN green (default), 90-94 APL green, 80-89 TinyAPL green, 50-79 orange, <50 red
                const percentClass = percentage < 50 ? 'critical' : 
                                    percentage < 80 ? 'low' : 
                                    percentage < 90 ? 'tier-80' : 
                                    percentage < 95 ? 'tier-90' : '';
                return \`
                    <div class="language-card">
                        <div class="logo">
                            <img src="\${langLogos[lang]}" alt="\${langNames[lang]} logo">
                        </div>
                        <div class="info">
                            <div class="name \${lang}">\${langNames[lang]}</div>
                            <div class="count">\${formatNumber(total)}</div>
                            <div class="success-rate">
                                <span class="success">✓ \${formatNumber(successes)}</span>
                                <span class="failure">✗ \${formatNumber(failures)}</span>
                            </div>
                        </div>
                        <div class="percentage \${percentClass}">\${percentage}%</div>
                    </div>
                \`;
            }).join('');
        }
        
        // Update the dashboard with new stats
        function updateDashboard(data) {
            currentStats = data;
            
            // Update totals
            document.getElementById('totalVisitors').textContent = formatNumber(data.totalVisitors);
            document.getElementById('totalEvaluations').textContent = formatNumber(data.totalEvaluations);
            document.getElementById('totalPermalinks').textContent = formatNumber(data.totalPermalinks);
            document.getElementById('activeVisitors').textContent = formatNumber(data.activeVisitors);
            
            // Update recent evaluations if available in SSE data
            if (data.recentEvaluations) {
                evals = data.recentEvaluations;
                if (evalPanelVisible) {
                    renderEvalTable();
                }
            }
            
            // Update chart data from the appropriate time series
            if (['1h', '3h', '6h', '12h', '24h'].includes(currentTimeRange) && data.timeSeries?.fiveMin) {
                chartData = data.timeSeries.fiveMin;
            }
            // For other ranges, we fetch separately to avoid sending too much data via SSE
            drawChart();
            
            // Update pie chart and language cards with time-filtered data
            updateFilteredComponents();
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
            const langOrder = ['bqn', 'apl', 'tinyapl', 'j', 'uiua', 'kap'];
            
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
                case '3h':
                    return { start: now - 3 * 60 * 60 * 1000, bucketSize: 5 * 60 * 1000, format: 'minute' };
                case '6h':
                    return { start: now - 6 * 60 * 60 * 1000, bucketSize: 15 * 60 * 1000, format: 'hour' };
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
        const langOrder = ['bqn', 'apl', 'tinyapl', 'j', 'uiua', 'kap'];
        
        // Draw the activity chart
        function drawChart() {
            const canvas = document.getElementById('activityChart');
            const ctx = canvas.getContext('2d');
            
            // Reset canvas size so parent can reflow freely
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
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

            if (currentViewMode === 'cumulative') {
                const runningTotals = {};
                for (const lang of langOrder) {
                    runningTotals[lang] = 0;
                }
                for (const t of times) {
                    for (const lang of langOrder) {
                        runningTotals[lang] += buckets[t][lang];
                        buckets[t][lang] = runningTotals[lang];
                    }
                }
            }
            
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
        
        // Server health check
        function fetchServerStatus() {
            fetch('/servers')
                .then(res => res.json())
                .then(data => {
                    for (const [key, info] of Object.entries(data)) {
                        const el = document.getElementById('srv-' + key);
                        if (el) {
                            el.className = 'server-indicator ' + info.status;
                            el.title = info.name + ' (port ' + info.port + ') - ' + info.status.toUpperCase();
                        }
                    }
                })
                .catch(() => {
                    // If we can't reach the dashboard server itself, mark all as unknown
                    for (const key of ['apl', 'permalink']) {
                        const el = document.getElementById('srv-' + key);
                        if (el) {
                            el.className = 'server-indicator';
                        }
                    }
                });
        }
        
        // Evals
        function fetchEvals() {
            fetch('/evals')
                .then(res => res.json())
                .then(data => {
                    evals = data;
                    if (evalPanelVisible) {
                        renderEvalTable();
                    }
                })
                .catch(console.error);
        }
        
        function renderEvalTable() {
            const container = document.getElementById('evalTableContainer');
            
            if (!evals || evals.length === 0) {
                container.innerHTML = '<div class="eval-no-data">No evaluations recorded yet.</div>';
                return;
            }
            
            let html = '<table class="eval-table">';
            html += '<thead><tr><th>Time</th><th>Status</th><th>Code</th></tr></thead>';
            html += '<tbody>';
            
            for (const ev of evals) {
                const date = new Date(ev.timestamp);
                let hours = date.getHours();
                const ampm = hours >= 12 ? 'pm' : 'am';
                hours = hours % 12 || 12;
                const timeStr = hours + ':' + 
                               date.getMinutes().toString().padStart(2, '0') + ':' + 
                               date.getSeconds().toString().padStart(2, '0') + ' ' + ampm;
                const lang = ev.language || 'unknown';
                const success = ev.success;
                const duration = ev.duration ? ev.duration + 'ms' : '';
                const code = (ev.code || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const icon = success ? '✓' : '✗';
                const iconClass = success ? 'success' : 'failure';
                
                html += '<tr>';
                html += '<td class="eval-time">' + timeStr + '</td>';
                html += '<td class="eval-status"><span class="icon ' + iconClass + '">' + icon + '</span>';
                if (duration) {
                    html += ' <span class="dur ' + lang + '">' + duration + '</span>';
                }
                html += '</td>';
                html += '<td class="eval-code lang-' + lang + '">' + (code || '<em style="color:var(--text-muted)">no code</em>') + '</td>';
                html += '</tr>';
            }
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }
        
        function redrawCharts() {
            if (currentStats) {
                drawChart();
                const filteredLangs = getFilteredLanguageData();
                drawPieChart(filteredLangs);
            }
        }
        
        function toggleEvalPanel() {
            evalPanelVisible = !evalPanelVisible;
            const panel = document.getElementById('evalPanel');
            if (evalPanelVisible) {
                fetchEvals();
                panel.classList.add('visible');
            } else {
                panel.classList.remove('visible');
            }
            // Continuously redraw charts during the transition so they track the resize
            const start = performance.now();
            function animateRedraw(now) {
                redrawCharts();
                if (now - start < 300) {
                    requestAnimationFrame(animateRedraw);
                }
            }
            requestAnimationFrame(animateRedraw);
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
        window.addEventListener('resize', redrawCharts);
        
        // Handle time range selection
        document.getElementById('timeRange').addEventListener('change', (e) => {
            currentTimeRange = e.target.value;
            if (['1h', '3h', '6h', '12h', '24h'].includes(currentTimeRange) && currentStats?.timeSeries?.fiveMin) {
                // Use data already in memory for short ranges
                chartData = currentStats.timeSeries.fiveMin;
                drawChart();
                updateFilteredComponents();
            } else {
                // Fetch data for other ranges (this will also update filtered components)
                fetchTimeSeriesForRange(currentTimeRange);
            }
        });

        // Handle view mode selection
        document.getElementById('viewMode').addEventListener('change', (e) => {
            currentViewMode = e.target.value;
            drawChart();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            const timeRangeSelect = document.getElementById('timeRange');
            const viewModeSelect = document.getElementById('viewMode');
            const options = Array.from(timeRangeSelect.options);
            const currentIndex = options.findIndex(opt => opt.value === currentTimeRange);
            
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                let newIndex;
                if (e.key === 'ArrowUp') {
                    // Move to previous (shorter) time range
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    // Move to next (longer) time range
                    newIndex = Math.min(options.length - 1, currentIndex + 1);
                }
                if (newIndex !== currentIndex) {
                    timeRangeSelect.value = options[newIndex].value;
                    timeRangeSelect.dispatchEvent(new Event('change'));
                }
            } else if (e.key === 'c' || e.key === 'C') {
                // Toggle cumulative mode
                e.preventDefault();
                viewModeSelect.value = currentViewMode === 'interval' ? 'cumulative' : 'interval';
                viewModeSelect.dispatchEvent(new Event('change'));
            } else if (e.key === 't' || e.key === 'T') {
                // Toggle evals panel
                e.preventDefault();
                toggleEvalPanel();
            } else if (e.key === 'Escape') {
                // Close panel if open
                if (evalPanelVisible) {
                    e.preventDefault();
                    toggleEvalPanel();
                }
            }
        });
        
        // Start
        connect();
        
        // Also fetch initial data via regular HTTP
        fetch('/stats')
            .then(res => res.json())
            .then(updateDashboard)
            .catch(console.error);
        
        // Fetch server status immediately and every 15 seconds
        fetchServerStatus();
        setInterval(fetchServerStatus, 15000);
        
        // Fetch recent evals initially
        fetchEvals();
        
        // Poll every 10 seconds for more responsive updates
        setInterval(() => {
            fetch('/stats')
                .then(res => res.json())
                .then(updateDashboard)
                .catch(console.error);
            // Also refresh recent evals if overlay is visible
            if (evalPanelVisible) {
                fetchEvals();
            }
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
    
    // Serve fonts
    if (req.method === 'GET' && req.url.startsWith('/fonts/')) {
        const filename = req.url.slice('/fonts/'.length);
        if (filename.includes('..') || filename.includes('/')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        const fontsDir = path.join(__dirname, '..', 'fonts');
        const filePath = path.join(fontsDir, filename);
        
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'font/ttf', 'Cache-Control': 'public, max-age=31536000' });
        fs.createReadStream(filePath).pipe(res);
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

    // Server health check endpoint
    if (req.method === 'GET' && req.url === '/servers') {
        const serverChecks = [
            { name: 'APL', key: 'apl', port: 8081 },
            { name: 'Permalink', key: 'permalink', port: 8084 }
        ];
        
        const results = {};
        let pending = serverChecks.length;
        
        for (const svc of serverChecks) {
            const checkReq = http.request({
                hostname: 'localhost',
                port: svc.port,
                path: '/',
                method: 'GET',
                timeout: 2000
            }, (checkRes) => {
                results[svc.key] = { name: svc.name, status: 'up', port: svc.port };
                if (--pending === 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
            });
            
            checkReq.on('error', () => {
                results[svc.key] = { name: svc.name, status: 'down', port: svc.port };
                if (--pending === 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
            });
            
            checkReq.on('timeout', () => {
                checkReq.destroy();
                results[svc.key] = { name: svc.name, status: 'down', port: svc.port };
                if (--pending === 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                }
            });
            
            checkReq.end();
        }
        return;
    }
    
    // Evals endpoint
    if (req.method === 'GET' && req.url === '/evals') {
        const recent = stats.getRecentEvaluations(20);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(recent));
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
                stats.recordEvaluation(data.language, data.success, data.code, data.duration);
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
        // Show localhost URLs
        console.log(`  Localhost: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
        // Show local IP for network access
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
