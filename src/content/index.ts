import { getSettings, getLocalState, saveLocalState } from "../shared/storage";
import { initRenderer, renderMarkdown, renderMermaidDiagrams } from "./renderer";
import { generateToc } from "./toc";
import { initLightbox } from "./lightbox";
import { createLayout, LayoutElements } from "./layout";
import { initResizer } from "./resizer";
import { initExplorer, setCurrentFile } from "./fileExplorer";
import { initRightPanel } from "./flyoutMenu";
import { startPresentation } from "./presentation";
import { Settings } from "../shared/types";

function isMarkdownContent(): boolean {
  const contentType = document.contentType;

  if (contentType === "text/markdown" || contentType === "text/x-markdown") return true;

  if (contentType === "text/html") return false;

  const url = window.location.href;
  if (/\.(md|markdown)(\?.*)?$/i.test(url)) return true;

  return false;
}

function getThemeValue(theme: Settings["theme"]): string {
  if (theme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function computeReadingStats(source: string): { words: number; minutes: number } {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

let rawVisible = false;
let statsBar: HTMLElement | null = null;

function updateStatsBar(source: string): void {
  if (!statsBar) return;
  const { words, minutes } = computeReadingStats(source);
  statsBar.textContent = `${words.toLocaleString()} words · ${minutes} min read`;
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
let editorActive = false;
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

let renderFromEditor = false;

async function renderContent(source: string, settings: Settings): Promise<void> {
  if (!source.trim()) return;

  initRenderer(settings);
  const html = renderMarkdown(source);

  // Preserve preview scroll position
  const scrollTop = layout.centerPreview.scrollTop;

  const content = document.createElement("article");
  content.className = "openmark-content";
  content.innerHTML = html;

  layout.centerPreview.innerHTML = "";
  layout.centerPreview.appendChild(content);

  // Restore scroll position
  layout.centerPreview.scrollTop = scrollTop;

  if (settings.enableMermaid) {
    await renderMermaidDiagrams();
  }

  initLightbox(content);
  addCodeCopyButtons(content);

  // Rebuild outline/TOC in left panel
  layout.leftOutline.innerHTML = "";
  if (settings.showToc) {
    const toc = generateToc(content);
    layout.leftOutline.appendChild(toc);
  }

  // Update word count / reading time
  updateStatsBar(source);

  // Only sync editor textarea when change came from outside (file refresh, file select)
  if (!renderFromEditor) {
    const editorTextarea = layout.centerEditor.querySelector<HTMLTextAreaElement>(".editor-textarea");
    if (editorTextarea && editorTextarea.value !== source) {
      editorTextarea.value = source;
    }
  }
  renderFromEditor = false;
}

function addCodeCopyButtons(container: HTMLElement): void {
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".om-copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "om-copy-btn";
    btn.textContent = "Copy";
    btn.title = "Copy code";
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      const text = code?.innerText ?? pre.innerText;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });
    pre.style.position = "relative";
    pre.appendChild(btn);
  });
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
    (window as any).__openmarkLastContent = text;
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
    if (editorActive) return;
    try {
      const text = await readFileContent(currentFileUrl);
      if (text !== lastContent) {
        lastContent = text;
        (window as any).__openmarkLastContent = text;
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

function initEditor(source: string): void {
  layout.centerEditor.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";

  const saveBtn = document.createElement("button");
  saveBtn.className = "editor-save-btn";
  saveBtn.textContent = "Save";
  saveBtn.title = "Save to file (Ctrl+S)";
  saveBtn.addEventListener("click", saveFile);

  const status = document.createElement("span");
  status.className = "editor-status";
  toolbar.appendChild(saveBtn);
  toolbar.appendChild(status);

  const textarea = document.createElement("textarea");
  textarea.className = "editor-textarea";
  textarea.value = source;
  textarea.spellcheck = false;

  textarea.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveFile();
    }
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  textarea.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      lastContent = textarea.value;
      renderFromEditor = true;
      await renderContent(textarea.value, currentSettings);
    }, 500);
  });

  layout.centerEditor.appendChild(toolbar);
  layout.centerEditor.appendChild(textarea);
}

