# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

OpenMark is a Chrome/Edge Manifest V3 browser extension that renders `.md`/`.markdown` files into formatted documents directly in the browser. It supports syntax highlighting (highlight.js), Mermaid diagrams, LaTeX math (KaTeX), table of contents, image lightbox, and live auto-refresh for local files.

## Build Commands

```bash
npm run build    # Full production build (typecheck + 3 vite builds + ascii-escape post-process)
npm run dev      # Watch mode — rebuilds content script on file changes
```

There are no test or lint commands configured.

After building, load `dist/` as an unpacked extension in `chrome://extensions/` (Developer mode).

## Build Pipeline

The build is a multi-stage process (`npm run build` runs all sequentially):

1. `tsc --noEmit` — type-check only, no output
2. `vite build` — builds `src/content/index.ts` → `dist/content.js` (IIFE format); copies static assets from `public/` and HTML files
3. `vite build --config vite.config.mermaid.ts` — builds `src/mermaid-bundle/index.ts` → `dist/mermaid-bundle.js` (IIFE, bundles full mermaid library)
4. `python3 scripts/ascii-escape-content.py` — converts non-ASCII chars to `\uXXXX` escapes in `content.js` and `mermaid-bundle.js` (avoids Chrome Web Store UTF-8 encoding false positives)
5. `vite build --config vite.config.pages.ts` — builds background, popup, and options pages as ES modules

The first vite build (`emptyOutDir: true`) cleans `dist/`; subsequent builds append (`emptyOutDir: false`).

## Architecture

**Content script** (`src/content/`) — the core rendering pipeline. Injected into pages matching `*.md`/`*.markdown`. Detects markdown content, parses it with markdown-it (with custom KaTeX and Mermaid plugins added inline in `renderer.ts`), replaces the page body with rendered HTML, and sets up auto-refresh polling for `file://` URLs.

**Background service worker** (`src/background/index.ts`) — handles extension install, action click (manual script injection), and proxies `file://` fetch requests from content scripts (content scripts on `file://` pages have null origin and can't fetch directly).

**Mermaid bundle** (`src/mermaid-bundle/`) — separate IIFE that bundles the entire mermaid library. Injected at runtime via `chrome.runtime.getURL()` as a `<script>` tag to satisfy CSP (chrome-extension:// origin is always allowed). Kept separate to avoid CWS encoding issues.

**Popup** (`src/popup/`) — extension toolbar popup UI.

**Options** (`src/options/`) — extension settings page.

**Shared** (`src/shared/`) — `types.ts` defines the `Settings` interface and defaults; `storage.ts` handles `chrome.storage.sync` access.

## Key Constraints

- Mermaid is **excluded** from the main content script bundle (`external: ["mermaid"]` in vite.config.ts) and loaded as a separate web-accessible resource at runtime.
- The ASCII-escape post-build step is required for Chrome Web Store submission — without it, Unicode literals in bundled code trigger rejection.
- The extension uses `chrome.storage.sync` for settings persistence.
- Auto-refresh for local files works by messaging the background service worker to fetch the file (workaround for file:// CORS restrictions).
