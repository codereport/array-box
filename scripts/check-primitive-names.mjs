#!/usr/bin/env node
/** Keep search labels aligned with fetched docs and list labels needing human review. */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uiuaGlyphDocs } from '../src/uiua-docs.js';
import { tinyaplGlyphDocs } from '../src/tinyapl-docs.js';
import { bqnGlyphDocs } from '../src/bqn-docs.js';
import { kapGlyphDocs } from '../src/kap-docs.js';
import { jGlyphDocs } from '../src/j-docs.js';
import { aplGlyphDocs } from '../src/apl-docs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keyboardPath = path.join(root, 'src', 'keyboard.js');
const reviewPath = path.join(root, 'scripts', 'primitive-name-review.md');
const docsByLanguage = [
    ['uiua', uiuaGlyphDocs], ['tinyapl', tinyaplGlyphDocs], ['bqn', bqnGlyphDocs],
    ['kap', kapGlyphDocs], ['j', jGlyphDocs], ['apl', aplGlyphDocs],
];
const fetchedNames = new Set(['uiua', 'tinyapl', 'bqn']);

function documentedNames(language, doc) {
    const candidates = language === 'uiua' ? [doc.name] : [
        doc.monad?.name,
        doc.dyad?.name,
        ...(language === 'tinyapl' ? (doc.overloads || []).map(overload => overload.name) : []),
    ];
    if (!candidates.some(Boolean)) candidates.push(doc.name);
    return [...new Set(candidates.filter(Boolean).map(name => name.trim().replace(/\s+/g, ' ').toLowerCase()))];
}

function findNameDifferences(language, names, docs) {
    const differences = [];
    for (const [glyph, current] of Object.entries(names)) {
        const doc = docs[glyph];
        if (!doc) continue;
        const documented = documentedNames(language, doc);
        if (!documented.length) continue;
        const expected = documented.join(' / ');
        if (current.trim().replace(/\s+/g, ' ').toLowerCase() !== expected) {
            differences.push({ glyph, current, expected, docUrl: doc.docUrl });
        }
    }
    return differences;
}

