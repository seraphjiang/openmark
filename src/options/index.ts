import { getSettings, saveSettings } from "../shared/storage";
import { Settings } from "../shared/types";

const fields: (keyof Settings)[] = [
  "theme",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "maxWidth",
  "showToc",
  "enableHighlight",
  "enableMermaid",
  "enableKatex",
  "autoRefresh",
];

async function init(): Promise<void> {
  const settings = await getSettings();
  const savedEl = document.getElementById("saved")!;

  for (const key of fields) {
    const el = document.getElementById(key) as HTMLInputElement | HTMLSelectElement;
    if (!el) continue;

    if (el.type === "checkbox") {
      (el as HTMLInputElement).checked = settings[key] as boolean;
    } else {
      el.value = String(settings[key]);
    }

    el.addEventListener("change", async () => {
      let value: string | number | boolean;
      if (el.type === "checkbox") {
        value = (el as HTMLInputElement).checked;
      } else if (el.type === "number") {
        value = parseFloat(el.value);
      } else {
        value = el.value;
      }
      await saveSettings({ [key]: value });
      savedEl.classList.add("show");
      setTimeout(() => savedEl.classList.remove("show"), 1500);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
