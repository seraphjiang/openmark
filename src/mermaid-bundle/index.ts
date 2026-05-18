import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

window.addEventListener("openmark-render-mermaid", (e) => {
  const theme = (e as CustomEvent).detail?.theme;
  if (theme) {
    mermaid.initialize({ startOnLoad: false, theme });
  }

  const elements = document.querySelectorAll<HTMLElement>(".mermaid:not([data-processed])");
  const promises = Array.from(elements).map(async (el) => {
    try {
      const { svg } = await mermaid.render(
        `mermaid-${Math.random().toString(36).slice(2)}`,
        el.textContent || "",
      );
      el.innerHTML = svg;
      el.dataset.processed = "true";
    } catch {
      el.classList.add("mermaid-error");
    }
  });

  Promise.all(promises).then(() => {
    window.dispatchEvent(new Event("openmark-mermaid-done"));
  });
});

window.dispatchEvent(new Event("openmark-mermaid-ready"));
