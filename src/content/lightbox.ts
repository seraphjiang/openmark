export function initLightbox(container: HTMLElement): void {
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG") return;

    const img = target as HTMLImageElement;
    const overlay = document.createElement("div");
    overlay.className = "openmark-lightbox";

    const fullImg = document.createElement("img");
    fullImg.src = img.src;
    fullImg.alt = img.alt || "";
    overlay.appendChild(fullImg);

    function close() {
      overlay.remove();
      document.removeEventListener("keydown", handler);
    }

    function handler(ev: KeyboardEvent) {
      if (ev.key === "Escape") close();
    }

    overlay.addEventListener("click", close);
    document.addEventListener("keydown", handler);
    document.body.appendChild(overlay);
  });
}
