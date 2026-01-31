/**
 * Editor features for array language code editing
 * - Align assignment operators
 * - Align comments
 * - Auto-expand editor width
 */

/**
 * Assignment operators by language
 * These are the primary assignment/definition operators
 */
export const assignmentOperators = {
    apl: ['←'],
    bqn: ['←', '↩', '⇐'],  // define, change, export
    j: ['=.', '=:'],       // local, global assignment
    uiua: ['←', '↚'],      // binding, private binding
    kap: ['←', '⇐'],
    tinyapl: ['←', '→']
};

/**
 * Comment tokens by language
 */
export const commentTokens = {
    apl: '⍝',
    bqn: '#',
    j: 'NB.',
    uiua: '#',
    kap: '⍝',
    tinyapl: '⍝'
};

/**
 * Find the position of an assignment operator in a line
 * @param {string} line - The line to search
 * @param {string} language - The language identifier
 * @returns {object|null} - { operator, index } or null if not found
 */
function findAssignmentOperator(line, language) {
    const operators = assignmentOperators[language] || ['←'];
    
    // Sort by length descending to match longer operators first (e.g., '=:' before '=')
    const sortedOps = [...operators].sort((a, b) => b.length - a.length);
    
    for (const op of sortedOps) {
        // Skip if the operator is inside a string
        let inString = false;
        let stringChar = null;
        
        for (let i = 0; i <= line.length - op.length; i++) {
            const char = line[i];
            
            // Track string state
            if ((char === '"' || char === "'") && (i === 0 || line[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            if (!inString && line.substring(i, i + op.length) === op) {
                return { operator: op, index: i };
            }
        }
    }
    
    return null;
}

/**
 * Find the position of a comment token in a line
 * @param {string} line - The line to search
 * @param {string} language - The language identifier
 * @returns {number} - Index of comment start, or -1 if not found
 */
function findCommentStart(line, language) {
    const commentToken = commentTokens[language];
    if (!commentToken) return -1;
    
    // Skip if the comment token is inside a string
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i <= line.length - commentToken.length; i++) {
        const char = line[i];
        
        // Track string state
        if ((char === '"' || char === "'") && (i === 0 || line[i-1] !== '\\')) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
                stringChar = null;
            }
        }
        
        if (!inString && line.substring(i, i + commentToken.length) === commentToken) {
            return i;
        }
    }
    
    return -1;
}

/**
 * Align assignment operators across multiple lines
 * Ensures one space on each side of the assignment operator
 * Groups are separated by empty lines - each group is aligned independently
 * @param {string} text - The full text content
 * @param {string} language - The language identifier
 * @returns {string} - Text with aligned assignment operators
 */
export function alignAssignments(text, language) {
    const lines = text.split('\n');
    
    // Find assignment positions for all lines
    const assignments = lines.map(line => findAssignmentOperator(line, language));
    
    // Group consecutive lines (empty lines start a new group)
    const groups = [];
    let currentGroup = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isEmpty = line.trim() === '';
        
        if (isEmpty) {
            // End current group if it has content
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
            // Add empty line as its own "group" to preserve it
            groups.push([{ index: i, isEmpty: true }]);
        } else {
            currentGroup.push({ index: i, isEmpty: false });
        }
    }
    // Don't forget the last group
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }
    
    // Process each group independently
    const resultLines = [...lines];
    
    for (const group of groups) {
        // Skip empty line groups
        if (group.length === 1 && group[0].isEmpty) continue;
        
        // Find lines with assignments in this group
        const groupLinesWithAssignments = group.filter(item => assignments[item.index] !== null);
        
        if (groupLinesWithAssignments.length < 2) {
            // Still normalize spacing even for single assignment
            if (groupLinesWithAssignments.length === 1) {
                const i = groupLinesWithAssignments[0].index;
                const line = lines[i];
                const assignment = assignments[i];
                const before = line.substring(0, assignment.index).trimEnd();
                const after = line.substring(assignment.index + assignment.operator.length).trimStart();
                resultLines[i] = before + ' ' + assignment.operator + ' ' + after;
            }
            continue;
        }
        
        // First pass: normalize and calculate max code length for this group
        let maxCodeLength = 0;
        const normalizedParts = {};
        
        for (const item of groupLinesWithAssignments) {
            const i = item.index;
            const line = lines[i];
            const assignment = assignments[i];
            const before = line.substring(0, assignment.index).trimEnd();
            const after = line.substring(assignment.index + assignment.operator.length).trimStart();
            normalizedParts[i] = { before, after, operator: assignment.operator };
            maxCodeLength = Math.max(maxCodeLength, before.length);
        }
        
        // Second pass: align assignments in this group
        for (const item of groupLinesWithAssignments) {
            const i = item.index;
            const { before, after, operator } = normalizedParts[i];
            const padding = maxCodeLength - before.length;
            
            // One space before operator, operator, one space after
            resultLines[i] = before + ' '.repeat(padding) + ' ' + operator + ' ' + after;
        }
    }
    
    return resultLines.join('\n');
}

