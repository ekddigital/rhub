/**
 * Numbering Engine
 * Auto-numbers headings, tables, and figures in document order
 */

import type {
  DocumentModel,
  DocumentNode,
  HeadingNode,
  TableNode,
  FigureNode,
} from "./types";

interface NumberingState {
  /** Current heading counters by level: [h1, h2, h3, h4, h5, h6] */
  headings: number[];
  tableCount: number;
  figureCount: number;
  /** The minimum heading level found in the document (1-6) */
  baseLevel: number;
}

/**
 * Generate hierarchical heading number string.
 * Uses baseLevel to skip unused higher levels, preventing "0.x" numbers
 * when a document doesn't start at H1.
 * e.g., baseLevel=1, level=2, counters [1, 3, 0, ...] → "1.3"
 * e.g., baseLevel=2, level=2, counters [0, 3, 0, ...] → "3"
 * e.g., baseLevel=2, level=3, counters [0, 3, 2, ...] → "3.2"
 */
function buildHeadingNumber(
  counters: number[],
  level: number,
  baseLevel: number,
): string {
  return counters.slice(baseLevel - 1, level).join(".");
}

/**
 * Generate a URL-safe anchor ID from heading text and number
 */
function buildAnchorId(text: string, number: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return `section-${number.replace(/\./g, "-")}-${slug}`.slice(0, 80);
}

/**
 * Apply automatic numbering to all headings, tables, and figures
 * Returns a new DocumentModel with numbering applied (immutable)
 */
export function applyNumbering(doc: DocumentModel): DocumentModel {
  // Detect the minimum heading level used in the document.
  // If the doc starts with ## (H2), baseLevel=2 so we number from H2
  // and avoid "0.x" numbers when there's no H1.
  const headingLevels = doc.children
    .filter((n): n is HeadingNode => n.type === "heading")
    .map((h) => h.level);
  const baseLevel = headingLevels.length > 0 ? Math.min(...headingLevels) : 1;

  const state: NumberingState = {
    headings: [0, 0, 0, 0, 0, 0],
    tableCount: 0,
    figureCount: 0,
    baseLevel,
  };

  const numberedChildren = doc.children.map((node) => numberNode(node, state));

  return {
    ...doc,
    children: numberedChildren,
  };
}

function numberNode(node: DocumentNode, state: NumberingState): DocumentNode {
  switch (node.type) {
    case "heading":
      return numberHeading(node, state);
    case "table":
      return numberTable(node, state);
    case "figure":
      return numberFigure(node, state);
    default:
      return node;
  }
}

function numberHeading(node: HeadingNode, state: NumberingState): HeadingNode {
  const level = node.level;
  const idx = level - 1;

  // Increment counter at this level
  state.headings[idx]++;

  // Reset all deeper counters
  for (let i = idx + 1; i < 6; i++) {
    state.headings[i] = 0;
  }

  const number = buildHeadingNumber(state.headings, level, state.baseLevel);

  // Strip any existing leading section numbers to prevent double-numbering
  // Matches: "1. ", "2.1 ", "2.3.1 ", "2a. ", "3b. ", "A1. ", "Appendix A. "
  const cleanText = node.text.replace(
    /^(\d+(\.\d+)*[a-z]?|[A-Z]\d*|Appendix\s+[A-Z])\.?\s+/i,
    "",
  );
  const id = buildAnchorId(cleanText, number);

  return { ...node, text: cleanText, number, id };
}

function numberTable(node: TableNode, state: NumberingState): TableNode {
  state.tableCount++;
  const caption = node.label
    ? `Table ${state.tableCount}: ${node.label}`
    : `Table ${state.tableCount}`;

  return { ...node, number: state.tableCount, caption };
}

function numberFigure(node: FigureNode, state: NumberingState): FigureNode {
  state.figureCount++;
  return { ...node, number: state.figureCount };
}
