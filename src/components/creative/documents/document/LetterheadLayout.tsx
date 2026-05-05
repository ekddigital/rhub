"use client";

/**
 * LetterheadLayout
 * Multi-page A4 document preview with letterhead chrome.
 * Orchestrates FirstPageHeader / SubsequentPageHeader, Footer,
 * CornerDecorations, and content rendering across pages.
 *
 * Two-pass pagination strategy:
 *   Pass 1 (instant): heuristic height estimates → initial pages
 *   Pass 2 (after mount): DOM measurement of actual rendered heights → corrected pages
 *
 * This guarantees no content is ever clipped by overflow:hidden because
 * the final pagination uses real browser-measured heights.
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import { A4 } from "@/lib/creative/documents/constants";
import type {
  DocumentModel,
  DocumentNode,
  ListNode,
  ListItemNode,
  TableNode,
  TemplateConfig,
  TOCEntry,
} from "@/lib/creative/documents/types";
import { A4PageLayout } from "./A4PageLayout";
import { ContentRenderer } from "./ContentRenderer";
import { CoverPage } from "@/components/creative/documents/document/CoverPage";
import { TOCRenderer } from "@/components/creative/documents/document/TOCRenderer";

interface LetterheadLayoutProps {
  document: DocumentModel;
  template?: Partial<TemplateConfig>;
  /** Zoom for preview (0.5 = 50%, 1 = 100%) */
  zoom?: number;
  /** Component ID for PDF export targeting */
  id?: string;
  /** Enable draggable positioning for images in preview */
  draggableImages?: boolean;
  /** Callback when image position changes */
  onImageMove?: (src: string, posX: number, posY: number) => void;
  /** Show pagination debug overlay with height metrics per page */
  debugPagination?: boolean;
}

/* ================================================================
   Page height constants
   ================================================================ */

// First page (full-bleed + thick frame):
//   A4 total: 1123px
//   Footer: 52px | Gold line: 10px
//   FirstPageHeader: ~156px | padTop: 8px
//   Exact: 1123 - 52 - 10 - 156 - 8 = 897px
//   Conservative (font/rendering variance): 880px
const FIRST_PAGE_CONTENT_HEIGHT = 880;

// Subsequent pages (full-bleed + thick frame):
//   SubsequentHeader: ~86-90px | padTop: 8px
//   Footer: 52px | Gold line: 10px
//   Best-case: 1123 - 52 - 10 - 86 - 8 = 967px
//   Worst-case: 1123 - 52 - 10 - 90 - 8 = 963px
//   Conservative: 948px
const SUBSEQUENT_CONTENT_HEIGHT = 948;

/* ================================================================
   Heuristic height estimation (Pass 1 — used before DOM is ready)
   ================================================================ */

const CHARS_PER_LINE = 105;
const LINE_HEIGHT_PX = 19.2;
const PARA_MARGIN = 3;
const HEIGHT_SAFETY_FACTOR = 1.08; // safety margin for pass-1 estimation

function countTextLines(text: string): number {
  if (!text) return 1;
  const segments = text.split("\n");
  let total = 0;
  for (const seg of segments) {
    total += Math.max(Math.ceil(seg.length / CHARS_PER_LINE), 1);
  }
  return total;
}

function getNodeText(node: {
  content?: { text: string }[];
  text?: string;
}): string {
  if (node.content && node.content.length > 0) {
    return node.content.map((c) => c.text).join("");
  }
  return node.text ?? "";
}

const TABLE_LINE_HEIGHT = 15.4;
const TABLE_CHAR_WIDTH = 5.5;
const AVAILABLE_TABLE_WIDTH = 658;

function estimateCellLines(text: string, charsPerCell: number): number {
  if (!text) return 1;
  const segments = text.split("\n");
  let total = 0;
  for (const seg of segments) {
    total += Math.max(1, Math.ceil(seg.length / charsPerCell));
  }
  return total;
}

function estimateTableHeight(
  node: import("@/lib/creative/documents/types").TableNode,
): number {
  const numCols = Math.max(node.headers.length, 1);
  const colTextWidth = Math.max(20, AVAILABLE_TABLE_WIDTH / numCols - 20);
  const charsPerCell = Math.max(1, Math.floor(colTextWidth / TABLE_CHAR_WIDTH));

  let headerLines = 1;
  for (const h of node.headers) {
    headerLines = Math.max(headerLines, estimateCellLines(h, charsPerCell));
  }
  let h = headerLines * TABLE_LINE_HEIGHT + 14;

  for (const row of node.rows) {
    let rowLines = 1;
    for (const cell of row) {
      rowLines = Math.max(rowLines, estimateCellLines(cell, charsPerCell));
    }
    h += rowLines * TABLE_LINE_HEIGHT + 11;
  }

  h += (node.caption ? 22 : 0) + 14;
  return Math.ceil(h * 1.08);
}

/** Check if a node is an empty paragraph (spacer from Enter key) */
function isEmptyParagraph(node: DocumentNode): boolean {
  if (node.type !== "paragraph") return false;
  const text = getNodeText(node);
  return !text || text.trim() === "";
}

