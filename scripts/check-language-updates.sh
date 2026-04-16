#!/usr/bin/env bash
#
# Check for new versions of the languages used in Array Box.
# Compares remote sources against scripts/known-versions.json.
# Exits 1 if updates found, 0 if all up to date, 2 on config error.
#
# Sources:
#   CBQN    – latest GitHub tag (dzaima/CBQN)
#   Uiua    – Cargo.toml version from uiua-lang/uiua "latest" tag (= uiua.org/pad)
#   J       – latest GitHub release (jsoftware/jsource)
#   Kap     – kapdemo.dhsdevelopments.com/downloads.html
#   TinyAPL – beta.tinyapl.rubenverg.com/run version selector
#
# Usage:
#   bash scripts/check-language-updates.sh            # normal check
#   bash scripts/check-language-updates.sh --snapshot  # fetch & save current versions

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSIONS_FILE="$SCRIPT_DIR/known-versions.json"
REPORT_FILE="$SCRIPT_DIR/../update-report.md"

if [ ! -f "$VERSIONS_FILE" ]; then
    echo "Error: $VERSIONS_FILE not found"
    exit 2
fi

read_known() { jq -r ".$1" "$VERSIONS_FILE"; }

updates=""
warnings=""

compare() {
    local name="$1" known="$2" latest="$3" source="$4"
    if [ -z "$latest" ] || [ "$latest" = "null" ]; then
        warnings+="- **$name**: failed to fetch from \`$source\`\n"
        echo "  WARNING: failed to fetch"
        return
    fi
    if [ "$latest" != "$known" ]; then
        updates+="- **$name**: \`$known\` → \`$latest\` — $source\n"
        echo "  UPDATE: $known -> $latest"
    else
        echo "  OK ($known)"
    fi
}

# --snapshot mode: fetch current versions and write them to known-versions.json
snapshot_mode=false
if [ "${1:-}" = "--snapshot" ]; then
    snapshot_mode=true
    echo "Snapshot mode: fetching current versions..."
    echo ""
fi

# ── CBQN ──────────────────────────────────────────────────────
echo "CBQN (github.com/dzaima/CBQN tags)"
known=$(read_known cbqn)
# CBQN uses tags, not GitHub Releases
latest_cbqn=$(gh api 'repos/dzaima/CBQN/tags?per_page=1' --jq '.[0].name' 2>/dev/null || true)
if $snapshot_mode; then
    echo "  Current: ${latest_cbqn:-FETCH_FAILED}"
else
    compare "CBQN" "$known" "$latest_cbqn" "github.com/dzaima/CBQN/tags"
fi

# ── Uiua ──────────────────────────────────────────────────────
echo "Uiua (uiua.org/pad via github.com/uiua-lang/uiua 'latest' tag)"
known=$(read_known uiua)
# uiua.org/pad is a SPA — version only renders client-side.
# The repo's "latest" tag always matches what's deployed on the pad.
# Read the version from Cargo.toml at that tag.
latest_uiua=$(curl -sfL --max-time 10 \
    "https://raw.githubusercontent.com/uiua-lang/uiua/refs/tags/latest/Cargo.toml" 2>/dev/null \
    | grep -m1 -oP '^version\s*=\s*"\K[^"]+' || true)
if $snapshot_mode; then
    echo "  Current: ${latest_uiua:-FETCH_FAILED}"
else
    compare "Uiua" "$known" "$latest_uiua" "uiua.org/pad (Cargo.toml @ latest tag)"
fi

# ── J ─────────────────────────────────────────────────────────
echo "J (github.com/jsoftware/jsource releases)"
known=$(read_known j)
latest_j=$(gh api repos/jsoftware/jsource/releases/latest --jq '.tag_name' 2>/dev/null || true)
if $snapshot_mode; then
    echo "  Current: ${latest_j:-FETCH_FAILED}"
else
    compare "J" "$known" "$latest_j" "github.com/jsoftware/jsource/releases"
fi

# ── Kap ───────────────────────────────────────────────────────
echo "Kap (kapdemo.dhsdevelopments.com/downloads.html)"
known=$(read_known kap)
latest_kap=$(curl -sfL --max-time 10 "https://kapdemo.dhsdevelopments.com/downloads.html" 2>/dev/null \
    | grep -oP 'Current version:\s*\K[0-9]{8}-[0-9]+' \
    | head -1 || true)
if $snapshot_mode; then
    echo "  Current: ${latest_kap:-FETCH_FAILED}"
else
    compare "Kap" "$known" "$latest_kap" "kapdemo.dhsdevelopments.com/downloads.html"
fi

# ── TinyAPL ───────────────────────────────────────────────────
echo "TinyAPL (beta.tinyapl.rubenverg.com/run)"
known=$(read_known tinyapl)
# The version selector has <a> links like >0.12.0</a>.
# Anchor on that format to avoid matching JS library versions.
latest_tinyapl=$(curl -sfL --max-time 10 "https://beta.tinyapl.rubenverg.com/run" 2>/dev/null \
    | grep -oP '>\K0\.[0-9]+\.[0-9]+(?=</a)' \
    | sort -V \
    | tail -1 || true)
if $snapshot_mode; then
    echo "  Current: ${latest_tinyapl:-FETCH_FAILED}"
else
    compare "TinyAPL" "$known" "$latest_tinyapl" "beta.tinyapl.rubenverg.com/run"
fi

echo ""

# ── Snapshot: write fetched versions to known-versions.json ───
if $snapshot_mode; then
    jq -n \
        --arg cbqn "${latest_cbqn:-}" \
        --arg uiua "${latest_uiua:-}" \
        --arg j "${latest_j:-}" \
        --arg kap "${latest_kap:-}" \
        --arg tinyapl "${latest_tinyapl:-}" \
        '{cbqn: $cbqn, uiua: $uiua, j: $j, kap: $kap, tinyapl: $tinyapl}' \
        > "$VERSIONS_FILE"
    echo "Wrote current versions to $VERSIONS_FILE"
    cat "$VERSIONS_FILE"
    exit 0
fi

# ── Report ────────────────────────────────────────────────────
has_updates=false

: > "$REPORT_FILE"

if [ -n "$updates" ]; then
    has_updates=true
    {
        echo "## New Versions Available"
        echo ""
        echo -e "$updates"
    } >> "$REPORT_FILE"
fi

if [ -n "$warnings" ]; then
    {
        echo "## Fetch Warnings"
        echo ""
        echo -e "$warnings"
    } >> "$REPORT_FILE"
fi

if [ "$has_updates" = true ]; then
    echo "UPDATES FOUND:"
    echo -e "$updates"
    exit 1
fi

if [ -n "$warnings" ]; then
    echo "WARNINGS:"
    echo -e "$warnings"
fi

echo "All languages up to date."
rm -f "$REPORT_FILE"
