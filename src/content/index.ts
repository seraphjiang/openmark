import { getSettings } from "../shared/storage";
import { initRenderer, renderMarkdown, renderMermaidDiagrams } from "./renderer";
import { generateToc } from "./toc";
import { initLightbox } from "./lightbox";
import { Settings } from "../shared/types";

function isMarkdownContent(): boolean {
  const url = window.location.href;
  if (/\.(md|markdown)(\?.*)?$/i.test(url)) return true;

  const contentType = document.contentType;
  if (contentType === "text/markdown" || contentType === "text/x-markdown") return true;

  return false;
}

function getThemeValue(theme: Settings["theme"]): "light" | "dark" {
  if (theme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applySettings(settings: Settings): void {
  const root = document.documentElement;
  root.style.setProperty("--om-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--om-line-height", String(settings.lineHeight));
  root.style.setProperty("--om-max-width", `${settings.maxWidth}px`);
  root.style.setProperty("--om-font", settings.fontFamily);
  root.dataset.theme = getThemeValue(settings.theme);
}

async function render(): Promise<void> {
  const settings = await getSettings();
  initRenderer(settings);

  const rawText = document.body.innerText || document.body.textContent || "";
  if (!rawText.trim()) return;

  const html = renderMarkdown(rawText);

  document.body.className = "openmark-body";
  applySettings(settings);

  const content = document.createElement("article");
  content.className = "openmark-content";
  content.innerHTML = html;

  document.body.innerHTML = "";

  if (settings.showToc) {
    const toc = generateToc(content);
    document.body.appendChild(toc);
  }

  document.body.appendChild(content);

  if (settings.enableMermaid) {
    await renderMermaidDiagrams();
  }

  initLightbox(content);

  if (settings.autoRefresh && window.location.protocol === "file:") {
    startAutoRefresh(settings.refreshInterval);
  }
}

let lastContent = "";
function readFileContent(url: string): Promise<string> {
  // fetch() is blocked by CORS on file:// origins; XHR works fine.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = reject;
    xhr.send();
  });
}

function startAutoRefresh(interval: number): void {
  setInterval(async () => {
    try {
      const text = await readFileContent(window.location.href);
      if (text !== lastContent) {
        lastContent = text;
        await render();
      }
    } catch {
      // file may be temporarily unavailable during save
    }
  }, interval);
}

if (isMarkdownContent()) {
  lastContent = document.body.innerText || "";
  render();
}