function estimateNodeHeight(node: DocumentNode): number {
  let raw: number;
  switch (node.type) {
    case "heading":
      raw = node.level === 1 ? 40 : node.level === 2 ? 34 : 29;
      break;
    case "paragraph": {
      const text = getNodeText(node);
      if (!text) {
        raw = LINE_HEIGHT_PX + PARA_MARGIN;
        break;
      }
      raw = countTextLines(text) * LINE_HEIGHT_PX + PARA_MARGIN;
      break;
    }
    case "list": {
      const listChars = CHARS_PER_LINE - 5;
      let listH = 6;
      for (const item of node.items) {
        const itemText =
          item.content?.map((c) => c.text).join("") || item.text || "";
        const segments = itemText.split("\n");
        let itemLines = 0;
        for (const seg of segments) {
          itemLines += Math.max(1, Math.ceil(seg.length / listChars));
        }
        listH += itemLines * LINE_HEIGHT_PX + 2;
      }
      raw = listH;
      break;
    }
    case "table":
      raw = estimateTableHeight(node);
      break;
    case "figure":
      raw = 300;
      break;
    case "blockquote": {
      const bqChars = Math.floor(649 / 6.1);
      const bqText = getNodeText(node);
      if (!bqText) {
        raw = LINE_HEIGHT_PX + 20;
        break;
      }
      const segments = bqText.split("\n");
      let bqLines = 0;
      for (const seg of segments) {
        bqLines += Math.max(1, Math.ceil(seg.length / bqChars));
      }
      raw = bqLines * LINE_HEIGHT_PX + 20;
      break;
    }
    case "code-block":
      raw = node.code.split("\n").length * 16 + 20;
      break;
    case "horizontal-rule":
      raw = 6;
      break;
    case "page-break":
      return 0;
    case "signature-block":
      raw = 150;
      break;
    default:
      raw = 20;
  }
  return Math.ceil(raw * HEIGHT_SAFETY_FACTOR);
}

/* ================================================================
   List splitting helpers — allow lists to break across pages
   ================================================================ */

/**
 * Estimate the height of a single list item (used to find split points).
 */
function estimateSingleListItemHeight(item: ListItemNode): number {
  const listChars = CHARS_PER_LINE - 5;
  const itemText = item.content?.map((c) => c.text).join("") || item.text || "";
  const segments = itemText.split("\n");
  let itemLines = 0;
  for (const seg of segments) {
    itemLines += Math.max(1, Math.ceil(seg.length / listChars));
  }
  let h = itemLines * LINE_HEIGHT_PX + 2; // +2 for item margin
  // Add nested list height if present
  if (item.children) {
    h += estimateNodeHeight(item.children as DocumentNode);
  }
  return h;
}

/**
 * Attempt to split a list node into two parts so the first part fits
 * within `availableSpace`. Returns null if splitting is not beneficial
 * (e.g. fewer than 1 item would fit).
 */
function trySplitList(
  list: ListNode,
  totalHeight: number,
  availableSpace: number,
): {
  first: ListNode;
  firstHeight: number;
  second: ListNode;
  secondHeight: number;
} | null {
  if (list.items.length <= 1) return null;

  // Estimate individual item heights
  const itemHeights = list.items.map(estimateSingleListItemHeight);
  const LIST_OVERHEAD = 6; // top+bottom margin (3px each, matches renderList margin: "3px 0")
  const estimatedTotal = itemHeights.reduce((a, b) => a + b, 0) + LIST_OVERHEAD;

  // Scale factor: map estimated per-item heights to match the actual total
  // (which may be measured DOM height or heuristic with safety factor)
  const scale = estimatedTotal > 0 ? totalHeight / estimatedTotal : 1;

  // Find split point: how many items fit in availableSpace
  let runningHeight = LIST_OVERHEAD * scale; // overhead for the first list fragment
  let splitIdx = 0;

  for (let i = 0; i < list.items.length; i++) {
    const scaledItemH = itemHeights[i] * scale;
    if (runningHeight + scaledItemH > availableSpace && i > 0) {
      break;
    }
    runningHeight += scaledItemH;
    splitIdx = i + 1;
  }

  // Need at least 1 item on first part and 1 remaining
  if (splitIdx < 1 || splitIdx >= list.items.length) return null;

  const firstItems = list.items.slice(0, splitIdx);
  const secondItems = list.items.slice(splitIdx);

  const firstList: ListNode = {
    type: "list",
    ordered: list.ordered,
    items: firstItems,
    start: list.start,
  };

  const secondList: ListNode = {
    type: "list",
    ordered: list.ordered,
    items: secondItems,
    start: list.ordered ? (list.start || 1) + splitIdx : undefined,
  };

  // Compute heights for the two halves (each gets its own overhead)
  const firstItemSum = itemHeights
    .slice(0, splitIdx)
    .reduce((a, b) => a + b, 0);
  const secondItemSum = itemHeights.slice(splitIdx).reduce((a, b) => a + b, 0);
  const firstHeight = Math.ceil((firstItemSum + LIST_OVERHEAD) * scale);
  const secondHeight = Math.ceil((secondItemSum + LIST_OVERHEAD) * scale);

  return { first: firstList, firstHeight, second: secondList, secondHeight };
}

/* ================================================================
   Table splitting helpers — allow tables to break across pages
   ================================================================ */

/**
 * Estimate the height of a single table row.
 */
function estimateSingleTableRowHeight(row: string[], numCols: number): number {
  const colTextWidth = Math.max(20, AVAILABLE_TABLE_WIDTH / numCols - 20);
  const charsPerCell = Math.max(1, Math.floor(colTextWidth / TABLE_CHAR_WIDTH));
  let rowLines = 1;
  for (const cell of row) {
    rowLines = Math.max(rowLines, estimateCellLines(cell, charsPerCell));
  }
  return rowLines * TABLE_LINE_HEIGHT + 11; // +11 matches estimateTableHeight per-row calc
}

/**
 * Estimate the fixed overhead for a table (header row + borders + caption).
 */
function estimateTableOverhead(node: TableNode): number {
  const numCols = Math.max(node.headers.length, 1);
  const colTextWidth = Math.max(20, AVAILABLE_TABLE_WIDTH / numCols - 20);
  const charsPerCell = Math.max(1, Math.floor(colTextWidth / TABLE_CHAR_WIDTH));
  let headerLines = 1;
  for (const h of node.headers) {
    headerLines = Math.max(headerLines, estimateCellLines(h, charsPerCell));
  }
  const headerH = headerLines * TABLE_LINE_HEIGHT + 14;
  const captionH = node.caption ? 22 : 0;
  const borderH = 14;
  return headerH + captionH + borderH;
}

