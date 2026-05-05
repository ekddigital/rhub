/**
 * DOCX Front Matter Builders
 * Table of Contents, List of Tables, and List of Figures pages.
 * Each entry uses InternalHyperlinks to navigate to heading/table/figure bookmarks.
 */

import {
  Paragraph,
  TextRun,
  Table,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  InternalHyperlink,
} from "docx";
import type { DocumentModel, TOCEntry } from "../types";
import { FONT, FONT_SIZES, COLORS } from "../shared-styles";

/* ─── Table of Contents ──────────────────────────────────────── */

/**
 * Build a manual TOC with InternalHyperlinks pointing at heading bookmarks.
 * Each entry: "1.2  Heading Title ............. " as a clickable link.
 */
export function buildTOCSection(model: DocumentModel): (Paragraph | Table)[] {
  const toc = model.toc;
  if (!toc || toc.length === 0) return [];

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: "Table of Contents",
          bold: true,
          font: FONT.serif,
          size: FONT_SIZES.h1,
          color: COLORS.primary,
        }),
      ],
    }),
  );

  // Entries — each entry is an InternalHyperlink that jumps to the heading bookmark
  for (const entry of toc) {
    const anchorId = entry.id
      ? entry.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)
      : undefined;
    const indent = (entry.level - 1) * 360;
    const fontSize =
      entry.level === 1
        ? FONT_SIZES.body
        : entry.level === 2
          ? FONT_SIZES.tableBody
          : FONT_SIZES.caption + 2;
    const isBold = entry.level <= 2;
    const displayText = `${entry.number}  ${entry.text}`;

    const entryRun = new TextRun({
      text: displayText,
      bold: isBold,
      font: FONT.serif,
      size: fontSize,
      color: COLORS.primary,
    });

    // If we have an anchor, wrap in InternalHyperlink; otherwise plain text
    const entryChild = anchorId
      ? new InternalHyperlink({
          anchor: anchorId,
          children: [entryRun],
        })
      : entryRun;

    children.push(
      new Paragraph({
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
            leader: "dot",
          },
        ],
        children: [
          entryChild,
          // Dot leader tab + page marker (Word updates page numbers on print)
          new TextRun({ text: "\t", font: FONT.serif, size: fontSize }),
          new TextRun({
            text: entry.page != null ? String(entry.page) : "",
            font: FONT.serif,
            size: fontSize,
            color: COLORS.gold,
          }),
        ],
        indent: { left: indent },
        spacing: { after: entry.level === 1 ? 80 : 40 },
      }),
    );
  }

  return children;
}

/* ─── List of Tables / List of Figures ───────────────────────── */

/**
 * Build a "List of …" page with InternalHyperlinks to anchored entries.
 * Reusable for both Tables and Figures.
 */
export function buildListOfEntries(
  title: string,
  entries: TOCEntry[],
  anchorPrefix: string,
): (Paragraph | Table)[] {
  if (!entries || entries.length === 0) return [];
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: FONT.serif,
          size: FONT_SIZES.h1,
          color: COLORS.primary,
        }),
      ],
    }),
  );

  for (const entry of entries) {
    const anchorId = `${anchorPrefix}-${entry.number?.replace(/\D/g, "") || entry.id}`;
    const displayText = entry.text;

    const entryRun = new TextRun({
      text: displayText,
      font: FONT.serif,
      size: FONT_SIZES.tableBody,
      color: COLORS.primary,
    });

    const entryChild = new InternalHyperlink({
      anchor: anchorId,
      children: [entryRun],
    });

    children.push(
      new Paragraph({
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
            leader: "dot",
          },
        ],
        children: [
          entryChild,
          new TextRun({
            text: "\t",
            font: FONT.serif,
            size: FONT_SIZES.tableBody,
          }),
          new TextRun({
            text: entry.page != null ? String(entry.page) : "",
            font: FONT.serif,
            size: FONT_SIZES.tableBody,
            color: COLORS.gold,
          }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  return children;
}