function saveFile(): void {
  const textarea = layout.centerEditor.querySelector<HTMLTextAreaElement>(".editor-textarea");
  const status = layout.centerEditor.querySelector<HTMLElement>(".editor-status");
  if (!textarea) return;

  const content = textarea.value;
  lastContent = content;

  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = currentFileUrl.split("/").pop() || "document.md";
  a.download = decodeURIComponent(fileName);
  a.click();
  URL.revokeObjectURL(url);

  if (status) {
    status.textContent = "Downloaded";
    setTimeout(() => { status.textContent = ""; }, 1500);
  }
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

  // Save original text before we replace DOM
  const originalText = document.body.innerText || document.body.textContent || "";

  // Build layout
  layout = createLayout(isLocal);

  document.body.innerHTML = "";
  document.body.className = "openmark-body";
  applySettings(currentSettings);
  document.body.appendChild(layout.root);

  // Stats bar (word count + reading time)
  statsBar = document.createElement("div");
  statsBar.className = "om-stats-bar";
  document.body.appendChild(statsBar);

  // Reading progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "om-progress-bar";
  document.body.appendChild(progressBar);
  layout.centerPreview.addEventListener("scroll", () => {
    const el = layout.centerPreview;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
    progressBar.style.width = pct + "%";
  });

  // Apply saved panel widths
  if (isLocal) {
    layout.left.style.width = localState.tocWidth + "px";
  }
  layout.right.style.width = localState.explorerWidth + "px";

  // Get initial content
  let source: string;
  if (isLocal) {
    try {
      source = await readFileContent(currentFileUrl);
    } catch {
      source = originalText;
    }
  } else {
    source = originalText;
  }
  lastContent = source;
  (window as any).__openmarkLastContent = source;

  // Render content
  await renderContent(source, currentSettings);

  // Init file explorer in left panel (file:// only)
  if (isLocal) {
    const rootUrl = localState.explorerRoot || getParentDir(currentFileUrl);
    await saveLocalState({ explorerRoot: rootUrl });
    await initExplorer(layout.leftExplorer, rootUrl, currentFileUrl, onFileSelect);
  } else {
    // For remote: left panel is just the TOC, hide explorer section
    layout.leftExplorer.style.display = "none";
    layout.leftSplitHandle.style.display = "none";
  }

  // Init editor
  initEditor(source);

  // Track editor state to pause auto-refresh
  layout.editToggle.addEventListener("click", () => {
    editorActive = !editorActive;
  });

  // Init right panel (tabbed menu)
  initRightPanel(layout.right, currentSettings, onSettingsChange);

  // Init resizers
  if (isLocal) {
    initResizer(layout.leftHandle, layout.left, "left", "tocWidth");
  }
  initResizer(layout.rightHandle, layout.right, "right", "explorerWidth");

  // Auto-refresh (file:// only)
  if (isLocal && currentSettings.autoRefresh) {
    startAutoRefresh(currentSettings.refreshInterval);
  }

  // Expose lastContent for presentation module
  (window as any).__openmarkLastContent = "";

  // Global keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+Shift+M: toggle RAW view
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "M") {
      e.preventDefault();
      rawVisible = !rawVisible;
      if (rawVisible) {
        layout.centerPreview.innerHTML = "";
        const pre = document.createElement("pre");
        pre.className = "om-raw-view";
        pre.textContent = lastContent;
        layout.centerPreview.appendChild(pre);
      } else {
        renderContent(lastContent, currentSettings);
      }
    }
    // Ctrl+Shift+P: presentation mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
      e.preventDefault();
      startPresentation();
    }
  });
}

if (isMarkdownContent()) {
  init();
}
