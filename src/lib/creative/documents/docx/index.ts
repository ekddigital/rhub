/**
 * DOCX Export — Main Orchestrator
 * Assembles cover page, front matter, and body sections into a complete
 * Word document and saves it via file-saver.
 *
 * This is the single entry point for DOCX export.
 * Each section builder is imported from its own focused module.
 */

import {
  Document,
  Paragraph,
  Table,
  Packer,
  BorderStyle,
  NumberFormat,
  SectionType,
} from "docx";
import { saveAs } from "file-saver";
import type { DocumentModel } from "../types";
import {
  FONT,
  FONT_SIZES,
  COLORS,
  HEADING_SIZE_MAP,
  HEADING_COLOR_MAP,
  SPACING,
} from "../shared-styles";
import { resetBookmarkIds } from "./styles";
import { prefetchDocumentImages } from "./imageFetcher";
import type { FetchedImage } from "./imageFetcher";
import { renderNode } from "./renderers";
import { buildCoverPage } from "./coverPage";
import { buildTOCSection, buildListOfEntries } from "./frontMatter";
import { createHeader, createFooter } from "./pageLayout";
import { COMPANY } from "../constants";

/**
 * Export DocumentModel to a .docx file with EKD Digital branding.
 * Pre-fetches all images (signatures, figures) so they are embedded
 * directly in the DOCX file regardless of their origin URL.
 *
 * Document structure (when all features enabled):
 *   Section 1 — Cover page (no header/footer)
 *   Section 2 — Front matter: TOC, List of Tables, List of Figures (Roman numeral pages)
 *   Section 3 — Body content (Arabic numeral pages, branded header/footer)
 */
