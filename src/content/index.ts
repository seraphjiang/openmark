import { getSettings, getLocalState, saveLocalState } from "../shared/storage";
import { initRenderer, renderMarkdown, renderMermaidDiagrams } from "./renderer";
import { generateToc } from "./toc";
import { initLightbox } from "./lightbox";
import { createLayout, LayoutElements } from "./layout";
import { initResizer } from "./resizer";
import { initExplorer, setCurrentFile } from "./fileExplorer";
import { initFlyout } from "./flyoutMenu";
import { Settings } from "../shared/types";

function isMarkdownContent(): boolean {
  const contentType = document.contentType;

  if (contentType === "text/markdown" || contentType === "text/x-markdown") return true;

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

let layout: LayoutElements;
let lastContent = "";
let currentFileUrl = "";
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let currentSettings: Settings;
const isLocal = typeof window !== "undefined" && window.location.protocol === "file:";

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

async function renderContent(source: string, settings: Settings): Promise<void> {
  if (!source.trim()) return;

  initRenderer(settings);
  const html = renderMarkdown(source);

  const content = document.createElement("article");
  content.className = "openmark-content";
  content.innerHTML = html;

  layout.center.innerHTML = "";
  layout.center.appendChild(content);

  if (settings.enableMermaid) {
    await renderMermaidDiagrams();
  }

  initLightbox(content);

  // Rebuild TOC
  layout.left.innerHTML = "";
  if (settings.showToc) {
    const toc = generateToc(content);
    layout.left.appendChild(toc);
    layout.left.style.display = "";
    layout.leftHandle.style.display = "";
  } else {
    layout.left.style.display = "none";
    layout.leftHandle.style.display = "none";
  }
}

function getParentDir(url: string): string {
  const cleanUrl = url.split("#")[0].split("?")[0];
  const lastSlash = cleanUrl.lastIndexOf("/");
  return cleanUrl.slice(0, lastSlash + 1);
}

async function onFileSelect(fileUrl: string): Promise<void> {
  try {
    const text = await readFileContent(fileUrl);
    lastContent = text;
    currentFileUrl = fileUrl;
    setCurrentFile(fileUrl);
    await renderContent(text, currentSettings);
    restartAutoRefresh();
  } catch {
    // file may not be readable
  }
}

function restartAutoRefresh(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (isLocal && currentSettings.autoRefresh) {
    startAutoRefresh(currentSettings.refreshInterval);
  }
}

function startAutoRefresh(interval: number): void {
  if (refreshTimer !== null) return;
  refreshTimer = setInterval(async () => {
    try {
      const text = await readFileContent(currentFileUrl);
      if (text !== lastContent) {
        lastContent = text;
        refreshTimer && clearInterval(refreshTimer);
        refreshTimer = null;
        await renderContent(text, currentSettings);
        restartAutoRefresh();
      }
    } catch {
      // file may be temporarily unavailable during save
    }
  }, interval);
}

async function onSettingsChange(): Promise<void> {
  currentSettings = await getSettings();
  applySettings(currentSettings);
  await renderContent(lastContent, currentSettings);
}

async function init(): Promise<void> {
  currentSettings = await getSettings();
  const localState = await getLocalState();
  currentFileUrl = window.location.href;

  // Build layout
  layout = createLayout(isLocal && currentSettings.showExplorer);

  document.body.innerHTML = "";
  document.body.className = "openmark-body";
  applySettings(currentSettings);
  document.body.appendChild(layout.root);

  // Apply saved panel widths
  layout.left.style.width = localState.tocWidth + "px";
  if (isLocal && currentSettings.showExplorer) {
    layout.right.style.width = localState.explorerWidth + "px";
  }

  // Get initial content
  let source: string;
  if (isLocal) {
    try {
      source = await readFileContent(currentFileUrl);
    } catch {
      source = document.body.innerText || document.body.textContent || "";
    }
  } else {
    source = document.body.innerText || document.body.textContent || "";
  }
  lastContent = source;

  // Render content
  await renderContent(source, currentSettings);

  // Init file explorer (file:// only)
  if (isLocal && currentSettings.showExplorer) {
    const rootUrl = localState.explorerRoot || getParentDir(currentFileUrl);
    await saveLocalState({ explorerRoot: rootUrl });
    await initExplorer(layout.right, rootUrl, currentFileUrl, onFileSelect);
  }

  // Init flyout menu
  initFlyout(layout.flyout, currentSettings, onSettingsChange);

  // Init resizers
  if (currentSettings.showToc) {
    initResizer(layout.leftHandle, layout.left, "left", "tocWidth");
  }
  if (isLocal && currentSettings.showExplorer) {
    initResizer(layout.rightHandle, layout.right, "right", "explorerWidth");
  }

  // Auto-refresh (file:// only)
  if (isLocal && currentSettings.autoRefresh) {
    startAutoRefresh(currentSettings.refreshInterval);
  }
}

if (isMarkdownContent()) {
  // Save original text before DOM manipulation for non-file pages
  const originalText = document.body.innerText || document.body.textContent || "";
  if (!isLocal) {
    lastContent = originalText;
  }
  init();
}
