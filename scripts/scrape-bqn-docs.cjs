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

// Output path
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
 * Extract description and example from a content section
 */
function extractContentFromSection(sectionContent) {
    // Remove the "→full documentation" links for description extraction
    let sectionClean = sectionContent
        .replace(/<a[^>]*class="fulldoc"[^>]*>[\s\S]*?<\/a>/gi, '')
        .replace(/<a[^>]*>→full documentation<\/a>/gi, '')
        .replace(/→full documentation/gi, '');
    
    // Remove pre blocks for description extraction (but keep original for examples)
    const sectionForDesc = sectionClean.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '');
    
    // Extract paragraphs for description
    const paragraphs = sectionForDesc.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const descParts = [];
    
    for (const p of paragraphs) {
        let text = stripHtml(p);
        text = text.replace(/\s+/g, ' ').trim();
        
        // Skip very short or navigation text
        if (text.length < 10) continue;
        if (text.includes('github') && text.length < 50) continue;
        if (text.match(/^↗️?$/)) continue;
        
        descParts.push(text);
    }
    
    // Also extract list items if no good paragraphs found (handles pages like Under)
    if (descParts.length === 0 || descParts.every(d => d.length < 30)) {
        const listItems = sectionForDesc.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        const listParts = [];
        
        for (const li of listItems) {
            let text = stripHtml(li);
            text = text.replace(/\s+/g, ' ').trim();
            if (text.length >= 5) {
                listParts.push(text);
            }
        }
        
        if (listParts.length > 0) {
            // Combine list items as a description
            const listDesc = listParts.slice(0, 4).join('. ');
            if (listDesc.length > descParts.join(' ').length) {
                descParts.length = 0; // Clear existing short descriptions
                descParts.push(listDesc);
            }
        }
    }
    
    // Join description parts (usually 1-2 sentences)
    let description = descParts.slice(0, 3).join(' ');
    if (description.length > 400) {
        description = description.substring(0, 397) + '...';
    }
    
    // Extract first code example from this section
    let example = '';
    const preMatch = sectionContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (preMatch) {
        let code = stripHtml(preMatch[1]);
        code = code.trim();
        if (code.length > 3 && code.length < 500) {
            example = code;
        }
    }
    
    return { description, example };
}

/**
 * Extract help content from a help page
 * BQN help pages have various structures:
 * 1. Separate h2 sections for monad (𝕩:) and dyad (𝕨...𝕩:)
 * 2. Combined h2 for modifiers like "𝔽¨ 𝕩, 𝕨 𝔽¨ 𝕩: Each"
 * 3. No h2 sections, just body content (like Cells)
 * 4. Multiple sections without h2, split by "→full documentation" links
 */
