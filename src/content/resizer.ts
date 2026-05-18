import { saveLocalState } from "../shared/storage";

export function initResizer(
  handle: HTMLElement,
  panel: HTMLElement,
  side: "left" | "right",
  storageKey: "tocWidth" | "explorerWidth",
): void {
  let startX: number;
  let startWidth: number;

  function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    startX = e.clientX;
    startWidth = panel.getBoundingClientRect().width;
    handle.classList.add("dragging");
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    const delta = e.clientX - startX;
    const newWidth = side === "left"
      ? startWidth + delta
      : startWidth - delta;
    const clamped = Math.max(150, Math.min(500, newWidth));
    panel.style.width = clamped + "px";
  }

  function onMouseUp() {
    handle.classList.remove("dragging");
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    const width = panel.getBoundingClientRect().width;
    saveLocalState({ [storageKey]: Math.round(width) });
  }

  handle.addEventListener("mousedown", onMouseDown);
}
