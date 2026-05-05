/**
 * TableSizePicker — Grid-based table dimension selector
 * MS Word-style grid where hovering highlights the desired rows × columns.
 * Also supports direct number input for larger tables.
 */

"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/creative/ui/popover";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/creative/ui/tooltip";
import { Table as TableIcon, Settings2 } from "lucide-react";

interface TableSizePickerProps {
  onInsert: (rows: number, cols: number, withHeaderRow: boolean) => void;
  /** Tooltip text */
  tooltip?: string;
}

const MAX_GRID = 8; // 8×8 visible grid

export function TableSizePicker({
  onInsert,
  tooltip = "Insert Table",
}: TableSizePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [customRows, setCustomRows] = useState("4");
  const [customCols, setCustomCols] = useState("4");
  const [withHeader, setWithHeader] = useState(true);

  const handleGridClick = useCallback(
    (rows: number, cols: number) => {
      onInsert(rows, cols, withHeader);
      setOpen(false);
      setHoverRow(0);
      setHoverCol(0);
    },
    [onInsert, withHeader],
  );

  const handleCustomInsert = useCallback(() => {
    const rows = Math.max(1, Math.min(50, parseInt(customRows) || 3));
    const cols = Math.max(1, Math.min(20, parseInt(customCols) || 3));
    onInsert(rows, cols, withHeader);
    setOpen(false);
    setShowCustom(false);
  }, [customRows, customCols, withHeader, onInsert]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border transition-all border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-popover text-popover-foreground border-border"
        >
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        className="w-auto p-3"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        {!showCustom ? (
          <div className="flex flex-col gap-2">
            {/* Dimension label */}
            <div className="text-xs text-muted-foreground text-center font-medium">
              {hoverRow > 0 && hoverCol > 0
                ? `${hoverRow} × ${hoverCol} table`
                : "Select table size"}
            </div>

            {/* Grid */}
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${MAX_GRID}, 1fr)`,
              }}
              onMouseLeave={() => {
                setHoverRow(0);
                setHoverCol(0);
              }}
            >
              {Array.from({ length: MAX_GRID * MAX_GRID }, (_, i) => {
                const row = Math.floor(i / MAX_GRID) + 1;
                const col = (i % MAX_GRID) + 1;
                const isHighlighted = row <= hoverRow && col <= hoverCol;

                return (
                  <button
                    key={i}
                    type="button"
                    className={`w-5 h-5 border rounded-sm transition-colors ${
                      isHighlighted
                        ? "bg-secondary/40 border-secondary"
                        : "bg-background border-border/60 hover:border-border"
                    }`}
                    onMouseEnter={() => {
                      setHoverRow(row);
                      setHoverCol(col);
                    }}
                    onClick={() => handleGridClick(row, col)}
                  />
                );
              })}
            </div>

            {/* Header row toggle */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={withHeader}
                onChange={(e) => setWithHeader(e.target.checked)}
                className="rounded border-border"
              />
              Include header row
            </label>

            {/* Custom size link */}
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1 border-t border-border/40"
            >
              <Settings2 className="w-3 h-3" />
              Custom size...
            </button>
          </div>
        ) : (
          /* Custom size input form */
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="text-xs font-medium text-muted-foreground">
              Custom Table Size
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={customRows}
                  onChange={(e) => setCustomRows(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCustomInsert()}
                />
              </div>
              <span className="text-muted-foreground mt-5">×</span>
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Columns</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={customCols}
                  onChange={(e) => setCustomCols(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomInsert()}
                />
              </div>
            </div>

            {/* Header row toggle */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={withHeader}
                onChange={(e) => setWithHeader(e.target.checked)}
                className="rounded border-border"
              />
              Include header row
            </label>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => setShowCustom(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={handleCustomInsert}
              >
                Insert Table
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