function parseHelpPage(html, glyph) {
    const result = {
        monad: { description: '', example: '' },
        dyad: { description: '', example: '' },
    };
    
    // Remove SVG, script, style content
    let cleanHtml = html
        .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Try to find h2 sections first
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    let match;
    let foundH2 = false;
    
    while ((match = h2Regex.exec(cleanHtml)) !== null) {
        const headerContent = match[1];
        const sectionContent = match[2];
        
        // Strip HTML from header to check for monad/dyad pattern
        const headerText = stripHtml(headerContent);
        
        // Check for combined modifier pattern like "𝔽¨ 𝕩, 𝕨 𝔽¨ 𝕩: Each" or "𝔽⎉𝕘 𝕩, 𝕨 𝔽⎉𝕘 𝕩: Rank"
        // These have BOTH monad and dyad forms in the SAME header, separated by comma
        // The pattern is: monad form, dyad form (with comma in between)
        const isCombinedModifier = headerText.includes('𝔽') && 
                                   headerText.includes(',') && 
                                   headerText.includes('𝕨');
        
        if (isCombinedModifier) {
            foundH2 = true;
            // For combined modifiers, use the same content for both monad and dyad
            const content = extractContentFromSection(sectionContent);
            result.monad = content;
            result.dyad = { description: content.description, example: content.example };
            continue;
        }
        
        // Check if this is monad (𝕩: but not 𝕨...𝕩:) or dyad (𝕨...𝕩:)
        // Also check for modifier patterns with 𝔽
        const isMonad = (headerText.includes('𝕩') && !headerText.includes('𝕨')) ||
                       (headerText.includes('𝔽') && headerText.includes('𝕩') && !headerText.includes('𝕨'));
        const isDyad = headerText.includes('𝕨') && headerText.includes('𝕩');
        
        if (!isMonad && !isDyad) continue;
        
        foundH2 = true;
        const target = isMonad ? result.monad : result.dyad;
        const content = extractContentFromSection(sectionContent);
        target.description = content.description;
        target.example = content.example;
    }
    
    // If no h2 sections found, try to parse body content
    // This handles pages like Cells that have no h2 structure
    if (!foundH2) {
        // Try splitting by "→full documentation" links (handles Valences-style pages)
        const fullDocSplit = cleanHtml.split(/(?:<a[^>]*>)?→full documentation(?:<\/a>)?/i);
        
        if (fullDocSplit.length >= 2) {
            // Multiple sections separated by "→full documentation"
            // First section (before first link) is monad, second is dyad
            for (let i = 0; i < fullDocSplit.length && i < 2; i++) {
                const section = fullDocSplit[i];
                const content = extractContentFromSection(section);
                if (content.description || content.example) {
                    if (i === 0) {
                        result.monad = content;
                    } else {
                        result.dyad = content;
                    }
                }
            }
        } else {
            // Single section - extract from main body
            // Find content after navigation (after the help/index.html link)
            const bodyMatch = cleanHtml.match(/help\/index\.html[^<]*<\/a>\s*([\s\S]*)/i);
            if (bodyMatch) {
                const bodyContent = bodyMatch[1];
                const content = extractContentFromSection(bodyContent);
                // For single-section pages, treat as monad content (applies to both uses)
                result.monad = content;
                result.dyad = { description: content.description, example: content.example };
            }
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
 * 
 * Run \`node scripts/scrape-bqn-docs.cjs\` to update from upstream docs.
 * 
 * LICENSE ATTRIBUTION:
 * The documentation content in this file is derived from the BQN project.
 * Copyright (c) 2020, Marshall Lochbaum
 * Repository: https://github.com/mlochbaum/BQN
 * License: ISC License
 * See THIRD_PARTY_LICENSES.md for full license text.
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
    
    // Fetch help index
    console.log(`Fetching ${HELP_INDEX_URL}...`);
    const indexHtml = await fetchUrl(HELP_INDEX_URL);
    
    // Parse the index
    console.log('Parsing help index...');
    const primitives = parseHelpIndex(indexHtml);
    if (primitives.length < 50) throw new Error(`BQN help index looks incomplete (${primitives.length} entries)`);
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
            
            // Parse names - typically "MonadName, DyadName" or "MonadName / DyadName"
            const names = prim.name.split(/[,\/]/).map(n => n.trim());
            const monadName = names[0] || '';
            const dyadName = names[1] || '';
            
            const doc = {
                glyph: prim.glyph,
                type,
                docUrl: prim.helpUrl,  // Use help page URL, not full docs
            };
            
            // Add monadic info if available
            if (monadName) {
                doc.monad = {
                    name: monadName,
                    description: helpContent.monad.description || '',
                    example: helpContent.monad.example || null
                };
            }
            
            // Add dyadic info if available
            if (dyadName) {
                doc.dyad = {
                    name: dyadName,
                    description: helpContent.dyad.description || '',
                    example: helpContent.dyad.example || null
                };
            }
            
            docs[prim.glyph] = doc;
            
        } catch (err) {
            console.error(`  Failed to fetch ${prim.helpUrl}: ${err.message}`);
            throw err;
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
            version: '2.0.0',
        },
        primitives: docs,
    };
    
    // Generate JavaScript module
    const jsContent = generateJsModule(output);
    fs.writeFileSync(JS_OUTPUT_FILE, jsContent);
    console.log(`\nWrote ${Object.keys(docs).length} primitives to ${JS_OUTPUT_FILE}`);
    
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