/**
 * Align comments across multiple lines
 * Ensures at least one space before the comment token
 * Groups are separated by empty lines - each group is aligned independently
 * @param {string} text - The full text content
 * @param {string} language - The language identifier
 * @returns {string} - Text with aligned comments
 */
export function alignComments(text, language) {
    const lines = text.split('\n');
    const commentToken = commentTokens[language];
    
    if (!commentToken) return text;
    
    // Find comment positions
    const commentPositions = lines.map(line => findCommentStart(line, language));
    
    // Group consecutive lines (empty lines start a new group)
    const groups = [];
    let currentGroup = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isEmpty = line.trim() === '';
        
        if (isEmpty) {
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
            groups.push([{ index: i, isEmpty: true }]);
        } else {
            currentGroup.push({ index: i, isEmpty: false });
        }
    }
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }
    
    const resultLines = [...lines];
    
    for (const group of groups) {
        // Skip empty line groups
        if (group.length === 1 && group[0].isEmpty) continue;
        
        // Find lines with inline comments in this group
        const groupInlineCommentLines = [];
        for (const item of group) {
            const i = item.index;
            const pos = commentPositions[i];
            if (pos > 0) {
                const beforeComment = lines[i].substring(0, pos).trim();
                if (beforeComment.length > 0) {
                    groupInlineCommentLines.push(i);
                }
            }
        }
        
        if (groupInlineCommentLines.length < 2) {
            // Still ensure at least one space before comment for single line
            if (groupInlineCommentLines.length === 1) {
                const i = groupInlineCommentLines[0];
                const pos = commentPositions[i];
                const codePart = lines[i].substring(0, pos).trimEnd();
                const commentPart = lines[i].substring(pos);
                resultLines[i] = codePart + ' ' + commentPart;
            }
            continue;
        }
        
        // Find the maximum code length before comments in this group
        // Use [...str].length to count Unicode code points, not code units
        // (BQN uses characters like 𝔽 and 𝕩 which are surrogate pairs)
        let maxCodeLength = 0;
        for (const i of groupInlineCommentLines) {
            const pos = commentPositions[i];
            const codePart = lines[i].substring(0, pos).trimEnd();
            maxCodeLength = Math.max(maxCodeLength, [...codePart].length);
        }
        
        // Align each line in this group (at least 1 space before comment)
        for (const i of groupInlineCommentLines) {
            const pos = commentPositions[i];
            const codePart = lines[i].substring(0, pos).trimEnd();
            const commentPart = lines[i].substring(pos);
            const padding = Math.max(1, maxCodeLength - [...codePart].length + 1);
            resultLines[i] = codePart + ' '.repeat(padding) + commentPart;
        }
    }
    
    return resultLines.join('\n');
}

/**
 * Calculate the visual width needed for the content
 * Uses a temporary element to measure actual rendered width
 * @param {HTMLElement} element - The code input element
 * @param {string} text - The text content
 * @returns {number} - Required width in pixels for the full container
 */
export function calculateContentWidth(element, text) {
    // Create a temporary span with the same styling
    const temp = document.createElement('span');
    const computedStyle = window.getComputedStyle(element);
    
    temp.style.fontFamily = computedStyle.fontFamily;
    temp.style.fontSize = computedStyle.fontSize;
    temp.style.fontWeight = computedStyle.fontWeight;
    temp.style.letterSpacing = computedStyle.letterSpacing;
    temp.style.whiteSpace = 'pre';
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    
    // Find the longest line
    const lines = text.split('\n');
    let maxWidth = 0;
    
    document.body.appendChild(temp);
    
    for (const line of lines) {
        temp.textContent = line;
        maxWidth = Math.max(maxWidth, temp.offsetWidth);
    }
    
    document.body.removeChild(temp);
    
    // Account for:
    // - code-input padding: 35px each side = 70px
    // - language selector: ~184px
    // - container gap: 18px
    // - border: 3px each side = 6px
    const codeInputPadding = 70;
    const languageSelectorWidth = 184;
    const containerGap = 18;
    const borders = 6;
    
    return maxWidth + codeInputPadding + languageSelectorWidth + containerGap + borders;
}

