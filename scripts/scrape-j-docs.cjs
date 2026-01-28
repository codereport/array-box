#!/usr/bin/env node
/**
 * J Language Documentation Scraper
 * 
 * Scrapes primitive documentation from the J Wiki NuVoc pages
 * and generates a JS file for use in hover docs.
 * 
 * Usage: node scripts/scrape-j-docs.cjs
 * 
 * Run this periodically to update the docs if upstream changes.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://code.jsoftware.com';
const NUVOC_URL = `${BASE_URL}/wiki/NuVoc`;

// Output path
const JS_OUTPUT_FILE = path.join(__dirname, '..', 'src', 'j-docs.js');

/**
 * Fetch a URL and return the content
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : require('http');
        protocol.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                fetchUrl(res.headers.location).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            
            res.setEncoding('utf8');
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html) {
    return html
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#160;/g, ' ')  // Non-breaking space
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))  // Numeric entities
        .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))  // Hex entities
        .trim();
}

/**
 * J primitives mapping - glyph to wiki page and names
 * Based on NuVoc structure
 */
const jPrimitives = {
    // Verbs - Arithmetic
    '=': { page: 'eq', monad: 'Self-Classify', dyad: 'Equal', type: 'verb' },
    '<': { page: 'lt', monad: 'Box', dyad: 'Less Than', type: 'verb' },
    '<.': { page: 'ltdot', monad: 'Floor', dyad: 'Lesser Of (Min)', type: 'verb' },
    '<:': { page: 'ltco', monad: 'Decrement', dyad: 'Less Or Equal', type: 'verb' },
    '>': { page: 'gt', monad: 'Open', dyad: 'Greater Than', type: 'verb' },
    '>.': { page: 'gtdot', monad: 'Ceiling', dyad: 'Greater Of (Max)', type: 'verb' },
    '>:': { page: 'gtco', monad: 'Increment', dyad: 'Greater Or Equal', type: 'verb' },
    '+': { page: 'plus', monad: 'Conjugate', dyad: 'Plus', type: 'verb' },
    '+.': { page: 'plusdot', monad: 'Real/Imag', dyad: 'GCD (Or)', type: 'verb' },
    '+:': { page: 'plusco', monad: 'Double', dyad: 'Not-Or', type: 'verb' },
    '*': { page: 'star', monad: 'Signum', dyad: 'Times', type: 'verb' },
    '*.': { page: 'stardot', monad: 'Length/Angle', dyad: 'LCM (And)', type: 'verb' },
    '*:': { page: 'starco', monad: 'Square', dyad: 'Not-And', type: 'verb' },
    '-': { page: 'minus', monad: 'Negate', dyad: 'Minus', type: 'verb' },
    '-.': { page: 'minusdot', monad: 'Not', dyad: 'Less', type: 'verb' },
    '-:': { page: 'minusco', monad: 'Halve', dyad: 'Match', type: 'verb' },
    '%': { page: 'percent', monad: 'Reciprocal', dyad: 'Divide', type: 'verb' },
    '%.': { page: 'percentdot', monad: 'Matrix Inverse', dyad: 'Matrix Divide', type: 'verb' },
    '%:': { page: 'percentco', monad: 'Square Root', dyad: 'Root', type: 'verb' },
    '^': { page: 'hat', monad: 'Exponential', dyad: 'Power', type: 'verb' },
    '^.': { page: 'hatdot', monad: 'Natural Log', dyad: 'Logarithm', type: 'verb' },
    '$': { page: 'dollar', monad: 'Shape Of', dyad: 'Shape', type: 'verb' },
    '$.': { page: 'dollardot', monad: 'Sparse', dyad: 'Sparse', type: 'verb' },
    '~.': { page: 'tildedot', monad: 'Nub', dyad: null, type: 'verb' },
    '~:': { page: 'tildeco', monad: 'Nub Sieve', dyad: 'Not-Equal', type: 'verb' },
    '|': { page: 'bar', monad: 'Magnitude', dyad: 'Residue', type: 'verb' },
    '|.': { page: 'bardot', monad: 'Reverse', dyad: 'Rotate', type: 'verb' },
    '|:': { page: 'barco', monad: 'Transpose', dyad: 'Rearrange Axes', type: 'verb' },
    ',': { page: 'comma', monad: 'Ravel', dyad: 'Append', type: 'verb' },
    ',.': { page: 'commadot', monad: 'Ravel Items', dyad: 'Stitch', type: 'verb' },
    ',:': { page: 'commaco', monad: 'Itemize', dyad: 'Laminate', type: 'verb' },
    ';': { page: 'semi', monad: 'Raze', dyad: 'Link', type: 'verb' },
    ';:': { page: 'semico', monad: 'Words', dyad: 'Sequential Machine', type: 'verb' },
    '#': { page: 'number', monad: 'Tally', dyad: 'Copy', type: 'verb' },
    '#.': { page: 'numberdot', monad: 'Base 2', dyad: 'Base', type: 'verb' },
    '#:': { page: 'numberco', monad: 'Antibase 2', dyad: 'Antibase', type: 'verb' },
    '!': { page: 'bang', monad: 'Factorial', dyad: 'Out Of (Binomial)', type: 'verb' },
    '[': { page: 'squarelf', monad: 'Same', dyad: 'Left', type: 'verb' },
    ']': { page: 'squarert', monad: 'Same', dyad: 'Right', type: 'verb' },
    '{': { page: 'curlylf', monad: 'Catalogue', dyad: 'From', type: 'verb' },
    '{.': { page: 'curlylfdot', monad: 'Head', dyad: 'Take', type: 'verb' },
    '{:': { page: 'curlylfco', monad: 'Tail', dyad: null, type: 'verb' },
    '{::': { page: 'curlylfcoco', monad: 'Map', dyad: 'Fetch', type: 'verb' },
    '}': { page: 'curlyrt', monad: 'Item Amend', dyad: 'Amend', type: 'verb' },
    '}.': { page: 'curlyrtdot', monad: 'Behead', dyad: 'Drop', type: 'verb' },
    '}:': { page: 'curlyrtco', monad: 'Curtail', dyad: null, type: 'verb' },
    '?': { page: 'query', monad: 'Roll', dyad: 'Deal', type: 'verb' },
    '?.': { page: 'querydot', monad: 'Roll (fixed seed)', dyad: 'Deal (fixed seed)', type: 'verb' },
    'i.': { page: 'idot', monad: 'Integers', dyad: 'Index Of', type: 'verb' },
    'i:': { page: 'ico', monad: 'Steps', dyad: 'Index Of Last', type: 'verb' },
    'I.': { page: 'icapdot', monad: 'Indices', dyad: 'Interval Index', type: 'verb' },
    'j.': { page: 'jdot', monad: 'Imaginary', dyad: 'Complex', type: 'verb' },
    'o.': { page: 'odot', monad: 'Pi Times', dyad: 'Circle Function', type: 'verb' },
    'p.': { page: 'pdot', monad: 'Roots', dyad: 'Polynomial', type: 'verb' },
    'p:': { page: 'pco', monad: 'Primes', dyad: null, type: 'verb' },
    'q:': { page: 'qco', monad: 'Prime Factors', dyad: 'Prime Exponents', type: 'verb' },
    'r.': { page: 'rdot', monad: 'Angle', dyad: 'Polar', type: 'verb' },
    'x:': { page: 'xco', monad: 'Extended Precision', dyad: null, type: 'verb' },
    'A.': { page: 'acapdot', monad: 'Anagram Index', dyad: 'Anagram', type: 'verb' },
    'C.': { page: 'ccapdot', monad: 'Cycle-Direct', dyad: 'Permute', type: 'verb' },
    'e.': { page: 'edot', monad: 'Raze In', dyad: 'Member (In)', type: 'verb' },
    'E.': { page: 'ecapdot', monad: null, dyad: 'Find Matches', type: 'verb' },
    'L.': { page: 'lcapdot', monad: 'Level Of', dyad: null, type: 'verb' },
    's:': { page: 'sco', monad: 'Symbol', dyad: 'Symbol', type: 'verb' },
    'u:': { page: 'uco', monad: 'Unicode', dyad: 'Unicode', type: 'verb' },
    
    // Adverbs
    '~': { page: 'tilde', monad: 'Reflex', dyad: 'Passive', type: 'adverb' },
    '/': { page: 'slash', monad: 'Insert', dyad: 'Table', type: 'adverb' },
    '/.': { page: 'slashdot', monad: 'Oblique', dyad: 'Key', type: 'adverb' },
    '/:': { page: 'slashco', monad: 'Grade Up', dyad: 'Sort Up', type: 'adverb' },
    '\\': { page: 'bslash', monad: 'Prefix', dyad: 'Infix', type: 'adverb' },
    '\\.': { page: 'bslashdot', monad: 'Suffix', dyad: 'Outfix', type: 'adverb' },
    '\\:': { page: 'bslashco', monad: 'Grade Down', dyad: 'Sort Down', type: 'adverb' },
    '}': { page: 'curlyrt', monad: 'Item Amend', dyad: 'Amend', type: 'adverb' },
    'b.': { page: 'bdot', monad: 'Boolean/Bitwise', dyad: null, type: 'adverb' },
    'f.': { page: 'fdot', monad: 'Fix', dyad: null, type: 'adverb' },
    'M.': { page: 'mcapdot', monad: 'Memo', dyad: null, type: 'adverb' },
    't.': { page: 'tdot', monad: 'Run as Task', dyad: null, type: 'adverb' },
    
    // Conjunctions
    '^:': { page: 'hatco', monad: 'Power (of verb)', dyad: null, type: 'conjunction' },
    '.': { page: 'dot', monad: 'Determinant', dyad: 'Dot Product', type: 'conjunction' },
    ':': { page: 'cor', monad: 'Explicit', dyad: 'Explicit', type: 'conjunction' },
    ':.': { page: 'codot', monad: 'Obverse', dyad: null, type: 'conjunction' },
    '::': { page: 'coco', monad: 'Adverse', dyad: null, type: 'conjunction' },
    ';.': { page: 'semidot', monad: 'Cut', dyad: 'Cut', type: 'conjunction' },
    '!.': { page: 'bangdot', monad: 'Fit', dyad: null, type: 'conjunction' },
    '!:': { page: 'bangco', monad: 'Foreign', dyad: null, type: 'conjunction' },
    '"': { page: 'quote', monad: 'Rank', dyad: null, type: 'conjunction' },
    '".': { page: 'quotedot', monad: 'Do', dyad: 'Numbers', type: 'conjunction' },
    '":': { page: 'quoteco', monad: 'Default Format', dyad: 'Format', type: 'conjunction' },
    '`': { page: 'grave', monad: 'Tie (Gerund)', dyad: null, type: 'conjunction' },
    '`:': { page: 'graveco', monad: 'Evoke Gerund', dyad: null, type: 'conjunction' },
    '@': { page: 'at', monad: 'Atop', dyad: 'Atop', type: 'conjunction' },
    '@.': { page: 'atdot', monad: 'Agenda', dyad: null, type: 'conjunction' },
    '@:': { page: 'atco', monad: 'At', dyad: 'At', type: 'conjunction' },
    '&': { page: 'ampm', monad: 'Bond', dyad: 'Compose', type: 'conjunction' },
    '&.': { page: 'ampdot', monad: 'Under (Dual)', dyad: null, type: 'conjunction' },
    '&.:': { page: 'ampdotco', monad: 'Under', dyad: null, type: 'conjunction' },
    '&:': { page: 'ampco', monad: 'Appose', dyad: null, type: 'conjunction' },
    'd.': { page: 'ddot', monad: 'Derivative', dyad: null, type: 'conjunction' },
    'D.': { page: 'dcapdot', monad: 'Derivative', dyad: null, type: 'conjunction' },
    'D:': { page: 'dcapco', monad: 'Secant Slope', dyad: null, type: 'conjunction' },
    'F.': { page: 'fcap', monad: 'Fold', dyad: 'Fold', type: 'conjunction' },
    'F..': { page: 'fcap', monad: 'Fold', dyad: 'Fold', type: 'conjunction' },
    'F.:': { page: 'fcap', monad: 'Fold', dyad: 'Fold', type: 'conjunction' },
    'F:': { page: 'fcap', monad: 'Fold', dyad: 'Fold', type: 'conjunction' },
    'F:.': { page: 'fcap', monad: 'Fold', dyad: 'Fold', type: 'conjunction' },
    'F::': { page: 'fcap', monad: 'Fold', dyad: 'Fold', type: 'conjunction' },
    'H.': { page: 'hcapdot', monad: 'Hypergeometric', dyad: null, type: 'conjunction' },
    'L:': { page: 'lcapco', monad: 'Level At', dyad: null, type: 'conjunction' },
    'S:': { page: 'scapco', monad: 'Spread', dyad: null, type: 'conjunction' },
    't:': { page: 'tco', monad: 'Weighted Taylor', dyad: null, type: 'adverb' },
    'T.': { page: 'tcapdot', monad: 'Set Debug Thread', dyad: 'Threads/Tasks', type: 'conjunction' },
    'Z:': { page: 'zcapco', monad: 'Get Fold Status', dyad: 'Terminate Fold', type: 'conjunction' },
    
    // Special forms
    '$:': { page: 'dollarco', monad: 'Self-Reference', dyad: 'Self-Reference', type: 'verb' },
    '[.': { page: 'squarelfdot', monad: 'Lev', dyad: null, type: 'other' },
    '[:': { page: 'squarelfco', monad: 'Cap', dyad: null, type: 'other' },
    '].': { page: 'squarertdot', monad: 'Dex', dyad: null, type: 'other' },
    ']:': { page: 'squarertco', monad: 'Ident', dyad: null, type: 'other' },
    
    // Constants/Nouns
    '_': { page: 'under', monad: 'Negative Sign/Infinity', dyad: null, type: 'noun' },
    '_.': { page: 'underdot', monad: 'Indeterminate', dyad: null, type: 'noun' },
    'a.': { page: 'adot', monad: 'Alphabet', dyad: null, type: 'noun' },
    'a:': { page: 'aco', monad: 'Ace (Boxed Empty)', dyad: null, type: 'noun' },
};

