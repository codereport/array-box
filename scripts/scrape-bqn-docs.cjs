#!/usr/bin/env node
/**
 * BQN Help Documentation Scraper
 * 
 * Scrapes concise help documentation from https://mlochbaum.github.io/BQN/help/
 * and generates a JSON file for use in hover docs.
 * 
 * Usage: node scripts/scrape-bqn-docs.cjs
 * 
 * Run this periodically to update the docs if upstream changes.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://mlochbaum.github.io/BQN/help';
const HELP_INDEX_URL = `${BASE_URL}/index.html`;

// Output paths
const OUTPUT_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'bqn-docs.json');
const JS_OUTPUT_FILE = path.join(__dirname, '..', 'src', 'bqn-docs.js');

/**
 * Fetch a URL and return the HTML content
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                fetchUrl(res.headers.location).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            
            // Set encoding to UTF-8 to properly handle multi-byte characters
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Simple HTML entity decoder
 */
function decodeEntities(text) {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
    return decodeEntities(html.replace(/<[^>]+>/g, '').trim());
}

/**
 * Parse the help index page to extract all primitives and their help URLs
 */
function parseHelpIndex(html) {
    const primitives = [];
    
    // Find all table rows with Symbol | Link
    const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    
    for (const rowMatch of rowMatches) {
        const rowHtml = rowMatch[1];
        const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        
        if (cells.length >= 2) {
            const symbolCell = cells[0][1];
            const linkCell = cells[1][1];
            
            // Extract symbol - handle escaped characters
            let symbol = stripHtml(symbolCell).trim();
            // Handle escaped backslash, pipe, etc.
            if (symbol === '\\-') symbol = '-';
            if (symbol === '\\|') symbol = '|';
            if (symbol === '\\=') symbol = '=';
            if (symbol === '\\>') symbol = '>';
            if (symbol === '\\`') symbol = '`';
            if (symbol === '\\[') symbol = '[';
            if (symbol === '\\]') symbol = ']';
            if (symbol === ', or ⋄') symbol = '⋄'; // Handle separator
            
            // Extract link and name
            const linkMatch = linkCell.match(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
            if (linkMatch) {
                const helpUrl = new URL(linkMatch[1], BASE_URL + '/').href;
                const name = stripHtml(linkMatch[2]);
                
                if (symbol && symbol.length <= 2) {
                    primitives.push({
                        glyph: symbol,
                        name,
                        helpUrl,
                    });
                }
            }
        }
    }
    
    return primitives;
}

/**
 * Extract help content from a help page
 */
function parseHelpPage(html, glyph) {
    const result = {
        descriptions: [],
        examples: [],
        fullDocUrl: null,
    };
    
    // Extract full documentation link
    const fullDocMatch = html.match(/href="([^"]*doc[^"]+)"[^>]*>.*?full documentation/i);
    if (fullDocMatch) {
        result.fullDocUrl = fullDocMatch[1];
        if (!result.fullDocUrl.startsWith('http')) {
            result.fullDocUrl = 'https://mlochbaum.github.io/BQN/' + result.fullDocUrl.replace(/^\.\.\//, '');
        }
    }
    
    // Remove SVG, script, style, and pre (code) blocks before extracting descriptions
    let cleanHtml = html
        .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '')  // Remove code blocks from description parsing
        .replace(/<a[^>]*>→full documentation<\/a>/gi, '')  // Remove full doc links
        .replace(/→full documentation/gi, '');  // Remove plain text full doc links
    
    // Extract paragraphs (descriptions)
    const paragraphs = cleanHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    
    for (const p of paragraphs) {
        let text = stripHtml(p);
        // Skip navigation, links-only paragraphs, or very short ones
        if (text.length < 10) continue;
        if (text.match(/^→full documentation$/i)) continue;
        if (text.match(/^\[.*\]$/)) continue;
        if (text.includes('github') && text.length < 50) continue;
        
        // Clean up the text - remove "→full documentation" remnants
        text = text.replace(/→full documentation/gi, '').trim();
        text = text.replace(/\s+/g, ' ').trim();
        
        if (text.length > 10) {
            result.descriptions.push(text);
        }
    }
    
    // Extract code examples from <pre> blocks (from original html)
    const preBlocks = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/gi) || [];
    
    for (const block of preBlocks) {
        let code = stripHtml(block);
        // Clean up whitespace but preserve structure
        code = code.replace(/^\s+/gm, ' ').trim();
        
        if (code.length > 3 && code.length < 300) {
            result.examples.push(code);
        }
    }
    
    return result;
}

/**
 * Determine the type of primitive based on glyph and name
 */
function determineType(glyph, name) {
    // Syntax elements
    const syntaxGlyphs = '←⇐↩⋄·→(){}[];:?⟨⟩‿•𝕨𝕩𝔽𝔾𝕊𝕣¯π∞@#\'"';
    if (syntaxGlyphs.includes(glyph)) return 'syntax';
    
    // 1-modifiers (superscript-like)
    const mod1Glyphs = '˙˜˘¨⌜⁼´˝`';
    if (mod1Glyphs.includes(glyph)) return '1-modifier';
    
    // 2-modifiers
    const mod2Glyphs = '∘○⊸⟜⌾⊘◶⎊⎉⚇⍟';
    if (mod2Glyphs.includes(glyph)) return '2-modifier';
    
    // Everything else is a function
    return 'function';
}

