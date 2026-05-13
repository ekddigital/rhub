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
import { formatConferenceOptionalAddOnsSummary } from "@/lib/conf/fees";
import { buildConferenceDelegateFeeBreakdown } from "@/lib/conf/delegate-fee-breakdown";

export type DelegateFinanceRow = {
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
  addOnPackageIds?: string[];
  feeFsApprovedAt?: string | null;
  feeFsApprovedBy?: string | null;
  feeTreasurerAckAt?: string | null;
  feeTreasurerAckBy?: string | null;
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
    addOnPackageIds: Array.isArray(row.addOnPackageIds) ? row.addOnPackageIds : [],
    feeFsApprovedAt: row.feeFsApprovedAt ?? null,
    feeFsApprovedBy: row.feeFsApprovedBy ?? null,
    feeTreasurerAckAt: row.feeTreasurerAckAt ?? null,
    feeTreasurerAckBy: row.feeTreasurerAckBy ?? null,
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

export function ConferenceFinanceDelegatesBoard({
  variant,
}: {
  variant: "fs" | "treasurer";
}) {
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
  const [fsQueueFilter, setFsQueueFilter] = useState<
    "ALL" | "AWAITING_FS_RELEASE" | "FS_RELEASED"
  >("ALL");
  const [treasurerAckFilter, setTreasurerAckFilter] = useState<
    "ALL" | "ACKED" | "UNACKED"
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
        const res = await fetch(
          `/api/conf/${conf.id}/delegates/finance?lane=${variant}`,
          {
            cache: "no-store",
          },
        );
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
  }, [variant]);

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
      const isFsReleased = Boolean(row.feeFsApprovedAt);
      const isTreasurerAcked = Boolean(row.feeTreasurerAckAt);

      if (variant === "fs") {
        if (fsQueueFilter === "AWAITING_FS_RELEASE" && (!isFullyConfirmed || isFsReleased)) {
          return false;
        }
        if (fsQueueFilter === "FS_RELEASED" && !isFsReleased) return false;
      } else {
        if (treasurerAckFilter === "ACKED" && !isTreasurerAcked) return false;
        if (treasurerAckFilter === "UNACKED" && isTreasurerAcked) return false;
      }

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
  }, [
    cityFilter,
    confirmationFilter,
    fsQueueFilter,
    paymentFilter,
    query,
    rows,
    treasurerAckFilter,
    variant,
  ]);

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
      const breakdown = buildConferenceDelegateFeeBreakdown({
        feePackageId: row.feePackageId,
        addOnPackageIds: row.addOnPackageIds,
        feeAmount: row.feeAmount,
      });
      return {
        conferenceId: row.delegateCode || "",
        name: row.name,
        city: row.city,
        university: row.university || "",
        package:
          breakdown.requiredPackageLabel ??
          (row.feePackageId ? row.feePackageId : ""),
        optionalAddOns: formatConferenceOptionalAddOnsSummary(
          row.addOnPackageIds ?? [],
        ),
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
      "Optional add-ons",
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
          row.optionalAddOns,
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
      "Optional add-ons",
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
          row.optionalAddOns,
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
      "Optional add-ons",
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
          row.optionalAddOns,
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

      const approveRes = await fetch(
        `/api/conf/${confId}/delegates/${row.id}/fee-fs-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        },
      );
      const approved = (await approveRes.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!approveRes.ok) {
        throw new Error(
          approved.error ||
            "Payment saved but FS release failed. Try “Release to treasurer” from the row.",
        );
      }

      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? normalizeRow({
                ...item,
                ...approved,
                addOnPackageIds: Array.isArray(approved.addOnPackageIds)
                  ? approved.addOnPackageIds
                  : item.addOnPackageIds,
              })
            : item,
        ),
      );
      setNotice(`Marked ${row.name} as paid and released to the Treasurer queue.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm payment");
    } finally {
      setBusyId(null);
    }
  };

  const releaseToTreasurerOnly = async (row: DelegateFinanceRow) => {
    if (!confId || busyId) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const approveRes = await fetch(
        `/api/conf/${confId}/delegates/${row.id}/fee-fs-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        },
      );
      const approved = (await approveRes.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!approveRes.ok) {
        throw new Error(approved.error || "Failed to release to treasurer");
      }
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? normalizeRow({
                ...item,
                ...approved,
                addOnPackageIds: Array.isArray(approved.addOnPackageIds)
                  ? approved.addOnPackageIds
                  : item.addOnPackageIds,
              })
            : item,
        ),
      );
      setNotice(`Released ${row.name} to the Treasurer queue.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to release to treasurer");
    } finally {
      setBusyId(null);
    }
  };

  const revokeFsRelease = async (row: DelegateFinanceRow) => {
    if (!confId || busyId) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const revokeRes = await fetch(
        `/api/conf/${confId}/delegates/${row.id}/fee-fs-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        },
      );
      const payload = (await revokeRes.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!revokeRes.ok) throw new Error(payload.error || "Failed to revoke FS release");
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? normalizeRow({
                ...item,
                ...payload,
                addOnPackageIds: Array.isArray(payload.addOnPackageIds)
                  ? payload.addOnPackageIds
                  : item.addOnPackageIds,
              })
            : item,
        ),
      );
      setNotice(`Revoked treasurer-queue release for ${row.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke release");
    } finally {
      setBusyId(null);
    }
  };

  const treasurerAck = async (row: DelegateFinanceRow) => {
    if (!confId || busyId) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/conf/${confId}/delegates/${row.id}/fee-treasurer-ack`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ack" }),
        },
      );
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!res.ok) throw new Error(payload.error || "Failed to record acknowledgement");
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? normalizeRow({
                ...item,
                ...payload,
                addOnPackageIds: Array.isArray(payload.addOnPackageIds)
                  ? payload.addOnPackageIds
                  : item.addOnPackageIds,
              })
            : item,
        ),
      );
      setNotice(`Recorded treasurer acknowledgement for ${row.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to acknowledge");
    } finally {
      setBusyId(null);
    }
  };

  const treasurerUnack = async (row: DelegateFinanceRow) => {
    if (!confId || busyId) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/conf/${confId}/delegates/${row.id}/fee-treasurer-ack`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unack" }),
        },
      );
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!res.ok) throw new Error(payload.error || "Failed to clear acknowledgement");
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? normalizeRow({
                ...item,
                ...payload,
                addOnPackageIds: Array.isArray(payload.addOnPackageIds)
                  ? payload.addOnPackageIds
                  : item.addOnPackageIds,
              })
            : item,
        ),
      );
      setNotice(`Cleared acknowledgement for ${row.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear acknowledgement");
    } finally {
      setBusyId(null);
    }
  };

  const markPaymentPending = async (row: DelegateFinanceRow) => {
    if (!confId || busyId) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const revokeRes = await fetch(
        `/api/conf/${confId}/delegates/${row.id}/fee-fs-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke" }),
        },
      );
      if (!revokeRes.ok) {
        const errBody = (await revokeRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || "Failed to revoke FS release");
      }

      const res = await fetch(`/api/conf/${confId}/delegates/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feePaid: false,
          status: "REGISTERED",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      } & DelegateFinanceRow;
      if (!res.ok) throw new Error(payload.error || "Failed to mark as pending");
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? normalizeRow({
                ...item,
                ...payload,
                addOnPackageIds: Array.isArray(payload.addOnPackageIds)
                  ? payload.addOnPackageIds
                  : item.addOnPackageIds,
              })
            : item,
        ),
      );
      setNotice(`Moved ${row.name} back to pending confirmation.`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to revert payment confirmation",
      );
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
            {variant === "fs"
              ? "Financial Secretary — delegate payments"
              : "Treasurer — released delegates"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {variant === "fs"
              ? "Verify proof and balances, confirm paid amounts, then release each delegate to the Treasurer queue. Treasurers cannot see unreleased records."
              : "Only delegates released by the Financial Secretary (or Chair / Super Admin) appear here. Record official receipt acknowledgement for your files."}
          </p>
        </div>
      </div>

      <Card
        className={
          variant === "fs"
            ? "border-[#002868]/20 bg-[#002868]/[0.06]"
            : "border-amber-600/25 bg-amber-500/[0.07]"
        }
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {variant === "fs" ? "FS workflow (verification → release)" : "Treasurer workflow (receipts)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          {variant === "fs" ? (
            <>
              <p>
                <span className="font-medium text-foreground">You:</span> match
                remittance proof to the delegate package, adjust paid amounts if needed,
                then use <span className="font-medium text-foreground">Confirm &amp; release</span>{" "}
                when the balance is cleared. That action moves the row to the Treasurer
                dashboard.
              </p>
              <p>
                <span className="font-medium text-foreground">Treasurer:</span> works only
                in the separate Treasurer area (amber navigation) and never edits your
                verification queue.
              </p>
            </>
          ) : (
            <>
              <p>
                Every delegate listed here is already FS-released. Use{" "}
                <span className="font-medium text-foreground">Acknowledge receipt</span> when
                your official receipt / custody step is complete.
              </p>
              <p>
                To question a release, coordinate with the Financial Secretary or Chair —
                you cannot change paid amounts in this view.
              </p>
            </>
          )}
        </CardContent>
      </Card>

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
            <CardTitle className="text-base">
              {variant === "fs"
                ? "Delegate payment verification (FS)"
                : "Treasurer register (FS-released only)"}
            </CardTitle>
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
          <div className="grid gap-2 md:grid-cols-[1fr_140px_140px_140px_140px_100px]">
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
            {variant === "fs" ? (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={fsQueueFilter}
                onChange={(e) => {
                  setFsQueueFilter(
                    e.target.value as
                      | "ALL"
                      | "AWAITING_FS_RELEASE"
                      | "FS_RELEASED",
                  );
                  setPage(1);
                }}
              >
                <option value="ALL">All FS queue</option>
                <option value="AWAITING_FS_RELEASE">Awaiting FS release</option>
                <option value="FS_RELEASED">Released to Treasurer</option>
              </select>
            ) : (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={treasurerAckFilter}
                onChange={(e) => {
                  setTreasurerAckFilter(e.target.value as "ALL" | "ACKED" | "UNACKED");
                  setPage(1);
                }}
              >
                <option value="ALL">All receipt states</option>
                <option value="ACKED">Receipt acknowledged</option>
                <option value="UNACKED">Not acknowledged</option>
              </select>
            )}
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
            const feeBreakdown = buildConferenceDelegateFeeBreakdown({
              feePackageId: row.feePackageId,
              addOnPackageIds: row.addOnPackageIds,
              feeAmount: row.feeAmount,
            });
            const packageTitle =
              feeBreakdown.requiredPackageLabel ?? "No required package recorded";
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(row.id)}
                    onChange={() => toggleSelectRow(row.id)}
                    className="mt-1 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.delegateCode || "No ID"} · {row.city}
                      {row.university ? ` · ${row.university}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Package:</span>{" "}
                      {packageTitle}
                    </p>
                    {feeBreakdown.jersey && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Jersey:</span>{" "}
                        {feeBreakdown.jersey.label} × {feeBreakdown.jersey.quantity}{" "}
                        ({fmtRmb(feeBreakdown.jersey.unitPrice)} per set) —{" "}
                        {fmtRmb(feeBreakdown.jersey.subtotal)}
                      </p>
                    )}
                    {feeBreakdown.otherOptionalLines.map((line) => (
                      <p key={line.packageId} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Add-on:</span>{" "}
                        {line.label} — {fmtRmb(line.subtotal)}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Paid {fmtRmb(amountPaid)} / Due {fmtRmb(amountDue)}
                    </p>
                    <p className="text-xs font-medium text-amber-700">
                      Remaining: {fmtRmb(remaining)}
                    </p>
                    <details className="group mt-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs">
                      <summary className="cursor-pointer font-medium text-muted-foreground select-none marker:text-muted-foreground">
                        Payment breakdown
                      </summary>
                      <div className="mt-2 space-y-1 border-t border-border/50 pt-2 text-muted-foreground">
                        <p>
                          Required package total:{" "}
                          <span className="font-medium text-foreground">
                            {fmtRmb(feeBreakdown.corePackageSubtotal)}
                          </span>
                        </p>
                        {feeBreakdown.jersey && (
                          <p>
                            {feeBreakdown.jersey.label} ×{" "}
                            {feeBreakdown.jersey.quantity}:{" "}
                            <span className="font-medium text-foreground">
                              {fmtRmb(feeBreakdown.jersey.subtotal)}
                            </span>
                          </p>
                        )}
                        {feeBreakdown.otherOptionalLines.map((line) => (
                          <p key={line.packageId}>
                            {line.label}:{" "}
                            <span className="font-medium text-foreground">
                              {fmtRmb(line.subtotal)}
                            </span>
                          </p>
                        ))}
                        <p>
                          Optional add-ons total:{" "}
                          <span className="font-medium text-foreground">
                            {fmtRmb(feeBreakdown.optionalAddOnsSubtotal)}
                          </span>
                        </p>
                        <p>
                          Total (package + add-ons):{" "}
                          <span className="font-medium text-foreground">
                            {fmtRmb(feeBreakdown.computedDueTotal)}
                          </span>
                        </p>
                        <p>
                          Recorded due (stored):{" "}
                          <span className="font-medium text-foreground">
                            {fmtRmb(amountDue)}
                          </span>
                        </p>
                        {!feeBreakdown.reconcilesWithPackageModel && (
                          <p className="text-amber-800">
                            Stored due does not match package + add-ons (manual
                            adjustment, unknown package id, or legacy data).
                          </p>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                    {isFullyConfirmed ? "Paid up" : "Balance open"}
                  </Badge>
                  {variant === "fs" && (
                    <Badge
                      variant="outline"
                      className={
                        row.feeFsApprovedAt
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-800"
                          : "border-slate-400/40 bg-muted text-muted-foreground"
                      }
                    >
                      {row.feeFsApprovedAt ? "Treasurer queue" : "FS hold"}
                    </Badge>
                  )}
                  {variant === "treasurer" && (
                    <Badge
                      variant="outline"
                      className={
                        row.feeTreasurerAckAt
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800"
                          : "border-amber-600/40 bg-amber-500/10 text-amber-900"
                      }
                    >
                      {row.feeTreasurerAckAt ? "Receipt logged" : "Receipt pending"}
                    </Badge>
                  )}
                  {variant === "fs" && !isFullyConfirmed && (
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
                      Confirm &amp; release
                    </Button>
                  )}
                  {variant === "fs" && isFullyConfirmed && !row.feeFsApprovedAt && (
                    <Button
                      size="sm"
                      onClick={() => void releaseToTreasurerOnly(row)}
                      disabled={busyId === row.id}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      Release to Treasurer
                    </Button>
                  )}
                  {variant === "fs" && row.feeFsApprovedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void revokeFsRelease(row)}
                      disabled={busyId === row.id}
                    >
                      Revoke release
                    </Button>
                  )}
                  {variant === "fs" && isFullyConfirmed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => void markPaymentPending(row)}
                      disabled={busyId === row.id}
                    >
                      Mark unpaid
                    </Button>
                  )}
                  {variant === "treasurer" && !row.feeTreasurerAckAt && (
                    <Button
                      size="sm"
                      onClick={() => void treasurerAck(row)}
                      disabled={busyId === row.id}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="size-4" />
                      )}
                      Acknowledge receipt
                    </Button>
                  )}
                  {variant === "treasurer" && row.feeTreasurerAckAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void treasurerUnack(row)}
                      disabled={busyId === row.id}
                    >
                      Clear acknowledgement
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
