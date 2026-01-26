/**
 * Keyboard mappings for array languages
 * BQN uses backslash (\) as prefix key
 * Dyalog APL uses backtick (`) as prefix key
 * 
 * Based on standard keymaps:
 * - BQN: https://mlochbaum.github.io/BQN/keymap.html
 * - APL: https://aplwiki.com/wiki/Typing_glyphs (Dyalog layout)
 * - Uiua: https://www.uiua.org/docs/
 * - J: https://code.jsoftware.com/wiki/NuVoc
 */

/**
 * BQN keymap: backslash (\) prefix
 * Format: key -> character (lowercase), KEY -> character (uppercase/shifted)
 */
export const bqnKeymap = {
    // Numbers row
    '`': '˜', '~': '¬',
    '1': '˘', '!': '⎉',
    '2': '¨', '@': '⚇',
    '3': '⁼', '#': '⍟',
    '4': '⌜', '$': '◶',
    '5': '´', '%': '⊘',
    '6': '˝', '^': '⎊',
    '7': '',  '&': '⍎',
    '8': '∞', '*': '⍕',
    '9': '¯', '(': '⟨',
    '0': '•', ')': '⟩',
    '-': '÷', '_': '√',
    '=': '×', '+': '⋆',
    
    // QWERTY row
    'q': '⌽', 'Q': '↙',
    'w': '𝕨', 'W': '𝕎',
    'e': '∊', 'E': '⍷',
    'r': '↑', 'R': '𝕣',
    't': '∧', 'T': '⍋',
    'y': '',  'Y': '',
    'u': '⊔', 'U': '',
    'i': '⊏', 'I': '⊑',
    'o': '⊐', 'O': '⊒',
    'p': 'π', 'P': '⍳',
    '[': '←', '{': '⊣',
    ']': '→', '}': '⊢',
    '\\': '',  '|': '',
    
    // Home row
    'a': '⍉', 'A': '↖',
    's': '𝕤', 'S': '𝕊',
    'd': '↕', 'D': '',
    'f': '𝕗', 'F': '𝔽',
    'g': '𝕘', 'G': '𝔾',
    'h': '⊸', 'H': '«',
    'j': '∘', 'J': '',
    'k': '○', 'K': '⌾',
    'l': '⟜', 'L': '»',
    ';': '⋄', ':': '·',
    "'": '↩', '"': '˙',
    
    // Bottom row
    'z': '⥊', 'Z': '⋈',
    'x': '𝕩', 'X': '𝕏',
    'c': '↓', 'C': '',
    'v': '∨', 'V': '⍒',
    'b': '⌊', 'B': '⌈',
    'n': '',  'N': '',
    'm': '≡', 'M': '≢',
    ',': '∾', '<': '≤',
    '.': '≍', '>': '≥',
    '/': '≠', '?': '⇐',
    
    // Space produces ligature character
    ' ': '‿'
};

/**
 * Dyalog APL keymap: backtick (`) prefix
 */
export const aplKeymap = {
    // Numbers row
    '`': '⋄', '~': '⌺',
    '1': '¨', '!': '⌶',
    '2': '¯', '@': '⍫',
    '3': '<', '#': '⍒',
    '4': '≤', '$': '⍋',
    '5': '=', '%': '⌽',
    '6': '≥', '^': '⍉',
    '7': '>', '&': '⊖',
    '8': '≠', '*': '⍟',
    '9': '∨', '(': '⍱',
    '0': '∧', ')': '⍲',
    '-': '×', '_': '!',
    '=': '÷', '+': '⌹',
    
    // QWERTY row
    'q': '?', 'Q': '',
    'w': '⍵', 'W': '',
    'e': '∊', 'E': '⍷',
    'r': '⍴', 'R': '',
    't': '~', 'T': '⍨',
    'y': '↑', 'Y': '',
    'u': '↓', 'U': '',
    'i': '⍳', 'I': '⍸',
    'o': '○', 'O': '⍥',
    'p': '*', 'P': '⍣',
    '[': '←', '{': '⍞',
    ']': '→', '}': '⍬',
    '\\': '⊢', '|': '⊣',
    
    // Home row
    'a': '⍺', 'A': '',
    's': '⌈', 'S': '',
    'd': '⌊', 'D': '',
    'f': '_', 'F': '⍛',  // Behind operator (Dyalog 18.0+)
    'g': '∇', 'G': '',
    'h': '∆', 'H': '',
    'j': '∘', 'J': '⍤',
    'k': "'", 'K': '⌸',
    'l': '⎕', 'L': '⌷',
    ';': '⍎', ':': '≡',
    "'": '⍕', '"': '≢',
    
    // Bottom row
    'z': '⊂', 'Z': '⊆',
    'x': '⊃', 'X': '',
    'c': '∩', 'C': '',
    'v': '∪', 'V': '',
    'b': '⊥', 'B': '',
    'n': '⊤', 'N': '',
    'm': '|', 'M': '',
    ',': '⍝', '<': '⍪',
    '.': '⍀', '>': '⍙',
    '/': '⌿', '?': '⍠'
};

