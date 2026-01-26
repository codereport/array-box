/**
 * Array Language Keyboard Overlay
 * A reusable visual keyboard component for array programming languages
 * 
 * Usage:
 *   import { ArrayKeyboard } from './keyboard.js';
 *   
 *   const keyboard = new ArrayKeyboard({
 *     keymap: { 'a': '⍺', 'w': '⍵', ... },
 *     language: 'apl',
 *     prefixKey: '`',
 *     fontFamily: "'APL', monospace",
 *     syntaxRules: { functions: [...], monadic: [...], ... },
 *     glyphNames: { '⍺': 'alpha', '⍵': 'omega', ... }  // Optional: for leader line labels
 *   });
 *   
 *   keyboard.toggle();  // Toggle visibility
 *   keyboard.show();    // Show keyboard
 *   keyboard.hide();    // Hide keyboard
 *   keyboard.destroy(); // Remove from DOM
 *   keyboard.toggleNames(); // Toggle leader line labels (press ? when visible)
 */

// Glyph names for BQN (monadic/dyadic names)
// Based on official BQN documentation (https://mlochbaum.github.io/BQN/doc/primitive.html)
export const bqnGlyphNames = {
    // Arithmetic
    '+': 'conjugate / add',
    '-': 'negate / subtract',
    '×': 'sign / multiply',
    '÷': 'reciprocal / divide',
    '⋆': 'exponential / power',
    '√': 'square root / root',
    '⌊': 'floor / minimum',
    '⌈': 'ceiling / maximum',
    '|': 'absolute value / modulus',
    '¬': 'not / span',
    
    // Logic/Comparison
    '∧': 'sort up / and',
    '∨': 'sort down / or',
    '<': 'enclose / less than',
    '>': 'merge / greater than',
    '≠': 'length / not equals',
    '=': 'rank / equals',
    '≤': 'less than or equal',
    '≥': 'greater than or equal',
    '≡': 'depth / match',
    '≢': 'shape / not match',
    
    // Structural
    '⊣': 'identity / left',
    '⊢': 'identity / right',
    '⥊': 'deshape / reshape',
    '∾': 'join / join to',
    '≍': 'solo / couple',
    '⋈': 'enlist / pair',
    '↑': 'prefixes / take',
    '↓': 'suffixes / drop',
    '↕': 'range / windows',
    '«': 'nudge back / shift after',
    '»': 'nudge / shift before',
    '⌽': 'reverse / rotate',
    '⍉': 'transpose / reorder axes',
    '/': 'indices / replicate',
    
    // Selection/Search
    '⊏': 'first cell / select',
    '⊐': 'classify / index of',
    '⊑': 'first / pick',
    '⊒': 'occurrence count / progressive index of',
    '∊': 'mark firsts / member of',
    '⍷': 'deduplicate / find',
    '⊔': 'group indices / group',
    '⍋': 'grade up / bins up',
    '⍒': 'grade down / bins down',
    '!': 'assert / assert with message',
    
    // 1-modifiers (green)
    '˙': 'constant',
    '˜': 'self / swap',
    '˘': 'cells',
    '¨': 'each',
    '⌜': 'table',
    '⁼': 'undo',
    '´': 'fold',
    '˝': 'insert',
    '`': 'scan',
    
    // 2-modifiers (yellow)
    '∘': 'atop',
    '○': 'over',
    '⊸': 'before / bind',
    '⟜': 'after / bind',
    '⌾': 'under',
    '⊘': 'valences',
    '◶': 'choose',
    '⎉': 'rank',
    '⚇': 'depth',
    '⍟': 'repeat',
    '⎊': 'catch',
    
    // Constants/Special
    '∞': 'infinity',
    '¯': 'negative',
    'π': 'pi',
    '←': 'define',
    '→': 'export',
    '↩': 'change',
    '⋄': 'separator',
    '·': 'nothing',
    
    // System values
    '•': 'system',
    
    // Strand/list
    '⟨': 'list start',
    '⟩': 'list end',
    '‿': 'strand',
};

// Glyph names for Dyalog APL (monadic/dyadic names)
// Based on official Dyalog terminology from APL Wiki (https://aplwiki.com/wiki/Dyalog_APL)
export const aplGlyphNames = {
    // Arithmetic
    '+': 'conjugate / plus',
    '-': 'negate / minus',
    '×': 'direction / times',
    '÷': 'reciprocal / divide',
    '|': 'magnitude / residue',
    '⌈': 'ceiling / maximum',
    '⌊': 'floor / minimum',
    '*': 'exponential / power',
    '⍟': 'natural log / logarithm',
    '!': 'factorial / binomial',
    '○': 'pi times / circular',
    '?': 'roll / deal',
    '~': 'not / without',
    
    // Logic
    '∧': 'lcm / and',
    '∨': 'gcd / or',
    '⍲': 'nand',
    '⍱': 'nor',
    
    // Comparison
    '<': 'less',
    '>': 'greater',
    '=': 'equal',
    '≠': 'unique mask / not equal',
    '≤': 'less or equal',
    '≥': 'greater or equal',
    '≡': 'depth / match',
    '≢': 'tally / not match',
    
    // Structural
    '⍴': 'shape / reshape',
    ',': 'ravel / catenate',
    '⍪': 'table / catenate first',
    '⌽': 'reverse / rotate',
    '⊖': 'reverse first / rotate first',
    '⍉': 'transpose',
    '↑': 'mix (first) / take',
    '↓': 'split / drop',
    '⊂': 'enclose / partitioned enclose',
    '⊃': 'first (mix) / pick',
    '⊆': 'nest / partition',
    '∊': 'enlist / membership',
    '∩': 'intersection',
    '∪': 'unique / union',
    '⊣': 'same / left',
    '⊢': 'same / right',
    
    // Search/Index
    '⍳': 'index generator / index of',
    '⍸': 'where / interval index',
    '⍋': 'grade up',
    '⍒': 'grade down',
    '⍷': 'find',
    '⌷': 'materialise / index',
    
    // Numeric/Math
    '⊥': 'decode (base)',
    '⊤': 'encode (represent)',
    '⌹': 'matrix inverse / matrix divide',
    
    // Operators/Modifiers
    '/': 'replicate / reduce',
    '\\': 'expand / scan',
    '⌿': 'replicate first / reduce first',
    '⍀': 'expand first / scan first',
    '¨': 'each',
    '⍨': 'commute / constant',
    '∘': 'beside / bind',
    '⍤': 'atop / rank',
    '⍥': 'over',
    '⍣': 'power operator',
    '@': 'at',
    '⌸': 'key',
    '⌺': 'stencil',
    '⍠': 'variant',
    '⌶': 'i-beam',
    
    // I/O & Evaluation
    '⍎': 'execute',
    '⍕': 'format',
    '⎕': 'quad',
    '⍞': 'quote-quad',
    
    // System/Special
    '⍬': 'zilde (empty)',
    '∇': 'del (function)',
    '∆': 'delta',
    '←': 'assign',
    '→': 'branch',
    '⋄': 'statement separator',
    '⍝': 'comment',
};

