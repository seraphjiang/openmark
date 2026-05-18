import { getSettings } from "../shared/storage";
import { initRenderer, renderMarkdown, renderMermaidDiagrams } from "./renderer";
import { generateToc } from "./toc";
import { initLightbox } from "./lightbox";
import { Settings } from "../shared/types";

function isMarkdownContent(): boolean {
  const contentType = document.contentType;

  if (contentType === "text/markdown" || contentType === "text/x-markdown") return true;

  // Already-rendered HTML (GitHub, GitLab, CMS platforms) — do not hijack
  if (contentType === "text/html") return false;

  const url = window.location.href;
  if (/\.(md|markdown)(\?.*)?$/i.test(url)) return true;

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

async function render(source: string): Promise<void> {
  if (!source.trim()) return;

  const settings = await getSettings();
  initRenderer(settings);

  const html = renderMarkdown(source);

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
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function readFileContent(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "FETCH_FILE", url }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.ok) {
        resolve(response.text);
      } else {
        reject(new Error(response?.error ?? "Unknown error"));
      }
    });
  });
}

function startAutoRefresh(interval: number): void {
  if (refreshTimer !== null) return;
  refreshTimer = setInterval(async () => {
    try {
      const text = await readFileContent(window.location.href);
      if (text !== lastContent) {
        lastContent = text;
        refreshTimer && clearInterval(refreshTimer);
        refreshTimer = null;
        await render(text);
      }
    } catch {
      // file may be temporarily unavailable during save
    }
  }, interval);
}

if (isMarkdownContent()) {
  if (window.location.protocol === "file:") {
    readFileContent(window.location.href).then((text) => {
      lastContent = text;
      render(text);
    }).catch(() => {
      const fallback = document.body.innerText || document.body.textContent || "";
      lastContent = fallback;
      render(fallback);
    });
  } else {
    const source = document.body.innerText || document.body.textContent || "";
    lastContent = source;
    render(source);
  }
}