/**
 * Attempt to split a table node into two parts so the first part fits
 * within `availableSpace`. The header row is repeated on the second part.
 * Returns null if splitting is not beneficial (e.g. fewer than 1 data row fits).
 */
function trySplitTable(
  table: TableNode,
  totalHeight: number,
  availableSpace: number,
): {
  first: TableNode;
  firstHeight: number;
  second: TableNode;
  secondHeight: number;
} | null {
  if (table.rows.length <= 1) return null;

  const numCols = Math.max(table.headers.length, 1);
  const rowHeights = table.rows.map((row) =>
    estimateSingleTableRowHeight(row, numCols),
  );
  const overhead = estimateTableOverhead(table);
  const estimatedTotal = rowHeights.reduce((a, b) => a + b, 0) + overhead;

  // Scale factor to map estimated heights to the actual (measured/heuristic) total
  const scale = estimatedTotal > 0 ? totalHeight / estimatedTotal : 1;

  // Find split point: how many rows fit in availableSpace
  // The overhead (header + caption + borders) must be present in the first fragment
  let runningHeight = overhead * scale;
  let splitIdx = 0;

  for (let i = 0; i < table.rows.length; i++) {
    const scaledRowH = rowHeights[i] * scale;
    if (runningHeight + scaledRowH > availableSpace && i > 0) {
      break;
    }
    runningHeight += scaledRowH;
    splitIdx = i + 1;
  }

  // Need at least 1 row on first part and 1 remaining
  if (splitIdx < 1 || splitIdx >= table.rows.length) return null;

  const firstTable: TableNode = {
    type: "table",
    caption: table.caption,
    label: table.label,
    number: table.number,
    headers: table.headers,
    rows: table.rows.slice(0, splitIdx),
  };

  const secondTable: TableNode = {
    type: "table",
    caption: table.caption ? `${table.caption} (continued)` : undefined,
    label: table.label,
    number: table.number,
    headers: table.headers,
    rows: table.rows.slice(splitIdx),
    continued: true,
  };

  // Heights for each half: overhead is needed on BOTH (header is repeated)
  const firstRowSum = rowHeights.slice(0, splitIdx).reduce((a, b) => a + b, 0);
  const secondRowSum = rowHeights.slice(splitIdx).reduce((a, b) => a + b, 0);
  const firstHeight = Math.ceil((firstRowSum + overhead) * scale);
  const secondHeight = Math.ceil((secondRowSum + overhead) * scale);

  return { first: firstTable, firstHeight, second: secondTable, secondHeight };
}

/* ================================================================
   Pagination engine (works with either estimated or measured heights)
   ================================================================ */

interface PageContent {
  nodes: DocumentNode[];
  isFirstPage: boolean;
}

