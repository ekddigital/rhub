"use client";

import { ImageIcon, Plus, Upload, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COMMON_UNITS } from "@/lib/conf/config";
import { calcItemTotal, fmtRmb } from "@/lib/conf/currency";

export type FinanceLineItemDraft = {
  id: string;
  no?: number;
  name: string;
  qty: string | number;
  unit: string;
  customUnit?: string;
  unitPrice: string | number;
};

export type FinanceLineItemProof = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
};

export type FinanceLineItemReceiptState = {
  pendingFile?: File | null;
  pendingPreview?: string | null;
  existingProofs?: FinanceLineItemProof[];
};

type FinanceLineItemsTableProps = {
  items: FinanceLineItemDraft[];
  grandTotal: number;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (
    index: number,
    field: keyof FinanceLineItemDraft,
    value: string | number,
  ) => void;
  showReceiptColumn?: boolean;
  receiptStateByItemId?: Record<string, FinanceLineItemReceiptState>;
  onReceiptSelect?: (index: number, file: File) => void;
  onReceiptRemove?: (index: number, proofId?: string) => void;
  receiptUploadHint?: string;
  disabled?: boolean;
};

function unitLabel(item: FinanceLineItemDraft) {
  if (item.unit === "custom") return item.customUnit?.trim() || "custom";
  return item.unit;
}

export function FinanceLineItemsTable({
  items,
  grandTotal,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  showReceiptColumn = false,
  receiptStateByItemId = {},
  onReceiptSelect,
  onReceiptRemove,
  receiptUploadHint,
  disabled = false,
}: FinanceLineItemsTableProps) {
  return (
    <Card className="budget-no-print">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Line Items</CardTitle>
          <CardDescription>
            {items.length} item{items.length !== 1 ? "s" : ""} · Grand Total:{" "}
            <span className="font-semibold text-foreground">
              {fmtRmb(grandTotal)}
            </span>
          </CardDescription>
        </div>
        <Button size="sm" onClick={onAddItem} disabled={disabled}>
          <Plus className="size-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                <th className="w-8 pb-2 pr-2">#</th>
                <th className="min-w-40 pb-2 pr-2">Item</th>
                <th className="w-20 pb-2 pr-2">Qty</th>
                <th className="min-w-30 pb-2 pr-2">Unit</th>
                <th className="w-28 pb-2 pr-2">Unit Price (¥)</th>
                <th className="w-24 pb-2 pr-2 text-right">Total (¥)</th>
                {showReceiptColumn && (
                  <th className="min-w-36 pb-2 pr-2">Receipt</th>
                )}
                <th className="w-8 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const total = calcItemTotal(
                  Number(item.qty),
                  Number(item.unitPrice),
                );
                const isCustom = item.unit === "custom";
                const receiptState = receiptStateByItemId[item.id];
                const hasReceipt =
                  Boolean(receiptState?.pendingPreview) ||
                  (receiptState?.existingProofs?.length ?? 0) > 0;

                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 text-muted-foreground text-xs">
                      {item.no ?? idx + 1}
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 text-sm"
                        placeholder="Item name"
                        value={item.name}
                        disabled={disabled}
                        onChange={(e) =>
                          onUpdateItem(idx, "name", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={item.qty || ""}
                        disabled={disabled}
                        onChange={(e) =>
                          onUpdateItem(idx, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex gap-1">
                        <select
                          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                          style={{ width: isCustom ? "100px" : "100%" }}
                          value={item.unit}
                          disabled={disabled}
                          onChange={(e) =>
                            onUpdateItem(idx, "unit", e.target.value)
                          }
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u === "custom" ? "custom…" : u}
                            </option>
                          ))}
                        </select>
                        {isCustom && (
                          <Input
                            className="h-8 min-w-0 flex-1 text-sm"
                            placeholder="e.g. players"
                            value={item.customUnit || ""}
                            disabled={disabled}
                            onChange={(e) =>
                              onUpdateItem(idx, "customUnit", e.target.value)
                            }
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={item.unitPrice || ""}
                        disabled={disabled}
                        onChange={(e) =>
                          onUpdateItem(idx, "unitPrice", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2 text-right font-mono font-medium">
                      {fmtRmb(total)}
                    </td>
                    {showReceiptColumn && (
                      <td className="py-2 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {receiptState?.existingProofs?.map((proof) => (
                            <div
                              key={proof.id}
                              className="group relative size-14 overflow-hidden rounded border"
                            >
                              <a
                                href={proof.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={proof.fileName}
                              >
                                {proof.fileType?.startsWith("image/") ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={proof.filePath}
                                    alt={proof.fileName}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center bg-muted">
                                    <ImageIcon className="size-4 text-muted-foreground" />
                                  </div>
                                )}
                              </a>
                              {!disabled && onReceiptRemove && (
                                <button
                                  type="button"
                                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={() =>
                                    onReceiptRemove(idx, proof.id)
                                  }
                                  title="Remove receipt"
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {receiptState?.pendingPreview && (
                            <div className="group relative size-14 overflow-hidden rounded border border-[#C8A061]/50">
                              {receiptState.pendingPreview.startsWith("data:") ||
                              receiptState.pendingPreview.startsWith("blob:") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={receiptState.pendingPreview}
                                  alt="Pending receipt"
                                  className="size-full object-cover"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-muted">
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                </div>
                              )}
                              {!disabled && onReceiptRemove && (
                                <button
                                  type="button"
                                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={() => onReceiptRemove(idx)}
                                  title="Remove pending receipt"
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>
                          )}
                          {!disabled && onReceiptSelect && (
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-muted-foreground/30 px-2 py-1.5 text-[10px] text-muted-foreground hover:border-[#C8A061]/50">
                              <Upload className="mb-0.5 size-3.5" />
                              {hasReceipt ? "Replace" : "Upload"}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) onReceiptSelect(idx, file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="py-2">
                      {items.length > 1 && !disabled && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRemoveItem(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <XCircle className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td
                  colSpan={showReceiptColumn ? 6 : 5}
                  className="py-3 text-right font-semibold"
                >
                  GRAND TOTAL
                </td>
                <td className="py-3 text-right font-mono text-lg font-bold text-[#C8A061]">
                  {fmtRmb(grandTotal)}
                </td>
                {showReceiptColumn && <td></td>}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {receiptUploadHint && showReceiptColumn && (
          <p className="mt-3 text-xs text-muted-foreground">{receiptUploadHint}</p>
        )}

        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddItem}
            disabled={disabled}
          >
            <Plus className="size-4" />
            Add Another Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function financeLineItemUnitLabel(item: FinanceLineItemDraft) {
  return unitLabel(item);
}
