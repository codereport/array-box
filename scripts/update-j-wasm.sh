#!/bin/bash
# Download J WASM files from the J Playground (jsoftware/j-playground)
#
# Usage: ./scripts/update-j-wasm.sh
#
# Files are downloaded from:
# https://jsoftware.github.io/j-playground/bin/html2/
#
# This is J 9.03 compiled to WebAssembly via Emscripten.
# Foreign/shell commands (2!:0, 2!:1, 15!:0, etc.) are disabled
# at compile time (#ifdef WASM) - not just filtered by regex.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/wasm/j"

BASE_URL="https://jsoftware.github.io/j-playground/bin/html2"

echo "Downloading J WASM files from J Playground..."
echo "Target directory: $WASM_DIR"
echo ""

# Create directory if it doesn't exist
mkdir -p "$WASM_DIR"

# Download the three required files
echo "Downloading emj.js (~200KB)..."
wget -q "$BASE_URL/emj.js" -O "$WASM_DIR/emj.js"

echo "Downloading emj.wasm (~7.8MB, may take a moment)..."
wget -q "$BASE_URL/emj.wasm" -O "$WASM_DIR/emj.wasm"

echo "Downloading emj.data (~2.0MB)..."
wget -q "$BASE_URL/emj.data" -O "$WASM_DIR/emj.data"

echo ""
echo "Done! Downloaded files:"
ls -lh "$WASM_DIR"

echo ""
echo "J 9.03 WASM module is ready to use."
echo "Security: Foreign/shell commands disabled at compile time (WASM build)."
