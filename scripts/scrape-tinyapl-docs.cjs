#!/usr/bin/env node
/**
 * TinyAPL Documentation Scraper
 * 
 * Fetches primitive documentation from the TinyAPL GitHub repository
 * and generates a JavaScript module for use in hover docs.
 * 
 * Usage: node scripts/scrape-tinyapl-docs.cjs
 * 
 * Run this periodically to update the docs if upstream changes.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// TinyAPL GitHub raw URLs (using beta branch for latest features)
const BRANCH = 'beta';
const BASE_URL = `https://raw.githubusercontent.com/RubenVerg/tinyapl/${BRANCH}/docs/pages`;
const PRIMITIVES_INDEX_URL = `https://api.github.com/repos/RubenVerg/tinyapl/contents/docs/pages/primitives?ref=${BRANCH}`;
const GLYPHS_INDEX_URL = `https://api.github.com/repos/RubenVerg/tinyapl/contents/docs/pages/glyphs?ref=${BRANCH}`;

// Output path
const JS_OUTPUT_FILE = path.join(__dirname, '..', 'src', 'tinyapl-docs.js');

/**
 * Fetch a URL and return the content
 */
function fetchUrl(url, isJson = false) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'ArrayBox-DocScraper/1.0',
                'Accept': isJson ? 'application/json' : 'text/plain'
            }
        };
        
        https.get(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                fetchUrl(res.headers.location, isJson).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(isJson ? JSON.parse(data) : data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Parse MDX frontmatter
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };
    
    const frontmatterText = match[1];
    const body = match[2];
    
    const frontmatter = {};
    for (const line of frontmatterText.split('\n')) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith("'") && value.endsWith("'")) || 
                (value.startsWith('"') && value.endsWith('"'))) {
                value = value.slice(1, -1);
            }
            frontmatter[key] = value;
        }
    }
    
    return { frontmatter, body };
}

/**
 * Extract description from MDX body (first paragraph or meaningful content)
 */
function extractDescription(body) {
    // Remove code blocks
    let text = body.replace(/```[\s\S]*?```/g, '');
    // Keep inline code content but remove backticks
    text = text.replace(/`([^`]+)`/g, '$1');
    // Remove headers
    text = text.replace(/^#+\s+.*$/gm, '');
    // Remove "Also on this glyph" sections
    text = text.replace(/Also on this glyph[\s\S]*?(?=\n\n|$)/g, '');
    // Remove links but keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Split into paragraphs and get first meaningful one
    const paragraphs = text.split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 20 && !p.startsWith('*') && !p.startsWith('-') && !p.startsWith('|'));
    
    if (paragraphs.length > 0) {
        // Clean up and truncate
        let desc = paragraphs[0].replace(/\s+/g, ' ').trim();
        // Truncate to reasonable length
        if (desc.length > 400) {
            desc = desc.substring(0, 397) + '...';
        }
        return desc;
    }
    
    return '';
}

/**
 * Extract example from MDX body
 */
function extractExample(body) {
    // Look for TinyAPL code blocks
    const codeMatch = body.match(/```(?:tinyapl)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
        const lines = codeMatch[1].split('\n').slice(0, 3);
        return lines.join('\n').trim();
    }
    return '';
}

/**
 * Determine primitive type based on name/content
 */
function determineType(name, body) {
    const lowerName = name.toLowerCase();
    const lowerBody = body.toLowerCase();
    
    // Operators/modifiers
    if (lowerBody.includes('operator') || lowerBody.includes('adverb') || 
        lowerBody.includes('conjunction') || lowerBody.includes('modifier')) {
        if (lowerBody.includes('dyadic') || lowerBody.includes('conjunction') || 
            lowerBody.includes('2-modifier')) {
            return 'conjunction';
        }
        return 'adverb';
    }
    
    // Combinators
    if (lowerName.includes('hook') || lowerName.includes('fork') || 
        lowerName.includes('atop') || lowerName.includes('over') ||
        lowerName.includes('bind') || lowerName.includes('commute')) {
        return 'combinator';
    }
    
    // Default to function
    return 'function';
}

/**
 * Map file name to readable name
 */