export async function exportToDocx(
  model: DocumentModel,
  filename: string = "document",
  onProgress?: (pct: number, stage: string) => void,
): Promise<void> {
  // Reset bookmark ID counter for this export pass
  resetBookmarkIds();

  // Helper to yield to the event loop so the progress toast can render
  const tick = () => new Promise<void>((r) => setTimeout(r, 0));

  // Pre-fetch all images referenced in the document + company logo
  onProgress?.(5, "Fetching images…");
  await tick();

  // Resolve the company logo URL to an absolute URL for fetch()
  const logoUrl = new URL(COMPANY.logo, window.location.origin).href;
  const imageMap = await prefetchDocumentImages(model.children, [logoUrl]);
  const logoImage: FetchedImage | undefined = imageMap.get(logoUrl);

  // Determine which front-matter sections to include
  const showCover = model.meta.showCover !== false; // default ON
  const showTOC = model.meta.showTOC !== false; // default ON
  const showListOfTables =
    model.meta.showListOfTables &&
    model.listOfTables &&
    model.listOfTables.length > 0;
  const showListOfFigures =
    model.meta.showListOfFigures &&
    model.listOfFigures &&
    model.listOfFigures.length > 0;

  // ── Section 1: Cover Page ──
  onProgress?.(25, "Building cover page…");
  await tick();
  const coverChildren = showCover ? buildCoverPage(model, logoImage) : [];

  // ── Section 2: Front matter (TOC + lists) ──
  onProgress?.(35, "Building table of contents…");
  await tick();
  const frontMatterChildren: (Paragraph | Table)[] = [];

  if (showTOC) {
    frontMatterChildren.push(...buildTOCSection(model));
  }
  if (showListOfTables && model.listOfTables) {
    if (frontMatterChildren.length > 0) {
      frontMatterChildren.push(
        new Paragraph({ children: [], pageBreakBefore: true }),
      );
    }
    frontMatterChildren.push(
      ...buildListOfEntries("List of Tables", model.listOfTables, "table"),
    );
  }
  if (showListOfFigures && model.listOfFigures) {
    if (frontMatterChildren.length > 0) {
      frontMatterChildren.push(
        new Paragraph({ children: [], pageBreakBefore: true }),
      );
    }
    frontMatterChildren.push(
      ...buildListOfEntries("List of Figures", model.listOfFigures, "figure"),
    );
  }

  // ── Section 3: Body content ──
  onProgress?.(45, "Building document body…");
  await tick();
  const bodyChildren: (Paragraph | Table)[] = [];
  for (const node of model.children) {
    bodyChildren.push(...renderNode(node, imageMap));
  }

  // ── Shared page properties ──
  const sharedPageSize = {
    width: 11906, // A4 width in twips (210mm)
    height: 16838, // A4 height in twips (297mm)
  };
  const sharedMargins = {
    top: 1440,
    right: 1300,
    bottom: 1440,
    left: 1300,
  };
  const goldBorders = {
    pageBorderTop: {
      style: BorderStyle.SINGLE,
      size: 12,
      color: COLORS.gold,
      space: 10,
    },
    pageBorderBottom: {
      style: BorderStyle.SINGLE,
      size: 18,
      color: COLORS.gold,
      space: 10,
    },
    pageBorderLeft: {
      style: BorderStyle.SINGLE,
      size: 12,
      color: COLORS.gold,
      space: 10,
    },
    pageBorderRight: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: COLORS.gold,
      space: 10,
    },
  };

  // ── Assemble sections ──
  onProgress?.(60, "Composing sections…");
  await tick();
  const sections: any[] = [];

  // Cover page section — no header/footer, no page number
  if (showCover && coverChildren.length > 0) {
    sections.push({
      properties: {
        page: {
          size: sharedPageSize,
          margin: sharedMargins,
          borders: goldBorders,
          pageNumbers: { start: 0, formatType: NumberFormat.NONE },
        },
      },
      children: coverChildren,
    });
  }

  // Front matter section — Roman numeral page numbers
  if (frontMatterChildren.length > 0) {
    sections.push({
      properties: {
        type: showCover ? SectionType.NEXT_PAGE : undefined,
        page: {
          size: sharedPageSize,
          margin: sharedMargins,
          borders: goldBorders,
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
        },
      },
      headers: { default: createHeader(logoImage) },
      footers: { default: createFooter() },
      children: frontMatterChildren,
    });
  }

  // Body section — Arabic numeral pages, branded header/footer
  sections.push({
    properties: {
      type:
        showCover || frontMatterChildren.length > 0
          ? SectionType.NEXT_PAGE
          : undefined,
      page: {
        size: sharedPageSize,
        margin: sharedMargins,
        borders: goldBorders,
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
      },
    },
    headers: { default: createHeader(logoImage) },
    footers: { default: createFooter() },
    children: bodyChildren,
  });

  // ── Create document ──
  onProgress?.(70, "Generating document…");
  await tick();
  const doc = new Document({
    creator: model.meta.author || COMPANY.name,
    title: model.meta.title,
    description: model.meta.subtitle,
    styles: {
      default: {
        document: {
          run: {
            font: FONT.serif,
            size: FONT_SIZES.body,
            color: COLORS.primary,
          },
        },
        heading1: {
          run: {
            font: FONT.serif,
            size: HEADING_SIZE_MAP[1],
            bold: true,
            color: HEADING_COLOR_MAP[1],
          },
          paragraph: {
            spacing: {
              before: SPACING.headingBefore[1],
              after: SPACING.headingAfter[1],
            },
          },
        },
        heading2: {
          run: {
            font: FONT.serif,
            size: HEADING_SIZE_MAP[2],
            bold: true,
            color: HEADING_COLOR_MAP[2],
          },
          paragraph: {
            spacing: {
              before: SPACING.headingBefore[2],
              after: SPACING.headingAfter[2],
            },
          },
        },
        heading3: {
          run: {
            font: FONT.serif,
            size: HEADING_SIZE_MAP[3],
            bold: true,
            color: HEADING_COLOR_MAP[3],
          },
          paragraph: {
            spacing: {
              before: SPACING.headingBefore[3],
              after: SPACING.headingAfter[3],
            },
          },
        },
      },
    },
    sections,
  });

  // Generate and save
  onProgress?.(85, "Generating file…");
  await tick();
  const blob = await Packer.toBlob(doc);
  onProgress?.(97, "Saving file…");
  await tick();
  saveAs(blob, `${filename}.docx`);
  onProgress?.(100, "Done");
}
