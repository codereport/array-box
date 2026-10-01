#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const [configPath, backendUrl] = process.argv.slice(2);

if (!configPath || !backendUrl) {
    console.error('Usage: node scripts/set-backend-url.mjs CONFIG_FILE HTTPS_URL');
    process.exit(2);
}

let parsedUrl;
try {
    parsedUrl = new URL(backendUrl);
} catch {
    console.error(`Invalid backend URL: ${backendUrl}`);
    process.exit(2);
}

if (parsedUrl.protocol !== 'https:') {
    console.error('The production backend URL must use HTTPS.');
    process.exit(2);
}

const source = fs.readFileSync(configPath, 'utf8');
const pattern = /^([ \t]*)BACKEND_URL:\s*(['"])[^'"\r\n]*\2,?[ \t]*$/gm;
const matches = [...source.matchAll(pattern)];

if (matches.length !== 1) {
    console.error(`Expected exactly one BACKEND_URL assignment in ${configPath}; found ${matches.length}.`);
    process.exit(1);
}

const match = matches[0];
const replacement = `${match[1]}BACKEND_URL: '${parsedUrl.href.replace(/\/$/, '')}',`;
const updated = source.slice(0, match.index) + replacement + source.slice(match.index + match[0].length);
const fileMode = fs.statSync(configPath).mode;
const temporaryPath = path.join(path.dirname(configPath), `.${path.basename(configPath)}.${process.pid}.tmp`);

try {
    fs.writeFileSync(temporaryPath, updated, { mode: fileMode });
    fs.renameSync(temporaryPath, configPath);
} catch (error) {
    try {
        fs.unlinkSync(temporaryPath);
    } catch {}
    throw error;
}

console.log(`Updated config.js BACKEND_URL to ${parsedUrl.href.replace(/\/$/, '')}`);
