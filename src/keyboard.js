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

// Re-export BQN documentation for hover tooltips
export { bqnGlyphDocs, bqnDocsMeta, getBqnHoverContent } from './bqn-docs.js';

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
    '⇐': 'export',
    '↩': 'change',
    '⋄': 'separator',
    '·': 'nothing',
    '→': 'return',
    
    // System values
    '•': 'system',
    '⍎': 'evaluate',
    '⍕': 'format',
    
    // Strand/list
    '⟨': 'list start',
    '⟩': 'list end',
    '‿': 'strand',
    
    // Deprecated/Alternative glyphs
    '↙': 'take (deprecated)',
    '↖': 'drop (deprecated)',
    '⍳': 'iota (APL compat)',
    
    // Syntax elements
    '#': 'comment',
    '@': 'null character',
    '?': 'predicate',
    '.': 'field access',
    
    // Special names
    '𝕨': 'left argument',
    '𝕎': 'Left argument (function)',
    '𝕩': 'right argument',
    '𝕏': 'Right argument (function)',
    '𝕤': 'self reference',
    '𝕊': 'Self reference (function)',
    '𝕗': 'left operand',
    '𝔽': 'Left operand (function)',
    '𝕘': 'right operand',
    '𝔾': 'Right operand (function)',
    '𝕣': 'modifier self-reference',
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
    '¯': 'negative / high minus',
    '⍫': 'del tilde',
    '⍛': 'behind',
    '⍙': 'delta underbar',
    '_': 'underscore',
    
    // Syntax elements
    '⍺': 'left argument',
    '⍵': 'right argument',
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
    '¯': 'negative / high minus',
    '⍫': 'del tilde',
    '⍠': 'variant',
    '⍙': 'delta underbar',
    '_': 'underscore',
    
    // Kap-specific
    '⟦': 'open list',
    '⟧': 'close list',
    '⦻': 'circle stile',
    '⍓': 'grade up prefix',
    '⫽': 'double slash / parallel',
    
};

// Glyph names for J (monadic/dyadic names)
// Based on official J documentation (https://code.jsoftware.com/wiki/NuVoc)
export const jGlyphNames = {
    // Verbs - Single character
    '=': 'self-classify / equal',
    '<': 'box / lesser',
    '>': 'open / greater',
    '+': 'conjugate / plus',
    '*': 'signum / times',
    '-': 'negate / minus',
    '%': 'reciprocal / divide',
    '^': 'exponential / power',
    '$': 'shape of / shape',
    '~': 'reflex / passive',
    '|': 'magnitude / residue',
    ',': 'ravel / append',
    ';': 'raze / link',
    '#': 'tally / copy',
    '{': 'catalogue / from',
    '}': 'item amend / amend',
    '[': 'same / left',
    ']': 'same / right',
    '"': 'rank',
    '?': 'roll / deal',
    '!': 'factorial / out of',
    
    // Verb digraphs - Floor/Ceiling/Comparisons
    '<.': 'floor / min',
    '>.': 'ceiling / max',
    '<:': 'decrement / ≤',
    '>:': 'increment / ≥',
    
    // Verb digraphs - Arithmetic extensions
    '+.': 'real/imag / gcd (or)',
    '+:': 'double / not-or',
    '*.': 'length/angle / lcm (and)',
    '*:': 'square / not-and',
    '-.': 'not / less',
    '-:': 'halve / match',
    '%.': 'matrix inverse / matrix divide',
    '%:': 'square root / root',
    
    // Verb digraphs - Power/Log/Shape
    '^.': 'natural log / logarithm',
    '$.': 'sparse',
    '$:': 'self-reference',
    
    // Verb digraphs - Structural
    '|.': 'reverse / rotate',
    '|:': 'transpose / rearrange axes',
    '#.': 'base two / base',
    '#:': 'antibase two / antibase',
    '~.': 'nub',
    '~:': 'nub sieve / not-equal',
    
    // Verb digraphs - Selection
    '{.': 'head / take',
    '}.': 'behead / drop',
    '{:': 'tail',
    '}:': 'curtail',
    '{::': 'map / fetch',
    
    // Verb digraphs - Ravel/Append
    ',.': 'ravel items / stitch',
    ',:': 'itemize / laminate',
    ';.': 'cut',
    ';:': 'words / seq. machine',
    
    // Verb digraphs - Format/Execute
    '".': 'do / numbers',
    '":': 'default format / format',
    
    // Verb digraphs - Random
    '?.': 'roll (fixed seed)',
    
    // Named primitive verbs
    'i.': 'integers / index of',
    'i:': 'steps / index of last',
    'j.': 'imaginary / complex',
    'o.': 'pi times / circle function',
    'p.': 'roots / polynomial',
    'p..': 'poly derivative / poly integral',
    'p:': 'primes',
    'q:': 'prime factors / prime exponents',
    'r.': 'angle / polar',
    'A.': 'anagram index / anagram',
    'C.': 'cycle-direct / permute',
    'e.': 'raze in / member (in)',
    'E.': 'find matches',
    'I.': 'indices / interval index',
    'L.': 'level of',
    's:': 'symbol',
    'u:': 'unicode',
    'x:': 'extended precision',
    
    // Adverbs (1-modifiers)
    '/': 'insert / table',
    '\\': 'prefix / infix',
    '/.': 'oblique / key',
    '\\.': 'suffix / outfix',
    '/:': 'grade up / sort up',
    '\\:': 'grade down / sort down',
    'b.': 'boolean / bitwise',
    'f.': 'fix',
    'M.': 'memo',
    
    // Conjunctions (2-modifiers)
    '@': 'atop',
    '&': 'bond / compose',
    '`': 'tie (gerund)',
    ':': 'definition',
    '.': 'determinant / dot product',
    '@.': 'agenda / agent',
    '@:': 'at',
    '&.': 'under (dual)',
    '&:': 'appose',
    '&.:': 'under',
    '`:': 'evoke gerund',
    ':.': 'obverse',
    '::': 'adverse',
    '^:': 'power of verb',
    '!.': 'fit (customize)',
    '!:': 'foreign',
    'd.': 'derivative',
    'D.': 'derivative / secant',
    'D:': 'secant slope',
    'F.': 'fold',
    'F:': 'fold',
    'F..': 'fold',
    'F.:': 'fold',
    'F:.': 'fold',
    'F::': 'fold',
    'H.': 'hypergeometric',
    'L:': 'level at',
    'm.': 'modular arithmetic',
    'S:': 'spread',
    'T.': 'weighted taylor / taylor',
    'Z:': 'fold status / terminate fold',
    't.': 'run as task',
    
    // Constants/Special
    '_': 'negative / infinity',
    '__': 'negative infinity',
    '_.': 'indeterminate',
    '_:': 'constant infinity',
    'a.': 'alphabet',
    'a:': 'ace (boxed empty)',
    
    // Assignment
    '=.': 'is (local)',
    '=:': 'is (global)',
    
    // Comment
    'NB.': 'comment',
    
    // Constant functions
    '0:': 'constant 0',
    '1:': 'constant 1',
    '2:': 'constant 2',
    '3:': 'constant 3',
    '4:': 'constant 4',
    '5:': 'constant 5',
    '6:': 'constant 6',
    '7:': 'constant 7',
    '8:': 'constant 8',
    '9:': 'constant 9',
    '_1:': 'constant -1',
    '_2:': 'constant -2',
    '_9:': 'constant -9',
};

