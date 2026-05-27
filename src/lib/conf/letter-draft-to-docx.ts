/**
 * Build an editable Word (.docx) from letter draft fields and bodyRich HTML.
 * Browser-only (uses DOMParser + file-saver).
 */

import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type FileChild,
} from "docx";
import { CONF_FROM_COMMITTEE } from "@/lib/conf/fundraising-letter-template";
import type { FundraisingCategory } from "@/lib/conf/fundraising-letter-template";
import { collectLetterSignatories } from "@/lib/conf/letter-signatories";

const BODY_FONT = "Calibri";
const BODY_SIZE = 22; // 11pt
const HEADING_SIZE = 26; // 13pt (half-points)
const LABEL_COLOR = "002868";
const MUTED_COLOR = "666666";

export type LetterDocxDraft = {
  title?: string;
  to: string;
  from: string;
  re: string;
  date: string;
  body: string;
  bodyRich: string;
  fundraisingRecipientAddress?: string;
  fundraisingCategory?: FundraisingCategory;
  type?: string;
  fundraisingEnabled?: boolean;
  signatoryMode?: string;
  fundraisingTargetAmount?: string;
  fundraisingUseOfFunds?: string;
  signatory1Name: string;
  signatory1Title: string;
  signatory1Label: string;
  signatory1Sig: string;
  signatory2Name: string;
  signatory2Title: string;
  signatory2Label: string;
  signatory2Sig: string;
  signatory3Name: string;
  signatory3Title: string;
  signatory3Label: string;
  signatory3Sig: string;
  signatory4Name?: string;
  signatory4Title?: string;
  signatory4Label?: string;
  signatory4Sig?: string;
  signatory5Name?: string;
  signatory5Title?: string;
  signatory5Label?: string;
  signatory5Sig?: string;
  signatory6Name?: string;
  signatory6Title?: string;
  signatory6Label?: string;
  signatory6Sig?: string;
};

type InlineStyle = {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
};

type InlineSegment = InlineStyle & {
  text?: string;
  break?: boolean;
};

/** Mirrors preview To: block — avoids duplicating address lines. */
export function letterRecipientBlockDisplay(
  to: string | undefined,
  fundraisingRecipientAddress: string | undefined,
): string {
  const t = (to ?? "").trim();
  const a = (fundraisingRecipientAddress ?? "").trim();
  if (!t) return a;
  if (!a) return t;
  const toNorm = t.replace(/\r\n/g, "\n").trimEnd();
  const addrNorm = a.replace(/\r\n/g, "\n").trim();
  const addrLines = addrNorm
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (addrLines.length === 0) return t;
  const toLines = toNorm
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (toLines.length >= addrLines.length) {
    const suffix = toLines.slice(-addrLines.length);
    if (suffix.every((line, i) => line === addrLines[i])) return toNorm;
  }
  return `${toNorm}\n${addrNorm}`;
}

function letterHtmlTopLevelElements(doc: globalThis.Document): Element[] {
  let nodes = Array.from(doc.body.children);
  for (let depth = 0; depth < 6; depth++) {
    if (nodes.length === 1) {
      const tag = nodes[0].tagName.toLowerCase();
      if (tag === "div" || tag === "article" || tag === "section") {
        const inner = Array.from(nodes[0].children);
        if (inner.length > 0) {
          nodes = inner;
          continue;
        }
      }
    }
    break;
  }
  return nodes;
}

function segmentsToRuns(
  segments: InlineSegment[],
  defaults?: { size?: number; color?: string },
): TextRun[] {
  return segments.map((seg) => {
    if (seg.break) {
      return new TextRun({
        break: 1,
        font: BODY_FONT,
        size: defaults?.size ?? BODY_SIZE,
      });
    }
    return new TextRun({
      text: seg.text ?? "",
      font: BODY_FONT,
      size: defaults?.size ?? BODY_SIZE,
      color: defaults?.color,
      bold: seg.bold,
      italics: seg.italics,
      underline: seg.underline ? {} : undefined,
    });
  });
}

function baseRun(text: string, style: InlineStyle = {}): TextRun {
  return segmentsToRuns([{ text, ...style }])[0]!;
}

function collectInlineSegments(
  node: Node,
  style: InlineStyle = {},
): InlineSegment[] {
  const segments: InlineSegment[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? "").replace(/\s+/g, " ");
    if (text) segments.push({ text, ...style });
    return segments;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return segments;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") {
    segments.push({ break: true });
    return segments;
  }

  const nextStyle: InlineStyle = { ...style };
  if (tag === "strong" || tag === "b") nextStyle.bold = true;
  if (tag === "em" || tag === "i") nextStyle.italics = true;
  if (tag === "u") nextStyle.underline = true;

  for (const child of Array.from(el.childNodes)) {
    segments.push(...collectInlineSegments(child, nextStyle));
  }
  return segments;
}

