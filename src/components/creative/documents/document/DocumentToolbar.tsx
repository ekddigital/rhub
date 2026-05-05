"use client";

/**
 * Document Toolbar
 * Extracted from Document Studio page — contains title input, view mode toggle,
 * zoom controls, settings, UUID display, share button, and export dropdown.
 */

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileDown,
  FileText,
  Eye,
  Edit3,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Save,
  FilePlus2,
  Move,
  Copy,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/creative/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/creative/ui/tooltip";
import type { DocumentMeta, TemplateConfig } from "@/lib/creative/documents/types";
import { toast } from "sonner";
import { CoverBorderExportDialog } from "./CoverBorderExportDialog";

type ViewMode = "split" | "editor" | "preview";

interface DocumentToolbarProps {
  meta: Partial<DocumentMeta>;
  template: Partial<TemplateConfig>;
  viewMode: ViewMode;
  zoom: number;
  activeDocId: string | null;
  draggableImages: boolean;
  debugPagination: boolean;
  onUpdateMeta: (update: Partial<DocumentMeta>) => void;
  onUpdateTemplate: (update: Partial<TemplateConfig>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDraggableImagesToggle: () => void;
  onDebugPaginationChange: (v: boolean) => void;
  onExport: (format: "pdf" | "docx") => void;
  onLoadSample: () => void;
  onCreateDocument: () => void;
  onShareClick?: () => void;
  /** Settings dialog rendered via slot to keep this component layout-only */
  settingsSlot: React.ReactNode;
}

export function DocumentToolbar({
  meta,
  viewMode,
  zoom,
  activeDocId,
  draggableImages,
  onUpdateMeta,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onDraggableImagesToggle,
  onExport,
  onLoadSample,
  onCreateDocument,
  onShareClick,
  settingsSlot,
}: DocumentToolbarProps) {
  const [copiedId, setCopiedId] = React.useState(false);

  const handleCopyId = () => {
    if (!activeDocId) return;
    navigator.clipboard.writeText(activeDocId).then(() => {
      setCopiedId(true);
      toast.success("Document ID copied", {
        description: activeDocId,
        duration: 2000,
      });
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  return (
    <header className="flex items-center justify-between border-b px-4 py-2 bg-background/95 backdrop-blur z-50">
      {/* Left: Back + Title + UUID */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/brand">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#C8A061]" />
          <Input
            value={meta.title || ""}
            onChange={(e) => onUpdateMeta({ title: e.target.value })}
            className="h-8 w-64 text-sm font-medium border-none shadow-none focus-visible:ring-1 focus-visible:ring-[#C8A061]"
            placeholder="Document title..."
          />
          {/* Auto-save indicator */}
          {activeDocId && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3" />
              Auto-saved
            </span>
          )}
        </div>

        {/* UUID badge — always visible when a doc is active */}
        {activeDocId && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-muted transition-colors cursor-pointer select-none"
                >
                  <span className="truncate max-w-[100px]">
                    {activeDocId.slice(0, 8)}…
                  </span>
                  {copiedId ? (
                    <Check className="h-2.5 w-2.5 text-green-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-mono text-xs">
                <p className="font-semibold mb-0.5">Document ID</p>
                <p className="text-muted-foreground">{activeDocId}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Click to copy
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Center: View Mode */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        <Button
          variant={viewMode === "editor" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("editor")}
          className="h-7 text-xs gap-1"
        >
          <Edit3 className="h-3 w-3" />
          Editor
        </Button>
        <Button
          variant={viewMode === "split" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("split")}
          className="h-7 text-xs"
        >
          Split
        </Button>
        <Button
          variant={viewMode === "preview" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("preview")}
          className="h-7 text-xs gap-1"
        >
          <Eye className="h-3 w-3" />
          Preview
        </Button>
      </div>

      {/* Right: Zoom + Drag + Share + Settings + Export */}
      <div className="flex items-center gap-2">
        {/* Zoom controls (preview mode) */}
        {viewMode !== "editor" && (
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onZoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onZoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Draggable Images Toggle */}
        {viewMode !== "editor" && (
          <Button
            variant={draggableImages ? "default" : "outline"}
            size="sm"
            className={`h-8 gap-1.5 ${
              draggableImages ? "bg-[#C8A061] hover:bg-[#B8905F]" : ""
            }`}
            onClick={onDraggableImagesToggle}
            title="Toggle interactive image positioning"
          >
            <Move className="h-3.5 w-3.5" />
            {draggableImages ? "Drag Mode ON" : "Position Images"}
          </Button>
        )}

        {/* Share Button */}
        {onShareClick && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onShareClick}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        )}

        {/* Settings Dialog (rendered via slot) */}
        {settingsSlot}

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-[#C8A061] hover:bg-[#b8914f] text-white"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("pdf")}>
              <FileDown className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("docx")}>
              <FileDown className="h-4 w-4 mr-2" />
              Export as Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="p-0 focus:bg-transparent"
            >
              <CoverBorderExportDialog
                meta={meta as DocumentMeta}
                trigger={
                  <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors">
                    <FileDown className="h-4 w-4" />
                    Export Assets as Image…
                  </button>
                }
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLoadSample}>
              <FileText className="h-4 w-4 mr-2" />
              Load Sample Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateDocument}>
              <FilePlus2 className="h-4 w-4 mr-2" />
              New Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
