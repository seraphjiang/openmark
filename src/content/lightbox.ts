export function initLightbox(container: HTMLElement): void {
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG") return;

    const img = target as HTMLImageElement;
    const overlay = document.createElement("div");
    overlay.className = "openmark-lightbox";
    overlay.innerHTML = `<img src="${img.src}" alt="${img.alt || ""}">`;
    overlay.addEventListener("click", () => overlay.remove());

    document.addEventListener("keydown", function handler(ev) {
      if (ev.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", handler);
      }
    });

    document.body.appendChild(overlay);
  });
}