function paragraphFromElement(el: Element): Paragraph {
  const segments = collectInlineSegments(el);
  const children =
    segments.length > 0
      ? segmentsToRuns(segments)
      : [baseRun((el.textContent ?? "").replace(/\s+/g, " ").trim())];

  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
    children,
  });
}

function headingParagraph(el: Element): Paragraph {
  const segments = collectInlineSegments(el, { bold: true });
  const children =
    segments.length > 0
      ? segmentsToRuns(segments, { size: HEADING_SIZE, color: LABEL_COLOR })
      : [
          new TextRun({
            text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
            bold: true,
            font: BODY_FONT,
            size: HEADING_SIZE,
            color: LABEL_COLOR,
          }),
        ];

  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children,
  });
}

function readCellText(cell: Element): string {
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim();
}

function tableFromElement(tableEl: Element): Table | null {
  const headerCells = Array.from(
    tableEl.querySelectorAll("thead tr th, thead tr td"),
  )
    .map((cell) => readCellText(cell))
    .filter(Boolean);

  const bodyRows = Array.from(tableEl.querySelectorAll("tbody tr")).map((row) =>
    Array.from(row.querySelectorAll("th, td")).map((cell) => ({
      text: readCellText(cell),
      el: cell,
    })),
  );

  const flatBody = bodyRows.filter((row) => row.some((c) => c.text));

  if (headerCells.length === 0 && flatBody.length === 0) return null;

  const headers =
    headerCells.length > 0
      ? headerCells
      : flatBody.length > 0
        ? flatBody[0].map((c) => c.text)
        : [];
  const rows = headerCells.length > 0 ? flatBody : flatBody.slice(1);

  if (headers.length === 0) return null;

  const colCount = headers.length;
  const colWidth = Math.floor(100 / colCount);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (header) =>
        new TableCell({
          width: { size: colWidth, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  color: "FFFFFF",
                  font: BODY_FONT,
                  size: BODY_SIZE,
                }),
              ],
            }),
          ],
          shading: { fill: "002868" },
        }),
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: Array.from({ length: colCount }, (_, ci) => {
          const cell = row[ci];
          const cellEl = cell?.el;
          const runs =
            cellEl && cellEl.innerHTML.trim()
              ? segmentsToRuns(collectInlineSegments(cellEl))
              : cell?.text
                ? [baseRun(cell.text)]
                : [baseRun("")];
          return new TableCell({
            width: { size: colWidth, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: runs.length > 0 ? runs : [baseRun("")],
              }),
            ],
          });
        }),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function htmlBodyRichToDocxChildren(html: string): FileChild[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const parser = new DOMParser();
  const dom = parser.parseFromString(trimmed, "text/html");
  const out: FileChild[] = [];

  for (const el of letterHtmlTopLevelElements(dom)) {
    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) out.push(headingParagraph(el));
      continue;
    }

    if (tag === "p" || tag === "div") {
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) out.push(paragraphFromElement(el));
      continue;
    }

    if (tag === "blockquote") {
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) {
        out.push(
          new Paragraph({
            indent: { left: 720 },
            spacing: { after: 160 },
            children: [baseRun(text, { italics: true })],
          }),
        );
      }
      continue;
    }

    if (tag === "hr") {
      out.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          border: {
            bottom: {
              color: "C9A227",
              size: 6,
              style: BorderStyle.SINGLE,
            },
          },
          children: [],
        }),
      );
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      Array.from(el.querySelectorAll(":scope > li")).forEach((li, i) => {
        const text = (li.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!text) return;
        const bullet = ordered ? `${i + 1}. ` : "• ";
        out.push(
          new Paragraph({
            spacing: { after: 80 },
            indent: { left: 360 },
            children: [
              baseRun(bullet, { bold: ordered }),
              ...segmentsToRuns(collectInlineSegments(li)),
            ],
          }),
        );
      });
      continue;
    }

    if (tag === "table") {
      const table = tableFromElement(el);
      if (table) {
        out.push(table);
        out.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
      }
    }
  }

  return out;
}

function labelValueParagraph(
  label: string,
  value: string,
  opts?: { valueBold?: boolean },
): Paragraph {
  const lines = value.split("\n");
  const children: TextRun[] = [
    new TextRun({
      text: `${label} `,
      bold: true,
      color: LABEL_COLOR,
      font: BODY_FONT,
      size: BODY_SIZE,
    }),
  ];

  lines.forEach((line, i) => {
    if (i > 0) {
      children.push(
        new TextRun({ break: 1, font: BODY_FONT, size: BODY_SIZE }),
      );
    }
    if (line.trim()) {
      children.push(
        new TextRun({
          text: line,
          bold: opts?.valueBold,
          font: BODY_FONT,
          size: BODY_SIZE,
        }),
      );
    }
  });

  return new Paragraph({
    spacing: { after: 60 },
    children,
  });
}

function buildLetterheadParagraph(draft: LetterDocxDraft): Paragraph | null {
  const line = (draft.from ?? "").trim().split(/\r?\n/)[0]?.trim();
  const text = line || CONF_FROM_COMMITTEE;
  if (!text) return null;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: BODY_FONT,
        size: 24,
        color: LABEL_COLOR,
      }),
    ],
  });
}