function jsString(value) {
    return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function glyphKeyFromLine(line) {
    const literal = line.match(/^\s*('(?:\\.|[^'])*'|"(?:\\.|[^"])*")\s*:/)?.[1];
    if (!literal) return null;
    return literal.startsWith('"') ? JSON.parse(literal) :
        JSON.parse(`"${literal.slice(1, -1).replaceAll("\\'", "'").replaceAll('"', '\\"')}"`);
}

function glyphNameBlock(code, exportName) {
    const start = code.indexOf(`export const ${exportName} = {`);
    const end = code.indexOf('\n};', start);
    if (start < 0 || end < 0) throw new Error(`Cannot find ${exportName}`);
    return { start, end, lines: code.slice(start, end).split('\n') };
}

function duplicateGlyphKeys(code, exportName) {
    const seen = new Set();
    const duplicates = new Set();
    for (const line of glyphNameBlock(code, exportName).lines) {
        const glyph = glyphKeyFromLine(line);
        if (glyph === null) continue;
        if (seen.has(glyph)) duplicates.add(glyph);
        seen.add(glyph);
    }
    return [...duplicates];
}

function removeDuplicateGlyphKeys(code, exportName) {
    const { start, end, lines } = glyphNameBlock(code, exportName);
    const seen = new Set();
    const removed = [];
    const kept = lines.filter(line => {
        const glyph = glyphKeyFromLine(line);
        if (glyph === null) return true;
        if (seen.has(glyph)) {
            removed.push(glyph);
            return false;
        }
        seen.add(glyph);
        return true;
    });
    return { code: code.slice(0, start) + kept.join('\n') + code.slice(end), removed };
}

function updateNameMap(language, differences) {
    if (!differences.length) return;
    const exportName = `${language}GlyphNames`;
    let code = readFileSync(keyboardPath, 'utf8');
    const start = code.indexOf(`export const ${exportName} = {`);
    const end = code.indexOf('\n};', start);
    if (start < 0 || end < 0) throw new Error(`Cannot find ${exportName}`);
    const lines = code.slice(start, end).split('\n');
    for (const { glyph, expected } of differences) {
        const single = `${jsString(glyph)}:`;
        const double = `${JSON.stringify(glyph)}:`;
        const index = lines.findIndex(line => line.trimStart().startsWith(single) || line.trimStart().startsWith(double));
        if (index < 0) throw new Error(`Cannot find ${exportName}[${JSON.stringify(glyph)}]`);
        lines[index] = `    ${jsString(glyph)}: ${jsString(expected)},`;
    }
    code = code.slice(0, start) + lines.join('\n') + code.slice(end);
    writeFileSync(keyboardPath, code);
}

function markdownCell(value) {
    return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function writeReview(differences) {
    const lines = [
        '# Primitive names for manual review',
        '',
        'Search labels below differ from the bundled hover documentation. Some are useful short names or aliases; compare new changes with the linked docs before renaming them. Kap docs are hand-maintained, while J and APL names are curated locally, so these rows are review candidates rather than automatic corrections.',
        '',
        '| Language | Glyph | Search label | Documentation name |',
        '| --- | --- | --- | --- |',
    ];
    for (const [language, rows] of differences) {
        for (const { glyph, current, expected, docUrl } of rows) {
            const glyphCell = docUrl ? `[${markdownCell(glyph)}](${docUrl})` : markdownCell(glyph);
            lines.push(`| ${language} | ${glyphCell} | ${markdownCell(current)} | ${markdownCell(expected)} |`);
        }
    }
    if (lines.length === 6) lines.push('| — | — | No differences | — |');
    writeFileSync(reviewPath, lines.join('\n') + '\n');
}

async function main(fix = false) {
    const review = [];
    const corrected = [];
    let unsynced = 0;
    let keyboardCode = readFileSync(keyboardPath, 'utf8');
    const removedDuplicates = [];
    for (const [language] of docsByLanguage) {
        const duplicates = duplicateGlyphKeys(keyboardCode, `${language}GlyphNames`);
        if (duplicates.length && !fix) throw new Error(`${language} has duplicate glyph names: ${duplicates.join(' ')}`);
        if (duplicates.length) {
            const result = removeDuplicateGlyphKeys(keyboardCode, `${language}GlyphNames`);
            keyboardCode = result.code;
            removedDuplicates.push(`${language}: ${result.removed.join(' ')}`);
        }
    }
    if (removedDuplicates.length) {
        writeFileSync(keyboardPath, keyboardCode);
        console.log(`Removed duplicate glyph names: ${removedDuplicates.join('; ')}`);
    }
    // Import only after deduplication so the object reflects the retained keys.
    const keyboard = await import('../src/keyboard.js');
    for (const [language, docs] of docsByLanguage) {
        const names = keyboard[`${language}GlyphNames`];
        if (Object.keys(docs).length < 50) throw new Error(`${language} docs look incomplete`);
        const differences = findNameDifferences(language, names, docs);
        if (fetchedNames.has(language)) {
            if (fix) {
                updateNameMap(language, differences);
                corrected.push([language, differences]);
            }
            else unsynced += differences.length;
            console.log(`${language}: ${differences.length} search label${differences.length === 1 ? '' : 's'} ${fix ? 'updated' : 'out of sync'}`);
        } else {
            review.push([language, differences]);
            console.log(`${language}: ${differences.length} label differences for review`);
        }
    }
    writeReview(review);
    const summaryPath = path.join(root, 'upstream-sync-summary.md');
    if (fix && existsSync(summaryPath)) {
        const corrections = corrected.filter(([, rows]) => rows.length).map(([language, rows]) =>
            `- ${language}: ${rows.length} (${rows.map(({ glyph }) => glyph).join(' ')})`);
        if (removedDuplicates.length) corrections.push(`- Duplicate glyph keys removed: ${removedDuplicates.join('; ')}`);
        if (corrections.length) {
            appendFileSync(summaryPath, '\nPrimitive search label corrections:\n' + corrections.join('\n') + '\n');
        }
    }
    if (unsynced) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.includes('--fix')).catch(error => { console.error(error); process.exitCode = 1; });
}

export { documentedNames, duplicateGlyphKeys, findNameDifferences, removeDuplicateGlyphKeys };
