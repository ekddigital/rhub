/**
 * DOCX Cover Page Builder
 * Generates the branded cover page section for EKD Digital documents.
 * Matches the online CoverPage.tsx preview as closely as possible in .docx.
 * Supports multiple cover styles: executive, legal, policy, proposal, onboarding.
 */

import {
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { DocumentModel, CoverStyle } from "../types";
import { FONT, COLORS } from "../shared-styles";
import { COMPANY } from "../constants";
import type { FetchedImage } from "./imageFetcher";

/* ─── Palette per cover style (DOCX hex without #) ─────────────── */
const DOCX_PALETTES: Record<
  CoverStyle,
  { accent: string; heading: string; metaLabel: string; badge: string }
> = {
  executive: {
    accent: COLORS.gold,
    heading: COLORS.primary,
    metaLabel: COLORS.primary,
    badge: COLORS.gold,
  },
  legal: {
    accent: "1E3A5F",
    heading: "1E3A5F",
    metaLabel: "1E3A5F",
    badge: "8B9EB5",
  },
  policy: {
    accent: "1B5E5E",
    heading: "1B5E5E",
    metaLabel: "1B5E5E",
    badge: "1B5E5E",
  },
  proposal: {
    accent: COLORS.gold,
    heading: COLORS.primary,
    metaLabel: COLORS.gold,
    badge: COLORS.gold,
  },
  onboarding: {
    accent: "4338CA",
    heading: "4338CA",
    metaLabel: "4338CA",
    badge: "4338CA",
  },
};

/**
 * Build the cover-page elements (Paragraph | Table)[].
 * Returns an empty array when there is nothing to render.
 */
export function buildCoverPage(
  model: DocumentModel,
  logoImage?: FetchedImage,
): (Paragraph | Table)[] {
  const { meta } = model;
  const coverStyle: CoverStyle = meta.coverStyle ?? "executive";
  const p = DOCX_PALETTES[coverStyle];
  const children: (Paragraph | Table)[] = [];

  // Top spacing
  children.push(new Paragraph({ spacing: { before: 1200 } }));

  // ── Logo + Company Name row ──
  if (logoImage) {
    const maxW = 100;
    const maxH = 100;
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
        ],
        spacing: { after: 100 },
      }),
    );
  }

  // Company name
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: COMPANY.name,
          bold: true,
          font: FONT.serif,
          size: 44,
          color: p.accent,
        }),
      ],
    }),
  );

  // Legal name
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: COMPANY.legalName,
          font: FONT.serif,
          size: 20,
          color: "777777",
        }),
      ],
    }),
  );

  // Registration + TIN
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Business Reg. No. ${COMPANY.registrationNo}  |  TIN: ${COMPANY.tinNo}`,
          font: FONT.serif,
          size: 18,
          color: COLORS.subtle,
        }),
      ],
    }),
  );

  // Address
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: COMPANY.fullAddress,
          font: FONT.serif,
          size: 18,
          color: COLORS.muted,
        }),
      ],
    }),
  );

  // Accent decorative line
  children.push(
    new Paragraph({
      children: [],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: p.accent },
      },
      spacing: { after: 800 },
    }),
  );

  // Title
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: meta.title || "Untitled Document",
          bold: true,
          font: FONT.serif,
          size: 56,
          color: p.heading,
        }),
      ],
    }),
  );

  // Subtitle
  if (meta.subtitle) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: meta.subtitle,
            font: FONT.serif,
            size: 32,
            color: "555555",
          }),
        ],
      }),
    );
  }

  // Spacer
  children.push(new Paragraph({ spacing: { before: 2400 } }));

  // Accent top border on metadata block
  children.push(
    new Paragraph({
      children: [],
      border: {
        top: { style: BorderStyle.SINGLE, size: 8, color: p.accent },
      },
      spacing: { after: 200 },
    }),
  );

  // Document metadata table (Reference, Date, Author, etc.)
  const metaRows: [string, string][] = [];
  if (meta.reference) metaRows.push(["Reference", meta.reference]);
  if (meta.author) metaRows.push(["Prepared By", meta.author]);
  if (meta.date) metaRows.push(["Date", meta.date]);
  if (meta.version) metaRows.push(["Version", meta.version]);
  if (meta.confidential) metaRows.push(["Classification", "CONFIDENTIAL"]);

  if (metaRows.length > 0) {
    children.push(
      new Table({
        rows: metaRows.map(
          ([label, value]) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: label + ":",
                          bold: true,
                          font: FONT.serif,
                          size: 22,
                          color: p.metaLabel,
                        }),
                      ],
                      spacing: { before: 40, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0 },
                    bottom: { style: BorderStyle.NONE, size: 0 },
                    left: { style: BorderStyle.NONE, size: 0 },
                    right: { style: BorderStyle.NONE, size: 0 },
                  },
                }),
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: value,
                          font: FONT.serif,
                          size: 22,
                          color: "444444",
                        }),
                      ],
                      spacing: { before: 40, after: 40 },
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0 },
                    bottom: { style: BorderStyle.NONE, size: 0 },
                    left: { style: BorderStyle.NONE, size: 0 },
                    right: { style: BorderStyle.NONE, size: 0 },
                  },
                }),
              ],
            }),
        ),
        width: { size: 60, type: WidthType.PERCENTAGE },
      }),
    );
  }

  // Bottom: contact info
  children.push(new Paragraph({ spacing: { before: 600 } }));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `${COMPANY.email}  |  ${COMPANY.website}`,
          font: FONT.serif,
          size: 18,
          color: p.accent,
        }),
      ],
    }),
  );

  return children;
}
