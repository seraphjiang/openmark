import { DirEntry } from "../shared/types";
import { getLocalState, saveLocalState } from "../shared/storage";

interface ExplorerState {
  rootUrl: string;
  expandedDirs: Set<string>;
  entriesCache: Map<string, DirEntry[]>;
  currentFile: string;
  onFileSelect: (fileUrl: string) => void;
}

let state: ExplorerState;
let treeContainer: HTMLElement;

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
    entriesCache: new Map(),
    currentFile,
    onFileSelect,
  };

  const toolbar = document.createElement("div");
  toolbar.className = "explorer-toolbar";

  const upBtn = document.createElement("button");
  upBtn.className = "explorer-up";
  upBtn.textContent = "↑ Up";
  upBtn.title = "Go up one level";
  upBtn.addEventListener("click", navigateUp);

  const pathEl = document.createElement("span");
  pathEl.className = "explorer-path";
  pathEl.textContent = getDisplayPath(rootUrl);
  pathEl.title = rootUrl;

  toolbar.appendChild(upBtn);
  toolbar.appendChild(pathEl);

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
  const path = url.replace("file://", "");
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 3) return "/" + parts.join("/");
  return ".../" + parts.slice(-2).join("/");
}

function getParentDir(url: string): string {
  const withoutTrailingSlash = url.endsWith("/") ? url.slice(0, -1) : url;
  const lastSlash = withoutTrailingSlash.lastIndexOf("/");
  return withoutTrailingSlash.slice(0, lastSlash + 1);
}

async function navigateUp(): Promise<void> {
  const parent = getParentDir(state.rootUrl.endsWith("/") ? state.rootUrl.slice(0, -1) : state.rootUrl);
  if (parent === "file://" || parent === "file:///") return;
  state.rootUrl = parent;
  await saveLocalState({ explorerRoot: parent });
  const pathEl = treeContainer.parentElement?.querySelector(".explorer-path");
  if (pathEl) {
    pathEl.textContent = getDisplayPath(parent);
    pathEl.setAttribute("title", parent);
  }
  await renderTree();
}

async function renderTree(): Promise<void> {
  treeContainer.innerHTML = "";
  const entries = await loadEntries(state.rootUrl);
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    fragment.appendChild(createEntryEl(entry, state.rootUrl));
  }
  treeContainer.appendChild(fragment);
}

async function loadEntries(dirUrl: string): Promise<DirEntry[]> {
  if (state.entriesCache.has(dirUrl)) {
    return state.entriesCache.get(dirUrl)!;
  }
  const entries = await listDirectory(dirUrl);
  state.entriesCache.set(dirUrl, entries);
  return entries;
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
        if (children.children.length === 0) {
          const entries = await loadEntries(fullUrl);
          for (const child of entries) {
            children.appendChild(createEntryEl(child, fullUrl));
          }
        }
      }
      saveLocalState({ expandedDirs: Array.from(state.expandedDirs) });
    });

    item.appendChild(children);
    if (isExpanded) {
      loadEntries(fullUrl).then((entries) => {
        for (const child of entries) {
          children.appendChild(createEntryEl(child, fullUrl));
        }
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
  // Can't easily find the active one by URL in the DOM, so re-render is simplest
  // but for performance, we just let the next click handle it
}
