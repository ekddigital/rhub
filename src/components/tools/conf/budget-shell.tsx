"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Send,
  Save,
  FileSpreadsheet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGET_CATEGORIES,
  COMMON_UNITS,
  BUDGET_STATUS_LABELS,
} from "@/lib/conf/config";
import {
  calcItemTotal,
  calcBudgetTotal,
  fmtRmb,
  fmtDual,
} from "@/lib/conf/currency";

type BudgetItem = {
  id?: string;
  no: number;
  name: string;
  desc: string;
  qty: number;
  unit: string;
  unitPrice: number;
  notes: string;
  isPaid: boolean;
};

const emptyItem = (no: number): BudgetItem => ({
  no,
  name: "",
  desc: "",
  qty: 1,
  unit: "pcs",
  unitPrice: 0,
  notes: "",
  isPaid: false,
});

export function BudgetShell() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([emptyItem(1)]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)]);
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((item, i) => ({ ...item, no: i + 1 }));
    });
  }, []);

  const updateItem = useCallback(
    (
      idx: number,
      field: keyof BudgetItem,
      value: string | number | boolean,
    ) => {
      setItems((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const grandTotal = calcBudgetTotal(items);

  const handleExportCsv = useCallback(() => {
    // Build CSV client-side for immediate download
    const header =
      "No.,Item,Description,Qty,Unit,Unit Price (¥),Total (¥),Notes";
    const rows = items.map((item) => {
      const total = calcItemTotal(item.qty, item.unitPrice);
      return [
        item.no,
        `"${item.name}"`,
        `"${item.desc}"`,
        item.qty,
        item.unit,
        item.unitPrice,
        total,
        `"${item.notes}"`,
      ].join(",");
    });
    const csv = `${title || "Budget"}\n${header}\n${rows.join("\n")}\n\n,,,,,GRAND TOTAL,${fmtRmb(grandTotal)},`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "budget").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, title, grandTotal]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Budget Manager</h1>
          <p className="text-sm text-muted-foreground">
            Create line-item budgets with auto-calculated totals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={items.length === 0}
          >
            <FileSpreadsheet className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Budget Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Budget Title</Label>
            <Input
              id="title"
              placeholder="e.g. Cooking Committee Budget"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.entries(BUDGET_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this budget..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Line Items</CardTitle>
            <CardDescription>
              {items.length} item{items.length !== 1 ? "s" : ""} · Grand Total:{" "}
              <span className="font-semibold text-foreground">
                {fmtDual(grandTotal)}
              </span>
            </CardDescription>
          </div>
          <Button size="sm" onClick={addItem}>
            <Plus className="size-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="w-10 pb-2 pr-2">#</th>
                  <th className="min-w-[160px] pb-2 pr-2">Item</th>
                  <th className="min-w-[80px] pb-2 pr-2">Qty</th>
                  <th className="min-w-[80px] pb-2 pr-2">Unit</th>
                  <th className="min-w-[100px] pb-2 pr-2">Unit Price (¥)</th>
                  <th className="min-w-[100px] pb-2 pr-2 text-right">
                    Total (¥)
                  </th>
                  <th className="w-10 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const total = calcItemTotal(item.qty, item.unitPrice);
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 pr-2 text-muted-foreground">
                        {item.no}
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          className="h-8 text-sm"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(idx, "name", e.target.value)
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          min={0}
                          step="any"
                          value={item.qty || ""}
                          onChange={(e) =>
                            updateItem(idx, "qty", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(idx, "unit", e.target.value)
                          }
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          min={0}
                          step="any"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 text-right font-mono font-medium">
                        {fmtRmb(total)}
                      </td>
                      <td className="py-2">
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeItem(idx)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={5} className="py-3 text-right font-semibold">
                    GRAND TOTAL
                  </td>
                  <td className="py-3 text-right font-mono text-lg font-bold text-[#C8A061]">
                    {fmtRmb(grandTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4" />
              Add Another Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Bar */}
      <Card className="border-[#C8A061]/30 bg-gradient-to-r from-[#C8A061]/5 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {items.filter((i) => i.name).length} items ·{" "}
              {BUDGET_CATEGORIES[category]?.label || category}
            </p>
            <p className="text-xl font-bold">{fmtDual(grandTotal)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
