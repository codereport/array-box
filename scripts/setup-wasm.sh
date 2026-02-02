#!/bin/bash
# Download/build all WASM modules for Array Box
#
# Usage: ./scripts/setup-wasm.sh
#
# This script sets up WASM modules for browser-based execution of:
#   - Uiua (built from source, requires Rust + wasm-pack)
#   - TinyAPL (downloaded from GitHub)
#
# After running this, the following should work in index.html:
#   - BQN (uses CDN, always works)
#   - Uiua (uses local WASM)
#   - TinyAPL (uses local WASM)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Setting up WASM modules for Array Box..."
echo ""

# TinyAPL - download pre-built files
echo "=== TinyAPL WASM ==="
"$SCRIPT_DIR/update-tinyapl-wasm.sh"
echo ""

# Uiua - build from source
echo "=== Uiua WASM ==="
"$SCRIPT_DIR/update-uiua-wasm.sh"
echo ""

echo "=========================================="
echo "✓ All WASM modules ready!"
echo "=========================================="
echo ""
echo "You can now open index.html in a browser."
echo "BQN, Uiua, and TinyAPL will run client-side."
