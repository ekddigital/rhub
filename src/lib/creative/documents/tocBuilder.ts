/**
 * Table of Contents Builder
 * Generates TOC entries from numbered document headings.
 * Separate builders for List of Tables and List of Figures.
 */

import type {
  DocumentModel,
  TOCEntry,
  HeadingNode,
  TableNode,
  FigureNode,
} from "./types";

interface TOCBuilderOptions {
  /** Maximum heading depth to include — relative to the top-level heading.
   *  e.g. depth=3 in a doc starting at H2 includes H2, H3, H4 (default: 3) */
  maxDepth?: number;
}

/**
 * Build table of contents from a numbered document model (headings only).
 * Must be called AFTER applyNumbering()
 */
export function buildTOC(
  doc: DocumentModel,
  options: TOCBuilderOptions = {},
): TOCEntry[] {
  const { maxDepth = 3 } = options;

  // Determine the minimum heading level in the document so depth is relative
  const headingLevels = doc.children
    .filter((n): n is HeadingNode => n.type === "heading")
    .map((h) => h.level);
  const baseLevel = headingLevels.length > 0 ? Math.min(...headingLevels) : 1;
  // Convert relative depth to absolute max level
  const maxLevel = baseLevel + maxDepth - 1;
  const entries: TOCEntry[] = [];

  for (const node of doc.children) {
    if (node.type === "heading") {
      const heading = node as HeadingNode;
      if (heading.level <= maxLevel && heading.number && heading.id) {
        entries.push({
          id: heading.id,
          text: heading.text,
          level: heading.level,
          number: heading.number,
        });
      }
    }
  }

  return entries;
}

/**
 * Build a list of tables from the document model
 */
export function buildListOfTables(doc: DocumentModel): TOCEntry[] {
  const entries: TOCEntry[] = [];
  for (const node of doc.children) {
    if (node.type === "table") {
      const table = node as TableNode;
      if (table.caption) {
        entries.push({
          id: `table-${table.number}`,
          text: table.caption, // Already formatted as "Table X: Caption"
          level: 1,
          number: "", // No number prefix to avoid duplication
        });
      }
    }
  }
  return entries;
}

/**
 * Build a list of figures from the document model
 */
export function buildListOfFigures(doc: DocumentModel): TOCEntry[] {
  const entries: TOCEntry[] = [];
  for (const node of doc.children) {
    if (node.type === "figure") {
      const figure = node as FigureNode;
      if (figure.caption && figure.number) {
        entries.push({
          id: `figure-${figure.number}`,
          text: `Figure ${figure.number}: ${figure.caption}`, // Format consistently
          level: 1,
          number: "", // No number prefix to avoid duplication
        });
      }
    }
  }
  return entries;
}

/**
 * Inject TOC into Document Model
 * Returns a new Document with toc field populated
 */
export function injectTOC(
  doc: DocumentModel,
  options?: TOCBuilderOptions,
): DocumentModel {
  const toc = buildTOC(doc, options);
  const listOfTables = doc.meta.showListOfTables
    ? buildListOfTables(doc)
    : undefined;
  const listOfFigures = doc.meta.showListOfFigures
    ? buildListOfFigures(doc)
    : undefined;

  return { ...doc, toc, listOfTables, listOfFigures };
}
