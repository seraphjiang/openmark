# OpenMark

Open-source Markdown viewer browser extension for Chrome, Edge, and Chromium-based browsers. Renders `.md` files into beautifully formatted documents directly in your browser.

## Features

- **Syntax Highlighting** — 180+ languages via highlight.js
- **Mermaid Diagrams** — flowcharts, sequence diagrams, Gantt charts, and more
- **LaTeX Math** — inline and block equations via KaTeX
- **File Explorer** — browse local directories, click to render `.md` files
- **Live Editor** — split-view markdown editor with real-time preview
- **AI Chat** — ask questions about your document (OpenAI, Gemini, DeepSeek)
- **Table of Contents** — auto-generated with scroll spy
- **Image Lightbox** — click to view full-screen
- **Auto-Refresh** — live reload as you edit local files
- **Export** — HTML download, PDF print, clipboard copy
- **Themes** — light, dark, and auto (follows system)
- **Resizable Panels** — drag to resize, widths persisted
- **Bookmarks & Comments** — per-page annotations
- **Privacy** — all rendering local, no data leaves your browser

See [docs/FEATURES.md](docs/FEATURES.md) for complete feature documentation.

## Install from Source

```bash
git clone https://github.com/seraphjiang/openmark.git
cd openmark
npm install
npm run build
```

Then load the `dist/` folder as an unpacked extension:

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder
4. (For local files) Click extension details → enable **Allow access to file URLs**

## Development

```bash
npm run dev          # Watch mode — rebuilds on file changes
npx tsc --noEmit    # Type-check only
npm run build       # Full production build
```

After each rebuild, click the reload button on `chrome://extensions/`.

### Build Pipeline

1. `tsc --noEmit` — type-check
2. `vite build` — bundles content script (IIFE, includes mermaid/hljs/katex)
3. `python3 scripts/ascii-escape-content.py` — converts non-ASCII to `\uXXXX` escapes (required for Chrome Web Store)
4. `vite build --config vite.config.pages.ts` — builds background, popup, options as ES modules

### Project Structure

```
src/
├── content/            # Content script (single IIFE bundle)
│   ├── index.ts        # Entry: page detection, layout, render orchestration
│   ├── layout.ts       # Three-panel DOM structure
│   ├── renderer.ts     # markdown-it + plugins (hljs, katex, mermaid)
│   ├── toc.ts          # Table of contents + scroll spy
│   ├── lightbox.ts     # Image fullscreen overlay
│   ├── fileExplorer.ts # Directory tree (file:// only)
│   ├── flyoutMenu.ts   # Right panel tabs (Chat/Settings/Actions/Collab)
│   ├── aiChat.ts       # AI provider integration
│   ├── resizer.ts      # Panel resize handles
│   └── styles/main.css # All styles
├── background/         # Service worker (file proxy + directory listing)
├── shared/             # Types + storage helpers
├── popup/              # Toolbar popup
└── options/            # Full settings page
```

### Key Architecture Decisions

- **Mermaid bundled in content script** — runs in Chrome's isolated world, works on all pages including sandboxed ones. ASCII-escape handles CWS encoding.
- **Background proxy for file://** — content scripts can't fetch `file://` URLs directly (null origin). Background worker has `host_permissions`.
- **Directory listing via fetch** — `fetch("file:///dir/")` returns Chrome's HTML directory page. Parsed with regex for `addRow()` calls.
- **No frameworks** — vanilla TypeScript, DOM APIs, no React/Vue/Angular.

## Build for Distribution

```bash
npm run build
cd dist && zip -r ../openmark.zip .
```

Upload `openmark.zip` to:
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Edge Add-ons Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/)

## Documentation

- [Features](docs/FEATURES.md) — complete feature reference
- [Changelog](docs/CHANGELOG.md) — version history and release notes
- [CLAUDE.md](CLAUDE.md) — AI agent guidance for Claude Code
- [.cursorrules](.cursorrules) — AI agent guidance for Cursor
- [Copilot Instructions](.github/copilot-instructions.md) — AI agent guidance for GitHub Copilot

## Tech Stack

- TypeScript + Vite
- Manifest V3
- markdown-it (parsing)
- highlight.js (syntax highlighting)
- mermaid (diagrams)
- KaTeX (math rendering)

## License

MIT
