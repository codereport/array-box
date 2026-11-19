import { BACKGROUND_SCENES } from './background-scenes.js';

export function createBackdropPicker(getCurrentIndex, onSelect, editorElement) {
    let dialog = null;
    let previousFocus = null;
    let previousRange = null;
    let previousOffsets = null;

    function textPoint(offset) {
        const walker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (offset <= node.length) return [node, offset];
            offset -= node.length;
        }
        return [editorElement, editorElement.childNodes.length];
    }

    function close() {
        if (!dialog) return;
        const closing = dialog;
        dialog = null;
        closing.close();
        closing.remove();
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        if (previousOffsets && editorElement.isConnected) {
            // Syntax highlighting can replace the editor's text nodes while the
            // picker is open, so restore by text offsets instead of a stale Range.
            window.getSelection().setBaseAndExtent(...textPoint(previousOffsets.anchor), ...textPoint(previousOffsets.head));
        } else if (previousRange?.startContainer.isConnected && previousRange.endContainer.isConnected) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(previousRange);
        }
        previousFocus = previousRange = previousOffsets = null;
    }

    function choose(index) {
        close();
        onSelect(index);
    }

    function open() {
        previousFocus = document.activeElement;
        const selection = window.getSelection();
        previousRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
        if (previousFocus === editorElement && editorElement.contains(selection?.anchorNode) && editorElement.contains(selection.focusNode)) {
            const offset = (node, position) => {
                const range = document.createRange();
                range.selectNodeContents(editorElement);range.setEnd(node, position);
                return range.toString().length;
            };
            previousOffsets = { anchor: offset(selection.anchorNode, selection.anchorOffset),
                head: offset(selection.focusNode, selection.focusOffset) };
        }
        const current = getCurrentIndex();
        dialog = document.createElement('dialog');
        dialog.className = 'backdrop-picker';
        dialog.setAttribute('aria-labelledby', 'backdrop-picker-title');
        dialog.setAttribute('aria-describedby', 'backdrop-picker-hint');
        const header = document.createElement('header');
        header.className = 'backdrop-picker-header';
        const heading = document.createElement('div');
        const title = document.createElement('h2');
        title.id = 'backdrop-picker-title';
        title.textContent = 'Backdrops';
        const hint = document.createElement('p');
        hint.id = 'backdrop-picker-hint';
        hint.textContent = 'Choose a view';
        heading.append(title, hint);
        const actions = document.createElement('div');
        actions.className = 'backdrop-picker-actions';
        const off = document.createElement('button');
        off.type = 'button';
        off.className = 'backdrop-picker-off';
        off.textContent = 'Off';
        off.setAttribute('aria-label', 'Turn backdrops off');
        off.setAttribute('aria-pressed', String(current < 0));
        off.addEventListener('click', () => choose(-1));
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'backdrop-picker-close';
        dismiss.setAttribute('aria-label', 'Close backdrops');
        dismiss.textContent = '×';
        dismiss.addEventListener('click', close);
        actions.append(off, dismiss);
        header.append(heading, actions);
        const grid = document.createElement('div');
        grid.className = 'backdrop-picker-grid';
        for (const [index, scene] of BACKGROUND_SCENES.entries()) {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'backdrop-card';
            card.dataset.scene = scene.id;
            card.dataset.index = String(index);
            card.setAttribute('aria-pressed', String(index === current));
            card.setAttribute('aria-label', `Use ${scene.name}`);
            const preview = document.createElement('div');
            preview.className = 'backdrop-card-preview';
            const image = document.createElement('img');
            image.alt = '';
            image.decoding = 'async';
            image.draggable = false;
            image.src = new URL(`../assets/backgrounds/previews/${scene.id}.webp`, import.meta.url).href;
            image.onerror = () => { image.onerror = null;image.src = scene.image; };
            preview.append(image);
            const text = document.createElement('span');
            text.className = 'backdrop-card-caption';
            const name = document.createElement('strong');
            name.textContent = scene.name;
            const location = document.createElement('span');
            location.className = 'backdrop-card-location';
            location.textContent = scene.effect === 'rain' ? 'Matrix rain · Yosemite' : scene.location || scene.subtitle;
            location.title = scene.location || scene.subtitle || scene.name;
            text.append(name, location);
            const credit = scene.photographer || scene.source;
            if (credit) {
                const source = document.createElement('small');
                source.textContent = credit;
                if (scene.date) source.textContent += ' · ' + new Intl.DateTimeFormat('en', {
                    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                }).format(new Date(`${scene.date}T00:00:00Z`));
                source.title = source.textContent;
                text.append(source);
            }
            card.append(preview, text);
            card.addEventListener('click', () => choose(index));
            grid.append(card);
        }
        const footer = document.createElement('footer');
        footer.className = 'backdrop-picker-footer';
        footer.textContent = '↑ ↓ ← → to browse · Enter to choose · Esc to close';
        const shortcut = document.createElement('span');
        shortcut.textContent = 'Ctrl+Shift+G';
        footer.append(shortcut);
        dialog.append(header, grid, footer);
        dialog.addEventListener('cancel', event => { event.preventDefault();close(); });
        dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) close();
        });
        document.body.append(dialog);
        dialog.showModal();
        const selected = grid.querySelector(`[data-index="${Math.max(0, current)}"]`);
        selected.focus({ preventScroll: true });
        selected.scrollIntoView({ block: 'nearest' });
    }

    function handleKeyDown(event) {
        if (!dialog) return;
        if (event.key === 'Escape') { event.preventDefault();close();return; }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const cards = [...dialog.querySelectorAll('.backdrop-card')];
        const index = Math.max(0, cards.indexOf(document.activeElement));
        const grid = dialog.querySelector('.backdrop-picker-grid');
        const columns = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length;
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : index + step;
        cards[Math.max(0, Math.min(cards.length - 1, target))].focus();
    }

    return { close, handleKeyDown, isOpen: () => Boolean(dialog),
        toggle: () => dialog ? close() : open(), destroy: close };
}
