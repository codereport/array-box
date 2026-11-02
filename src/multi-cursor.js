/** Multiple selections over a syntax-highlighted contenteditable editor.
 * Offsets use UTF-16, like DOM ranges. The browser handles word and glyph movement.
 */
export function createMultiCursorEditor(input, { getText, renderText }) {
    let cursors = null;
    let addingColumn = null;
    let internalInput = false;
    const undo = [];
    const redo = [];
    const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const overlay = document.createElement('div');
    const selectionHighlight = new Highlight();
    CSS.highlights.set('arraybox-multi-selection', selectionHighlight);
    overlay.className = 'multi-cursor-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
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
        overlay.hidden = true;
        input.classList.remove('multi-cursor-active');
        selectionHighlight.clear();
    }

    function reset() {
        clear();
        undo.length = redo.length = 0;
    }

    function draw() {
        overlay.replaceChildren();
        selectionHighlight.clear();
        const active = !!cursors && document.activeElement === input;
        input.classList.toggle('multi-cursor-active', active);
        overlay.hidden = !active;
        if (!active) return;
        overlay.style.left = `${input.offsetLeft}px`;
        overlay.style.top = `${input.offsetTop}px`;
        overlay.style.width = `${input.offsetWidth}px`;
        overlay.style.height = `${input.offsetHeight}px`;
        const bounds = input.getBoundingClientRect();
        const style = getComputedStyle(input);
        const lineHeight = parseFloat(style.lineHeight);
        const text = getText();
        const contentLeft = input.clientLeft + parseFloat(style.paddingLeft) - input.scrollLeft;
        const contentTop = input.clientTop + parseFloat(style.paddingTop) - input.scrollTop;
        const lineStarts = [0];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') lineStarts.push(i + 1);
        }
        const lineAt = position => lineStarts.findLastIndex(start => start <= position);
        function rectangle(left, line, width, className) {
            const element = document.createElement('span');
            element.className = className;
            Object.assign(element.style, {
                left: `${left}px`, top: `${contentTop + line * lineHeight}px`,
                width: `${width}px`, height: `${lineHeight}px`
            });
            overlay.append(element);
        }

        function caretLeft(position) {
            const range = document.createRange();
            range.setStart(...point(position));
            range.collapse(true);
            let rect = range.getClientRects()[0];
            if (!rect && position < text.length) {
                range.setEnd(...point(position + 1));
                rect = range.getClientRects()[0];
            }
            if (rect) return rect.left - bounds.left;
            if (position > 0 && text[position - 1] !== '\n') {
                range.setStart(...point(position - 1));
                range.setEnd(...point(position));
                const previous = range.getBoundingClientRect();
                if (previous.height) return previous.right - bounds.left;
            }
            return contentLeft;
        }

        for (const cursor of cursors) {
            const start = Math.min(cursor.anchor, cursor.head);
            const end = Math.max(cursor.anchor, cursor.head);
            if (start !== end) {
                const range = document.createRange();
                range.setStart(...point(start));
                range.setEnd(...point(end));
                selectionHighlight.add(range.cloneRange());
                // One rectangle per logical line avoids overlapping token boxes.
                for (let line = lineAt(start); line <= lineAt(end); line++) {
                    const segmentStart = Math.max(start, lineStarts[line]);
                    const segmentEnd = Math.min(end, (lineStarts[line + 1] ?? text.length + 1) - 1);
                    if (segmentStart >= end) break;
                    range.setStart(...point(segmentStart));
                    range.setEnd(...point(segmentEnd));
                    const rect = range.getBoundingClientRect();
                    rectangle(caretLeft(segmentStart), line, Math.max(2, rect.width), 'multi-cursor-selection');
                }
            } else {
                rectangle(caretLeft(cursor.head), lineAt(cursor.head), 2, 'multi-cursor-caret');
            }
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
        // Native movement can skip a trailing newline with no rendered glyph box.
        if (granularity === 'character') {
            const backwards = direction === 'backward';
            if (!extend && cursor.anchor !== cursor.head) {
                const head = backwards ? Math.min(cursor.anchor, cursor.head) : Math.max(cursor.anchor, cursor.head);
                return { anchor: head, head };
            }
            const text = getText();
            const segment = backwards
                ? [...graphemes.segment(text.slice(0, cursor.head))].at(-1)?.segment
                : graphemes.segment(text.slice(cursor.head))[Symbol.iterator]().next().value?.segment;
            const head = cursor.head + (backwards ? -1 : 1) * (segment?.length || 0);
            return { anchor: extend ? cursor.anchor : head, head };
        }
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
        if (event.isComposing) return;
        if (['insertLineBreak', 'insertParagraph'].includes(event.inputType)) {
            event.preventDefault();
            replaceSelections('\n');
        } else if (cursors && ['insertText', 'insertReplacementText'].includes(event.inputType)) {
            event.preventDefault();
            replaceSelections(event.data || '');
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
