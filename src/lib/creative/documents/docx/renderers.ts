/**
 * DOCX Node Renderers
 * Converts DocumentModel AST nodes into docx Paragraph/Table elements.
 * Each render function is pure — takes a node + dependencies, returns elements.
 *
 * All font sizes, spacing, and colour tokens are imported from the shared
 * style definitions so that web preview and DOCX output stay in sync.
 */

import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  ShadingType,
  BookmarkStart,
  BookmarkEnd,
} from "docx";
import type {
  DocumentNode,
  InlineContent,
  HeadingNode,
  ParagraphNode,
  ListNode,
  TableNode,
  FigureNode,
  BlockquoteNode,
  CodeBlockNode,
  SignatureBlockNode,
} from "../types";
import {
  FONT,
  FONT_SIZES,
  COLORS,
  HEADING_SIZE_MAP,
  HEADING_COLOR_MAP,
  SPACING,
  HEADING_MAP,
  headerCellBorders,
  cellBorders,
  lastRowCellBorders,
  bmId,
} from "./styles";
import type { FetchedImage } from "./imageFetcher";

/* ─── Inline content → TextRun[] ─────────────────────────────── */

export function inlineToRuns(content: InlineContent[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const item of content) {
    if (item.type === "text") {
      // Handle \n characters (from <br> tags) as line breaks
      const segments = item.text.split("\n");
      segments.forEach((seg, si) => {
        if (seg) {
          runs.push(
            new TextRun({
              text: seg,
              bold: item.bold,
              italics: item.italic,
              underline: item.underline ? {} : undefined,
              strike: item.strikethrough,
              font: item.code ? FONT.mono : FONT.serif,
              size: item.code ? FONT_SIZES.mono : FONT_SIZES.body,
              color: item.link ? COLORS.gold : undefined,
            }),
          );
        }
        // Add a line break between segments (but not after the last one)
        if (si < segments.length - 1) {
          runs.push(
            new TextRun({ break: 1, font: FONT.serif, size: FONT_SIZES.body }),
          );
        }
      });
    } else {
      runs.push(new TextRun({ text: "" }));
    }
  }
  return runs;
}

export function resolveRuns(node: {
  content?: InlineContent[];
  text?: string;
}): TextRun[] {
  if (node.content && node.content.length > 0) {
    return inlineToRuns(node.content);
  }
  if (node.text) {
    return [
      new TextRun({ text: node.text, font: FONT.serif, size: FONT_SIZES.body }),
    ];
  }
  return [];
}

/* ─── Block node renderers ───────────────────────────────────── */

export function renderHeading(node: HeadingNode): Paragraph[] {
  const text = node.number ? `${node.number}  ${node.text}` : node.text;
  const level = node.level;
  const color = HEADING_COLOR_MAP[level] ?? COLORS.gold;
  const size = HEADING_SIZE_MAP[level] ?? FONT_SIZES.h4;
  // Sanitise to letters/digits/hyphens — Word bookmark IDs must be ≤40 chars
  const anchorId = node.id
    ? node.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)
    : undefined;

  const textRun = new TextRun({
    text,
    bold: true,
    font: FONT.serif,
    size,
    color,
  });

  // Wrap the heading text inside a bookmark so TOC links can navigate here
  const children: (BookmarkStart | BookmarkEnd | TextRun)[] = anchorId
    ? [
        new BookmarkStart(anchorId, bmId(anchorId)),
        textRun,
        new BookmarkEnd(bmId(anchorId)),
      ]
    : [textRun];

  return [
    new Paragraph({
      heading: HEADING_MAP[node.level] || HEADING_MAP[4],
      children,
      spacing: {
        before: SPACING.headingBefore[level] ?? 80,
        after: SPACING.headingAfter[level] ?? 30,
      },
    }),
  ];
}

export function renderParagraph(node: ParagraphNode): Paragraph[] {
  // Map textAlign to docx AlignmentType
  const alignMap: Record<
    string,
    (typeof AlignmentType)[keyof typeof AlignmentType]
  > = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  };
  const alignment = node.textAlign
    ? alignMap[node.textAlign]
    : AlignmentType.JUSTIFIED;
  const useIndent = !node.textAlign || node.textAlign === "justify";

  return [
    new Paragraph({
      children: resolveRuns(node),
      spacing: { after: SPACING.bodyAfter },
      ...(useIndent ? { indent: { firstLine: SPACING.paragraphIndent } } : {}),
      alignment,
    }),
  ];
}