/**
 * Fetch description from a wiki page
 * 
 * J Wiki pages have a consistent structure:
 * - Monad section: table with "glyph y" | Name, then Rank info, then <hr>, then description
 * - Dyad section: table with "x glyph y" | Name, then Rank info, then <hr>, then description
 */
async function fetchPrimitiveDoc(glyph, info) {
    const url = `${BASE_URL}/wiki/Vocabulary/${info.page}`;
    
    try {
        const html = await fetchUrl(url);
        
        let monadDesc = '';
        let dyadDesc = '';
        
        // Strategy: Find all Rank sections, which immediately precede the <hr> before descriptions
        // The HTML structure is: [table with glyph] [Rank info] <hr> [description] <hr> [common uses]...
        
        // Split by <hr> tags
        const sections = html.split(/<hr\s*\/?>/i);
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const nextSection = sections[i + 1] || '';
            
            // Check if this section has Rank info (indicates a definition section)
            const hasRankInfo = section.match(/Rank\s+(?:Infinity|\d|_)/i);
            if (!hasRankInfo) continue;
            
            // Check if this is a dyadic definition (look for "x glyph y" pattern)
            // Handle various HTML structures: <td><code>x %. y</code></td> or plain text
            // Note: &#160; is non-breaking space, \s won't match it, so we include it explicitly
            const isDyad = section.match(/>\s*x(?:\s|&#160;|&nbsp;)+\S+(?:\s|&#160;|&nbsp;)+y\s*</i) ||  // HTML: >x %. y<
                          section.match(/<(?:code|tt)>\s*x(?:\s|&#160;|&nbsp;)/i) ||         // <code>x ... or <tt>x ...
                          section.match(/`x\s+/i);                   // Markdown: `x ...
            
            // Check if this is a monadic definition (glyph y without leading x)
            // Look for pattern like ">%. y<" or "<code>%. y" where there's no x before the glyph
            const isMonad = !isDyad && (
                section.match(/>\s*[^x\s<>&][^\s<>]*(?:\s|&#160;|&nbsp;)+y\s*</i) ||   // HTML: >%. y<
                section.match(/<(?:code|tt)>\s*[^x\s][^\s<]*(?:\s|&#160;|&nbsp;)+y/i) ||      // <code>%. y or <tt>%. y
                section.match(/`[^x\s][^\s]*\s+y/i)                 // Markdown: `%. y
            );
            
            // Extract description from next section
            if (nextSection) {
                const desc = extractFirstDescription(nextSection);
                if (desc) {
                    if (isDyad && !dyadDesc) {
                        dyadDesc = desc;
                    } else if (isMonad && !monadDesc) {
                        monadDesc = desc;
                    } else if (!monadDesc && !isDyad) {
                        // Default to monad if we can't determine type
                        monadDesc = desc;
                    }
                }
            }
        }
        
        // Fallback: If still missing descriptions, try looking for specific patterns
        if (!monadDesc || !dyadDesc) {
            // Look for the dyadic anchor which J wiki uses
            const dyadAnchorMatch = html.match(/id="dyadic"[^>]*>[\s\S]*?<hr\s*\/?>([\s\S]*?)<hr/i);
            if (dyadAnchorMatch && !dyadDesc) {
                const desc = extractFirstDescription(dyadAnchorMatch[1]);
                if (desc) dyadDesc = desc;
            }
            
            // For monad, look for first description after first Rank that's not in dyadic section
            if (!monadDesc) {
                const firstRankMatch = html.match(/Rank\s+(?:Infinity|\d|_)[^<]*<\/a>[^<]*<hr\s*\/?>([\s\S]*?)<hr/i);
                if (firstRankMatch) {
                    const desc = extractFirstDescription(firstRankMatch[1]);
                    if (desc) monadDesc = desc;
                }
            }
        }
        
        // For conjunctions, adverbs, and other types that don't follow monad/dyad pattern,
        // try to extract the main description (first paragraph after the first <hr> following Rank info)
        if (!monadDesc && (info.type === 'conjunction' || info.type === 'adverb' || info.type === 'noun' || info.type === 'other')) {
            // Split by <hr> and find section after Rank info
            const hrSections = html.split(/<hr\s*\/?>/i);
            for (let i = 0; i < hrSections.length; i++) {
                const section = hrSections[i];
                if (section.match(/Rank\s+(?:Infinity|\d|_|depends)/i) || section.match(/WHY IS THIS IMPORTANT/i)) {
                    // Next section should have the description
                    const nextSection = hrSections[i + 1];
                    if (nextSection) {
                        const desc = extractFirstDescription(nextSection);
                        if (desc) {
                            monadDesc = desc;
                            break;
                        }
                    }
                }
            }
            
            // If still no description, try looking for any meaningful paragraph after the main table
            if (!monadDesc) {
                // Look for content after the main definition table
                const tableEndMatch = html.match(/<\/table>[\s\S]*?<hr\s*\/?>([\s\S]*?)<hr/i);
                if (tableEndMatch) {
                    const desc = extractFirstDescription(tableEndMatch[1]);
                    if (desc) monadDesc = desc;
                }
            }
        }
        
        return {
            monadDesc: monadDesc || '',
            dyadDesc: dyadDesc || '',
            docUrl: url
        };
    } catch (err) {
        console.error(`  Warning: Could not fetch ${url}: ${err.message}`);
        return {
            monadDesc: '',
            dyadDesc: '',
            docUrl: url
        };
    }
}

/**
 * Extract the first meaningful description paragraph from an HTML section
 */
function extractFirstDescription(html) {
    // Try to find the first paragraph
    const paraMatches = html.match(/<p>([^]*?)<\/p>/gi) || [];
    
    for (const paraHtml of paraMatches) {
        let text = stripHtml(paraHtml);
        
        // Skip navigation/header/footer/empty text
        if (text.includes('Down to:') || text.includes('Back to:') || 
            text.includes('Thru to:') || text.includes('>>') ||
            text.includes('Common uses') || text.includes('Common Uses') ||
            text.includes('Related Primitives') || text.includes('More Information') ||
            text.includes('Use These Combinations') ||
            text.includes('Retrieved from') ||
            text.includes('Categories:') ||
            text.includes('Jump to navigation') ||
            text.includes('Jump to search') ||
            text.length < 5) {
            continue;
        }
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Skip if it looks like a numbered list item that's not a description
        if (/^\d+\.\s*(Convert|Remove|To|When|Find|Create|Make|Split|Count)/i.test(text)) {
            continue;
        }
        
        // Skip if it looks like footer/metadata text
        if (text.match(/^Retrieved from\s/i) || 
            text.match(/mediawiki\/index\.php/i) ||
            text.match(/^Categories?:/i) ||
            text.match(/^Hidden categor/i)) {
            continue;
        }
        
        // Truncate if too long
        if (text.length > 300) {
            text = text.substring(0, 297) + '...';
        }
        
        return text;
    }
    
    // Fallback: try to find text directly (not in <p> tags)
    // Remove HTML tags and get first sentence-like content
    let plainText = stripHtml(html);
    const lines = plainText.split(/\n+/);
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 10 && trimmed.length < 300 &&
            !trimmed.includes('Common uses') && !trimmed.includes('Common Uses') &&
            !trimmed.includes('Related Primitives') &&
            !trimmed.includes('More Information') &&
            !trimmed.match(/^\d+\.\s*$/)) {
            return trimmed;
        }
    }
    
    return '';
}

/**
 * Build name from monad/dyad info
 */
function buildName(info) {
    if (info.monad && info.dyad) {
        return `${info.monad} / ${info.dyad}`;
    }
    return info.monad || info.dyad || '';
}

/**
 * Build fallback description from monad/dyad info
 */
function buildFallbackDescription(info) {
    let desc = '';
    
    if (info.monad) {
        desc += `Monad: ${info.monad}`;
    }
    if (info.dyad) {
        if (desc) desc += '. ';
        desc += `Dyad: ${info.dyad}`;
    }
    
    return desc;
}

/**
 * Generate the JavaScript module
 */
function generateJsModule(docs) {
    const jsContent = `/**
 * J Language Primitive Documentation
 * 
 * Auto-generated by scripts/scrape-j-docs.cjs
 * Source: https://code.jsoftware.com/wiki/NuVoc
 * Generated: ${new Date().toISOString()}
 * 
 * Run \`node scripts/scrape-j-docs.cjs\` to update from upstream docs.
 * 
 * LICENSE ATTRIBUTION:
 * The documentation content in this file is derived from the J Wiki (NuVoc).
 * Source: https://code.jsoftware.com/wiki/NuVoc
 * License: Creative Commons Attribution-ShareAlike
 * See THIRD_PARTY_LICENSES.md for full license text.
 */

export const jDocsMeta = {
    "language": "J",
    "source": "https://code.jsoftware.com/wiki/NuVoc",
    "scrapedAt": "${new Date().toISOString()}",
    "version": "1.0.0"
};

export const jGlyphDocs = ${JSON.stringify(docs, null, 4)};

/**
 * Get hover content for a J primitive
 * @param {string} glyph - The glyph to look up
 * @returns {object|null} - The documentation object or null if not found
 */
export function getJHoverContent(glyph) {
    return jGlyphDocs[glyph] || null;
}
`;
    return jsContent;
}

/**
 * Main scraping function
 */
async function scrapeJDocs() {
    console.log('J Language Documentation Scraper');
    console.log('=================================\n');
    
    const glyphs = Object.keys(jPrimitives);
    console.log(`Processing ${glyphs.length} primitives...\n`);
    
    const docs = {};
    let processed = 0;
    
    for (const [glyph, info] of Object.entries(jPrimitives)) {
        const fetched = await fetchPrimitiveDoc(glyph, info);
        
        const doc = {
            glyph: glyph,
            type: info.type,
            docUrl: fetched.docUrl
        };
        
        // Add monadic info if available
        if (info.monad) {
            doc.monad = {
                name: info.monad,
                description: fetched.monadDesc || ''
            };
        }
        
        // Add dyadic info if available
        if (info.dyad) {
            let dyadDesc = fetched.dyadDesc || '';
            
            // For conjunctions/adverbs, if dyad description looks like footer text,
            // use monad description instead (they often share the same description)
            if ((info.type === 'conjunction' || info.type === 'adverb') &&
                (dyadDesc.includes('Retrieved from') || 
                 dyadDesc.includes('mediawiki/index.php') ||
                 dyadDesc.includes('Categories:') ||
                 dyadDesc === '')) {
                dyadDesc = fetched.monadDesc || '';
            }
            
            doc.dyad = {
                name: info.dyad,
                description: dyadDesc
            };
        }
        
        docs[glyph] = doc;
        
        processed++;
        if (processed % 20 === 0) {
            console.log(`  Processed ${processed}/${glyphs.length} primitives`);
        }
        
        // Small delay to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Write JavaScript module
    const jsContent = generateJsModule(docs);
    fs.writeFileSync(JS_OUTPUT_FILE, jsContent);
    console.log(`\nWrote ${Object.keys(docs).length} primitives to ${JS_OUTPUT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    const verbs = Object.values(docs).filter(d => d.type === 'verb');
    const adverbs = Object.values(docs).filter(d => d.type === 'adverb');
    const conjunctions = Object.values(docs).filter(d => d.type === 'conjunction');
    const nouns = Object.values(docs).filter(d => d.type === 'noun');
    const other = Object.values(docs).filter(d => d.type === 'other');
    console.log(`  Verbs: ${verbs.length}`);
    console.log(`  Adverbs: ${adverbs.length}`);
    console.log(`  Conjunctions: ${conjunctions.length}`);
    console.log(`  Nouns: ${nouns.length}`);
    console.log(`  Other: ${other.length}`);
}

// Run the scraper
scrapeJDocs().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
