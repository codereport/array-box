#!/usr/bin/env python3
"""
Cross-reference checker for array language primitive definitions.

Compares four data sources per language:
  1. GlyphNames  (keyboard search labels)  - src/keyboard.js
  2. Categories   (keyboard/syntax groups)  - src/keymap.js or src/syntax.js
  3. Keyboard     (prefix-key input glyphs) - src/keymap.js
  4. Docs         (hover documentation)     - src/*-docs.js

Reports glyphs that appear in one source but are missing from another,
which causes bugs like primitives not showing up in keyboard search.

Usage:
  python3 scripts/check-missing-primitives.py [--verbose]

Exit code 0 = no errors, 1 = missing primitives found.
"""

import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
SRC = ROOT / "src"

# Categories to skip in the "missing from glyphNames" check —
# these contain syntax keywords / comment markers, not searchable primitives.
SKIP_CATEGORIES = {"syntax", "comments", "control", "constants"}

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------

USE_COLOR = sys.stdout.isatty()

def _c(code, text):
    return f"\033[{code}m{text}\033[0m" if USE_COLOR else text

def red(t):    return _c("31", t)
def green(t):  return _c("32", t)
def yellow(t): return _c("33", t)
def bold(t):   return _c("1", t)
def dim(t):    return _c("2", t)

# ---------------------------------------------------------------------------
# JS-aware text scanning
# ---------------------------------------------------------------------------

