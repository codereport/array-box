# <p align="center">⬢ ArrayBox</p>

<p align="center">
    <a href="https://github.com/codereport/array-box/issues" alt="contributions welcome">
        <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat" /></a>
    <a href="https://lbesson.mit-license.org/" alt="MIT license">
        <img src="https://img.shields.io/badge/License-MIT-blue.svg" /></a>        
    <a href="https://github.com/codereport?tab=followers" alt="GitHub followers">
        <img src="https://img.shields.io/github/followers/codereport.svg?style=social&label=Follow" /></a>
    <a href="https://GitHub.com/codereport/array-box/stargazers/" alt="GitHub stars">
        <img src="https://img.shields.io/github/stars/codereport/array-box.svg?style=social&label=Star" /></a>
    <a href="https://twitter.com/code_report" alt="Twitter">
        <img src="https://img.shields.io/twitter/follow/code_report.svg?style=social&label=@code_report" /></a>
</p>

<img width="2560" height="1440" alt="image" src="https://github.com/user-attachments/assets/9ecdee78-7cf6-4458-841f-f9f347043d02" />

A code editor and runner for array programming languages: **BQN**, **APL**, **J**, **Uiua**, **Kap**, and **TinyAPL**.

## Features

- Syntax highlighting for BQN, APL, J, Uiua, Kap, and TinyAPL
- Keyboard mappings for typing special characters (BQN: `\` prefix, APL/Kap/TinyAPL: `` ` `` prefix)
- Visual keyboard overlay with glyph documentation
- Primitive search combo box with fuzzy matching
- Code formatting and comment toggling
- Input history navigation
- Permalinks for sharing code snippets
- Copy code as vertical image to clipboard
- Inline documentation tooltips for glyphs
- Primitive translation when switching languages
- Dark theme (Dracula-style palette)

### Keyboard Shortcuts

#### Box Mode

| Shortcut             | Action                           |
| -------------------- | -------------------------------- |
| `Enter`              | Evaluate code                    |
| `Shift+Enter`        | Insert newline                   |
| `Ctrl+Up/Down`       | Switch language                  |
| `Ctrl+K`             | Toggle keyboard overlay          |
| `Ctrl+H`             | Toggle help screen               |
| `Ctrl+B`             | Show fonts                       |
| `Ctrl+Space`         | Open primitive search            |
| `Ctrl+L`             | Create permalink (copy URL)      |
| `Ctrl+I`             | Copy vertical image to clipboard |
| `Ctrl+F`             | Format code (no evaluation)      |
| `Ctrl+/`             | Toggle comment                   |
| `Ctrl+Shift+Up/Down` | Cycle through input history      |
| `F1`                 | Show docs for glyph at cursor    |

#### Keyboard Mode

| Shortcut    | Action              |
| ----------- | ------------------- |
| `S` or type | Search primitives   |
| `Up/Down`   | Navigate keys       |
| `Shift`     | Cycle through docs  |
| `F1`        | Open full docs link |

## Running the Demo

```bash
# Start the server manager (handles APL backend + dashboard + permalinks)
node servers/server-manager.cjs

# Open index.html in a browser
```

