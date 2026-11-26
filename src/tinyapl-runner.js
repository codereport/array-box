const OPENERS = new Set(['(', '{', '⦅', '⟨', '[', '⦃', '⦋', '⋄']);
const CLOSERS = new Set([')', '}', '⦆', '⟩', ']', '⦄', '⦌', '⋄']);

// Array Box treats each editor line as a statement. TinyAPL treats a single
// newline as whitespace, so insert diamonds between statements, but never at
// the edges of a function body or other delimited expression.
export function prepareTinyaplCode(code) {
    const parts = [];
    let previous = '';
    let whitespace = false;
    let newline = false;

    for (let i = 0; i < code.length;) {
        const ch = code[i];
        if (/\s/.test(ch)) {
            whitespace = true;
            newline ||= ch === '\n' || ch === '\r';
            i++;
            continue;
        }
        if (ch === '⍝') {
            while (i < code.length && code[i] !== '\n' && code[i] !== '\r') i++;
            whitespace = true;
            continue;
        }
        if (ch === '⟃') {
            const end = code.indexOf('⟄', i + 1);
            // Leave an unclosed comment for the interpreter to diagnose.
            if (end === -1) {
                parts.push(' ', code.slice(i));
                break;
            }
            i = end + 1;
            whitespace = true;
            continue;
        }

        const start = i++;
        if (ch === '"' || ch === "'") {
            while (i < code.length) {
                const next = code[i++];
                if (ch === '"' && next === '⍘') i++;
                else if (next === ch) break;
            }
        }
        const token = code.slice(start, i);
        if (parts.length && newline && !OPENERS.has(previous) && !CLOSERS.has(ch)) {
            parts.push(' ⋄ ');
        } else if (parts.length && whitespace) {
            parts.push(' ');
        }
        parts.push(token);
        previous = token.at(-1);
        whitespace = false;
        newline = false;
    }

    return parts.join('');
}
