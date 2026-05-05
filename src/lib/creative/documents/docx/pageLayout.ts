/**
 * DOCX Page Layout — Header & Footer factories
 * Branded header/footer used across front-matter and body sections.
 * Swap this module to use a different header/footer design.
 */

import {
  Paragraph,
  TextRun,
  ImageRun,
  Header,
  Footer as DocxFooter,
  PageNumber,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
} from "docx";
import { FONT, COLORS } from "../shared-styles";
import { COMPANY } from "../constants";
import type { FetchedImage } from "./imageFetcher";

/**
 * Create the branded page header.
 * Logo (if available) + Company name left | Registration + TIN right
 */
export function createHeader(logoImage?: FetchedImage): Header {
  const children: Paragraph[] = [];

  // Logo row — if we have the image, render it centered before the text row
  if (logoImage) {
    const maxW = 80;
    const maxH = 36;
    const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height, 1);
    const w = Math.round(logoImage.width * scale);
    const h = Math.round(logoImage.height * scale);

    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoImage.data,
            transformation: { width: w, height: h },
            type: logoImage.imageType,
          }),
          new TextRun({
            text: `  ${COMPANY.name}`,
            font: FONT.serif,
            size: 18,
            bold: true,
            color: COLORS.gold,
          }),
          new TextRun({ text: "\t" }),
          new TextRun({
            text: `Business Reg. No. ${COMPANY.registrationNo} | TIN: ${COMPANY.tinNo}`,
            font: FONT.serif,
            size: 14,
            color: COLORS.muted,
          }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.gold },
        },
      }),
    );
  } else {
    // Fallback: text-only header
    children.push(
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({
            text: COMPANY.name,
            font: FONT.serif,
            size: 18,
            bold: true,
            color: COLORS.gold,
          }),
          new TextRun({ text: "\t" }),
          new TextRun({
            text: `Business Reg. No. ${COMPANY.registrationNo} | TIN: ${COMPANY.tinNo}`,
            font: FONT.serif,
            size: 14,
            color: COLORS.muted,
          }),
        ],
        spacing: { after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.gold },
        },
      }),
    );
  }

  return new Header({ children });
}

/**
 * Create the branded page footer.
 * Left: company name | Right: Page X of Y (section-scoped)
 * Bottom line: contact info
 */
export function createFooter(): DocxFooter {
  return new DocxFooter({
    children: [
      new Paragraph({
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
        border: {
          top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.gold },
        },
        spacing: { before: 100 },
        children: [
          new TextRun({
            text: COMPANY.name,
            font: FONT.serif,
            size: 16,
            bold: true,
            color: COLORS.gold,
          }),
          new TextRun({
            text: "\t",
          }),
          new TextRun({
            text: "Page ",
            font: FONT.serif,
            size: 15,
            color: COLORS.muted,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT.serif,
            size: 16,
            bold: true,
            color: COLORS.gold,
          }),
          new TextRun({
            text: " of ",
            font: FONT.serif,
            size: 15,
            color: COLORS.muted,
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES_IN_SECTION],
            font: FONT.serif,
            size: 16,
            bold: true,
            color: COLORS.gold,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: `${COMPANY.email}  |  ${COMPANY.website}  |  ${COMPANY.phone.formatted.liberia}`,
            font: FONT.serif,
            size: 13,
            color: "AAAAAA",
          }),
        ],
      }),
    ],
  });
}
