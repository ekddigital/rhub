/**
 * Dynamic pagination helpers for conference documents.
 *
 * All three DocumentLayout consumers (budget, payments, report) previously
 * used a fixed chunk-size that wasted space and/or caused silent content
 * clipping.  This module provides a single bin-packing algorithm that:
 *
 *  • Fills page 1 to capacity, accounting for its unique title/notes overhead.
 *  • Fills continuation pages to their (larger) capacity.
 *  • Always ensures the last page has room for the trailing block
 *    (grand total, receipts, signature, summary, etc.).
 *  • Uses a single-page layout when all rows + trailing fit on page 1.
 *
 * Usage:
 *   import { computePageChunks, estimateTextBlockH } from "@/lib/conf/document-pagination";
 */

import { PAGE_METRICS } from "./document-constants";

const { contentH, tableCaptionH, tableHeaderH, rowH } = PAGE_METRICS;

/** Pixels consumed by the DocumentTable caption + header row on every page. */
const TABLE_FIXED_H = tableCaptionH + tableHeaderH; // 53 px

// ── Text block estimator ─────────────────────────────────────────────────────

/**
 * Estimate the rendered height of a styled text block (notes, description…).
 *
 * @param text         – The text content.  Returns 0 when text is blank.
 * @param charsPerLine – Approximate characters per line (depends on font-size
 *                       and container width).  Defaults to 70.
 * @param frameH       – Fixed frame overhead (margins + padding).  Default 50px.
 * @param lineH        – Height per line of text.  Default 15px.
 */
export function estimateTextBlockH(
  text: string,
  charsPerLine = 70,
  frameH = 50,
  lineH = 15,
): number {
  if (!text.trim()) return 0;
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return frameH + lines * lineH;
}

// ── Core pagination ──────────────────────────────────────────────────────────

/**
 * Bin-pack table rows into per-page allocations for multi-page document
 * layouts rendered with DocumentLayout + DocumentTable.
 *
 * Algorithm guarantees:
 *  1. Page 1 fits `page1OverheadPx` of header content before the table.
 *  2. Pages 2+ fit only `contHeaderPx` of overhead (continuation label).
 *  3. The LAST page in the result always has room for `trailingPx` of footer
 *     content (totals row, receipts, signature block, etc.).
 *  4. Single-page when everything fits on one page (including trailing).
 *  5. No infinite loops — each iteration advances `pos` by at least 1.
 *
 * @param items             – Full list of table row data.
 * @param opts.page1OverheadPx – Pixels used by header content on page 1
 *                               (title block + notes + any other fixed content).
 * @param opts.trailingPx   – Pixels used by footer content on the last page
 *                            (grand total, signature, receipts…).
 * @param opts.contHeaderPx – Pixels used by the "Continued…" label on pages
 *                            2+.  Defaults to 30.
 */
export function computePageChunks<T>(
  items: T[],
  opts: {
    page1OverheadPx: number;
    trailingPx: number;
    contHeaderPx?: number;
  },
): T[][] {
  const { page1OverheadPx, trailingPx, contHeaderPx = 30 } = opts;

  /** Rows that fit in `overheadPx` + optional `trailing` px of extra content. */
  function rowCap(overheadPx: number, trailing = 0): number {
    return Math.max(
      1,
      Math.floor((contentH - overheadPx - TABLE_FIXED_H - trailing) / rowH),
    );
  }

  // Capacity constants (pre-computed; same for every call with these opts).
  const cap1 = rowCap(page1OverheadPx); // page 1, no trailing
  const cap1Last = rowCap(page1OverheadPx, trailingPx); // page 1, single-page
  const capCont = rowCap(contHeaderPx); // cont. page, no trailing
  const capContLast = rowCap(contHeaderPx, trailingPx); // cont. page, last page

  if (items.length === 0) return [[]];

  const pages: T[][] = [];
  let pos = 0;
  let first = true;

  while (pos < items.length) {
    const remaining = items.length - pos;
    const capFull = first ? cap1 : capCont;
    const capLast = first ? cap1Last : capContLast;

    if (remaining <= capLast) {
      // ── Case A: everything remaining (+ trailing) fits on this page ────────
      pages.push(items.slice(pos));
      break;
    } else if (remaining <= capFull) {
      // ── Case B: items fit without trailing but NOT with it ─────────────────
      //    Take only capLast rows here; spill the rest to a new final page
      //    (which will show the trailing block alongside the overflow rows).
      pages.push(items.slice(pos, pos + capLast));
      pos += capLast;
    } else {
      // ── Case C: more rows than fit on this page at all ─────────────────────
      pages.push(items.slice(pos, pos + capFull));
      pos += capFull;
    }

    first = false;
  }

  return pages;
}
