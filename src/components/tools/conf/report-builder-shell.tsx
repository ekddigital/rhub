"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  Download,
  Plus,
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  TrendingUp,
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
import { fetchDefaultConference } from "@/lib/conf/client";

type Payment = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  committeeScope: string | null;
  isLocked: boolean;
  paidAt: string | null;
  payerName: string | null;
  incomeSource: string | null;
};

type Step = 1 | 2 | 3 | 4;

export function ReportBuilderShell() {
  const [confId, setConfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [step, setStep] = useState<Step>(1);

  // Step 1: filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");

  // Step 2: selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Step 3: comments
  const [lineComments, setLineComments] = useState<Record<string, string>>({});
  const [generalComment, setGeneralComment] = useState("");

  // Step 4: name & save
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        const res = await fetch(`/api/conf/${conf.id}/payments`);
        if (!res.ok) throw new Error("Failed to load payments");
        setPayments((await res.json()) as Payment[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (typeFilter !== "ALL" && p.paymentType !== typeFilter) return false;
      if (scopeFilter && p.committeeScope !== scopeFilter) return false;
      if (dateFrom && p.paidAt && new Date(p.paidAt) < new Date(dateFrom)) return false;
      if (dateTo && p.paidAt && new Date(p.paidAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [payments, typeFilter, scopeFilter, dateFrom, dateTo]);

  const selectedPayments = useMemo(
    () => filteredPayments.filter((p) => selectedIds.has(p.id)),
    [filteredPayments, selectedIds],
  );

  const totalExpense = selectedPayments
    .filter((p) => p.paymentType === "EXPENSE")
    .reduce((s, p) => s + p.amount, 0);

  const totalIncome = selectedPayments
    .filter((p) => p.paymentType === "INCOME")
    .reduce((s, p) => s + p.amount, 0);

  const fmtAmt = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds(new Set(filteredPayments.map((p) => p.id)));

  const clearAll = () => setSelectedIds(new Set());

  const handleSaveReport = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        committeeScope: scopeFilter || undefined,
        paymentTypes: typeFilter === "ALL" ? ["EXPENSE", "INCOME"] : [typeFilter],
        generalComment: generalComment.trim() || undefined,
        paymentIds: Array.from(selectedIds),
        lineComments,
      };
      const res = await fetch(`/api/conf/${confId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save report");
      const report = (await res.json()) as { id: string };
      setSavedReportId(report.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["#", "Description", "Type", "Amount", "Currency", "Status", "Scope", "Comment"],
      ...selectedPayments.map((p, i) => [
        String(i + 1),
        p.description,
        p.paymentType,
        String(p.amount),
        p.currency,
        p.status,
        p.committeeScope ?? "",
        lineComments[p.id] ?? "",
      ]),
      [],
      ["Total Expenses", fmtAmt(totalExpense)],
      ["Total Income", fmtAmt(totalIncome)],
      ["Net", fmtAmt(totalIncome - totalExpense)],
      [],
      ["General Comment:", generalComment],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "conference-report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-ekd-gold" />
      </div>
    );
  }

  const steps = ["Filter", "Select Payments", "Add Comments", "Name & Export"];

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
          <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-sm text-muted-foreground">
            Build and export a financial report
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const idx = (i + 1) as Step;
          const active = idx === step;
          const done = idx < step;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <button
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#C8A061] text-white"
                    : done
                      ? "bg-[#C8A061]/20 text-[#C8A061]"
                      : "bg-muted text-muted-foreground"
                }`}
                onClick={() => done && setStep(idx)}
              >
                <span>{i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {/* Step 1: Filter */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Payments</CardTitle>
            <CardDescription>
              Narrow down which payments to include
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Committee Scope (optional)</Label>
              <Input
                placeholder="e.g. Cooking, Sports — leave blank for all"
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Payment Type</Label>
              <div className="flex gap-2">
                {(["ALL", "EXPENSE", "INCOME"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={typeFilter === t ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => setTypeFilter(t)}
                  >
                    {t === "ALL" ? "All" : t === "EXPENSE" ? "Expenses" : "Income"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <strong>{filteredPayments.length}</strong> payments match filters
            </div>

            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={filteredPayments.length === 0}
            >
              Continue to Selection
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} of {filteredPayments.length} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredPayments.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? "border-[#C8A061]/60 bg-[#C8A061]/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {selected ? (
                    <CheckSquare className="size-4 shrink-0 text-[#C8A061]" />
                  ) : (
                    <Square className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{p.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {p.paidAt && (
                        <span>
                          {new Date(p.paidAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {p.committeeScope && <span>· {p.committeeScope}</span>}
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          p.paymentType === "INCOME"
                            ? "border-green-500/40 text-green-600"
                            : "border-red-500/40 text-red-600"
                        }`}
                      >
                        {p.paymentType}
                      </Badge>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      p.paymentType === "INCOME"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {fmtAmt(p.amount, p.currency)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1"
              disabled={selectedIds.size === 0}
            >
              Continue
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Comments */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Comments</CardTitle>
              <CardDescription>
                Add optional notes for each payment entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPayments.map((p) => (
                <div key={p.id} className="space-y-1">
                  <Label className="text-xs truncate block">
                    {p.description} — {fmtAmt(p.amount, p.currency)}
                  </Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Optional comment for this entry..."
                    value={lineComments[p.id] ?? ""}
                    onChange={(e) =>
                      setLineComments((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-1">
            <Label>General Report Comment</Label>
            <Textarea
              placeholder="Overall notes for this report..."
              className="resize-none"
              rows={3}
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>
            <Button onClick={() => setStep(4)} className="flex-1">
              Continue
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Name & Export */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-red-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <TrendingDown className="size-4" />
                  <span className="text-xs font-medium">Total Expenses</span>
                </div>
                <p className="mt-1 text-xl font-bold">{fmtAmt(totalExpense)}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <TrendingUp className="size-4" />
                  <span className="text-xs font-medium">Total Income</span>
                </div>
                <p className="mt-1 text-xl font-bold">{fmtAmt(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-4" />
                  <span className="text-xs font-medium">Net</span>
                </div>
                <p
                  className={`mt-1 text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {fmtAmt(totalIncome - totalExpense)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Report Title *</Label>
                <Input
                  placeholder="e.g. Q1 2026 Conference Finance Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {savedReportId ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Report saved successfully!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Report ID: {savedReportId}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex-1"
            >
              <Download className="mr-1 size-4" />
              Export CSV
            </Button>

            <Button
              onClick={handleSaveReport}
              className="flex-1"
              disabled={saving || !title.trim()}
            >
              {saving ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Plus className="mr-1 size-4" />
              )}
              {saving ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
