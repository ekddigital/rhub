"use client";

import { useMemo, useState } from "react";
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

  const layout = useMemo(() => computeBookletLayout(data), [data]);
  const { enabledSections, totalPages } = layout;

  const letterheadUrl = `/api/conf/${confId}/letterhead?mode=header&format=png`;

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 300));
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
          jpegQuality: 0.88,
        },
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
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
        }
        @media print {
          body * { visibility: hidden; }
          #booklet-print-root,
          #booklet-print-root * { visibility: visible !important; }
          #booklet-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            pointer-events: auto !important;
          }
          .booklet-no-print { display: none !important; }
          .booklet-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden !important;
          }
          .booklet-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          @page { size: A4 portrait; margin: 0; }
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
          }}
        >
          <BookletDocument data={data} layout={layout} gap={16} />
        </div>
      </div>

      {/* Off-screen print / PDF capture root — full A4, no zoom transform */}
      <div id="booklet-print-root">
        <BookletDocument data={data} layout={layout} gap={0} />
      </div>

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