function paginateNodes(
  nodes: DocumentNode[],
  heights: number[],
  tocHeight: number,
  isMeasured: boolean,
  firstAvailable: number,
  subsequentAvailable: number,
): PageContent[] {
  const pages: PageContent[] = [];
  let current: DocumentNode[] = [];
  let currentH = 0;
  let isFirst = true;
  // Safety buffer for subpixel/font-rendering differences.
  // Reduced from 8px because margin collapse correction already provides
  // a natural safety margin (measured heights are slightly overestimated).
  const SAFETY_BUFFER = isMeasured ? 4 : 0;

  // CSS margin collapse correction:
  // Each node is measured in an overflow:hidden wrapper (BFC) which captures
  // its full margins (top + bottom). But when rendered together on the page,
  // adjacent element margins collapse: the gap becomes max(bottomN, topN+1)
  // instead of bottomN + topN+1. Savings per gap ≈ min(bottomN, topN+1).
  // Typical elements have 3px margins → ~3px savings per inter-node gap.
  // Without this correction, a page with 15 nodes wastes ~42px of space.
  const MARGIN_COLLAPSE_PER_GAP = isMeasured ? 3 : 0;

  // Minimum remaining space to attempt a split (avoids tiny orphan fragments)
  const MIN_SPLIT_SPACE = 40;

  let available = firstAvailable - tocHeight - SAFETY_BUFFER;

  /**
   * Generic helper: place the first part of a split node on the current page,
   * then handle the remainder (which may itself need further splitting
   * across multiple subsequent pages).
   * Works for both lists and tables.
   */
  const commitSplit = (
    firstPart: DocumentNode,
    secondPart: DocumentNode,
    secondHeight: number,
    splitter: (
      node: DocumentNode,
      h: number,
      space: number,
    ) => {
      first: DocumentNode;
      firstHeight: number;
      second: DocumentNode;
      secondHeight: number;
    } | null,
  ) => {
    // Place first part on current page
    current.push(firstPart);
    pages.push({ nodes: current, isFirstPage: isFirst });
    current = [];
    currentH = 0;
    isFirst = false;
    available = subsequentAvailable - SAFETY_BUFFER;

    // Handle remainder — may span multiple pages for very long nodes
    let remainder = secondPart;
    let remainderH = secondHeight;

    while (remainderH > available) {
      const subSplit = splitter(remainder, remainderH, available);
      if (!subSplit) break;
      pages.push({ nodes: [subSplit.first], isFirstPage: false });
      remainder = subSplit.second;
      remainderH = subSplit.secondHeight;
    }

    current.push(remainder);
    currentH = remainderH;
  };

  /**
   * Attempt to split a node that doesn't fit on the current page.
   * Returns true if the node was successfully split, false otherwise.
   */
  const attemptSplit = (node: DocumentNode, h: number): boolean => {
    const spaceLeft =
      current.length > 0
        ? available -
          currentH +
          (current.length > 0 ? MARGIN_COLLAPSE_PER_GAP : 0)
        : available;

    if (spaceLeft < MIN_SPLIT_SPACE) return false;

    // Try list splitting (covers both ordered and unordered lists / bullets)
    if (node.type === "list" && node.items.length > 1) {
      const splitResult = trySplitList(node, h, spaceLeft);
      if (splitResult) {
        commitSplit(
          splitResult.first,
          splitResult.second,
          splitResult.secondHeight,
          (n, nh, space) => {
            const ln = n as ListNode;
            if (ln.items.length <= 1) return null;
            const r = trySplitList(ln, nh, space);
            if (!r) return null;
            return {
              first: r.first,
              firstHeight: r.firstHeight,
              second: r.second,
              secondHeight: r.secondHeight,
            };
          },
        );
        return true;
      }
    }

    // Try table splitting (breaks rows across pages, repeating headers)
    if (node.type === "table" && node.rows.length > 1) {
      const splitResult = trySplitTable(node, h, spaceLeft);
      if (splitResult) {
        commitSplit(
          splitResult.first,
          splitResult.second,
          splitResult.secondHeight,
          (n, nh, space) => {
            const tn = n as TableNode;
            if (tn.rows.length <= 1) return null;
            const r = trySplitTable(tn, nh, space);
            if (!r) return null;
            return {
              first: r.first,
              firstHeight: r.firstHeight,
              second: r.second,
              secondHeight: r.secondHeight,
            };
          },
        );
        return true;
      }
    }

    return false;
  };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.type === "page-break") {
      pages.push({ nodes: current, isFirstPage: isFirst });
      current = [];
      currentH = 0;
      isFirst = false;
      available = subsequentAvailable - SAFETY_BUFFER;
      continue;
    }

    const h = heights[i] ?? estimateNodeHeight(node);
    // When adding a node after existing content, deduct the margin collapse
    // savings between this node and the previous one.
    const collapseCredit = current.length > 0 ? MARGIN_COLLAPSE_PER_GAP : 0;

    const fitsOnPage = currentH + h - collapseCredit <= available;

    if (fitsOnPage) {
      current.push(node);
      currentH += h - collapseCredit;
      continue;
    }

    // ── Node doesn't fit on current page ──

    // Empty paragraphs that don't fit are spacers that have done their job
    // (consumed remaining space). Drop them instead of carrying to next page
    // where they'd create unwanted top-of-page whitespace.
    if (isEmptyParagraph(node)) {
      // Skip this and any following consecutive empty paragraphs
      while (i + 1 < nodes.length && isEmptyParagraph(nodes[i + 1])) {
        i++;
      }
      // Finish current page — content after the empties starts fresh
      if (current.length > 0) {
        pages.push({ nodes: current, isFirstPage: isFirst });
        current = [];
        currentH = 0;
        isFirst = false;
        available = subsequentAvailable - SAFETY_BUFFER;
      }
      continue;
    }

    // 1. Try to split the node (lists, tables) so part of it fills the gap
    if (attemptSplit(node, h)) {
      continue;
    }

    // 2. "Keep-with-next" for headings: if the last node(s) on the page are
    //    headings (or heading + short intro paragraph), move them to the next
    //    page with this node. Prevents orphaned section headers at page bottom.
    let pullBackCount = 0;
    if (current.length > 0) {
      // Check how many trailing nodes are headings or very short paragraphs
      // that should stay with the following content
      let checkIdx = current.length - 1;
      let pullHeight = 0;
      while (checkIdx >= 0) {
        const prev = current[checkIdx];
        if (prev.type === "heading") {
          pullHeight += estimateNodeHeight(prev);
          pullBackCount++;
          checkIdx--;
        } else if (
          prev.type === "paragraph" &&
          pullBackCount > 0 && // only pull a paragraph if it follows a heading we're already pulling
          !isEmptyParagraph(prev) // never pull empty spacer paragraphs — they belong on the current page
        ) {
          const prevText = getNodeText(prev);
          // Only pull short intro/transition paragraphs (≤ 2 lines)
          if (prevText.length <= CHARS_PER_LINE * 2) {
            pullHeight += estimateNodeHeight(prev);
            pullBackCount++;
            checkIdx--;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      // Only pull back if it leaves at least SOME content on the current page
      // and the pulled nodes + new node would fit on the next page
      if (
        pullBackCount > 0 &&
        current.length - pullBackCount > 0 &&
        pullHeight + h <= subsequentAvailable - SAFETY_BUFFER
      ) {
        const pulled = current.splice(current.length - pullBackCount);
        // Recalculate currentH for the trimmed page
        // (simpler to just re-sum since we track collapse credits)
        currentH = 0;
        for (let j = 0; j < current.length; j++) {
          const nodeH = estimateNodeHeight(current[j]);
          const cc = j > 0 ? MARGIN_COLLAPSE_PER_GAP : 0;
          currentH += nodeH - cc;
        }
        pages.push({ nodes: current, isFirstPage: isFirst });
        current = [...pulled, node];
        currentH = pullHeight + h;
        isFirst = false;
        available = subsequentAvailable - SAFETY_BUFFER;
        continue;
      } else {
        pullBackCount = 0; // reset — don't pull
      }
    }

    // 3. Standard fallback: finish current page, start new one.
    if (current.length > 0) {
      pages.push({ nodes: current, isFirstPage: isFirst });
      current = [node];
      currentH = h;
      isFirst = false;
      available = subsequentAvailable - SAFETY_BUFFER;
    } else {
      // First node on an empty page and it overflows — just add it.
      // (Prevents infinite loop; the page will overflow slightly.)
      current.push(node);
      currentH += h;
    }
  }

  if (current.length > 0) {
    pages.push({ nodes: current, isFirstPage: isFirst });
  }
  if (pages.length === 0) {
    pages.push({ nodes: [], isFirstPage: true });
  }

  // Post-process: strip leading empty paragraphs from non-first pages.
  // Empty paragraphs are spacing aids — they should never create whitespace
  // at the top of a new page. (First page may intentionally have top spacing.)
  for (let p = 1; p < pages.length; p++) {
    while (pages[p].nodes.length > 0 && isEmptyParagraph(pages[p].nodes[0])) {
      pages[p].nodes.shift();
    }
  }

  return pages;
}

/* ================================================================
   Component
   ================================================================ */

export function LetterheadLayout({
  document: doc,
  template,
  zoom = 0.7,
  id = "letterhead-document",
  draggableImages = false,
  onImageMove,
  debugPagination = false,
}: LetterheadLayoutProps) {
  const config: TemplateConfig = {
    id: "default",
    name: "Default Letterhead",
    description: "Standard EKD Digital letterhead",
    showHeader: true,
    showFooter: true,
    firstPageDifferent: true,
    showTOC: false,
    showCover: false,
    margins: "standard",
    ...template,
  };

  const showTOC = config.showTOC && doc.toc && doc.toc.length > 0;
  const showCover = config.showCover === true;
  const showListOfTables =
    config.showListOfTables === true &&
    doc.listOfTables &&
    doc.listOfTables.length > 0;
  const showListOfFigures =
    config.showListOfFigures === true &&
    doc.listOfFigures &&
    doc.listOfFigures.length > 0;
  const measureRef = useRef<HTMLDivElement>(null);
  const firstContentRef = useRef<HTMLDivElement>(null);
  const subsequentContentRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<number[] | null>(null);
  const [contentHeights, setContentHeights] = useState(() => ({
    first: FIRST_PAGE_CONTENT_HEIGHT,
    subsequent: SUBSEQUENT_CONTENT_HEIGHT,
  }));
  // Key to force re-measurement when content changes — use a robust hash
  // that considers number of children and a fingerprint of their types/content
  const contentKey = useMemo(() => {
    const fingerprint = doc.children
      .map(
        (n, i) =>
          `${i}:${n.type}:${
            "content" in n && Array.isArray(n.content)
              ? n.content.length
              : "rows" in n && Array.isArray(n.rows)
                ? n.rows.length
                : 0
          }`,
      )
      .join("|");
    return fingerprint;
  }, [doc.children]);

  // TOC is now rendered on its own dedicated page(s), so no tocHeight subtraction needed

  // Pass 1: heuristic pagination (SSR-safe, instant)
  const estimatedHeights = useMemo(
    () => doc.children.map(estimateNodeHeight),
    [doc.children],
  );

  // After mount: measure actual DOM heights (Pass 2)
  // Waits for fonts + two animation frames to ensure accurate layout
  useEffect(() => {
    setMeasured(null); // reset on content change
    let cancelled = false;

    const doMeasure = () => {
      if (cancelled || !measureRef.current) return;
      const wrapper = measureRef.current;
      const nodeEls = wrapper.querySelectorAll<HTMLElement>(
        ":scope > [data-measure]",
      );
      if (nodeEls.length === 0) return;
      const heights: number[] = [];
      nodeEls.forEach((el) => {
        heights.push(el.offsetHeight);
      });
      if (!cancelled) setMeasured(heights);
    };

    // Wait for fonts to be loaded (important for accurate text wrapping)
    document.fonts.ready.then(() => {
      if (cancelled) return;
      // Double-RAF ensures layout is fully computed after font swap
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doMeasure();
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [contentKey, doc.children]);

  // Measure actual content-area heights using hidden A4PageLayout instances.
  useEffect(() => {
    let cancelled = false;

    const measureContentHeight = (el: HTMLDivElement | null) => {
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;
      const raw = el.clientHeight - padTop - padBottom;
      return Math.max(0, Math.floor(raw));
    };

    const doMeasure = () => {
      if (cancelled) return;
      const first = measureContentHeight(firstContentRef.current);
      const subsequent = measureContentHeight(subsequentContentRef.current);
      if (first && subsequent) {
        setContentHeights({ first, subsequent });
      }
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doMeasure();
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [config.showHeader, config.showFooter, config.margins]);

  // Final pages using measured heights (or estimates as fallback)
  const pages = useMemo(() => {
    const heights = measured ?? estimatedHeights;
    const isMeasured = measured !== null;
    return paginateNodes(
      doc.children,
      heights,
      0, // TOC is on its own page now, no height deduction
      isMeasured,
      contentHeights.first,
      contentHeights.subsequent,
    );
  }, [doc.children, measured, estimatedHeights, contentHeights]);

  const bodyPageCount = pages.length;
  const coverPageCount = showCover ? 1 : 0;

  // Compute page numbers for TOC entries based on pagination results
  const tocWithPages: TOCEntry[] = useMemo(() => {
    if (!doc.toc || doc.toc.length === 0) return [];
    // Build a heading-id → body page number map
    const idToPage = new Map<string, number>();
    pages.forEach((page, pageIdx) => {
      for (const node of page.nodes) {
        if (node.type === "heading" && "id" in node && node.id) {
          idToPage.set(node.id, pageIdx + 1); // 1-based body page
        }
      }
    });
    return doc.toc.map((entry) => ({
      ...entry,
      page: idToPage.get(entry.id) ?? undefined,
    }));
  }, [doc.toc, pages]);

  // Split TOC entries into pages. Comfortable ~18px per entry (1.5 line-height).
  // Multi-page overflow handles large TOCs naturally.
  const ENTRY_HEIGHT = 18; // consistent comfortable spacing
  const TITLE_OVERHEAD = 60; // title + accent bar on first page

  const tocPages: TOCEntry[][] = useMemo(() => {
    if (!showTOC || tocWithPages.length === 0) return [];
    const firstPageEntries = Math.floor(
      (contentHeights.first - TITLE_OVERHEAD) / ENTRY_HEIGHT,
    );
    const nextPageEntries = Math.floor(
      contentHeights.subsequent / ENTRY_HEIGHT,
    );
    const chunks: TOCEntry[][] = [];
    let offset = 0;
    // First TOC page
    chunks.push(tocWithPages.slice(0, firstPageEntries));
    offset = firstPageEntries;
    // Remaining TOC pages
    while (offset < tocWithPages.length) {
      chunks.push(tocWithPages.slice(offset, offset + nextPageEntries));
      offset += nextPageEntries;
    }
    return chunks;
  }, [showTOC, tocWithPages, contentHeights]);

  // Chunk helper for List of Tables / List of Figures
  const chunkEntries = (entries: TOCEntry[]): TOCEntry[][] => {
    const firstPageEntries = Math.floor(
      (contentHeights.first - TITLE_OVERHEAD) / ENTRY_HEIGHT,
    );
    const nextPageEntries = Math.floor(
      contentHeights.subsequent / ENTRY_HEIGHT,
    );
    const chunks: TOCEntry[][] = [];
    let offset = 0;
    chunks.push(entries.slice(0, firstPageEntries));
    offset = firstPageEntries;
    while (offset < entries.length) {
      chunks.push(entries.slice(offset, offset + nextPageEntries));
      offset += nextPageEntries;
    }
    return chunks;
  };

  const lotPages: TOCEntry[][] = useMemo(() => {
    if (!showListOfTables || !doc.listOfTables) return [];
    // Assign page numbers to table entries based on pagination
    const idToPage = new Map<string, number>();
    pages.forEach((page, pageIdx) => {
      for (const node of page.nodes) {
        if (node.type === "table" && "number" in node) {
          idToPage.set(`table-${node.number}`, pageIdx + 1);
        }
      }
    });
    const withPages = doc.listOfTables.map((entry) => ({
      ...entry,
      page: idToPage.get(entry.id) ?? undefined,
    }));
    return chunkEntries(withPages);
  }, [showListOfTables, doc.listOfTables, pages, contentHeights]);

  const lofPages: TOCEntry[][] = useMemo(() => {
    if (!showListOfFigures || !doc.listOfFigures) return [];
    // Assign page numbers to figure entries based on pagination
    const idToPage = new Map<string, number>();
    pages.forEach((page, pageIdx) => {
      for (const node of page.nodes) {
        if (node.type === "figure" && "number" in node) {
          idToPage.set(`figure-${node.number}`, pageIdx + 1);
        }
      }
    });
    const withPages = doc.listOfFigures.map((entry) => ({
      ...entry,
      page: idToPage.get(entry.id) ?? undefined,
    }));
    return chunkEntries(withPages);
  }, [showListOfFigures, doc.listOfFigures, pages, contentHeights]);

  const tocPageCount = tocPages.length;
  const lotPageCount = lotPages.length;
  const lofPageCount = lofPages.length;
  // Total front-matter pages for roman numbering
  const frontMatterPageCount = tocPageCount + lotPageCount + lofPageCount;

  // ── Debug info: per-page height breakdown ──
  // Build a mapping from DocumentNode → index in doc.children so we can
  // look up both estimated and measured heights for each node on a page.
  const debugPageInfo = useMemo(() => {
    if (!debugPagination) return null;

    const nodeIndexMap = new Map<DocumentNode, number>();
    doc.children.forEach((n, i) => nodeIndexMap.set(n, i));

    const SAFETY_BUFFER = measured ? 4 : 0;
    const MARGIN_COLLAPSE_PER_GAP = measured ? 3 : 0;

    return pages.map((page, pageIdx) => {
      const available =
        pageIdx === 0
          ? contentHeights.first - SAFETY_BUFFER
          : contentHeights.subsequent - SAFETY_BUFFER;

      const nodeDetails = page.nodes.map((node) => {
        const idx = nodeIndexMap.get(node) ?? -1;
        // For split nodes (not in original doc.children), fall back to
        // estimateNodeHeight so the debug overlay shows useful values.
        const est = idx >= 0 ? estimatedHeights[idx] : estimateNodeHeight(node);
        const meas = idx >= 0 && measured ? measured[idx] : null;
        const used = meas ?? est;
        return {
          type: node.type,
          level:
            "level" in node ? (node as { level: number }).level : undefined,
          label:
            node.type === "heading"
              ? getNodeText(
                  node as { content?: { text: string }[]; text?: string },
                ).slice(0, 40)
              : node.type === "paragraph"
                ? getNodeText(
                    node as { content?: { text: string }[]; text?: string },
                  ).slice(0, 30)
                : node.type === "list"
                  ? `${(node as ListNode).ordered ? "ol" : "ul"}[${(node as ListNode).items.length}]`
                  : node.type === "table"
                    ? `tbl[${(node as TableNode).rows.length}r]${(node as TableNode).continued ? " cont" : ""}`
                    : node.type,
          estimated: Math.round(est),
          measured: meas !== null ? Math.round(meas) : null,
          used: Math.round(used),
          diff: meas !== null ? Math.round(meas - est) : null,
        };
      });

      // Account for margin collapse between adjacent nodes
      const interNodeGaps = Math.max(0, nodeDetails.length - 1);
      const collapseCorrection = interNodeGaps * MARGIN_COLLAPSE_PER_GAP;
      const rawUsed = nodeDetails.reduce((sum, n) => sum + n.used, 0);
      const usedHeight = rawUsed - collapseCorrection;
      const remaining = available - usedHeight;

      return {
        pageNum: pageIdx + 1,
        isFirstPage: page.isFirstPage,
        available: Math.round(available),
        used: Math.round(usedHeight),
        rawUsed: Math.round(rawUsed),
        collapseCorrection: Math.round(collapseCorrection),
        remaining: Math.round(remaining),
        nodeCount: page.nodes.length,
        nodes: nodeDetails,
        isMeasured: measured !== null,
        contentHeightFirst: Math.round(contentHeights.first),
        contentHeightSubsequent: Math.round(contentHeights.subsequent),
      };
    });
  }, [
    debugPagination,
    pages,
    doc.children,
    measured,
    estimatedHeights,
    contentHeights,
  ]);

  return (
    <>
      {/* Hidden measurement container — same width & styles as content area.
          Renders each node individually wrapped in a data-measure div so we
          can read its actual offsetHeight after the browser paints.
          
          CRITICAL: Each data-measure wrapper uses overflow:hidden to create
          a Block Formatting Context (BFC). Without this, child element
          margins collapse *through* the wrapper div, causing offsetHeight
          to miss margin space entirely. For a page with 20 paragraphs
          (each with 3px top+bottom margins), that's ~120px of unaccounted
          height — causing content to overflow past the gold border frame. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "658px", // 794 - 68L - 68R (actual content area width)
          visibility: "hidden",
          pointerEvents: "none",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12px",
          lineHeight: 1.6,
          color: "#1F1C18",
        }}
      >
        {doc.children.map((node, i) => (
          <div key={`measure-${i}`} data-measure style={{ overflow: "hidden" }}>
            <ContentRenderer
              nodes={[node]}
              draggableImages={draggableImages}
              onImageMove={onImageMove}
            />
          </div>
        ))}
      </div>

      {/* Hidden page layout measurement to determine true content heights */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <A4PageLayout
          pageNumber={1}
          totalPages={1}
          isFirstPage={true}
          showHeader={config.showHeader}
          showFooter={config.showFooter}
          showDecorations={true}
          margins={config.margins}
          contentRef={firstContentRef}
        >
          <div />
        </A4PageLayout>
        <A4PageLayout
          pageNumber={2}
          totalPages={2}
          isFirstPage={false}
          showHeader={config.showHeader}
          showFooter={config.showFooter}
          showDecorations={true}
          margins={config.margins}
          contentRef={subsequentContentRef}
        >
          <div />
        </A4PageLayout>
      </div>

      {/* Actual paginated document preview */}
      <div
        id={id}
        className="letterhead-document flex flex-col items-center gap-6"
        style={{
          padding: "20px",
          backgroundColor: "#e8e4de",
        }}
      >
        {/* Cover Page (no page number, no header/footer chrome — standalone) */}
        {showCover && (
          <div
            key="cover-page"
            className="a4-page-wrapper"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              marginBottom: `${-(A4.px96.height * (1 - zoom))}px`,
            }}
          >
            <CoverPage meta={doc.meta} />
          </div>
        )}

        {/* TOC Page(s) — Roman numeral page numbers, multi-page for large TOCs */}
        {showTOC &&
          tocPages.map((chunk, tocIdx) => {
            const romanPageNum = tocIdx + 1;
            return (
              <div
                key={`toc-page-${tocIdx}`}
                className="a4-page-wrapper"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  marginBottom: `${-(A4.px96.height * (1 - zoom))}px`,
                }}
              >
                <A4PageLayout
                  pageNumber={romanPageNum}
                  totalPages={frontMatterPageCount}
                  isFirstPage={!showCover && tocIdx === 0}
                  showHeader={config.showHeader}
                  showFooter={config.showFooter}
                  showDecorations={true}
                  margins={config.margins}
                  numberStyle="roman"
                >
                  <TOCRenderer
                    entries={chunk}
                    title={tocIdx === 0 ? "Table of Contents" : undefined}
                  />
                </A4PageLayout>
              </div>
            );
          })}

        {/* List of Tables Page(s) — Roman numeral page numbers */}
        {showListOfTables &&
          lotPages.map((chunk, lotIdx) => {
            const romanPageNum = tocPageCount + lotIdx + 1;
            return (
              <div
                key={`lot-page-${lotIdx}`}
                className="a4-page-wrapper"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  marginBottom: `${-(A4.px96.height * (1 - zoom))}px`,
                }}
              >
                <A4PageLayout
                  pageNumber={romanPageNum}
                  totalPages={frontMatterPageCount}
                  isFirstPage={false}
                  showHeader={config.showHeader}
                  showFooter={config.showFooter}
                  showDecorations={true}
                  margins={config.margins}
                  numberStyle="roman"
                >
                  <TOCRenderer
                    entries={chunk}
                    title={lotIdx === 0 ? "List of Tables" : undefined}
                    flat
                  />
                </A4PageLayout>
              </div>
            );
          })}

        {/* List of Figures Page(s) — Roman numeral page numbers */}
        {showListOfFigures &&
          lofPages.map((chunk, lofIdx) => {
            const romanPageNum = tocPageCount + lotPageCount + lofIdx + 1;
            return (
              <div
                key={`lof-page-${lofIdx}`}
                className="a4-page-wrapper"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  marginBottom: `${-(A4.px96.height * (1 - zoom))}px`,
                }}
              >
                <A4PageLayout
                  pageNumber={romanPageNum}
                  totalPages={frontMatterPageCount}
                  isFirstPage={false}
                  showHeader={config.showHeader}
                  showFooter={config.showFooter}
                  showDecorations={true}
                  margins={config.margins}
                  numberStyle="roman"
                >
                  <TOCRenderer
                    entries={chunk}
                    title={lofIdx === 0 ? "List of Figures" : undefined}
                    flat
                  />
                </A4PageLayout>
              </div>
            );
          })}

        {/* Body content pages — Arabic page numbers starting at 1 */}
        {pages.map((page, pageIndex) => {
          const dbg = debugPageInfo?.[pageIndex] ?? null;
          return (
            <div
              key={`page-${pageIndex}`}
              className="a4-page-wrapper"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                marginBottom: `${-(A4.px96.height * (1 - zoom))}px`,
                position: "relative",
              }}
            >
              <A4PageLayout
                pageNumber={pageIndex + 1}
                totalPages={bodyPageCount}
                isFirstPage={
                  page.isFirstPage &&
                  config.firstPageDifferent &&
                  !showCover &&
                  !showTOC &&
                  !showListOfTables &&
                  !showListOfFigures
                }
                showHeader={config.showHeader}
                showFooter={config.showFooter}
                showDecorations={true}
                margins={config.margins}
                numberStyle="arabic"
              >
                <ContentRenderer
                  nodes={page.nodes}
                  draggableImages={draggableImages}
                  onImageMove={onImageMove}
                />
              </A4PageLayout>

              {/* ── Pagination Debug Overlay ────────────────────── */}
              {dbg && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: -320,
                    width: 310,
                    maxHeight: `${A4.px96.height}px`,
                    overflowY: "auto",
                    background: "#1a1a2e",
                    color: "#e0e0e0",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #C8A061",
                    zIndex: 100,
                    lineHeight: 1.4,
                  }}
                >
                  {/* Page summary header */}
                  <div
                    style={{
                      color: "#C8A061",
                      fontWeight: 700,
                      fontSize: "11px",
                      marginBottom: "6px",
                      borderBottom: "1px solid #333",
                      paddingBottom: "4px",
                    }}
                  >
                    Page {dbg.pageNum} / {bodyPageCount}
                    {dbg.isFirstPage ? " (First)" : ""}
                    <span
                      style={{
                        float: "right",
                        color: dbg.isMeasured ? "#4ade80" : "#f59e0b",
                      }}
                    >
                      {dbg.isMeasured ? "DOM ✓" : "EST"}
                    </span>
                  </div>

                  {/* Height budget */}
                  <div style={{ marginBottom: "6px" }}>
                    <div>
                      Available:{" "}
                      <b style={{ color: "#60a5fa" }}>{dbg.available}px</b>
                      <span style={{ color: "#888", marginLeft: "4px" }}>
                        ({dbg.isFirstPage ? "first" : "subseq"}:{" "}
                        {dbg.isFirstPage
                          ? dbg.contentHeightFirst
                          : dbg.contentHeightSubsequent}
                        px − 4buf)
                      </span>
                    </div>
                    <div>
                      Used: <b style={{ color: "#fbbf24" }}>{dbg.used}px</b>
                      {dbg.collapseCorrection > 0 && (
                        <span style={{ color: "#4ade80", marginLeft: "4px" }}>
                          (raw {dbg.rawUsed} − {dbg.collapseCorrection}{" "}
                          collapse)
                        </span>
                      )}
                    </div>
                    <div>
                      Remaining:{" "}
                      <b
                        style={{
                          color:
                            dbg.remaining < 0
                              ? "#ef4444"
                              : dbg.remaining > 80
                                ? "#f59e0b"
                                : "#4ade80",
                        }}
                      >
                        {dbg.remaining}px
                      </b>
                      {dbg.remaining < 0 && (
                        <span style={{ color: "#ef4444", marginLeft: "4px" }}>
                          ⚠ OVERFLOW
                        </span>
                      )}
                      {dbg.remaining > 80 && (
                        <span style={{ color: "#f59e0b", marginLeft: "4px" }}>
                          ⚠ GAP
                        </span>
                      )}
                    </div>
                    {/* Fill bar */}
                    <div
                      style={{
                        marginTop: "3px",
                        background: "#333",
                        borderRadius: "2px",
                        height: "6px",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          height: "6px",
                          borderRadius: "2px",
                          width: `${Math.min(100, (dbg.used / dbg.available) * 100)}%`,
                          background:
                            dbg.remaining < 0
                              ? "#ef4444"
                              : dbg.remaining > 80
                                ? "#f59e0b"
                                : "#4ade80",
                        }}
                      />
                    </div>
                    <div style={{ color: "#888", textAlign: "right" }}>
                      {Math.round((dbg.used / dbg.available) * 100)}% filled
                    </div>
                  </div>

                  {/* Per-node breakdown */}
                  <div
                    style={{ borderTop: "1px solid #333", paddingTop: "4px" }}
                  >
                    <div style={{ color: "#888", marginBottom: "2px" }}>
                      {dbg.nodeCount} nodes:
                    </div>
                    {dbg.nodes.map((n, ni) => (
                      <div
                        key={ni}
                        style={{
                          display: "flex",
                          gap: "4px",
                          padding: "1px 0",
                          borderBottom: "1px solid #222",
                          color:
                            n.diff !== null && Math.abs(n.diff) > 20
                              ? "#f59e0b"
                              : "#ccc",
                        }}
                      >
                        <span
                          style={{
                            color: "#C8A061",
                            width: "60px",
                            flexShrink: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.type}
                          {n.level ? n.level : ""}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#888",
                          }}
                        >
                          {n.label}
                        </span>
                        <span
                          style={{
                            width: "40px",
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {n.used}px
                        </span>
                        {n.diff !== null && (
                          <span
                            style={{
                              width: "40px",
                              textAlign: "right",
                              flexShrink: 0,
                              color:
                                n.diff > 10
                                  ? "#ef4444"
                                  : n.diff < -10
                                    ? "#4ade80"
                                    : "#888",
                            }}
                          >
                            {n.diff > 0 ? "+" : ""}
                            {n.diff}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