/**
 * Kap keymap: backtick (`) prefix
 * Based on https://kapdemo.dhsdevelopments.com/clientweb2/
 * Kap has its own keyboard layout distinct from Dyalog APL
 */
export const kapKeymap = {
    // Numbers row
    '`': '⋄', '~': '',
    '1': '¨', '!': '⌶',
    '2': '¯', '@': '⍫',
    '3': '≤', '#': '⍒',
    '4': '≥', '$': '⍋',
    '5': '⟦', '%': '⌽',
    '6': '⟧', '^': '⍉',
    '7': '',  '&': '⊖',
    '8': '≠', '*': '⍟',
    '9': '∨', '(': '⍱',
    '0': '∧', ')': '⍲',
    '-': '×', '_': '⍠',
    '=': '÷', '+': '⌹',
    
    // QWERTY row
    'q': '⦻', 'Q': '⫇',
    'w': '⍵', 'W': '',
    'e': '∊', 'E': '⍷',
    'r': '⍴', 'R': '√',
    't': '⍓', 'T': '⍨',
    'y': '↑', 'Y': '≬',
    'u': '↓', 'U': '⇐',
    'i': '⍳', 'I': '⍸',
    'o': '○', 'O': '⍥',
    'p': '⋆', 'P': '⍣',
    '[': '←', '{': '⍞',
    ']': '→', '}': '⍬',
    '\\': '⊢', '|': '⊣',
    
    // Home row
    'a': '⍺', 'A': '⍰',
    's': '⌈', 'S': '∵',
    'd': '⌊', 'D': '˝',
    'f': '_', 'F': '⍛',
    'g': '∇', 'G': '⍢',
    'h': '∆', 'H': '⍙',
    'j': '∘', 'J': '⍤',
    'k': '⌸', 'K': '⌻',
    'l': '⎕', 'L': '⌷',
    ';': '⍎', ':': '≡',
    "'": '⍕', '"': '≢',
    
    // Bottom row
    'z': '⊂', 'Z': '⊆',
    'x': '⊃', 'X': '⊇',
    'c': '∩', 'C': '∙',
    'v': '∪', 'V': 'λ',
    'b': '⊥', 'B': '«',
    'n': '⊤', 'N': '»',
    'm': '…', 'M': '∥',
    ',': '⍝', '<': '⍪',
    '.': '⍀', '>': '⍮',
    '/': '⌿', '?': '⫽'
};

/**
 * Uiua glyph reference (not a keymap - Uiua uses named functions)
 * Organized by category for reference display
 * Based on https://www.uiua.org/docs/
 */
export const uiuaGlyphs = {
    // Monadic functions (stack functions taking 1 argument) - green
    monadic: [
        '¬', '±', '⌵', '√', '○', '⌈', '⌊', '⧻', '△', '⇡', '⊢', '⇌',
        '♭', '¤', '⊚', '⊛', '◴', '⍏', '⍖', '⊝', 'ℂ', '⁅', '°',
        '⍉', '⋯', '⍜', '⍘', '⬚', '⚙', '◌', '⸮'
    ],
    // Dyadic functions (stack functions taking 2 arguments) - blue
    functions: [
        '+', '-', '×', '÷', '◿', 'ⁿ', 'ₙ', '=', '≠', '<', '>', '≤', '≥',
        '↧', '↥', '∠', '∧', '∨', '⊻', '⊼', '⊽', '⊂', '⊏', '⊡', '↯', '☇',
        '↙', '↘', '↻', '⊗', '∈', '⊟', '▽', '◫', '▩', '⊞', '⊃', '⍥',
        '⊜', '⊕', '⬚', '⤸', '⤙', '◠'
    ],
    // Modifiers (take function arguments) - orange
    modifier: [
        '/', '\\', '∵', '≡', '⍢', '◡', '⚂', '⋕', '`', '¨'
    ],
    // Planet modifiers (2+ function arguments) - yellow
    dyadic: [
        '⊃', '⊓', '⊩', '⊔', '◇', '◰', '∘', '⊸', '⟜', '⊙', '⋅', '⍣'
    ],
    // Constants - purple
    constants: [
        'η', 'π', 'τ', '∞', '¯'
    ],
    // System/stack functions
    system: [
        '∩', '⊓', '⊙', '⋅', '⬛'
    ]
};

