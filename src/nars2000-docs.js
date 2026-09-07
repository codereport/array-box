/**
 * NARS2000 primitive documentation.
 *
 * Shared ISO APL primitives inherit the concise descriptions already used by
 * ArrayBox. NARS2000 extensions override or add entries from its official wiki.
 * Sources: https://wiki.nars2000.org/index.php?title=Language_Features
 */

import { aplGlyphDocs } from './apl-docs.js';

export const nars2000DocsMeta = {
    language: 'NARS2000',
    source: 'https://wiki.nars2000.org/index.php?title=Language_Features',
    createdAt: '2026-09-06',
    version: '1.0.0'
};

const wiki = (page) => `https://wiki.nars2000.org/index.php?title=${page}`;
const sharedAplDocs = Object.fromEntries(Object.entries(aplGlyphDocs).filter(
    ([glyph]) => !['⌸', '⌺', '⌶', '⍛'].includes(glyph)
));

export const nars2000GlyphDocs = {
    ...sharedAplDocs,
    'π': {
        glyph: 'π',
        type: 'function',
        docUrl: wiki('Primes'),
        monad: {
            name: 'Prime Factors',
            description: 'Returns the prime factors of a positive integer.',
            example: 'π120 → 2 2 2 3 5'
        },
        dyad: {
            name: 'Number-Theoretic Function',
            description: 'Selects a number-theoretic function with the left argument, including primality, adjacent primes, divisor functions, Möbius, and Euler totient.',
            example: '0π1000003 → 1'
        }
    },
    '√': {
        glyph: '√',
        type: 'function',
        docUrl: wiki('Root'),
        monad: {
            name: 'Square Root',
            description: 'Returns the principal square root of the right argument.',
            example: '√9 → 3'
        },
        dyad: {
            name: 'Root',
            description: 'Returns the left-argument root of the right argument.',
            example: '3√8 → 2'
        }
    },
    '§': {
        glyph: '§',
        type: 'function',
        docUrl: wiki('Sets'),
        dyad: {
            name: 'Symmetric Difference',
            description: 'Returns elements found in either argument but not in both.',
            example: '1 2 3 § 3 4 → 1 2 4'
        }
    },
    '⊆': {
        glyph: '⊆',
        type: 'function',
        docUrl: wiki('Sets'),
        dyad: {
            name: 'Subset',
            description: 'Returns a Boolean scalar indicating whether the left argument is a subset of the right argument.',
            example: '1 2 ⊆ 1 2 3 → 1'
        }
    },
    '⊇': {
        glyph: '⊇',
        type: 'function',
        docUrl: wiki('Sets'),
        dyad: {
            name: 'Superset',
            description: 'Returns a Boolean scalar indicating whether the left argument is a superset of the right argument.',
            example: '1 2 3 ⊇ 1 2 → 1'
        }
    },
    '..': {
        glyph: '..',
        type: 'function',
        docUrl: wiki('Sequence'),
        dyad: {
            name: 'Sequence',
            description: 'Generates an inclusive integer sequence between the left and right arguments.',
            example: '2..5 → 2 3 4 5'
        }
    },
    '‼': {
        glyph: '‼',
        type: 'operator',
        docUrl: wiki('Combinatorial'),
        monad: {
            name: 'Combinatorial',
            description: 'Counts or generates one of twelve families of combinatorial arrays. The operand selects the family and whether to count or generate.',
            example: '10‼2 5'
        }
    },
    '⌻': {
        glyph: '⌻',
        type: 'operator',
        docUrl: wiki('Matrix'),
        monad: {
            name: 'Matrix',
            description: 'Applies its operand to a diagonalizable matrix as a whole; with jot, constructs a matrix representation.',
            example: '∘⌻⍳4'
        }
    },
    '∂': {
        glyph: '∂',
        type: 'operator',
        docUrl: wiki('Derivative'),
        monad: {
            name: 'Derivative',
            description: 'Derives a numerical derivative from its function operand. Repetition selects higher derivatives.',
            example: '*∂ 1'
        }
    },
    '∫': {
        glyph: '∫',
        type: 'operator',
        docUrl: wiki('Integral'),
        monad: {
            name: 'Integral',
            description: 'Computes a definite numerical integral. The optional left argument is the lower bound; the right argument is the upper bound.',
            example: '0 *∫ 1 → 1.718281828'
        }
    },
    '⍡': {
        glyph: '⍡',
        type: 'operator',
        docUrl: wiki('Convolution'),
        dyad: {
            name: 'Convolution',
            description: 'Derives a convolution from left and right function operands.',
            example: 'L f⍡g R'
        }
    },
    '⍦': {
        glyph: '⍦',
        type: 'operator',
        docUrl: wiki('Multisets'),
        monad: {
            name: 'Multisets',
            description: 'Applies its operand using multiset semantics, retaining element multiplicities.',
            example: '∪⍦π120'
        }
    },
    '⊙': {
        glyph: '⊙',
        type: 'operator',
        docUrl: wiki('Null'),
        monad: {
            name: 'Null',
            description: 'Derives a function that ignores an argument according to null-operator semantics.',
            example: 'f⊙ R'
        }
    },
    '⍢': {
        glyph: '⍢',
        type: 'operator',
        docUrl: wiki('Dual'),
        dyad: {
            name: 'Dual',
            description: 'Applies a function through a transformation supplied by the other operand.',
            example: 'f⍢g R'
        }
    },
    '⍫': {
        glyph: '⍫',
        type: 'operator',
        docUrl: wiki('Language_Features'),
        dyad: {
            name: 'Commutator',
            description: 'NARS2000 reserves this glyph for the commutator operator.',
            example: 'f⍫g R'
        }
    },
    'χ': {
        glyph: 'χ',
        type: 'syntax',
        docUrl: wiki('Anonymous_Functions/Operators/Hyperators#Axis_Operator'),
        monad: {
            name: 'Axis Operator Symbol',
            description: 'Names the axis operator in NARS2000 anonymous function, operator, and hyperator definitions.',
            example: 'χ'
        }
    },
    '∞': {
        glyph: '∞',
        type: 'syntax',
        docUrl: wiki('System_Variable_IC'),
        monad: {
            name: 'Infinity',
            description: 'A numeric infinity value supported by NARS2000 arithmetic.',
            example: '∞'
        }
    },
    '∅': {
        glyph: '∅',
        type: 'syntax',
        docUrl: wiki('Character_names'),
        monad: {
            name: 'NaN',
            description: 'Represents the NARS2000 not-a-number datatype.',
            example: '∅'
        }
    }
};

export function getNars2000HoverContent(glyph) {
    return nars2000GlyphDocs[glyph] || null;
}

export default nars2000GlyphDocs;
