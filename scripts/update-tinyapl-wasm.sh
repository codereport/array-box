#!/bin/bash
# Update TinyAPL WASM files from the latest beta branch
#
# Usage: ./scripts/update-tinyapl-wasm.sh
#
# Files are downloaded from:
# https://github.com/RubenVerg/TinyAPL/tree/beta/docs/interpreters/latest

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/wasm/tinyapl"

BASE_URL="https://raw.githubusercontent.com/RubenVerg/TinyAPL/beta/docs/interpreters/latest"

echo "Updating TinyAPL WASM files..."
echo "Target directory: $WASM_DIR"
echo ""

# Create directory if it doesn't exist
mkdir -p "$WASM_DIR"

# Download the three required files
echo "Downloading tinyapl.js..."
curl -sL "$BASE_URL/tinyapl.js" -o "$WASM_DIR/tinyapl.js"

echo "Downloading ghc_wasm_jsffi.js..."
curl -sL "$BASE_URL/ghc_wasm_jsffi.js" -o "$WASM_DIR/ghc_wasm_jsffi.js"

echo "Downloading tinyapl-js.wasm (~10MB, may take a moment)..."
curl -sL "$BASE_URL/tinyapl-js.wasm" -o "$WASM_DIR/tinyapl-js.wasm"

echo ""
echo "Done! Downloaded files:"
ls -lh "$WASM_DIR"

echo ""
echo "Note: Remember to update the version display in index.html if needed"
echo "(search for 'tinyapl-version')"
