import { spec } from 'node:test/reporters';
import { compose } from 'node:stream';

// Spec includes a final list of failed tests with their locations and errors.
// Color only the report in Actions: FORCE_COLOR would also color child-process
// output that tests may need to parse (for example, numeric process IDs).
export default async function* report(source) {
    const colorize = process.env.GITHUB_ACTIONS === 'true' &&
        !('NO_COLOR' in process.env) && process.env.FORCE_COLOR !== '0';

    for await (const chunk of compose(source, new spec())) {
        if (!colorize) {
            yield chunk;
            continue;
        }

        yield String(chunk).replace(/^(\s*)([✔✖ℹ﹣▶].*)$/gm, (line, indent, text) => {
            const color = text.startsWith('✖') || /^ℹ (fail|cancelled) [1-9]/.test(text) ? 31 :
                text.startsWith('✔') ? 32 :
                text.startsWith('﹣') || /^ℹ (skipped|todo) [1-9]/.test(text) ? 33 : 36;
            return `${indent}\x1b[${color}m${text}\x1b[0m`;
        });
    }
}
