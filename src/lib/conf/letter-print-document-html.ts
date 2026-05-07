/**
 * Standalone HTML document for printing or downloading conference letters.
 * Keeps the same structure as the composer print popup so exports match PDF output.
 */

export function buildLetterPrintDocumentHtml(
  letterInnerHtml: string,
  opts?: {
    includeAutoPrintScript?: boolean;
    origin?: string;
    documentTitle?: string;
  },
): string {
  const origin = opts?.origin ?? "";
  const title = opts?.documentTitle ?? "LSUIC Letter";
  const includeScript = opts?.includeAutoPrintScript !== false;
  const autoPrint = includeScript
    ? `<script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  <\/script>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <base href="${origin}">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 794px; background: #888; }
    .letter-page {
      box-shadow: none !important;
      display: flex !important;
      flex-direction: column !important;
    }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { background: #fff !important; width: 210mm; overflow: visible; }
      .letter-page {
        width: 210mm !important;
        min-height: 297mm !important;
        height: 297mm !important;
        max-height: none !important;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: none !important;
        break-after: page;
        page-break-after: always;
      }
      .letter-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  ${letterInnerHtml}
  ${autoPrint}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const INVALID_FILENAME = /[<>:"/\\|?*\u0000-\u001f]/g;

/** Safe filename stem for exports (no extension). */
export function sanitizeLetterExportBasename(
  title: string,
  fallbackId: string,
): string {
  const raw = (title || fallbackId || "letter").trim().slice(0, 80);
  let s = raw.replace(INVALID_FILENAME, "_").replace(/\s+/g, " ").trim();
  if (!s) s = "letter";
  return s;
}
