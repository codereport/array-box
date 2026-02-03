#!/bin/bash
# Build Uiua WASM module for Array Box
#
# Usage: ./scripts/update-uiua-wasm.sh
#
# Requirements:
#   - Rust toolchain (rustup)
#   - wasm-pack: cargo install wasm-pack
#   - wasm32-unknown-unknown target: rustup target add wasm32-unknown-unknown
#
# This creates a minimal wasm-bindgen wrapper around the Uiua library.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/wasm"
BUILD_DIR="$PROJECT_DIR/.uiua-wasm-build"

echo "Building Uiua WASM module..."
echo "Build directory: $BUILD_DIR"
echo "Output directory: $WASM_DIR"
echo ""

# Check for required tools
if ! command -v cargo &> /dev/null; then
    echo "Error: cargo not found. Please install Rust first:"
    echo ""
    if command -v curl &> /dev/null; then
        echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    elif command -v wget &> /dev/null; then
        echo "  wget -qO- https://sh.rustup.rs | sh"
    else
        echo "  # First install curl or wget, then:"
        echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    fi
    echo ""
    echo "Then restart your shell or run: source ~/.cargo/env"
    exit 1
fi

if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Check for wasm target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "Adding wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Create .cargo/config.toml for WASM configuration
mkdir -p .cargo
cat > .cargo/config.toml << 'CONFIG_EOF'
[target.wasm32-unknown-unknown]
rustflags = ['--cfg', 'getrandom_backend="wasm_js"']
CONFIG_EOF

# Create Cargo.toml for the WASM wrapper
cat > Cargo.toml << 'CARGO_EOF'
[package]
name = "uiua_wasm"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
uiua = { git = "https://github.com/uiua-lang/uiua", default-features = false, features = ["batteries", "web"] }
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
# Required for WASM random number generation (0.3+ uses wasm_js cfg flag set in .cargo/config.toml)
getrandom = { version = "0.3", features = ["wasm_js"] }
# web-sys with features needed by uiua
web-sys = { version = "0.3", features = ["Performance", "Window"] }

[profile.release]
opt-level = "s"
lto = true
CARGO_EOF

# Create lib.rs with wasm-bindgen exports
mkdir -p src
cat > src/lib.rs << 'LIB_EOF'
use serde::Serialize;
use uiua::{Uiua, UiuaError, Value};
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct EvalResult {
    success: bool,
    output: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stack: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    formatted: Option<String>,
}

#[derive(Serialize)]
struct FormatResult {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    formatted: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn value_to_string(value: &Value) -> String {
    value.show()
}

fn format_error(error: &UiuaError) -> String {
    error.to_string()
}

#[wasm_bindgen]
pub fn eval_uiua(code: &str) -> String {
    let mut env = Uiua::with_safe_sys();
    
    // Try to format the code (converts keyboard prefixes to symbols)
    let formatted = uiua::format::format_str(code, &Default::default())
        .ok()
        .map(|f| f.output);
    
    // Use formatted code for evaluation if available, otherwise original
    let code_to_run = formatted.as_deref().unwrap_or(code);
    
    let result = match env.run_str(code_to_run) {
        Ok(_) => {
            let stack: Vec<String> = env.stack().iter().map(value_to_string).collect();
            let output = if stack.is_empty() {
                String::new()
            } else {
                stack.join("\n")
            };
            EvalResult {
                success: true,
                output,
                error: None,
                stack: Some(stack),
                formatted,
            }
        }
        Err(e) => {
            // Try to get partial output from stack
            let stack: Vec<String> = env.stack().iter().map(value_to_string).collect();
            let partial_output = if stack.is_empty() {
                String::new()
            } else {
                stack.join("\n")
            };
            
            let error_msg = format_error(&e);
            let output = if partial_output.is_empty() {
                error_msg.clone()
            } else {
                format!("{}\n{}", partial_output, error_msg)
            };
            
            EvalResult {
                success: false,
                output,
                error: Some(error_msg),
                stack: if stack.is_empty() { None } else { Some(stack) },
                formatted,
            }
        }
    };
    
    serde_json::to_string(&result).unwrap_or_else(|e| {
        format!(r#"{{"success":false,"output":"Serialization error: {}","error":"Serialization error"}}"#, e)
    })
}

#[wasm_bindgen]
pub fn format_uiua(code: &str) -> String {
    let result = match uiua::format::format_str(code, &Default::default()) {
        Ok(formatted) => FormatResult {
            success: true,
            formatted: Some(formatted.output),
            error: None,
        },
        Err(e) => FormatResult {
            success: false,
            formatted: None,
            error: Some(e.to_string()),
        },
    };
    
    serde_json::to_string(&result).unwrap_or_else(|e| {
        format!(r#"{{"success":false,"error":"Serialization error: {}"}}"#, e)
    })
}

#[wasm_bindgen]
pub fn uiua_version() -> String {
    uiua::VERSION.to_string()
}
LIB_EOF

echo "Building with wasm-pack (this may take a few minutes)..."
wasm-pack build --target web --release --out-name uiua_wasm

echo ""
echo "Copying output files..."
mkdir -p "$WASM_DIR"

# Copy the essential files
cp pkg/uiua_wasm.js "$WASM_DIR/"
cp pkg/uiua_wasm_bg.wasm "$WASM_DIR/"

# Clean up build directory
cd "$PROJECT_DIR"
rm -rf "$BUILD_DIR"

echo ""
echo "Done! Output files:"
ls -lh "$WASM_DIR"/uiua_wasm*

echo ""
echo "Uiua WASM module is ready to use."
