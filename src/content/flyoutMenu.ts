import { Settings } from "../shared/types";
import { saveSettings } from "../shared/storage";

export function initRightPanel(
  container: HTMLElement,
  settings: Settings,
  onSettingsChange: () => void,
): void {
  container.innerHTML = "";

  // Tab bar
  const tabBar = document.createElement("div");
  tabBar.className = "right-tab-bar";

  const tabs: { id: string; label: string; content: HTMLElement }[] = [
    { id: "settings", label: "Settings", content: createSettingsTab(settings, onSettingsChange) },
    { id: "actions", label: "Actions", content: createActionsTab() },
    { id: "collaborate", label: "Collab", content: createCollaborateTab() },
  ];

  const tabContent = document.createElement("div");
  tabContent.className = "right-tab-content";

  for (const tab of tabs) {
    const btn = document.createElement("button");
    btn.className = "right-tab-btn";
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => {
      tabBar.querySelectorAll(".right-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      tabContent.innerHTML = "";
      tabContent.appendChild(tab.content);
    });
    tabBar.appendChild(btn);
  }

  // Activate first tab
  (tabBar.firstChild as HTMLElement)?.classList.add("active");
  tabContent.appendChild(tabs[0].content);

  container.appendChild(tabBar);
  container.appendChild(tabContent);
}

function createSettingsTab(settings: Settings, onSettingsChange: () => void): HTMLElement {
  const el = document.createElement("div");
  el.className = "tab-panel";

  el.appendChild(createSelect("Theme", settings.theme, [
    { value: "auto", label: "Auto" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ], async (val) => {
    await saveSettings({ theme: val as Settings["theme"] });
    onSettingsChange();
  }));

  el.appendChild(createRange("Font Size", settings.fontSize, 12, 24, 1, async (val) => {
    await saveSettings({ fontSize: val });
    onSettingsChange();
  }));

  el.appendChild(createRange("Line Height", Math.round(settings.lineHeight * 10), 12, 20, 1, async (val) => {
    await saveSettings({ lineHeight: val / 10 });
    onSettingsChange();
  }));

  el.appendChild(createRange("Max Width", settings.maxWidth, 600, 1400, 50, async (val) => {
    await saveSettings({ maxWidth: val });
    onSettingsChange();
  }));

  el.appendChild(createSelect("Font", settings.fontFamily, [
    { value: "system-ui", label: "System Default" },
    { value: "'Inter', sans-serif", label: "Inter" },
    { value: "'Georgia', serif", label: "Georgia" },
    { value: "'JetBrains Mono', monospace", label: "JetBrains Mono" },
  ], async (val) => {
    await saveSettings({ fontFamily: val });
    onSettingsChange();
  }));

  el.appendChild(createCheckbox("Table of Contents", settings.showToc, async (val) => {
    await saveSettings({ showToc: val });
    onSettingsChange();
  }));

  el.appendChild(createCheckbox("Mermaid Diagrams", settings.enableMermaid, async (val) => {
    await saveSettings({ enableMermaid: val });
    onSettingsChange();
  }));

  el.appendChild(createCheckbox("LaTeX Math", settings.enableKatex, async (val) => {
    await saveSettings({ enableKatex: val });
    onSettingsChange();
  }));

  return el;
}

function createActionsTab(): HTMLElement {
  const el = document.createElement("div");
  el.className = "tab-panel";

  const htmlBtn = document.createElement("button");
  htmlBtn.className = "action-btn";
  htmlBtn.textContent = "Export HTML";
  htmlBtn.addEventListener("click", exportToHtml);
  el.appendChild(htmlBtn);

  const pdfBtn = document.createElement("button");
  pdfBtn.className = "action-btn";
  pdfBtn.textContent = "Export PDF";
  pdfBtn.addEventListener("click", () => window.print());
  el.appendChild(pdfBtn);

  const copyBtn = document.createElement("button");
  copyBtn.className = "action-btn";
  copyBtn.textContent = "Copy HTML";
  copyBtn.addEventListener("click", () => {
    const content = document.querySelector(".openmark-content");
    if (content) {
      navigator.clipboard.writeText(content.innerHTML).then(() => {
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy HTML"; }, 1500);
      });
    }
  });
  el.appendChild(copyBtn);

  return el;
}

function createCollaborateTab(): HTMLElement {
  const el = document.createElement("div");
  el.className = "tab-panel";

  // Bookmarks section
  const bookmarkSection = document.createElement("div");
  bookmarkSection.className = "collab-section";
  const bookmarkTitle = document.createElement("h4");
  bookmarkTitle.textContent = "Bookmarks";
  bookmarkSection.appendChild(bookmarkTitle);

  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.className = "action-btn";
  bookmarkBtn.textContent = "Bookmark this page";
  bookmarkBtn.addEventListener("click", () => {
    const bookmarks = getBookmarks();
    const url = window.location.href;
    const title = document.querySelector(".openmark-content h1")?.textContent || url;
    if (!bookmarks.find((b) => b.url === url)) {
      bookmarks.push({ url, title, timestamp: Date.now() });
      saveBookmarks(bookmarks);
      renderBookmarkList(bookmarkList, bookmarks);
    }
  });
  bookmarkSection.appendChild(bookmarkBtn);

  const bookmarkList = document.createElement("div");
  bookmarkList.className = "bookmark-list";
  const bookmarks = getBookmarks();
  renderBookmarkList(bookmarkList, bookmarks);
  bookmarkSection.appendChild(bookmarkList);

  el.appendChild(bookmarkSection);

  // Comments section
  const commentSection = document.createElement("div");
  commentSection.className = "collab-section";
  const commentTitle = document.createElement("h4");
  commentTitle.textContent = "Comments";
  commentSection.appendChild(commentTitle);

  const commentInput = document.createElement("textarea");
  commentInput.className = "comment-input";
  commentInput.placeholder = "Add a comment...";
  commentSection.appendChild(commentInput);

  const commentSubmit = document.createElement("button");
  commentSubmit.className = "action-btn";
  commentSubmit.textContent = "Add Comment";
  commentSubmit.addEventListener("click", () => {
    const text = commentInput.value.trim();
    if (!text) return;
    const comments = getComments();
    comments.push({ text, timestamp: Date.now(), page: window.location.href });
    saveComments(comments);
    commentInput.value = "";
    renderCommentList(commentList, comments);
  });
  commentSection.appendChild(commentSubmit);

  const commentList = document.createElement("div");
  commentList.className = "comment-list";
  const comments = getComments();
  renderCommentList(commentList, comments);
  commentSection.appendChild(commentList);

  el.appendChild(commentSection);

  return el;
}

interface Bookmark {
  url: string;
  title: string;
  timestamp: number;
}

interface Comment {
  text: string;
  timestamp: number;
  page: string;
}

function getBookmarks(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem("openmark-bookmarks") || "[]");
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: Bookmark[]): void {
  localStorage.setItem("openmark-bookmarks", JSON.stringify(bookmarks));
}

