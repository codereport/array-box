#!/bin/bash
# Build Docker sandbox images for Array Box
# Usage: ./build.sh [options] [language]
# Examples:
#   ./build.sh           # Build all Docker images
#   ./build.sh j         # Build only J image
#   ./build.sh kap       # Build only Kap image
#   ./build.sh --wasm    # Build Docker images + WASM modules
#   ./build.sh --all     # Build everything (Docker + WASM)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$SCRIPT_DIR"

BUILD_WASM=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --wasm|--all)
            BUILD_WASM=true
            shift
            ;;
        -h|--help)
            echo "Usage: ./build.sh [options] [language]"
            echo ""
            echo "Options:"
            echo "  --wasm    Also build/download WASM modules (Uiua, TinyAPL)"
            echo "  --all     Same as --wasm"
            echo "  -h        Show this help"
            echo ""
            echo "Languages: j, kap, apl"
            echo ""
            echo "Examples:"
            echo "  ./build.sh           # Build all Docker images"
            echo "  ./build.sh j         # Build only J image"
            echo "  ./build.sh --wasm    # Build Docker images + WASM modules"
            exit 0
            ;;
        *)
            LANG_ARG="$1"
            shift
            ;;
    esac
done

build_image() {
    local lang=$1
    local image_name="arraybox-sandbox-$lang"
    local dockerfile="Dockerfile.$lang"
    
    if [ ! -f "$dockerfile" ]; then
        echo "Error: $dockerfile not found"
        return 1
    fi
    
    echo "=========================================="
    echo "Building $image_name..."
    echo "=========================================="
    
    docker build -t "$image_name" -f "$dockerfile" .
    
    echo "✓ Successfully built $image_name"
    echo ""
}

# Function to build WASM modules
build_wasm() {
    echo "=========================================="
    echo "Building WASM modules..."
    echo "=========================================="
    echo ""
    
    # TinyAPL - download pre-built files
    echo "Downloading TinyAPL WASM..."
    if [ -x "$PROJECT_DIR/scripts/update-tinyapl-wasm.sh" ]; then
        "$PROJECT_DIR/scripts/update-tinyapl-wasm.sh"
    else
        echo "Warning: update-tinyapl-wasm.sh not found or not executable"
    fi
    echo ""
    
    # Uiua - build from source (requires Rust)
    echo "Building Uiua WASM..."
    if [ -x "$PROJECT_DIR/scripts/update-uiua-wasm.sh" ]; then
        "$PROJECT_DIR/scripts/update-uiua-wasm.sh"
    else
        echo "Warning: update-uiua-wasm.sh not found or not executable"
    fi
    echo ""
    
    echo "✓ WASM modules ready!"
    echo ""
}

# Check if Docker is running (only if we need to build Docker images)
if [ -z "$LANG_ARG" ] || [ "$LANG_ARG" != "" ]; then
    if ! docker info > /dev/null 2>&1; then
        if [ "$BUILD_WASM" = true ] && [ -z "$LANG_ARG" ]; then
            echo "Warning: Docker is not running. Skipping Docker builds."
            echo ""
        elif [ "$BUILD_WASM" = false ]; then
            echo "Error: Docker is not running. Please start Docker first."
            exit 1
        fi
    fi
fi

# Build WASM if requested
if [ "$BUILD_WASM" = true ]; then
    build_wasm
fi

# Build Docker images
if docker info > /dev/null 2>&1; then
    if [ -n "$LANG_ARG" ]; then
        # Build specific image
        build_image "$LANG_ARG"
    else
        # Build all images
        echo "Building all sandbox images..."
        echo ""
        
        # J is the most straightforward
        build_image "j"
        
        # Kap requires JVM
        build_image "kap"
        
        # APL note
        echo "=========================================="
        echo "Note: APL sandbox requires Dyalog APL to be"
        echo "mounted from your host system at runtime."
        echo "See docker/Dockerfile.apl for details."
        echo "=========================================="
        
        echo ""
        echo "✓ All sandbox images built successfully!"
    fi
fi

echo ""
echo "To run servers with sandboxing enabled:"
echo "  node servers/server-manager.cjs --sandbox"