function fileNameToDisplayName(fileName) {
    return fileName
        .replace('.mdx', '')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Main scraping function
 */
async function scrapeTinyaplDocs() {
    console.log('Fetching TinyAPL documentation...\n');
    
    const glyphDocs = {};
    let fetchedCount = 0;
    let errorCount = 0;
    
    try {
        // Get list of primitive files
        console.log('Fetching primitives list...');
        const primitivesList = await fetchUrl(PRIMITIVES_INDEX_URL, true);
        
        // Process each primitive file
        for (const file of primitivesList) {
            if (!file.name.endsWith('.mdx')) continue;
            
            try {
                const content = await fetchUrl(file.download_url);
                const { frontmatter, body } = parseFrontmatter(content);
                
                const glyph = frontmatter.glyph;
                if (!glyph) continue;
                
                const name = frontmatter.name || fileNameToDisplayName(file.name);
                const pattern = frontmatter.pattern || '';
                const description = extractDescription(body);
                const example = extractExample(body);
                const type = determineType(name, body);
                
                // Check if this is monad vs dyad based on pattern
                const isMonad = pattern && !pattern.includes('←') && pattern.match(/^[a-z]←[^←]+$/);
                const isDyad = pattern && pattern.includes('x') && pattern.includes('y');
                
                const fileSlug = file.name.replace('.mdx', '');
                const docUrl = `https://beta.tinyapl.rubenverg.com/docs/primitive/${fileSlug}`;
                
                // Store with appropriate structure
                if (!glyphDocs[glyph]) {
                    glyphDocs[glyph] = {
                        glyph,
                        type,
                        docUrl: docUrl,
                        overloads: []
                    };
                }
                
                // Add this primitive as an overload
                const overload = {
                    name: name,
                    description: description,
                    example: example,
                    docUrl: docUrl
                };
                
                // Check if this is monad or dyad
                if (isMonad || (!isDyad && description)) {
                    overload.valence = 'monad';
                }
                if (isDyad) {
                    overload.valence = 'dyad';
                }
                
                glyphDocs[glyph].overloads.push(overload);
                
                // Also maintain backward-compatible monad/dyad fields
                if (isMonad || (!isDyad && description)) {
                    if (!glyphDocs[glyph].monad) {
                        glyphDocs[glyph].monad = {
                            name: name,
                            description: description,
                            example: example
                        };
                    }
                }
                if (isDyad) {
                    if (!glyphDocs[glyph].dyad) {
                        glyphDocs[glyph].dyad = {
                            name: name,
                            description: description,
                            example: example
                        };
                    }
                }
                
                // If neither clearly monad nor dyad, store as general info
                if (!glyphDocs[glyph].monad && !glyphDocs[glyph].dyad && !glyphDocs[glyph].name) {
                    glyphDocs[glyph].name = name;
                    glyphDocs[glyph].description = description;
                    glyphDocs[glyph].example = example;
                }
                
                fetchedCount++;
                process.stdout.write(`\rProcessed ${fetchedCount} primitives...`);
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (err) {
                errorCount++;
                console.error(`\nError processing ${file.name}: ${err.message}`);
            }
        }
        
        console.log(`\n\nFetched ${fetchedCount} primitives with ${errorCount} errors`);
        
        // Also try to fetch glyph pages for additional info
        console.log('\nFetching glyphs list...');
        try {
            const glyphsList = await fetchUrl(GLYPHS_INDEX_URL, true);
            let glyphFetched = 0;
            
            for (const file of glyphsList) {
                if (!file.name.endsWith('.mdx')) continue;
                
                try {
                    const content = await fetchUrl(file.download_url);
                    const { frontmatter, body } = parseFrontmatter(content);
                    
                    // Glyphs pages list which primitives use this glyph
                    // We can use this to enhance existing entries
                    const glyphChar = frontmatter.glyph;
                    if (glyphChar && !glyphDocs[glyphChar]) {
                        const name = frontmatter.name || fileNameToDisplayName(file.name);
                        glyphDocs[glyphChar] = {
                            glyph: glyphChar,
                            name: name,
                            type: 'syntax',
                            docUrl: `https://beta.tinyapl.rubenverg.com/docs/glyph/${file.name.replace('.mdx', '')}`
                        };
                        glyphFetched++;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                } catch (err) {
                    // Ignore errors for glyphs - they're supplementary
                }
            }
            
            console.log(`Added ${glyphFetched} additional glyphs`);
        } catch (err) {
            console.log('Could not fetch glyphs list (non-fatal)');
        }
        
    } catch (err) {
        console.error('Error fetching docs:', err.message);
        throw err;
    }
    
    return glyphDocs;
}

/**
 * Generate the JavaScript module
 */
function generateJsModule(glyphDocs) {
    const sortedGlyphs = Object.keys(glyphDocs).sort();
    
    let jsContent = `/**
 * TinyAPL Glyph Documentation
 * 
 * Auto-generated by scripts/scrape-tinyapl-docs.cjs
 * DO NOT EDIT MANUALLY
 * 
 * Source: https://beta.tinyapl.rubenverg.com/
 */

// Documentation metadata
export const tinyaplDocsMeta = {
    language: "TinyAPL",
    source: "https://beta.tinyapl.rubenverg.com/",
    scrapedAt: "${new Date().toISOString()}",
    version: "latest"
};

// Glyph documentation
export const tinyaplGlyphDocs = {\n`;

    for (const glyph of sortedGlyphs) {
        const doc = glyphDocs[glyph];
        jsContent += `    ${JSON.stringify(glyph)}: ${JSON.stringify(doc, null, 8).replace(/\n/g, '\n    ')},\n`;
    }

    jsContent += `};

/**
 * Get hover content for a TinyAPL glyph
 * @param {string} glyph - The glyph character
 * @returns {Object|null} Documentation object or null if not found
 */
export function getTinyaplHoverContent(glyph) {
    return tinyaplGlyphDocs[glyph] || null;
}
`;

    return jsContent;
}

/**
 * Main entry point
 */
async function main() {
    console.log('TinyAPL Documentation Scraper\n');
    console.log('=============================\n');
    
    try {
        const glyphDocs = await scrapeTinyaplDocs();
        
        console.log(`\nTotal unique glyphs: ${Object.keys(glyphDocs).length}`);
        
        // Generate JavaScript module
        const jsContent = generateJsModule(glyphDocs);
        fs.writeFileSync(JS_OUTPUT_FILE, jsContent, 'utf8');
        console.log(`\nGenerated: ${JS_OUTPUT_FILE}`);
        
        console.log('\nDone!');
    } catch (err) {
        console.error('\nFatal error:', err.message);
        process.exit(1);
    }
}

main();