// Glyph names for Kap (monadic/dyadic names)
// Based on official Kap reference (https://kapdemo.dhsdevelopments.com/reference.html)
export const kapGlyphNames = {
    // Scalar/Arithmetic
    '+': 'conjugate / add',
    '-': 'negate / subtract',
    '×': 'angle (signum) / multiply',
    '÷': 'reciprocal / divide',
    '|': 'magnitude / modulo',
    '⌈': 'ceiling / max',
    '⌊': 'floor / min',
    '⋆': 'exponential / power',
    '⍟': 'natural log / log base',
    '!': 'gamma / binomial',
    '√': 'square root / root',
    '~': 'not / without',
    
    // Logic/Comparison
    '<': 'increase rank / less than',
    '>': 'decrease rank / greater than',
    '=': 'classify / equals',
    '≠': 'unique mask / not equals',
    '≤': 'less or equal',
    '≥': 'greater or equal',
    '≡': 'depth / compare equal',
    '≢': 'major axis size / compare not equal',
    '∧': 'sort up / logical and',
    '∨': 'sort down / logical or',
    '⍲': 'nand',
    '⍱': 'nor',
    
    // Structural
    '⍴': 'shape / reshape',
    '⍳': 'index generator / index of',
    '⍸': 'where / interval index',
    ',': 'ravel / concatenate',
    '⍪': 'table / concatenate first',
    '⍮': 'singleton / pair',
    '⌽': 'reverse / rotate',
    '⊖': 'reverse first / rotate first',
    '⍉': 'transpose / transpose by axis',
    '↑': 'take first / take',
    '↓': 'drop first / drop',
    '⊂': 'enclose / partition',
    '⊃': 'disclose (mix) / pick',
    '⊆': 'nest / partitioned enclose',
    '⊇': 'select',
    '⫇': 'group',
    '⌷': 'list to array / index lookup',
    '⊣': 'hide / left',
    '⊢': 'identity / right',
    
    // Selection/Search
    '∪': 'unique / union',
    '∩': 'intersection',
    '∊': 'enlist / member',
    '⍷': 'find',
    '⍋': 'grade up',
    '⍒': 'grade down',
    '⊥': 'decode',
    '⊤': 'encode',
    '?': 'roll / deal',
    '%': 'case',
    
    // Numeric/Math
    '⌹': 'matrix inverse / matrix divide',
    '…': 'range',
    '≬': 'create list',
    
    // Operators/Modifiers
    '/': 'replicate / reduce',
    '\\': 'scan',
    '⌿': 'replicate first / reduce first',
    '⍀': 'scan first',
    '¨': 'each',
    '⍨': 'commute / duplicate',
    '∘': 'compose',
    '⍤': 'rank',
    '⍥': 'over',
    '⍣': 'power operator',
    '⍢': 'structural under',
    '∵': 'derive bitwise',
    '∥': 'parallel',
    '˝': 'inverse',
    '⍰': 'conditional null',
    '«': 'fork (left)',
    '»': 'fork (right)',
    '∙': 'inner product',
    '⌻': 'outer product',
    '⍛': 'inverse compose',
    
    // I/O & Evaluation
    '⍎': 'parse number',
    '⍕': 'format',
    '⎕': 'quad',
    '⍞': 'quote-quad',
    
    // System/Special
    '⍬': 'zilde (empty)',
    '∇': 'function definition',
    'λ': 'lambda',
    '←': 'assign',
    '⇐': 'const assign',
    '→': 'guard',
    '⋄': 'statement sep',
    '⍝': 'comment',
    '⌸': 'key',
    '⌹': 'matrix inv / matrix div',
    '…': 'range',
    '≬': 'between',
    '⍺': 'left arg',
    '⍵': 'right arg',
};

// Glyph names for Uiua (single name per primitive)
export const uiuaGlyphNames = {
    // Stack
    '.': 'duplicate',
    ':': 'flip',
    '◌': 'pop',
    '⟜': 'on',
    '⊸': 'by',
    '⤙': 'with',
    '⤚': 'off',
    '◡': 'below',
    '˙': 'self',
    '˜': 'backward',
    
    // Constants
    'η': 'eta',
    'π': 'pi',
    'τ': 'tau',
    '∞': 'infinity',
    
    // Monadic Pervasive
    '¬': 'not',
    '±': 'sign',
    '¯': 'negate',
    '⌵': 'absolute',
    '√': 'sqrt',
    'ₑ': 'exponential',
    '∿': 'sine',
    '⌊': 'floor',
    '⌈': 'ceiling',
    '⁅': 'round',
    
    // Dyadic Pervasive
    '=': 'equals',
    '≠': 'not equals',
    '<': 'less than',
    '≤': 'less or equal',
    '>': 'greater than',
    '≥': 'greater or equal',
    '+': 'add',
    '-': 'subtract',
    '×': 'multiply',
    '÷': 'divide',
    '◿': 'modulo',
    'ⁿ': 'power',
    '↧': 'minimum',
    '↥': 'maximum',
    '∠': 'atangent',
    'ℂ': 'complex',
    
    // Monadic Array
    '⧻': 'length',
    '△': 'shape',
    '⇡': 'range',
    '⊢': 'first',
    '⊣': 'last',
    '⇌': 'reverse',
    '♭': 'deshape',
    '¤': 'fix',
    '⋯': 'bits',
    '⍉': 'transpose',
    '⍆': 'sort',
    '⍏': 'rise',
    '⍖': 'fall',
    '⊚': 'where',
    '⊛': 'classify',
    '◴': 'deduplicate',
    '⧆': 'occurrences',
    '□': 'box',
    
    // Dyadic Array
    '≍': 'match',
    '⊟': 'couple',
    '⊂': 'join',
    '⊏': 'select',
    '⊡': 'pick',
    '↯': 'reshape',
    '↙': 'take',
    '↘': 'drop',
    '↻': 'rotate',
    '⤸': 'orient',
    '▽': 'keep',
    '⌕': 'find',
    '⦷': 'mask',
    '∊': 'member',
    '⊗': 'indexof',
    '⊥': 'base',
    
    // Iterating Modifiers
    '≡': 'rows',
    '⍚': 'inventory',
    '⊞': 'table',
    '⧅': 'tuples',
    '⧈': 'stencil',
    '⍥': 'repeat',
    '⍢': 'do',
    
    // Aggregating Modifiers
    '/': 'reduce',
    '∧': 'fold',
    '\\': 'scan',
    '⊕': 'group',
    '⊜': 'partition',
    
    // Inversion Modifiers
    '⌅': 'obverse',
    '°': 'un',
    '⌝': 'anti',
    '⍜': 'under',
    
    // Planet (advanced stack)
    '∘': 'identity',
    '⋅': 'gap',
    '⊙': 'dip',
    '∩': 'both',
    '⊃': 'fork',
    '⊓': 'bracket',
    
    // Other Modifiers
    '◇': 'content',
    '⬚': 'fill',
    '⨬': 'switch',
    
    // Additional glyphs from syntax.js that might be on keyboard
    '‿': 'strand',
    '←': 'binding',
    '↚': 'private binding',
    '~': 'import',
    '|': 'signature',
    '#': 'comment',
    '?': 'stack trace',
    '!': 'assert',
    '``': 'format string',
    '@': 'character',
    '$': 'format/system',
    '⸮': 'recur',
};