/**
 * J primitive reference (digraphs and single chars)
 * Organized by category based on NuVoc: https://code.jsoftware.com/wiki/NuVoc
 */
export const jGlyphs = {
    // Verbs (functions) - blue
    // Single character verbs
    functions: [
        // Arithmetic
        '+', '-', '*', '%', '^',
        // Comparison  
        '<', '=', '>',
        // Structural
        '$', '~', '|', ',', ';', '#',
        // Selection/indexing
        '{', '}', '[', ']',
        // Other
        '"', '?', '!'
    ],
    // Verb digraphs (with . or :)
    verbDigraphs: [
        // Floor/Ceiling/Min/Max
        '<.', '>.', '<:', '>:',
        // Arithmetic extensions
        '+.', '+:', '*.', '*:', '-.', '-:', '%.', '%:',
        // Power/Log
        '^.', '^:',
        // Structural
        '$.', '$:', '|.', '|:',
        // Tally/Copy/Base
        '#.', '#:',
        // Nub/Not-Equal
        '~.', '~:',
        // Box/Open
        // Selection
        '{.', '}.', '{:', '}:', '{::',
        // Ravel/Append
        ',.', ',:',
        // Raze/Link
        ';:', 
        // Format/Do
        '".', '":', 
        // Roll/Deal
        '?.', '?:',
        // Factorial/Fit
        '!.',
        // Named primitives
        'i.', 'i:', 'j.', 'o.', 'p.', 'p:', 'q:', 'r.',
        'A.', 'C.', 'e.', 'E.', 'I.', 'L.', 's:', 'S:', 'u:', 'x:'
    ],
    // Adverbs (1-modifiers) - green
    monadic: [
        '/', '\\',           // Insert, Prefix
        '/.',                // Oblique/Key
        '\\.',               // Suffix
        '~'                  // Reflex/Passive
    ],
    adverbDigraphs: [
        '/:', '\\:',         // Grade Up/Down
        'b.', 'f.', 'M.',    // Boolean, Fix, Memo
        't.', 't:'           // Taylor
    ],
    // Conjunctions (2-modifiers) - yellow
    dyadic: [
        '@', '&', '`', ':',  // Atop, Bond/Compose, Tie, Define
        '.'                  // Determinant/Matrix Product
    ],
    conjunctionDigraphs: [
        '@.', '@:',          // Agenda, At
        '&.', '&:', '&.:',   // Under, Appose
        '`:',                // Evoke Gerund  
        '!:',                // Foreign
        '"',                 // Rank
        'd.', 'D.', 'D:',    // Derivative
        'F.', 'F:', 'F..', 'F.:', 'F:.', 'F::',  // Fold
        'H.', 'L:', 'S:', 'T.',
        '^:'                 // Power of Verb
    ],
    // Constants/Special - purple
    constants: [
        '_', '__',           // Negative sign, Infinity
        '_.',                // Indeterminate
        'a.', 'a:'           // Alphabet, Ace
    ],
    // Comments
    comments: [
        'NB.'
    ],
    // Control structures (for reference)
    control: [
        'if.', 'else.', 'elseif.', 'end.',
        'for.', 'do.', 'while.', 'whilst.',
        'select.', 'case.', 'fcase.',
        'try.', 'catch.', 'catchd.', 'catcht.', 'throw.',
        'return.', 'break.', 'continue.', 'goto.', 'label.',
        'assert.'
    ]
};

/**
 * Insert text at cursor position in an input/textarea or contenteditable element
 * @param {HTMLElement} element - The input element
 * @param {string} text - Text to insert
 */
