/** Multiple selections over a syntax-highlighted contenteditable editor.
 * Offsets use UTF-16, like DOM ranges. The browser handles word and glyph movement.
 */
export function createMultiCursorEditor(input, { getText, renderText }) {
    let cursors = null;
    let addingColumn = null;
    let internalInput = false;
    const undo = [];
    const redo = [];
    const overlay = document.createElement('div');
    overlay.className = 'multi-cursor-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    input.after(overlay);

    function offset(node, position) {
        const range = document.createRange();
        range.selectNodeContents(input);
        range.setEnd(node, position);
        return range.toString().length;
    }

    function readSelection() {
        const selection = window.getSelection();
        if (!input.contains(selection.anchorNode) || !input.contains(selection.focusNode)) {
            return { anchor: 0, head: 0 };
        }
        return {
            anchor: offset(selection.anchorNode, selection.anchorOffset),
            head: offset(selection.focusNode, selection.focusOffset)
        };
    }

    function point(position) {
        const walker = document.createTreeWalker(input, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (position <= node.length) return [node, position];
            position -= node.length;
        }
        return [input, input.childNodes.length];
    }

    function select(cursor) {
        window.getSelection().setBaseAndExtent(...point(cursor.anchor), ...point(cursor.head));
    }

    function captureSelection() {
        return (cursors || [readSelection()]).map(cursor => ({ ...cursor }));
    }

    // Merge intersecting selections so a character is never edited twice.
    function normalize(selections) {
        const sorted = selections.map((cursor, index) => ({
            ...cursor, primary: index === 0,
            start: Math.min(cursor.anchor, cursor.head), end: Math.max(cursor.anchor, cursor.head)
        })).sort((a, b) => a.start - b.start || a.end - b.end);
        const merged = [];
        for (const cursor of sorted) {
            const previous = merged.at(-1);
            if (previous && (cursor.start < previous.end || cursor.start === previous.start ||
                (cursor.start === previous.end && cursor.start === cursor.end))) {
                const backwards = previous.primary ? previous.head < previous.anchor : cursor.head < cursor.anchor;
                previous.end = Math.max(previous.end, cursor.end);
                previous.anchor = backwards ? previous.end : previous.start;
                previous.head = backwards ? previous.start : previous.end;
                previous.primary ||= cursor.primary;
            } else {
                merged.push(cursor);
            }
        }
        return merged.sort((a, b) => Number(b.primary) - Number(a.primary))
            .map(({ anchor, head }) => ({ anchor, head }));
    }

    function restoreSelection(selections) {
        const normalized = normalize(selections);
        cursors = normalized.length > 1 ? normalized : null;
        select(normalized[0]);
        draw();
    }

    function clear() {
        cursors = null;
        addingColumn = null;
        overlay.replaceChildren();
    }

    function reset() {
        clear();
        undo.length = redo.length = 0;
    }

    function draw() {
        overlay.replaceChildren();
        if (!cursors || document.activeElement !== input) return;
        overlay.style.left = `${input.offsetLeft}px`;
        overlay.style.top = `${input.offsetTop}px`;
        overlay.style.width = `${input.offsetWidth}px`;
        overlay.style.height = `${input.offsetHeight}px`;
        const bounds = input.getBoundingClientRect();
        function rectangle(rect, className, caret = false) {
            const element = document.createElement('span');
            element.className = className;
            Object.assign(element.style, {
                left: `${rect.left - bounds.left}px`, top: `${rect.top - bounds.top}px`,
                width: `${caret ? 2 : rect.width}px`, height: `${rect.height}px`
            });
            overlay.append(element);
        }
        for (const cursor of cursors.slice(1)) {
            const range = document.createRange();
            range.setStart(...point(Math.min(cursor.anchor, cursor.head)));
            range.setEnd(...point(Math.max(cursor.anchor, cursor.head)));
            if (!range.collapsed) {
                for (const rect of range.getClientRects()) rectangle(rect, 'multi-cursor-selection');
            }
            range.setStart(...point(cursor.head));
            range.collapse(true);
            let rect = range.getClientRects()[0];
            // A collapsed range on an empty line may have no box in Chromium.
            if (!rect && cursor.head < getText().length) {
                range.setEnd(...point(cursor.head + 1));
                rect = range.getClientRects()[0];
            }
            if (!rect && cursor.head > 0) {
                range.setStart(...point(cursor.head - 1));
                range.setEnd(...point(cursor.head));
                const previous = [...range.getClientRects()].at(-1);
                if (previous) {
                    const style = getComputedStyle(input);
                    const newline = getText()[cursor.head - 1] === '\n';
                    rect = {
                        left: newline ? bounds.left + input.clientLeft + parseFloat(style.paddingLeft) - input.scrollLeft : previous.right,
                        top: previous.top + (newline ? parseFloat(style.lineHeight) : 0),
                        height: previous.height
                    };
                }
            }
            if (rect) rectangle(rect, 'multi-cursor-caret', true);
        }
    }

    function snapshot() {
        return { text: getText(), selections: captureSelection() };
    }

    function write(text, selections) {
        renderText(text);
        restoreSelection(selections);
        internalInput = true;
        try {
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } finally {
            internalInput = false;
        }
        draw();
    }

    function replaceSelections(text, selectionsToReplace = captureSelection()) {
        const before = snapshot();
        const normalized = normalize(selectionsToReplace);
        const primaryCursor = normalized[0];
        const sorted = [...normalized].sort((a, b) =>
            Math.min(a.anchor, a.head) - Math.min(b.anchor, b.head));
        let result = '';
        let previousEnd = 0;
        const positions = new Map();
        for (const cursor of sorted) {
            const start = Math.min(cursor.anchor, cursor.head);
            const end = Math.max(cursor.anchor, cursor.head);
            result += before.text.slice(previousEnd, start) + text;
            positions.set(cursor, { anchor: result.length, head: result.length });
            previousEnd = end;
        }
        result += before.text.slice(previousEnd);
        const selections = [positions.get(primaryCursor), ...sorted.filter(cursor => cursor !== primaryCursor).map(cursor => positions.get(cursor))];
        if (result !== before.text) {
            undo.push(before);
            redo.length = 0;
        }
        addingColumn = null;
        write(result, selections);
    }

    function travel(cursor, direction, granularity, extend) {
        select(cursor);
        window.getSelection().modify(extend ? 'extend' : 'move', direction, granularity);
        return readSelection();
    }

    function addCursor(direction) {
        const selections = captureSelection();
        const text = getText();
        const edge = direction < 0
            ? selections.reduce((a, b) => a.head < b.head ? a : b)
            : selections.reduce((a, b) => a.head > b.head ? a : b);
        const lineStart = edge.head === 0 ? 0 : text.lastIndexOf('\n', edge.head - 1) + 1;
        const lineEnd = text.indexOf('\n', edge.head);
        const nextStart = direction < 0
            ? (lineStart === 0 ? -1 : lineStart === 1 ? 0 : text.lastIndexOf('\n', lineStart - 2) + 1)
            : (lineEnd < 0 ? -1 : lineEnd + 1);
        if (nextStart < 0) return;
        addingColumn ??= [...text.slice(lineStart, edge.head)].length;
        const nextEnd = text.indexOf('\n', nextStart);
        const nextLine = text.slice(nextStart, nextEnd < 0 ? text.length : nextEnd);
        const head = nextStart + [...nextLine].slice(0, addingColumn).join('').length;
        // Flatten browser-created line-break elements before using text offsets.
        renderText(text);
        restoreSelection([...selections, { anchor: head, head }]);
    }

    function history(backwards) {
        const source = backwards ? undo : redo;
        const target = backwards ? redo : undo;
        if (!source.length) return false;
        target.push(snapshot());
        const state = source.pop();
        write(state.text, state.selections);
        return true;
    }

    // Capture before the app's evaluation, language-switch, and prefix handlers.
    input.addEventListener('keydown', event => {
        if (event.isComposing || event.keyCode === 229) return;
        let handled = false;
        if (event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey &&
            ['ArrowUp', 'ArrowDown'].includes(event.key)) {
            addCursor(event.key === 'ArrowUp' ? -1 : 1);
            handled = true;
        } else if ((event.ctrlKey || event.metaKey) && !event.altKey &&
            ['z', 'y'].includes(event.key.toLowerCase())) {
            handled = history(event.key.toLowerCase() === 'z' && !event.shiftKey);
        } else if (cursors && !event.altKey && !event.metaKey) {
            const backwards = ['ArrowLeft', 'ArrowUp', 'Home', 'Backspace'].includes(event.key);
            const direction = backwards ? 'backward' : 'forward';
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                let granularity = 'character';
                if (['Home', 'End'].includes(event.key)) granularity = event.ctrlKey ? 'documentboundary' : 'lineboundary';
                else if (['ArrowUp', 'ArrowDown'].includes(event.key)) granularity = 'line';
                else if (event.ctrlKey) granularity = 'word';
                restoreSelection(cursors.map(cursor => travel(cursor, direction, granularity, event.shiftKey)));
                addingColumn = null;
                handled = true;
            } else if (['Backspace', 'Delete'].includes(event.key)) {
                const selections = cursors.map(cursor => cursor.anchor !== cursor.head ? cursor :
                    travel(cursor, direction, event.ctrlKey ? 'word' : 'character', true));
                replaceSelections('', selections);
                handled = true;
            } else if (event.key === 'Enter' && event.shiftKey) {
                replaceSelections('\n');
                handled = true;
            } else if (event.key === 'Escape') {
                const primary = cursors[0];
                clear();
                select({ anchor: primary.head, head: primary.head });
                handled = true;
            } else if (event.ctrlKey && ['a', 'f', '/'].includes(event.key.toLowerCase())) {
                clear();
            }
        }
        if (handled) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    input.addEventListener('beforeinput', event => {
        if (!cursors || event.isComposing) return;
        if (['insertText', 'insertReplacementText', 'insertLineBreak', 'insertParagraph'].includes(event.inputType)) {
            event.preventDefault();
            replaceSelections(event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph' ? '\n' : event.data || '');
        }
    });

    input.addEventListener('paste', event => {
        if (!cursors) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        replaceSelections(event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n'));
    }, true);

    for (const type of ['copy', 'cut']) {
        input.addEventListener(type, event => {
            if (!cursors) return;
            const text = getText();
            const selected = [...cursors].sort((a, b) => Math.min(a.anchor, a.head) - Math.min(b.anchor, b.head))
                .map(cursor => text.slice(Math.min(cursor.anchor, cursor.head), Math.max(cursor.anchor, cursor.head)));
            if (!selected.some(Boolean)) return;
            event.preventDefault();
            event.clipboardData.setData('text/plain', selected.join('\n'));
            if (type === 'cut') replaceSelections('');
        });
    }

    input.addEventListener('pointerdown', clear);
    input.addEventListener('compositionstart', clear);
    input.addEventListener('input', () => {
        if (!internalInput) reset();
    });
    input.addEventListener('scroll', draw);
    input.addEventListener('focus', draw);
    input.addEventListener('blur', draw);
    window.addEventListener('resize', draw);
    new ResizeObserver(draw).observe(input);
    document.addEventListener('selectionchange', () => {
        if (!cursors || document.activeElement !== input) return;
        const primary = readSelection();
        if (primary.anchor !== cursors[0].anchor || primary.head !== cursors[0].head) clear();
    });

    return { captureSelection, restoreSelection, reset };
}
