# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

OpenMark is a Chrome/Edge Manifest V3 browser extension that renders `.md`/`.markdown` files into formatted documents. Features: syntax highlighting, Mermaid diagrams, KaTeX math, file explorer, live editor, AI chat, TOC, lightbox, auto-refresh, export HTML/PDF.

## Commands

```bash
npm run build    # Full production build (typecheck → vite build → ascii-escape → pages build)
npm run dev      # Watch mode — rebuilds content script on file changes
npx tsc --noEmit # Type-check only
```

No test or lint commands configured. After building, load `dist/` as unpacked extension in `chrome://extensions/`.

## Build Pipeline

`npm run build` runs sequentially:

1. `tsc --noEmit` — type-check, no output
2. `vite build` — builds `src/content/index.ts` → `dist/content.js` (IIFE, bundles everything including mermaid/hljs/katex); copies static assets
3. `python3 scripts/ascii-escape-content.py` — converts non-ASCII to `\uXXXX` escapes in `content.js` (required for Chrome Web Store)
4. `vite build --config vite.config.pages.ts` — builds background, popup, options as ES modules

First vite build cleans `dist/` (`emptyOutDir: true`); the pages build appends (`emptyOutDir: false`).

## Architecture

```
src/
├── content/           # Content script (IIFE bundle → dist/content.js)
│   ├── index.ts       # Entry point: detection, layout init, render orchestration
│   ├── layout.ts      # Three-panel DOM structure (left/center/right)
│   ├── renderer.ts    # markdown-it + hljs + katex + mermaid rendering
│   ├── toc.ts         # Table of contents generation + scroll spy
│   ├── lightbox.ts    # Image click → fullscreen overlay
│   ├── fileExplorer.ts # Directory tree browser (file:// only)
│   ├── flyoutMenu.ts  # Right panel tabs: Chat, Settings, Actions, Collab
│   ├── aiChat.ts      # AI chat (OpenAI/Gemini/DeepSeek integration)
│   ├── resizer.ts     # Drag-to-resize panel handles
│   └── styles/main.css # All styles (layout, content, panels, print)
├── background/
│   └── index.ts       # Service worker: FETCH_FILE + LIST_DIRECTORY handlers
├── shared/
│   ├── types.ts       # Settings, AiConfig, DirEntry, LocalState interfaces
│   └── storage.ts     # chrome.storage.sync (settings) + chrome.storage.local (state)
├── popup/             # Toolbar popup (quick settings)
├── options/           # Full settings page
└── mermaid-bundle/    # UNUSED (legacy, mermaid now bundled in content.js)
```

### Data Flow

1. Content script detects markdown page → builds layout → renders content
2. For `file://`: fetches raw file via background proxy (CORS workaround)
3. File explorer: sends `LIST_DIRECTORY` to background → parses Chrome's directory HTML
4. Editor: textarea input → 500ms debounce → re-render preview (preserves scroll/cursor)
5. AI chat: sends document context + messages to configured provider API

### Layout Structure (DOM)

```
body.openmark-body
  div.openmark-layout (flex row)
    aside.openmark-panel-left (file:// only)
      div.panel-left-explorer    # File tree
      div.openmark-split-handle  # Vertical resize
      div.panel-left-outline     # TOC
    div.openmark-resize-handle.left
    main.openmark-panel-center (flex column)
      div.center-preview         # Rendered markdown
      div.openmark-split-handle  # Horizontal resize
      div.center-editor          # Textarea (hidden by default)
    div.openmark-resize-handle.right
    aside.openmark-panel-right   # Tabbed: Chat|Settings|Actions|Collab
    button.openmark-edit-toggle  # ✎ pencil
    button.openmark-right-toggle # ☰ hamburger
```

## Key Constraints

- **Mermaid is bundled in content.js** — runs in isolated world, no script injection. The `src/mermaid-bundle/` directory is legacy (unused).
- **ASCII-escape is required** for CWS submission — Unicode in bundled JS triggers rejection.
- **chrome.storage.sync** for settings, **chrome.storage.local** for panel widths/explorer state.
- **Auto-refresh** uses background service worker to proxy `file://` fetches (content scripts have null origin on file:// pages).
- **Directory listing** works by fetching `file:///dir/` and parsing Chrome's `addRow()` format from the HTML response.
- **AI chat** calls external APIs directly from content script — `host_permissions` in manifest grants access.
- **Editor renders** set `renderFromEditor = true` to prevent textarea value being overwritten during preview update.

## Version & Release Process

```bash
# 1. Edit package.json and public/manifest.json versions (must match)
# 2. Build
npm run build
# 3. Commit, push, tag
git add -A && git commit -m "v0.X.Y: description"
git push && git tag v0.X.Y && git push origin v0.X.Y
# 4. Create release zip from dist/
cd dist && zip -r ../openmark-v0.X.Y.zip .
# 5. Create GitHub release
gh release create v0.X.Y openmark-v0.X.Y.zip --title "v0.X.Y" --notes "..."
```

## File Patterns

- `vite.config.ts` — main content script build (IIFE)
- `vite.config.pages.ts` — background + popup + options (ES modules)
- `vite.config.mermaid.ts` — UNUSED legacy config
- `public/manifest.json` — Chrome extension manifest (source of truth for version)
- `scripts/ascii-escape-content.py` — post-build processor
- `test-files/` — manual QA markdown files

## Common Tasks

**Add a new right panel tab**: Edit `src/content/flyoutMenu.ts` → add to the `tabs` array.

**Add a new message type to background**: Edit `src/background/index.ts` → add handler in the `onMessage` listener.

**Change rendering behavior**: Edit `src/content/renderer.ts`. The `initRenderer()` function configures markdown-it with plugins.

**Modify layout**: Edit `src/content/layout.ts` for structure, `src/content/styles/main.css` for styling.

**Add a new setting**: Update `Settings` interface + `DEFAULT_SETTINGS` in `src/shared/types.ts`, then use via `getSettings()`.

## Backlog

### Cloud Upload (Google Drive / OneDrive / SharePoint)
**Goal**: One-click upload of current file (or exported HTML/DOCX) to cloud storage from the Actions tab.

**Technical approach**:
- Use `chrome.identity.launchWebAuthFlow` for OAuth2 (MV3 compatible)
- Upload via REST API after token acquisition:
  - Google Drive: `https://www.googleapis.com/upload/drive/v3/files`
  - OneDrive: `https://graph.microsoft.com/v1.0/me/drive/root:/{filename}:/content`
  - SharePoint: same Graph API, different drive endpoint

**Prerequisites before implementing**:
1. **Google**: Create OAuth 2.0 Client ID in GCP Console (type: Chrome App, bind to extension ID) → add `oauth2.client_id` + `oauth2.scopes` to manifest
2. **Microsoft**: Create App Registration in Azure Portal with scopes `Files.ReadWrite` + `Sites.ReadWrite.All` → same manifest oauth2 block

**UI**: Add "Upload to Cloud" section in Actions tab with three buttons: Google Drive / OneDrive / SharePoint. Auth token cached in `chrome.storage.local`, refresh on 401.

**CWS note**: Adding `identity` permission requires re-review. Plan for a separate release.

### Ecosystem Projects
- **openmark-clipper** (`seraphjiang/openmark-clipper`) — Webpage to Markdown clipper, companion to OpenMark
- **openjson** (`seraphjiang/openjson`) — JSON Viewer/Formatter, free alternative to paid JSON viewers
