#!/bin/bash
# Build CBQN WASM module for Array Box
#
# Usage: ./scripts/build-cbqn-wasm.sh
#
# Prerequisites: Docker
#
# This builds CBQN (from dzaima/CBQN develop branch) to WebAssembly
# using Emscripten inside a Docker container. The output files
# (BQN.js, BQN.wasm) are placed in wasm/bqn/.
#
# Uses CBQN's built-in emcc-o3 target which exports cbqn_runLine
# and cbqn_evalSrc for REPL-style evaluation with error handling.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/wasm/bqn"

echo "=========================================="
echo "  Building CBQN WASM for Array Box"
echo "=========================================="
echo ""
echo "This will build CBQN to WebAssembly using Docker + Emscripten."
echo "Output: $WASM_DIR"
echo ""

# Check Docker is available
if ! command -v docker &>/dev/null; then
    echo "ERROR: Docker is required but not found."
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Pull emscripten Docker image
echo "=== Pulling Emscripten Docker image ==="
docker pull emscripten/emsdk:3.1.51
echo ""

# Create output directory
mkdir -p "$WASM_DIR"

# Run the build inside Docker
echo "=== Starting Docker build ==="
docker run --rm \
    -v "$SCRIPT_DIR/docker-build-cbqn-wasm.sh:/build.sh:ro" \
    -v "$WASM_DIR:/output" \
    emscripten/emsdk:3.1.51 \
    bash /build.sh

echo ""
echo "=========================================="
echo "  Build complete!"
echo "=========================================="
echo ""
echo "Output files:"
ls -lh "$WASM_DIR"
echo ""
echo "CBQN WASM module is ready to use."
