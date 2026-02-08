#!/bin/bash
# Build Kap JS module for Array Box
#
# Usage: ./scripts/build-kap-js.sh
#
# Prerequisites: Java 25 (OpenJDK), Git
#
# This builds the Kap array language interpreter to JavaScript
# using Kotlin/JS from the official Kap source repository.
# The output files (standalonejs.js + standard-lib/*.kap)
# are placed in wasm/kap/ for client-side execution.
#
# Source: https://codeberg.org/loke/array (Kotlin Multiplatform)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
KAP_DIR="$PROJECT_DIR/wasm/kap"
BUILD_DIR="/tmp/kap-build-$$"

echo "=========================================="
echo "  Building Kap JS for Array Box"
echo "=========================================="
echo ""
echo "This will build Kap to JavaScript using Kotlin/JS."
echo "Output: $KAP_DIR"
echo ""

# Check Java is available
if ! command -v java &>/dev/null; then
    echo "ERROR: Java is required but not found."
    echo "Install Java 25: https://jdk.java.net/25/"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | grep -oP '\d+' | head -1)
echo "Java version: $JAVA_VERSION"
echo ""

# Clone the Kap source
echo "=== Cloning Kap source ==="
rm -rf "$BUILD_DIR"
git clone --depth=1 https://codeberg.org/loke/array.git "$BUILD_DIR"
echo ""

# Build the standalone JS module
echo "=== Building Kap JS (standalonejs) ==="
cd "$BUILD_DIR"

# Use all available cores
NPROC=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
echo "Using $NPROC parallel workers"

./gradlew standalonejs:jsBrowserDistribution --parallel --max-workers="$NPROC" 2>&1
echo ""

# Copy output files
echo "=== Copying build artifacts ==="
mkdir -p "$KAP_DIR/standard-lib"

# Copy the JS bundle
cp "$BUILD_DIR/standalonejs/build/dist/js/productionExecutable/standalonejs.js" "$KAP_DIR/standalonejs.js"

# Copy standard library files (needed by the JS runtime)
STDLIB_FILES=(
    "standard-lib.kap"
    "base-functions.kap"
    "http.kap"
    "io.kap"
    "map.kap"
    "math.kap"
    "math-kap.kap"
    "output.kap"
    "output3.kap"
    "regex.kap"
    "structure.kap"
    "time.kap"
    "util.kap"
    "fhelp.kap"
    "fhelp-impl.kap"
)

for f in "${STDLIB_FILES[@]}"; do
    cp "$BUILD_DIR/array/standard-lib/$f" "$KAP_DIR/standard-lib/$f"
done

# Copy the loader HTML
if [ ! -f "$KAP_DIR/kap-loader.html" ]; then
    cat > "$KAP_DIR/kap-loader.html" << 'LOADER_EOF'
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script src="standalonejs.js"></script>
</body>
</html>
LOADER_EOF
fi

# Clean up build directory
echo "=== Cleaning up ==="
rm -rf "$BUILD_DIR"

echo ""
echo "=========================================="
echo "  Build complete!"
echo "=========================================="
echo ""
echo "Output files:"
ls -lh "$KAP_DIR/standalonejs.js"
echo ""
echo "Standard library:"
ls -lh "$KAP_DIR/standard-lib/" | tail -n +2
echo ""
echo "Kap JS module is ready to use."
echo "The interpreter runs entirely client-side in the browser."
