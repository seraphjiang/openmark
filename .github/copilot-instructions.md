# Copilot Instructions for OpenMark

## Project Context

OpenMark is a Chrome Manifest V3 extension that renders markdown files in-browser. The content script replaces the entire page body with a three-panel layout (file explorer | rendered content + editor | settings/chat panel).

## Build & Test

```bash
npm run build    # Full build (tsc → vite → ascii-escape → pages)
npx tsc --noEmit # Type-check only
```

No test framework. Manual testing: load `dist/` as unpacked extension, open a `.md` file.

## Architecture Quick Reference

- **Content script** (`src/content/`): Single IIFE bundle. Entry: `index.ts`. Bundles mermaid, highlight.js, katex.
- **Background worker** (`src/background/index.ts`): Proxies `file://` fetches and directory listings.
- **Shared** (`src/shared/`): Types and storage helpers.

## Code Style

- TypeScript strict mode, no `any` except markdown-it plugin internals
- No comments unless explaining a non-obvious workaround
- DOM manipulation via `createElement` + properties (never `innerHTML` with user data — XSS risk)
- All state persisted via `chrome.storage.sync` (settings) or `chrome.storage.local` (UI state)

## Key Rules

1. Never use `innerHTML` with interpolated user content (headings, file names, etc.)
2. Mermaid is bundled in content.js — do NOT add it as external or inject scripts
3. The ASCII-escape post-build step is mandatory for Chrome Web Store
4. `package.json` version and `public/manifest.json` version must always match
5. File explorer uses Chrome's `addRow()` HTML format from directory fetch responses
6. Editor re-renders must set `renderFromEditor = true` to preserve cursor position
7. Keep `host_permissions` in manifest updated if adding new external API integrations
