#!/bin/bash
# Build Docker sandbox images for Array Box
# Usage: ./build.sh [options] [language]
# Examples:
#   ./build.sh           # Build all Docker images
#   ./build.sh j         # Build only J image
#   ./build.sh kap       # Build only Kap image
#   ./build.sh --wasm    # Build Docker images + WASM modules
#   ./build.sh --all     # Build everything (Docker + WASM)
#   ./build.sh --check   # Check dependencies without building

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$SCRIPT_DIR"

BUILD_WASM=false
CHECK_ONLY=false
INSTALL_DEPS=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
check_cmd() {
    command -v "$1" &> /dev/null
}

# Function to print dependency status
print_status() {
    local name="$1"
    local installed="$2"
    local required="$3"
    
    if [ "$installed" = true ]; then
        echo -e "  ${GREEN}✓${NC} $name"
    elif [ "$required" = true ]; then
        echo -e "  ${RED}✗${NC} $name (required)"
    else
        echo -e "  ${YELLOW}○${NC} $name (optional)"
    fi
}

# Function to check all dependencies
check_dependencies() {
    echo "=========================================="
    echo "Checking dependencies..."
    echo "=========================================="
    echo ""
    
    local missing_required=false
    local missing_optional=false
    
    # Download tools (need at least one)
    echo "Download tools (need wget OR curl):"
    local has_wget=false
    local has_curl=false
    check_cmd wget && has_wget=true
    check_cmd curl && has_curl=true
    print_status "wget" "$has_wget" false
    print_status "curl" "$has_curl" false
    if [ "$has_wget" = false ] && [ "$has_curl" = false ]; then
        missing_required=true
        echo -e "  ${RED}ERROR: Need either wget or curl${NC}"
    fi
    echo ""
    
    # Rust toolchain (for Uiua WASM)
    echo "Rust toolchain (for Uiua WASM build):"
    local has_rustup=false
    local has_cargo=false
    local has_wasm_pack=false
    check_cmd rustup && has_rustup=true
    check_cmd cargo && has_cargo=true
    check_cmd wasm-pack && has_wasm_pack=true
    print_status "rustup" "$has_rustup" false
    print_status "cargo" "$has_cargo" false
    print_status "wasm-pack" "$has_wasm_pack" false
    if [ "$has_cargo" = false ]; then
        missing_optional=true
        echo -e "  ${YELLOW}Note: Rust needed to build Uiua WASM from source${NC}"
    fi
    echo ""
    
    # Node.js (for running servers)
    echo "Node.js (for running servers):"
    local has_node=false
    local has_npm=false
    check_cmd node && has_node=true
    check_cmd npm && has_npm=true
    print_status "node" "$has_node" false
    print_status "npm" "$has_npm" false
    if [ "$has_node" = false ]; then
        missing_optional=true
        echo -e "  ${YELLOW}Note: Node.js needed to run the servers${NC}"
    fi
    echo ""
    
    # Docker (for sandbox builds)
    echo "Docker (for sandbox container builds):"
    local has_docker=false
    local docker_running=false
    check_cmd docker && has_docker=true
    if [ "$has_docker" = true ] && docker info &> /dev/null; then
        docker_running=true
    fi
    print_status "docker" "$has_docker" false
    if [ "$has_docker" = true ]; then
        if [ "$docker_running" = true ]; then
            echo -e "  ${GREEN}✓${NC} docker daemon running"
        else
            echo -e "  ${YELLOW}○${NC} docker daemon not running"
        fi
    fi
    echo ""
    
    # Summary
    echo "=========================================="
    if [ "$missing_required" = true ]; then
        echo -e "${RED}Missing required dependencies!${NC}"
        echo ""
        echo "Install missing dependencies:"
        echo ""
        if [ "$has_wget" = false ] && [ "$has_curl" = false ]; then
            echo "  # Download tool (choose one):"
            echo "  sudo apt install wget"
            echo "  # or"
            echo "  sudo apt install curl"
        fi
        return 1
    elif [ "$missing_optional" = true ]; then
        echo -e "${YELLOW}Some optional dependencies missing${NC}"
        echo ""
        echo "To install optional dependencies:"
        echo ""
        if [ "$has_cargo" = false ]; then
            echo "  # Rust (for Uiua WASM build):"
            if check_cmd curl; then
                echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            else
                echo "  wget -qO- https://sh.rustup.rs | sh"
            fi
            echo "  # Then restart your shell or run: source ~/.cargo/env"
            echo ""
        fi
        if [ "$has_node" = false ]; then
            echo "  # Node.js (for running servers):"
            echo "  sudo apt install nodejs npm"
            echo "  # or use nvm: https://github.com/nvm-sh/nvm"
            echo ""
        fi
        if [ "$has_docker" = false ]; then
            echo "  # Docker (for sandbox builds):"
            echo "  sudo apt install docker.io"
            echo "  sudo usermod -aG docker \$USER"
            echo ""
        fi
    else
        echo -e "${GREEN}All dependencies installed!${NC}"
    fi
    echo "=========================================="
    
    return 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --wasm|--all)
            BUILD_WASM=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --install-deps)
            INSTALL_DEPS=true
            shift
            ;;
        -h|--help)
            echo "Usage: ./build.sh [options] [language]"
            echo ""
            echo "Options:"
            echo "  --wasm    Also build/download WASM modules (Uiua, TinyAPL)"
            echo "  --all     Same as --wasm"
            echo "  --check   Check dependencies without building"
            echo "  -h        Show this help"
            echo ""
            echo "Languages: j, kap, apl"
            echo ""
            echo "Examples:"
            echo "  ./build.sh           # Build all Docker images"
            echo "  ./build.sh j         # Build only J image"
            echo "  ./build.sh --wasm    # Build Docker images + WASM modules"
            echo "  ./build.sh --check   # Check what dependencies are installed"
            exit 0
            ;;
        *)
            LANG_ARG="$1"
            shift
            ;;
    esac