// Default keyboard layout (US QWERTY)
const defaultLayout = [
    { keys: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='], shifted: ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'] },
    { keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'], shifted: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'] },
    { keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"], shifted: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'] },
    { keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'], shifted: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'] },
    { keys: [' '], shifted: [' '] }
];

// Default styles (can be overridden)
const defaultStyles = `
.array-keyboard-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1f2937;
    border: 2px solid #4b5563;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    display: none;
    max-width: 95vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.array-keyboard-overlay.show {
    display: block;
}

.array-keyboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #4b5563;
}

.array-keyboard-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: #e5e7eb;
    opacity: 0.8;
}

.array-keyboard-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #6b7280;
}

.array-keyboard-row {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
    justify-content: center;
    position: relative;
}

.array-keyboard-key {
    width: 48px;
    height: 48px;
    background: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: background-color 0.15s, border-color 0.15s;
}

.array-keyboard-key:hover {
    background: #374151;
    border-color: #6b7280;
}

.array-keyboard-key.space {
    width: 280px;
}

.array-keyboard-symbol {
    font-size: 20px;
    line-height: 1;
    color: #8BE9FD;
}

.array-keyboard-symbol.empty {
    color: transparent;
}

.array-keyboard-shift-symbol {
    font-size: 12px;
    position: absolute;
    top: 3px;
    left: 4px;
    line-height: 1;
    color: #FFB86C;
}

.array-keyboard-shift-symbol.empty {
    color: transparent;
}

.array-keyboard-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #6b7280;
    position: absolute;
    bottom: 3px;
    right: 4px;
}

/* Syntax highlighting colors */
.array-keyboard-symbol.syntax-function,
.array-keyboard-shift-symbol.syntax-function {
    color: #8BE9FD;
}

.array-keyboard-symbol.syntax-monadic,
.array-keyboard-shift-symbol.syntax-monadic {
    color: #50FA7B;
}

.array-keyboard-symbol.syntax-dyadic,
.array-keyboard-shift-symbol.syntax-dyadic {
    color: #F1FA8C;
}

.array-keyboard-symbol.syntax-modifier,
.array-keyboard-shift-symbol.syntax-modifier {
    color: #FFB86C;
}

.array-keyboard-symbol.syntax-number,
.array-keyboard-shift-symbol.syntax-number {
    color: #BD93F9;
}

.array-keyboard-symbol.syntax-comment,
.array-keyboard-shift-symbol.syntax-comment {
    color: #6272A4;
}

.array-keyboard-symbol.syntax-default,
.array-keyboard-shift-symbol.syntax-default {
    color: #F8F8F2;
}

/* Category view styles - wider for glyph reference */
.array-keyboard-overlay.category-view {
    width: 1000px;
    max-width: 130vw;
}

.array-keyboard-category-container {
    max-height: 70vh;
    overflow-y: auto;
}

.array-keyboard-category {
    margin-bottom: 16px;
}

.array-keyboard-category:last-child {
    margin-bottom: 0;
}

.array-keyboard-category-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #4b5563;
}

.array-keyboard-category-title.syntax-function { color: #8BE9FD; }
.array-keyboard-category-title.syntax-monadic { color: #50FA7B; }
.array-keyboard-category-title.syntax-dyadic { color: #F1FA8C; }
.array-keyboard-category-title.syntax-modifier { color: #FFB86C; }
.array-keyboard-category-title.syntax-number { color: #BD93F9; }
.array-keyboard-category-title.syntax-comment { color: #6272A4; }
.array-keyboard-category-title.syntax-default { color: #9CA3AF; }

.array-keyboard-glyph-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.array-keyboard-glyph {
    min-width: 32px;
    height: 32px;
    background: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    padding: 0 8px;
    transition: background-color 0.15s, border-color 0.15s;
}

.array-keyboard-glyph:hover {
    background: #374151;
    border-color: #6b7280;
}

.array-keyboard-glyph.syntax-function { color: #8BE9FD; }
.array-keyboard-glyph.syntax-monadic { color: #50FA7B; }
.array-keyboard-glyph.syntax-dyadic { color: #F1FA8C; }
.array-keyboard-glyph.syntax-modifier { color: #FFB86C; }
.array-keyboard-glyph.syntax-number { color: #BD93F9; }
.array-keyboard-glyph.syntax-comment { color: #6272A4; }
.array-keyboard-glyph.syntax-default { color: #F8F8F2; }

/* Leader lines overlay for glyph names */
.array-keyboard-names-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 10001;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
}

.array-keyboard-names-overlay.show {
    opacity: 1;
}

.array-keyboard-names-overlay svg {
    width: 100%;
    height: 100%;
}

.array-keyboard-leader-line {
    stroke: #6b7280;
    stroke-width: 1;
    fill: none;
    opacity: 0.6;
}

.array-keyboard-name-label {
    position: absolute;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    background: #374151;
    border: 1px solid #4b5563;
    white-space: nowrap;
    pointer-events: none;
}

.array-keyboard-name-label.syntax-function { color: #8BE9FD; border-color: #8BE9FD40; }
.array-keyboard-name-label.syntax-monadic { color: #50FA7B; border-color: #50FA7B40; }
.array-keyboard-name-label.syntax-dyadic { color: #F1FA8C; border-color: #F1FA8C40; }
.array-keyboard-name-label.syntax-modifier { color: #FFB86C; border-color: #FFB86C40; }
.array-keyboard-name-label.syntax-number { color: #BD93F9; border-color: #BD93F940; }
.array-keyboard-name-label.syntax-comment { color: #6272A4; border-color: #6272A440; }
.array-keyboard-name-label.syntax-default { color: #e5e7eb; border-color: #e5e7eb40; }

/* Hint for names toggle */
.array-keyboard-names-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #9CA3AF;
    margin-left: 12px;
}

.array-keyboard-names-hint kbd {
    background: #374151;
    border: 1px solid #4b5563;
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 10px;
}

/* Search input for filtering names */
.array-keyboard-search-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10002;
    display: none;
}

.array-keyboard-search-container.show {
    display: block;
}

.array-keyboard-search-input {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    padding: 8px 16px;
    border: 2px solid #4b5563;
    border-radius: 8px;
    background: #1f2937;
    color: #e5e7eb;
    width: 300px;
    outline: none;
    transition: border-color 0.2s;
}

.array-keyboard-search-input:focus {
    border-color: #8BE9FD;
}

.array-keyboard-search-input::placeholder {
    color: #6b7280;
}

.array-keyboard-search-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #6b7280;
    text-align: center;
    margin-top: 4px;
}

.array-keyboard-doc-links {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #6b7280;
    opacity: 0.5;
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: flex-end;
}

.array-keyboard-doc-links a {
    color: #8BE9FD;
    text-decoration: none;
    transition: opacity 0.2s;
}

.array-keyboard-doc-links a:hover {
    opacity: 1;
    text-decoration: underline;
}

.array-keyboard-doc-links .separator {
    color: #4b5563;
    margin: 0 6px;
}
`;