function buildMetadataParagraphs(draft: LetterDocxDraft): Paragraph[] {
  const paras: Paragraph[] = [];
  const recipient = letterRecipientBlockDisplay(
    draft.to,
    draft.fundraisingRecipientAddress,
  );
  const dateText =
    draft.date.trim() ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  paras.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: dateText,
          italics: true,
          color: MUTED_COLOR,
          font: BODY_FONT,
          size: 20,
        }),
      ],
    }),
  );

  if (recipient) paras.push(labelValueParagraph("To:", recipient));
  if (draft.from.trim()) paras.push(labelValueParagraph("From:", draft.from));
  if (draft.re.trim()) {
    paras.push(labelValueParagraph("Re:", draft.re, { valueBold: true }));
  }

  paras.push(
    new Paragraph({
      spacing: { before: 120, after: 200 },
      border: {
        bottom: { color: "C9A227", size: 8, style: BorderStyle.SINGLE },
      },
      children: [],
    }),
  );

  return paras;
}

type SignatorySlot = {
  name: string;
  title: string;
  label: string;
  sig: string;
};

function buildSignatoryCellParagraphs(sig: SignatorySlot): Paragraph[] {
  const paras: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: "_________________________",
          font: BODY_FONT,
          size: BODY_SIZE,
        }),
      ],
    }),
  ];
  if (sig.label.trim()) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: sig.label,
            italics: true,
            color: MUTED_COLOR,
            font: BODY_FONT,
            size: 18,
          }),
        ],
      }),
    );
  }
  if (sig.name.trim()) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: sig.name,
            bold: true,
            font: BODY_FONT,
            size: BODY_SIZE,
          }),
        ],
      }),
    );
  }
  if (sig.title.trim()) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: sig.title,
            color: MUTED_COLOR,
            font: BODY_FONT,
            size: 20,
          }),
        ],
      }),
    );
  }
  return paras;
}

function buildSignatoryBlock(draft: LetterDocxDraft): FileChild[] {
  const signatories: SignatorySlot[] = collectLetterSignatories(draft);

  if (signatories.length === 0) return [];

  const out: FileChild[] = [
    new Paragraph({
      spacing: { before: 360, after: 120 },
      border: {
        top: { color: "C9A227", size: 4, style: BorderStyle.SINGLE },
      },
      children: [],
    }),
  ];

  const hasSigImages = signatories.some((s) => s.sig.trim());
  if (hasSigImages) {
    out.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: "(Signature images are omitted in Word export — add in Word or use PDF for signed copies.)",
            italics: true,
            color: MUTED_COLOR,
            font: BODY_FONT,
            size: 18,
          }),
        ],
      }),
    );
  }

  const ROW_SIZE = 3;
  for (let i = 0; i < signatories.length; i += ROW_SIZE) {
    const chunk = signatories.slice(i, i + ROW_SIZE);
    const colWidth = Math.floor(100 / chunk.length);
    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: chunk.map(
              (sig) =>
                new TableCell({
                  width: { size: colWidth, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: {
                      style: BorderStyle.NONE,
                      size: 0,
                      color: "FFFFFF",
                    },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: {
                      style: BorderStyle.NONE,
                      size: 0,
                      color: "FFFFFF",
                    },
                  },
                  children: buildSignatoryCellParagraphs(sig),
                }),
            ),
          }),
        ],
      }),
    );
  }

  return out;
}

function fallbackBodyFromPlain(draft: LetterDocxDraft): FileChild[] {
  const plain = (draft.body ?? "").trim();
  if (!plain) return [];
  return plain
    .split(/\n\n+/)
    .filter(Boolean)
    .map(
      (text) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
          children: [baseRun(text)],
        }),
    );
}

/**
 * Assemble and download an editable .docx for a single letter draft.
 */
export async function letterDraftToDocx(
  draft: LetterDocxDraft,
  filenameStem: string,
  onProgress?: (pct: number, stage: string) => void,
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Word export must run in the browser.");
  }

  onProgress?.(10, "Building document…");

  const children: FileChild[] = [];

  const letterhead = buildLetterheadParagraph(draft);
  if (letterhead) children.push(letterhead);

  children.push(...buildMetadataParagraphs(draft));

  const bodyChildren = htmlBodyRichToDocxChildren(draft.bodyRich ?? "");
  if (bodyChildren.length > 0) {
    children.push(...bodyChildren);
  } else {
    children.push(...fallbackBodyFromPlain(draft));
  }

  children.push(...buildSignatoryBlock(draft));

  onProgress?.(70, "Packing Word file…");

  const docx = new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const { saveAs } = await import("file-saver");
  const blob = await Packer.toBlob(docx);
  const safeName = filenameStem.trim() || "letter";
  onProgress?.(95, "Saving…");
  saveAs(blob, `${safeName}.docx`);
  onProgress?.(100, "Done");
}
