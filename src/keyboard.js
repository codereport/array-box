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
 *     syntaxRules: { functions: [...], monadic: [...], ... }
 *   });
 *   
 *   keyboard.toggle();  // Toggle visibility
 *   keyboard.show();    // Show keyboard
 *   keyboard.hide();    // Hide keyboard
 *   keyboard.destroy(); // Remove from DOM
 */

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
        
        this.overlay = null;
        this.styleElement = null;
        this.keydownHandler = null;
        
        this._injectStyles();
        this._createOverlay();
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
            title.textContent = `${this.language} Glyphs`;
        } else {
            title.textContent = `${this.language} Keyboard (prefix: ${this.prefixKey})`;
        }
        
        const hint = document.createElement('span');
        hint.className = 'array-keyboard-hint';
        hint.textContent = `Ctrl+${this.toggleKey.toUpperCase()} to toggle`;
        
        header.appendChild(title);
        header.appendChild(hint);
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
        
        this.layout.forEach((row) => {
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
     * Setup keyboard shortcuts
     */
    _setupKeyboardShortcuts() {
        this.keydownHandler = (e) => {
            // Only respond if enabled
            if (!this.enabled) return;
            
            // Ctrl+toggleKey to toggle
            if (e.ctrlKey && (e.key === this.toggleKey || e.key === this.toggleKey.toUpperCase())) {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            }
            
            // ESC to close
            if (e.key === 'Escape' && this.isVisible()) {
                e.preventDefault();
                this.hide();
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
        if (this.overlay) {
            this.overlay.remove();
        }
        this._createOverlay();
        if (wasVisible) {
            this.show();
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
        // Note: We don't remove styles as other instances might use them
    }
}

// Export for different module systems
export default ArrayKeyboard;
