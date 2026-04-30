"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, Printer, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DocumentDraft } from "@/contexts/document-composition-context";

export interface DocumentPreviewPanelProps {
  draft: DocumentDraft | null;
  isOpen: boolean;
  onClose: () => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  renderPreview: (draft: DocumentDraft, zoom: number) => React.ReactNode;
}

/**
 * Reusable side panel for document preview
 * Can be placed alongside Payments, Budget, or other forms
 * Shows live preview of document as data is entered
 */
export function DocumentPreviewPanel({
  draft,
  isOpen,
  onClose,
  zoomLevel,
  onZoomChange,
  renderPreview,
}: DocumentPreviewPanelProps) {
  const [printMode, setPrintMode] = useState(false);

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => window.print(), 100);
    setTimeout(() => setPrintMode(false), 1000);
  };

  const handleDownload = () => {
    // Trigger PDF download via print dialog
    handlePrint();
  };

  if (!isOpen || !draft) {
    return null;
  }

  return (
    <>
      {/* Preview Panel */}
      <Card className="fixed right-0 top-16 bottom-0 w-96 rounded-none border-l border-t-0 border-r-0 border-b-0 bg-background shadow-lg z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold text-sm">Document Preview</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="border-b p-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>

        {/* Preview Content */}
        <div
          className="flex-1 overflow-auto p-4"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
          }}
        >
          {renderPreview(draft, zoomLevel)}
        </div>
      </Card>

      {/* Print-only version */}
      {printMode && (
        <div id="document-print-root" className="hidden print:block">
          {renderPreview(draft, 100)}
        </div>
      )}
    </>
  );
}
