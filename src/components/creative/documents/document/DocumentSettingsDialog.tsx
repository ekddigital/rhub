"use client";

/**
 * Document Settings Dialog
 * Extracted from Document Studio page — configures metadata, layout, and template options.
 */

import React from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/creative/ui/dialog";
import { Switch } from "@/components/creative/ui/switch";
import type { DocumentMeta, TemplateConfig } from "@/lib/creative/documents/types";
import { COVER_STYLES } from "@/lib/creative/documents/types";
import type { CoverStyle } from "@/lib/creative/documents/types";

interface DocumentSettingsDialogProps {
  meta: Partial<DocumentMeta>;
  template: Partial<TemplateConfig>;
  debugPagination: boolean;
  onUpdateMeta: (update: Partial<DocumentMeta>) => void;
  onUpdateTemplate: (update: Partial<TemplateConfig>) => void;
  onDebugPaginationChange: (v: boolean) => void;
}

export function DocumentSettingsDialog({
  meta,
  template,
  debugPagination,
  onUpdateMeta,
  onUpdateTemplate,
  onDebugPaginationChange,
}: DocumentSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Settings</DialogTitle>
          <DialogDescription>
            Configure metadata, layout, and template options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Metadata section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#C8A061]">Metadata</h3>
            <div className="space-y-2">
              <Label htmlFor="doc-title" className="text-xs">
                Title
              </Label>
              <Input
                id="doc-title"
                value={meta.title || ""}
                onChange={(e) => onUpdateMeta({ title: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-subtitle" className="text-xs">
                Subtitle
              </Label>
              <Input
                id="doc-subtitle"
                value={meta.subtitle || ""}
                onChange={(e) => onUpdateMeta({ subtitle: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="doc-author" className="text-xs">
                  Author
                </Label>
                <Input
                  id="doc-author"
                  value={meta.author || ""}
                  onChange={(e) => onUpdateMeta({ author: e.target.value })}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-date" className="text-xs">
                  Date
                </Label>
                <Input
                  id="doc-date"
                  value={meta.date || ""}
                  onChange={(e) => onUpdateMeta({ date: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-ref" className="text-xs">
                Reference No.
              </Label>
              <Input
                id="doc-ref"
                value={meta.reference || ""}
                onChange={(e) => onUpdateMeta({ reference: e.target.value })}
                placeholder="e.g. EKD/2025/001"
                className="h-8"
              />
            </div>
          </div>

          {/* Layout section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#C8A061]">Layout</h3>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Header</Label>
              <Switch
                checked={template.showHeader}
                onCheckedChange={(v) => onUpdateTemplate({ showHeader: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Footer</Label>
              <Switch
                checked={template.showFooter}
                onCheckedChange={(v) => onUpdateTemplate({ showFooter: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">First Page Different</Label>
              <Switch
                checked={template.firstPageDifferent}
                onCheckedChange={(v) =>
                  onUpdateTemplate({ firstPageDifferent: v })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Table of Contents</Label>
              <Switch
                checked={meta.showTOC}
                onCheckedChange={(v) => {
                  onUpdateMeta({ showTOC: v });
                  onUpdateTemplate({ showTOC: v });
                }}
              />
            </div>
            {meta.showTOC && (
              <div className="flex items-center justify-between">
                <Label className="text-xs">TOC Depth</Label>
                <Select
                  value={String(meta.tocMaxLevel ?? 3)}
                  onValueChange={(v) =>
                    onUpdateMeta({ tocMaxLevel: Number(v) })
                  }
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Level</SelectItem>
                    <SelectItem value="2">2 Levels</SelectItem>
                    <SelectItem value="3">3 Levels</SelectItem>
                    <SelectItem value="4">4 Levels</SelectItem>
                    <SelectItem value="5">5 Levels</SelectItem>
                    <SelectItem value="6">6 Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-xs">Cover Page</Label>
              <Switch
                checked={meta.showCover ?? false}
                onCheckedChange={(v) => {
                  onUpdateMeta({ showCover: v });
                  onUpdateTemplate({ showCover: v });
                }}
              />
            </div>
            {meta.showCover && (
              <div className="space-y-1.5">
                <Label className="text-xs">Cover Style</Label>
                <Select
                  value={meta.coverStyle ?? "executive"}
                  onValueChange={(v) =>
                    onUpdateMeta({ coverStyle: v as CoverStyle })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COVER_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="font-medium">{s.label}</span>
                        <span className="ml-1.5 text-muted-foreground">
                          — {s.description}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-xs">List of Tables</Label>
              <Switch
                checked={meta.showListOfTables ?? false}
                onCheckedChange={(v) => {
                  onUpdateMeta({ showListOfTables: v });
                  onUpdateTemplate({ showListOfTables: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">List of Figures</Label>
              <Switch
                checked={meta.showListOfFigures ?? false}
                onCheckedChange={(v) => {
                  onUpdateMeta({ showListOfFigures: v });
                  onUpdateTemplate({ showListOfFigures: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Confidential</Label>
              <Switch
                checked={meta.confidential}
                onCheckedChange={(v) => onUpdateMeta({ confidential: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-orange-500">
                Debug Pagination
              </Label>
              <Switch
                checked={debugPagination}
                onCheckedChange={(v) => onDebugPaginationChange(v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Margins</Label>
              <Select
                value={template.margins}
                onValueChange={(v) =>
                  onUpdateTemplate({
                    margins: v as "standard" | "narrow" | "wide",
                  })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="narrow">Narrow</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