export function insertText(element, text) {
    // Check if it's a contenteditable element
    if (element.contentEditable === 'true') {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            
            // Move cursor after inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
            
            // Trigger input event for any listeners
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        // Original code for input/textarea elements
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const value = element.value;
        
        element.value = value.substring(0, start) + text + value.substring(end);
        
        // Move cursor after inserted text
        const newPos = start + text.length;
        element.selectionStart = newPos;
        element.selectionEnd = newPos;
        
        // Trigger input event for any listeners
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * Creates a keyboard input handler for an input element
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLElement} inputElement - The input element to attach to
 * @param {string} language - 'bqn', 'apl', or 'kap'
 * @returns {function} - Cleanup function to remove the handler
 */
export function createKeyboardHandler(inputElement, language) {
    let prefixActive = false;
    const prefixKey = language === 'bqn' ? '\\' : '`';
    const keymap = language === 'bqn' ? bqnKeymap : (language === 'kap' ? kapKeymap : aplKeymap);
    const DEBUG = false; // Set to true to enable debug logging
    
    function handleKeyDown(e) {
        // Don't interfere with modifier keys or special keys
        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
            return;
        }
        
        // Don't interfere with Ctrl/Alt/Meta key combinations (like Ctrl+K, Ctrl+Enter, etc.)
        if (e.ctrlKey || e.altKey || e.metaKey) {
            prefixActive = false; // Reset prefix state
            return;
        }
        
        // Check if this is the prefix key (handle both 'Backslash' code and '\' key)
        // Note: e.key for backslash can be '\' or 'Backslash' depending on browser
        // e.code for backslash is always 'Backslash'
        const isPrefixKey = (e.key === prefixKey || 
                            e.key === 'Backslash' && prefixKey === '\\' ||
                            (prefixKey === '\\' && e.code === 'Backslash') ||
                            (prefixKey === '`' && (e.code === 'Backquote' || e.key === '`')));
        
        if (isPrefixKey) {
            if (prefixActive) {
                // Double prefix key - insert the prefix character itself
                prefixActive = false;
                return; // Let the default behavior happen
            }
            e.preventDefault();
            prefixActive = true;
            if (DEBUG) console.log('Prefix activated:', prefixKey);
            return;
        }
        
        // If prefix is active, look up the character
        if (prefixActive) {
            e.preventDefault(); // Always prevent default when prefix is active
            prefixActive = false;
            
            // Use getModifierState for more reliable shift detection
            const shiftPressed = e.shiftKey || e.getModifierState('Shift');
            
            // Map physical key codes to logical keys, accounting for shift
            // This is more reliable than e.key because it's consistent across browsers
            const codeToKey = {
                // Numbers row
                'Digit1': shiftPressed ? '!' : '1',
                'Digit2': shiftPressed ? '@' : '2',
                'Digit3': shiftPressed ? '#' : '3',
                'Digit4': shiftPressed ? '$' : '4',
                'Digit5': shiftPressed ? '%' : '5',
                'Digit6': shiftPressed ? '^' : '6',
                'Digit7': shiftPressed ? '&' : '7',
                'Digit8': shiftPressed ? '*' : '8',
                'Digit9': shiftPressed ? '(' : '9',
                'Digit0': shiftPressed ? ')' : '0',
                'Minus': shiftPressed ? '_' : '-',
                'Equal': shiftPressed ? '+' : '=',
                'Backquote': shiftPressed ? '~' : '`',
                
                // Letters (always uppercase when shift is pressed)
                'KeyQ': shiftPressed ? 'Q' : 'q',
                'KeyW': shiftPressed ? 'W' : 'w',
                'KeyE': shiftPressed ? 'E' : 'e',
                'KeyR': shiftPressed ? 'R' : 'r',
                'KeyT': shiftPressed ? 'T' : 't',
                'KeyY': shiftPressed ? 'Y' : 'y',
                'KeyU': shiftPressed ? 'U' : 'u',
                'KeyI': shiftPressed ? 'I' : 'i',
                'KeyO': shiftPressed ? 'O' : 'o',
                'KeyP': shiftPressed ? 'P' : 'p',
                'KeyA': shiftPressed ? 'A' : 'a',
                'KeyS': shiftPressed ? 'S' : 's',
                'KeyD': shiftPressed ? 'D' : 'd',
                'KeyF': shiftPressed ? 'F' : 'f',
                'KeyG': shiftPressed ? 'G' : 'g',
                'KeyH': shiftPressed ? 'H' : 'h',
                'KeyJ': shiftPressed ? 'J' : 'j',
                'KeyK': shiftPressed ? 'K' : 'k',
                'KeyL': shiftPressed ? 'L' : 'l',
                'KeyZ': shiftPressed ? 'Z' : 'z',
                'KeyX': shiftPressed ? 'X' : 'x',
                'KeyC': shiftPressed ? 'C' : 'c',
                'KeyV': shiftPressed ? 'V' : 'v',
                'KeyB': shiftPressed ? 'B' : 'b',
                'KeyN': shiftPressed ? 'N' : 'n',
                'KeyM': shiftPressed ? 'M' : 'm',
                
                // Punctuation
                'BracketLeft': shiftPressed ? '{' : '[',
                'BracketRight': shiftPressed ? '}' : ']',
                'Backslash': shiftPressed ? '|' : '\\',
                'Semicolon': shiftPressed ? ':' : ';',
                'Quote': shiftPressed ? '"' : "'",
                'Comma': shiftPressed ? '<' : ',',
                'Period': shiftPressed ? '>' : '.',
                'Slash': shiftPressed ? '?' : '/',
                'Space': ' '
            };
            
            // Get the logical key from the physical key code
            let key = null;
            // Prefer e.code (more reliable), but fall back to e.key if not available
            if (e.code && codeToKey.hasOwnProperty(e.code)) {
                key = codeToKey[e.code];
            } else if (e.key) {
                // Fallback: use e.key and adjust for shift
                key = e.key;
                if (shiftPressed) {
                    if (key.length === 1 && key >= 'a' && key <= 'z') {
                        key = key.toUpperCase();
                    } else {
                        // For numbers/symbols, e.key should already be the shifted version
                        // but let's handle common cases explicitly
                        const shiftMap = {
                            '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
                            '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
                            '-': '_', '=': '+', '`': '~',
                            '[': '{', ']': '}', '\\': '|',
                            ';': ':', "'": '"', ',': '<', '.': '>', '/': '?'
                        };
                        if (shiftMap.hasOwnProperty(key)) {
                            key = shiftMap[key];
                        }
                    }
                }
            }
            
            // Debug logging
            if (DEBUG) {
                console.log('Key lookup:', { 
                    code: e.code, 
                    key: e.key, 
                    shiftKey: e.shiftKey,
                    shiftPressed, 
                    resolvedKey: key, 
                    hasMapping: keymap.hasOwnProperty(key),
                    mapped: keymap[key] 
                });
            }
            
            // Look up the mapped character
            if (key && keymap.hasOwnProperty(key)) {
                const mapped = keymap[key];
                if (mapped && mapped !== '') {
                    insertText(inputElement, mapped);
                    return;
                }
            }
            
            // If no mapping found, don't insert anything (we already prevented default)
        }
    }
    
    function handleBlur() {
        prefixActive = false;
    }
    
    inputElement.addEventListener('keydown', handleKeyDown);
    inputElement.addEventListener('blur', handleBlur);
    
    // Return cleanup function
    return function cleanup() {
        inputElement.removeEventListener('keydown', handleKeyDown);
        inputElement.removeEventListener('blur', handleBlur);
    };
}

/**
 * Get info about a keyboard mapping for display
 * @param {string} language - 'bqn', 'apl', or 'kap'
 * @returns {object} Object with prefixKey, keymap, and description
 */
export function getKeymapInfo(language) {
    const prefixKey = language === 'bqn' ? '\\' : '`';
    const keymap = language === 'bqn' ? bqnKeymap : (language === 'kap' ? kapKeymap : aplKeymap);
    
    return {
        prefixKey,
        keymap,
        description: language === 'bqn' 
            ? 'Press \\ followed by a key to insert BQN characters'
            : `Press \` followed by a key to insert ${language === 'kap' ? 'Kap' : 'APL'} characters`
    };
}

// Default export for convenience
export default {
    bqnKeymap,
    aplKeymap,
    kapKeymap,
    uiuaGlyphs,
    jGlyphs,
    createKeyboardHandler,
    getKeymapInfo,
    insertText
};
