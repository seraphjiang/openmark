import { getSettings, saveSettings } from "../shared/storage";

async function init(): Promise<void> {
  const settings = await getSettings();

  const themeEl = document.getElementById("theme") as HTMLSelectElement;
  const fontSizeEl = document.getElementById("fontSize") as HTMLInputElement;
  const showTocEl = document.getElementById("showToc") as HTMLInputElement;

  themeEl.value = settings.theme;
  fontSizeEl.value = String(settings.fontSize);
  showTocEl.checked = settings.showToc;

  themeEl.addEventListener("change", () => {
    saveSettings({ theme: themeEl.value as "light" | "dark" | "auto" });
  });

  fontSizeEl.addEventListener("input", () => {
    saveSettings({ fontSize: parseInt(fontSizeEl.value) });
  });

  showTocEl.addEventListener("change", () => {
    saveSettings({ showToc: showTocEl.checked });
  });
}

document.addEventListener("DOMContentLoaded", init);
