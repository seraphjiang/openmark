import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import katex from "katex";
import { Settings } from "../shared/types";

// mermaid is dynamically imported so it ends up in its own chunk,
// keeping content.js lean and free of Unicode data tables that
// trigger Chrome Web Store false-positive encoding errors.
let mermaidInstance: typeof import("mermaid")["default"] | null = null;

async function getMermaid(): Promise<typeof import("mermaid")["default"]> {
  if (mermaidInstance) return mermaidInstance;
  const mod = await import("mermaid");
  mermaidInstance = mod.default;
  return mermaidInstance;
}

let md: MarkdownIt;

function createMarkdownIt(settings: Settings): MarkdownIt {
  const highlight = settings.enableHighlight
    ? (str: string, lang: string): string => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
          } catch {
            // fall through
          }
        }
        return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
      }
    : undefined;

  const instance = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight,
  });

  if (settings.enableKatex) {
    addKatexPlugin(instance);
  }

  if (settings.enableMermaid) {
    addMermaidPlugin(instance);
  }

  return instance;
}

function addKatexPlugin(instance: MarkdownIt): void {
  const inlineRule = (state: any) => {
    const src = state.src;
    const start = state.pos;
    if (src[start] !== "$" || src[start + 1] === "$") return false;

    const end = src.indexOf("$", start + 1);
    if (end === -1) return false;

    const content = src.slice(start + 1, end);
    const token = state.push("katex_inline", "math", 0);
    token.content = content;
    state.pos = end + 1;
    return true;
  };

  const blockRule = (
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean,
  ) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    if (
      state.src[startPos] !== "$" ||
      state.src[startPos + 1] !== "$"
    )
      return false;

    if (silent) return true;

    let line = startLine + 1;
    while (line < endLine) {
      const pos = state.bMarks[line] + state.tShift[line];
      if (state.src[pos] === "$" && state.src[pos + 1] === "$") break;
      line++;
    }

    const content = state.getLines(startLine + 1, line, state.tShift[startLine], false);
    const token = state.push("katex_block", "math", 0);
    token.content = content;
    token.map = [startLine, line + 1];
    state.line = line + 1;
    return true;
  };

  instance.inline.ruler.after("escape", "katex_inline", inlineRule);
  instance.block.ruler.after("blockquote", "katex_block", blockRule);

  instance.renderer.rules.katex_inline = (tokens: any[], idx: number) => {
    try {
      return katex.renderToString(tokens[idx].content, { throwOnError: false });
    } catch {
      return `<code>${tokens[idx].content}</code>`;
    }
  };

  instance.renderer.rules.katex_block = (tokens: any[], idx: number) => {
    try {
      return `<div class="katex-block">${katex.renderToString(tokens[idx].content, { throwOnError: false, displayMode: true })}</div>`;
    } catch {
      return `<pre><code>${tokens[idx].content}</code></pre>`;
    }
  };
}

function addMermaidPlugin(instance: MarkdownIt): void {
  const defaultFence =
    instance.renderer.rules.fence ||
    ((tokens: any[], idx: number, options: any, _env: any, self: any) =>
      self.renderToken(tokens, idx, options));

  instance.renderer.rules.fence = (
    tokens: any[],
    idx: number,
    options: any,
    env: any,
    self: any,
  ) => {
    const token = tokens[idx];
    if (token.info.trim() === "mermaid") {
      return `<div class="mermaid">${token.content}</div>`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}

export function initRenderer(settings: Settings): void {
  md = createMarkdownIt(settings);

  if (settings.enableMermaid) {
    getMermaid().then((mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: settings.theme === "dark" ? "dark" : "default",
      });
    });
  }
}

export function renderMarkdown(source: string): string {
  return md.render(source);
}

export async function renderMermaidDiagrams(): Promise<void> {
  const elements = document.querySelectorAll<HTMLElement>(".mermaid");
  if (elements.length === 0) return;
  const mermaid = await getMermaid();
  for (const el of elements) {
    if (el.dataset.processed) continue;
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
  }
}
