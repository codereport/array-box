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
    '7': '',  '&': '',
    '8': '∞', '*': '',
    '9': '¯', '(': '⟨',
    '0': '•', ')': '⟩',
    '-': '÷', '_': '√',
    '=': '×', '+': '⋆',
    
    // QWERTY row
    'q': '⌽', 'Q': '',
    'w': '𝕨', 'W': '𝕎',
    'e': '∊', 'E': '⍷',
    'r': '↑', 'R': '𝕣',
    't': '∧', 'T': '⍋',
    'y': '',  'Y': '',
    'u': '⊔', 'U': '',
    'i': '⊏', 'I': '⊑',
    'o': '⊐', 'O': '⊒',
    'p': 'π', 'P': '',
    '[': '←', '{': '⊣',
    ']': '→', '}': '⊢',
    '\\': '',  '|': '',
    
    // Home row
    'a': '⍉', 'A': '',
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
 * TinyAPL keymap: backtick (`) prefix with double-prefix support
 * Based on https://github.com/RubenVerg/TinyAPL/blob/beta/js/index.ts
 * Keyboard SVG: https://github.com/RubenVerg/TinyAPL/blob/beta/js/kbd.svg
 *
 * TinyAPL uses a unique double-prefix system:
 * - prefix once + key → symP (e.g., ` + e = ∊)
 * - prefix once + shift+key → symPS (e.g., ` + E = ⍷)
 * - prefix twice + key → symPP (e.g., `` + e = ⋵)
 * - prefix twice + shift+key → symPPS (e.g., `` + E = ⋷)
 *
 * Structure: { code, sym, symS, symP, symPS, symPP, symPPS }
 * where code is the key code, sym/symS are base keys, and symP/PS/PP/PPS are prefix mappings
 */
export const tinyaplKeyboard = [
    // Numbers row
    { code: 'Backquote', sym: '`', symS: '~', symP: '⋄', symPS: '⍨', symPP: undefined, symPPS: '⌺' },
    { code: 'Digit1', sym: '1', symS: '!', symP: '¨', symPS: '⨳', symPP: undefined, symPPS: '⑴' },
    { code: 'Digit2', sym: '2', symS: '@', symP: '¯', symPS: undefined, symPP: undefined, symPPS: undefined },
    { code: 'Digit3', sym: '3', symS: '#', symP: '˝', symPS: '⍒', symPP: '⍫', symPPS: undefined },
    { code: 'Digit4', sym: '4', symS: '$', symP: '≤', symPS: '⍋', symPP: '⊴', symPPS: undefined },
    { code: 'Digit5', sym: '5', symS: '%', symP: '⬚', symPS: '≈', symPP: '⤺', symPPS: undefined },
    { code: 'Digit6', sym: '6', symS: '^', symP: '≥', symPS: '⍉', symPP: '⊵', symPPS: undefined },
    { code: 'Digit7', sym: '7', symS: '&', symP: '⌽', symPS: undefined, symPP: undefined, symPPS: undefined },
    { code: 'Digit8', sym: '8', symS: '*', symP: '≠', symPS: '⍣', symPP: '⍟', symPPS: '∞' },
    { code: 'Digit9', sym: '9', symS: '(', symP: '∨', symPS: '⍱', symPP: '∻', symPPS: '⦋' },
    { code: 'Digit0', sym: '0', symS: ')', symP: '∧', symPS: '⍲', symPP: '⍬', symPPS: '⦌' },
    { code: 'Minus', sym: '-', symS: '_', symP: '×', symPS: '⊗', symPP: '⸚', symPPS: 'ⵧ' },
    { code: 'Equal', sym: '=', symS: '+', symP: '÷', symPS: '⊕', symPP: '⌹', symPPS: '⧺' },
    
    // QWERTY row
    { code: 'KeyQ', sym: 'q', symS: 'Q', symP: '↗', symPS: undefined, symPP: '⇾', symPPS: '⇽' },
    { code: 'KeyW', sym: 'w', symS: 'W', symP: '⍵', symPS: '⍹', symPP: undefined, symPPS: undefined },
    { code: 'KeyE', sym: 'e', symS: 'E', symP: '∊', symPS: '⍷', symPP: '⋵', symPPS: '⋷' },
    { code: 'KeyR', sym: 'r', symS: 'R', symP: '⍴', symPS: '√', symPP: 'ϼ', symPPS: 'ℜ' },
    { code: 'KeyT', sym: 't', symS: 'T', symP: '⊞', symPS: '⍨', symPP: '߹', symPPS: '‥' },
    { code: 'KeyY', sym: 'y', symS: 'Y', symP: '↑', symPS: '↟', symPP: 'ᓚ', symPPS: '⥽' },
    { code: 'KeyU', sym: 'u', symS: 'U', symP: '↓', symPS: '↡', symPP: 'ᓗ', symPPS: '⥼' },
    { code: 'KeyI', sym: 'i', symS: 'I', symP: '⍳', symPS: '⍸', symPP: '…', symPPS: 'ℑ' },
    { code: 'KeyO', sym: 'o', symS: 'O', symP: '○', symPS: '⍥', symPP: '⍜', symPPS: undefined },
    { code: 'KeyP', sym: 'p', symS: 'P', symP: '◡', symPS: '◠', symPP: '⏨', symPPS: '⌓' },
    { code: 'BracketLeft', sym: '[', symS: '{', symP: '←', symPS: '⟨', symPP: '⦅', symPPS: '⦃' },
    { code: 'BracketRight', sym: ']', symS: '}', symP: '→', symPS: '⟩', symPP: '⦆', symPPS: '⦄' },
    
    // Home row
    { code: 'KeyA', sym: 'a', symS: 'A', symP: '⍺', symPS: '⍶', symPP: 'ɛ', symPPS: undefined },
    { code: 'KeyS', sym: 's', symS: 'S', symP: '⌈', symPS: '§', symPP: '↾', symPPS: undefined },
    { code: 'KeyD', sym: 'd', symS: 'D', symP: '⌊', symPS: '⸠', symPP: '⇂', symPPS: '⩔' },
    { code: 'KeyF', sym: 'f', symS: 'F', symP: '⍛', symPS: '∡', symPP: '∠', symPPS: undefined },
    { code: 'KeyG', sym: 'g', symS: 'G', symP: '∇', symPS: '⍢', symPP: '⫇', symPPS: undefined },
    { code: 'KeyH', sym: 'h', symS: 'H', symP: '∆', symPS: '⍙', symPP: '⊸', symPPS: '⟜' },
    { code: 'KeyJ', sym: 'j', symS: 'J', symP: '∘', symPS: '⍤', symPP: 'ᴊ', symPPS: undefined },
    { code: 'KeyK', sym: 'k', symS: 'K', symP: '⎊', symPS: '⌸', symPP: undefined, symPPS: undefined },
    { code: 'KeyL', sym: 'l', symS: 'L', symP: '⎕', symPS: '⌷', symPP: undefined, symPPS: undefined },
    { code: 'Semicolon', sym: ';', symS: ':', symP: '⍎', symPS: '≡', symPP: '⍮', symPPS: '⍠' },
    { code: 'Quote', sym: "'", symS: '"', symP: '⍕', symPS: '≢', symPP: '⍘', symPPS: '⍞' },
    { code: 'Backslash', sym: '\\', symS: '|', symP: '⊢', symPS: '⊣', symPP: '⊩', symPPS: '⫣' },
    
    // Bottom row
    { code: 'KeyZ', sym: 'z', symS: 'Z', symP: '⊂', symPS: '⊆', symPP: '⊏', symPPS: 'ᑣ' },
    { code: 'KeyX', sym: 'x', symS: 'X', symP: '⊃', symPS: '⊇', symPP: '⊐', symPPS: 'ᑒ' },
    { code: 'KeyC', sym: 'c', symS: 'C', symP: '∩', symPS: '⍝', symPP: '⟃', symPPS: '⟄' },
    { code: 'KeyV', sym: 'v', symS: 'V', symP: '∪', symPS: '⁖', symPP: '⫤', symPPS: undefined },
    { code: 'KeyB', sym: 'b', symS: 'B', symP: '⊥', symPS: '∵', symPP: '⇇', symPPS: undefined },
    { code: 'KeyN', sym: 'n', symS: 'N', symP: '⊤', symPS: '·', symPP: '↚', symPPS: '⩓' },
    { code: 'KeyM', sym: 'm', symS: 'M', symP: '«', symPS: '»', symPP: '↩', symPPS: '⍦' },
    { code: 'Comma', sym: ',', symS: '<', symP: '⍪', symPS: 'ᑈ', symPP: '⊲', symPPS: undefined },
    { code: 'Period', sym: '.', symS: '>', symP: '∙', symPS: 'ᐵ', symPP: '⊳', symPPS: '■' },
    { code: 'Slash', sym: '/', symS: '?', symP: '⌿', symPS: undefined, symPP: undefined, symPPS: '⍰' },
    
    // Space
    { code: 'Space', sym: 'Space', symS: 'Space', symP: '‿', symPS: undefined, symPP: undefined, symPPS: undefined }
];

