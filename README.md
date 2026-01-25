# Array Box

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/be0041c8-3edd-4364-9090-c008fc6ec76a" />

A code editor and runner for array programming languages: **BQN**, **APL**, **J**, and **Uiua**.

## Features

- Syntax highlighting for BQN, APL, J, and Uiua
- Keyboard mappings for typing special characters (BQN: `\` prefix, APL: `` ` `` prefix)
- Light and dark themes (toggle with `Ctrl+D`)
- Code execution with `Ctrl+Enter`
- Switch languages with `Ctrl+Up/Down`

## Running the Demo

```bash
# Start the server manager (handles J and APL backends)
node server-manager.cjs

# Open index.html in a browser
```

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
import { createKeyboardHandler, bqnKeymap, aplKeymap } from 'array-box/keymap';

// Syntax highlighting
import { syntaxRules, highlightCode } from 'array-box/syntax';

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
- `createKeyboardHandler(element, language)` - Attach keyboard handler
- `getKeymapInfo(language)` - Get keymap metadata
- `insertText(element, text)` - Insert text at cursor

**`array-box/syntax`**
- `syntaxRules` - Token classifications for each language
- `highlightCode(text, language)` - Returns HTML with syntax spans
- `escapeHtml(text)` - Escape HTML special characters

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
│   └── theme.css      # CSS variables and syntax classes
├── fonts/             # BQN, APL, Uiua fonts
├── assets/            # Language logos
├── index.html         # Demo site (imports from src/)
├── keymap.js          # Legacy UMD version (window.ArrayKeymap)
├── package.json       # npm package configuration
└── server-manager.cjs # Backend server manager
```

## License

MIT
