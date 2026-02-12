#!/bin/bash
# Inner build script - runs INSIDE the emscripten Docker container
# Builds CBQN (dzaima/CBQN) as WebAssembly with Emscripten
#
# Strategy:
#   1. Clone CBQN
#   2. Build the "for-build" native CBQN (needed by the build system)
#   3. Build the emcc-o3 WASM target
#   4. Copy BQN.js + BQN.wasm to output

set -e

NPROC=$(nproc 2>/dev/null || echo 4)
WORK=/build
OUTPUT=/output

mkdir -p "$WORK" "$OUTPUT"
cd "$WORK"

echo "============================================"
echo "  Building CBQN WASM with Emscripten"
echo "  Using $NPROC cores"
echo "============================================"
echo ""

# ============================================================
# Step 1: Clone CBQN
# ============================================================
echo "=== Step 1: Cloning CBQN ==="
if [ ! -d CBQN ]; then
    git clone --recurse-submodules --depth 1 --branch develop https://github.com/dzaima/CBQN.git
fi
cd "$WORK/CBQN"
echo "CBQN source ready at $(pwd)"
echo ""

# ============================================================
# Step 2: Build the native "for-build" CBQN
# ============================================================
# The emcc-o3 target needs a native CBQN to run build.bqn and Singeli
echo "=== Step 2: Building native CBQN (for-build) ==="
make for-build CC=cc j="$NPROC"
echo "Native CBQN for-build ready."
echo ""

# ============================================================
# Step 3: Build CBQN with Emscripten (emcc-o3)
# ============================================================
echo "=== Step 3: Building CBQN WASM (emcc-o3) ==="

# CBQN's emcc-o3 target already sets up:
#   - EMCC and WASM macros (main() just calls repl_init())
#   - cbqn_runLine(char* ln, i64 len) with error catching
#   - cbqn_evalSrc(char* src, i64 len) for formatted eval
#   - EXPORTED_FUNCTIONS and EXPORTED_RUNTIME_METHODS
#   - ALLOW_MEMORY_GROWTH, etc.
#
# Output: BQN.js + BQN.wasm in the current directory
#
# FFI=0: no libffi dependency (not available in browser)
# REPLXX=0: no line editing (not needed in browser)
make emcc-o3 FFI=0 REPLXX=0 j="$NPROC"

echo ""

# ============================================================
# Step 4: Copy output files (keep original names)
# ============================================================
echo "=== Step 4: Copying output files ==="

if [ -f "$WORK/CBQN/BQN.js" ]; then
    cp "$WORK/CBQN/BQN.js" "$OUTPUT/BQN.js"
    cp "$WORK/CBQN/BQN.wasm" "$OUTPUT/BQN.wasm"
else
    echo "Looking for output files..."
    find "$WORK/CBQN" \( -name "*.js" -o -name "*.wasm" \) -newer "$WORK/CBQN/makefile" 2>/dev/null || true
    echo "ERROR: BQN.js / BQN.wasm not found"
    exit 1
fi

echo ""
echo "Output files:"
ls -lh "$OUTPUT/"

echo ""
echo "============================================"
echo "  CBQN WASM build complete!"
echo "============================================"
