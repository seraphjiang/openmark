import { Settings } from "../shared/types";
import { saveSettings } from "../shared/storage";

export function initFlyout(
  flyout: HTMLElement,
  settings: Settings,
  onSettingsChange: () => void,
): void {
  flyout.innerHTML = "";

  const header = document.createElement("div");
  header.className = "flyout-header";
  header.textContent = "Menu";
  flyout.appendChild(header);

  // Export section
  const exportSection = document.createElement("div");
  exportSection.className = "flyout-section";

  const exportTitle = document.createElement("h3");
  exportTitle.textContent = "Export";
  exportSection.appendChild(exportTitle);

  const htmlBtn = document.createElement("button");
  htmlBtn.className = "flyout-btn";
  htmlBtn.textContent = "Export HTML";
  htmlBtn.addEventListener("click", exportToHtml);
  exportSection.appendChild(htmlBtn);

  const pdfBtn = document.createElement("button");
  pdfBtn.className = "flyout-btn";
  pdfBtn.textContent = "Export PDF";
  pdfBtn.addEventListener("click", () => window.print());
  exportSection.appendChild(pdfBtn);

  flyout.appendChild(exportSection);

  // Settings section
  const settingsSection = document.createElement("div");
  settingsSection.className = "flyout-section";

  const settingsTitle = document.createElement("h3");
  settingsTitle.textContent = "Page Settings";
  settingsSection.appendChild(settingsTitle);

  // Theme
  settingsSection.appendChild(createSelect("Theme", "theme", settings.theme, [
    { value: "auto", label: "Auto" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ], async (val) => {
    await saveSettings({ theme: val as Settings["theme"] });
    onSettingsChange();
  }));

  // Font size
  settingsSection.appendChild(createRange("Font Size", "fontSize", settings.fontSize, 12, 24, 1, async (val) => {
    await saveSettings({ fontSize: val });
    onSettingsChange();
  }));

  // TOC toggle
  settingsSection.appendChild(createCheckbox("Table of Contents", settings.showToc, async (val) => {
    await saveSettings({ showToc: val });
    onSettingsChange();
  }));

  flyout.appendChild(settingsSection);
}

function createSelect(
  label: string,
  _id: string,
  value: string,
  options: { value: string; label: string }[],
  onChange: (val: string) => void,
): HTMLElement {
  const field = document.createElement("div");
  field.className = "flyout-field";
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
  _id: string,
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (val: number) => void,
): HTMLElement {
  const field = document.createElement("div");
  field.className = "flyout-field";
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
  field.className = "flyout-field";
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

  const styles = document.querySelector<HTMLLinkElement>('link[href*="content.css"]');
  let css = "";
  if (styles) {
    const sheets = document.styleSheets;
    for (const sheet of sheets) {
      try {
        if (sheet.href?.includes("content.css")) {
          css = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
        }
      } catch {
        // cross-origin stylesheet
      }
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Exported Markdown</title>
<style>
body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
${css}
</style>
</head>
<body>
<article class="openmark-content">${content.innerHTML}</article>
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
