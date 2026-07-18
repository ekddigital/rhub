"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKLET_A4, C } from "../booklet/constants";
import { ProgramDocument, PROGRAM_GUIDE_TOTAL_PAGES } from "./program-document";
import { PROGRAM_META } from "./program-data";

const PRINT_ROOT_ID = "detailed-program-print-root";

function exportBasename(): string {
  return `lsuic-detailed-program-${PROGRAM_META.confYear}`;
}

export function DetailedProgramPreview() {
  const [zoom, setZoom] = useState(85);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

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
        PROGRAM_GUIDE_TOTAL_PAGES,
        { timeoutMs: 15_000 },
      );
      if (!pagesReady) throw new Error("Program guide pages did not finish rendering.");

      normalizeBookletPagesForCapture(PRINT_ROOT_ID, BOOKLET_A4.width, BOOKLET_A4.height);

      await waitForBookletImagesInDom(PRINT_ROOT_ID);
      if (printRoot) hideZeroSizeImages(printRoot);

      const { exportToPDF } = await import("@/lib/creative/documents/pdfExport");
      await exportToPDF(PRINT_ROOT_ID, exportBasename(), undefined, {
        pageSelector: ".booklet-page",
        pageWrapperSelector: null,
        mode: "download",
        canvasScale: 2,
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
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom((z) => Math.max(40, z - 10))}
        >
          <ZoomOut className="size-4 mr-1" /> Zoom Out
        </Button>
        <span className="text-sm text-muted-foreground min-w-[50px] text-center">
          {zoom}%
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom((z) => Math.min(140, z + 10))}
        >
          <ZoomIn className="size-4 mr-1" /> Zoom In
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {exportError && (
            <span className="text-sm text-destructive">{exportError}</span>
          )}
          <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Download className="size-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Preview viewport */}
      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "80vh",
          background: "#E0E0E0",
          borderRadius: "8px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <ProgramDocument gap={16} />
        </div>
      </div>

      {/* Hidden print root */}
      {portalReady &&
        createPortal(
          <div
            id={PRINT_ROOT_ID}
            style={{
              position: "fixed",
              top: "-99999px",
              left: "-99999px",
              pointerEvents: "none",
              zIndex: -1,
              background: C.white,
            }}
          >
            <ProgramDocument gap={0} />
          </div>,
          document.body,
        )}
    </div>
  );
}
