#!/bin/bash
# Build J WASM from source using Docker + Emscripten
#
# Usage: ./scripts/update-j-wasm.sh
#
# This builds J (jsoftware/jsource master) to WebAssembly.
# Requires Docker. The build runs inside an emscripten/emsdk container.
#
# Output files:
#   wasm/j/emj.js   (~92KB)  - Emscripten loader
#   wasm/j/emj.wasm (~2.8MB) - J WASM binary
#   wasm/j/emj.data (~11MB)  - J library runtime data
#
# Security: Foreign/shell commands disabled at compile time (#ifdef WASM).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building J WASM (this delegates to build-j-wasm.sh)..."
exec "$SCRIPT_DIR/build-j-wasm.sh"