// Glyph names for Uiua (single name per primitive)
export const uiuaGlyphNames = {
    // Arguments - Manipulate function arguments
    '∘': 'identity',
    '◌': 'pop',
    '˙': 'self',
    '˜': 'backward',
    '⊙': 'dip',
    '⋅': 'gap',
    '⟜': 'on',
    '⊸': 'by',
    '⤙': 'with',
    '⤚': 'off',
    '◡': 'below',
    '∩': 'both',
    '⊃': 'fork',
    '⊓': 'bracket',
    
    // Constants
    'η': 'eta',
    'π': 'pi',
    'τ': 'tau',
    '∞': 'infinity',
    
    // Monadic Pervasive
    '¬': 'not',
    '±': 'sign',
    '¯': 'negate',
    '⨪': 'reciprocal',
    '⌵': 'absolute value',
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
    '◴': 'deduplicate',
    '⊛': 'classify',
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
    '∊': 'memberof',
    '⨂': 'indexin',
    '⊥': 'base',
    
    // Mapping Modifiers
    '≡': 'rows',
    '⍚': 'inventory',
    '⊞': 'table',
    '⧅': 'tuples',
    '⧈': 'stencil',
    '⊕': 'group',
    '⊜': 'partition',
    
    // Iterating Modifiers
    '/': 'reduce',
    '∧': 'fold',
    '\\': 'scan',
    '⍥': 'repeat',
    '⍢': 'do',
    
    // Inversion Modifiers
    '⌅': 'obverse',
    '°': 'un',
    '⌝': 'anti',
    '⍜': 'under',
    
    // Other Modifiers
    '⧋': 'evert',
    '◇': 'content',
    '⬚': 'fill',
    '⨬': 'switch',
    
    // Syntax
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
    display: flex;
    align-items: center;
    gap: 8px;
}

.array-keyboard-logo {
    height: 24px;
    width: auto;
    object-fit: contain;
}

