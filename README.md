# OpenMark

Open-source Markdown viewer browser extension for Chrome, Edge, and Chromium-based browsers. Renders `.md` files into beautifully formatted documents directly in your browser.

## Features

- **Syntax Highlighting** — 180+ languages via highlight.js
- **Mermaid Diagrams** — flowcharts, sequence diagrams, Gantt charts
- **LaTeX Math** — inline and block equations via KaTeX
- **Table of Contents** — auto-generated with scroll spy
- **Image Lightbox** — click to view full-screen
- **Live Preview** — auto-refresh as you edit local files
- **Themes** — light, dark, and auto (follows system)
- **Customizable** — font family, size, line height, max width
- **Privacy** — all rendering happens locally, no data leaves your browser

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
npm run dev    # watch mode — rebuilds on file changes
```

After each rebuild, click the reload button on `chrome://extensions/`.

## Build for Distribution

```bash
npm run build
cd dist && zip -r ../openmark.zip .
```

Upload `openmark.zip` to:
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Edge Add-ons Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/)

## Tech Stack

- TypeScript + Vite
- Manifest V3
- markdown-it (parsing)
- highlight.js (syntax highlighting)
- mermaid (diagrams)
- KaTeX (math rendering)

## License

MIT
