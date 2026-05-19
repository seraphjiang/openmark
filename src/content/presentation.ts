import { renderMarkdown, initRenderer } from "./renderer";
import { getSettings } from "../shared/storage";

let overlay: HTMLElement | null = null;
let slides: string[] = [];
let currentSlide = 0;

function splitSlides(source: string): string[] {
  // Split on --- (hr) or on # headings at start of line
  const parts = source.split(/\n---\n/);
  const result: string[] = [];
  for (const part of parts) {
    // Further split on top-level headings (# )
    const subParts = part.split(/(?=\n# )/);
    for (const sub of subParts) {
      const trimmed = sub.trim();
      if (trimmed) result.push(trimmed);
    }
  }
  return result.length > 0 ? result : [source];
}

function renderSlide(idx: number): void {
  if (!overlay) return;
  const content = overlay.querySelector<HTMLElement>(".pres-content")!;
  const counter = overlay.querySelector<HTMLElement>(".pres-counter")!;
  content.innerHTML = renderMarkdown(slides[idx]);
  counter.textContent = `${idx + 1} / ${slides.length}`;
}

function navigate(delta: number): void {
  const next = currentSlide + delta;
  if (next < 0 || next >= slides.length) return;
  currentSlide = next;
  renderSlide(currentSlide);
  updateNavButtons();
}

function updateNavButtons(): void {
  if (!overlay) return;
  const prev = overlay.querySelector<HTMLButtonElement>(".pres-prev")!;
  const next = overlay.querySelector<HTMLButtonElement>(".pres-next")!;
  prev.disabled = currentSlide === 0;
  next.disabled = currentSlide === slides.length - 1;
}

function closePresentation(): void {
  overlay?.remove();
  overlay = null;
  document.removeEventListener("keydown", keyHandler);
}

function keyHandler(e: KeyboardEvent): void {
  if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
    e.preventDefault();
    navigate(1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    navigate(-1);
  } else if (e.key === "Escape") {
    closePresentation();
  }
}

export async function startPresentation(): Promise<void> {
  const settings = await getSettings();
  initRenderer(settings);

  // Get raw source
  const rawPre = document.querySelector<HTMLElement>(".om-raw-view");
  let source = "";
  if (rawPre) {
    source = rawPre.textContent || "";
  } else {
    // Try to get from editor textarea
    const textarea = document.querySelector<HTMLTextAreaElement>(".editor-textarea");
    if (textarea) {
      source = textarea.value;
    } else {
      // Fallback: grab visible text (not ideal but works)
      source = (window as any).__openmarkLastContent || "";
    }
  }

  if (!source) {
    alert("Cannot start presentation: no markdown source available.");
    return;
  }

  slides = splitSlides(source);
  currentSlide = 0;

  // Build overlay
  overlay = document.createElement("div");
  overlay.className = "om-presentation";
  overlay.innerHTML = `
    <div class="pres-toolbar">
      <span class="pres-title">Presentation Mode</span>
      <span class="pres-counter"></span>
      <button class="pres-close" title="Close (Esc)">✕</button>
    </div>
    <div class="pres-stage">
      <button class="pres-nav pres-prev" title="Previous (←)">‹</button>
      <div class="pres-content openmark-content"></div>
      <button class="pres-nav pres-next" title="Next (→)">›</button>
    </div>
    <div class="pres-hint">← → navigate · Esc close</div>
  `;

  overlay.querySelector(".pres-close")!.addEventListener("click", closePresentation);
  overlay.querySelector(".pres-prev")!.addEventListener("click", () => navigate(-1));
  overlay.querySelector(".pres-next")!.addEventListener("click", () => navigate(1));

  document.body.appendChild(overlay);
  document.addEventListener("keydown", keyHandler);

  renderSlide(0);
  updateNavButtons();
}
