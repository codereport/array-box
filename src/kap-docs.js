/**
 * Kap Primitive Documentation
 * 
 * Hand-crafted from official Kap reference documentation
 * Source: https://kapdemo.dhsdevelopments.com/reference.html
 * Created: 2026-01-28
 * 
 * LICENSE ATTRIBUTION:
 * The documentation content in this file is derived from the Kap project.
 * Copyright (c) DHS Developments
 * Repository: https://github.com/codereport/kap
 * See THIRD_PARTY_LICENSES.md for full license text.
 */

export const kapDocsMeta = {
    "language": "Kap",
    "source": "https://kapdemo.dhsdevelopments.com/reference.html",
    "createdAt": "2026-01-28",
    "version": "1.0.0"
};

/**
 * Kap primitive documentation for hover tooltips
 * 
 * Structure for each glyph:
 * - glyph: The primitive character
 * - type: 'function' | 'operator' | 'syntax'
 * - docUrl: Link to full documentation
 * - monad: { name, description, example }
 * - dyad: { name, description, example }
 */
export const kapGlyphDocs = {
    "+": {
        "glyph": "+",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#add_conjugate",
        "monad": {
            "name": "Conjugate",
            "description": "Complex conjugate operation. Reverses the sign of the imaginary part. For real numbers, returns the argument.",
            "example": "+2 ⇒ 2\n+1j2 ⇒ 1j¯2"
        },
        "dyad": {
            "name": "Add",
            "description": "Add A and B. If one argument is a character, the other must be a real number which is added to the Unicode value.",
            "example": "1+4 ⇒ 5\n@f + 1 ⇒ @g"
        }
    },
    "-": {
        "glyph": "-",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#subtract_negate",
        "monad": {
            "name": "Negate",
            "description": "Negate the argument.",
            "example": "-2 ⇒ ¯2\n-(¯2) ⇒ 2"
        },
        "dyad": {
            "name": "Subtract",
            "description": "Subtract B from A. Subtracting a character from another returns the codepoint difference.",
            "example": "8-1 ⇒ 7\n@a - @\\0 ⇒ 97"
        }
    },
    "×": {
        "glyph": "×",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#multiply_angle",
        "monad": {
            "name": "Angle (Signum)",
            "description": "For real values, return 1, 0, or -1 if argument is positive, zero, or negative. For complex arguments, return a value with magnitude 1 having the same angle.",
            "example": "×2 ⇒ 1\n×¯4 ⇒ ¯1"
        },
        "dyad": {
            "name": "Multiply",
            "description": "Multiply A with B.",
            "example": "2×3 ⇒ 6"
        }
    },
    "÷": {
        "glyph": "÷",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#divide_reciprocal",
        "monad": {
            "name": "Reciprocal",
            "description": "Return the reciprocal of the argument (1÷A).",
            "example": "÷5 ⇒ 0.2"
        },
        "dyad": {
            "name": "Divide",
            "description": "Divide A by B.",
            "example": "5÷4 ⇒ 1.25"
        }
    },
    "|": {
        "glyph": "|",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#mod_magnitude",
        "monad": {
            "name": "Magnitude",
            "description": "Returns the magnitude of the argument. For real numbers, the absolute value. For complex numbers, the length of the vector from origin.",
            "example": "|3 ⇒ 3\n|¯4 ⇒ 4"
        },
        "dyad": {
            "name": "Modulo",
            "description": "Returns B mod A. Note: argument order is reversed compared to most languages.",
            "example": "2|5 ⇒ 1"
        }
    },
    "⋆": {
        "glyph": "⋆",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#power",
        "monad": {
            "name": "Exponential",
            "description": "Return e to the power of the argument.",
            "example": "⋆1 ⇒ 2.718..."
        },
        "dyad": {
            "name": "Power",
            "description": "Return A to the power of B.",
            "example": "2⋆3 ⇒ 8"
        }
    },
    "⍟": {
        "glyph": "⍟",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#log",
        "monad": {
            "name": "Natural Logarithm",
            "description": "Return log(A).",
            "example": "⍟10 ⇒ 2.302..."
        },
        "dyad": {
            "name": "Logarithm",
            "description": "Return the base A logarithm of B.",
            "example": "10⍟100 ⇒ 2"
        }
    },
    "√": {
        "glyph": "√",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#square_root",
        "monad": {
            "name": "Square Root",
            "description": "Computes the square root of the argument.",
            "example": "√9 ⇒ 3"
        },
        "dyad": {
            "name": "Root",
            "description": "Computes the A root of B.",
            "example": "3√8 ⇒ 2"
        }
    },
    "⌊": {
        "glyph": "⌊",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#min_floor",
        "monad": {
            "name": "Floor",
            "description": "Returns the largest integer which is less than or equal to the argument.",
            "example": "⌊3.7 ⇒ 3"
        },
        "dyad": {
            "name": "Minimum",
            "description": "Returns the smallest of A and B.",
            "example": "3⌊5 ⇒ 3"
        }
    },
    "⌈": {
        "glyph": "⌈",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#max_ceiling",
        "monad": {
            "name": "Ceiling",
            "description": "Returns the smallest integer which is greater than or equal to the argument.",
            "example": "⌈3.2 ⇒ 4"
        },
        "dyad": {
            "name": "Maximum",
            "description": "Returns the largest of A and B.",
            "example": "3⌈5 ⇒ 5"
        }
    },
    "!": {
        "glyph": "!",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#binomial_gamma",
        "monad": {
            "name": "Gamma",
            "description": "Computes the result of the gamma function on A.",
            "example": "!5 ⇒ 24"
        },
        "dyad": {
            "name": "Binomial",
            "description": "Computes the result of the binomial function on A and B.",
            "example": "2!5 ⇒ 10"
        }
    },
    "=": {
        "glyph": "=",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#equals",
        "monad": {
            "name": "Classify",
            "description": "Return a 1-dimensional array where elements with the same value are mapped to the same number.",
            "example": "= \"banana\" ⇒ 0 1 2 1 2 1"
        },
        "dyad": {
            "name": "Equals",
            "description": "Return 1 if A and B are equal, otherwise return 0. Scalar function, arrays are compared element-wise.",
            "example": "10=10 ⇒ 1\n1 2 3 = 1 3 4 ⇒ 1 0 0"
        }
    },
    "≠": {
        "glyph": "≠",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#not_equals",
        "monad": {
            "name": "Unique Mask",
            "description": "Returns a boolean array where 1 indicates the first occurrence of each unique element.",
            "example": "≠ 1 2 1 1 4 5 ⇒ 1 1 0 0 1 1"
        },
        "dyad": {
            "name": "Not Equals",
            "description": "Return 1 if A and B are not equal, otherwise return 0.",
            "example": "10≠11 ⇒ 1"
        }
    },
    "<": {
        "glyph": "<",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#less_than",
        "monad": {
            "name": "Increase Rank",
            "description": "Resizes the argument to add a new dimension of size 1 as an initial dimension.",
            "example": "< 1 2 3  ⍝ shape becomes 1 3"
        },
        "dyad": {
            "name": "Less Than",
            "description": "Return 1 if A is less than B.",
            "example": "3<5 ⇒ 1"
        }
    },
    ">": {
        "glyph": ">",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#greater_than",
        "monad": {
            "name": "Decrease Rank",
            "description": "Removes the major axis from the argument, reshaping to multiply first two axes together.",
            "example": "> 2 3 ⍴ ⍳6  ⍝ shape becomes 6"
        },
        "dyad": {
            "name": "Greater Than",
            "description": "Return 1 if A is greater than B.",
            "example": "5>3 ⇒ 1"
        }
    },
    "≤": {
        "glyph": "≤",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#less_than_or_equal",
        "dyad": {
            "name": "Less Than or Equal",
            "description": "Return 1 if A is less than or equal to B.",
            "example": "3≤3 ⇒ 1"
        }
    },
    "≥": {
        "glyph": "≥",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#greater_than_or_equal",
        "dyad": {
            "name": "Greater Than or Equal",
            "description": "Return 1 if A is greater than or equal to B.",
            "example": "3≥3 ⇒ 1"
        }
    },
    "∧": {
        "glyph": "∧",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#logical_and",
        "monad": {
            "name": "Sort Up",
            "description": "Sort the array in ascending order.",
            "example": "∧ 3 1 4 1 5 ⇒ 1 1 3 4 5"
        },
        "dyad": {
            "name": "Logical And",
            "description": "Returns 1 if A and B are both 1. Arguments must be 0 or 1.",
            "example": "1∧1 ⇒ 1\n1∧0 ⇒ 0"
        }
    },
    "∨": {
        "glyph": "∨",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#logical_or",
        "monad": {
            "name": "Sort Down",
            "description": "Sort the array in descending order.",
            "example": "∨ 3 1 4 1 5 ⇒ 5 4 3 1 1"
        },
        "dyad": {
            "name": "Logical Or",
            "description": "Returns 1 if either A or B is 1. Arguments must be 0 or 1.",
            "example": "0∨0 ⇒ 0\n1∨0 ⇒ 1"
        }
    },
    "⍲": {
        "glyph": "⍲",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#logical_nand",
        "dyad": {
            "name": "Logical Nand",
            "description": "Returns 0 if A and B are both 1, otherwise return 1. Equivalent to ~A∧B.",
            "example": "1⍲1 ⇒ 0\n1⍲0 ⇒ 1"
        }
    },
    "⍱": {
        "glyph": "⍱",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#logical_nor",
        "dyad": {
            "name": "Logical Nor",
            "description": "Returns 0 if either A or B is 1, otherwise return 1. Equivalent to ~A∨B.",
            "example": "0⍱0 ⇒ 1\n0⍱1 ⇒ 0"
        }
    },
    "~": {
        "glyph": "~",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#logical_not_without",
        "monad": {
            "name": "Logical Not",
            "description": "Returns 1 if the argument is 0, and vice versa. Argument must be 0 or 1.",
            "example": "~0 ⇒ 1\n~1 ⇒ 0"
        },
        "dyad": {
            "name": "Without",
            "description": "Returns A with all instances in B removed.",
            "example": "1 2 3 4 5 6 ~ 3 6 ⇒ 1 2 4 5"
        }
    },
    "≡": {
        "glyph": "≡",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#compare_equal_depth",
        "monad": {
            "name": "Depth",
            "description": "Returns the depth of the argument. The depth is the largest number of recursively nested arrays.",
            "example": "≡(1 2 3) (4 5 6) (7 8 (9 10)) ⇒ 3\n≡2 ⇒ 0"
        },
        "dyad": {
            "name": "Compare Equal",
            "description": "Returns 1 if A and B are equal, including arrays with same shape and all elements equal.",
            "example": "(1 2 3)≡(1 2 3) ⇒ 1"
        }
    },
    "≢": {
        "glyph": "≢",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#compare_not_equals_tally",
        "monad": {
            "name": "Tally (Major Axis Size)",
            "description": "Return the size of the first dimension. Equivalent to ↑⍴A.",
            "example": "≢ 3 ⇒ 0\n≢ 1 2 3 ⇒ 3\n≢ 3 5 ⍴ ⍳15 ⇒ 3"
        },
        "dyad": {
            "name": "Compare Not Equal",
            "description": "Returns 1 if A and B are not equal.",
            "example": "(1 2)≢(1 3) ⇒ 1"
        }
    },
    "⍴": {
        "glyph": "⍴",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#shape_reshape",
        "monad": {
            "name": "Shape",
            "description": "Return the shape of the argument as an array containing the size of each dimension.",
            "example": "⍴ 3 4 5 ⍴ ⍳60 ⇒ 3 4 5"
        },
        "dyad": {
            "name": "Reshape",
            "description": "Reshape B into the dimensions specified by A. Values wrap around if needed.",
            "example": "3 3 ⍴ 1 2 ⇒ 1 2 1 / 2 1 2 / 1 2 1"
        }
    },
    "⍳": {
        "glyph": "⍳",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#index_generator_index_of",
        "monad": {
            "name": "Index Generator",
            "description": "If scalar, generate 1-dimensional array of A numbers from 0 to A-1. If array, generate array with coordinates.",
            "example": "⍳3 ⇒ 0 1 2\n⍳2 2 ⇒ ((0 0)(0 1))((1 0)(1 1))"
        },
        "dyad": {
            "name": "Index Of",
            "description": "For each value in B, return its index in A. If not found, returns ≢A.",
            "example": "\"abcd\" ⍳ \"cb\" ⇒ 2 1"
        }
    },
    "⍸": {
        "glyph": "⍸",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#where_interval_index",
        "monad": {
            "name": "Where",
            "description": "Given an array of positive integers, return indexes where nonzero elements exist. Values repeated per integer value.",
            "example": "⍸ 0 1 0 0 0 1 1 0 0 ⇒ 1 5 6"
        },
        "dyad": {
            "name": "Interval Index",
            "description": "A is a sorted array defining intervals. Returns which interval each element of B belongs to.",
            "example": "4 8 ⍸ 0 3 4 5 10 11 ⇒ 0 0 1 1 2 2"
        }
    },
    "⊢": {
        "glyph": "⊢",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#identity_right",
        "monad": {
            "name": "Identity",
            "description": "Returns the argument itself.",
            "example": "⊢123 ⇒ 123"
        },
        "dyad": {
            "name": "Right",
            "description": "Returns the right argument.",
            "example": "1⊢2 ⇒ 2"
        }
    },
    "⊣": {
        "glyph": "⊣",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#hide_left",
        "monad": {
            "name": "Hide",
            "description": "Forces evaluation of argument ensuring side effects are called. Returns an empty array that won't be printed in REPL.",
            "example": "⊣ io:println \"test\"  ⍝ prints, returns nothing visible"
        },
        "dyad": {
            "name": "Left",
            "description": "Returns the left argument.",
            "example": "1⊣2 ⇒ 1"
        }
    },
    "⌷": {
        "glyph": "⌷",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#list_to_array_index",
        "monad": {
            "name": "List to Array",
            "description": "Given an N-tuple, return a 1-dimensional array with its content.",
            "example": "⌷ 1;2;3 ⇒ 1 2 3"
        },
        "dyad": {
            "name": "Index Lookup",
            "description": "Extract items from B by index specification A. A⌷B is equivalent to B[X1;X2;...;Xn].",
            "example": "(0 1) 1 ⌷ 3 3 ⍴ ⍳9 ⇒ 1"
        }
    },
    "⊂": {
        "glyph": "⊂",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#enclose_partition",
        "monad": {
            "name": "Enclose",
            "description": "For non-primitive values, return a 0-dimensional array containing the argument. For primitives, returns the value itself.",
            "example": "⊂ 1 2 3 ⇒ ⊂1 2 3"
        },
        "dyad": {
            "name": "Partition",
            "description": "A is integers. Split B where corresponding A is greater than previous value. 0 in A drops that element.",
            "example": "1 2 2 0 1 1 ⊂ \"abcdef\" ⇒ \"a\" \"bc\" \"ef\""
        }
    },
    "⊃": {
        "glyph": "⊃",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#disclose_pick",
        "monad": {
            "name": "Disclose (Mix)",
            "description": "If enclosed (rank 0), returns the array element. For rank 1+, performs mix operation aligning subarrays.",
            "example": "⊃ ⊂\"abc\" ⇒ \"abc\"\n⊃ (1 2 3) (6 7 8 9 10) ⇒ 1 2 3 0 0 / 6 7 8 9 10"
        },
        "dyad": {
            "name": "Pick",
            "description": "Pick an element from B based on specification in A. A is a chain of coordinates for nested arrays.",
            "example": "2 ⊃ 10 11 12 ⇒ 12\n1 2 ⊃ (1 2 3) (4 5 6) ⇒ 6"
        }
    },
    ",": {
        "glyph": ",",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#concatenate_ravel",
        "monad": {
            "name": "Ravel",
            "description": "Return a new array containing the same values reshaped to a single dimension.",
            "example": ", 2 3 ⍴ ⍳6 ⇒ 0 1 2 3 4 5"
        },
        "dyad": {
            "name": "Concatenate",
            "description": "Concatenate A with B along the last axis.",
            "example": "1 2 3 , 4 5 6 ⇒ 1 2 3 4 5 6"
        }
    },
    "⍪": {
        "glyph": "⍪",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#concatenate_first_table",
        "monad": {
            "name": "Table",
            "description": "Reshape the argument into a 2-dimensional array. For 1D, shape becomes (≢A) 1.",
            "example": "⍪ 1 2 3 ⇒ shape 3 1"
        },
        "dyad": {
            "name": "Concatenate First",
            "description": "Same as , but operates along axis 0.",
            "example": "(2 3⍴⍳6) ⍪ (2 3⍴10+⍳6)"
        }
    },
    "⍮": {
        "glyph": "⍮",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#singleton_pair",
        "monad": {
            "name": "Singleton",
            "description": "Creates a 1-dimensional array of size 1 containing the argument. Same as ,⊂.",
            "example": "⍮ 5 ⇒ ,⊂5"
        },
        "dyad": {
            "name": "Pair",
            "description": "Creates a 1-dimensional array of size 2 with A and B. Same as ,⍥⊂.",
            "example": "1 ⍮ 2 ⇒ (⊂1)(⊂2)"
        }
    },
    "↑": {
        "glyph": "↑",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#take",
        "monad": {
            "name": "Take First",
            "description": "Returns the first element in the argument. If scalar, returns the argument itself.",
            "example": "↑ 10 11 12 ⇒ 10"
        },
        "dyad": {
            "name": "Take",
            "description": "Take values from each axis. Positive takes from start, negative from end. Can use null to keep full axis.",
            "example": "2 3 4 ↑ 5 5 5 ⍴ ⍳125\n2 null ↑ 3 4 ⍴ ⍳12"
        }
    },
    "↓": {
        "glyph": "↓",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#drop",
        "monad": {
            "name": "Drop First",
            "description": "Removes one row from the major axis. Equivalent to 1↓A.",
            "example": "↓ 1 2 3 ⇒ 2 3"
        },
        "dyad": {
            "name": "Drop",
            "description": "Drop values from each axis. Positive drops from start, negative from end.",
            "example": "2 ↓ 1 2 3 4 5 ⇒ 3 4 5\n¯2 ↓ 1 2 3 4 5 ⇒ 1 2 3"
        }
    },
    "?": {
        "glyph": "?",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#roll_deal",
        "monad": {
            "name": "Roll",
            "description": "For integer > 0, random integer from 0 to value-1. For 0, random float from 0 to 1.",
            "example": "? 6 ⇒ random 0-5\n? 0 ⇒ random 0.0-1.0"
        },
        "dyad": {
            "name": "Deal",
            "description": "Return A random numbers below B without duplicates. If A=B, returns random permutation.",
            "example": "5 ? 10 ⇒ 5 unique random from 0-9"
        }
    },
    "⌽": {
        "glyph": "⌽",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#rotate_reverse",
        "monad": {
            "name": "Reverse",
            "description": "Reverse the order of elements along the last axis.",
            "example": "⌽ ⍳20 ⇒ 19 18 17 ... 0"
        },
        "dyad": {
            "name": "Rotate",
            "description": "Rotate values in the array A steps to the left. Negative rotates right. A can be array for per-row rotation.",
            "example": "2 ⌽ 1 2 3 4 5 ⇒ 3 4 5 1 2\n¯1 ⌽ 1 2 3 4 5 ⇒ 5 1 2 3 4"
        }
    },
    "⊖": {
        "glyph": "⊖",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#rotate_reverse_vertically",
        "monad": {
            "name": "Reverse First",
            "description": "Same as ⌽ but operates along axis 0.",
            "example": "⊖ 3 3 ⍴ ⍳9"
        },
        "dyad": {
            "name": "Rotate First",
            "description": "Same as ⌽ but operates along axis 0.",
            "example": "1 ⊖ 3 3 ⍴ ⍳9"
        }
    },
    "⍉": {
        "glyph": "⍉",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#transpose",
        "monad": {
            "name": "Transpose",
            "description": "Reverses the axes of the right argument. For 2D array, this is matrix transpose.",
            "example": "⍉ 3 4 ⍴ ⍳12  ⍝ becomes 4 3 shape"
        },
        "dyad": {
            "name": "Transpose by Axis",
            "description": "Reorder axes according to A.",
            "example": "1 0 ⍉ 3 4 ⍴ ⍳12"
        }
    },
    "∊": {
        "glyph": "∊",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#member",
        "monad": {
            "name": "Enlist",
            "description": "Recursively find all atomic values and return them as a single-dimensional array.",
            "example": "∊ (1 2) (3 4) (5 6 7 (8 9)) ⇒ 1 2 3 4 5 6 7 8 9"
        },
        "dyad": {
            "name": "Member",
            "description": "Returns array same shape as A. 1 if value found in B, otherwise 0.",
            "example": "1 2 3 ∊ 2 4 6 ⇒ 0 1 0"
        }
    },
    "⍷": {
        "glyph": "⍷",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#find",
        "dyad": {
            "name": "Find",
            "description": "Test entire A against each position in B. Returns boolean array same shape as B with 1 at match start positions.",
            "example": "\"bc\" ⍷ \"abcdef\" ⇒ 0 1 0 0 0 0"
        }
    },
    "⍋": {
        "glyph": "⍋",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#grade_up",
        "monad": {
            "name": "Grade Up",
            "description": "Returns a permutation vector. Indexing into argument with result gives sorted array (ascending).",
            "example": "⍋ 3 1 4 1 5 ⇒ 1 3 0 2 4"
        }
    },
    "⍒": {
        "glyph": "⍒",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#grade_down",
        "monad": {
            "name": "Grade Down",
            "description": "Same as ⍋ but for descending order.",
            "example": "⍒ 3 1 4 1 5 ⇒ 4 2 0 1 3"
        }
    },
    "/": {
        "glyph": "/",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#replicate_reduce",
        "monad": {
            "name": "Reduce",
            "description": "Apply function between elements. Lazy evaluation.",
            "example": "+/ 1 2 3 4 ⇒ 10"
        },
        "dyad": {
            "name": "Replicate",
            "description": "Copy each element of B the number of times specified in A. Boolean A is Compress.",
            "example": "1 0 1 / \"abc\" ⇒ \"ac\"\n2 3 1 / 1 2 3 ⇒ 1 1 2 2 2 3"
        }
    },
    "⌿": {
        "glyph": "⌿",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#replicate_reduce_first",
        "monad": {
            "name": "Reduce First",
            "description": "Same as / but axis defaults to 0. Result is enclosed for rank-1 input (APL-compatible).",
            "example": "+⌿ 3 3 ⍴ ⍳9"
        },
        "dyad": {
            "name": "Replicate First",
            "description": "Same as / but operates along axis 0.",
            "example": "1 0 1 ⌿ 3 3 ⍴ ⍳9"
        }
    },
    "\\": {
        "glyph": "\\",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#scan",
        "monad": {
            "name": "Scan",
            "description": "Like reduce but preserves intermediary results. Computed left-to-right (like BQN/J, unlike APL).",
            "example": "+\\ 1 2 3 4 ⇒ 1 3 6 10"
        }
    },
    "⍀": {
        "glyph": "⍀",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#scan_first",
        "monad": {
            "name": "Scan First",
            "description": "Same as \\ but scans along axis 0.",
            "example": "+⍀ 3 3 ⍴ ⍳9"
        }
    },
    "¨": {
        "glyph": "¨",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#each",
        "monad": {
            "name": "Each",
            "description": "Apply function to each element. Result is lazy - function called when value retrieved.",
            "example": "⍴¨ (1 2 3) (4 5) ⇒ (,3) (,2)"
        }
    },
    "⌻": {
        "glyph": "⌻",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#outer_product",
        "dyad": {
            "name": "Outer Product",
            "description": "Returns array of all combinations of elements from last axis of A with leading axis of B.",
            "example": "1 2 3 ,⌻ 1000 2000 3000"
        }
    },
    "∙": {
        "glyph": "∙",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#inner_product",
        "dyad": {
            "name": "Inner Product",
            "description": "APL-compatible inner product. Uses middle dot instead of period.",
            "example": "A +∙× B  ⍝ matrix multiplication"
        }
    },
    "⍨": {
        "glyph": "⍨",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#commute_duplicate",
        "monad": {
            "name": "Duplicate",
            "description": "Derives monadic function that calls F dyadically with same argument on both sides.",
            "example": "+⍨ 10 ⇒ 20"
        },
        "dyad": {
            "name": "Commute",
            "description": "Derives function that calls underlying function with arguments reversed.",
            "example": "10-⍨1 ⇒ ¯9"
        }
    },
    "⍣": {
        "glyph": "⍣",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#power_operator",
        "monad": {
            "name": "Power Operator",
            "description": "Repeatedly apply f. If g is integer, apply f that many times. If g is function, apply until g returns 1.",
            "example": "(2×)⍣5 ⊢ 1 ⇒ 32"
        }
    },
    "⍤": {
        "glyph": "⍤",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#rank",
        "monad": {
            "name": "Rank",
            "description": "Apply function to cells of specified rank. Negative rank is complementary (excludes leading axes).",
            "example": "⊂⍤1 ⊢ 3 4 ⍴ ⍳12  ⍝ enclose each row"
        }
    },
    "∘": {
        "glyph": "∘",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#compose",
        "monad": {
            "name": "Compose",
            "description": "x A∘B y evaluates as x A (B y). A∘B y evaluates as y A (B y).",
            "example": "+∘÷ 4 ⇒ 4.25"
        }
    },
    "⍛": {
        "glyph": "⍛",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#inverse_compose",
        "monad": {
            "name": "Inverse Compose",
            "description": "x A⍛B y evaluates as (A x) B y. A⍛B y evaluates as (A y) B y.",
            "example": "2 ⊢⍛+ 3 ⇒ 5"
        }
    },
    "⍥": {
        "glyph": "⍥",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#over",
        "monad": {
            "name": "Over",
            "description": "x A⍥B y evaluates as (B x) A (B y). Processes arguments with B before acting with A.",
            "example": "+⍥⊢ 1 2 3 ⇒ 1 2 3"
        }
    },
    "⍢": {
        "glyph": "⍢",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#structural_under",
        "monad": {
            "name": "Structural Under",
            "description": "Call B, apply A to result, then reverse effect of B. Works with non-invertible structural functions.",
            "example": "(10+)⍢(2↑) 3 3 ⍴ ⍳4"
        }
    },
    "∵": {
        "glyph": "∵",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#derive_bitwise",
        "monad": {
            "name": "Derive Bitwise",
            "description": "Derives function performing operation on individual bits. +∵ is xor, ×∵ is and, ∨∵ is or, etc.",
            "example": "5 +∵ 3 ⇒ 6"
        }
    },
    "∥": {
        "glyph": "∥",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#parallel",
        "monad": {
            "name": "Parallel",
            "description": "Derives parallel version of function. Currently only works with ¨ (each). Function must be pure.",
            "example": "foo¨∥ 1 2 3  ⍝ parallel each"
        }
    },
    "˝": {
        "glyph": "˝",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#inverse",
        "monad": {
            "name": "Inverse",
            "description": "Derives functional inverse. F F˝ x = x. For dyadic: x F x F˝ y = y.",
            "example": "10×˝2.0 ⇒ 0.2"
        }
    },
    "⍰": {
        "glyph": "⍰",
        "type": "operator",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#conditional_null",
        "monad": {
            "name": "Conditional Null",
            "description": "If right argument is null, returns null. Otherwise calls original function. Useful for hashmap lookups.",
            "example": "1 2 +⍰ 100 200 ⇒ 101 202\n1 2 +⍰ null ⇒ null"
        }
    },
    "«": {
        "glyph": "«",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#fork",
        "monad": {
            "name": "Fork (Left)",
            "description": "Part of fork syntax A«B»C. x A«B»C y evaluates as (x A y) B (x C y).",
            "example": "+«×»- ⍝ sum times difference"
        }
    },
    "»": {
        "glyph": "»",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#fork",
        "monad": {
            "name": "Fork (Right)",
            "description": "Part of fork syntax A«B»C. x A«B»C y evaluates as (x A y) B (x C y).",
            "example": "+«×»- ⍝ sum times difference"
        }
    },
    "⊆": {
        "glyph": "⊆",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#nest_partitioned_enclose",
        "monad": {
            "name": "Nest",
            "description": "APL-compatible nest function.",
            "example": "⊆ 1 2 3"
        },
        "dyad": {
            "name": "Partitioned Enclose",
            "description": "A is booleans. Split B where A is 1.",
            "example": "1 0 0 0 1 1 ⊆ \"abcdef\" ⇒ \"abcd\" \"e\" \"f\""
        }
    },
    "⊇": {
        "glyph": "⊇",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#select",
        "dyad": {
            "name": "Select",
            "description": "A is array of coordinates. Return values from B at those coordinates.",
            "example": "2 2 5 2 ⊇ \"abcdef\" ⇒ \"ccfc\""
        }
    },
    "⫇": {
        "glyph": "⫇",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#group",
        "dyad": {
            "name": "Group",
            "description": "A is integers. Group major cells of B by A values. Negative A values drop those cells.",
            "example": "0 1 0 1 2 ⫇ \"abcde\" ⇒ \"ac\" \"bd\" \"e\""
        }
    },
    "∪": {
        "glyph": "∪",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#unique_union",
        "monad": {
            "name": "Unique",
            "description": "Return an array of all unique elements in the argument.",
            "example": "∪ 1 2 2 3 1 ⇒ 1 2 3"
        },
        "dyad": {
            "name": "Union",
            "description": "Return the union of elements. Values present in both are included once.",
            "example": "1 2 3 ∪ 3 4 5 ⇒ 1 2 3 4 5"
        }
    },
    "∩": {
        "glyph": "∩",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#intersection",
        "dyad": {
            "name": "Intersection",
            "description": "Returns elements present in both A and B.",
            "example": "1 2 3 ∩ 2 3 4 ⇒ 2 3"
        }
    },
    "⊤": {
        "glyph": "⊤",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#encode",
        "dyad": {
            "name": "Encode",
            "description": "Compute representation of B in radix system defined by A. Inverse of Decode.",
            "example": "2 2 2 2 ⊤ 12 ⇒ 1 1 0 0"
        }
    },
    "⊥": {
        "glyph": "⊥",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#decode",
        "dyad": {
            "name": "Decode",
            "description": "Evaluate B in radix system defined by A. Inverse of Encode.",
            "example": "2 ⊥ 1 1 0 0 ⇒ 12"
        }
    },
    "⌸": {
        "glyph": "⌸",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#key",
        "dyad": {
            "name": "Key",
            "description": "Group values B by keys A. Returns n-by-2 array with unique keys and their grouped values.",
            "example": "2 1 3 2 2 1 1 ⌸ \"foo\" \"bar\" \"xyz\" \"abc\" \"xz\" \"ab\" \"ac\""
        }
    },
    "⌹": {
        "glyph": "⌹",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#matrix_division",
        "monad": {
            "name": "Matrix Inverse",
            "description": "Return the inverse of a matrix.",
            "example": "⌹ 2 2 ⍴ 1 2 3 4"
        },
        "dyad": {
            "name": "Matrix Division",
            "description": "Divide matrix A by B.",
            "example": "A ⌹ B"
        }
    },
    "…": {
        "glyph": "…",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#range",
        "dyad": {
            "name": "Range",
            "description": "Generate sequence from A to B. If arrays, use last of A and first of B as range endpoints.",
            "example": "20 … 23 ⇒ 20 21 22 23\n@a … @z ⇒ \"abc...xyz\""
        }
    },
    "≬": {
        "glyph": "≬",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#create_list",
        "monad": {
            "name": "Create List",
            "description": "Create an N-tuple containing the elements of the input array.",
            "example": "≬ 1 2 3  ⍝ creates tuple"
        }
    },
    "%": {
        "glyph": "%",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#case",
        "dyad": {
            "name": "Case",
            "description": "A is indices, B is list of arrays same shape as A. Pick value from corresponding subarray for each cell.",
            "example": "0 1 1 2 % \"abcd\" \"1234\" \"defg\" ⇒ \"a23g\""
        }
    },
    "⍎": {
        "glyph": "⍎",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#parse_number",
        "monad": {
            "name": "Parse Number",
            "description": "Given a string, attempt to parse it as a number. Raises error if parsing fails.",
            "example": "⍎ \"123\" ⇒ 123"
        }
    },
    "⍕": {
        "glyph": "⍕",
        "type": "function",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#format",
        "monad": {
            "name": "Format",
            "description": "Returns a string representation of the argument.",
            "example": "⍕ 123 ⇒ \"123\""
        },
        "dyad": {
            "name": "Format with Pattern",
            "description": "Format B according to pattern string A. Use $ for control codes, $s for string, etc.",
            "example": "\"ab$5sx\" ⍕ 12 ⇒ \"ab   12x\""
        }
    },
    "⍝": {
        "glyph": "⍝",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#comments",
        "monad": {
            "name": "Comment",
            "description": "Everything from ⍝ to end of line is a comment.",
            "example": "1 + 2 ⍝ this is a comment"
        }
    },
    "∇": {
        "glyph": "∇",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#function_definition",
        "monad": {
            "name": "Function Definition",
            "description": "Define global functions. ∇ header { body }. Header forms: name, name x, x name y, operators.",
            "example": "∇ foo x { x+1 }"
        }
    },
    "⇐": {
        "glyph": "⇐",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#local_function",
        "monad": {
            "name": "Local Function Declaration",
            "description": "Declare lexically scoped local functions. Has access to variables in its scope.",
            "example": "foo ⇐ { ⍵+1 }"
        }
    },
    "λ": {
        "glyph": "λ",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#lambda",
        "monad": {
            "name": "Create Function Reference",
            "description": "Create a function reference from a function. Captures lexical bindings.",
            "example": "λ+ ⍝ reference to add function"
        }
    },
    "⍞": {
        "glyph": "⍞",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#apply",
        "monad": {
            "name": "Apply Function Reference",
            "description": "Call a function given its function reference stored in a variable.",
            "example": "f ← λ+\n⍞f 1 2  ⍝ calls +"
        }
    },
    "←": {
        "glyph": "←",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#assignment",
        "monad": {
            "name": "Assignment",
            "description": "Assign value to variable. Also supports modified assignment: x F← value becomes x ← x F value.",
            "example": "x ← 5\nx +← 1  ⍝ x becomes 6"
        }
    },
    "→": {
        "glyph": "→",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#return",
        "monad": {
            "name": "Return",
            "description": "Return value from innermost function.",
            "example": "→ 10  ⍝ return 10"
        },
        "dyad": {
            "name": "Conditional Return",
            "description": "If left argument is true, return right argument.",
            "example": "(x>5) → \"big\"  ⍝ return if x>5"
        }
    },
    "⋄": {
        "glyph": "⋄",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#statement_separator",
        "monad": {
            "name": "Statement Separator",
            "description": "Separate statements. Equivalent to newline.",
            "example": "x←1 ⋄ y←2 ⋄ x+y"
        }
    },
    "⍬": {
        "glyph": "⍬",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#zilde",
        "monad": {
            "name": "Zilde (Empty Numeric Vector)",
            "description": "The empty numeric vector.",
            "example": "⍴ ⍬ ⇒ ,0"
        }
    },
    "⍺": {
        "glyph": "⍺",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#left_argument",
        "monad": {
            "name": "Left Argument",
            "description": "In a dfn/dop, represents the left argument.",
            "example": "{ ⍺ + ⍵ }"
        }
    },
    "⍵": {
        "glyph": "⍵",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#right_argument",
        "monad": {
            "name": "Right Argument",
            "description": "In a dfn/dop, represents the right argument.",
            "example": "{ ⍵ + 1 }"
        }
    },
    "¯": {
        "glyph": "¯",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#negative",
        "monad": {
            "name": "Negative (High Minus)",
            "description": "Prefix for negative number literals. Not the same as - (negate function).",
            "example": "¯5  ⍝ negative five"
        }
    },
    "@": {
        "glyph": "@",
        "type": "syntax",
        "docUrl": "https://kapdemo.dhsdevelopments.com/reference.html#character",
        "monad": {
            "name": "Character Literal",
            "description": "Character literal prefix. @a for 'a', @\\n for newline, @\\u0041 for hex codepoint.",
            "example": "@a ⇒ 'a'\n@\\n ⇒ newline"
        }
    }
};

/**
 * Get formatted hover content for a Kap glyph
 * 
 * @param {string} glyph - The primitive glyph
 * @returns {Object|null} Formatted hover content or null if not found
 */
export function getKapHoverContent(glyph) {
    const doc = kapGlyphDocs[glyph];
    if (!doc) return null;
    
    return {
        glyph: doc.glyph,
        type: doc.type,
        monad: doc.monad,
        dyad: doc.dyad,
        docUrl: doc.docUrl,
    };
}

export default kapGlyphDocs;