**Note:** 
- **BQN**, **Uiua**, **J**, **Kap**, and **TinyAPL** run entirely in the browser (no server required)
  - BQN uses [CBQN](https://github.com/dzaima/CBQN) compiled to WASM for client-side execution
  - J uses WASM for client-side execution
  - Kap uses Kotlin/JS for client-side execution
  - TinyAPL and Uiua use WASM for client-side execution
- **APL** requires a local Dyalog installation and is managed by the server manager

## Docker Sandbox Mode (Recommended for Shared Use)

For secure APL code execution, you can run the APL server in a Docker container with strict isolation:

```bash
# Build the APL sandbox image (one-time setup)
cd docker && ./build.sh

# Run with sandbox mode enabled
node servers/server-manager.cjs --sandbox
```

**Sandbox security features:**
- Read-only filesystem
- No network access
- CPU and memory limits
- Unprivileged user
- 10-second execution timeout
- Process limits
- Application-level sandboxing via Safe3.dyalog (token whitelisting)

## Using as a Library

ArrayBox can be used as a reusable library in your own projects.

### Installation

```bash
# Via npm (when published)
npm install array-box (it isn't published yet)

# Or as a git submodule
git submodule add https://github.com/codereport/array-box
```

### ES Module Usage

```javascript
// Keyboard mappings
import { createKeyboardHandler, bqnKeymap, aplKeymap, kapKeymap, tinyaplKeymap } from 'array-box/keymap';

// Syntax highlighting
import { syntaxRules, highlightCode } from 'array-box/syntax';

// Visual keyboard overlay
import { ArrayKeyboard } from 'array-box/keyboard';

// Theme CSS (import in your CSS or HTML)
import 'array-box/theme.css';
```

### Example: Add BQN keyboard support to an input

```javascript
import { createKeyboardHandler } from 'array-box/keymap';

const input = document.getElementById('myInput');
const cleanup = createKeyboardHandler(input, 'bqn');

// Later, to remove the handler:
cleanup();
```

### Example: Syntax highlighting

```javascript
import { highlightCode } from 'array-box/syntax';

const code = '+´⥊5‿5';
const html = highlightCode(code, 'bqn');
element.innerHTML = html;
```

### Available Exports

**`array-box/keymap`**
- `bqnKeymap` - BQN character mappings
- `aplKeymap` - APL character mappings
- `kapKeymap` - Kap character mappings
- `tinyaplKeymap` - TinyAPL character mappings
- `createKeyboardHandler(element, language)` - Attach keyboard handler
- `getKeymapInfo(language)` - Get keymap metadata
- `insertText(element, text)` - Insert text at cursor

**`array-box/syntax`**
- `syntaxRules` - Token classifications for each language
- `highlightCode(text, language)` - Returns HTML with syntax spans
- `escapeHtml(text)` - Escape HTML special characters
- `getSyntaxClass(token)` - Get CSS class for a syntax token

**`array-box/keyboard`**
- `ArrayKeyboard` - Visual keyboard overlay component
- `bqnGlyphNames`, `aplGlyphNames`, `jGlyphNames`, `uiuaGlyphNames`, `kapGlyphNames`, `tinyaplGlyphNames` - Glyph name mappings
- `bqnGlyphDocs`, `aplGlyphDocs`, `jGlyphDocs`, `uiuaGlyphDocs`, `kapGlyphDocs`, `tinyaplGlyphDocs` - Glyph documentation

**`array-box/bqn-docs`**, **`array-box/uiua-docs`**, **`array-box/j-docs`**
- Glyph documentation and hover content for each language

**`array-box/theme.css`**
- CSS variables for the dark theme
- Syntax highlighting classes (`.syntax-function`, `.syntax-monadic`, etc.)
- Font-face declarations for array language fonts

## Project Structure

```
array-box/
├── src/
│   ├── keymap.js              # ES module - keyboard mappings
│   ├── syntax.js              # ES module - syntax highlighting
│   ├── keyboard.js            # ES module - visual keyboard overlay
│   ├── editor-features.js     # Code formatting, comments, history
│   ├── primitive-translate.js # Cross-language primitive translation
│   ├── theme.css              # CSS variables and syntax classes
│   └── *-docs.js              # Glyph docs (bqn, apl, j, uiua, kap, tinyapl)
├── fonts/                     # Array language fonts (BQN, APL, Uiua, TinyAPL, Kap)
├── assets/                    # Language logos
├── wasm/
│   ├── bqn/                   # CBQN WASM build
│   ├── tinyapl/               # TinyAPL WASM build
│   ├── kap/                   # Kap Kotlin/JS build
│   ├── j/                     # J WASM build
│   └── uiua_wasm.*            # Uiua WASM build
├── servers/
│   ├── server-manager.cjs     # Main orchestrator (starts APL, permalink, dashboard)
│   ├── apl-server.cjs         # APL language server (Dyalog)
│   ├── permalink-server.cjs   # Permalink and OG meta server
│   ├── dashboard-server.cjs   # Real-time usage statistics dashboard
│   ├── api-gateway.cjs        # Reverse proxy for remote deployment
│   ├── og-generator.cjs       # Open Graph preview image generator
│   ├── sandbox.cjs            # Docker sandbox execution runner (APL)
│   └── stats.cjs              # Usage stats persistence
├── docker/                    # Dockerfile for sandboxed APL execution
├── scripts/                   # Build, update, and doc scraping scripts
├── storage/                   # Permalinks and OG image storage
├── config.js                  # Backend URL configuration (local vs remote)
├── index.html                 # Demo site (imports from src/)
└── package.json               # npm package configuration
```

## License

MIT
