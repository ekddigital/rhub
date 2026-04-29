"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fmtRmb } from "@/lib/conf/currency";
import { fetchDefaultConference } from "@/lib/conf/client";
import { getConferenceFeePackageById } from "@/lib/conf/fees";

type DelegateFinanceRow = {
  id: string;
  userId: string | null;
  delegateCode: string | null;
  name: string;
  city: string;
  university: string | null;
  feePackageId: string | null;
  feeAmount: number | null;
  amountPaid: number | null;
  feePaid: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  createdAt: string;
};

function toMoney(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRow(row: DelegateFinanceRow): DelegateFinanceRow {
  return {
    ...row,
    feeAmount: toMoney(row.feeAmount),
    amountPaid: toMoney(row.amountPaid),
  };
}

function csvEscape(value: string | number | null | undefined): string {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function FinanceSecretaryShell() {
  const [confId, setConfId] = useState("");
  const [rows, setRows] = useState<DelegateFinanceRow[]>([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState<
    "ALL" | "UNPAID" | "PARTIAL" | "PAID"
  >("ALL");
  const [confirmationFilter, setConfirmationFilter] = useState<
    "ALL" | "CONFIRMED_ONLY" | "PENDING_ONLY"
  >("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        const res = await fetch(`/api/conf/${conf.id}/delegates`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load delegates");
        const payload = (await res.json()) as DelegateFinanceRow[];
        setRows(payload.map(normalizeRow));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load finance view");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  useEffect(() => {
    const available = new Set(rows.map((row) => row.id));
    setSelectedIds((prev) => prev.filter((id) => available.has(id)));
  }, [rows]);

  const cityOptions = useMemo(
    () => [...new Set(rows.map((row) => row.city).filter(Boolean))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const amountDue = toMoney(row.feeAmount);
      const amountPaid = toMoney(row.amountPaid);
      const remaining = Math.max(amountDue - amountPaid, 0);
      const paymentState =
        amountPaid <= 0 ? "UNPAID" : remaining > 0 ? "PARTIAL" : "PAID";
      const isFullyConfirmed = row.feePaid && remaining === 0;

      if (cityFilter !== "ALL" && row.city !== cityFilter) return false;
      if (paymentFilter !== "ALL" && paymentState !== paymentFilter) return false;
      if (confirmationFilter === "CONFIRMED_ONLY" && !isFullyConfirmed) {
        return false;
      }
      if (confirmationFilter === "PENDING_ONLY" && isFullyConfirmed) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.delegateCode || "").toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q) ||
        (row.university || "").toLowerCase().includes(q)
      );
    });
  }, [cityFilter, confirmationFilter, paymentFilter, query, rows]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredIds = useMemo(() => filtered.map((row) => row.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedSet.has(id));

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return Array.from(next);
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectFullyConfirmed = () => {
    setSelectedIds(
      filtered
        .filter((row) => {
          const due = toMoney(row.feeAmount);
          const paid = toMoney(row.amountPaid);
          return row.feePaid && paid >= due;
        })
        .map((row) => row.id),
    );
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(Math.max(1, page), totalPages);
  const pageRows = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [effectivePage, filtered, pageSize]);

  const totals = useMemo(() => {
    const due = rows.reduce((sum, row) => sum + toMoney(row.feeAmount), 0);
    const paid = rows.reduce((sum, row) => sum + toMoney(row.amountPaid), 0);
    const fullyPaidCount = rows.filter((row) => {
      const dueAmount = toMoney(row.feeAmount);
      const paidAmount = toMoney(row.amountPaid);
      return row.feePaid && paidAmount >= dueAmount;
    }).length;
    const partialPaidCount = rows.filter((row) => {
      const dueAmount = toMoney(row.feeAmount);
      const paidAmount = toMoney(row.amountPaid);
      return paidAmount > 0 && paidAmount < dueAmount;
    }).length;
    const unpaidCount = rows.filter((row) => toMoney(row.amountPaid) <= 0).length;
    const outstanding = Math.max(due - paid, 0);
    return {
      due,
      paid,
      fullyPaidCount,
      partialPaidCount,
      unpaidCount,
      outstanding,
    };
  }, [rows]);

  const exportSourceRows = useMemo(() => {
    if (selectedIds.length === 0) return filtered;
    return filtered.filter((row) => selectedSet.has(row.id));
  }, [filtered, selectedIds.length, selectedSet]);

  const exportRows = useMemo(() => {
    return exportSourceRows.map((row) => {
      const due = toMoney(row.feeAmount);
      const paid = toMoney(row.amountPaid);
      const remaining = Math.max(due - paid, 0);
      const state = paid <= 0 ? "UNPAID" : remaining > 0 ? "PARTIAL" : "PAID";
      return {
        conferenceId: row.delegateCode || "",
        name: row.name,
        city: row.city,
        university: row.university || "",
        package: row.feePackageId
          ? (getConferenceFeePackageById(row.feePackageId)?.label ?? "")
          : "",
        due,
        paid,
        remaining,
        paymentState: state,
        confirmedPaid: row.feePaid && remaining === 0 ? "Yes" : "No",
        status: row.status,
      };
    });
  }, [exportSourceRows]);

  const handleExportCsv = () => {
    const header = [
      "Conference ID",
      "Name",
      "City",
      "University",
      "Package",
      "Due (RMB)",
      "Paid (RMB)",
      "Remaining (RMB)",
      "Payment State",
      "Confirmed Paid",
      "Delegate Status",
    ];
    const lines = [
      header.map((value) => csvEscape(value)).join(","),
      ...exportRows.map((row) =>
        [
          row.conferenceId,
          row.name,
          row.city,
          row.university,
          row.package,
          row.due,
          row.paid,
          row.remaining,
          row.paymentState,
          row.confirmedPaid,
          row.status,
        ]
          .map((value) => csvEscape(value))
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    downloadBlob("delegate-payment-verification.csv", blob);
  };

  const handleExportTxt = () => {
    const header = [
      "Conference ID",
      "Name",
      "City",
      "University",
      "Package",
      "Due (RMB)",
      "Paid (RMB)",
      "Remaining (RMB)",
      "Payment State",
      "Confirmed Paid",
      "Delegate Status",
    ];
    const lines = [
      header.join("\t"),
      ...exportRows.map((row) =>
        [
          row.conferenceId,
          row.name,
          row.city,
          row.university,
          row.package,
          row.due,
          row.paid,
          row.remaining,
          row.paymentState,
          row.confirmedPaid,
          row.status,
        ]
          .map((value) => String(value ?? "").replace(/\t/g, " ").replace(/\n/g, " "))
          .join("\t"),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob("delegate-payment-verification.txt", blob);
  };

  const handleExportExcel = () => {
    const headers = [
      "Conference ID",
      "Name",
      "City",
      "University",
      "Package",
      "Due (RMB)",
      "Paid (RMB)",
      "Remaining (RMB)",
      "Payment State",
      "Confirmed Paid",
      "Delegate Status",
    ];
    const encode = (text: string) =>
      text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
    const rowsHtml = exportRows
      .map((row) => {
        const values = [
          row.conferenceId,
          row.name,
          row.city,
          row.university,
          row.package,
          String(row.due),
          String(row.paid),
          String(row.remaining),
          row.paymentState,
          row.confirmedPaid,
          row.status,
        ];
        return `<tr>${values.map((value) => `<td>${encode(value)}</td>`).join("")}</tr>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body><table border="1"><thead><tr>${headers
      .map((header) => `<th>${encode(header)}</th>`)
      .join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    downloadBlob("delegate-payment-verification.xls", blob);
  };

  const confirmPayment = async (row: DelegateFinanceRow) => {
    if (!confId || busyId) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const targetAmount = toMoney(row.feeAmount) || toMoney(row.amountPaid);
      const res = await fetch(`/api/conf/${confId}/delegates/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: targetAmount,
          feePaid: true,
          status: "CONFIRMED",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!res.ok) throw new Error(payload.error || "Failed to confirm payment");
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? normalizeRow(payload) : item)),
      );
      setNotice(`Marked ${row.name} as payment-confirmed.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm payment");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#C8A061]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Secretary Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Confirm delegate payments and monitor collection progress in real time.
          </p>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CircleDollarSign className="size-5 text-blue-600" />
            <div>
              <p className="text-lg font-semibold">{fmtRmb(totals.due)}</p>
              <p className="text-xs text-muted-foreground">Total Expected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Wallet className="size-5 text-emerald-600" />
            <div>
              <p className="text-lg font-semibold">{fmtRmb(totals.paid)}</p>
              <p className="text-xs text-muted-foreground">Total Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BadgeCheck className="size-5 text-violet-600" />
            <div>
              <p className="text-lg font-semibold">{totals.fullyPaidCount}</p>
              <p className="text-xs text-muted-foreground">Fully Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="size-5 text-sky-600" />
            <div>
              <p className="text-lg font-semibold">{totals.partialPaidCount}</p>
              <p className="text-xs text-muted-foreground">Partial Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="size-5 text-amber-600" />
            <div>
              <p className="text-lg font-semibold">{fmtRmb(totals.outstanding)}</p>
              <p className="text-xs text-muted-foreground">
                Outstanding ({totals.unpaidCount} unpaid)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Delegate Payment Verification</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="size-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportTxt}>
                <FileText className="size-4" /> TXT
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="size-4" /> Excel
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed px-3 py-2 text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAllFiltered}
              />
              Select all filtered
            </label>
            <Button variant="outline" size="sm" onClick={selectFullyConfirmed}>
              Select confirmed only
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
            >
              Clear selection
            </Button>
            <span className="text-muted-foreground">
              {selectedIds.length} selected (exports use selected rows)
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_170px_170px_170px_120px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, city, university, conference ID"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={confirmationFilter}
              onChange={(e) => {
                setConfirmationFilter(
                  e.target.value as "ALL" | "CONFIRMED_ONLY" | "PENDING_ONLY",
                );
                setPage(1);
              }}
            >
              <option value="ALL">All confirmation</option>
              <option value="CONFIRMED_ONLY">Confirmed only</option>
              <option value="PENDING_ONLY">Pending only</option>
            </select>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(
                  e.target.value as "ALL" | "UNPAID" | "PARTIAL" | "PAID",
                );
                setPage(1);
              }}
            >
              <option value="ALL">All payment state</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="30">30 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="200">200 / page</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {pageRows.map((row) => {
            const amountDue = toMoney(row.feeAmount);
            const amountPaid = toMoney(row.amountPaid);
            const remaining = Math.max(amountDue - amountPaid, 0);
            const paymentState =
              amountPaid <= 0 ? "UNPAID" : remaining > 0 ? "PARTIAL" : "PAID";
            const isFullyConfirmed = row.feePaid && remaining === 0;
            const packageLabel = row.feePackageId
              ? getConferenceFeePackageById(row.feePackageId)?.label
              : null;
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(row.id)}
                    onChange={() => toggleSelectRow(row.id)}
                    className="mt-1"
                  />
                  <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.delegateCode || "No ID"} · {row.city}
                    {row.university ? ` · ${row.university}` : ""}
                  </p>
                  {packageLabel && (
                    <p className="text-xs text-muted-foreground">
                      Package: {packageLabel}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paid {fmtRmb(amountPaid)} / Due {fmtRmb(amountDue)}
                  </p>
                  <p className="text-xs font-medium text-amber-700">
                    Remaining: {fmtRmb(remaining)}
                  </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      paymentState === "PAID"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                        : paymentState === "PARTIAL"
                          ? "border-sky-500/40 bg-sky-500/10 text-sky-700"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-700"
                    }
                  >
                    {paymentState}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      isFullyConfirmed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-700"
                    }
                  >
                    {isFullyConfirmed ? "Confirmed Paid" : "Pending Confirmation"}
                  </Badge>
                  {!isFullyConfirmed && (
                    <Button
                      size="sm"
                      onClick={() => void confirmPayment(row)}
                      disabled={busyId === row.id}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      Confirm Payment
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No delegates match your search.
            </p>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
              <p>
                Showing {(effectivePage - 1) * pageSize + 1} -{" "}
                {Math.min(effectivePage * pageSize, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={effectivePage <= 1}
                >
                  Prev
                </Button>
                <span>
                  Page {effectivePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={effectivePage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
