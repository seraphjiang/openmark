import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
} from "docx";

function* walkNodes(node: Node): Generator<Node> {
  yield node;
  for (const child of Array.from(node.childNodes)) {
    yield* walkNodes(child);
  }
}

function nodeText(node: Node): string {
  return (node as HTMLElement).innerText ?? node.textContent ?? "";
}

function parseInlineRuns(el: HTMLElement): TextRun[] {
  const runs: TextRun[] = [];
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) runs.push(new TextRun({ text }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      const inner = nodeText(node as HTMLElement);
      if (tag === "strong" || tag === "b") {
        runs.push(new TextRun({ text: inner, bold: true }));
      } else if (tag === "em" || tag === "i") {
        runs.push(new TextRun({ text: inner, italics: true }));
      } else if (tag === "code") {
        runs.push(new TextRun({ text: inner, font: "Courier New", size: 18 }));
      } else if (tag === "a") {
        runs.push(new TextRun({ text: inner, color: "0969DA" }));
      } else if (tag === "del" || tag === "s") {
        runs.push(new TextRun({ text: inner, strike: true }));
      } else {
        // recurse
        runs.push(...parseInlineRuns(node as HTMLElement));
      }
    }
  }
  return runs;
}

function htmlToParagraphs(content: HTMLElement): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [];

  for (const child of Array.from(content.children)) {
    const tag = child.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
      const level = parseInt(tag[1]);
      const headingMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      blocks.push(new Paragraph({
        text: nodeText(child as HTMLElement),
        heading: headingMap[level] ?? HeadingLevel.HEADING_1,
      }));
    } else if (tag === "p") {
      const runs = parseInlineRuns(child as HTMLElement);
      if (runs.length > 0) {
        blocks.push(new Paragraph({ children: runs }));
      }
    } else if (tag === "pre") {
      const codeEl = child.querySelector("code");
      const text = codeEl ? (codeEl.innerText || codeEl.textContent || "") : nodeText(child as HTMLElement);
      // Each line as a paragraph in monospace
      for (const line of text.split("\n")) {
        blocks.push(new Paragraph({
          children: [new TextRun({ text: line || " ", font: "Courier New", size: 18 })],
          shading: { type: ShadingType.SOLID, color: "F6F8FA" },
          spacing: { before: 0, after: 0 },
        }));
      }
      blocks.push(new Paragraph({ text: "" })); // gap after block
    } else if (tag === "blockquote") {
      blocks.push(new Paragraph({
        children: [new TextRun({ text: nodeText(child as HTMLElement), italics: true, color: "656D76" })],
        indent: { left: 720 },
        border: { left: { style: BorderStyle.THICK, size: 12, color: "D0D7DE", space: 8 } },
      }));
    } else if (tag === "ul" || tag === "ol") {
      child.querySelectorAll("li").forEach((li, idx) => {
        const text = nodeText(li);
        const bullet = tag === "ol" ? `${idx + 1}.` : "•";
        blocks.push(new Paragraph({
          children: [new TextRun({ text: `${bullet}  ${text}` })],
          indent: { left: 360 },
        }));
      });
    } else if (tag === "hr") {
      blocks.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D0D7DE", space: 1 } },
        text: "",
      }));
    } else if (tag === "table") {
      const tableRows: TableRow[] = [];
      child.querySelectorAll("tr").forEach((tr) => {
        const cells: TableCell[] = [];
        tr.querySelectorAll("th,td").forEach((td) => {
          cells.push(new TableCell({
            children: [new Paragraph({ text: nodeText(td as HTMLElement) })],
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: td.tagName.toLowerCase() === "th"
              ? { type: ShadingType.SOLID, color: "F6F8FA" }
              : undefined,
          }));
        });
        if (cells.length > 0) tableRows.push(new TableRow({ children: cells }));
      });
      if (tableRows.length > 0) {
        blocks.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        blocks.push(new Paragraph({ text: "" }));
      }
    } else {
      // fallback: plain text
      const text = nodeText(child as HTMLElement).trim();
      if (text) blocks.push(new Paragraph({ text }));
    }
  }

  return blocks;
}

export async function exportToDocx(fileName: string): Promise<void> {
  const content = document.querySelector<HTMLElement>(".openmark-content");
  if (!content) return;

  const blocks = htmlToParagraphs(content);

  const doc = new Document({
    sections: [{
      properties: {},
      children: blocks,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