.array-keyboard-title-link {
    font-size: 12px;
    color: var(--syntax-function, #8BE9FD);
    text-decoration: none;
    opacity: 0.6;
    transition: opacity 0.2s;
    margin-left: -2px;
    position: relative;
    top: -6px;
}

.array-keyboard-title-link:hover {
    opacity: 1;
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

.array-keyboard-key.search-match {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10B981;
}

.array-keyboard-glyph.search-match {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10B981;
}

.array-keyboard-key.space {
    width: 280px;
}

.array-keyboard-symbol {
    font-size: 20px;
    line-height: 1;
    color: var(--syntax-function, #8BE9FD);
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
    color: var(--syntax-modifier, #FFB86C);
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

/* Quadrant layout for symbol/number keys with ASCII primitives
 * Layout:
 * ┌─────────────────────┐
 * │ SHIFT+prefix  SHIFT+ASCII │  <- TOP ROW
 * │ prefix        ASCII/label │  <- BOTTOM ROW
 * └─────────────────────┘
 */
.array-keyboard-key.quadrant-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    padding: 0px;
    gap: 0;
}

.array-keyboard-quadrant-glyph {
    display: flex;
    font-size: 17px;
    line-height: 1;
}

/* Quadrant positioning - adjust padding to push glyphs toward center
 * All glyphs start at their outer corners, padding moves them inward
 * - Increase padding = move toward center of key
 * - Decrease padding (toward 0) = move toward corner of key
 */

/* Top-left: shifted prefix symbol (starts at top-left corner) */
.array-keyboard-quadrant-glyph.top-left {
    grid-column: 1;
    grid-row: 1;
    align-items: flex-start;
    justify-content: flex-start;
    padding-top: 6px;      /* increase = move down */
    padding-left: 11px;     /* increase = move right */
}

/* Top-right: shifted ASCII primitive (starts at top-right corner) */
.array-keyboard-quadrant-glyph.top-right {
    grid-column: 2;
    grid-row: 1;
    align-items: flex-start;
    justify-content: flex-end;
    padding-top: 6px;      /* increase = move down */
    padding-right: 9px;    /* increase = move left */
}

/* Bottom-left: unshifted prefix symbol (starts at bottom-left corner) */
.array-keyboard-quadrant-glyph.bottom-left {
    grid-column: 1;
    grid-row: 2;
    align-items: flex-end;
    justify-content: flex-start;
    padding-bottom: 2px;   /* increase = move up */
    padding-left: 11px;     /* increase = move right */
}

/* Bottom-right: unshifted ASCII primitive (starts at bottom-right corner) */
.array-keyboard-quadrant-glyph.bottom-right {
    grid-column: 2;
    grid-row: 2;
    align-items: flex-end;
    justify-content: flex-end;
    padding-bottom: 2px;   /* increase = move up */
    padding-right: 9px;    /* increase = move left */
}

/* Key label in quadrant layout - positioned in bottom-right area */
.array-keyboard-key.quadrant-layout .array-keyboard-label {
    position: absolute;
    bottom: 4px;
    right: 5px;
    font-size: 9px;
}

/* Syntax highlighting colors - use CSS variables with fallbacks for standalone use */
.array-keyboard-symbol.syntax-function,
.array-keyboard-shift-symbol.syntax-function,
.array-keyboard-quadrant-glyph.syntax-function {
    color: var(--syntax-function, #8BE9FD);
}

.array-keyboard-symbol.syntax-monadic,
.array-keyboard-shift-symbol.syntax-monadic,
.array-keyboard-quadrant-glyph.syntax-monadic {
    color: var(--syntax-monadic, #50FA7B);
}

.array-keyboard-symbol.syntax-dyadic,
.array-keyboard-shift-symbol.syntax-dyadic,
.array-keyboard-quadrant-glyph.syntax-dyadic {
    color: var(--syntax-dyadic, #F1FA8C);
}

.array-keyboard-symbol.syntax-modifier,
.array-keyboard-shift-symbol.syntax-modifier,
.array-keyboard-quadrant-glyph.syntax-modifier {
    color: var(--syntax-modifier, #FFB86C);
}

.array-keyboard-symbol.syntax-number,
.array-keyboard-shift-symbol.syntax-number,
.array-keyboard-quadrant-glyph.syntax-number {
    color: var(--syntax-number, #BD93F9);
}

.array-keyboard-symbol.syntax-comment,
.array-keyboard-shift-symbol.syntax-comment,
.array-keyboard-quadrant-glyph.syntax-comment {
    color: var(--syntax-comment, #6272A4);
}

.array-keyboard-symbol.syntax-default,
.array-keyboard-shift-symbol.syntax-default,
.array-keyboard-quadrant-glyph.syntax-default {
    color: var(--syntax-default, #F8F8F2);
}

/* Category view styles */
.array-keyboard-overlay.category-view {
    width: 695px;
    max-width: 95vw;
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

.array-keyboard-category-title.syntax-function { color: var(--syntax-function, #8BE9FD); }
.array-keyboard-category-title.syntax-monadic { color: var(--syntax-monadic, #50FA7B); }
.array-keyboard-category-title.syntax-dyadic { color: var(--syntax-dyadic, #F1FA8C); }
.array-keyboard-category-title.syntax-modifier { color: var(--syntax-modifier, #FFB86C); }
.array-keyboard-category-title.syntax-number { color: var(--syntax-number, #BD93F9); }
.array-keyboard-category-title.syntax-comment { color: var(--syntax-comment, #6272A4); }
.array-keyboard-category-title.syntax-default { color: var(--syntax-default, #9CA3AF); }

.array-keyboard-glyph-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

/* Compact category view */
.array-keyboard-category-container.compact {
    max-height: none;
}

.array-keyboard-compact-glyphs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
}

.array-keyboard-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid #4b5563;
}

.array-keyboard-legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.array-keyboard-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.array-keyboard-legend-dot.syntax-function { background-color: var(--syntax-function, #8BE9FD); }
.array-keyboard-legend-dot.syntax-monadic { background-color: var(--syntax-monadic, #50FA7B); }
.array-keyboard-legend-dot.syntax-dyadic { background-color: var(--syntax-dyadic, #F1FA8C); }
.array-keyboard-legend-dot.syntax-modifier { background-color: var(--syntax-modifier, #FFB86C); }
.array-keyboard-legend-dot.syntax-number { background-color: var(--syntax-number, #BD93F9); }
.array-keyboard-legend-dot.syntax-comment { background-color: var(--syntax-comment, #6272A4); }
.array-keyboard-legend-dot.syntax-default { background-color: var(--syntax-default, #9CA3AF); }
.array-keyboard-legend-dot.syntax-stack { background-color: var(--syntax-default, #F8F8F2); }

.array-keyboard-legend-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #9CA3AF;
}

.array-keyboard-glyph {
    width: 38px;
    height: 32px;
    background: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    padding: 0;
    transition: background-color 0.15s, border-color 0.15s;
}

/* Smaller font for trigraphs (3+ chars like NB.) to fit in fixed-width box */
.array-keyboard-glyph.trigraph {
    font-size: 13px;
}

.array-keyboard-glyph:hover {
    background: #374151;
    border-color: #6b7280;
}

.array-keyboard-glyph.syntax-function { color: var(--syntax-function, #8BE9FD); }
.array-keyboard-glyph.syntax-monadic { color: var(--syntax-monadic, #50FA7B); }
.array-keyboard-glyph.syntax-dyadic { color: var(--syntax-dyadic, #F1FA8C); }
.array-keyboard-glyph.syntax-modifier { color: var(--syntax-modifier, #FFB86C); }
.array-keyboard-glyph.syntax-number { color: var(--syntax-number, #BD93F9); }
.array-keyboard-glyph.syntax-comment { color: var(--syntax-comment, #6272A4); }
.array-keyboard-glyph.syntax-default { color: var(--syntax-default, #F8F8F2); }
.array-keyboard-glyph.syntax-stack { color: var(--syntax-default, #F8F8F2); }

/* Solid border with filled background for array functions */
.array-keyboard-glyph.array-glyph {
    background: #374151;
}

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

.array-keyboard-name-label.syntax-function { color: var(--syntax-function, #8BE9FD); border-color: color-mix(in srgb, var(--syntax-function, #8BE9FD) 25%, transparent); }
.array-keyboard-name-label.syntax-monadic { color: var(--syntax-monadic, #50FA7B); border-color: color-mix(in srgb, var(--syntax-monadic, #50FA7B) 25%, transparent); }
.array-keyboard-name-label.syntax-dyadic { color: var(--syntax-dyadic, #F1FA8C); border-color: color-mix(in srgb, var(--syntax-dyadic, #F1FA8C) 25%, transparent); }
.array-keyboard-name-label.syntax-modifier { color: var(--syntax-modifier, #FFB86C); border-color: color-mix(in srgb, var(--syntax-modifier, #FFB86C) 25%, transparent); }
.array-keyboard-name-label.syntax-number { color: var(--syntax-number, #BD93F9); border-color: color-mix(in srgb, var(--syntax-number, #BD93F9) 25%, transparent); }
.array-keyboard-name-label.syntax-comment { color: var(--syntax-comment, #6272A4); border-color: color-mix(in srgb, var(--syntax-comment, #6272A4) 25%, transparent); }
.array-keyboard-name-label.syntax-default { color: var(--syntax-default, #e5e7eb); border-color: color-mix(in srgb, var(--syntax-default, #e5e7eb) 25%, transparent); }
.array-keyboard-name-label.syntax-stack { color: var(--syntax-default, #F8F8F2); border-color: color-mix(in srgb, var(--syntax-default, #F8F8F2) 25%, transparent); }

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
    border-color: var(--syntax-function, #8BE9FD);
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
    color: var(--syntax-function, #8BE9FD);
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

/* Hover tooltip styles */
.array-keyboard-tooltip {
    position: fixed;
    background: #1f2937;
    border: 1px solid #4b5563;
    border-radius: 8px;
    padding: 14px 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    z-index: 10001;
    max-width: 440px;
    min-width: 280px;
    pointer-events: auto;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
    font-family: 'JetBrains Mono', monospace;
}

.array-keyboard-tooltip.show {
    opacity: 1;
    visibility: visible;
}

.array-keyboard-tooltip-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #374151;
}

.array-keyboard-tooltip-glyph {
    font-size: 28px;
    line-height: 1;
}

.array-keyboard-tooltip-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    color: #e5e7eb;
}

.array-keyboard-tooltip-type {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-left: auto;
    background: #374151;
    padding: 2px 6px;
    border-radius: 3px;
}

.array-keyboard-tooltip-desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #d1d5db;
    line-height: 1.6;
    margin-bottom: 10px;
}

.array-keyboard-tooltip-example {
    font-size: 12px;
    color: #e5e7eb;
    background: #111827;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    overflow-x: auto;
    margin-bottom: 8px;
}

.array-keyboard-tooltip-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--syntax-function, #8BE9FD);
    text-decoration: none;
    opacity: 0.7;
}

.array-keyboard-tooltip-link:hover {
    opacity: 1;
    text-decoration: underline;
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
     * @param {Object} options.docLinks - Documentation links { layout: 'url', primitives: 'url', syntax: 'url' }
     * @param {boolean} options.compactCategories - For category mode: show all glyphs inline with legend at bottom (default: false)
     * @param {string} options.logoPath - Path to logo image to display instead of text title (optional)
     * @param {Object} options.glyphDocs - Glyph documentation for hover tooltips { '⥊': { monadic: '...', ... }, ... }
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
        this.compactCategories = options.compactCategories || false;
        this.logoPath = options.logoPath || null;
        this.glyphDocs = options.glyphDocs || null;
        
        this.overlay = null;
        this.namesOverlay = null;
        this.namesVisible = false;
        this.searchInput = null;
        this.searchVisible = false;
        this.searchFilter = '';
        this.styleElement = null;
        this.keydownHandler = null;
        this.resizeHandler = null;
        this.tooltip = null;
        this.tooltipTimeout = null;
        
        this._injectStyles();
        this._createOverlay();
        this._createNamesOverlay();
        this._createTooltip();
        this._setupKeyboardShortcuts();
        this._setupResizeHandler();
    }
    
    /**
     * Setup resize handler to redraw leader lines on zoom/resize
     */
    _setupResizeHandler() {
        this.resizeHandler = () => {
            if (this.namesVisible) {
                this._updateLeaderLines();
            }
        };
        window.addEventListener('resize', this.resizeHandler);
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
     * Get syntax class from glyph categories (for category view)
     */
    _getCategorySyntaxClass(symbol) {
        if (!symbol || !this.glyphCategories) return null;
        
        for (const [categoryKey, categoryData] of Object.entries(this.glyphCategories)) {
            const { glyphs, syntaxClass } = categoryData;
            if (glyphs && glyphs.includes(symbol)) {
                return syntaxClass || 'syntax-default';
            }
        }
        return null;
    }
    
    /**
     * Get the appropriate syntax class for a symbol (category mode uses categories, keyboard mode uses syntax rules)
     */
    _getNameLabelSyntaxClass(symbol) {
        // In category mode, prefer the category syntax class
        if (this.displayMode === 'category' && this.glyphCategories) {
            const categoryClass = this._getCategorySyntaxClass(symbol);
            if (categoryClass) return categoryClass;
        }
        // Fall back to syntax rules
        return this._getSyntaxClass(symbol);
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
        
        // Title: use logo + text if logoPath provided, otherwise text only
        const titleElement = document.createElement('span');
        titleElement.className = 'array-keyboard-title';
        
        if (this.logoPath) {
            const logo = document.createElement('img');
            logo.className = 'array-keyboard-logo';
            logo.src = this.logoPath;
            logo.alt = this.language;
            titleElement.appendChild(logo);
            
            // Add descriptive text after logo
            const textSpan = document.createElement('span');
            if (this.displayMode === 'category') {
                textSpan.textContent = this.categoryTitle ? this.categoryTitle.replace(this.language, '').trim() : 'Glyphs';
            } else {
                textSpan.textContent = `Keyboard (prefix: ${this.prefixKey})`;
            }
            titleElement.appendChild(textSpan);
            
            // Add primitives link arrow for category mode
            if (this.displayMode === 'category' && this.docLinks && this.docLinks.primitives) {
                const arrowLink = document.createElement('a');
                arrowLink.className = 'array-keyboard-title-link';
                arrowLink.href = this.docLinks.primitives;
                arrowLink.target = '_blank';
                arrowLink.rel = 'noopener';
                arrowLink.innerHTML = '↗';
                arrowLink.title = 'View documentation';
                titleElement.appendChild(arrowLink);
            }
        } else {
            if (this.displayMode === 'category') {
                titleElement.textContent = this.categoryTitle || `${this.language} Glyphs`;
                
                // Add primitives link arrow for category mode (no logo)
                if (this.docLinks && this.docLinks.primitives) {
                    const arrowLink = document.createElement('a');
                    arrowLink.className = 'array-keyboard-title-link';
                    arrowLink.href = this.docLinks.primitives;
                    arrowLink.target = '_blank';
                    arrowLink.rel = 'noopener';
                    arrowLink.innerHTML = '↗';
                    arrowLink.title = 'View documentation';
                    titleElement.appendChild(arrowLink);
                }
            } else {
                titleElement.textContent = `${this.language} Keyboard (prefix: ${this.prefixKey})`;
            }
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
        
        header.appendChild(titleElement);
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
     * Check if a character is a primitive (has a glyph name)
     */
    _isPrimitive(char) {
        return char && this.glyphNames && this.glyphNames.hasOwnProperty(char);
    }
    
    /**
     * Check if a key is a letter key (a-z)
     */
    _isLetterKey(key) {
        return key && key.length === 1 && key >= 'a' && key <= 'z';
    }
    
    /**
     * Check if a key is a number key (0-9)
     */
    _isNumberKey(key) {
        return key && key.length === 1 && key >= '0' && key <= '9';
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
                
                // Determine key type and whether ASCII chars are primitives
                const isLetter = this._isLetterKey(key);
                const isNumber = this._isNumberKey(key);
                const baseAsciiIsPrimitive = this._isPrimitive(key);
                const shiftedAsciiIsPrimitive = this._isPrimitive(shiftedKey);
                
                // Use quadrant layout for symbol/number keys with ASCII primitives
                const useQuadrantLayout = !isLetter && (baseAsciiIsPrimitive || shiftedAsciiIsPrimitive);
                
                if (useQuadrantLayout) {
                    this._createQuadrantKey(keyDiv, {
                        key,
                        shiftedKey,
                        symbol,
                        shiftedSymbol,
                        displayLabel,
                        isNumber,
                        baseAsciiIsPrimitive,
                        shiftedAsciiIsPrimitive
                    });
                } else {
                    // Standard layout for letter keys and non-primitive symbol keys
                    const shiftedSyntaxClass = shiftedSymbol ? this._getSyntaxClass(shiftedSymbol) : 'empty';
                    const symbolSyntaxClass = symbol ? this._getSyntaxClass(symbol) : 'empty';
                    
                    // Shift symbol
                    const shiftSymbolSpan = document.createElement('span');
                    shiftSymbolSpan.className = `array-keyboard-shift-symbol ${shiftedSyntaxClass}`;
                    shiftSymbolSpan.style.fontFamily = this.fontFamily;
                    shiftSymbolSpan.textContent = shiftedSymbol || '';
                    if (shiftedSymbol) this._addHoverHandlers(shiftSymbolSpan, shiftedSymbol);
                    
                    // Main symbol
                    const symbolSpan = document.createElement('span');
                    symbolSpan.className = `array-keyboard-symbol ${symbolSyntaxClass}`;
                    symbolSpan.style.fontFamily = this.fontFamily;
                    symbolSpan.textContent = symbol || '';
                    if (symbol) this._addHoverHandlers(symbolSpan, symbol);
                    
                    // Key label
                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'array-keyboard-label';
                    labelSpan.textContent = displayLabel;
                    
                    keyDiv.appendChild(shiftSymbolSpan);
                    keyDiv.appendChild(symbolSpan);
                    keyDiv.appendChild(labelSpan);
                }
                
                rowDiv.appendChild(keyDiv);
            });
            
            // Add doc links to the last row (space bar row)
            if (rowIndex === totalRows - 1 && this.docLinks && (this.docLinks.layout || this.docLinks.primitives || this.docLinks.syntax)) {
                const linksContainer = document.createElement('span');
                linksContainer.className = 'array-keyboard-doc-links';
                
                const links = [];
                if (this.docLinks.layout) {
                    links.push(`<a href="${this.docLinks.layout}" target="_blank" rel="noopener">layout</a>`);
                }
                if (this.docLinks.primitives) {
                    links.push(`<a href="${this.docLinks.primitives}" target="_blank" rel="noopener">primitives</a>`);
                }
                if (this.docLinks.syntax) {
                    links.push(`<a href="${this.docLinks.syntax}" target="_blank" rel="noopener">syntax</a>`);
                }
                linksContainer.innerHTML = links.join('<span class="separator">|</span>');
                
                rowDiv.appendChild(linksContainer);
            }
            
            rowsContainer.appendChild(rowDiv);
        });
        
        this.overlay.appendChild(rowsContainer);
    }
    
    /**
     * Create a quadrant-based key layout for symbol/number keys with ASCII primitives
     * 
     * Consistent layout with SHIFT values always on top:
     * ┌─────────────────────┐
     * │ SHIFT+prefix  SHIFT+ASCII │  <- TOP ROW: shifted values
     * │ prefix        ASCII/label │  <- BOTTOM ROW: unshifted values
     * └─────────────────────┘
     * 
     * For number key `1` (where `!` is a primitive):
     * ┌─────────┐
     * │ ⎉   !  │  <- shifted prefix, shifted ASCII primitive
     * │ ˘   1  │  <- unshifted prefix, number label
     * └─────────┘
     * 
     * For symbol key `=` (where both `=` and `+` are primitives):
     * ┌─────────┐
     * │ ⋆   +  │  <- shifted prefix, shifted ASCII primitive
     * │ ×   =  │  <- unshifted prefix, base ASCII primitive
     * └─────────┘
     */
    _createQuadrantKey(keyDiv, opts) {
        const {
            key,
            shiftedKey,
            symbol,
            shiftedSymbol,
            displayLabel,
            isNumber,
            baseAsciiIsPrimitive,
            shiftedAsciiIsPrimitive
        } = opts;
        
        keyDiv.classList.add('quadrant-layout');
        
        // Collect all glyphs to display
        const glyphs = [];
        
        const hasSymbol = symbol && symbol !== '';
        const hasShiftedSymbol = shiftedSymbol && shiftedSymbol !== '';
        
        // TOP ROW: shifted values (left = shifted prefix, right = shifted ASCII)
        if (hasShiftedSymbol) {
            glyphs.push({ char: shiftedSymbol, position: 'top-left', type: 'prefix-shifted' });
        }
        if (shiftedAsciiIsPrimitive) {
            glyphs.push({ char: shiftedKey, position: 'top-right', type: 'ascii-shifted' });
        }
        
        // BOTTOM ROW: unshifted values (left = unshifted prefix, right = base ASCII or label)
        if (hasSymbol) {
            glyphs.push({ char: symbol, position: 'bottom-left', type: 'prefix' });
        }
        if (baseAsciiIsPrimitive) {
            glyphs.push({ char: key, position: 'bottom-right', type: 'ascii-primitive' });
        }
        
        // Create glyph elements
        glyphs.forEach(g => {
            const span = document.createElement('span');
            const syntaxClass = this._getSyntaxClass(g.char);
            span.className = `array-keyboard-quadrant-glyph ${syntaxClass} ${g.position}`;
            span.style.fontFamily = this.fontFamily;
            span.textContent = g.char;
            span.dataset.type = g.type;
            this._addHoverHandlers(span, g.char);
            keyDiv.appendChild(span);
        });
        
        // Add key label in bottom-right corner (like letters) for:
        // - Number keys: always show the number
        // - Symbol keys: show if the base ASCII is NOT a primitive (so we need to identify the key)
        if (isNumber || !baseAsciiIsPrimitive) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'array-keyboard-label';
            labelSpan.textContent = displayLabel;
            keyDiv.appendChild(labelSpan);
        }
    }
    
    /**
     * Create category-based glyph view
     */
    _createCategoryView() {
        const container = document.createElement('div');
        container.className = 'array-keyboard-category-container';
        
        // Check if compact mode is enabled
        if (this.compactCategories) {
            this._createCompactCategoryView(container);
        } else {
            this._createStandardCategoryView(container);
        }
        
        this.overlay.appendChild(container);
    }
    
    /**
     * Create standard category view with separate sections
     */
    _createStandardCategoryView(container) {
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
                let className = `array-keyboard-glyph ${syntaxClass || 'syntax-default'}`;
                // Smaller font for trigraphs (3+ chars)
                if (glyph.length >= 3) {
                    className += ' trigraph';
                }
                glyphDiv.className = className;
                glyphDiv.style.fontFamily = this.fontFamily;
                glyphDiv.textContent = glyph;
                this._addHoverHandlers(glyphDiv, glyph);
                glyphGrid.appendChild(glyphDiv);
            }
            
            categoryDiv.appendChild(glyphGrid);
            container.appendChild(categoryDiv);
        }
    }
    
    /**
     * Create compact category view with all glyphs inline and legend at bottom
     */
    _createCompactCategoryView(container) {
        container.classList.add('compact');
        
        // Single row of all glyphs
        const glyphRow = document.createElement('div');
        glyphRow.className = 'array-keyboard-compact-glyphs';
        
        // Collect legend items (deduplicated by label)
        const legendMap = new Map();
        
        for (const [categoryKey, categoryData] of Object.entries(this.glyphCategories)) {
            const { glyphs, label, syntaxClass, isArray } = categoryData;
            if (!glyphs || glyphs.length === 0) continue;
            
            // Add glyphs to the row
            for (const glyph of glyphs) {
                const glyphDiv = document.createElement('div');
                let className = `array-keyboard-glyph ${syntaxClass || 'syntax-default'}`;
                if (isArray) {
                    className += ' array-glyph';
                }
                // Smaller font for trigraphs (3+ chars)
                if (glyph.length >= 3) {
                    className += ' trigraph';
                }
                glyphDiv.className = className;
                glyphDiv.style.fontFamily = this.fontFamily;
                glyphDiv.textContent = glyph;
                this._addHoverHandlers(glyphDiv, glyph);
                glyphRow.appendChild(glyphDiv);
            }
            
            // Track for legend (deduplicate by label)
            const legendLabel = label || categoryKey;
            if (!legendMap.has(legendLabel)) {
                legendMap.set(legendLabel, { label: legendLabel, syntaxClass: syntaxClass || 'syntax-default' });
            }
        }
        
        container.appendChild(glyphRow);
        
        // Create legend at bottom
        const legend = document.createElement('div');
        legend.className = 'array-keyboard-legend';
        
        for (const item of legendMap.values()) {
            const legendItem = document.createElement('div');
            legendItem.className = 'array-keyboard-legend-item';
            
            const dot = document.createElement('span');
            dot.className = `array-keyboard-legend-dot ${item.syntaxClass}`;
            
            const text = document.createElement('span');
            text.className = 'array-keyboard-legend-text';
            text.textContent = item.label;
            
            legendItem.appendChild(dot);
            legendItem.appendChild(text);
            legend.appendChild(legendItem);
        }
        
        container.appendChild(legend);
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
     * Create hover tooltip element
     */
    _createTooltip() {
        if (!this.glyphDocs) return;
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'array-keyboard-tooltip';
        
        // Keep tooltip visible when mouse enters it
        this.tooltip.addEventListener('mouseenter', () => {
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
        });
        
        // Hide tooltip when mouse leaves it
        this.tooltip.addEventListener('mouseleave', () => {
            this._hideTooltip();
        });
        
        // Append to body for proper fixed positioning
        document.body.appendChild(this.tooltip);
    }
    
    /**
     * Show tooltip for a glyph
     * @param {string} glyph - The glyph character
     * @param {HTMLElement} targetEl - The element being hovered
     */
    _showTooltip(glyph, targetEl) {
        if (!this.tooltip || !this.glyphDocs) return;
        
        const doc = this.glyphDocs[glyph];
        if (!doc) return;
        
        // Clear any pending hide timeout
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
        
        // Build tooltip content
        let html = '<div class="array-keyboard-tooltip-header">';
        
        // Glyph with syntax coloring and language font
        const syntaxClass = this._getSyntaxClass(glyph);
        html += `<span class="array-keyboard-tooltip-glyph ${syntaxClass}" style="font-family: ${this.fontFamily}">${glyph}</span>`;
        
        // Title (name)
        html += `<span class="array-keyboard-tooltip-title">${this._escapeHtml(doc.name || '')}</span>`;
        
        // Type badge
        html += `<span class="array-keyboard-tooltip-type">${doc.type}</span>`;
        html += '</div>';
        
        // Description
        if (doc.description) {
            // Truncate long descriptions
            const shortDesc = doc.description.length > 180 ? doc.description.substring(0, 177) + '...' : doc.description;
            html += `<div class="array-keyboard-tooltip-desc">${this._escapeHtml(shortDesc)}</div>`;
        }
        
        // Example (with language font for code)
        if (doc.example) {
            html += `<div class="array-keyboard-tooltip-example" style="font-family: ${this.fontFamily}">${this._escapeHtml(doc.example)}</div>`;
        }
        
        // Doc link
        if (doc.docUrl) {
            html += `<a class="array-keyboard-tooltip-link" href="${doc.docUrl}" target="_blank" rel="noopener">View full docs ↗</a>`;
        }
        
        this.tooltip.innerHTML = html;
        
        // Position tooltip
        this._positionTooltip(targetEl);
        
        // Show tooltip
        this.tooltip.classList.add('show');
        
        // Make links clickable
        this.tooltip.style.pointerEvents = 'auto';
    }
    
    /**
     * Position tooltip relative to target element
     */
    _positionTooltip(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const padding = 10;
        
        // Get tooltip dimensions - need to make it visible first
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.opacity = '0';
        this.tooltip.classList.add('show');
        
        // Force reflow to get accurate dimensions
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        
        // Remove temporary show class
        this.tooltip.classList.remove('show');
        
        // Calculate position - prefer above, fallback to below
        let top = rect.top - tooltipHeight - padding;
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        
        // If too high, position below
        if (top < padding) {
            top = rect.bottom + padding;
        }
        
        // Keep within viewport horizontally
        const maxLeft = window.innerWidth - tooltipWidth - padding;
        if (left < padding) {
            left = padding;
        } else if (left > maxLeft) {
            left = maxLeft;
        }
        
        // Keep within viewport vertically
        const maxTop = window.innerHeight - tooltipHeight - padding;
        if (top > maxTop) {
            top = maxTop;
        }
        if (top < padding) {
            top = padding;
        }
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        
        // Reset styles for animation
        this.tooltip.style.visibility = '';
        this.tooltip.style.opacity = '';
    }
    
    /**
     * Hide tooltip
     */
    _hideTooltip() {
        if (!this.tooltip) return;
        
        // Add a small delay before hiding to allow moving to the tooltip
        this.tooltipTimeout = setTimeout(() => {
            this.tooltip.classList.remove('show');
            this.tooltip.style.pointerEvents = 'none';
        }, 100);
    }
    
    /**
     * Escape HTML special characters
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Add hover handlers to a glyph element
     */
    _addHoverHandlers(element, glyph) {
        if (!this.glyphDocs || !this.glyphDocs[glyph]) return;
        
        element.style.cursor = 'help';
        
        element.addEventListener('mouseenter', () => {
            this._showTooltip(glyph, element);
        });
        
        element.addEventListener('mouseleave', () => {
            this._hideTooltip();
        });
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
        
        // Clear previous search highlights
        this.overlay.querySelectorAll('.array-keyboard-key.search-match, .array-keyboard-glyph.search-match').forEach(el => {
            el.classList.remove('search-match');
        });
        
        // Create SVG for lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.namesOverlay.appendChild(svg);
        
        // Collect all glyphs that need labels
        const glyphElements = [];
        
        // Track keys that match the search filter
        const matchingKeys = new Set();
        
        // Helper function to check if name matches search filter (fuzzy)
        const matchesFilter = (name, keyEl = null) => {
            if (!this.searchFilter) return true;
            const matches = name.toLowerCase().includes(this.searchFilter);
            if (matches && keyEl) {
                matchingKeys.add(keyEl);
            }
            return matches;
        };
        
        if (this.displayMode === 'category') {
            // Category view: get all glyph divs
            this.overlay.querySelectorAll('.array-keyboard-glyph').forEach(el => {
                const glyph = el.textContent.trim();
                if (this.glyphNames[glyph]) {
                    const name = this.glyphNames[glyph];
                    if (matchesFilter(name, el)) {
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
                    // Check for standard layout elements
                    const symbolEl = keyEl.querySelector('.array-keyboard-symbol');
                    const shiftSymbolEl = keyEl.querySelector('.array-keyboard-shift-symbol');
                    
                    // Check for quadrant layout elements
                    const quadrantGlyphs = keyEl.querySelectorAll('.array-keyboard-quadrant-glyph');
                    
                    if (symbolEl) {
                        const glyph = symbolEl.textContent.trim();
                        if (glyph && this.glyphNames[glyph]) {
                            const name = this.glyphNames[glyph];
                            if (matchesFilter(name, keyEl)) {
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
                            if (matchesFilter(name, keyEl)) {
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
                    
                    // Process quadrant glyphs
                    quadrantGlyphs.forEach(quadEl => {
                        const glyph = quadEl.textContent.trim();
                        if (glyph && this.glyphNames[glyph]) {
                            const name = this.glyphNames[glyph];
                            if (matchesFilter(name, keyEl)) {
                                // Determine if shifted based on position class
                                const isShifted = quadEl.classList.contains('top-left') || 
                                                  quadEl.classList.contains('top-right');
                                glyphElements.push({ 
                                    el: quadEl, 
                                    glyph, 
                                    name, 
                                    isShifted,
                                    rowIndex,
                                    totalRows
                                });
                            }
                        }
                    });
                });
            });
        }
        
        // Apply search highlights to matching keys
        if (this.searchFilter) {
            matchingKeys.forEach(keyEl => {
                keyEl.classList.add('search-match');
            });
        }
        
        if (glyphElements.length === 0) {
            // Hide tooltip if no results
            this._hideTooltip();
            return;
        }
        
        // Show tooltip when search narrows to a single result
        if (this.searchFilter && glyphElements.length === 1 && this.glyphDocs) {
            const singleResult = glyphElements[0];
            this._showTooltip(singleResult.glyph, singleResult.el);
        } else if (this.searchFilter && glyphElements.length > 1) {
            // Hide tooltip when multiple results
            this._hideTooltip();
        }
        
        // Calculate dynamic font size based on number of results
        // Fewer results = larger font for better readability
        const baseFontSize = 11;
        const maxFontSize = 18;
        const maxResultsForScaling = 20; // Start scaling when below this many results
        
        let dynamicFontSize = baseFontSize;
        if (this.searchFilter && glyphElements.length <= maxResultsForScaling) {
            // Scale from baseFontSize (at maxResultsForScaling) to maxFontSize (at 1 result)
            const scaleFactor = 1 - (glyphElements.length - 1) / (maxResultsForScaling - 1);
            dynamicFontSize = baseFontSize + (maxFontSize - baseFontSize) * Math.max(0, scaleFactor);
        }
        
        // Get overlay bounds for positioning
        const overlayRect = this.overlay.getBoundingClientRect();
        const margin = 25;
        // Scale label height proportionally with font size
        const baseLabelHeight = 20;
        const labelHeight = baseLabelHeight * (dynamicFontSize / baseFontSize);
        
        // Determine which side each glyph's label should go to
        const centerX = overlayRect.left + overlayRect.width / 2;
        const centerY = overlayRect.top + overlayRect.height / 2;
        
        const labels = glyphElements.map(item => {
            const rect = item.el.getBoundingClientRect();
            const glyphCenterX = rect.left + rect.width / 2;
            const glyphCenterY = rect.top + rect.height / 2;
            
            // Estimate label width based on name length (will be measured after creation)
            // Scale with dynamic font size
            const fontScale = dynamicFontSize / baseFontSize;
            const estimatedLabelWidth = (item.name.length * 7 + 12) * fontScale;
            
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
        
        // Rebalance top and bottom by total label width (character count as proxy)
        // This helps balance the number of visual rows/tiers on each side
        const getLabelWidth = (labelGroup) => labelGroup.reduce((sum, l) => sum + l.labelWidth, 0);
        
        const rebalanceTopBottom = () => {
            // Keep rebalancing until roughly equal (within 5% tolerance)
            const tolerance = 0.05;
            let iterations = 0;
            const maxIterations = 50;
            
            while (iterations < maxIterations) {
                const topWidth = getLabelWidth(sides.top);
                const bottomWidth = getLabelWidth(sides.bottom);
                const total = topWidth + bottomWidth;
                if (total === 0) break;
                
                const topRatio = topWidth / total;
                
                // If balanced enough, stop
                if (Math.abs(topRatio - 0.5) <= tolerance) break;
                
                if (topRatio > 0.5 + tolerance && sides.top.length > 1) {
                    // Top is heavier, move a label to bottom
                    // Pick the label closest to the bottom (highest Y glyph position)
                    sides.top.sort((a, b) => b.glyphY - a.glyphY);
                    const toMove = sides.top.shift();
                    toMove.side = 'bottom';
                    sides.bottom.push(toMove);
                } else if (topRatio < 0.5 - tolerance && sides.bottom.length > 1) {
                    // Bottom is heavier, move a label to top
                    // Pick the label closest to the top (lowest Y glyph position)
                    sides.bottom.sort((a, b) => a.glyphY - b.glyphY);
                    const toMove = sides.bottom.shift();
                    toMove.side = 'top';
                    sides.top.push(toMove);
                } else {
                    break;
                }
                
                iterations++;
            }
        };
        
        rebalanceTopBottom();
        
        // Re-sort top and bottom by X after rebalancing
        sides.top.sort((a, b) => a.glyphX - b.glyphX);
        sides.bottom.sort((a, b) => a.glyphX - b.glyphX);
        
        // Position labels on each side with multiple tiers, balanced by width
        const positionHorizontalLabels = (labelGroup, isTop) => {
            if (labelGroup.length === 0) return;
            
            const availableWidth = overlayRect.width + 300;
            const startX = overlayRect.left - 150;
            const minSpacing = 6;
            const tierHeight = labelHeight + 8;
            
            // Calculate total width needed (including spacing)
            let totalWidth = 0;
            labelGroup.forEach(item => totalWidth += item.labelWidth + minSpacing);
            
            // Determine number of tiers needed
            const numTiers = Math.max(1, Math.ceil(totalWidth / availableWidth));
            const targetWidthPerTier = totalWidth / numTiers;
            
            // Assign items to tiers, balancing by width
            let tiers = [];
            for (let i = 0; i < numTiers; i++) {
                tiers.push({ items: [], width: 0 });
            }
            
            // Sort labels by X position for better visual coherence
            const sortedLabels = [...labelGroup].sort((a, b) => a.glyphX - b.glyphX);
            
            // Distribute labels to tiers, trying to balance width
            sortedLabels.forEach(item => {
                const itemWidth = item.labelWidth + minSpacing;
                
                // Find the tier with the least width that won't exceed target too much
                let bestTier = 0;
                let bestScore = Infinity;
                
                for (let t = 0; t < numTiers; t++) {
                    const newWidth = tiers[t].width + itemWidth;
                    const score = Math.abs(newWidth - targetWidthPerTier) + t * 0.1;
                    if (tiers[t].width < availableWidth && score < bestScore) {
                        bestScore = score;
                        bestTier = t;
                    }
                }
                
                if (bestScore === Infinity) {
                    bestTier = tiers.reduce((minIdx, tier, idx, arr) => 
                        tier.width < arr[minIdx].width ? idx : minIdx, 0);
                }
                
                tiers[bestTier].items.push(item);
                tiers[bestTier].width += itemWidth;
            });
            
            // Remove empty tiers
            tiers = tiers.filter(tier => tier.items.length > 0);
            
            // Merge single-item tiers into adjacent tiers
            while (tiers.some(t => t.items.length === 1) && tiers.length > 1) {
                const singleIdx = tiers.findIndex(t => t.items.length === 1);
                if (singleIdx === -1) break;
                
                const singleTier = tiers[singleIdx];
                // Merge with adjacent tier (prefer the one with less width)
                let targetIdx;
                if (singleIdx === 0) {
                    targetIdx = 1;
                } else if (singleIdx === tiers.length - 1) {
                    targetIdx = singleIdx - 1;
                } else {
                    // Pick the neighbor with less width
                    targetIdx = tiers[singleIdx - 1].width <= tiers[singleIdx + 1].width 
                        ? singleIdx - 1 : singleIdx + 1;
                }
                
                // Move the single item to target tier
                tiers[targetIdx].items.push(...singleTier.items);
                tiers[targetIdx].width += singleTier.width;
                tiers.splice(singleIdx, 1);
            }
            
            // Sort items within each tier by X position
            tiers.forEach(tier => tier.items.sort((a, b) => a.glyphX - b.glyphX));
            
            // Sort tiers: for top, put shortest tier first (at top); for bottom, put shortest tier last (at bottom)
            tiers.sort((a, b) => a.width - b.width);
            if (!isTop) {
                tiers.reverse();
            }
            
            const actualNumTiers = tiers.length;
            
            // Position labels
            tiers.forEach((tier, tierIdx) => {
                tier.items.forEach(item => {
                    // Base Y position with tier offset
                    if (isTop) {
                        item.labelY = overlayRect.top - margin - labelHeight - (actualNumTiers - 1 - tierIdx) * tierHeight;
                    } else {
                        item.labelY = overlayRect.bottom + margin + tierIdx * tierHeight;
                    }
                    
                    // Initial X based on glyph position
                    const relativeX = (item.glyphX - overlayRect.left) / overlayRect.width;
                    item.labelX = overlayRect.left + relativeX * overlayRect.width - item.labelWidth / 2;
                });
                
                // Resolve collisions within tier
                for (let i = 1; i < tier.items.length; i++) {
                    const prev = tier.items[i - 1];
                    const curr = tier.items[i];
                    const prevRight = prev.labelX + prev.labelWidth;
                    if (curr.labelX < prevRight + minSpacing) {
                        curr.labelX = prevRight + minSpacing;
                    }
                }
                
                // Calculate actual tier width after collision resolution
                if (tier.items.length > 0) {
                    const first = tier.items[0];
                    const last = tier.items[tier.items.length - 1];
                    const actualTierWidth = (last.labelX + last.labelWidth) - first.labelX;
                    
                    // Center the tier within available width
                    const centerX = overlayRect.left + overlayRect.width / 2;
                    const tierCenterX = first.labelX + actualTierWidth / 2;
                    const centerShift = centerX - tierCenterX;
                    
                    tier.items.forEach(item => item.labelX += centerShift);
                    
                    // Clamp to bounds if needed
                    const newFirst = tier.items[0];
                    const newLast = tier.items[tier.items.length - 1];
                    
                    if (newFirst.labelX < startX) {
                        const shift = startX - newFirst.labelX;
                        tier.items.forEach(item => item.labelX += shift);
                    }
                    if (newLast.labelX + newLast.labelWidth > startX + availableWidth) {
                        const shift = (newLast.labelX + newLast.labelWidth) - (startX + availableWidth);
                        tier.items.forEach(item => item.labelX -= shift);
                    }
                }
            });
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
            label.className = `array-keyboard-name-label ${this._getNameLabelSyntaxClass(item.glyph)}`;
            label.textContent = item.name;
            label.style.visibility = 'hidden';
            label.style.position = 'absolute';
            label.style.top = `${item.labelY}px`;
            // Apply dynamic font size based on number of results
            if (dynamicFontSize !== baseFontSize) {
                label.style.fontSize = `${dynamicFontSize}px`;
                // Scale padding proportionally
                const paddingScale = dynamicFontSize / baseFontSize;
                label.style.padding = `${2 * paddingScale}px ${6 * paddingScale}px`;
            }
            
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
        
        // Clear search highlights from keys and glyphs
        this.overlay.querySelectorAll('.array-keyboard-key.search-match, .array-keyboard-glyph.search-match').forEach(el => {
            el.classList.remove('search-match');
        });
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
        if (this.tooltip) {
            this.tooltip.remove();
        }
        
        this._createOverlay();
        this._createNamesOverlay();
        this._createTooltip();
        
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
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
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
        if (this.tooltip) {
            this.tooltip.remove();
        }
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
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
    
    /**
     * Update glyph documentation for hover tooltips
     * @param {Object} glyphDocs - New glyph documentation mapping
     */
    updateGlyphDocs(glyphDocs) {
        this.glyphDocs = glyphDocs;
        
        // Recreate tooltip
        if (this.tooltip) {
            this.tooltip.remove();
        }
        this._createTooltip();
        
        // Recreate overlay to re-add hover handlers
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