def _find_matching_close(source, open_pos):
    """Find the closing brace/bracket matching the one at open_pos,
    skipping strings and comments correctly."""
    opener = source[open_pos]
    closer = '}' if opener == '{' else ']'
    depth = 0
    i = open_pos
    n = len(source)
    while i < n:
        ch = source[i]
        if ch == '/' and i + 1 < n and source[i + 1] == '/':
            nl = source.find('\n', i)
            i = nl + 1 if nl != -1 else n
            continue
        if ch == '/' and i + 1 < n and source[i + 1] == '*':
            end = source.find('*/', i + 2)
            i = end + 2 if end != -1 else n
            continue
        if ch in ("'", '"', '`'):
            quote = ch
            i += 1
            while i < n:
                if source[i] == '\\':
                    i += 2
                    continue
                if source[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return None


def _strip_js_comments(text):
    """Remove // and /* */ comments from JS source text,
    preserving string literals."""
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == '/' and i + 1 < n and text[i + 1] == '/':
            nl = text.find('\n', i)
            i = nl if nl != -1 else n
            continue
        if ch == '/' and i + 1 < n and text[i + 1] == '*':
            end = text.find('*/', i + 2)
            i = end + 2 if end != -1 else n
            continue
        if ch in ("'", '"', '`'):
            quote = ch
            start = i
            i += 1
            while i < n:
                if text[i] == '\\':
                    i += 2
                    continue
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            out.append(text[start:i])
            continue
        out.append(ch)
        i += 1
    return "".join(out)

# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def read(path):
    return (SRC / path).read_text(encoding="utf-8")


def extract_block(source, name, open_char='{'):
    """Extract the balanced block starting with `export const <name> = <open_char>`.
    Returns the text between (and including) the braces/brackets."""
    escaped_open = re.escape(open_char)
    pat = re.compile(
        rf"export\s+const\s+{re.escape(name)}\s*=\s*{escaped_open}",
        re.DOTALL,
    )
    m = pat.search(source)
    if not m:
        return None
    start = m.end() - 1
    end = _find_matching_close(source, start)
    if end is None:
        return None
    return source[start : end + 1]


def parse_glyph_names(source, export_name):
    """Parse a glyphNames-style object: 'key': 'value' pairs.
    Strips comments first to avoid false matches in comment text."""
    block = extract_block(source, export_name)
    if block is None:
        raise ValueError(f"Could not find {export_name}")
    clean = _strip_js_comments(block)
    results = {}
    for m in re.finditer(r"""'([^']+)'\s*:\s*'([^']*)'""", clean):
        results[m.group(1)] = m.group(2)
    return results


def parse_sub_arrays(source, export_name, sub_keys):
    """Parse named arrays inside an exported object.
    Returns {sub_key: set_of_glyphs}."""
    block = extract_block(source, export_name)
    if block is None:
        raise ValueError(f"Could not find {export_name}")
    clean = _strip_js_comments(block)
    result = {}
    for key in sub_keys:
        pat = re.compile(rf"(?<!\w){re.escape(key)}\s*:\s*\[", re.DOTALL)
        m = pat.search(clean)
        if not m:
            result[key] = set()
            continue
        arr_start = m.end() - 1  # include the '['
        arr_end = _find_matching_close(clean, arr_start)
        if arr_end is None:
            result[key] = set()
            continue
        arr_text = clean[arr_start + 1 : arr_end]
        glyphs = set()
        for gm in re.finditer(r"'([^']+)'", arr_text):
            glyphs.add(gm.group(1))
        result[key] = glyphs
    return result


def parse_syntax_rules(source, lang, sub_keys):
    """Parse syntaxRules.<lang> sub-arrays from syntax.js."""
    pat = re.compile(rf"{re.escape(lang)}\s*:\s*\{{", re.DOTALL)
    m = pat.search(source)
    if not m:
        raise ValueError(f"Could not find syntaxRules.{lang}")
    start = m.end() - 1
    end = _find_matching_close(source, start)
    if end is None:
        raise ValueError(f"Could not find end of syntaxRules.{lang}")
    lang_block = source[start : end + 1]
    clean = _strip_js_comments(lang_block)
    result = {}
    for key in sub_keys:
        pat2 = re.compile(rf"(?<!\w){re.escape(key)}\s*:\s*\[", re.DOTALL)
        m2 = pat2.search(clean)
        if not m2:
            result[key] = set()
            continue
        arr_start = m2.end() - 1
        arr_end = _find_matching_close(clean, arr_start)
        if arr_end is None:
            result[key] = set()
            continue
        arr_text = clean[arr_start + 1 : arr_end]
        glyphs = set()
        for gm in re.finditer(r"'([^']+)'", arr_text):
            glyphs.add(gm.group(1))
        result[key] = glyphs
    return result


def parse_simple_keymap(source, export_name):
    """Parse BQN/APL/Kap keymaps: { 'key': 'glyph', ... }
    Returns set of non-empty glyph values."""
    block = extract_block(source, export_name)
    if block is None:
        raise ValueError(f"Could not find {export_name}")
    clean = _strip_js_comments(block)
    glyphs = set()
    for m in re.finditer(r"'[^']*'\s*:\s*'([^']+)'", clean):
        glyphs.add(m.group(1))
    return glyphs


def parse_tinyapl_keyboard(source):
    """Parse tinyaplKeyboard array, extracting all symP/symPS/symPP/symPPS values."""
    block = extract_block(source, "tinyaplKeyboard", open_char="[")
    if block is None:
        raise ValueError("Could not find tinyaplKeyboard")
    glyphs = set()
    for key in ["symP", "symPS", "symPP", "symPPS"]:
        for m in re.finditer(rf"{key}\s*:\s*'([^']+)'", block):
            glyphs.add(m.group(1))
    return glyphs


def parse_doc_keys(source, export_name):
    """Extract top-level glyph keys from a *GlyphDocs = { "glyph": { ... }, ... } object.
    Uses indentation to distinguish top-level keys from nested ones."""
    block = extract_block(source, export_name)
    if block is None:
        raise ValueError(f"Could not find {export_name}")
    keys = set()
    # Top-level entries are at 4-space indent: '    "glyph": {'
    # Nested keys like "monad": { are at 8+ spaces or tabs
    for m in re.finditer(r'^    "([^"]+)"\s*:\s*\{', block, re.MULTILINE):
        keys.add(m.group(1))
    # Uiua docs use the same indent — check for 4-space entries that
    # aren't inner structural keys
    inner_keys = {"glyph", "type", "docUrl", "monad", "dyad", "overloads",
                  "name", "description", "example", "valence", "signature"}
    keys -= inner_keys
    return keys


# ---------------------------------------------------------------------------
# Cross-reference checks
# ---------------------------------------------------------------------------

def _glyph_display(g):
    """Format a glyph for display with its codepoints."""
    codes = " ".join(f"U+{ord(c):04X}" for c in g)
    return f"  {g}  ({codes})" if len(g) == 1 else f"  {g}  [{codes}]"


def _is_ascii_basic(g):
    """True for single-char standard ASCII that wouldn't need a glyphName entry."""
    if len(g) != 1:
        return False
    cp = ord(g)
    return 0x20 <= cp <= 0x7E


def check_language(lang_name, glyph_names, categories, keyboard, doc_keys):
    """Run cross-reference checks. Returns list of (severity, message) tuples."""
    issues = []
    names_set = set(glyph_names.keys())

    # Check 1: in non-skip categories but not in glyphNames
    for cat_name, glyphs in categories.items():
        if cat_name.lower() in SKIP_CATEGORIES:
            continue
        missing = glyphs - names_set
        for g in sorted(missing, key=lambda c: (len(c), [ord(x) for x in c])):
            issues.append(("error",
                f"In category '{cat_name}' but not in glyphNames: {_glyph_display(g)}"))

    # Check 2: on keyboard but not in glyphNames
    if keyboard:
        missing_kb = keyboard - names_set
        missing_kb = {g for g in missing_kb if not _is_ascii_basic(g)}
        for g in sorted(missing_kb, key=lambda c: (len(c), [ord(x) for x in c])):
            issues.append(("warn",
                f"On keyboard but not in glyphNames: {_glyph_display(g)}"))

    # Check 3: in docs but not in glyphNames (skip basic ASCII syntax chars)
    if doc_keys:
        missing_docs = doc_keys - names_set
        missing_docs = {g for g in missing_docs if not _is_ascii_basic(g)}
        # Multi-glyph doc keys (like «» documenting « and » together) are OK
        # if all individual glyphs are already in glyphNames
        missing_docs = {
            g for g in missing_docs
            if not (len(g) > 1 and all(ch in names_set for ch in g))
        }
        for g in sorted(missing_docs, key=lambda c: (len(c), [ord(x) for x in c])):
            issues.append(("error",
                f"In docs but not in glyphNames: {_glyph_display(g)}"))

    # Check 4: in glyphNames but not in docs (informational)
    if doc_keys:
        no_docs = names_set - doc_keys
        for g in sorted(no_docs, key=lambda c: (len(c), [ord(x) for x in c])):
            issues.append(("info",
                f"In glyphNames but not in docs: {_glyph_display(g)}"))

    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    keyboard_js = read("keyboard.js")
    keymap_js = read("keymap.js")
    syntax_js = read("syntax.js")

    total_errors = 0
    total_warnings = 0
    total_info = 0

    langs = []

    # ---- BQN ----
    bqn_names = parse_glyph_names(keyboard_js, "bqnGlyphNames")
    bqn_cats = parse_syntax_rules(syntax_js, "bqn", ["functions", "monadic", "dyadic"])
    bqn_kb = parse_simple_keymap(keymap_js, "bqnKeymap")
    bqn_docs = parse_doc_keys(read("bqn-docs.js"), "bqnGlyphDocs")
    langs.append(("BQN", bqn_names, bqn_cats, bqn_kb, bqn_docs))

    # ---- APL (Dyalog) ----
    apl_names = parse_glyph_names(keyboard_js, "aplGlyphNames")
    apl_cats = parse_syntax_rules(syntax_js, "apl", ["functions", "monadic", "dyadic"])
    apl_kb = parse_simple_keymap(keymap_js, "aplKeymap")
    apl_docs = parse_doc_keys(read("apl-docs.js"), "aplGlyphDocs")
    langs.append(("APL", apl_names, apl_cats, apl_kb, apl_docs))

    # ---- Kap ----
    kap_names = parse_glyph_names(keyboard_js, "kapGlyphNames")
    kap_cats = parse_syntax_rules(syntax_js, "kap", ["functions", "monadic", "dyadic"])
    kap_kb = parse_simple_keymap(keymap_js, "kapKeymap")
    kap_docs = parse_doc_keys(read("kap-docs.js"), "kapGlyphDocs")
    langs.append(("Kap", kap_names, kap_cats, kap_kb, kap_docs))

    # ---- TinyAPL ----
    tinyapl_names = parse_glyph_names(keyboard_js, "tinyaplGlyphNames")
    tinyapl_cats = parse_sub_arrays(
        keymap_js, "tinyaplGlyphs",
        ["functions", "monadic", "dyadic", "syntax"]
    )
    tinyapl_kb = parse_tinyapl_keyboard(keymap_js)
    tinyapl_docs = parse_doc_keys(read("tinyapl-docs.js"), "tinyaplGlyphDocs")
    langs.append(("TinyAPL", tinyapl_names, tinyapl_cats, tinyapl_kb, tinyapl_docs))

    # ---- J ----
    j_names = parse_glyph_names(keyboard_js, "jGlyphNames")
    j_cats = parse_sub_arrays(
        keymap_js, "jGlyphs",
        ["functions", "verbDigraphs", "monadic", "adverbDigraphs",
         "dyadic", "conjunctionDigraphs", "constants", "comments", "control"]
    )
    j_docs = parse_doc_keys(read("j-docs.js"), "jGlyphDocs")
    langs.append(("J", j_names, j_cats, None, j_docs))

    # ---- Uiua ----
    uiua_names = parse_glyph_names(keyboard_js, "uiuaGlyphNames")
    uiua_cats = parse_sub_arrays(
        keymap_js, "uiuaGlyphs",
        ["stack", "monadicPervasive", "monadicArray",
         "dyadicPervasive", "dyadicArray",
         "monadicModifiers", "dyadicModifiers", "constants"]
    )
    uiua_docs = parse_doc_keys(read("uiua-docs.js"), "uiuaGlyphDocs")
    langs.append(("Uiua", uiua_names, uiua_cats, None, uiua_docs))

    # ---- Run checks and print results ----
    print(bold("=" * 60))
    print(bold("  Missing Primitives Checker"))
    print(bold("=" * 60))
    print()

    for lang_name, names, cats, kb, docs in langs:
        issues = check_language(lang_name, names, cats, kb, docs)

        errors = [i for i in issues if i[0] == "error"]
        warnings = [i for i in issues if i[0] == "warn"]
        infos = [i for i in issues if i[0] == "info"]

        total_errors += len(errors)
        total_warnings += len(warnings)
        total_info += len(infos)

        if not issues:
            print(f"  {green('✓')} {bold(lang_name)}: all clear")
            print()
            continue

        if not errors and not warnings:
            print(f"  {green('✓')} {bold(lang_name)}: all clear")
            if infos:
                print(f"    {dim(f'({len(infos)} glyphNames entries without docs)')}")
            print()
            continue

        status = red("✗") if errors else yellow("~")
        print(f"  {status} {bold(lang_name)}")

        if errors:
            for _, msg in errors:
                print(f"    {red('ERROR')}  {msg}")
        if warnings:
            for _, msg in warnings:
                print(f"    {yellow('WARN')}   {msg}")
        if infos:
            print(f"    {dim(f'({len(infos)} glyphNames entries without docs)')}")
        print()

    # Verbose info output
    if "--verbose" in sys.argv:
        print(bold("-" * 60))
        print(bold("  Detailed: glyphNames without docs"))
        print(bold("-" * 60))
        print()
        for lang_name, names, cats, kb, docs in langs:
            issues = check_language(lang_name, names, cats, kb, docs)
            infos = [i for i in issues if i[0] == "info"]
            if infos:
                print(f"  {bold(lang_name)}:")
                for _, msg in infos:
                    print(f"    {dim('INFO')}   {msg}")
                print()

    # Summary
    print(bold("=" * 60))
    if total_errors == 0 and total_warnings == 0:
        print(f"  {green('All clear!')} No missing primitives found.")
    else:
        parts = []
        if total_errors:
            parts.append(red(f"{total_errors} error(s)"))
        if total_warnings:
            parts.append(yellow(f"{total_warnings} warning(s)"))
        parts.append(dim(f"{total_info} info"))
        print(f"  {', '.join(parts)}")
    print(bold("=" * 60))

    sys.exit(1 if total_errors else 0)


if __name__ == "__main__":
    main()
