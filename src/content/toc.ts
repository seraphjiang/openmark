interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function generateToc(container: HTMLElement): HTMLElement {
  const headings = container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");
  const entries: TocEntry[] = [];
  const idCounts = new Map<string, number>();

  headings.forEach((heading) => {
    if (!heading.id) {
      let base = heading.textContent
        ?.toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/(^-|-$)/g, "") || "";
      const count = idCounts.get(base) || 0;
      idCounts.set(base, count + 1);
      heading.id = count === 0 ? base : `${base}-${count}`;
    }
    entries.push({
      id: heading.id,
      text: heading.textContent || "",
      level: parseInt(heading.tagName[1]),
    });
  });

  const tocEl = document.createElement("nav");
  tocEl.className = "openmark-toc";

  const header = document.createElement("div");
  header.className = "openmark-toc-header";
  header.textContent = "Table of Contents";
  tocEl.appendChild(header);

  const ul = document.createElement("ul");
  for (const e of entries) {
    const li = document.createElement("li");
    li.className = `toc-level-${e.level}`;
    const a = document.createElement("a");
    a.href = `#${e.id}`;
    a.textContent = e.text;
    li.appendChild(a);
    ul.appendChild(li);
  }
  tocEl.appendChild(ul);

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
          const escapedId = CSS.escape(entry.target.id);
          const active = tocEl.querySelector(`a[href="#${escapedId}"]`);
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
