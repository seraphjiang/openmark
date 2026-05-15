interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function generateToc(container: HTMLElement): HTMLElement {
  const headings = container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");
  const entries: TocEntry[] = [];

  headings.forEach((heading) => {
    if (!heading.id) {
      heading.id = heading.textContent
        ?.toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/(^-|-$)/g, "") || "";
    }
    entries.push({
      id: heading.id,
      text: heading.textContent || "",
      level: parseInt(heading.tagName[1]),
    });
  });

  const tocEl = document.createElement("nav");
  tocEl.className = "openmark-toc";
  tocEl.innerHTML = `
    <div class="openmark-toc-header">Table of Contents</div>
    <ul>${entries.map((e) => `<li class="toc-level-${e.level}"><a href="#${e.id}">${e.text}</a></li>`).join("")}</ul>
  `;

  initScrollSpy(tocEl, entries);
  return tocEl;
}

function initScrollSpy(tocEl: HTMLElement, entries: TocEntry[]): void {
  const links = tocEl.querySelectorAll<HTMLAnchorElement>("a");

  const observer = new IntersectionObserver(
    (observerEntries) => {
      for (const entry of observerEntries) {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          const active = tocEl.querySelector(`a[href="#${entry.target.id}"]`);
          active?.classList.add("active");
          break;
        }
      }
    },
    { rootMargin: "0px 0px -80% 0px" },
  );

  entries.forEach((e) => {
    const el = document.getElementById(e.id);
    if (el) observer.observe(el);
  });
}
