/**
 * Dyalog APL Primitive Documentation
 * 
 * Hand-crafted from official Dyalog APL documentation
 * Source: https://docs.dyalog.com/20.0/language-reference-guide/
 * Created: 2026-01-28
 * 
 * LICENSE ATTRIBUTION:
 * The documentation content in this file is derived from the Dyalog APL documentation.
 * Copyright (c) 1982-2026 Dyalog Limited
 * License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 * See THIRD_PARTY_LICENSES.md for full license text.
 */

export const aplDocsMeta = {
    "language": "Dyalog APL",
    "source": "https://docs.dyalog.com/20.0/language-reference-guide/",
    "createdAt": "2026-01-28",
    "version": "1.0.0"
};

/**
 * Dyalog APL primitive documentation for hover tooltips
 * 
 * Structure for each glyph:
 * - glyph: The primitive character
 * - type: 'function' | 'operator' | 'syntax'
 * - docUrl: Link to full documentation
 * - monad: { name, description, example }
 * - dyad: { name, description, example }
 */
export const aplGlyphDocs = {
    "+": {
        "glyph": "+",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/conjugate/",
        "monad": {
            "name": "Conjugate",
            "description": "Complex conjugate of the argument. For real numbers, returns the argument unchanged.",
            "example": "+3j4 → 3j¯4\n+5 → 5"
        },
        "dyad": {
            "name": "Plus",
            "description": "Sum of the arguments. Pervasive scalar function.",
            "example": "2+3 → 5\n1 2 3+10 20 30 → 11 22 33"
        }
    },
    "-": {
        "glyph": "-",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/negate/",
        "monad": {
            "name": "Negate",
            "description": "Arithmetic negation. Changes the sign of the argument.",
            "example": "-5 → ¯5\n-¯3 → 3"
        },
        "dyad": {
            "name": "Minus",
            "description": "Difference of the arguments. Subtracts right from left.",
            "example": "5-3 → 2\n10 20 30-1 2 3 → 9 18 27"
        }
    },
    "×": {
        "glyph": "×",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/direction/",
        "monad": {
            "name": "Direction (Signum)",
            "description": "Returns ¯1, 0, or 1 depending on whether the argument is negative, zero, or positive. For complex numbers, returns unit vector.",
            "example": "×¯5 → ¯1\n×0 → 0\n×5 → 1"
        },
        "dyad": {
            "name": "Times",
            "description": "Product of the arguments. Pervasive scalar function.",
            "example": "3×4 → 12\n2 3 4×10 → 20 30 40"
        }
    },
    "÷": {
        "glyph": "÷",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/reciprocal/",
        "monad": {
            "name": "Reciprocal",
            "description": "Returns 1 divided by the argument.",
            "example": "÷4 → 0.25\n÷0.5 → 2"
        },
        "dyad": {
            "name": "Divide",
            "description": "Quotient of the arguments. Divides left by right.",
            "example": "12÷4 → 3\n10÷3 → 3.333..."
        }
    },
    "|": {
        "glyph": "|",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/magnitude/",
        "monad": {
            "name": "Magnitude",
            "description": "Absolute value. For complex numbers, returns the distance from origin.",
            "example": "|¯5 → 5\n|3j4 → 5"
        },
        "dyad": {
            "name": "Residue",
            "description": "Remainder after division (modulo). Result has the same sign as the left argument.",
            "example": "3|7 → 1\n3|¯7 → 2"
        }
    },
    "⌈": {
        "glyph": "⌈",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/ceiling/",
        "monad": {
            "name": "Ceiling",
            "description": "Smallest integer greater than or equal to the argument.",
            "example": "⌈3.4 → 4\n⌈¯3.4 → ¯3"
        },
        "dyad": {
            "name": "Maximum",
            "description": "Returns the larger of the two arguments.",
            "example": "3⌈5 → 5\n1 5 3⌈4 2 6 → 4 5 6"
        }
    },
    "⌊": {
        "glyph": "⌊",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/floor/",
        "monad": {
            "name": "Floor",
            "description": "Largest integer less than or equal to the argument.",
            "example": "⌊3.7 → 3\n⌊¯3.7 → ¯4"
        },
        "dyad": {
            "name": "Minimum",
            "description": "Returns the smaller of the two arguments.",
            "example": "3⌊5 → 3\n1 5 3⌊4 2 6 → 1 2 3"
        }
    },
    "*": {
        "glyph": "*",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/exponential/",
        "monad": {
            "name": "Exponential",
            "description": "e raised to the power of the argument.",
            "example": "*1 → 2.718...\n*0 → 1"
        },
        "dyad": {
            "name": "Power",
            "description": "Left argument raised to the power of the right argument.",
            "example": "2*3 → 8\n10*2 → 100"
        }
    },
    "⍟": {
        "glyph": "⍟",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/natural-logarithm/",
        "monad": {
            "name": "Natural Logarithm",
            "description": "Logarithm base e of the argument.",
            "example": "⍟2.718... → 1\n⍟10 → 2.302..."
        },
        "dyad": {
            "name": "Logarithm",
            "description": "Logarithm of right argument to the base of left argument.",
            "example": "10⍟100 → 2\n2⍟8 → 3"
        }
    },
    "!": {
        "glyph": "!",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/factorial/",
        "monad": {
            "name": "Factorial",
            "description": "Product of integers from 1 to the argument. For non-integers, uses gamma function.",
            "example": "!5 → 120\n!0 → 1"
        },
        "dyad": {
            "name": "Binomial",
            "description": "Number of combinations of right items taken left at a time.",
            "example": "2!5 → 10\n3!7 → 35"
        }
    },
    "○": {
        "glyph": "○",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/pi-times/",
        "monad": {
            "name": "Pi Times",
            "description": "Argument multiplied by π.",
            "example": "○1 → 3.14159...\n○0.5 → 1.5707..."
        },
        "dyad": {
            "name": "Circular Functions",
            "description": "Trigonometric and hyperbolic functions. Left argument selects function (0=sine, 1=cos, 2=tan, etc.).",
            "example": "1○0 → 0 (sin 0)\n2○0 → 1 (cos 0)"
        }
    },
    "?": {
        "glyph": "?",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/roll/",
        "monad": {
            "name": "Roll",
            "description": "Random integer from 1 to argument (with ⎕IO=1) or 0 to argument-1 (with ⎕IO=0).",
            "example": "?6 → random 1-6\n?0 → random float 0-1"
        },
        "dyad": {
            "name": "Deal",
            "description": "Left random integers from 1 to right, without replacement.",
            "example": "3?10 → 3 unique random from 1-10"
        }
    },
    "~": {
        "glyph": "~",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/not/",
        "monad": {
            "name": "NOT",
            "description": "Logical negation. Returns 1 for 0 and 0 for 1.",
            "example": "~0 → 1\n~1 → 0\n~0 1 1 0 → 1 0 0 1"
        },
        "dyad": {
            "name": "Without",
            "description": "Remove elements of right argument that appear in left argument.",
            "example": "1 2 3 4 5~2 4 → 1 3 5"
        }
    },
    "∧": {
        "glyph": "∧",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/lowest-common-multiple-and/",
        "dyad": {
            "name": "Lowest Common Multiple / AND",
            "description": "For booleans, logical AND. For integers, lowest common multiple.",
            "example": "1∧1 → 1\n1∧0 → 0\n12∧18 → 36 (LCM)"
        }
    },
    "∨": {
        "glyph": "∨",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/greatest-common-divisor-or/",
        "dyad": {
            "name": "Greatest Common Divisor / OR",
            "description": "For booleans, logical OR. For integers, greatest common divisor.",
            "example": "0∨1 → 1\n0∨0 → 0\n12∨18 → 6 (GCD)"
        }
    },
    "⍲": {
        "glyph": "⍲",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/nand/",
        "dyad": {
            "name": "NAND",
            "description": "Logical NAND. Returns 0 only when both arguments are 1.",
            "example": "1⍲1 → 0\n1⍲0 → 1\n0⍲0 → 1"
        }
    },
    "⍱": {
        "glyph": "⍱",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/nor/",
        "dyad": {
            "name": "NOR",
            "description": "Logical NOR. Returns 1 only when both arguments are 0.",
            "example": "0⍱0 → 1\n0⍱1 → 0\n1⍱1 → 0"
        }
    },
    "<": {
        "glyph": "<",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/less-than/",
        "dyad": {
            "name": "Less Than",
            "description": "Returns 1 if left is less than right, 0 otherwise.",
            "example": "3<5 → 1\n5<3 → 0"
        }
    },
    ">": {
        "glyph": ">",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/greater-than/",
        "dyad": {
            "name": "Greater Than",
            "description": "Returns 1 if left is greater than right, 0 otherwise.",
            "example": "5>3 → 1\n3>5 → 0"
        }
    },
    "=": {
        "glyph": "=",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/equal-to/",
        "dyad": {
            "name": "Equal To",
            "description": "Returns 1 if arguments are equal, 0 otherwise. Scalar comparison.",
            "example": "3=3 → 1\n3=4 → 0"
        }
    },
    "≠": {
        "glyph": "≠",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/unique-mask/",
        "monad": {
            "name": "Unique Mask",
            "description": "Boolean mask where 1 marks first occurrence of each unique element.",
            "example": "≠'mississippi' → 1 1 1 0 0 0 0 1 0 0 0"
        },
        "dyad": {
            "name": "Not Equal To",
            "description": "Returns 1 if arguments are not equal, 0 otherwise.",
            "example": "3≠4 → 1\n3≠3 → 0"
        }
    },
    "≤": {
        "glyph": "≤",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/less-than-or-equal-to/",
        "dyad": {
            "name": "Less Than or Equal To",
            "description": "Returns 1 if left is less than or equal to right.",
            "example": "3≤5 → 1\n3≤3 → 1\n5≤3 → 0"
        }
    },
    "≥": {
        "glyph": "≥",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/greater-than-or-equal-to/",
        "dyad": {
            "name": "Greater Than or Equal To",
            "description": "Returns 1 if left is greater than or equal to right.",
            "example": "5≥3 → 1\n3≥3 → 1\n3≥5 → 0"
        }
    },
    "≡": {
        "glyph": "≡",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/depth/",
        "monad": {
            "name": "Depth",
            "description": "Nesting depth of the array. Simple scalars have depth 0.",
            "example": "≡5 → 0\n≡'abc' → 1\n≡(1 2)(3 4) → 2"
        },
        "dyad": {
            "name": "Match",
            "description": "Returns 1 if arguments are identical in structure and values.",
            "example": "(1 2 3)≡(1 2 3) → 1\n(1 2)≡(1 2 3) → 0"
        }
    },
    "≢": {
        "glyph": "≢",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/tally/",
        "monad": {
            "name": "Tally",
            "description": "Number of major cells (first dimension). Scalars have tally 1.",
            "example": "≢1 2 3 4 5 → 5\n≢3 4⍴⍳12 → 3"
        },
        "dyad": {
            "name": "Not Match",
            "description": "Returns 1 if arguments differ in structure or values.",
            "example": "(1 2)≢(1 2 3) → 1\n(1 2 3)≢(1 2 3) → 0"
        }
    },
    "⍴": {
        "glyph": "⍴",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/shape/",
        "monad": {
            "name": "Shape",
            "description": "Returns the dimensions of the array.",
            "example": "⍴1 2 3 → 3\n⍴3 4⍴⍳12 → 3 4"
        },
        "dyad": {
            "name": "Reshape",
            "description": "Creates array with shape of left argument, filled with values from right.",
            "example": "2 3⍴1 2 3 4 5 6 → 2×3 matrix\n3 3⍴1 → 3×3 matrix of 1s"
        }
    },
    ",": {
        "glyph": ",",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/ravel/",
        "monad": {
            "name": "Ravel",
            "description": "Flattens array to a vector.",
            "example": ",2 3⍴⍳6 → 1 2 3 4 5 6"
        },
        "dyad": {
            "name": "Catenate / Laminate",
            "description": "Joins arrays along last axis. With fractional axis, laminates (joins as new dimension).",
            "example": "1 2 3,4 5 6 → 1 2 3 4 5 6"
        }
    },
    "⍪": {
        "glyph": "⍪",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/table/",
        "monad": {
            "name": "Table",
            "description": "Converts to 2D matrix. Vectors become single-column matrices.",
            "example": "⍪1 2 3 → 3 1 matrix"
        },
        "dyad": {
            "name": "Catenate First",
            "description": "Joins arrays along first axis.",
            "example": "(2 3⍴⍳6)⍪(2 3⍴7+⍳6) → 4×3 matrix"
        }
    },
    "⌽": {
        "glyph": "⌽",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/reverse/",
        "monad": {
            "name": "Reverse",
            "description": "Reverses elements along last axis.",
            "example": "⌽1 2 3 4 5 → 5 4 3 2 1"
        },
        "dyad": {
            "name": "Rotate",
            "description": "Rotates elements along last axis. Positive rotates left.",
            "example": "2⌽1 2 3 4 5 → 3 4 5 1 2"
        }
    },
    "⊖": {
        "glyph": "⊖",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/reverse-first/",
        "monad": {
            "name": "Reverse First",
            "description": "Reverses elements along first axis.",
            "example": "⊖3 3⍴⍳9 → rows reversed"
        },
        "dyad": {
            "name": "Rotate First",
            "description": "Rotates elements along first axis.",
            "example": "1⊖3 3⍴⍳9 → rows rotated"
        }
    },
    "⍉": {
        "glyph": "⍉",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/transpose/",
        "monad": {
            "name": "Transpose",
            "description": "Reverses the order of axes. For matrices, swaps rows and columns.",
            "example": "⍉2 3⍴⍳6 → 3 2 matrix"
        },
        "dyad": {
            "name": "Dyadic Transpose",
            "description": "Reorders axes according to left argument.",
            "example": "2 1⍉M → same as ⍉M for matrix"
        }
    },
    "↑": {
        "glyph": "↑",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/mix/",
        "monad": {
            "name": "Mix",
            "description": "Combines nested array elements into higher-rank array.",
            "example": "↑(1 2)(3 4)(5 6) → 3×2 matrix"
        },
        "dyad": {
            "name": "Take",
            "description": "Selects first (positive) or last (negative) elements along each axis.",
            "example": "3↑1 2 3 4 5 → 1 2 3\n¯2↑1 2 3 4 5 → 4 5"
        }
    },
    "↓": {
        "glyph": "↓",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/split/",
        "monad": {
            "name": "Split",
            "description": "Splits array along last axis into nested vector.",
            "example": "↓3 3⍴⍳9 → (1 2 3)(4 5 6)(7 8 9)"
        },
        "dyad": {
            "name": "Drop",
            "description": "Removes first (positive) or last (negative) elements along each axis.",
            "example": "2↓1 2 3 4 5 → 3 4 5\n¯2↓1 2 3 4 5 → 1 2 3"
        }
    },
    "⊂": {
        "glyph": "⊂",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/enclose/",
        "monad": {
            "name": "Enclose",
            "description": "Creates a scalar containing the argument. Simple scalars are unchanged.",
            "example": "⊂1 2 3 → nested scalar\n⊂5 → 5"
        },
        "dyad": {
            "name": "Partitioned Enclose",
            "description": "Partitions right argument where left argument changes from 0 to 1.",
            "example": "1 0 0 1 0⊂'hello' → 'hel' 'lo'"
        }
    },
    "⊃": {
        "glyph": "⊃",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/first/",
        "monad": {
            "name": "First / Disclose",
            "description": "Returns first element. For nested scalars, returns contents.",
            "example": "⊃1 2 3 → 1\n⊃⊂1 2 3 → 1 2 3"
        },
        "dyad": {
            "name": "Pick",
            "description": "Selects element at position specified by left argument.",
            "example": "2⊃'abc' → 'b'\n(2 1)⊃(1 2)(3 4) → 3"
        }
    },
    "⊆": {
        "glyph": "⊆",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/nest/",
        "monad": {
            "name": "Nest",
            "description": "Encloses simple arrays, leaves nested arrays unchanged.",
            "example": "⊆1 2 3 → ⊂1 2 3\n⊆(1 2)(3 4) → (1 2)(3 4)"
        },
        "dyad": {
            "name": "Partition",
            "description": "Partitions right argument. Each positive integer in left starts a new partition.",
            "example": "1 1 2 2 2⊆'hello' → 'he' 'llo'"
        }
    },
    "∊": {
        "glyph": "∊",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/enlist/",
        "monad": {
            "name": "Enlist",
            "description": "Flattens nested array to simple vector of atoms.",
            "example": "∊(1 2)(3(4 5)) → 1 2 3 4 5"
        },
        "dyad": {
            "name": "Membership",
            "description": "Returns 1 for each left element found in right, 0 otherwise.",
            "example": "2 5 7∊1 2 3 4 5 → 1 1 0"
        }
    },
    "∩": {
        "glyph": "∩",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/intersection/",
        "dyad": {
            "name": "Intersection",
            "description": "Elements that appear in both arguments.",
            "example": "1 2 3 4∩2 4 6 → 2 4"
        }
    },
    "∪": {
        "glyph": "∪",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/unique/",
        "monad": {
            "name": "Unique",
            "description": "Removes duplicate major cells.",
            "example": "∪1 2 2 3 1 → 1 2 3"
        },
        "dyad": {
            "name": "Union",
            "description": "All unique elements from both arguments.",
            "example": "1 2 3∪2 3 4 → 1 2 3 4"
        }
    },
    "⊣": {
        "glyph": "⊣",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/same/",
        "monad": {
            "name": "Same",
            "description": "Returns the argument unchanged.",
            "example": "⊣5 → 5"
        },
        "dyad": {
            "name": "Left",
            "description": "Returns the left argument.",
            "example": "3⊣5 → 3"
        }
    },
    "⊢": {
        "glyph": "⊢",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/same/",
        "monad": {
            "name": "Same",
            "description": "Returns the argument unchanged.",
            "example": "⊢5 → 5"
        },
        "dyad": {
            "name": "Right",
            "description": "Returns the right argument.",
            "example": "3⊢5 → 5"
        }
    },
    "⍳": {
        "glyph": "⍳",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/index-generator/",
        "monad": {
            "name": "Index Generator",
            "description": "Generates indices. For scalar n, produces 1 to n (or 0 to n-1 with ⎕IO=0).",
            "example": "⍳5 → 1 2 3 4 5 (⎕IO=1)\n⍳3 3 → 3×3 matrix of coordinate pairs"
        },
        "dyad": {
            "name": "Index Of",
            "description": "Position of right elements in left. Returns ⎕IO+≢left if not found.",
            "example": "'abcde'⍳'cab' → 3 1 2"
        }
    },
    "⍸": {
        "glyph": "⍸",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/where/",
        "monad": {
            "name": "Where",
            "description": "Indices where argument is 1. For higher-rank, returns coordinate vectors.",
            "example": "⍸0 1 0 1 1 → 2 4 5 (⎕IO=1)"
        },
        "dyad": {
            "name": "Interval Index",
            "description": "For each right element, index of interval in sorted left where it belongs.",
            "example": "10 20 30⍸15 25 5 35 → 1 2 0 3"
        }
    },
    "⍋": {
        "glyph": "⍋",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/grade-up/",
        "monad": {
            "name": "Grade Up",
            "description": "Indices that would sort argument in ascending order.",
            "example": "⍋3 1 4 1 5 → 2 4 1 3 5"
        },
        "dyad": {
            "name": "Dyadic Grade Up",
            "description": "Grade using collation sequence from left argument.",
            "example": "'abc'⍋'cab' → 2 3 1"
        }
    },
    "⍒": {
        "glyph": "⍒",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/grade-down/",
        "monad": {
            "name": "Grade Down",
            "description": "Indices that would sort argument in descending order.",
            "example": "⍒3 1 4 1 5 → 5 3 1 2 4"
        },
        "dyad": {
            "name": "Dyadic Grade Down",
            "description": "Grade descending using collation sequence from left argument.",
            "example": "'abc'⍒'cab' → 1 3 2"
        }
    },
    "⍷": {
        "glyph": "⍷",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/find/",
        "dyad": {
            "name": "Find",
            "description": "Boolean array marking start positions of left in right.",
            "example": "'is'⍷'mississippi' → 0 0 1 0 0 1 0 0 0 0 0"
        }
    },
    "⌷": {
        "glyph": "⌷",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/materialise/",
        "monad": {
            "name": "Materialise",
            "description": "Forces evaluation of a lazy/virtual array.",
            "example": "⌷⍳1000000 → materialised vector"
        },
        "dyad": {
            "name": "Index",
            "description": "Selects elements at indices specified by left argument.",
            "example": "2 4⌷'abcde' → 'bd'"
        }
    },
    "⊥": {
        "glyph": "⊥",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/decode/",
        "dyad": {
            "name": "Decode (Base)",
            "description": "Evaluates right argument in number system with radices from left.",
            "example": "2⊥1 0 1 1 → 11 (binary)\n60⊥1 30 0 → 5400 (time)"
        }
    },
    "⊤": {
        "glyph": "⊤",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/encode/",
        "dyad": {
            "name": "Encode (Represent)",
            "description": "Represents right argument in number system with radices from left.",
            "example": "2 2 2 2⊤11 → 1 0 1 1 (binary)\n24 60 60⊤5400 → 1 30 0"
        }
    },
    "⌹": {
        "glyph": "⌹",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/matrix-inverse/",
        "monad": {
            "name": "Matrix Inverse",
            "description": "Inverse of a square matrix.",
            "example": "⌹2 2⍴1 2 3 4 → inverse matrix"
        },
        "dyad": {
            "name": "Matrix Divide",
            "description": "Solves system of linear equations or least-squares fit.",
            "example": "B⌹A → solution to Ax=B"
        }
    },
    "/": {
        "glyph": "/",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/replicate/",
        "monad": {
            "name": "Reduce",
            "description": "Inserts function between elements along last axis.",
            "example": "+/1 2 3 4 → 10\n×/1 2 3 4 → 24"
        },
        "dyad": {
            "name": "Replicate",
            "description": "Replicates elements of right according to left. Booleans compress.",
            "example": "1 0 1 0 1/'abcde' → 'ace'\n2 3 1/'abc' → 'aabbbc'"
        }
    },
    "\\": {
        "glyph": "\\",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/expand/",
        "monad": {
            "name": "Scan",
            "description": "Running reduction along last axis.",
            "example": "+\\1 2 3 4 → 1 3 6 10"
        },
        "dyad": {
            "name": "Expand",
            "description": "Expands right by inserting fill elements where left is 0.",
            "example": "1 0 1 0 1\\'abc' → 'a b c'"
        }
    },
    "⌿": {
        "glyph": "⌿",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/replicate-first/",
        "monad": {
            "name": "Reduce First",
            "description": "Inserts function between elements along first axis.",
            "example": "+⌿3 3⍴⍳9 → column sums"
        },
        "dyad": {
            "name": "Replicate First",
            "description": "Replicates along first axis.",
            "example": "1 0 1⌿3 3⍴⍳9 → rows 1 and 3"
        }
    },
    "⍀": {
        "glyph": "⍀",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/expand-first/",
        "monad": {
            "name": "Scan First",
            "description": "Running reduction along first axis.",
            "example": "+⍀3 3⍴⍳9 → cumulative column sums"
        },
        "dyad": {
            "name": "Expand First",
            "description": "Expands along first axis.",
            "example": "1 0 1⍀2 3⍴⍳6 → inserts row of zeros"
        }
    },
    "¨": {
        "glyph": "¨",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/each/",
        "monad": {
            "name": "Each",
            "description": "Applies function to each element of array(s).",
            "example": "⌽¨'abc' 'de' → 'cba' 'ed'\n1 2 3+¨10 20 30 → 11 22 33"
        }
    },
    "⍨": {
        "glyph": "⍨",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/commute/",
        "monad": {
            "name": "Commute / Self",
            "description": "Monadic: applies function with same argument on both sides. Dyadic: swaps arguments.",
            "example": "+⍨5 → 10 (5+5)\n2-⍨5 → 3 (5-2)"
        }
    },
    "∘": {
        "glyph": "∘",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/beside/",
        "monad": {
            "name": "Beside / Bind",
            "description": "Composes functions (f∘g: apply g then f) or binds argument to function.",
            "example": "-∘÷ 4 → -÷4 → ¯0.25\n2∘* 3 → 2*3 → 8"
        }
    },
    "⍤": {
        "glyph": "⍤",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/atop/",
        "monad": {
            "name": "Atop / Rank",
            "description": "Atop: f⍤g applies f to result of g. Rank: applies function to cells of specified rank.",
            "example": "-⍤÷ 4 → -(÷4) → ¯0.25\n⊂⍤1 ⊢ 2 3⍴⍳6 → enclose each row"
        }
    },
    "⍥": {
        "glyph": "⍥",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/over/",
        "monad": {
            "name": "Over",
            "description": "Applies right operand to arguments, then left operand to results.",
            "example": "+⍥⌈ 2.3 4.7 → 7 (⌈2.3)+⌈4.7"
        }
    },
    "⍣": {
        "glyph": "⍣",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/power/",
        "monad": {
            "name": "Power Operator",
            "description": "Repeats function application. Right operand is count or convergence function.",
            "example": "(2∘×)⍣4 ⊢ 1 → 16\n(÷1∘+)⍣= 1 → golden ratio"
        }
    },
    "@": {
        "glyph": "@",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/at/",
        "monad": {
            "name": "At",
            "description": "Applies function or assigns values at specified positions.",
            "example": "(10×)@2 4 ⊢ 1 2 3 4 5 → 1 20 3 40 5\n0@(2∘|) ⍳6 → 0 2 0 4 0 6"
        }
    },
    "⌸": {
        "glyph": "⌸",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/key/",
        "monad": {
            "name": "Key",
            "description": "Groups by unique keys and applies function to each group.",
            "example": "{⍺ ⍵}⌸'mississippi' → unique chars with indices"
        }
    },
    "⌺": {
        "glyph": "⌺",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/stencil/",
        "monad": {
            "name": "Stencil",
            "description": "Applies function to overlapping neighborhoods (sliding windows).",
            "example": "{+/,⍵}⌺3 3 ⊢ 4 4⍴⍳16 → 3×3 moving sum"
        }
    },
    "⍠": {
        "glyph": "⍠",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/variant/",
        "monad": {
            "name": "Variant",
            "description": "Specifies options for function execution.",
            "example": "('a'⎕S'x')⍠'IC' 1 ⊢'AbAb' → case-insensitive"
        }
    },
    "⌶": {
        "glyph": "⌶",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/i-beam/",
        "monad": {
            "name": "I-Beam",
            "description": "Access to system functions. Left argument selects function.",
            "example": "819⌶'Hello' → 'HELLO' (uppercase)"
        }
    },
    "⍛": {
        "glyph": "⍛",
        "type": "operator",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-operators/behind/",
        "monad": {
            "name": "Behind",
            "description": "Reverse composition: applies left operand to left argument only.",
            "example": "2 -⍛÷ 8 → 2÷8 → 0.25"
        }
    },
    "⍎": {
        "glyph": "⍎",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/execute/",
        "monad": {
            "name": "Execute",
            "description": "Evaluates character vector as APL expression.",
            "example": "⍎'2+3' → 5"
        },
        "dyad": {
            "name": "Execute",
            "description": "Executes with namespace reference.",
            "example": "ns⍎'var' → evaluates in namespace ns"
        }
    },
    "⍕": {
        "glyph": "⍕",
        "type": "function",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/primitive-functions/format/",
        "monad": {
            "name": "Format",
            "description": "Converts array to character representation.",
            "example": "⍕123 → '123'\n⍕2 3⍴⍳6 → character matrix"
        },
        "dyad": {
            "name": "Format by Specification",
            "description": "Formats numbers according to specification (width, decimals).",
            "example": "8 2⍕3.14159 → '    3.14'"
        }
    },
    "⎕": {
        "glyph": "⎕",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/system-functions/evaluated-input-output/",
        "monad": {
            "name": "Quad (I/O)",
            "description": "Evaluated input/output. Also prefix for system functions and variables.",
            "example": "⎕←'Hello' → prints Hello\nx←⎕ → prompts for input"
        }
    },
    "⍞": {
        "glyph": "⍞",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/system-functions/character-input-output/",
        "monad": {
            "name": "Quote-Quad",
            "description": "Character input/output without formatting.",
            "example": "⍞←'Hello' → prints without newline\nx←⍞ → raw character input"
        }
    },
    "⍬": {
        "glyph": "⍬",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/other-syntax/zilde/",
        "monad": {
            "name": "Zilde",
            "description": "Empty numeric vector. Equivalent to ⍳0 or 0⍴0.",
            "example": "⍴⍬ → 0\n⍬≡⍳0 → 1"
        }
    },
    "∇": {
        "glyph": "∇",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#triangles",
        "monad": {
            "name": "Del",
            "description": "Function definition delimiter or self-reference in dfns.",
            "example": "∇r←foo x\n  r←x+1\n∇"
        }
    },
    "←": {
        "glyph": "←",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/other-syntax/assignment/",
        "monad": {
            "name": "Assignment",
            "description": "Assigns value to name. Also used in modified and indexed assignment.",
            "example": "x←5\nx+←1 → x becomes 6\nv[2]←10"
        }
    },
    "→": {
        "glyph": "→",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/other-syntax/branch/",
        "monad": {
            "name": "Branch / Abort",
            "description": "Branch to line number or label. Empty argument (→) aborts execution.",
            "example": "→0 → exit function\n→LOOP → branch to label"
        }
    },
    "⋄": {
        "glyph": "⋄",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#wedges",
        "monad": {
            "name": "Statement Separator",
            "description": "Separates multiple statements on one line.",
            "example": "x←1 ⋄ y←2 ⋄ x+y"
        }
    },
    "⍝": {
        "glyph": "⍝",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#circles",
        "monad": {
            "name": "Comment",
            "description": "Everything after ⍝ to end of line is a comment.",
            "example": "x←5 ⍝ assign 5 to x"
        }
    },
    "⍺": {
        "glyph": "⍺",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#letterforms",
        "monad": {
            "name": "Alpha (Left Argument)",
            "description": "Represents left argument in dfns and dops.",
            "example": "{⍺+⍵} → dyadic function"
        }
    },
    "⍵": {
        "glyph": "⍵",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#letterforms",
        "monad": {
            "name": "Omega (Right Argument)",
            "description": "Represents right argument in dfns and dops.",
            "example": "{⍵+1} → monadic function"
        }
    },
    "¯": {
        "glyph": "¯",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#lines-horizontal-%5F",
        "monad": {
            "name": "High Minus",
            "description": "Prefix for negative number literals. Not the same as - (negate).",
            "example": "¯5 → negative five\n¯3.14 → negative pi"
        }
    },
    "∆": {
        "glyph": "∆",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#triangles",
        "monad": {
            "name": "Delta",
            "description": "Valid character in names. Often used for variant or derivative functions.",
            "example": "VAR∆1 → valid name"
        }
    },
    "⍙": {
        "glyph": "⍙",
        "type": "syntax",
        "docUrl": "https://docs.dyalog.com/20.0/language-reference-guide/glyphs/#triangles",
        "monad": {
            "name": "Delta Underbar",
            "description": "Valid character in names.",
            "example": "VAR⍙1 → valid name"
        }
    }
};

/**
 * Get formatted hover content for a Dyalog APL glyph
 * 
 * @param {string} glyph - The primitive glyph
 * @returns {Object|null} Formatted hover content or null if not found
 */
export function getAplHoverContent(glyph) {
    const doc = aplGlyphDocs[glyph];
    if (!doc) return null;
    
    return {
        glyph: doc.glyph,
        type: doc.type,
        monad: doc.monad,
        dyad: doc.dyad,
        docUrl: doc.docUrl,
    };
}

export default aplGlyphDocs;
