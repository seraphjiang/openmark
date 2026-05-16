# Privacy Policy

**Last updated:** May 16, 2026

## Overview

OpenMark is a browser extension that renders Markdown files into formatted documents. It is designed with privacy as a core principle.

## Data Collection

OpenMark does **not** collect, transmit, or store any personal data. Specifically:

- **No analytics or tracking** — no usage data is collected
- **No network requests** — all Markdown rendering happens locally in your browser
- **No third-party services** — no data is sent to external servers
- **No cookies** — the extension does not use cookies

## Data Storage

The extension uses `chrome.storage.sync` solely to persist your display preferences (theme, font size, line height, etc.) across sessions. This data:

- Contains no personal information
- Is stored locally in your browser's extension storage
- Syncs across your devices only if you are signed into Chrome with sync enabled
- Can be cleared at any time by uninstalling the extension

## Permissions

- **activeTab**: Used to render Markdown content on the current page when activated
- **storage**: Used to save your display preferences
- **host_permissions (file:// and *.md URLs)**: Used to access Markdown files for rendering — no content is read beyond what is displayed to you

## File Access

When you grant the extension access to local files (`file://` URLs), it reads the Markdown content solely to render it in your browser. File contents are never transmitted anywhere.

## Changes

If this policy changes, updates will be posted to this page and reflected in the extension's repository.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/seraphjiang/openmark/issues