/**
 * TinyAPL keymap converted to code-based lookup format for the keyboard handler
 * Uses key code as lookup, returns object with { symP, symPS, symPP, symPPS }
 * Handler checks shiftKey to determine which glyph to use
 */
export const tinyaplKeymap = (() => {
    const map = {};
    for (const k of tinyaplKeyboard) {
        map[k.code] = {
            symP: k.symP,
            symPS: k.symPS,
            symPP: k.symPP,
            symPPS: k.symPPS
        };
    }
    return map;
})();

/**
 * TinyAPL glyph reference organized by category
 * For use in category-mode keyboard display
 */
export const tinyaplGlyphs = {
    // Functions (blue) - primitive functions
    functions: [
        '+', '-', '×', '÷', '*', '⍟', '√', '⌊', '⌈', '⸠', '⌹', '!', '|', '∨', '∧',
        '⊕', '⊗', '∡', 'ℜ', 'ℑ', '⧺', 'ⵧ', '⊥', '⊤',
        '=', '≠', '<', '≤', '≥', '>', '≡', '≢', '⊲', '⊴', '⊵', '⊳',
        '∪', '∩', '~', '§',
        '⍳', '⍸', '∊', '⍷', '⋷', '⋵', '⍴', 'ϼ',
        '?', '…', '⍮', '‥', '߹',
        '↑', '↓', '⊂', '⊆', '⫇', '⍋', '⍒', '⌿', ',', '⍪', '⌽', '⍉',
        '⊃', '⊇', '⌷', '⊢', '⊣', '⍎', '⍕', '↗', '⇂', '↾',
        '⨳', '⩔', '⩓'
    ],
    // Adverbs (green) - 1-modifiers
    monadic: [
        '/', '\\', '¨', 'ᐵ', 'ᑈ', 'ᑣ', 'ᑒ', '∙', '⊞', '◡', '◠',
        'ᓗ', 'ᓚ', '⌓', '⌸', '⌺', '∵', '⫤',
        '˝', '⥼', '⥽', '⍦', '⑴', '⤺'
    ],
    // Conjunctions (yellow) - 2-modifiers/combinators
    dyadic: [
        '⍨', '∘', '⍛', '⊸', '⟜', '⍤', '⍥', '⸚', '«', '»', '⇾', '⇽', '⫣', '⊩',
        '⍣', '⁖', '⍢', '⎊', '@', '≈', '⬚',
        '○', '⍜', '⍫'
    ],
    // Special syntax
    syntax: [
        '←', '→', '⍺', '⍵', '⍶', '⍹', '∇', '⋄', ':', '■', '⍝', '⟨', '⟩', '⦅', '⦆',
        '{', '}', '⍬', '∻', '⦻', '∅', '¯', '∞', '⏨', 'ᴊ'
    ]
};