/**
 * Auto-expand container width based on content
 * @param {HTMLElement} container - The container element
 * @param {HTMLElement} inputContainer - The input container element
 * @param {HTMLElement} codeInput - The code input element
 * @param {string} text - The current text content
 * @param {object} options - Configuration options
 */
export function autoExpandWidth(container, inputContainer, codeInput, text, options = {}) {
    const {
        minWidth = 500,      // Minimum container width
        maxWidth = 1600,     // Maximum container width  
        baseWidth = 875,     // Default/base width
        padding = 20         // Extra padding (~1 character headroom at 42px font)
    } = options;
    
    const contentWidth = calculateContentWidth(codeInput, text);
    const targetWidth = Math.min(maxWidth, Math.max(minWidth, contentWidth + padding));
    
    // Only expand, don't shrink below base width (unless content is smaller)
    const newWidth = Math.max(baseWidth, targetWidth);
    
    container.style.maxWidth = `${newWidth}px`;
}

/**
 * Create an editor features manager
 * @param {object} elements - DOM elements { container, inputContainer, codeInput, output }
 * @param {function} getLanguage - Function that returns current language
 * @param {function} getInputText - Function that returns current input text
 * @param {function} setInputText - Function to set input text
 * @param {function} applySyntaxHighlighting - Function to apply syntax highlighting
 * @returns {object} - Manager with methods for editor features
 */
export function createEditorFeaturesManager(elements, getLanguage, getInputText, setInputText, applySyntaxHighlighting) {
    const { container, inputContainer, codeInput, output } = elements;
    
    let autoExpandEnabled = true;
    
    /**
     * Align both assignments and comments (call before evaluation)
     * @returns {boolean} - True if text was modified
     */
    function alignAll() {
        const text = getInputText();
        const language = getLanguage();
        
        // First align assignments, then align comments
        let aligned = alignAssignments(text, language);
        aligned = alignComments(aligned, language);
        
        if (aligned !== text) {
            setInputText(aligned);
            applySyntaxHighlighting();
            return true;
        }
        return false;
    }
    
    /**
     * Handle width auto-expansion
     */
    function handleAutoExpand() {
        if (!autoExpandEnabled) return;
        
        const text = getInputText();
        autoExpandWidth(container, inputContainer, codeInput, text);
    }
    
    /**
     * Toggle auto-expand feature
     */
    function toggleAutoExpand() {
        autoExpandEnabled = !autoExpandEnabled;
        if (!autoExpandEnabled) {
            // Reset to default width
            container.style.maxWidth = '875px';
        } else {
            handleAutoExpand();
        }
        return autoExpandEnabled;
    }
    
    /**
     * Set up input listener for auto-expand
     */
    function setupAutoExpand() {
        // Expand immediately on input (no debounce - must be instant to prevent wrapping)
        codeInput.addEventListener('input', () => {
            handleAutoExpand();
        });
        
        // Also listen for keydown to expand proactively before the character is inserted
        codeInput.addEventListener('keydown', (e) => {
            // Only for printable characters (not modifiers, arrows, etc.)
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Get current selection to find cursor position
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    const text = getInputText();
                    const lines = text.split('\n');
                    
                    // Find which line the cursor is on by counting newlines before cursor
                    const range = sel.getRangeAt(0);
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(codeInput);
                    preCaretRange.setEnd(range.startContainer, range.startOffset);
                    const textBeforeCursor = preCaretRange.toString();
                    const lineIndex = (textBeforeCursor.match(/\n/g) || []).length;
                    
                    // Add character to the current line to estimate width
                    if (lineIndex < lines.length) {
                        lines[lineIndex] += e.key;
                    }
                    const estimatedText = lines.join('\n');
                    autoExpandWidth(container, inputContainer, codeInput, estimatedText);
                }
            }
        });
        
        // Initial check
        handleAutoExpand();
    }
    
    /**
     * Initialize all features
     */
    function init() {
        setupAutoExpand();
    }
    
    return {
        init,
        alignAll,
        handleAutoExpand,
        toggleAutoExpand,
        isAutoExpandEnabled: () => autoExpandEnabled
    };
}

export default {
    assignmentOperators,
    commentTokens,
    alignAssignments,
    alignComments,
    calculateContentWidth,
    autoExpandWidth,
    createEditorFeaturesManager
};
