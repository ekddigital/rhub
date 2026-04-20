"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileSpreadsheet,
  Save,
  FolderOpen,
  PenLine,
  CheckCircle2,
  Clock,
  X,
  ChevronDown,
  Pencil,
  Printer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUDGET_CATEGORIES, COMMON_UNITS } from "@/lib/conf/config";
import {
  calcItemTotal,
  calcBudgetTotal,
  fmtRmb,
  fmtDual,
} from "@/lib/conf/currency";

// ── Types ───────────────────────────────────────────────────────────────────

type BudgetItem = {
  id: string;
  no: number;
  name: string;
  qty: number;
  unit: string;
  customUnit: string; // used when unit === "custom"
  unitPrice: number;
  notes: string;
};

type BudgetDraft = {
  id: string;
  title: string;
  category: string;
  notes: string;
  items: BudgetItem[];
  savedAt: string; // ISO string
};

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "conf_budget_drafts";

function loadDrafts(): BudgetDraft[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as BudgetDraft[]) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: BudgetDraft[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(drafts));
  } catch {
    // storage full — silently ignore
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyItem(no: number): BudgetItem {
  return {
    id: newId(),
    no,
    name: "",
    qty: 1,
    unit: "pcs",
    customUnit: "",
    unitPrice: 0,
    notes: "",
  };
}

function newDraft(): BudgetDraft {
  return {
    id: newId(),
    title: "",
    category: "FOOD",
    notes: "",
    items: [emptyItem(1)],
    savedAt: new Date().toISOString(),
  };
}

function unitLabel(item: BudgetItem) {
  return item.unit === "custom" ? item.customUnit || "—" : item.unit;
}

// ── Component ────────────────────────────────────────────────────────────────

export function BudgetShell() {
  const [drafts, setDrafts] = useState<BudgetDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<BudgetDraft>(newDraft());
  const [showList, setShowList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadDrafts();
    setDrafts(stored);
    if (stored.length > 0) {
      setActiveDraft(stored[0]);
    }
  }, []);

  // Auto-save whenever activeDraft changes (debounced 800ms)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      persistDraft(activeDraft);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraft]);

  const persistDraft = useCallback((draft: BudgetDraft) => {
    const updated = draft.savedAt
      ? { ...draft, savedAt: new Date().toISOString() }
      : draft;
    setDrafts((prev) => {
      const exists = prev.find((d) => d.id === updated.id);
      const next = exists
        ? prev.map((d) => (d.id === updated.id ? updated : d))
        : [updated, ...prev];
      saveDrafts(next);
      return next;
    });
  }, []);

  const handleManualSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistDraft(activeDraft);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }, [activeDraft, persistDraft]);

  const handleNewBudget = useCallback(() => {
    const draft = newDraft();
    setActiveDraft(draft);
    setShowList(false);
  }, []);

  const handleLoadDraft = useCallback((draft: BudgetDraft) => {
    setActiveDraft(draft);
    setShowList(false);
  }, []);

  const handleDeleteDraft = useCallback(
    (id: string) => {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== id);
        saveDrafts(next);
        return next;
      });
      if (activeDraft.id === id) {
        const remaining = drafts.filter((d) => d.id !== id);
        setActiveDraft(remaining.length > 0 ? remaining[0] : newDraft());
      }
    },
    [activeDraft.id, drafts],
  );

  // ── Field update helpers ──────────────────────────────────────────────────

  const setTitle = (v: string) => setActiveDraft((d) => ({ ...d, title: v }));
  const setCategory = (v: string) =>
    setActiveDraft((d) => ({ ...d, category: v }));
  const setNotes = (v: string) => setActiveDraft((d) => ({ ...d, notes: v }));

  const addItem = useCallback(() => {
    setActiveDraft((d) => ({
      ...d,
      items: [...d.items, emptyItem(d.items.length + 1)],
    }));
  }, []);

  const removeItem = useCallback((idx: number) => {
    setActiveDraft((d) => {
      const next = d.items
        .filter((_, i) => i !== idx)
        .map((it, i) => ({
          ...it,
          no: i + 1,
        }));
      return { ...d, items: next };
    });
  }, []);

  const updateItem = useCallback(
    (idx: number, field: keyof BudgetItem, value: string | number) => {
      setActiveDraft((d) => ({
        ...d,
        items: d.items.map((it, i) =>
          i === idx ? { ...it, [field]: value } : it,
        ),
      }));
    },
    [],
  );

  // ── CSV export ────────────────────────────────────────────────────────────

  const grandTotal = calcBudgetTotal(activeDraft.items);

  const handleExportCsv = useCallback(() => {
    const header = "No.,Item,Qty,Unit,Unit Price (¥),Total (¥),Notes";
    const rows = activeDraft.items.map((item) => {
      const total = calcItemTotal(item.qty, item.unitPrice);
      return [
        item.no,
        `"${item.name}"`,
        item.qty,
        unitLabel(item),
        item.unitPrice,
        total,
        `"${item.notes}"`,
      ].join(",");
    });
    const title = activeDraft.title || "Budget";
    const csv = `${title}\n${header}\n${rows.join("\n")}\n\n,,,,GRAND TOTAL,${fmtRmb(grandTotal)},`;
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeDraft, grandTotal]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Print CSS — renders budget as clean A4 document */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .budget-print-area, .budget-print-area * { visibility: visible; }
          .budget-no-print { display: none !important; }
          .budget-print-area {
            position: fixed; left: 0; top: 0;
            width: 210mm; padding: 18mm 16mm 12mm;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
      {/* Header */}
      <div className="budget-no-print flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          {/* Auto-save indicator */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saved" ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                Saved
              </>
            ) : (
              <>
                <Clock className="size-3.5" />
                Auto-saving
              </>
            )}
          </span>

          <Button variant="outline" size="sm" onClick={handleManualSave}>
            <Save className="size-4" />
            Save Draft
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowList((v) => !v)}
          >
            <FolderOpen className="size-4" />
            Drafts ({drafts.length})
            <ChevronDown
              className={`size-3.5 ml-1 transition-transform ${showList ? "rotate-180" : ""}`}
            />
          </Button>

          <Button size="sm" onClick={handleNewBudget}>
            <PenLine className="size-4" />
            New Budget
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileSpreadsheet className="size-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            title="Print or save as PDF"
          >
            <Printer className="size-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Drafts list */}
      {showList && (
        <Card className="budget-no-print border-[#C8A061]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Saved Drafts</CardTitle>
            <CardDescription className="text-xs">
              Click a draft to load it. Drafts are saved locally on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No saved drafts yet. Changes auto-save as you type.
              </p>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                      d.id === activeDraft.id
                        ? "border-[#C8A061]/50 bg-[#C8A061]/5"
                        : "hover:bg-muted/50 cursor-pointer"
                    }`}
                    onClick={() => handleLoadDraft(d)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {d.title || "Untitled Budget"}
                        {d.id === activeDraft.id && (
                          <span className="ml-2 text-xs text-[#C8A061]">
                            current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {BUDGET_CATEGORIES[d.category]?.label ?? d.category} ·{" "}
                        {d.items.length} items ·{" "}
                        {fmtRmb(calcBudgetTotal(d.items))} · saved{" "}
                        {new Date(d.savedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleLoadDraft(d)}
                        title="Load"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDraft(d.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget Meta */}
      <Card className="budget-no-print">
        <CardHeader>
          <CardTitle className="text-base">Budget Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Budget Title</Label>
            <Input
              id="title"
              placeholder="e.g. Sports Committee Budget"
              value={activeDraft.title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={activeDraft.category}
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
              placeholder="Additional context for this budget..."
              value={activeDraft.notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="budget-no-print">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Line Items</CardTitle>
            <CardDescription>
              {activeDraft.items.length} item
              {activeDraft.items.length !== 1 ? "s" : ""} · Grand Total:{" "}
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
                  <th className="w-8 pb-2 pr-2">#</th>
                  <th className="min-w-40 pb-2 pr-2">Item</th>
                  <th className="w-20 pb-2 pr-2">Qty</th>
                  <th className="min-w-30 pb-2 pr-2">Unit</th>
                  <th className="w-28 pb-2 pr-2">Unit Price (¥)</th>
                  <th className="w-24 pb-2 pr-2 text-right">Total (¥)</th>
                  <th className="w-8 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {activeDraft.items.map((item, idx) => {
                  const total = calcItemTotal(item.qty, item.unitPrice);
                  const isCustom = item.unit === "custom";
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 text-muted-foreground text-xs">
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
                          placeholder="0"
                          value={item.qty || ""}
                          onChange={(e) =>
                            updateItem(idx, "qty", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex gap-1">
                          <select
                            className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                            style={{ width: isCustom ? "100px" : "100%" }}
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(idx, "unit", e.target.value)
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
                              className="h-8 text-sm min-w-0 flex-1"
                              placeholder="e.g. players"
                              value={item.customUnit}
                              onChange={(e) =>
                                updateItem(idx, "customUnit", e.target.value)
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
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 text-right font-mono font-medium">
                        {fmtRmb(total)}
                      </td>
                      <td className="py-2">
                        {activeDraft.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeItem(idx)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
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

      {/* A4 print area (hidden on screen, shown on print) */}
      <div className="budget-print-area" style={{ display: "none" }}>
        {/* Print header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: "2px solid #C8A061",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/lsuic_logo.png"
            alt="LSUIC"
            style={{ width: 56, height: 56, objectFit: "contain" }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#002868" }}>
              LIBERIAN STUDENT UNION IN CHINA (LSUIC)
            </div>
            <div style={{ fontSize: 10, color: "#C8A061", fontWeight: 600 }}>
              LSUIC 20th Anniversary National Conference — Jinan, China 2026
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/liberia-seal.svg"
            alt="Seal"
            style={{ width: 52, height: 52, objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#002868",
            marginBottom: 4,
          }}
        >
          {activeDraft.title || "Budget Proposal"}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>
          Category:{" "}
          {BUDGET_CATEGORIES[activeDraft.category]?.label ??
            activeDraft.category}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 12 }}>
          Date:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        {activeDraft.notes && (
          <div
            style={{
              fontSize: 10,
              color: "#444",
              marginBottom: 14,
              fontStyle: "italic",
            }}
          >
            {activeDraft.notes}
          </div>
        )}
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}
        >
          <thead>
            <tr style={{ background: "#002868", color: "#fff" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", width: 30 }}>
                #
              </th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Item</th>
              <th style={{ padding: "6px 8px", textAlign: "right", width: 50 }}>
                Qty
              </th>
              <th style={{ padding: "6px 8px", textAlign: "left", width: 70 }}>
                Unit
              </th>
              <th style={{ padding: "6px 8px", textAlign: "right", width: 90 }}>
                Unit Price (¥)
              </th>
              <th style={{ padding: "6px 8px", textAlign: "right", width: 90 }}>
                Total (¥)
              </th>
            </tr>
          </thead>
          <tbody>
            {activeDraft.items.map((item, idx) => (
              <tr
                key={item.id}
                style={{
                  background: idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF",
                  borderBottom: "0.5px solid #e0e0e0",
                }}
              >
                <td style={{ padding: "5px 8px", color: "#666" }}>{item.no}</td>
                <td style={{ padding: "5px 8px" }}>{item.name || "—"}</td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}>
                  {item.qty}
                </td>
                <td style={{ padding: "5px 8px" }}>{unitLabel(item)}</td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}>
                  {fmtRmb(item.unitPrice)}
                </td>
                <td
                  style={{
                    padding: "5px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {fmtRmb(calcItemTotal(item.qty, item.unitPrice))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #002868" }}>
              <td
                colSpan={5}
                style={{
                  padding: "8px",
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                GRAND TOTAL
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "right",
                  fontWeight: 800,
                  fontSize: 13,
                  color: "#C8A061",
                }}
              >
                {fmtRmb(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            justifyContent: "flex-end",
            gap: 80,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                borderTop: "1px solid #002868",
                paddingTop: 4,
                fontSize: 9,
                color: "#555",
                width: 160,
              }}
            >
              Prepared By
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                borderTop: "1px solid #002868",
                paddingTop: 4,
                fontSize: 9,
                color: "#555",
                width: 160,
              }}
            >
              Approved By
            </div>
          </div>
        </div>
      </div>

      {/* Summary / actions bar */}
      <Card className="budget-no-print border-[#C8A061]/30 bg-linear-to-r from-[#C8A061]/5 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {activeDraft.items.filter((i) => i.name).length} items ·{" "}
              {BUDGET_CATEGORIES[activeDraft.category]?.label ??
                activeDraft.category}
            </p>
            <p className="text-xl font-bold">{fmtDual(grandTotal)}</p>
            {activeDraft.savedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last saved{" "}
                {new Date(activeDraft.savedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManualSave}>
              <Save className="size-4" />
              Save Draft
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileSpreadsheet className="size-4" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