/**
 * Uiua glyph reference (not a keymap - Uiua uses named functions)
 * Organized by category for reference display
 * Based on https://www.uiua.org/docs/
 */
export const uiuaGlyphs = {
    // Stack - Basic stack operations
    stack: [
        '∘', '◌'
    ],
    // Monadic Pervasive - Operate on every element in an array
    monadicPervasive: [
        '¬', '±', '¯', '⨪', '⌵', '√', 'ₑ', '∿', '⌊', '⌈', '⁅'
    ],
    // Monadic Array - Operate on a single array
    monadicArray: [
        '⧻', '△', '⇡', '⊢', '⊣', '⇌', '♭', '¤', '⋯', '⍉', '⍆', '⍏', '⍖', '⊚', '◴', '⊛', '⧆', '□'
    ],
    // Dyadic Pervasive - Operate on every pair of elements in two arrays
    dyadicPervasive: [
        '=', '≠', '<', '≤', '>', '≥', '+', '-', '×', '÷', '◿', 'ⁿ', '↧', '↥', '∠', 'ℂ'
    ],
    // Dyadic Array - Operate on two arrays
    dyadicArray: [
        '≍', '⊟', '⊂', '⊏', '⊡', '↯', '↙', '↘', '↻', '⤸', '▽', '⌕', '⦷', '∊', '⨂', '⊥'
    ],
    // 1-Modifiers (monadic modifiers) - Take 1 function argument
    monadicModifiers: [
        '˙', '˜', '⊙', '⋅', '⟜', '⊸', '⤙', '⤚', '◡', '∩',
        '≡', '⍚', '⊞', '⧅', '⧈', '⊕', '⊜',
        '/', '∧', '\\', '⍥',
        '⌅', '°', '⌝',
        '⧋', '◇'
    ],
    // 2-Modifiers (dyadic modifiers) - Take 2+ function arguments
    dyadicModifiers: [
        '⊃', '⊓', '⍜', '⍢', '⬚', '⨬'
    ],
    // Constants - Symbolic constants
    constants: [
        'η', 'π', 'τ', '∞'
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
 * @param {string} language - 'bqn', 'apl', 'kap', or 'tinyapl'
 * @returns {function} - Cleanup function to remove the handler
 */
export function createKeyboardHandler(inputElement, language) {
    // TinyAPL uses double-prefix (0 = none, 1 = single prefix, 2 = double prefix)
    // Other languages use simple boolean prefix
    const isTinyapl = language === 'tinyapl';
    let prefixLevel = 0; // 0, 1, or 2 for TinyAPL; 0 or 1 for others
    const prefixKey = language === 'bqn' ? '\\' : '`';
    const keymap = language === 'bqn' ? bqnKeymap : 
                   language === 'kap' ? kapKeymap : 
                   language === 'tinyapl' ? tinyaplKeymap :
                   aplKeymap;
    const DEBUG = false; // Set to true to enable debug logging
    
    // Map physical key codes to logical keys
    function getCodeToKey(shiftPressed) {
        return {
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
    }
    
    function handleKeyDown(e) {
        // Don't interfere with modifier keys or special keys
        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
            return;
        }
        
        // Don't interfere with Ctrl/Alt/Meta key combinations (like Ctrl+K, Ctrl+Enter, etc.)
        if (e.ctrlKey || e.altKey || e.metaKey) {
            prefixLevel = 0; // Reset prefix state
            return;
        }
        
        // Check if this is the prefix key
        // For TinyAPL: if we're already in prefix mode and shift is pressed, 
        // don't treat it as another prefix - treat it as a character lookup (for symPS/symPPS)
        const shiftPressed = e.shiftKey || e.getModifierState('Shift');
        const isPrefixKey = (e.key === prefixKey || 
                            e.key === 'Backslash' && prefixKey === '\\' ||
                            (prefixKey === '\\' && e.code === 'Backslash') ||
                            (prefixKey === '`' && (e.code === 'Backquote' || e.key === '`')));
        
        // Don't treat as prefix key if we're already in prefix mode and shift is pressed
        const treatAsPrefix = isPrefixKey && !(prefixLevel > 0 && shiftPressed);
        
        if (treatAsPrefix) {
            if (isTinyapl) {
                // TinyAPL: Allow up to 2 prefix levels
                if (prefixLevel < 2) {
                    e.preventDefault();
                    prefixLevel++;
                    if (DEBUG) console.log('TinyAPL prefix level:', prefixLevel);
                    return;
                } else {
                    // Third press - insert the separator (⋄) which is symP for Backquote
                    e.preventDefault();
                    prefixLevel = 0;
                    const entry = keymap[e.code];
                    if (entry && entry.symP) {
                        insertText(inputElement, entry.symP);
                    }
                    return;
                }
            } else {
                // Other languages: Simple toggle
                if (prefixLevel > 0) {
                    // Double prefix key - insert the prefix character itself
                    prefixLevel = 0;
                    return; // Let the default behavior happen
                }
                e.preventDefault();
                prefixLevel = 1;
                if (DEBUG) console.log('Prefix activated:', prefixKey);
                return;
            }
        }
        
        // Ignore modifier keys when prefix is active (don't reset prefix state)
        if (prefixLevel > 0 && (e.key === 'Shift' || e.key === 'CapsLock')) {
            return; // Don't consume Shift/CapsLock, just ignore them
        }
        
        // If prefix is active, look up the character
        if (prefixLevel > 0) {
            e.preventDefault(); // Always prevent default when prefix is active
            const currentPrefixLevel = prefixLevel;
            prefixLevel = 0;
            
            // shiftPressed already computed above
            const codeToKey = getCodeToKey(shiftPressed);
            
            // Get the logical key from the physical key code
            let key = null;
            if (e.code && codeToKey.hasOwnProperty(e.code)) {
                key = codeToKey[e.code];
            } else if (e.key) {
                key = e.key;
                if (shiftPressed) {
                    if (key.length === 1 && key >= 'a' && key <= 'z') {
                        key = key.toUpperCase();
                    } else {
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
            
            // Look up the mapped character
            let mapped = null;
            if (isTinyapl) {
                // TinyAPL uses code-based lookup with shift state
                // keymap[code] = { symP, symPS, symPP, symPPS }
                const entry = keymap[e.code];
                if (entry) {
                    if (currentPrefixLevel === 1) {
                        // Single prefix: use symP (unshifted) or symPS (shifted)
                        mapped = shiftPressed ? entry.symPS : entry.symP;
                    } else {
                        // Double prefix: use symPP (unshifted) or symPPS (shifted)
                        mapped = shiftPressed ? entry.symPPS : entry.symPP;
                    }
                }
            } else {
                // Standard keymap lookup
                mapped = key && keymap[key];
            }
            
            if (DEBUG) {
                console.log('Key lookup:', { 
                    code: e.code, 
                    key: e.key, 
                    shiftKey: e.shiftKey,
                    shiftPressed, 
                    resolvedKey: key,
                    prefixLevel: currentPrefixLevel,
                    mapped
                });
            }
            
            if (mapped && mapped !== '') {
                insertText(inputElement, mapped);
                return;
            }
            
            // If no mapping found, don't insert anything (we already prevented default)
        }
    }
    
    function handleBlur() {
        prefixLevel = 0;
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
 * @param {string} language - 'bqn', 'apl', 'kap', or 'tinyapl'
 * @returns {object} Object with prefixKey, keymap, and description
 */
export function getKeymapInfo(language) {
    const prefixKey = language === 'bqn' ? '\\' : '`';
    const keymap = language === 'bqn' ? bqnKeymap : 
                   language === 'kap' ? kapKeymap :
                   language === 'tinyapl' ? tinyaplKeymap :
                   aplKeymap;
    
    if (language === 'tinyapl') {
        return {
            prefixKey,
            keymap,
            description: 'Press ` once for level 1 glyphs, twice for level 2 glyphs'
        };
    }
    
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
    tinyaplKeymap,
    tinyaplKeyboard,
    tinyaplGlyphs,
    uiuaGlyphs,
    jGlyphs,
    createKeyboardHandler,
    getKeymapInfo,
    insertText
};
