#!/bin/bash
# Build J 9.6 WASM module for Array Box
#
# Usage: ./scripts/build-j96-wasm.sh
#
# Prerequisites: Docker
#
# This builds J 9.6 (from jsoftware/jsource tag 9.6.2) to WebAssembly
# using Emscripten inside a Docker container. The output files
# (emj.js, emj.wasm, emj.data) replace the old J 9.03 WASM files.
#
# Security: Foreign/shell commands are disabled at compile time (#ifdef WASM).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/wasm/j"

echo "=========================================="
echo "  Building J 9.6 WASM for Array Box"
echo "=========================================="
echo ""
echo "This will build J 9.6 to WebAssembly using Docker + Emscripten."
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
    -v "$SCRIPT_DIR/docker-build-j-wasm.sh:/build.sh:ro" \
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
echo "J 9.6 WASM module is ready to use."
echo "Security: Foreign/shell commands disabled at compile time (WASM build)."