done

# If --check flag, just check dependencies and exit
if [ "$CHECK_ONLY" = true ]; then
    check_dependencies
    exit $?
fi

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
    
    local wasm_success=true
    local tinyapl_ok=false
    local uiua_ok=false
    
    # TinyAPL - download pre-built files
    echo "Downloading TinyAPL WASM..."
    if [ -x "$PROJECT_DIR/scripts/update-tinyapl-wasm.sh" ]; then
        if "$PROJECT_DIR/scripts/update-tinyapl-wasm.sh"; then
            tinyapl_ok=true
        else
            echo -e "${RED}Failed to download TinyAPL WASM${NC}"
            wasm_success=false
        fi
    else
        echo "Warning: update-tinyapl-wasm.sh not found or not executable"
        wasm_success=false
    fi
    echo ""
    
    # Uiua - build from source (requires Rust)
    echo "Building Uiua WASM..."
    if [ -x "$PROJECT_DIR/scripts/update-uiua-wasm.sh" ]; then
        if "$PROJECT_DIR/scripts/update-uiua-wasm.sh"; then
            uiua_ok=true
        else
            echo -e "${YELLOW}Skipping Uiua WASM (Rust not installed)${NC}"
            echo "Run './build.sh --check' to see installation instructions"
        fi
    else
        echo "Warning: update-uiua-wasm.sh not found or not executable"
    fi
    echo ""
    
    # Summary
    echo "=========================================="
    echo "WASM build summary:"
    if [ "$tinyapl_ok" = true ]; then
        echo -e "  ${GREEN}✓${NC} TinyAPL WASM downloaded"
    else
        echo -e "  ${RED}✗${NC} TinyAPL WASM failed"
    fi
    if [ "$uiua_ok" = true ]; then
        echo -e "  ${GREEN}✓${NC} Uiua WASM built"
    else
        echo -e "  ${YELLOW}○${NC} Uiua WASM skipped (needs Rust)"
    fi
    echo "=========================================="
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
