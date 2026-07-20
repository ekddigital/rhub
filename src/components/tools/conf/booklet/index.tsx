"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { warmupBookletPdfExport } from "@/lib/conf/booklet-pdf-export-support";
import {
  Download,
  ExternalLink,
  Loader2,
  Printer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { BOOKLET_A4, C } from "./constants";
import type { BookletData } from "./types";
import {
  BookletDocument,
  computeBookletLayout,
} from "./booklet-document";
import { BOOKLET_FONT_STACK, bookletFont } from "./booklet-fonts";

function bookletExportBasename(data: BookletData): string {
  const slug = (data.event.name || "conference-booklet")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `lsuic-booklet-${data.event.year}-${slug || "export"}`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function BookletPreview({
  data,
  confId,
}: {
  data: BookletData;
  confId: string;
}) {
  const [zoom, setZoom] = useState(90);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const layout = useMemo(() => computeBookletLayout(data), [data]);
  const { enabledSections, totalPages } = layout;

  const letterheadUrl = `/api/conf/${confId}/letterhead?mode=header&format=png`;

  useEffect(() => {
    void warmupBookletPdfExport();
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(null);

    const printRoot = document.getElementById("booklet-print-root");
    const prevPrintRootCssText = printRoot?.style.cssText ?? "";

    try {
      const {
        warmupBookletPdfExport,
        settleAfterPrintRootUpdate,
        waitForBookletPagesInDom,
        waitForBookletImagesInDom,
        hideZeroSizeImages,
        normalizeBookletPagesForCapture,
      } = await import("@/lib/conf/booklet-pdf-export-support");

      await warmupBookletPdfExport();
      await settleAfterPrintRootUpdate();

      const pagesReady = await waitForBookletPagesInDom(
        "booklet-print-root",
        totalPages,
        { timeoutMs: 12_000 },
      );
      if (!pagesReady) {
        throw new Error("Booklet pages did not finish rendering for export.");
      }

      normalizeBookletPagesForCapture(
        "booklet-print-root",
        BOOKLET_A4.width,
        BOOKLET_A4.height,
      );

      await waitForBookletImagesInDom("booklet-print-root");
      if (printRoot) hideZeroSizeImages(printRoot);

      const { exportToPDF } = await import("@/lib/creative/documents/pdfExport");
      await exportToPDF(
        "booklet-print-root",
        bookletExportBasename(data),
        undefined,
        {
          pageSelector: ".booklet-page",
          pageWrapperSelector: null,
          mode: "download",
          canvasScale: 2,
          jpegQuality: 0.9,
          pageSizePx: {
            width: BOOKLET_A4.width,
            height: BOOKLET_A4.height,
          },
        },
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      if (printRoot) {
        printRoot.style.cssText = prevPrintRootCssText;
      }
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <style>{`
        #booklet-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: ${BOOKLET_A4.width}px;
          pointer-events: none;
          z-index: -1;
          font-family: ${BOOKLET_FONT_STACK};
        }
        #booklet-print-root,
        #booklet-print-root * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            font-family: ${BOOKLET_FONT_STACK} !important;
          }
          /* Portal keeps print root on body; hide all other top-level nodes */
          body > :not(#booklet-print-root) {
            display: none !important;
          }
          .booklet-no-print {
            display: none !important;
          }
          #booklet-print-root {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            pointer-events: auto !important;
            z-index: auto !important;
            font-family: ${BOOKLET_FONT_STACK} !important;
          }
          #booklet-print-root,
          #booklet-print-root * {
            font-family: inherit !important;
          }
          #booklet-print-root > div {
            display: block !important;
            gap: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .booklet-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            transform: none !important;
            break-after: page;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .booklet-page:first-child {
            break-before: avoid;
            page-break-before: avoid;
          }
          .booklet-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          /* Print-safe overrides for the cover page:
             1. Heavy text-shadow blurs render as visible dark rectangles in
                most print engines — flatten them.
             2. backdrop-filter is not supported by any current print pipeline
                — swap the frosted card for a solid translucent background so
                the card still reads on paper.
             3. Force background images / gradients to print exactly (Chrome
                sometimes drops them without this on the printed elements). */
          .booklet-page,
          .booklet-page * {
            text-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="booklet-no-print"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 16px",
          borderRadius: "10px",
          border: `1px solid ${C.blue}20`,
          background: C.lightBlue,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.blue }}>
            Live Booklet Preview
          </span>
          {data.booklet && (
            <Badge
              className={
                data.booklet.status === "PUBLISHED"
                  ? "bg-green-500/20 text-green-700 text-[10px]"
                  : data.booklet.status === "READY"
                    ? "bg-amber-500/20 text-amber-700 text-[10px]"
                    : "bg-zinc-500/20 text-zinc-600 text-[10px]"
              }
            >
              {data.booklet.status}
            </Badge>
          )}
          <span style={{ fontSize: "10px", color: C.muted }}>
            {totalPages} pages · {enabledSections.length} sections
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Zoom controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              style={{
                padding: "4px 8px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
              }}
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span
              style={{
                minWidth: "3rem",
                textAlign: "center",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
            >
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              style={{
                padding: "4px 8px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
              }}
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          <a
            href={letterheadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
            Letterhead
          </a>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5" />
            Print
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={exporting}
            onClick={() => void handleExportPdf()}
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="booklet-no-print rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      {/* Scaled on-screen preview (transform must not affect print root) */}
      <div
        className="booklet-no-print"
        style={{
          overflowX: "auto",
          borderRadius: "16px",
          background: "#D8D8D8",
          padding: "24px",
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            width: `${BOOKLET_A4.width}px`,
            margin: "0 auto",
            marginBottom:
              zoom < 100 ? `${((zoom - 100) / 100) * 400}px` : "0",
            fontFamily: BOOKLET_FONT_STACK,
          }}
          className={bookletFont.className}
        >
          <BookletDocument data={data} layout={layout} gap={16} />
        </div>
      </div>

      {/* Off-screen print / PDF capture root — portaled to body to escape app chrome */}
      {portalReady &&
        createPortal(
          <div id="booklet-print-root" className={bookletFont.className}>
            <BookletDocument data={data} layout={layout} gap={0} />
          </div>,
          document.body,
        )}

      {/* Letterhead preview strip */}
      <div className="booklet-no-print rounded-xl border border-[#C8A061]/20 bg-white p-4 shadow-sm space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: C.blue }}>
            Conference Committee Letterhead
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`/api/conf/${confId}/letterhead?mode=page&format=png`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded border border-[#C8A061]/40 bg-[#C8A061]/10 px-2 py-0.5 text-[10px] text-[#8E6B30] hover:bg-[#C8A061]/20 transition-colors"
            >
              <Download className="size-2.5" />
              Page 1 PNG
            </a>
            <a
              href={`/api/conf/${confId}/letterhead?mode=continuation&format=png`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded border border-[#C8A061]/40 bg-[#C8A061]/10 px-2 py-0.5 text-[10px] text-[#8E6B30] hover:bg-[#C8A061]/20 transition-colors"
            >
              <Download className="size-2.5" />
              Page 2+ PNG
            </a>
            <a
              href={`/api/conf/${confId}/letterhead?mode=page&format=svg`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[#C8A061] hover:underline"
            >
              SVG →
            </a>
          </div>
        </div>

        {/* Two-column preview: first page header + continuation header */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[9px] font-medium text-zinc-500 uppercase tracking-wide">
              First Page — Full Header + Sidebar
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/conf/${confId}/letterhead?mode=header&format=png`}
              alt="First page letterhead header"
              className="w-full rounded border border-zinc-100"
              style={{ objectFit: "contain", objectPosition: "top" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <p className="mb-1 text-[9px] font-medium text-zinc-500 uppercase tracking-wide">
              Continuation Pages — Compact Header
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/conf/${confId}/letterhead?mode=continuation&format=png`}
              alt="Continuation page letterhead header"
              className="w-full rounded border border-zinc-100"
              style={{ objectFit: "contain", objectPosition: "top" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Full page 1 preview (scrollable) */}
        <details className="group">
          <summary className="cursor-pointer text-[10px] font-medium text-[#C8A061] hover:underline list-none flex items-center gap-1">
            <ExternalLink className="size-3" />
            View full first-page preview (with sidebar)
          </summary>
          <div
            className="mt-2 overflow-auto rounded border border-zinc-100"
            style={{ maxHeight: "400px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/conf/${confId}/letterhead?mode=page&format=png`}
              alt="Full letterhead first page"
              className="w-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </details>
      </div>
    </div>
  );
}
