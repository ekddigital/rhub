/**
 * Word (DOCX) Export Engine — Re-export barrel
 *
 * The actual implementation has been modularised into focused files under ./docx/:
 *   - styles.ts      — Color tokens, bookmark management, heading map, borders
 *   - imageFetcher.ts — CORS-safe image pre-fetching for embedding
 *   - renderers.ts   — AST node → docx Paragraph/Table converters
 *   - coverPage.ts   — Cover page builder (swappable design)
 *   - frontMatter.ts — TOC + List of Tables / List of Figures
 *   - pageLayout.ts  — Header & footer factories (swappable design)
 *   - index.ts       — Main orchestrator (exportToDocx entry point)
 *
 * This barrel re-exports the public API so existing imports keep working:
 *   import { exportToDocx } from "@/lib/creative/documents/docxExport";
 */

export { exportToDocx } from "./docx";