export class ArrayKeyboard {
    /**
     * Create a new ArrayKeyboard instance
     * @param {Object} options - Configuration options
     * @param {Object} options.keymap - Key to symbol mapping { 'a': '⍺', ... }
     * @param {string} options.language - Language name for display
     * @param {string} options.prefixKey - The prefix key (e.g., '`' or '\\')
     * @param {string} options.fontFamily - Font family for symbols
     * @param {Object} options.syntaxRules - Syntax highlighting rules { functions: [], monadic: [], ... }
     * @param {Array} options.layout - Custom keyboard layout (optional)
     * @param {string} options.toggleKey - Key to toggle keyboard (default: 'k')
     * @param {HTMLElement} options.container - Container element (default: document.body)
     * @param {boolean} options.enabled - Whether keyboard is enabled (default: true)
     * @param {string} options.displayMode - 'keyboard' or 'category' (default: 'keyboard')
     * @param {Object} options.glyphCategories - For category mode: { categoryName: { glyphs: [], label: '', syntaxClass: '' }, ... }
     * @param {string} options.categoryTitle - Custom title for category view (default: '{language} Glyphs')
     * @param {Object} options.glyphNames - Glyph to name mapping for leader line labels { '⍺': 'alpha', ... }
     * @param {Object} options.docLinks - Documentation links { layout: 'url', names: 'url' }
     */
    constructor(options = {}) {
        this.keymap = options.keymap || {};
        this.language = options.language || 'Array';
        this.prefixKey = options.prefixKey || '`';
        this.fontFamily = options.fontFamily || 'monospace';
        this.syntaxRules = options.syntaxRules || {};
        this.layout = options.layout || defaultLayout;
        this.toggleKey = options.toggleKey || 'k';
        this.container = options.container || document.body;
        this.enabled = options.enabled !== false; // Default to true
        this.displayMode = options.displayMode || 'keyboard';
        this.glyphCategories = options.glyphCategories || null;
        this.categoryTitle = options.categoryTitle || null;
        this.glyphNames = options.glyphNames || null;
        this.docLinks = options.docLinks || null;
        
        this.overlay = null;
        this.namesOverlay = null;
        this.namesVisible = false;
        this.searchInput = null;
        this.searchVisible = false;
        this.searchFilter = '';
        this.styleElement = null;
        this.keydownHandler = null;
        
        this._injectStyles();
        this._createOverlay();
        this._createNamesOverlay();
        this._setupKeyboardShortcuts();
    }
    
    /**
     * Inject CSS styles into the document
     */
    _injectStyles() {
        if (document.getElementById('array-keyboard-styles')) return;
        
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'array-keyboard-styles';
        this.styleElement.textContent = defaultStyles;
        document.head.appendChild(this.styleElement);
    }
    
    /**
     * Get syntax class for a symbol
     */
    _getSyntaxClass(symbol) {
        if (!symbol) return 'empty';
        
        const rules = this.syntaxRules;
        if (!rules) return 'syntax-default';
        
        if (rules.comments && rules.comments.includes(symbol)) {
            return 'syntax-comment';
        }
        if (rules.constants && rules.constants.includes(symbol)) {
            return 'syntax-number';
        }
        if (rules.functions && rules.functions.includes(symbol)) {
            return 'syntax-function';
        }
        if (rules.monadic && rules.monadic.includes(symbol)) {
            return 'syntax-monadic';
        }
        if (rules.dyadic && rules.dyadic.includes(symbol)) {
            return 'syntax-dyadic';
        }
        if (rules.modifier && rules.modifier.includes(symbol)) {
            return 'syntax-modifier';
        }
        
        return 'syntax-default';
    }
    
    /**
     * Create the keyboard overlay element
     */
    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'array-keyboard-overlay';
        
        // Add category-view class for wider display
        if (this.displayMode === 'category') {
            this.overlay.classList.add('category-view');
        }
        
        // Header
        const header = document.createElement('div');
        header.className = 'array-keyboard-header';
        
        const title = document.createElement('span');
        title.className = 'array-keyboard-title';
        if (this.displayMode === 'category') {
            title.textContent = this.categoryTitle || `${this.language} Glyphs`;
        } else {
            title.textContent = `${this.language} Keyboard (prefix: ${this.prefixKey})`;
        }
        
        const hintContainer = document.createElement('span');
        hintContainer.className = 'array-keyboard-hint';
        hintContainer.textContent = `Ctrl+${this.toggleKey.toUpperCase()} to toggle`;
        
        // Add names hint if glyphNames are available
        if (this.glyphNames) {
            const namesHint = document.createElement('span');
            namesHint.className = 'array-keyboard-names-hint';
            namesHint.innerHTML = `<kbd>n</kbd> names <kbd>s</kbd> search`;
            hintContainer.appendChild(namesHint);
        }
        
