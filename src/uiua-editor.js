/** Map DOM selections through Uiua's formatter source map (UTF-16 offsets).
 * Each entry contains original start/end and formatted start/end offsets.
 */
export function mapUiuaSelections(selections, glyphMap, formattedLength) {
    function map(position, bias) {
        let previousEnd = 0;
        let previousFormattedEnd = 0;
        for (const [start, end, formattedStart, formattedEnd] of glyphMap) {
            if (position < start) {
                return bias === 0 ? previousFormattedEnd + position - previousEnd :
                    formattedStart - (start - position);
            }
            if (position === start) return formattedStart;
            if (position === end) return formattedEnd;
            if (position <= end) {
                return end - start === formattedEnd - formattedStart
                    ? formattedStart + position - start
                    : bias === 0 ? formattedStart : formattedEnd;
            }
            previousEnd = end;
            previousFormattedEnd = formattedEnd;
        }
        return previousFormattedEnd + position - previousEnd;
    }
    const clamp = offset => Math.max(0, Math.min(offset, formattedLength));
    return selections.map(({ anchor, head }) => {
        // Match Uiua's editor: backward selections favor glyph starts, forward
        // selections and collapsed carets favor glyph ends after conversion.
        const bias = head < anchor ? 0 : 1;
        return { anchor: clamp(map(anchor, bias)), head: clamp(map(head, bias)) };
    });
}
