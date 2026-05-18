# Changelog

## v0.1.13

### Documentation
- Added comprehensive [FEATURES.md](FEATURES.md) — complete feature reference
- Added [CHANGELOG.md](CHANGELOG.md) — version history
- Rewrote [CLAUDE.md](../CLAUDE.md) — updated for current architecture (no more mermaid-bundle)
- Added [.cursorrules](../.cursorrules) — Cursor AI agent instructions
- Added [.github/copilot-instructions.md](../.github/copilot-instructions.md) — GitHub Copilot instructions
- Updated [README.md](../README.md) — full developer docs, project structure, architecture decisions

---

## v0.1.12

### New Features
- **AI Chat** — Chat tab in right panel to ask questions about the current document. Supports OpenAI (GPT-4o/4.1), Google Gemini (2.0/2.5), DeepSeek (Chat/Reasoner). Users provide their own API keys.
- **Editor Mode** — Pencil button (✎) toggles a split view with markdown editor below the preview. Live preview updates with 500ms debounce. Cursor and scroll position preserved.

### Improvements
- File explorer parses Chrome's `addRow()` directory listing format (works on Windows/Mac/Linux)
- File explorer shows error messages instead of blank tree on failure
- Preview scroll position preserved across re-renders

---

## v0.1.10

### New Features
- **Redesigned left panel** — Two sections: file explorer (top) + document outline/TOC (bottom) with draggable vertical split
- **Tabbed right panel** — Replaced flyout with proper panel. Tabs: Settings, Actions, Collab
- **Collaborate tab** — Bookmarks and per-page comments (persisted in localStorage)
- **Right panel toggle** — ☰ button on right edge to show/hide (bidirectional)
- **Right panel resizable** — drag handle works for both show/hide

### Improvements
- File explorer: refresh button, set root folder button, always-fresh directory listings
- File explorer: navigate up properly re-fetches tree

---

## v0.1.9

### New Features
- **File Explorer** — Right sidebar for browsing local directories. Click `.md` files to render in-place without page reload.
- **Flyout Menu** — Right-edge tab with export HTML, export PDF, page settings.
- **Resizable Panels** — Drag handles between TOC/content/explorer. Widths persisted.
- **Three-panel layout** — [TOC] [Content] [File Explorer]
- **Export HTML** — Downloads standalone HTML with inline styles.
- **Export PDF** — Browser print dialog with print-optimized CSS.

### Improvements
- Remote mode: no right sidebar (file explorer is local-only)
- Print CSS hides all UI chrome
- Responsive: sidebars hidden on narrow viewports

---

## v0.1.8

### Changes
- **Mermaid bundled into content script** — No longer injected as a separate script into the page's main world. Works on sandboxed remote pages (e.g., raw.githubusercontent.com) where script injection was blocked by CSP.
- **Auto-refresh loop fixed** — file:// pages fetch raw content via background proxy on initial load, ensuring change detection works correctly.

### Removed
- `mermaid-bundle.js` (no longer needed)
- `web_accessible_resources` manifest entry

---

## v0.1.7

### Fixes
- Removed stale `external: ["mermaid"]` from vite config that left an undefined global reference, causing `Cannot read properties of undefined (reading 'initialize')`.

---

## v0.1.6

### Security Fixes
- **XSS in TOC** — Heading text no longer injected via innerHTML; uses createElement + textContent.
- **XSS in lightbox** — Image src/alt no longer interpolated into HTML; uses createElement.
- **Unrestricted file:// proxy** — Background now validates sender.id and file:// scheme.
- **Mermaid isolated world crash** — Fixed communication between content script (isolated world) and mermaid bundle (main world) via CustomEvents.

### Bug Fixes
- **Auto-refresh interval stacking** — Timer guarded and cleared before re-render.
- **Lightbox keydown leak** — Listener always removed on close.
- **HTML page hijacking** — Skip pages served as text/html (GitHub, GitLab, CMS).
- **Duplicate heading IDs** — Suffixed with counter for uniqueness.
- **Scroll spy selector injection** — Uses CSS.escape().

---

## v0.1.5

### Fixes
- CSP + file:// CORS + mermaid loading fixes
- Content script: IIFE + CDN mermaid + ASCII-escape post-build
- web_accessible_resources match pattern fix

---

## v0.1.1

### Fixes
- Chrome Web Store packaging: IIFE content script, no dynamic imports
- CWS encoding error: split mermaid into separate chunk

---

## v0.1.0

### Initial Release
- Markdown rendering with markdown-it
- Syntax highlighting (highlight.js, 180+ languages)
- Mermaid diagram support
- LaTeX math via KaTeX
- Auto-generated Table of Contents with scroll spy
- Image lightbox
- Light/Dark/Auto themes
- Customizable font, size, line height, max width
- Auto-refresh for local files
- Privacy-first: all rendering local
