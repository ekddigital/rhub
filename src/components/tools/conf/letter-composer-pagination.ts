import type { LetterBodyBlock } from "./letter-composer-blocks";

export type PageMetrics = {
  name: string;
  contentWidth: number;
  contentHeight: number;
  paddingLeft: number;
  paddingRight: number;
  fontSize: number;
  lineHeight: number;
};

function getUsableTextWidth(metrics: PageMetrics): number {
  return Math.max(
    120,
    metrics.contentWidth - metrics.paddingLeft - metrics.paddingRight,
  );
}

function measureTextWidth(text: string, metrics: PageMetrics): number {
  if (typeof document === "undefined") {
    return text.length * (metrics.fontSize * 0.52);
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return text.length * (metrics.fontSize * 0.52);
  }
  ctx.font = `${metrics.fontSize}px Helvetica Neue, Arial, sans-serif`;
  return ctx.measureText(text).width;
}

export function estimateLinesPerPage(metrics: PageMetrics): number {
  const lineHeightPx = metrics.fontSize * metrics.lineHeight;
  return Math.floor(metrics.contentHeight / lineHeightPx);
}

export function wrapParagraph(paragraph: string, metrics: PageMetrics): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  const maxWidth = getUsableTextWidth(metrics);

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextWidth(candidate, metrics) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (measureTextWidth(word, metrics) <= maxWidth) {
        current = word;
        continue;
      }
      let segment = "";
      for (const ch of word) {
        const next = segment + ch;
        if (measureTextWidth(next, metrics) <= maxWidth) {
          segment = next;
        } else {
          if (segment) lines.push(segment);
          segment = ch;
        }
      }
      current = segment;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

const PAGINATION_BACKFILL_LINE_TOLERANCE = 3;

export function estimateBlockLines(
  block: LetterBodyBlock,
  metrics: PageMetrics,
): number {
  const paragraphLines = (text: string, bonus = 1) =>
    Math.max(1, wrapParagraph(text, metrics).length + bonus);

  if (block.type === "heading") {
    return paragraphLines(block.text, block.level <= 2 ? 2 : 1);
  }
  if (block.type === "paragraph") {
    return paragraphLines(block.text, 1);
  }
  if (block.type === "blockquote") {
    return paragraphLines(block.text, 2);
  }
  if (block.type === "divider") {
    return 2;
  }
  if (block.type === "list") {
    return (
      block.items.reduce(
        (sum, item, idx) =>
          sum +
          Math.max(
            1,
            wrapParagraph(
              `${block.ordered ? `${idx + 1}. ` : "• "}${item}`,
              metrics,
            ).length,
          ),
        0,
      ) + 1
    );
  }
  if (block.type === "table") {
    const hasHeaderRow = block.headers.length > 0 ? 1 : 0;
    const rowCount = hasHeaderRow + block.rows.length;
    return Math.max(3, Math.ceil(rowCount * 1.22) + 1);
  }
  return 2;
}

export function coalesceTrailingHeadingsOntoNextPage(
  pages: LetterBodyBlock[][],
): LetterBodyBlock[][] {
  const out = pages;
  let p = 0;
  while (p < Math.max(0, out.length - 1)) {
    const cur = out[p];
    const nxt = out[p + 1];
    if (!cur?.length || !nxt?.length) {
      p++;
      continue;
    }
    if (cur[cur.length - 1].type !== "heading") {
      p++;
      continue;
    }
    nxt.unshift(cur.pop()!);
    if (cur.length === 0) out.splice(p, 1);
    else p++;
  }
  return out.length > 0 ? out : [[]];
}

export function dropEmptyPaginationPages(
  pages: LetterBodyBlock[][],
): LetterBodyBlock[][] {
  const next = pages.filter((seg) => seg.length > 0);
  return next.length > 0 ? next : [[]];
}

function backfillSlackOnce(
  pages: LetterBodyBlock[][],
  firstCap: number,
  continuationCap: number,
  firstPageMetrics: PageMetrics,
  continuationPageMetrics: PageMetrics,
  lineTolerance = 0,
): boolean {
  let moved = false;
  for (let p = 0; p < pages.length - 1; p++) {
    const cap = p === 0 ? firstCap : continuationCap;
    const targetMetrics = p === 0 ? firstPageMetrics : continuationPageMetrics;
    while (pages[p + 1]?.length) {
      const head = pages[p + 1][0];
      const used = pages[p].reduce(
        (sum, b) => sum + estimateBlockLines(b, targetMetrics),
        0,
      );
      const add = estimateBlockLines(head, targetMetrics);
      if (used + add <= cap + lineTolerance) {
        pages[p].push(pages[p + 1].shift()!);
        moved = true;
      } else {
        break;
      }
    }
  }
  return moved;
}