function getComments(): Comment[] {
  try {
    return JSON.parse(localStorage.getItem("openmark-comments") || "[]");
  } catch {
    return [];
  }
}

function saveComments(comments: Comment[]): void {
  localStorage.setItem("openmark-comments", JSON.stringify(comments));
}

function renderBookmarkList(container: HTMLElement, bookmarks: Bookmark[]): void {
  container.innerHTML = "";
  for (const b of bookmarks) {
    const item = document.createElement("div");
    item.className = "bookmark-item";

    const link = document.createElement("a");
    link.href = b.url;
    link.textContent = b.title;
    link.className = "bookmark-link";

    const removeBtn = document.createElement("button");
    removeBtn.className = "bookmark-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const updated = getBookmarks().filter((bk) => bk.url !== b.url);
      saveBookmarks(updated);
      renderBookmarkList(container, updated);
    });

    item.appendChild(link);
    item.appendChild(removeBtn);
    container.appendChild(item);
  }
}

function renderCommentList(container: HTMLElement, comments: Comment[]): void {
  container.innerHTML = "";
  const pageComments = comments.filter((c) => c.page === window.location.href);
  for (const c of pageComments) {
    const item = document.createElement("div");
    item.className = "comment-item";
    const text = document.createElement("p");
    text.textContent = c.text;
    const time = document.createElement("span");
    time.className = "comment-time";
    time.textContent = new Date(c.timestamp).toLocaleString();
    item.appendChild(text);
    item.appendChild(time);
    container.appendChild(item);
  }
}

function createSelect(
  label: string,
  value: string,
  options: { value: string; label: string }[],
  onChange: (val: string) => void,
): HTMLElement {
  const field = document.createElement("div");
  field.className = "setting-field";
  const lbl = document.createElement("label");
  lbl.textContent = label;
  const sel = document.createElement("select");
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === value) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener("change", () => onChange(sel.value));
  field.appendChild(lbl);
  field.appendChild(sel);
  return field;
}

function createRange(
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (val: number) => void,
): HTMLElement {
  const field = document.createElement("div");
  field.className = "setting-field";
  const lbl = document.createElement("label");
  lbl.textContent = `${label}: ${value}`;
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener("input", () => {
    lbl.textContent = `${label}: ${input.value}`;
    onChange(parseInt(input.value));
  });
  field.appendChild(lbl);
  field.appendChild(input);
  return field;
}

function createCheckbox(
  label: string,
  checked: boolean,
  onChange: (val: boolean) => void,
): HTMLElement {
  const field = document.createElement("div");
  field.className = "setting-field checkbox";
  const lbl = document.createElement("label");
  lbl.textContent = label;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  field.appendChild(lbl);
  field.appendChild(input);
  return field;
}

function exportToHtml(): void {
  const content = document.querySelector(".openmark-content");
  if (!content) return;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Exported Markdown</title>
<style>
body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; }
code { font-family: ui-monospace, monospace; background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.875em; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #d0d7de; padding: 0.5em 1em; color: #656d76; margin: 1em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #d0d7de; padding: 0.5em 1em; text-align: left; }
th { background: #f6f8fa; font-weight: 600; }
img { max-width: 100%; height: auto; }
h1, h2 { border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
</style>
</head>
<body>
${content.innerHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getFileName() + ".html";
  a.click();
  URL.revokeObjectURL(url);
}

function getFileName(): string {
  const path = window.location.pathname;
  const name = path.split("/").pop() || "document";
  return name.replace(/\.(md|markdown)$/i, "");
}
