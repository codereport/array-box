#!/bin/bash
# Install dependencies for Array Box
#
# Usage: 
#   sudo ./scripts/install-deps.sh          # Install system packages only
#   sudo ./scripts/install-deps.sh --all    # Install everything including Rust
#
# Note: Rust is installed for the current user (not system-wide)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track what we installed
INSTALLED=()
SKIPPED=()
FAILED=()

INSTALL_RUST=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --all)
            INSTALL_RUST=true
            ;;
        --rust)
            INSTALL_RUST=true
            ;;
        -h|--help)
            echo "Usage: sudo ./scripts/install-deps.sh [options]"
            echo ""
            echo "Options:"
            echo "  --all     Install everything including Rust"
            echo "  --rust    Install Rust toolchain"
            echo "  -h        Show this help"
            echo ""
            echo "Without options, installs: wget, curl, nodejs, npm, docker"
            echo "With --all or --rust, also installs Rust toolchain"
            exit 0
            ;;
    esac
done

# Check if running as root for apt commands
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Error: Please run with sudo for system package installation${NC}"
        echo "  sudo $0 $*"
        exit 1
    fi
}

# Get the actual user (not root when running with sudo)
get_real_user() {
    if [ -n "$SUDO_USER" ]; then
        echo "$SUDO_USER"
    else
        echo "$USER"
    fi
}

# Check if a command exists
check_cmd() {
    command -v "$1" &> /dev/null
}

# Install a package if not present
install_apt_package() {
    local pkg="$1"
    local cmd="${2:-$1}"  # Command to check, defaults to package name
    
    if check_cmd "$cmd"; then
        echo -e "  ${GREEN}✓${NC} $pkg already installed"
        SKIPPED+=("$pkg")
    else
        echo -e "  ${BLUE}→${NC} Installing $pkg..."
        if apt-get install -y "$pkg" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $pkg installed"
            INSTALLED+=("$pkg")
        else
            echo -e "  ${RED}✗${NC} Failed to install $pkg"
            FAILED+=("$pkg")
        fi
    fi
}

# Install Rust for a specific user
install_rust_for_user() {
    local target_user="$1"
    local target_home
    target_home=$(eval echo "~$target_user")
    
    # Check if cargo already exists for this user
    if [ -f "$target_home/.cargo/bin/cargo" ]; then
        echo -e "  ${GREEN}✓${NC} Rust already installed for $target_user"
        SKIPPED+=("rust")
        return 0
    fi
    
    echo -e "  ${BLUE}→${NC} Installing Rust for $target_user..."
    
    # Download and run rustup as the target user
    if sudo -u "$target_user" bash -c 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y' > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Rust installed for $target_user"
        INSTALLED+=("rust")
        
        # Install wasm-pack and target
        echo -e "  ${BLUE}→${NC} Installing wasm-pack..."
        if sudo -u "$target_user" bash -c "source $target_home/.cargo/env && cargo install wasm-pack" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} wasm-pack installed"
            INSTALLED+=("wasm-pack")
        else
            echo -e "  ${YELLOW}○${NC} wasm-pack installation failed (can be installed later)"
        fi
        
        echo -e "  ${BLUE}→${NC} Adding wasm32 target..."
        if sudo -u "$target_user" bash -c "source $target_home/.cargo/env && rustup target add wasm32-unknown-unknown" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} wasm32-unknown-unknown target added"
        fi
    else
        echo -e "  ${RED}✗${NC} Failed to install Rust"
        FAILED+=("rust")
    fi
}

# Configure Docker for a user
configure_docker_user() {
    local target_user="$1"
    
    if groups "$target_user" | grep -q '\bdocker\b'; then
        echo -e "  ${GREEN}✓${NC} $target_user already in docker group"
    else
        echo -e "  ${BLUE}→${NC} Adding $target_user to docker group..."
        if usermod -aG docker "$target_user"; then
            echo -e "  ${GREEN}✓${NC} Added $target_user to docker group"
            echo -e "  ${YELLOW}!${NC} Log out and back in for docker group to take effect"
        else
            echo -e "  ${RED}✗${NC} Failed to add user to docker group"
        fi
    fi
}

# Main installation
main() {
    echo "=========================================="
    echo "Array Box Dependency Installer"
    echo "=========================================="
    echo ""
    
    local real_user
    real_user=$(get_real_user)
    echo "Installing for user: $real_user"
    echo ""
    
    # Check root for apt operations
    check_root
    
    # Update package list
    echo "Updating package list..."
    apt-get update > /dev/null 2>&1
    echo ""
    
    # Download tools
    echo "Download tools:"
    install_apt_package "wget"
    install_apt_package "curl"
    echo ""
    
    # Node.js
    echo "Node.js runtime:"
    install_apt_package "nodejs" "node"
    install_apt_package "npm"
    echo ""
    
    # Docker
    echo "Docker:"
    install_apt_package "docker.io" "docker"
    if check_cmd docker; then
        configure_docker_user "$real_user"
    fi
    echo ""
    
    # Rust (optional, user-level install)
    if [ "$INSTALL_RUST" = true ]; then
        echo "Rust toolchain:"
        # Need curl for rustup
        if ! check_cmd curl; then
            echo -e "  ${RED}✗${NC} curl required for Rust installation"
            FAILED+=("rust")
        else
            install_rust_for_user "$real_user"
        fi
        echo ""
    fi
    
    # Summary
    echo "=========================================="
    echo "Installation Summary"
    echo "=========================================="
    
    if [ ${#INSTALLED[@]} -gt 0 ]; then
        echo -e "${GREEN}Installed:${NC} ${INSTALLED[*]}"
    fi
    
    if [ ${#SKIPPED[@]} -gt 0 ]; then
        echo -e "${YELLOW}Already installed:${NC} ${SKIPPED[*]}"
    fi
    
    if [ ${#FAILED[@]} -gt 0 ]; then
        echo -e "${RED}Failed:${NC} ${FAILED[*]}"
    fi
    
    echo ""
    
    # Post-install notes
    if [[ " ${INSTALLED[*]} " =~ " rust " ]]; then
        echo -e "${YELLOW}Note:${NC} Run 'source ~/.cargo/env' or restart your shell to use Rust"
    fi
    
    if [[ " ${INSTALLED[*]} " =~ " docker.io " ]] || check_cmd docker; then
        if ! groups "$real_user" 2>/dev/null | grep -q '\bdocker\b'; then
            echo -e "${YELLOW}Note:${NC} Log out and back in for docker group membership to take effect"
        fi
    fi
    
    if [ "$INSTALL_RUST" = false ]; then
        echo ""
        echo "To also install Rust (needed for Uiua WASM), run:"
        echo "  sudo $0 --rust"
    fi
    
    echo ""
    echo "Run './docker/build.sh --check' to verify installation"
    
    # Exit with error if anything failed
    if [ ${#FAILED[@]} -gt 0 ]; then
        exit 1
    fi
}

main "$@"