        header.appendChild(title);
        header.appendChild(hintContainer);
        this.overlay.appendChild(header);
        
        if (this.displayMode === 'category' && this.glyphCategories) {
            this._createCategoryView();
        } else {
            this._createKeyboardView();
        }
        
        this.container.appendChild(this.overlay);
    }
    
    /**
     * Create keyboard layout view
     */
    _createKeyboardView() {
        const rowsContainer = document.createElement('div');
        rowsContainer.className = 'array-keyboard-rows';
        
        const totalRows = this.layout.length;
        this.layout.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'array-keyboard-row';
            
            row.keys.forEach((key, keyIndex) => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'array-keyboard-key';
                
                if (key === ' ') {
                    keyDiv.classList.add('space');
                }
                
                const symbol = this.keymap[key] || '';
                const shiftedKey = row.shifted[keyIndex];
                const shiftedSymbol = this.keymap[shiftedKey] || '';
                
                // Key label
                let displayLabel = key;
                if (key === ' ') displayLabel = 'Space';
                else if (key === '\\') displayLabel = '\\';
                else if (key === "'") displayLabel = "'";
                else displayLabel = key.toUpperCase();
                
                // Syntax classes
                const shiftedSyntaxClass = shiftedSymbol ? this._getSyntaxClass(shiftedSymbol) : 'empty';
                const symbolSyntaxClass = symbol ? this._getSyntaxClass(symbol) : 'empty';
                
                // Shift symbol
                const shiftSymbolSpan = document.createElement('span');
                shiftSymbolSpan.className = `array-keyboard-shift-symbol ${shiftedSyntaxClass}`;
                shiftSymbolSpan.style.fontFamily = this.fontFamily;
                shiftSymbolSpan.textContent = shiftedSymbol || '';
                
                // Main symbol
                const symbolSpan = document.createElement('span');
                symbolSpan.className = `array-keyboard-symbol ${symbolSyntaxClass}`;
                symbolSpan.style.fontFamily = this.fontFamily;
                symbolSpan.textContent = symbol || '';
                
                // Key label
                const labelSpan = document.createElement('span');
                labelSpan.className = 'array-keyboard-label';
                labelSpan.textContent = displayLabel;
                
                keyDiv.appendChild(shiftSymbolSpan);
                keyDiv.appendChild(symbolSpan);
                keyDiv.appendChild(labelSpan);
                
                rowDiv.appendChild(keyDiv);
            });
            
            // Add doc links to the last row (space bar row)
            if (rowIndex === totalRows - 1 && this.docLinks && (this.docLinks.layout || this.docLinks.names)) {
                const linksContainer = document.createElement('span');
                linksContainer.className = 'array-keyboard-doc-links';
                
                const links = [];
                if (this.docLinks.layout) {
                    links.push(`<a href="${this.docLinks.layout}" target="_blank" rel="noopener">Layout</a>`);
                }
                if (this.docLinks.names) {
                    links.push(`<a href="${this.docLinks.names}" target="_blank" rel="noopener">Names</a>`);
                }
                linksContainer.innerHTML = links.join('<span class="separator">|</span>');
                
                rowDiv.appendChild(linksContainer);
            }
            
            rowsContainer.appendChild(rowDiv);
        });
        
        this.overlay.appendChild(rowsContainer);
    }
    
    /**
     * Create category-based glyph view
     */
    _createCategoryView() {
        const container = document.createElement('div');
        container.className = 'array-keyboard-category-container';
        
        for (const [categoryKey, categoryData] of Object.entries(this.glyphCategories)) {
            const { glyphs, label, syntaxClass } = categoryData;
            if (!glyphs || glyphs.length === 0) continue;
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'array-keyboard-category';
            
            // Category title
            const titleDiv = document.createElement('div');
            titleDiv.className = `array-keyboard-category-title ${syntaxClass || 'syntax-default'}`;
            titleDiv.textContent = label || categoryKey;
            categoryDiv.appendChild(titleDiv);
            
            // Glyph grid
            const glyphGrid = document.createElement('div');
            glyphGrid.className = 'array-keyboard-glyph-grid';
            
            for (const glyph of glyphs) {
                const glyphDiv = document.createElement('div');
                glyphDiv.className = `array-keyboard-glyph ${syntaxClass || 'syntax-default'}`;
                glyphDiv.style.fontFamily = this.fontFamily;
                glyphDiv.textContent = glyph;
                glyphGrid.appendChild(glyphDiv);
            }
            
            categoryDiv.appendChild(glyphGrid);
            container.appendChild(categoryDiv);
        }
        
        this.overlay.appendChild(container);
    }
    
    /**
     * Create the names overlay with leader lines
     */
    _createNamesOverlay() {
        if (!this.glyphNames) return;
        
        this.namesOverlay = document.createElement('div');
        this.namesOverlay.className = 'array-keyboard-names-overlay';
        
        // Create SVG for leader lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'array-keyboard-leader-svg');
        this.namesOverlay.appendChild(svg);
        
        this.container.appendChild(this.namesOverlay);
    }
    
    /**
     * Position labels with leader lines surrounding all four sides of the popup
     * For keyboard view: top row -> above, bottom row -> below, middle rows -> left/right
     * For category view: use angle-based positioning
     */
    _updateLeaderLines() {
        if (!this.namesOverlay || !this.glyphNames || !this.isVisible()) return;
        
        // Clear existing content
        this.namesOverlay.innerHTML = '';
        
        // Create SVG for lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.namesOverlay.appendChild(svg);
        
        // Collect all glyphs that need labels
        const glyphElements = [];
        
        // Helper function to check if name matches search filter (fuzzy)
        const matchesFilter = (name) => {
            if (!this.searchFilter) return true;
            return name.toLowerCase().includes(this.searchFilter);
        };
        
        if (this.displayMode === 'category') {
            // Category view: get all glyph divs
            this.overlay.querySelectorAll('.array-keyboard-glyph').forEach(el => {
                const glyph = el.textContent.trim();
                if (this.glyphNames[glyph]) {
                    const name = this.glyphNames[glyph];
                    if (matchesFilter(name)) {
                        glyphElements.push({ el, glyph, name });
                    }
                }
            });
        } else {
            // Keyboard view: get symbols from keys, track which row they're in
            const rows = this.overlay.querySelectorAll('.array-keyboard-row');
            const totalRows = rows.length;
            
            rows.forEach((rowEl, rowIndex) => {
                rowEl.querySelectorAll('.array-keyboard-key').forEach(keyEl => {
                    const symbolEl = keyEl.querySelector('.array-keyboard-symbol');
                    const shiftSymbolEl = keyEl.querySelector('.array-keyboard-shift-symbol');
                    
                    if (symbolEl) {
                        const glyph = symbolEl.textContent.trim();
                        if (glyph && this.glyphNames[glyph]) {
                            const name = this.glyphNames[glyph];
                            if (matchesFilter(name)) {
                                glyphElements.push({ 
                                    el: symbolEl, 
                                    glyph, 
                                    name, 
                                    isShifted: false,
                                    rowIndex,
                                    totalRows
                                });
                            }
                        }
                    }
                    if (shiftSymbolEl) {
                        const glyph = shiftSymbolEl.textContent.trim();
                        if (glyph && this.glyphNames[glyph]) {
                            const name = this.glyphNames[glyph];
                            if (matchesFilter(name)) {
                                glyphElements.push({ 
                                    el: shiftSymbolEl, 
                                    glyph, 
                                    name, 
                                    isShifted: true,
                                    rowIndex,
                                    totalRows
                                });
                            }
                        }
                    }
                });
            });
        }
        
        if (glyphElements.length === 0) return;
        
        // Get overlay bounds for positioning
        const overlayRect = this.overlay.getBoundingClientRect();
        const margin = 25;
        const labelHeight = 20;
        
        // Determine which side each glyph's label should go to
        const centerX = overlayRect.left + overlayRect.width / 2;
        const centerY = overlayRect.top + overlayRect.height / 2;
        
        const labels = glyphElements.map(item => {
            const rect = item.el.getBoundingClientRect();
            const glyphCenterX = rect.left + rect.width / 2;
            const glyphCenterY = rect.top + rect.height / 2;
            
            // Estimate label width based on name length (will be measured after creation)
            const estimatedLabelWidth = item.name.length * 7 + 12;
            
            let side;
            
            if (this.displayMode === 'category') {
                // Category view: use angle-based positioning
                const dx = glyphCenterX - centerX;
                const dy = glyphCenterY - centerY;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                if (angle >= -45 && angle < 45) {
                    side = 'right';
                } else if (angle >= 45 && angle < 135) {
                    side = 'bottom';
                } else if (angle >= -135 && angle < -45) {
                    side = 'top';
                } else {
                    side = 'left';
                }
            } else {
                // Keyboard view: use row-based positioning
                // Row 0 (number row) -> top
                // Row 1-2 (QWERTY + home row) -> left/right based on X position
                // Row 3-4 (ZXCV row + space bar) -> bottom
                const rowIndex = item.rowIndex;
                const totalRows = item.totalRows;
                
                if (rowIndex === 0) {
                    // Number row only -> labels above
                    side = 'top';
                } else if (rowIndex >= totalRows - 2) {
                    // Bottom two rows -> labels below
                    side = 'bottom';
                } else {
                    // QWERTY and home rows -> left/right based on position
                    // Split at 60% to put more labels on the left
                    const splitPoint = overlayRect.left + overlayRect.width * 0.6;
                    side = glyphCenterX < splitPoint ? 'left' : 'right';
                }
            }
            
            return {
                ...item,
                glyphX: glyphCenterX,
                glyphY: glyphCenterY,
                labelWidth: estimatedLabelWidth,
                side
            };
        });
        
        // Group labels by side
        const sides = {
            top: labels.filter(l => l.side === 'top').sort((a, b) => a.glyphX - b.glyphX),
            right: labels.filter(l => l.side === 'right').sort((a, b) => a.glyphY - b.glyphY),
            bottom: labels.filter(l => l.side === 'bottom').sort((a, b) => a.glyphX - b.glyphX),
            left: labels.filter(l => l.side === 'left').sort((a, b) => a.glyphY - b.glyphY)
        };
        
        // Cap left and right sides at 13 labels each
        // Overflow goes to top or bottom based on which is closer
        const maxSideLabels = 13;
        const overflowToTopOrBottom = (labelGroup, sideName) => {
            if (labelGroup.length <= maxSideLabels) return;
            
            // Sort by distance from vertical center - keep the middle ones, overflow the edges
            const centerY = overlayRect.top + overlayRect.height / 2;
            labelGroup.sort((a, b) => Math.abs(a.glyphY - centerY) - Math.abs(b.glyphY - centerY));
            
            // Keep the first maxSideLabels (closest to center)
            const overflow = labelGroup.splice(maxSideLabels);
            
            // Move overflow to top or bottom based on Y position
            overflow.forEach(item => {
                if (item.glyphY < centerY) {
                    item.side = 'top';
                    sides.top.push(item);
                } else {
                    item.side = 'bottom';
                    sides.bottom.push(item);
                }
            });
            
            // Re-sort the side group by Y
            labelGroup.sort((a, b) => a.glyphY - b.glyphY);
        };
        
        overflowToTopOrBottom(sides.left, 'left');
        overflowToTopOrBottom(sides.right, 'right');
        
        // Re-sort top and bottom by X after overflow additions
        sides.top.sort((a, b) => a.glyphX - b.glyphX);
        sides.bottom.sort((a, b) => a.glyphX - b.glyphX);
        
        // Position labels on each side with multiple tiers if needed
        const positionHorizontalLabels = (labelGroup, isTop) => {
            if (labelGroup.length === 0) return;
            
            const availableWidth = overlayRect.width + 300;
            const startX = overlayRect.left - 150;
            
            // Calculate total width needed
            let totalWidth = 0;
            labelGroup.forEach(item => totalWidth += item.labelWidth + 8);
            
            // Determine number of tiers needed
            const numTiers = Math.ceil(totalWidth / availableWidth);
            const tierHeight = labelHeight + 8;
            
            // Assign items to tiers (distribute evenly)
            const itemsPerTier = Math.ceil(labelGroup.length / numTiers);
            
            labelGroup.forEach((item, i) => {
                const tier = Math.floor(i / itemsPerTier);
                const indexInTier = i % itemsPerTier;
                const itemsInThisTier = Math.min(itemsPerTier, labelGroup.length - tier * itemsPerTier);
                
                // Base Y position with tier offset
                if (isTop) {
                    item.labelY = overlayRect.top - margin - labelHeight - (numTiers - 1 - tier) * tierHeight;
                } else {
                    item.labelY = overlayRect.bottom + margin + tier * tierHeight;
                }
                
                // Spread horizontally within tier based on glyph X
                const relativeX = (item.glyphX - overlayRect.left) / overlayRect.width;
                item.labelX = overlayRect.left + relativeX * overlayRect.width - item.labelWidth / 2;
            });
            
            // Resolve collisions within each tier
            for (let tier = 0; tier < numTiers; tier++) {
                const tierItems = labelGroup.filter((_, i) => Math.floor(i / itemsPerTier) === tier);
                const minSpacing = 6;
                
                for (let i = 1; i < tierItems.length; i++) {
                    const prev = tierItems[i - 1];
                    const curr = tierItems[i];
                    const prevRight = prev.labelX + prev.labelWidth;
                    if (curr.labelX < prevRight + minSpacing) {
                        curr.labelX = prevRight + minSpacing;
                    }
                }
                
                // Center the tier if it overflows
                if (tierItems.length > 0) {
                    const first = tierItems[0];
                    const last = tierItems[tierItems.length - 1];
                    const groupRight = last.labelX + last.labelWidth;
                    const groupLeft = first.labelX;
                    
                    if (groupRight > startX + availableWidth) {
                        const shift = groupRight - (startX + availableWidth);
                        tierItems.forEach(item => item.labelX -= shift);
                    }
                    if (first.labelX < startX) {
                        const shift = startX - first.labelX;
                        tierItems.forEach(item => item.labelX += shift);
                    }
                }
            }
        };
        
        const positionVerticalLabels = (labelGroup, isLeft) => {
            if (labelGroup.length === 0) return;
            
            const baseX = isLeft ? overlayRect.left - margin : overlayRect.right + margin;
            
            // Use fixed spacing regardless of label count
            const fixedSpacing = labelHeight + 8;
            const totalHeight = (labelGroup.length - 1) * fixedSpacing;
            // Center vertically but shift up a bit
            const groupStartY = overlayRect.top + (overlayRect.height - totalHeight) / 2 - 10;
            
            const startY = overlayRect.top - 30;
            const maxY = overlayRect.bottom + 30;
            
            labelGroup.forEach((item, i) => {
                item.labelY = groupStartY + i * fixedSpacing;
                // For left labels, store the right edge position (baseX)
                // For right labels, store the left edge position (baseX)
                item.labelBaseX = baseX;
            });
            
            // Ensure we don't overflow top
            if (labelGroup.length > 0 && labelGroup[0].labelY < startY) {
                const shift = startY - labelGroup[0].labelY;
                labelGroup.forEach(l => l.labelY += shift);
            }
            
            // Ensure we don't overflow bottom
            if (labelGroup.length > 0) {
                const last = labelGroup[labelGroup.length - 1];
                if (last.labelY > maxY) {
                    const overflow = last.labelY - maxY;
                    labelGroup.forEach(l => l.labelY -= overflow);
                }
            }
        };
        
        positionHorizontalLabels(sides.top, true);
        positionHorizontalLabels(sides.bottom, false);
        positionVerticalLabels(sides.left, true);
        positionVerticalLabels(sides.right, false);
        
        // Create labels first, then measure and position, then create leader lines
        const allLabels = [...sides.top, ...sides.right, ...sides.bottom, ...sides.left];
        const labelElements = [];
        
        // First pass: create all labels with visibility hidden to measure actual widths
        allLabels.forEach(item => {
            const label = document.createElement('div');
            label.className = `array-keyboard-name-label ${this._getSyntaxClass(item.glyph)}`;
            label.textContent = item.name;
            label.style.visibility = 'hidden';
            label.style.position = 'absolute';
            label.style.top = `${item.labelY}px`;
            
            // For horizontal labels, use the pre-calculated labelX
            // For vertical labels, we'll adjust after measuring
            if (item.side === 'top' || item.side === 'bottom') {
                label.style.left = `${item.labelX}px`;
            } else {
                // Temporarily position for measurement
                label.style.left = '0px';
            }
            
            this.namesOverlay.appendChild(label);
            labelElements.push({ label, item });
        });
        
        // Second pass: measure actual widths and reposition left/right labels
        labelElements.forEach(({ label, item }) => {
            const actualWidth = label.getBoundingClientRect().width;
            item.actualWidth = actualWidth;
            
            if (item.side === 'left') {
                // Position so right edge aligns with baseX
                item.labelX = item.labelBaseX - actualWidth;
                label.style.left = `${item.labelX}px`;
            } else if (item.side === 'right') {
                // Position so left edge aligns with baseX
                item.labelX = item.labelBaseX;
                label.style.left = `${item.labelX}px`;
            }
            
            // Make visible
            label.style.visibility = 'visible';
        });
        
        // Third pass: create leader lines using actual measured widths
        labelElements.forEach(({ label, item }) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('class', 'array-keyboard-leader-line');
            
            const startX = item.glyphX;
            const startY = item.glyphY;
            const actualWidth = item.actualWidth || item.labelWidth;
            
            // Calculate endpoint based on side
            let endX, endY, d;
            const labelCenterX = item.labelX + actualWidth / 2;
            const labelCenterY = item.labelY + labelHeight / 2;
            
            switch (item.side) {
                case 'top':
                    endX = labelCenterX;
                    endY = item.labelY + labelHeight;
                    d = `M ${startX} ${startY} C ${startX} ${startY - 30}, ${endX} ${endY + 30}, ${endX} ${endY}`;
                    break;
                case 'bottom':
                    endX = labelCenterX;
                    endY = item.labelY;
                    d = `M ${startX} ${startY} C ${startX} ${startY + 30}, ${endX} ${endY - 30}, ${endX} ${endY}`;
                    break;
                case 'left':
                    // Connect to right edge of label
                    endX = item.labelX + actualWidth;
                    endY = labelCenterY;
                    d = `M ${startX} ${startY} C ${startX - 40} ${startY}, ${endX + 40} ${endY}, ${endX} ${endY}`;
                    break;
                case 'right':
                    // Connect to left edge of label
                    endX = item.labelX;
                    endY = labelCenterY;
                    d = `M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX - 40} ${endY}, ${endX} ${endY}`;
                    break;
            }
            
            line.setAttribute('d', d);
            svg.appendChild(line);
        });
    }
    
    /**
     * Show names overlay with leader lines
     */
    showNames() {
        if (!this.namesOverlay || !this.glyphNames) return;
        
        this._updateLeaderLines();
        this.namesOverlay.classList.add('show');
        this.namesVisible = true;
    }
    
    /**
     * Hide names overlay
     */
    hideNames() {
        if (!this.namesOverlay) return;
        
        this.namesOverlay.classList.remove('show');
        this.namesVisible = false;
        this.hideSearch();
    }
    
    /**
     * Create the search input element
     */
    _createSearchInput() {
        if (this.searchInput) return;
        
        const container = document.createElement('div');
        container.className = 'array-keyboard-search-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'array-keyboard-search-input';
        input.placeholder = 'Filter names...';
        input.autocomplete = 'off';
        input.spellcheck = false;
        
        // Filter as user types
        input.addEventListener('input', () => {
            this.searchFilter = input.value.toLowerCase();
            this._updateLeaderLines();
        });
        
        const hint = document.createElement('div');
        hint.className = 'array-keyboard-search-hint';
        hint.textContent = 'ESC to close';
        
        container.appendChild(input);
        container.appendChild(hint);
        this.container.appendChild(container);
        
        this.searchInput = input;
        this.searchContainer = container;
    }
    
    /**
     * Show search input
     */
    showSearch() {
        if (!this.namesVisible) return;
        
        this._createSearchInput();
        this.searchContainer.classList.add('show');
        this.searchVisible = true;
        this.searchInput.value = '';
        this.searchFilter = '';
        this.searchInput.focus();
    }
    
    /**
     * Hide search input
     */
    hideSearch() {
        if (!this.searchContainer) return;
        
        this.searchContainer.classList.remove('show');
        this.searchVisible = false;
        this.searchFilter = '';
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        // Re-render without filter
        if (this.namesVisible) {
            this._updateLeaderLines();
        }
    }
    
    /**
     * Toggle search input
     */
    toggleSearch() {
        if (this.searchVisible) {
            this.hideSearch();
        } else {
            this.showSearch();
        }
    }
    
    /**
     * Toggle names overlay visibility
     */
    toggleNames() {
        if (this.namesVisible) {
            this.hideNames();
        } else {
            this.showNames();
        }
    }
    
    /**
     * Check if names are currently visible
     */
    areNamesVisible() {
        return this.namesVisible;
    }
    
    /**
     * Setup keyboard shortcuts
     */
    _setupKeyboardShortcuts() {
        this.keydownHandler = (e) => {
            // Only respond if enabled
            if (!this.enabled) return;
            
            // Don't intercept if search input is focused
            if (this.searchInput && document.activeElement === this.searchInput) {
                // ESC to close search
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hideSearch();
                    return;
                }
                // Let other keys go through to the search input
                return;
            }
            
            // Ctrl+toggleKey to toggle keyboard visibility
            if (e.ctrlKey && (e.key === this.toggleKey || e.key === this.toggleKey.toUpperCase())) {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
                return;
            }
            
            // Only handle remaining shortcuts if keyboard is visible
            if (!this.isVisible()) return;
            
            // 'n' to toggle names (if glyphNames available)
            if ((e.key === 'n' || e.key === 'N') && this.glyphNames && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleNames();
                return;
            }
            
            // 's' to toggle search (if names are visible)
            if ((e.key === 's' || e.key === 'S') && this.namesVisible && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSearch();
                return;
            }
            
            // ESC to close (search first, then names, then keyboard)
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (this.searchVisible) {
                    this.hideSearch();
                } else if (this.namesVisible) {
                    this.hideNames();
                } else {
                    this.hide();
                }
                return;
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler, true);
    }
    
    /**
     * Enable the keyboard
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disable the keyboard (hides it and ignores shortcuts)
     */
    disable() {
        this.enabled = false;
        this.hide();
    }
    
    /**
     * Recreate the overlay (for display mode changes)
     */
    recreateOverlay() {
        const wasVisible = this.isVisible();
        const namesWereVisible = this.namesVisible;
        
        if (this.overlay) {
            this.overlay.remove();
        }
        if (this.namesOverlay) {
            this.namesOverlay.remove();
        }
        
        this._createOverlay();
        this._createNamesOverlay();
        
        if (wasVisible) {
            this.show();
            if (namesWereVisible) {
                this.showNames();
            }
        }
    }
    
    /**
     * Check if keyboard is visible
     */
    isVisible() {
        return this.overlay && this.overlay.classList.contains('show');
    }
    
    /**
     * Show the keyboard
     */
    show() {
        if (this.overlay) {
            this.overlay.classList.add('show');
        }
    }
    
    /**
     * Hide the keyboard
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
        }
        // Also hide names when hiding keyboard
        this.hideNames();
    }
    
    /**
     * Toggle keyboard visibility
     */
    toggle() {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Update the keymap and refresh the display
     */
    updateKeymap(keymap, language, prefixKey) {
        this.keymap = keymap;
        if (language) this.language = language;
        if (prefixKey) this.prefixKey = prefixKey;
        
        // Remove old overlay and create new one
        if (this.overlay) {
            const wasVisible = this.isVisible();
            this.overlay.remove();
            this._createOverlay();
            if (wasVisible) this.show();
        }
    }
    
    /**
     * Update syntax rules
     */
    updateSyntaxRules(syntaxRules) {
        this.syntaxRules = syntaxRules;
        // Refresh display
        if (this.overlay) {
            const wasVisible = this.isVisible();
            this.overlay.remove();
            this._createOverlay();
            if (wasVisible) this.show();
        }
    }
    
    /**
     * Update font family
     */
    updateFont(fontFamily) {
        this.fontFamily = fontFamily;
        if (this.overlay) {
            this.overlay.querySelectorAll('.array-keyboard-symbol, .array-keyboard-shift-symbol').forEach(el => {
                el.style.fontFamily = fontFamily;
            });
        }
    }
    
    /**
     * Remove keyboard from DOM and cleanup
     */
    destroy() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler, true);
        }
        if (this.overlay) {
            this.overlay.remove();
        }
        if (this.namesOverlay) {
            this.namesOverlay.remove();
        }
        if (this.searchContainer) {
            this.searchContainer.remove();
        }
        // Note: We don't remove styles as other instances might use them
    }
    
    /**
     * Update glyph names mapping
     * @param {Object} glyphNames - New glyph names mapping
     */
    updateGlyphNames(glyphNames) {
        this.glyphNames = glyphNames;
        
        // Recreate names overlay
        if (this.namesOverlay) {
            this.namesOverlay.remove();
        }
        this._createNamesOverlay();
        
        // Update header hint
        if (this.overlay) {
            const wasVisible = this.isVisible();
            this.overlay.remove();
            this._createOverlay();
            if (wasVisible) this.show();
        }
    }
}

// Export for different module systems
export default ArrayKeyboard;
