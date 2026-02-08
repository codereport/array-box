#!/bin/bash
# Build J 9.6 WASM from source using Docker + Emscripten
#
# Usage: ./scripts/update-j-wasm.sh
#
# This builds J 9.6 (jsoftware/jsource tag 9.6.2) to WebAssembly.
# Requires Docker. The build runs inside an emscripten/emsdk container.
#
# Output files:
#   wasm/j/emj.js   (~92KB)  - Emscripten loader
#   wasm/j/emj.wasm (~2.8MB) - J 9.6 WASM binary
#   wasm/j/emj.data (~11MB)  - J library runtime data
#
# Security: Foreign/shell commands disabled at compile time (#ifdef WASM).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building J 9.6 WASM (this delegates to build-j96-wasm.sh)..."
exec "$SCRIPT_DIR/build-j96-wasm.sh"
