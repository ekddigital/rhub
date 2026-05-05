import type { LetterBodyBlock } from "./letter-composer-blocks";
import { richHtmlToPlainText } from "./letter-composer-plain";

export function normalizeMarkdownToReadableText(text: string): string {
  const lines = text.split("\n");
  const normalized: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      normalized.push("");
      continue;
    }

    const headingMatch = line.match(/^\s*#{1,6}\s+(.+)$/);
    if (headingMatch) {
      normalized.push(headingMatch[1] ?? "");
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      normalized.push(line.replace(/^\s*[-*]\s+/, "• "));
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      normalized.push(line.replace(/^\s*(\d+)\.\s+/, "$1. "));
      continue;
    }

    if (/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line)) {
      continue;
    }

    if (line.includes("|")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      if (cells.length > 1) {
        normalized.push(cells.join(" | "));
        continue;
      }
    }

    normalized.push(line);
  }

  return normalized
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** TipTap often wraps paragraphs in single root `<div>`; DOMParser would treat that as one paragraph. */
function letterHtmlTopLevelElements(doc: Document): Element[] {
  let nodes = Array.from(doc.body.children);
  for (let depth = 0; depth < 6; depth++) {
    if (nodes.length === 1) {
      const tag = nodes[0].tagName.toLowerCase();
      if (tag === "div" || tag === "article" || tag === "section") {
        const inner = Array.from(nodes[0].children);
        if (inner.length > 0) {
          nodes = inner;
          continue;
        }
      }
    }
    break;
  }
  return nodes;
}

export function richHtmlToBodyBlocks(html: string): LetterBodyBlock[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    const blocks: LetterBodyBlock[] = [];

    const readText = (el: Element) =>
      (el.textContent || "").replace(/\s+/g, " ").trim();

    letterHtmlTopLevelElements(doc).forEach((el) => {
      const tag = el.tagName.toLowerCase();

      if (/^h[1-4]$/.test(tag)) {
        const level = Number(tag[1]) as 1 | 2 | 3 | 4;
        const text = readText(el);
        if (text) blocks.push({ type: "heading", level, text });
        return;
      }

      if (tag === "p" || tag === "div") {
        const text = readText(el);
        if (!text) return;
        const richHtmlInner = el.innerHTML.trim();
        blocks.push({
          type: "paragraph",
          text,
          ...(richHtmlInner ? { richHtmlInner } : {}),
        });
        return;
      }

      if (tag === "blockquote") {
        const text = readText(el);
        if (text) blocks.push({ type: "blockquote", text });
        return;
      }

      if (tag === "hr") {
        blocks.push({ type: "divider" });
        return;
      }

      if (tag === "ul" || tag === "ol") {
        const items = Array.from(el.querySelectorAll(":scope > li"))
          .map((li) => readText(li))
          .filter(Boolean);
        if (items.length > 0) {
          blocks.push({ type: "list", ordered: tag === "ol", items });
        }
        return;
      }

      if (tag === "table") {
        const headerCells = Array.from(
          el.querySelectorAll("thead tr th, thead tr td"),
        )
          .map((cell) => readText(cell))
          .filter(Boolean);
        const bodyRows = Array.from(el.querySelectorAll("tbody tr"))
          .map((row) =>
            Array.from(row.querySelectorAll("th,td"))
              .map((cell) => readText(cell))
              .filter(Boolean),
          )
          .filter((row) => row.length > 0);

        if (headerCells.length > 0 || bodyRows.length > 0) {
          const inferredHeaders =
            headerCells.length > 0
              ? headerCells
              : bodyRows.length > 0
                ? bodyRows[0]
                : [];
          const inferredRows =
            headerCells.length > 0 ? bodyRows : bodyRows.slice(1);
          blocks.push({
            type: "table",
            headers: inferredHeaders,
            rows: inferredRows,
          });
        }
      }
    });

    if (blocks.length > 0) return blocks;
  }

  const fallback = normalizeMarkdownToReadableText(
    richHtmlToPlainText(trimmed),
  );
  if (!fallback) return [];
  return fallback.split("\n\n").map((text) => ({ type: "paragraph", text }));
}
