# OpenMark Features

## Markdown Rendering

- **Full Markdown Support** — headings, lists, tables, blockquotes, horizontal rules, links, images, inline/block code
- **Syntax Highlighting** — 180+ languages via highlight.js with automatic language detection
- **Mermaid Diagrams** — flowcharts, sequence diagrams, Gantt charts, class diagrams, state diagrams, pie charts, and more
- **LaTeX Math** — inline (`$...$`) and block (`$$...$$`) equations via KaTeX
- **HTML Pass-through** — raw HTML in markdown is rendered as-is

## Layout

- **Three-Panel Design** — left panel, center content, right panel
- **Left Panel** (file:// mode):
  - File explorer (top section) — browse directories, click `.md` files to render
  - Document outline/TOC (bottom section) — auto-generated from headings with scroll spy
  - Draggable vertical split handle between sections
- **Left Panel** (remote mode):
  - Document outline/TOC only
- **Center Panel**:
  - Preview (top) — rendered markdown content
  - Editor (bottom, toggleable) — live markdown editor with real-time preview
  - Draggable horizontal split handle between preview and editor
- **Right Panel** (all modes, toggleable):
  - Tabbed interface: Chat | Settings | Actions | Collab
  - Toggle button (☰) on right edge to show/hide
- **Resizable Panels** — drag handles between all panels, widths persisted across sessions

## File Explorer (file:// mode only)

- Browse local directory tree
- Click any `.md`/`.markdown` file to render it in-place (SPA-style, no page reload)
- Toolbar buttons:
  - **↑ Up** — navigate to parent directory
  - **↻ Refresh** — reload current directory listing
  - **⌂ Set Root** — enter an arbitrary folder path as root
- Lazy-loads subdirectories on expand
- Remembers expanded folders across sessions
- Always fetches fresh listings (no stale cache)

## Editor Mode

- Toggle with pencil button (✎) on right edge
- Split view: preview (top) + markdown editor (bottom)
- Live preview updates as you type (500ms debounce)
- Preserves cursor position and scroll during re-renders
- Resizable split between preview and editor
- Monospace font, syntax-aware tab size

## AI Chat

- Chat about the current document with AI
- Document content automatically sent as context
- Supported providers:
  - **OpenAI** — GPT-4o Mini, GPT-4o, GPT-4.1 Mini, GPT-4.1
  - **Google Gemini** — Gemini 2.0 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash
  - **DeepSeek** — DeepSeek Chat, DeepSeek Reasoner
- User configures their own API keys (stored locally, never transmitted elsewhere)
- Collapsible settings panel for provider/model/key configuration
- Enter to send, Shift+Enter for newline

## Export

- **Export HTML** — downloads a standalone HTML file with inline styles
- **Export PDF** — uses browser print dialog with print-optimized CSS (hides all UI chrome)
- **Copy HTML** — copies rendered HTML to clipboard

## Settings (right panel "Settings" tab)

- **Theme** — Light, Dark, Auto (follows system preference)
- **Font Family** — System Default, Inter, Georgia, JetBrains Mono
- **Font Size** — 12–24px slider
- **Line Height** — 1.2–2.0
- **Max Width** — 600–1400px
- **Table of Contents** — toggle on/off
- **Mermaid Diagrams** — toggle on/off
- **LaTeX Math** — toggle on/off
- All settings persist via `chrome.storage.sync`

## Collaborate (right panel "Collab" tab)

- **Bookmarks** — bookmark pages for quick access, persisted in localStorage
- **Comments** — add per-page comments with timestamps, persisted in localStorage

## Auto-Refresh (file:// mode only)

- Polls the file for changes every second (configurable)
- Re-renders automatically when file is saved externally
- Uses background service worker to proxy file:// fetches (CORS workaround)

## Image Lightbox

- Click any image to view full-screen overlay
- Click overlay or press Escape to close

## Themes

- Light and Dark themes with full CSS variable system
- Auto mode follows system `prefers-color-scheme`
- Dark theme: GitHub-style dark colors

## Browser Support

- Chrome, Edge, and all Chromium-based browsers
- Manifest V3
- Works on both `file://` local files and remote raw markdown URLs
- Skips already-rendered HTML pages (GitHub, GitLab, CMS platforms)

## Privacy

- All rendering happens locally — no data leaves your browser
- AI chat: data sent only to the provider you configure (your own API key)
- No analytics, no tracking, no external requests except user-configured AI providers
