import { DirEntry } from "../shared/types";
import { getLocalState, saveLocalState } from "../shared/storage";

interface ExplorerState {
  rootUrl: string;
  expandedDirs: Set<string>;
  currentFile: string;
  onFileSelect: (fileUrl: string) => void;
}

let state: ExplorerState;
let treeContainer: HTMLElement;
let toolbarPathEl: HTMLElement;

function listDirectory(dirUrl: string): Promise<DirEntry[]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "LIST_DIRECTORY", url: dirUrl }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.ok) {
        resolve(response.entries);
      } else {
        reject(new Error(response?.error ?? "Unknown error"));
      }
    });
  });
}

export async function initExplorer(
  container: HTMLElement,
  rootUrl: string,
  currentFile: string,
  onFileSelect: (fileUrl: string) => void,
): Promise<void> {
  const localState = await getLocalState();
  state = {
    rootUrl,
    expandedDirs: new Set(localState.expandedDirs),
    currentFile,
    onFileSelect,
  };

  container.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.className = "explorer-toolbar";

  const upBtn = document.createElement("button");
  upBtn.className = "explorer-btn";
  upBtn.textContent = "↑";
  upBtn.title = "Go up one level";
  upBtn.addEventListener("click", navigateUp);

  const refreshBtn = document.createElement("button");
  refreshBtn.className = "explorer-btn";
  refreshBtn.textContent = "↻";
  refreshBtn.title = "Refresh";
  refreshBtn.addEventListener("click", refreshTree);

  const openBtn = document.createElement("button");
  openBtn.className = "explorer-btn";
  openBtn.textContent = "⌂";
  openBtn.title = "Set root folder (enter path)";
  openBtn.addEventListener("click", promptRootFolder);

  toolbarPathEl = document.createElement("span");
  toolbarPathEl.className = "explorer-path";
  toolbarPathEl.textContent = getDisplayPath(rootUrl);
  toolbarPathEl.title = rootUrl;

  toolbar.appendChild(upBtn);
  toolbar.appendChild(refreshBtn);
  toolbar.appendChild(openBtn);
  toolbar.appendChild(toolbarPathEl);

  treeContainer = document.createElement("div");
  treeContainer.className = "explorer-tree";

  container.appendChild(toolbar);
  container.appendChild(treeContainer);

  await renderTree();
}

export function setCurrentFile(fileUrl: string): void {
  if (state) {
    state.currentFile = fileUrl;
    updateActiveFile();
  }
}

function getDisplayPath(url: string): string {
  const path = decodeURIComponent(url.replace("file://", ""));
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 3) return "/" + parts.join("/");
  return ".../" + parts.slice(-2).join("/");
}

function getParentDir(url: string): string {
  const withoutTrailingSlash = url.endsWith("/") ? url.slice(0, -1) : url;
  const lastSlash = withoutTrailingSlash.lastIndexOf("/");
  return withoutTrailingSlash.slice(0, lastSlash + 1);
}

function updateToolbarPath(): void {
  toolbarPathEl.textContent = getDisplayPath(state.rootUrl);
  toolbarPathEl.title = state.rootUrl;
}

async function setRoot(newRoot: string): Promise<void> {
  if (!newRoot.endsWith("/")) newRoot += "/";
  state.rootUrl = newRoot;
  state.expandedDirs.clear();
  await saveLocalState({ explorerRoot: newRoot, expandedDirs: [] });
  updateToolbarPath();
  await renderTree();
}

async function navigateUp(): Promise<void> {
  const parent = getParentDir(state.rootUrl.endsWith("/") ? state.rootUrl.slice(0, -1) : state.rootUrl);
  if (parent === "file://" || parent === "file:///") return;
  await setRoot(parent);
}

async function refreshTree(): Promise<void> {
  await renderTree();
}

function promptRootFolder(): void {
  const current = decodeURIComponent(state.rootUrl.replace("file://", ""));
  const input = prompt("Enter folder path:", current);
  if (!input) return;
  let url = input.trim();
  if (!url.startsWith("file://")) {
    url = "file://" + (url.startsWith("/") ? "" : "/") + url;
  }
  if (!url.endsWith("/")) url += "/";
  setRoot(url);
}

async function renderTree(): Promise<void> {
  treeContainer.innerHTML = "";
  try {
    const entries = await listDirectory(state.rootUrl);
    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "explorer-error";
      empty.textContent = "Empty directory";
      treeContainer.appendChild(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const entry of entries) {
      fragment.appendChild(createEntryEl(entry, state.rootUrl));
    }
    treeContainer.appendChild(fragment);
  } catch (e: any) {
    const err = document.createElement("div");
    err.className = "explorer-error";
    err.textContent = "Failed to load: " + (e?.message || "unknown error");
    treeContainer.appendChild(err);
  }
}

function createEntryEl(entry: DirEntry, parentUrl: string): HTMLElement {
  const item = document.createElement("div");
  item.className = "explorer-item" + (entry.isDirectory ? " folder" : " file");

  const fullUrl = parentUrl + (parentUrl.endsWith("/") ? "" : "/") + encodeURIComponent(entry.name) + (entry.isDirectory ? "/" : "");

  const icon = document.createElement("span");
  icon.className = "explorer-icon";
  icon.textContent = entry.isDirectory ? "\u{1F4C1}" : "\u{1F4C4}";

  const name = document.createElement("span");
  name.className = "explorer-name";
  name.textContent = entry.name;

  item.appendChild(icon);
  item.appendChild(name);

  if (entry.isDirectory) {
    const isExpanded = state.expandedDirs.has(fullUrl);
    if (isExpanded) item.classList.add("expanded");

    const children = document.createElement("div");
    children.className = "explorer-children";
    if (!isExpanded) children.style.display = "none";

    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      const expanded = state.expandedDirs.has(fullUrl);
      if (expanded) {
        state.expandedDirs.delete(fullUrl);
        item.classList.remove("expanded");
        children.style.display = "none";
      } else {
        state.expandedDirs.add(fullUrl);
        item.classList.add("expanded");
        children.style.display = "";
        // Always refresh children on expand
        children.innerHTML = "";
        try {
          const entries = await listDirectory(fullUrl);
          for (const child of entries) {
            children.appendChild(createEntryEl(child, fullUrl));
          }
        } catch {
          const err = document.createElement("div");
          err.className = "explorer-error";
          err.textContent = "Failed to load";
          children.appendChild(err);
        }
      }
      saveLocalState({ expandedDirs: Array.from(state.expandedDirs) });
    });

    item.appendChild(children);
    if (isExpanded) {
      listDirectory(fullUrl).then((entries) => {
        for (const child of entries) {
          children.appendChild(createEntryEl(child, fullUrl));
        }
      }).catch(() => {
        const err = document.createElement("div");
        err.className = "explorer-error";
        err.textContent = "Failed to load";
        children.appendChild(err);
      });
    }
  } else {
    const isMarkdown = /\.(md|markdown)$/i.test(entry.name);
    if (isMarkdown) {
      item.classList.add("markdown");
      if (fullUrl === state.currentFile) {
        item.classList.add("active");
      }
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        state.currentFile = fullUrl;
        updateActiveFile();
        state.onFileSelect(fullUrl);
      });
    }
  }

  return item;
}

function updateActiveFile(): void {
  treeContainer.querySelectorAll(".explorer-item.active").forEach((el) => {
    el.classList.remove("active");
  });
}