/**
 * Generate JavaScript module content from the docs data
 */
function generateJsModule(data) {
    const header = `/**
 * BQN Help Documentation
 * 
 * Auto-generated by scripts/scrape-bqn-docs.cjs
 * Source: ${data._meta.source}
 * Generated: ${data._meta.scrapedAt}
 * 
 * Run \`node scripts/scrape-bqn-docs.cjs\` to update from upstream docs.
 */

`;

    const metaExport = `/**
 * Metadata about the scraped documentation
 */
export const bqnDocsMeta = ${JSON.stringify(data._meta, null, 4)};

`;

    const docsExport = `/**
 * BQN primitive documentation for hover tooltips
 * 
 * Structure for each glyph:
 * - glyph: The primitive character
 * - type: 'function' | '1-modifier' | '2-modifier' | 'syntax'
 * - name: Display name (e.g., "Deshape, Reshape")
 * - description: Concise description from help docs
 * - example: Code example
 * - docUrl: Link to full documentation
 */
export const bqnGlyphDocs = ${JSON.stringify(data.primitives, null, 4)};

`;

    const helperFunction = `/**
 * Get formatted hover content for a BQN glyph
 * 
 * @param {string} glyph - The primitive glyph
 * @returns {Object|null} Formatted hover content or null if not found
 */
export function getBqnHoverContent(glyph) {
    const doc = bqnGlyphDocs[glyph];
    if (!doc) return null;
    
    return {
        glyph: doc.glyph,
        type: doc.type,
        title: doc.name,
        description: doc.description,
        example: doc.example,
        docUrl: doc.docUrl,
    };
}

export default bqnGlyphDocs;
`;

    return header + metaExport + docsExport + helperFunction;
}

/**
 * Main scraping function
 */
async function scrapeBqnDocs() {
    console.log('BQN Help Documentation Scraper');
    console.log('==============================\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch help index
    console.log(`Fetching ${HELP_INDEX_URL}...`);
    const indexHtml = await fetchUrl(HELP_INDEX_URL);
    
    // Parse the index
    console.log('Parsing help index...');
    const primitives = parseHelpIndex(indexHtml);
    console.log(`Found ${primitives.length} primitives\n`);
    
    // Fetch each help page
    console.log(`Fetching ${primitives.length} help pages...`);
    const docs = {};
    let fetched = 0;
    
    for (const prim of primitives) {
        try {
            const helpHtml = await fetchUrl(prim.helpUrl);
            const helpContent = parseHelpPage(helpHtml, prim.glyph);
            
            const type = determineType(prim.glyph, prim.name);
            
            docs[prim.glyph] = {
                glyph: prim.glyph,
                type,
                name: prim.name,
                description: helpContent.descriptions.slice(0, 2).join(' ') || prim.name,
                example: helpContent.examples[0] || null,
                docUrl: helpContent.fullDocUrl || prim.helpUrl,
            };
            
        } catch (err) {
            console.error(`  Failed to fetch ${prim.helpUrl}: ${err.message}`);
            // Still add basic info
            docs[prim.glyph] = {
                glyph: prim.glyph,
                type: determineType(prim.glyph, prim.name),
                name: prim.name,
                description: prim.name,
                example: null,
                docUrl: prim.helpUrl,
            };
        }
        
        fetched++;
        if (fetched % 10 === 0) {
            console.log(`  Fetched ${fetched}/${primitives.length} pages`);
        }
        
        // Small delay to be nice to the server
        await new Promise(r => setTimeout(r, 50));
    }
    
    // Add metadata
    const output = {
        _meta: {
            language: 'BQN',
            source: HELP_INDEX_URL,
            scrapedAt: new Date().toISOString(),
            version: '2.0.0',
        },
        primitives: docs,
    };
    
    // Write JSON output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\nWrote ${Object.keys(docs).length} primitives to ${OUTPUT_FILE}`);
    
    // Generate JavaScript module
    const jsContent = generateJsModule(output);
    fs.writeFileSync(JS_OUTPUT_FILE, jsContent);
    console.log(`Wrote JavaScript module to ${JS_OUTPUT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    const functions = Object.values(docs).filter(d => d.type === 'function');
    const mod1 = Object.values(docs).filter(d => d.type === '1-modifier');
    const mod2 = Object.values(docs).filter(d => d.type === '2-modifier');
    const syntax = Object.values(docs).filter(d => d.type === 'syntax');
    console.log(`  Functions: ${functions.length}`);
    console.log(`  1-modifiers: ${mod1.length}`);
    console.log(`  2-modifiers: ${mod2.length}`);
    console.log(`  Syntax: ${syntax.length}`);
    
    return output;
}

// Run if called directly
if (require.main === module) {
    scrapeBqnDocs().catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
}

module.exports = { scrapeBqnDocs };