function spliceOutEmptyIntermediatePages(pages: LetterBodyBlock[][]): void {
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i].length === 0 && pages.length > 1) {
      pages.splice(i, 1);
    }
  }
}

function runBackfillSlackConvergence(
  pages: LetterBodyBlock[][],
  firstCap: number,
  continuationCap: number,
  firstPageMetrics: PageMetrics,
  continuationPageMetrics: PageMetrics,
  lineTolerance = 0,
): void {
  for (let guard = 0; guard < 32; guard++) {
    spliceOutEmptyIntermediatePages(pages);
    const moved = backfillSlackOnce(
      pages,
      firstCap,
      continuationCap,
      firstPageMetrics,
      continuationPageMetrics,
      lineTolerance,
    );
    if (!moved) break;
  }
  spliceOutEmptyIntermediatePages(pages);
}

export function paginateBodyBlocks(
  blocks: LetterBodyBlock[],
  firstPageMetrics: PageMetrics,
  continuationPageMetrics: PageMetrics,
  signatureReserveLines: number,
  firstPageLeadReserveLines: number,
): LetterBodyBlock[][] {
  if (blocks.length === 0) return [[]];

  const rawFirstCap = estimateLinesPerPage(firstPageMetrics);
  const rawContinuationCap = estimateLinesPerPage(continuationPageMetrics);
  const firstCap = Math.max(
    14,
    Math.floor(
      Math.max(0, rawFirstCap - Math.max(0, firstPageLeadReserveLines)) * 0.985,
    ),
  );
  const continuationCap = Math.max(14, Math.floor(rawContinuationCap * 0.985));

  const pages: LetterBodyBlock[][] = [[]];
  let pageIndex = 0;
  let usedLines = 0;

  const pageCap = () => (pageIndex === 0 ? firstCap : continuationCap);

  const metricsAt = () =>
    pageIndex === 0 ? firstPageMetrics : continuationPageMetrics;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const metrics = metricsAt();
    const blockLines = estimateBlockLines(block, metrics);
    const nextBlock = blocks[i + 1];
    const nextLines = nextBlock ? estimateBlockLines(nextBlock, metrics) : 0;

    if (block.type === "heading" && nextBlock && pages[pageIndex].length > 0) {
      const remainder = pageCap() - usedLines;
      const headingFitsInRemainder = remainder >= blockLines;
      const pairFitsInRemainder = remainder >= blockLines + nextLines;
      if (headingFitsInRemainder && !pairFitsInRemainder) {
        pages.push([]);
        pageIndex += 1;
        usedLines = 0;
      }
    }

    if (usedLines + blockLines > pageCap() && pages[pageIndex].length > 0) {
      pages.push([]);
      pageIndex += 1;
      usedLines = 0;
    }

    const blockMetrics = metricsAt();
    pages[pageIndex].push(block);
    usedLines += estimateBlockLines(block, blockMetrics);
  }

  runBackfillSlackConvergence(
    pages,
    firstCap,
    continuationCap,
    firstPageMetrics,
    continuationPageMetrics,
    PAGINATION_BACKFILL_LINE_TOLERANCE,
  );
  let normalized = dropEmptyPaginationPages(pages);
  normalized = coalesceTrailingHeadingsOntoNextPage(normalized);
  normalized = dropEmptyPaginationPages(normalized);

  if (signatureReserveLines > 0 && normalized.length > 0) {
    let lastIndex = normalized.length - 1;
    const reserveCap = Math.max(
      8,
      (lastIndex === 0 ? firstCap : continuationCap) - signatureReserveLines,
    );

    let used = normalized[lastIndex].reduce(
      (sum, block) =>
        sum +
        estimateBlockLines(
          block,
          lastIndex === 0 ? firstPageMetrics : continuationPageMetrics,
        ),
      0,
    );

    while (used > reserveCap && normalized[lastIndex].length > 1) {
      const moved = normalized[lastIndex].pop();
      if (!moved) break;
      if (!normalized[lastIndex + 1]) normalized.push([]);
      normalized[lastIndex + 1].unshift(moved);
      used = normalized[lastIndex].reduce(
        (sum, block) =>
          sum +
          estimateBlockLines(
            block,
            lastIndex === 0 ? firstPageMetrics : continuationPageMetrics,
          ),
        0,
      );
      lastIndex = normalized.length - 1;
    }
  }

  runBackfillSlackConvergence(
    normalized,
    firstCap,
    continuationCap,
    firstPageMetrics,
    continuationPageMetrics,
    PAGINATION_BACKFILL_LINE_TOLERANCE,
  );
  normalized = coalesceTrailingHeadingsOntoNextPage(normalized);
  normalized = dropEmptyPaginationPages(normalized);

  return normalized;
}