export function renderList(node: ListNode, level: number = 0): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  node.items.forEach((item, i) => {
    const bullet = node.ordered ? `${(node.start || 1) + i}.` : "\u2022";
    const runs = resolveRuns(item);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${bullet} `,
            bold: node.ordered,
            font: FONT.serif,
            size: FONT_SIZES.body,
          }),
          ...runs,
        ],
        indent: { left: SPACING.listIndentPerLevel * (level + 1) },
        spacing: { after: SPACING.listItemAfter },
      }),
    );

    if (item.children) {
      paragraphs.push(...renderList(item.children, level + 1));
    }
  });

  return paragraphs;
}

export function renderTable(node: TableNode): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Caption with bookmark anchor for List of Tables navigation
  if (node.caption) {
    const tableAnchor =
      node.number != null ? `table-${node.number}` : undefined;
    const captionRun = new TextRun({
      text: node.caption,
      bold: true,
      font: FONT.serif,
      size: FONT_SIZES.caption + 3, // slightly larger than base caption
      color: COLORS.gold,
    });
    elements.push(
      new Paragraph({
        children: tableAnchor
          ? [
              new BookmarkStart(tableAnchor, bmId(tableAnchor)),
              captionRun,
              new BookmarkEnd(bmId(tableAnchor)),
            ]
          : [captionRun],
        spacing: {
          before: SPACING.tableCaptionBefore,
          after: SPACING.tableCaptionAfter,
        },
      }),
    );
  }

  // Header row — gold bg, white text, strong bottom border
  const headerRow = new TableRow({
    tableHeader: true,
    children: node.headers.map(
      (header, hi) =>
        new TableCell({
          children: [
            new Paragraph({
              spacing: {
                before: SPACING.headerCellBefore,
                after: SPACING.headerCellAfter,
              },
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  font: FONT.serif,
                  size: FONT_SIZES.tableHeader,
                  color: COLORS.white,
                }),
              ],
            }),
          ],
          shading: {
            fill: COLORS.gold,
            type: ShadingType.CLEAR,
            color: "auto",
          },
          borders: {
            ...headerCellBorders,
            // No right border on last header cell
            right:
              hi < node.headers.length - 1
                ? headerCellBorders.right
                : { style: BorderStyle.SINGLE, size: 1, color: COLORS.gold },
          },
        }),
    ),
  });

  const isLastRow = (ri: number) => ri === node.rows.length - 1;

  // Data rows — subtle borders, striped alternation
  const dataRows = node.rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map(
          (cell, ci) =>
            new TableCell({
              children: [
                new Paragraph({
                  spacing: {
                    before: SPACING.bodyCellBefore,
                    after: SPACING.bodyCellAfter,
                  },
                  children: [
                    new TextRun({
                      text: cell,
                      font: FONT.serif,
                      size: FONT_SIZES.tableBody,
                    }),
                  ],
                }),
              ],
              shading:
                ri % 2 === 1
                  ? {
                      fill: COLORS.lightBg,
                      type: ShadingType.CLEAR,
                      color: "auto",
                    }
                  : undefined,
              borders: isLastRow(ri)
                ? {
                    ...lastRowCellBorders,
                    right:
                      ci < row.length - 1
                        ? lastRowCellBorders.right
                        : {
                            style: BorderStyle.NONE,
                            size: 0,
                            color: COLORS.border,
                          },
                  }
                : {
                    ...cellBorders,
                    right:
                      ci < row.length - 1
                        ? cellBorders.right
                        : {
                            style: BorderStyle.NONE,
                            size: 0,
                            color: COLORS.border,
                          },
                  },
            }),
        ),
      }),
  );

  elements.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        insideHorizontal: {
          style: BorderStyle.NONE,
          size: 0,
          color: COLORS.border,
        },
        insideVertical: {
          style: BorderStyle.NONE,
          size: 0,
          color: COLORS.border,
        },
      },
    }),
  );

  return elements;
}

export function renderBlockquote(node: BlockquoteNode): Paragraph[] {
  return [
    new Paragraph({
      children: resolveRuns(node).map(
        (run) =>
          new TextRun({
            ...run,
            italics: true,
            color: "555555",
          } as any),
      ),
      indent: { left: SPACING.listIndentPerLevel },
      border: {
        left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.gold },
      },
      spacing: {
        before: SPACING.blockquoteBefore,
        after: SPACING.blockquoteAfter,
      },
    }),
  ];
}

export function renderCodeBlock(node: CodeBlockNode): Paragraph[] {
  return node.code.split("\n").map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line || " ",
            font: FONT.mono,
            size: FONT_SIZES.mono,
            color: COLORS.codeText,
          }),
        ],
        shading: {
          fill: COLORS.primary,
          type: ShadingType.CLEAR,
          color: "auto",
        },
        spacing: { after: 0 },
      }),
  );
}

export function renderSignature(
  node: SignatureBlockNode,
  imageMap: Map<string, FetchedImage>,
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({ spacing: { before: SPACING.signatureGap } }),
  ];

  // Signature line — embed actual image if available, otherwise underline
  const sigImageData = node.signatureImage && imageMap.get(node.signatureImage);

  if (sigImageData) {
    const maxWidth = 200;
    const maxHeight = 80;
    const scale = Math.min(
      maxWidth / sigImageData.width,
      maxHeight / sigImageData.height,
      1,
    );
    const w = Math.round(sigImageData.width * scale);
    const h = Math.round(sigImageData.height * scale);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Signed: ",
            bold: true,
            font: FONT.serif,
            size: FONT_SIZES.body,
          }),
        ],
      }),
    );
    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: sigImageData.data,
            transformation: { width: w, height: h },
            type: sigImageData.imageType,
          }),
        ],
        spacing: { before: 40, after: 40 },
      }),
    );
  } else {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Signed: ",
            bold: true,
            font: FONT.serif,
            size: FONT_SIZES.body,
          }),
          new TextRun({
            text: "________________________",
            font: FONT.serif,
            size: FONT_SIZES.body,
            color: COLORS.gold,
          }),
        ],
      }),
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Name: ",
          bold: true,
          font: FONT.serif,
          size: FONT_SIZES.body,
        }),
        new TextRun({
          text: node.name,
          font: FONT.serif,
          size: FONT_SIZES.body,
        }),
      ],
      spacing: { before: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Title: ",
          bold: true,
          font: FONT.serif,
          size: FONT_SIZES.body,
        }),
        new TextRun({
          text: node.title,
          font: FONT.serif,
          size: FONT_SIZES.body,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Duly authorized to sign on behalf of",
          italics: true,
          font: FONT.serif,
          size: FONT_SIZES.caption + 2,
          color: "555555",
        }),
      ],
      spacing: { before: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: node.company,
          bold: true,
          font: FONT.serif,
          size: FONT_SIZES.body,
          color: COLORS.gold,
        }),
      ],
    }),
  );

  if (node.date) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Date: ",
            bold: true,
            font: FONT.serif,
            size: FONT_SIZES.body,
          }),
          new TextRun({
            text: node.date,
            font: FONT.serif,
            size: FONT_SIZES.body,
          }),
        ],
        spacing: { before: 160 },
      }),
    );
  }

  return paragraphs;
}

/* ─── Figure / Image ─────────────────────────────────────────── */

export function renderFigure(
  node: FigureNode,
  imageMap: Map<string, FetchedImage>,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  const align =
    node.alignment === "left"
      ? AlignmentType.LEFT
      : node.alignment === "right"
        ? AlignmentType.RIGHT
        : AlignmentType.CENTER;

  const imgData = node.src && imageMap.get(node.src);

  if (imgData) {
    const maxWidth = 450;
    const maxHeight = 600;
    const specifiedWidth = node.width
      ? parseInt(node.width.replace(/px$/, ""), 10)
      : undefined;
    const targetMaxWidth =
      specifiedWidth && specifiedWidth < maxWidth ? specifiedWidth : maxWidth;

    const scale = Math.min(
      targetMaxWidth / imgData.width,
      maxHeight / imgData.height,
      1,
    );
    const w = Math.round(imgData.width * scale);
    const h = Math.round(imgData.height * scale);

    paragraphs.push(
      new Paragraph({
        alignment: align,
        children: [
          new ImageRun({
            data: imgData.data,
            transformation: { width: w, height: h },
            type: imgData.imageType,
          }),
        ],
        spacing: {
          before: SPACING.figureBefore,
          after: node.caption ? SPACING.figureCaptionGap : SPACING.figureAfter,
        },
      }),
    );
  } else {
    paragraphs.push(
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: node.alt ? `[Image: ${node.alt}]` : "[Image]",
            font: FONT.serif,
            size: FONT_SIZES.body,
            italics: true,
            color: COLORS.muted,
          }),
        ],
        spacing: {
          before: SPACING.figureBefore,
          after: node.caption ? SPACING.figureCaptionGap : SPACING.figureAfter,
        },
      }),
    );
  }

  // Caption with bookmark anchor for List of Figures navigation
  if (node.caption) {
    const captionText =
      node.number != null
        ? `Figure ${node.number}: ${node.caption}`
        : node.caption;
    const figAnchor = node.number != null ? `figure-${node.number}` : undefined;
    const captionRun = new TextRun({
      text: captionText,
      font: FONT.serif,
      size: FONT_SIZES.caption + 2,
      italics: true,
      color: COLORS.subtle,
    });
    paragraphs.push(
      new Paragraph({
        alignment: align,
        children: figAnchor
          ? [
              new BookmarkStart(figAnchor, bmId(figAnchor)),
              captionRun,
              new BookmarkEnd(bmId(figAnchor)),
            ]
          : [captionRun],
        spacing: {
          before: SPACING.figureCaptionGap,
          after: SPACING.figureAfter,
        },
      }),
    );
  }

  return paragraphs;
}

/* ─── Node dispatcher ────────────────────────────────────────── */

export function renderNode(
  node: DocumentNode,
  imageMap: Map<string, FetchedImage>,
): (Paragraph | Table)[] {
  switch (node.type) {
    case "heading":
      return renderHeading(node);
    case "paragraph":
      return renderParagraph(node);
    case "list":
      return renderList(node);
    case "table":
      return renderTable(node);
    case "blockquote":
      return renderBlockquote(node);
    case "code-block":
      return renderCodeBlock(node);
    case "horizontal-rule":
      return [
        new Paragraph({
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: COLORS.border,
            },
          },
          spacing: { before: SPACING.figureBefore, after: SPACING.figureAfter },
        }),
      ];
    case "page-break":
      return [
        new Paragraph({
          children: [new TextRun({ break: 1 } as any)],
          pageBreakBefore: true,
        }),
      ];
    case "signature-block":
      return renderSignature(node, imageMap);
    case "figure":
      return renderFigure(node, imageMap);
    default:
      return [];
  }
}
