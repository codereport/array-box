#!/usr/bin/env node
/** Refresh upstream hover docs and add newly documented glyphs to search/highlighting. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = name => path.join(root, 'src', name);
const kapUrl = 'https://codeberg.org/loke/array/src/branch/master/docs/reference.asciidoc';
const kapRawUrl = 'https://codeberg.org/loke/array/raw/branch/master/docs/reference.asciidoc';
const kapLineUrl = line => `${kapUrl}?display=source#L${line}`;
const uiuaUrl = 'https://raw.githubusercontent.com/uiua-lang/uiua/main/site/primitives.json';
const uiuaFontUrl = 'https://raw.githubusercontent.com/uiua-lang/uiua/main/src/assets/Uiua386.ttf';
const tinyKeyboardUrl = 'https://raw.githubusercontent.com/RubenVerg/TinyAPL/beta/js/index.ts';
const fingerprintPath = path.join(root, 'scripts', 'kap-reference-fingerprint.json');
const kapNamesPath = path.join(root, 'scripts', 'kap-heading-names.json');
const notes = [];

async function get(url) {
    const response = await fetch(url, { headers: { 'User-Agent': 'array-box-upstream-sync' }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.text();
}

async function getFont(url) {
    const response = await fetch(url, { headers: { 'User-Agent': 'array-box-upstream-sync' }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 200000 || bytes.readUInt32BE(0) !== 0x00010000) throw new Error('Uiua font download looks invalid');
    return bytes;
}

function jsString(value) {
    return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function appendToExport(file, exportName, lines) {
    if (!lines.length) return;
    let code = readFileSync(file, 'utf8');
    const start = code.indexOf(`export const ${exportName} = {`);
    if (start < 0) throw new Error(`Missing ${exportName} in ${file}`);
    const end = code.indexOf('\n};', start);
    if (end < 0) throw new Error(`Missing end of ${exportName} in ${file}`);
    code = code.slice(0, end) + '\n    // Added from upstream documentation; review placement and labels.\n' + lines.join('\n') + code.slice(end);
    writeFileSync(file, code);
}

function appendToArray(file, exportName, category, glyphs) {
    if (!glyphs.length) return;
    let code = readFileSync(file, 'utf8');
    const start = code.indexOf(`export const ${exportName} = {`);
    if (start < 0) throw new Error(`Missing ${exportName}`);
    const categoryStart = code.indexOf(`${category}: [`, start);
    const exportEnd = code.indexOf('\n};', start);
    if (categoryStart < 0 || categoryStart > exportEnd) throw new Error(`Missing ${exportName}.${category}`);
    const close = code.indexOf(']', categoryStart);
    const prefix = code.slice(0, close).trimEnd();
    const separator = prefix.endsWith(',') ? '' : ',';
    code = prefix + separator + '\n        ' + glyphs.map(jsString).join(', ') + '\n    ' + code.slice(close);
    writeFileSync(file, code);
}

function appendToSyntax(category, glyphs, language) {
    if (!glyphs.length) return;
    let code = readFileSync(src('syntax.js'), 'utf8');
    const start = code.indexOf(`    ${language}: {`);
    const categoryStart = code.indexOf(`        ${category}: [`, start);
    const nextLang = code.indexOf('\n    },', start);
    if (start < 0 || categoryStart < 0 || (nextLang >= 0 && categoryStart > nextLang)) {
        throw new Error(`Missing syntaxRules.${language}.${category}`);
    }
    const close = code.indexOf(']', categoryStart);
    const prefix = code.slice(0, close).trimEnd();
    code = prefix + (prefix.endsWith(',') ? '' : ',') + '\n            ' + glyphs.map(jsString).join(', ') + '\n        ' + code.slice(close);
    writeFileSync(src('syntax.js'), code);
}

function removeGlyphLiteral(block, literal) {
    let index;
    while ((index = block.indexOf(literal)) !== -1) {
        const after = block.slice(index + literal.length).match(/^\s*,/);
        const before = block.slice(0, index).match(/,\s*$/);
        if (after) block = block.slice(0, index) + block.slice(index + literal.length + after[0].length);
        else if (before) block = block.slice(0, index - before[0].length) + block.slice(index + literal.length);
        else block = block.slice(0, index) + block.slice(index + literal.length);
    }
    return block;
}

function removeUiuaGlyph(glyph) {
    const literal = jsString(glyph);
    let keyboard = readFileSync(src('keyboard.js'), 'utf8');
    const namesStart = keyboard.indexOf('export const uiuaGlyphNames = {');
    const namesEnd = keyboard.indexOf('\n};', namesStart);
    const names = keyboard.slice(namesStart, namesEnd).split('\n').filter(line => !line.trimStart().startsWith(`${literal}:`)).join('\n');
    keyboard = keyboard.slice(0, namesStart) + names + keyboard.slice(namesEnd);
    writeFileSync(src('keyboard.js'), keyboard);

    for (const [file, startMarker, endMarker] of [
        [src('keymap.js'), 'export const uiuaGlyphs = {', '\n};'],
        [src('syntax.js'), '    uiua: {', '\n    kap: {'],
    ]) {
        let code = readFileSync(file, 'utf8');
        const start = code.indexOf(startMarker);
        const end = code.indexOf(endMarker, start);
        if (start < 0 || end < 0) throw new Error(`Cannot locate Uiua glyph lists in ${file}`);
        const block = removeGlyphLiteral(code.slice(start, end), literal);
        writeFileSync(file, code.slice(0, start) + block + code.slice(end));
    }
}

function renameUiuaGlyph(glyph, name) {
    let code = readFileSync(src('keyboard.js'), 'utf8');
    const start = code.indexOf('export const uiuaGlyphNames = {');
    const end = code.indexOf('\n};', start);
    const lines = code.slice(start, end).split('\n');
    const index = lines.findIndex(line => line.trimStart().startsWith(`${jsString(glyph)}:`));
    if (index < 0) return;
    lines[index] = `    ${jsString(glyph)}: ${jsString(name)},`;
    code = code.slice(0, start) + lines.join('\n') + code.slice(end);
    writeFileSync(src('keyboard.js'), code);
}

function classifyUiua(info) {
    const direct = {
        MonadicPervasive: ['monadicPervasive', 'monadic'],
        MonadicArray: ['monadicArray', 'monadic'],
        DyadicPervasive: ['dyadicPervasive', 'functions'],
        DyadicArray: ['dyadicArray', 'functions'],
        Constant: ['constants', 'constants'],
    };
    if (direct[info.class]) return direct[info.class];
    if (info.modifier_args) return info.modifier_args > 1
        ? ['dyadicModifiers', 'modifier'] : ['monadicModifiers', 'dyadic'];
    if (info.class === 'Arguments') return ['stack', 'dyadic'];
    if (info.args === 1) return ['monadicArray', 'monadic'];
    if (info.args === 2) return ['dyadicArray', 'functions'];
    return null;
}

function kapHeadings(source) {
    const headings = new Map();
    source.split('\n').forEach((line, index) => {
        const match = line.match(/^={3,5} `([^`]+)`: (.+)$/);
        if (!match) return;
        const [, glyph, name] = match;
        if ([...glyph].length !== 1 || /^[a-z0-9]$/i.test(glyph)) return;
        headings.set(glyph, { line: index + 1, name: name.trim() });
    });
    if (headings.size < 75) throw new Error(`Kap reference yielded only ${headings.size} glyph headings`);
    return headings;
}

function parseTinyKeyboard(source) {
    const start = source.indexOf('const keyboard = [');
    const end = source.indexOf('].map(', start);
    if (start < 0 || end < 0) throw new Error('TinyAPL keyboard table is missing');
    const result = [];
    for (const line of source.slice(start, end).split('\n')) {
        const match = line.match(/^\s*\[(.*)\],?\s*$/);
        if (!match) continue;
        const fields = [];
        let token = '', quote = '', escaped = false;
        for (const char of match[1]) {
            if (escaped) { token += char; escaped = false; continue; }
            if (char === '\\' && quote) { token += char; escaped = true; continue; }
            if (quote) { token += char; if (char === quote) quote = ''; continue; }
            if (char === "'" || char === '"') { quote = char; token += char; continue; }
            if (char === ',') { fields.push(token.trim()); token = ''; continue; }
            token += char;
        }
        fields.push(token.trim());
        if (quote || (fields.length !== 7 && !(fields.length === 6 && fields[0] === "'Space'"))) {
            throw new Error(`Unexpected TinyAPL keyboard row: ${line}`);
        }
        if (fields.length === 6) fields.push('undefined');
        const values = fields.map(value => {
            if (value === 'undefined') return undefined;
            if (!/^(?:'.*'|".*")$/.test(value)) throw new Error(`Unexpected TinyAPL keyboard value: ${value}`);
            return value.slice(1, -1).replace(/\\([\\'"nt])/g, (_, escape) => ({ n: '\n', t: '\t' }[escape] ?? escape));
        });
        if (values[0] === 'Space' && values[4] === 'Prefix') values[4] = '`';
        result.push(Object.fromEntries(['code', 'sym', 'symS', 'symP', 'symPS', 'symPP', 'symPPS'].map((key, index) => [key, values[index]])));
    }
    if (result.length < 45) throw new Error(`TinyAPL keyboard yielded only ${result.length} keys`);
    return result;
}

function syncTinyKeyboard(rows, localRows) {
    let code = readFileSync(src('keymap.js'), 'utf8');
    const fields = ['code', 'sym', 'symS', 'symP', 'symPS', 'symPP', 'symPPS'];
    const changed = [];
    for (const row of rows) {
        const old = localRows.find(item => item.code === row.code);
        if (old && fields.every(field => old[field] === row[field])) continue;
        const newLine = `    { ${fields.map(field => `${field}: ${row[field] === undefined ? 'undefined' : jsString(row[field])}`).join(', ')} }`;
        const oldLine = code.match(new RegExp(`^    \\{ code: '${row.code}'[^\\n]*\\}`, 'm'));
        if (oldLine) code = code.replace(oldLine[0], newLine);
        else {
            const end = code.indexOf('\n];', code.indexOf('export const tinyaplKeyboard = ['));
            if (end < 0) throw new Error('Missing end of tinyaplKeyboard');
            const before = code.slice(0, end).trimEnd();
            code = before + (before.endsWith(',') ? '' : ',') + '\n' + newLine + code.slice(end);
        }
        changed.push(row.code);
    }
    if (changed.length) writeFileSync(src('keymap.js'), code);
    return changed;
}

function fixKapLinks(code, headings) {
    const start = code.indexOf('export const kapGlyphDocs = {');
    const end = code.indexOf('\n};', start);
    if (start < 0 || end < 0) throw new Error('Missing kapGlyphDocs');
    const body = code.slice(start, end);
    const entries = [...body.matchAll(/^    "([^"]+)": \{/gm)];
    let rebuilt = '';
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const next = entries[i + 1]?.index ?? body.length;
        let section = body.slice(entry.index, next);
        const heading = headings.get(JSON.parse(`"${entry[1]}"`));
        section = section.replace(/"docUrl": "[^"]+"/, () => {
            const correct = heading ? kapLineUrl(heading.line) : kapUrl;
            return `"docUrl": "${correct}"`;
        });
        rebuilt += section;
    }
    const header = body.slice(0, entries[0]?.index ?? body.length);
    return code.slice(0, start) + header + rebuilt + code.slice(end);
}

async function main() {
    // Validate both remote sources before invoking generators that write files.
    const [uiuaRaw, kapSource, tinyKeyboardSource, uiuaFont] = await Promise.all([
        get(uiuaUrl), get(kapRawUrl), get(tinyKeyboardUrl), getFont(uiuaFontUrl),
    ]);
    const uiua = JSON.parse(uiuaRaw);
    if (Object.keys(uiua).length < 100) throw new Error('Uiua primitive list looks incomplete');
    const headings = kapHeadings(kapSource);
    const tinyKeyboardRows = parseTinyKeyboard(tinyKeyboardSource);
    const { uiuaGlyphDocs: previousUiuaDocs } = await import('../src/uiua-docs.js?before-sync');

    for (const lang of ['uiua', 'tinyapl', 'bqn']) {
        execFileSync(process.execPath, [path.join(root, 'scripts', `scrape-${lang}-docs.cjs`)], { stdio: 'inherit' });
    }

    const [{ uiuaGlyphDocs }, { tinyaplGlyphDocs }, { bqnGlyphDocs }, keyboard, keymap, { syntaxRules }] = await Promise.all([
        import('../src/uiua-docs.js?after-sync'), import('../src/tinyapl-docs.js'), import('../src/bqn-docs.js'),
        import('../src/keyboard.js'), import('../src/keymap.js'), import('../src/syntax.js'),
    ]);

    const additions = { uiua: [], tinyapl: [], bqn: [], kap: [] };
    const fontPath = path.join(root, 'fonts', 'Uiua386.ttf');
    const fontChanged = !readFileSync(fontPath).equals(uiuaFont);
    if (fontChanged) writeFileSync(fontPath, uiuaFont);
    const tinyKeyboardChanges = syncTinyKeyboard(tinyKeyboardRows, keymap.tinyaplKeyboard);
    const uiuaCategories = {};
    for (const [name, info] of Object.entries(uiua)) {
        if (name.startsWith('&') || info.deprecated) continue;
        const glyph = info.glyph || info.ascii;
        if (!glyph || !uiuaGlyphDocs[glyph] || keyboard.uiuaGlyphNames[glyph]) continue;
        const categories = classifyUiua(info);
        if (!categories) {
            notes.push(`Uiua ${glyph} (${name}) has an unknown class: ${info.class}`);
            continue;
        }
        additions.uiua.push([glyph, name]);
        (uiuaCategories[JSON.stringify(categories)] ??= []).push(glyph);
    }
    for (const [glyph, name] of additions.uiua) {
        // Names come directly from upstream's primitive list.
        if (!name) throw new Error(`Missing Uiua name for ${glyph}`);
    }
    appendToExport(src('keyboard.js'), 'uiuaGlyphNames', additions.uiua.map(([glyph, name]) => `    ${jsString(glyph)}: ${jsString(name)},`));
    for (const [pair, glyphs] of Object.entries(uiuaCategories)) {
        const [keymapCategory, syntaxCategory] = JSON.parse(pair);
        const unseenKeymap = glyphs.filter(g => !keymap.uiuaGlyphs[keymapCategory].includes(g));
        appendToArray(src('keymap.js'), 'uiuaGlyphs', keymapCategory, unseenKeymap);
        appendToSyntax(syntaxCategory, glyphs.filter(g => !syntaxRules.uiua[syntaxCategory].includes(g)), 'uiua');
    }
    const retiredUiua = Object.keys(previousUiuaDocs).filter(glyph => !uiuaGlyphDocs[glyph]);
    for (const glyph of retiredUiua) removeUiuaGlyph(glyph);
    const renamedUiua = Object.entries(uiuaGlyphDocs).filter(([glyph, doc]) =>
        previousUiuaDocs[glyph]?.name && previousUiuaDocs[glyph].name !== doc.name);
    for (const [glyph, doc] of renamedUiua) renameUiuaGlyph(glyph, doc.name);

    for (const [glyph, doc] of Object.entries(tinyaplGlyphDocs)) {
        if (keyboard.tinyaplGlyphNames[glyph]) continue;
        if ([...glyph].length > 1 && [...glyph].every(char => keyboard.tinyaplGlyphNames[char])) continue;
        const names = [...new Set((doc.overloads || []).map(o => o.name).filter(Boolean))];
        const label = names.length ? names.join(' / ').toLowerCase() : (doc.name || glyph).toLowerCase();
        additions.tinyapl.push([glyph, label]);
    }
    appendToExport(src('keyboard.js'), 'tinyaplGlyphNames', additions.tinyapl.map(([glyph, label]) => `    ${jsString(glyph)}: ${jsString(label)},`));
    // TinyAPL MDX prose does not reliably identify function/modifier arity.
    // Report new glyphs for category review in the PR, while making them searchable.
    if (additions.tinyapl.length) notes.push('Review TinyAPL keyboard and syntax categories for the new glyphs.');

    const bqnCategories = { function: 'functions', '1-modifier': 'monadic', '2-modifier': 'dyadic' };
    for (const [glyph, doc] of Object.entries(bqnGlyphDocs)) {
        if (keyboard.bqnGlyphNames[glyph] || !bqnCategories[doc.type]) continue;
        const label = [doc.monad?.name, doc.dyad?.name].filter(Boolean).join(' / ').toLowerCase() || glyph;
        additions.bqn.push([glyph, label, bqnCategories[doc.type]]);
    }
    appendToExport(src('keyboard.js'), 'bqnGlyphNames', additions.bqn.map(([glyph, label]) => `    ${jsString(glyph)}: ${jsString(label)},`));
    for (const category of Object.values(bqnCategories)) {
        appendToSyntax(category, additions.bqn.filter(([glyph, , group]) => group === category && !syntaxRules.bqn[category].includes(glyph)).map(([glyph]) => glyph), 'bqn');
    }
    if (additions.bqn.length) notes.push('Review new BQN glyphs against its keyboard layout.');

    let kapDocsCode = readFileSync(src('kap-docs.js'), 'utf8');
    kapDocsCode = fixKapLinks(kapDocsCode, headings);
    const { kapGlyphDocs } = await import('../src/kap-docs.js');
    for (const [glyph, { line, name }] of headings) {
        if (!kapGlyphDocs[glyph]) {
            const entry = `    ${JSON.stringify(glyph)}: ${JSON.stringify({ glyph, type: 'function', docUrl: kapLineUrl(line), name, description: name })},`;
            const end = kapDocsCode.indexOf('\n};', kapDocsCode.indexOf('export const kapGlyphDocs = {'));
            kapDocsCode = kapDocsCode.slice(0, end) + '\n' + entry + kapDocsCode.slice(end);
            additions.kap.push([glyph, name]);
        }
    }
    writeFileSync(src('kap-docs.js'), kapDocsCode);
    appendToExport(src('keyboard.js'), 'kapGlyphNames', additions.kap.filter(([glyph]) => !keyboard.kapGlyphNames[glyph]).map(([glyph, name]) => `    ${jsString(glyph)}: ${jsString(name.toLowerCase())},`));
    if (additions.kap.length) notes.push('Review new Kap hover descriptions and syntax categories; its HTML reference has no structured primitive feed.');

    const fingerprint = createHash('sha256').update(kapSource.replace(/\r\n/g, '\n')).digest('hex');
    const oldFingerprint = JSON.parse(readFileSync(fingerprintPath, 'utf8')).sha256;
    if (oldFingerprint !== fingerprint) {
        writeFileSync(fingerprintPath, JSON.stringify({ source: kapUrl, sha256: fingerprint }, null, 2) + '\n');
        notes.push('Kap reference text changed. Review hand-written descriptions in src/kap-docs.js against the upstream reference.');
    }

    // The whole-document fingerprint is useful for prose changes; this smaller
    // snapshot makes Kap primitive name changes visible in the generated PR.
    const previousKapNames = existsSync(kapNamesPath) ? JSON.parse(readFileSync(kapNamesPath, 'utf8')).names : {};
    const kapNames = Object.fromEntries([...headings].map(([glyph, { name }]) => [glyph, name])
        .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
    const changedKapNames = Object.entries(kapNames).filter(([glyph, name]) =>
        previousKapNames[glyph] && previousKapNames[glyph] !== name);
    writeFileSync(kapNamesPath, JSON.stringify({ source: kapUrl, names: kapNames }, null, 2) + '\n');

    const summary = [
        'Automated upstream primitive and documentation sync.', '',
        `- Uiua new glyphs: ${additions.uiua.map(([g]) => g).join(' ') || 'none'}`,
        `- Uiua retired glyphs: ${retiredUiua.join(' ') || 'none'}`,
        `- Uiua renamed primitives: ${renamedUiua.map(([g]) => g).join(' ') || 'none'}`,
        `- Uiua font updated: ${fontChanged ? 'yes' : 'no'}`,
        `- TinyAPL new glyphs: ${additions.tinyapl.map(([g]) => g).join(' ') || 'none'}`,
        `- TinyAPL keyboard keys updated: ${tinyKeyboardChanges.join(', ') || 'none'}`,
        `- BQN new glyphs: ${additions.bqn.map(([g]) => g).join(' ') || 'none'}`,
        `- Kap new glyphs: ${additions.kap.map(([g]) => g).join(' ') || 'none'}`,
        `- Kap heading names changed: ${changedKapNames.map(([g]) => g).join(' ') || 'none'}`,
        '- Refreshed Uiua, TinyAPL, and BQN hover docs from upstream.',
        '- Checked Kap reference source links and text fingerprint.',
        ...notes.map(note => `- ${note}`), '',
        'Sources: https://github.com/uiua-lang/uiua/blob/main/site/primitives.json, https://github.com/RubenVerg/TinyAPL/tree/beta/docs/pages, https://mlochbaum.github.io/BQN/help/, https://codeberg.org/loke/array/src/branch/master/docs/reference.asciidoc',
    ].join('\n');
    writeFileSync(path.join(root, 'upstream-sync-summary.md'), summary + '\n');
    console.log(summary);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(error => { console.error(error); process.exitCode = 1; });
}

export { classifyUiua, fixKapLinks, kapHeadings, parseTinyKeyboard, removeGlyphLiteral };
