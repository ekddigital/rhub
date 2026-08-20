"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKLET_A4, C } from "../booklet/constants";
import { BOOKLET_FONT_STACK, bookletFont } from "../booklet/booklet-fonts";
import {
  computeConferenceReportTotalPages,
  ConferenceReportDocument,
} from "./conference-report-document";
import { REPORT_META } from "./content-data";
import type { SignatoryDraft } from "@/components/tools/conf/document-signatory-controls";
import type { ReportRuntimeContext } from "@/lib/conf/conference-report/report-runtime";

const PRINT_ROOT_ID = "conference-report-print-root";

function exportBasename(): string {
  return `lsuic-conference-report-${REPORT_META.confYear}`;
}

export function ConferenceReportPreview({
  runtime,
  signatoryDraft,
}: {
  runtime: ReportRuntimeContext;
  signatoryDraft?: SignatoryDraft;
}) {
  const totalPages = computeConferenceReportTotalPages(runtime);
  const [zoom, setZoom] = useState(85);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    void import("@/lib/conf/navigation-pdf-export-support").then(({ warmupNavigationPdfExport }) =>
      warmupNavigationPdfExport(),
    );
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(null);

    const printRoot = document.getElementById(PRINT_ROOT_ID);
    const prevPrintRootCssText = printRoot?.style.cssText ?? "";

    try {
      const {
        warmupNavigationPdfExport,
        settleAfterPrintRootUpdate,
        waitForBookletPagesInDom,
        waitForBookletImagesInDom,
        hideZeroSizeImages,
        normalizeBookletPagesForCapture,
      } = await import("@/lib/conf/navigation-pdf-export-support");

      await warmupNavigationPdfExport();
      await settleAfterPrintRootUpdate();

      const pagesReady = await waitForBookletPagesInDom(
        PRINT_ROOT_ID,
        totalPages,
        { timeoutMs: 20_000 },
      );
      if (!pagesReady) {
        throw new Error("Conference report pages did not finish rendering.");
      }

      normalizeBookletPagesForCapture(
        PRINT_ROOT_ID,
        BOOKLET_A4.width,
        BOOKLET_A4.height,
      );

      await waitForBookletImagesInDom(PRINT_ROOT_ID);
      if (printRoot) hideZeroSizeImages(printRoot);

      const { exportToPDF } =
        await import("@/lib/creative/documents/pdfExport");
      await exportToPDF(PRINT_ROOT_ID, exportBasename(), undefined, {
        pageSelector: ".booklet-page",
        pageWrapperSelector: null,
        mode: "download",
        canvasScale: 2,
        jpegQuality: 0.9,
        pageSizePx: {
          width: BOOKLET_A4.width,
          height: BOOKLET_A4.height,
        },
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      if (printRoot) printRoot.style.cssText = prevPrintRootCssText;
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <style>{`
        #${PRINT_ROOT_ID} {
          position: fixed;
          left: -9999px;
          top: 0;
          width: ${BOOKLET_A4.width}px;
          pointer-events: none;
          z-index: -1;
          font-family: ${BOOKLET_FONT_STACK};
        }
        #${PRINT_ROOT_ID},
        #${PRINT_ROOT_ID} * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            font-family: ${BOOKLET_FONT_STACK} !important;
          }
          body > :not(#${PRINT_ROOT_ID}) {
            display: none !important;
          }
          .conference-report-no-print {
            display: none !important;
          }
          #${PRINT_ROOT_ID} {
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
          #${PRINT_ROOT_ID},
          #${PRINT_ROOT_ID} * {
            font-family: inherit !important;
          }
          #${PRINT_ROOT_ID} > div {
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
          .booklet-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div
        className="conference-report-no-print"
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
            Conference Report Preview
          </span>
          <span style={{ fontSize: "10px", color: C.muted }}>
            {totalPages} pages · A4 printable
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            {exporting ? "Exporting…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="conference-report-no-print rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div
        className="conference-report-no-print"
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
            marginBottom: zoom < 100 ? `${((zoom - 100) / 100) * 400}px` : "0",
            fontFamily: BOOKLET_FONT_STACK,
          }}
          className={bookletFont.className}
        >
          <ConferenceReportDocument gap={16} runtime={runtime} signatoryDraft={signatoryDraft} />
        </div>
      </div>

      {portalReady &&
        createPortal(
          <div id={PRINT_ROOT_ID} className={bookletFont.className}>
            <ConferenceReportDocument gap={0} runtime={runtime} signatoryDraft={signatoryDraft} />
          </div>,
          document.body,
        )}
    </div>
  );
}
