# Array Box

<img width="2560" height="1440" alt="image" src="https://github.com/user-attachments/assets/9ecdee78-7cf6-4458-841f-f9f347043d02" />

A code editor and runner for array programming languages: **BQN**, **APL**, **J**, **Uiua**, **Kap**, and **TinyAPL**.

## Features

- Syntax highlighting for BQN, APL, J, Uiua, Kap, and TinyAPL
- Keyboard mappings for typing special characters (BQN: `\` prefix, APL/Kap/TinyAPL: `` ` `` prefix)
- Visual keyboard overlay with glyph documentation (press `Ctrl+K` or `Ctrl+?`)
- Code execution with `Enter`
- Switch languages with `Ctrl+Up/Down`
- Light and dark themes

## Running the Demo

```bash
# Start the server manager (handles J, APL, Kap backends + web dashboard)
node servers/server-manager.cjs

# Open index.html in a browser
```

**Note:** 
- **BQN**, **Uiua**, and **TinyAPL** run entirely in the browser (no server required)
- **J** and **APL** require local installations and are managed by the server manager
- **Kap** requires a local Kap installation and is managed by the server manager

## Real-time Dashboard

The server manager includes a web-based dashboard that shows usage statistics in real-time:
- Total visitors, code evaluations, and shareable links
- Requests by language with success/failure breakdown
- Activity graph (last 24 hours)

**Access the dashboard:**
- From your local machine: `http://localhost:8085`
- From another device on your network: `http://<your-ip>:8085`

The dashboard automatically updates as users interact with Array Box.

## Using as a Library

Array Box can be used as a reusable library in your own projects.

### Installation

```bash
# Via npm (when published)
npm install array-box

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

**`array-box/keyboard`**
- `ArrayKeyboard` - Visual keyboard overlay component
- `bqnGlyphNames`, `aplGlyphNames`, `jGlyphNames`, `uiuaGlyphNames`, `kapGlyphNames`, `tinyaplGlyphNames` - Glyph name mappings
- `bqnGlyphDocs`, `aplGlyphDocs`, `jGlyphDocs`, `uiuaGlyphDocs`, `kapGlyphDocs`, `tinyaplGlyphDocs` - Glyph documentation

**`array-box/theme.css`**
- CSS variables for light/dark themes
- Syntax highlighting classes (`.syntax-function`, `.syntax-monadic`, etc.)
- Font-face declarations for array language fonts

## Project Structure

```
array-box/
├── src/
│   ├── keymap.js      # ES module - keyboard mappings
│   ├── syntax.js      # ES module - syntax highlighting
│   ├── keyboard.js    # ES module - visual keyboard overlay
│   ├── theme.css      # CSS variables and syntax classes
│   ├── *-docs.js      # Documentation for each language (bqn, apl, j, uiua, kap, tinyapl)
│   └── ...
├── fonts/             # Array language fonts (BQN, APL, Uiua, TinyAPL, Kap)
├── assets/            # Language logos
├── wasm/              # WASM builds
│   ├── tinyapl/       # TinyAPL WASM build
│   └── uiua/          # Uiua WASM build
├── servers/           # Backend server files
│   ├── server-manager.cjs  # Server manager (J, APL, Kap)
│   ├── j-server.cjs        # J language server
│   ├── apl-server.cjs      # APL language server
│   └── kap-server.cjs      # Kap language server
├── scripts/           # Documentation scraping scripts
├── index.html         # Demo site (imports from src/)
└── package.json       # npm package configuration
```

## License

MIT
