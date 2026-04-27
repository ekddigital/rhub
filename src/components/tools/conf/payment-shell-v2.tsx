"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  ImageIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Shield,
  ShieldCheck,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
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
import { PAY_METHODS } from "@/lib/conf/config";
import { fmtRmb } from "@/lib/conf/currency";
import { fetchDefaultConference } from "@/lib/conf/client";

type PaymentStatus = "PENDING" | "COMMITTEE_APPROVED" | "APPROVED" | "REJECTED";
type PaymentType = "EXPENSE" | "INCOME";

type Proof = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
};

type Payment = {
  id: string;
  amount: number;
  paidBy: string;
  paidTo: string | null;
  method: string;
  ref: string | null;
  note: string | null;
  status: PaymentStatus;
  paymentType: PaymentType;
  incomeSource: string | null;
  committeeScope: string | null;
  isLocked: boolean;
  committeeApprovedBy: string | null;
  committeeApprovedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string;
  createdAt: string;
  proofs: Proof[];
  submittedBy: {
    id: string;
    name: string;
    role: string;
    committeeScope: string | null;
  } | null;
  committeeApprover: { id: string; name: string; role: string } | null;
  budget: { id: string; title: string } | null;
};

type AccessInfo = {
  isManager: boolean;
  isChair: boolean;
  isSuperAdmin: boolean;
  canApprovePayments: boolean;
  memberId: string | null;
  committeeScope: string | null;
};

const STATUS_CONFIG: Record<
  PaymentStatus,
  { icon: React.ElementType; label: string; color: string; badgeClass: string }
> = {
  PENDING: {
    icon: Clock,
    label: "Pending",
    color: "text-yellow-500",
    badgeClass:
      "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  },
  COMMITTEE_APPROVED: {
    icon: ShieldCheck,
    label: "Committee Approved",
    color: "text-blue-500",
    badgeClass:
      "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  APPROVED: {
    icon: CheckCircle2,
    label: "Final Approved",
    color: "text-green-500",
    badgeClass:
      "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  },
  REJECTED: {
    icon: XCircle,
    label: "Rejected",
    color: "text-red-500",
    badgeClass:
      "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  },
};

const INCOME_SOURCES = [
  "Fundraising",
  "Donation",
  "Sponsorship",
  "Contribution",
  "Other",
];

export function PaymentShell({ accessInfo }: { accessInfo?: AccessInfo }) {
  const [confId, setConfId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<PaymentType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "ALL">(
    "ALL",
  );
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form fields
  const [paymentType, setPaymentType] = useState<PaymentType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState("WECHAT");
  const [txRef, setTxRef] = useState("");
  const [note, setNote] = useState("");
  const [committeeScope, setCommitteeScope] = useState("");
  const [incomeSource, setIncomeSource] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPayments = useCallback(
    async (id: string) => {
      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const res = await fetch(`/api/conf/${id}/payments?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load payments");
      return (await res.json()) as Payment[];
    },
    [filterType, filterStatus],
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        const data = await loadPayments(conf.id);
        setPayments(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [loadPayments]);

  const refresh = async () => {
    if (!confId) return;
    setLoading(true);
    try {
      setPayments(await loadPayments(confId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(
      (f) =>
        ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(
          f.type,
        ) && f.size <= 10 * 1024 * 1024,
    );
    setProofFiles((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () =>
          setProofPreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      } else {
        setProofPreviews((prev) => [...prev, ""]);
      }
    });
  };

  const handleSubmit = async () => {
    if (!amount || !paidBy || !confId || saving) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Create payment record
      const res = await fetch(`/api/conf/${confId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          paidBy,
          paidTo: paidTo || undefined,
          method,
          ref: txRef || undefined,
          note: note || undefined,
          paymentType,
          incomeSource:
            paymentType === "INCOME" ? incomeSource || undefined : undefined,
          committeeScope: committeeScope || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to create payment");
      }
      const payment = (await res.json()) as Payment;

      // 2. Upload proof files if any
      for (const file of proofFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("paymentId", payment.id);
        await fetch(`/api/conf/${confId}/payments/${payment.id}/proof`, {
          method: "POST",
          body: fd,
        });
      }

      setPayments((prev) => [payment, ...prev]);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (
    paymentId: string,
    level: "committee" | "final",
  ) => {
    if (!confId || actionLoading) return;
    setActionLoading(paymentId + level);
    try {
      const endpoint =
        level === "committee"
          ? `/api/conf/${confId}/payments/${paymentId}/approve`
          : `/api/conf/${confId}/payments/${paymentId}/final-approve`;
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to approve");
      }
      const updated = (await res.json()) as Payment;
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? updated : p)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confId || !rejectReason.trim() || actionLoading) return;
    setActionLoading(paymentId + "reject");
    try {
      const res = await fetch(
        `/api/conf/${confId}/payments/${paymentId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to reject");
      }
      const updated = (await res.json()) as Payment;
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? updated : p)),
      );
      setRejectingId(null);
      setRejectReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setPaymentType("EXPENSE");
    setAmount("");
    setPaidBy("");
    setPaidTo("");
    setMethod("WECHAT");
    setTxRef("");
    setNote("");
    setCommitteeScope("");
    setIncomeSource("");
    setProofFiles([]);
    setProofPreviews([]);
    setShowForm(false);
  };

  const expenses = payments.filter(
    (p) => p.paymentType === "EXPENSE" || !p.paymentType,
  );
  const incomes = payments.filter((p) => p.paymentType === "INCOME");
  const totalExpense = expenses.reduce((s, p) => s + p.amount, 0);
  const totalIncome = incomes.reduce((s, p) => s + p.amount, 0);
  const lockedCount = payments.filter((p) => p.isLocked).length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-ekd-gold" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Payment Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Record expenses and incoming funds · Two-tier approval workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon-sm" onClick={refresh}>
            <RefreshCw className="size-4" />
          </Button>
          {accessInfo?.isManager && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4" />
              New Record
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-red-500/10 p-2">
              <TrendingDown className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{fmtRmb(totalExpense)}</p>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{fmtRmb(totalIncome)}</p>
              <p className="text-xs text-muted-foreground">Total Income</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Clock className="size-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Awaiting Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Lock className="size-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{lockedCount}</p>
              <p className="text-xs text-muted-foreground">Locked Records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(["ALL", "EXPENSE", "INCOME"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={filterType === t ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilterType(t)}
            >
              {t === "ALL"
                ? "All Types"
                : t === "EXPENSE"
                  ? "Expenses"
                  : "Income"}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(
            [
              "ALL",
              "PENDING",
              "COMMITTEE_APPROVED",
              "APPROVED",
              "REJECTED",
            ] as const
          ).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilterStatus(s)}
            >
              {s === "ALL"
                ? "All Status"
                : s === "COMMITTEE_APPROVED"
                  ? "Cmt. Approved"
                  : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">New Financial Record</CardTitle>
            <CardDescription>
              Record an expense payment or incoming funds with proof of
              transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Type Toggle */}
            <div className="space-y-2">
              <Label>Record Type</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={paymentType === "EXPENSE" ? "default" : "outline"}
                  onClick={() => setPaymentType("EXPENSE")}
                  className={
                    paymentType === "EXPENSE"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : ""
                  }
                >
                  <TrendingDown className="size-3.5" />
                  Expense (Outgoing)
                </Button>
                <Button
                  size="sm"
                  variant={paymentType === "INCOME" ? "default" : "outline"}
                  onClick={() => setPaymentType("INCOME")}
                  className={
                    paymentType === "INCOME"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : ""
                  }
                >
                  <TrendingUp className="size-3.5" />
                  Income (Incoming Funds)
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount (¥ RMB) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {paymentType === "EXPENSE" ? (
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    {Object.entries(PAY_METHODS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {String(label)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Income Source</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                  >
                    <option value="">Select source...</option>
                    {INCOME_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>
                  {paymentType === "EXPENSE" ? "Paid By *" : "Received From *"}
                </Label>
                <Input
                  placeholder={
                    paymentType === "EXPENSE"
                      ? "Who made the payment"
                      : "Donor / contributor name"
                  }
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {paymentType === "EXPENSE" ? "Paid To" : "Received By"}
                </Label>
                <Input
                  placeholder={
                    paymentType === "EXPENSE"
                      ? "Recipient"
                      : "Who received the funds"
                  }
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Committee</Label>
                <Input
                  placeholder="e.g. Cooking, Sports, Logistics"
                  value={committeeScope}
                  onChange={(e) => setCommitteeScope(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction Ref</Label>
                <Input
                  placeholder="Reference number"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description / Note</Label>
              <Textarea
                placeholder="Describe this transaction..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            {/* Proof Upload */}
            <div className="space-y-2">
              <Label>Proof of Payment / Receipt</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 transition-colors hover:border-[#C8A061]/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload screenshots or receipts (PNG, JPEG, PDF)
                </p>
                <p className="text-xs text-muted-foreground">Max 10 MB each</p>
              </div>
              {proofPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {proofPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative size-20 overflow-hidden rounded-lg border"
                    >
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt={`Proof ${idx + 1}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <ImageIcon className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!amount || !paidBy || saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {saving ? "Saving..." : "Submit for Approval"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {payments.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <DollarSign className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No payments recorded yet</p>
            <p className="text-sm text-muted-foreground">
              Start by adding an expense or incoming fund record
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment List */}
      <div className="space-y-3">
        {payments.map((payment) => {
          const config = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING;
          const StatusIcon = config.icon;
          const isExpense =
            payment.paymentType === "EXPENSE" || !payment.paymentType;
          const isRejecting = rejectingId === payment.id;

          return (
            <Card
              key={payment.id}
              className={payment.isLocked ? "border-purple-500/30" : ""}
            >
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-1">
                    {/* Amount + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xl font-bold ${isExpense ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                      >
                        {isExpense ? "−" : "+"}
                        {fmtRmb(payment.amount)}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          isExpense
                            ? "border-red-500/40 text-red-600 dark:text-red-400"
                            : "border-green-500/40 text-green-600 dark:text-green-400"
                        }
                      >
                        {isExpense ? "Expense" : "Income"}
                      </Badge>
                      <Badge variant="outline" className={config.badgeClass}>
                        <StatusIcon className={`mr-1 size-3 ${config.color}`} />
                        {config.label}
                      </Badge>
                      {payment.isLocked && (
                        <Badge
                          variant="outline"
                          className="border-purple-500/40 text-purple-600 dark:text-purple-400"
                        >
                          <Lock className="mr-1 size-3" />
                          Locked
                        </Badge>
                      )}
                      {payment.committeeScope && (
                        <Badge variant="secondary" className="text-xs">
                          {payment.committeeScope}
                        </Badge>
                      )}
                    </div>

                    {/* Parties */}
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        {isExpense ? "Paid by" : "From"}
                      </span>{" "}
                      <span className="font-medium">{payment.paidBy}</span>
                      {payment.paidTo && (
                        <>
                          {" "}
                          <span className="text-muted-foreground">
                            {isExpense ? "to" : "received by"}
                          </span>{" "}
                          <span className="font-medium">{payment.paidTo}</span>
                        </>
                      )}
                    </p>

                    {payment.incomeSource && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Source: {payment.incomeSource}
                      </p>
                    )}

                    {payment.note && (
                      <p className="text-xs text-muted-foreground">
                        {payment.note}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>
                        {PAY_METHODS[
                          payment.method as keyof typeof PAY_METHODS
                        ] ?? payment.method}
                      </span>
                      {payment.ref && <span>· Ref: {payment.ref}</span>}
                      <span>
                        ·{" "}
                        {new Date(payment.paidAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {payment.submittedBy && (
                        <span>· By {payment.submittedBy.name}</span>
                      )}
                    </div>

                    {/* Approval trail */}
                    {payment.committeeApprover && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="mr-1 inline-block size-3" />
                        Committee approved by {payment.committeeApprover.name}
                      </p>
                    )}
                    {payment.approvedBy && payment.status === "APPROVED" && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="mr-1 inline-block size-3" />
                        Finally approved ·{" "}
                        {payment.approvedAt
                          ? new Date(payment.approvedAt).toLocaleDateString()
                          : ""}
                      </p>
                    )}
                  </div>

                  {/* Proof thumbnails */}
                  {payment.proofs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {payment.proofs.slice(0, 4).map((proof) => (
                        <a
                          key={proof.id}
                          href={proof.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block size-16 overflow-hidden rounded border border-muted hover:opacity-80 transition-opacity"
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
                              <ImageIcon className="size-6 text-muted-foreground" />
                            </div>
                          )}
                        </a>
                      ))}
                      {payment.proofs.length > 4 && (
                        <div className="flex size-16 items-center justify-center rounded border border-muted bg-muted text-xs text-muted-foreground">
                          +{payment.proofs.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Approval Actions */}
                {!payment.isLocked &&
                  payment.status !== "REJECTED" &&
                  (accessInfo?.canApprovePayments ||
                    accessInfo?.isChair ||
                    accessInfo?.isSuperAdmin) && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      {/* Committee-level approve (Level 1) */}
                      {payment.status === "PENDING" &&
                        accessInfo?.canApprovePayments &&
                        (accessInfo?.isSuperAdmin ||
                          (Boolean(accessInfo?.committeeScope) &&
                            payment.committeeScope ===
                              accessInfo?.committeeScope)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-blue-500/40 text-blue-600 hover:bg-blue-500/10 text-xs"
                            onClick={() =>
                              handleApprove(payment.id, "committee")
                            }
                            disabled={
                              actionLoading === payment.id + "committee"
                            }
                          >
                            {actionLoading === payment.id + "committee" ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="size-3" />
                            )}
                            Committee Approve
                          </Button>
                        )}

                      {/* Final approve (Level 2) — chair or super admin */}
                      {(payment.status === "PENDING" ||
                        payment.status === "COMMITTEE_APPROVED") &&
                        (accessInfo?.isChair || accessInfo?.isSuperAdmin) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-green-500/40 text-green-600 hover:bg-green-500/10 text-xs"
                            onClick={() => handleApprove(payment.id, "final")}
                            disabled={actionLoading === payment.id + "final"}
                          >
                            {actionLoading === payment.id + "final" ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Shield className="size-3" />
                            )}
                            Final Approve &amp; Lock
                          </Button>
                        )}

                      {/* Reject */}
                      {!isRejecting ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-red-500/40 text-red-600 hover:bg-red-500/10 text-xs"
                          onClick={() => {
                            setRejectingId(payment.id);
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="size-3" />
                          Reject
                        </Button>
                      ) : (
                        <div className="flex w-full items-center gap-2 mt-1">
                          <Input
                            className="h-7 text-xs flex-1"
                            placeholder="Rejection reason (required)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            disabled={
                              !rejectReason.trim() ||
                              actionLoading === payment.id + "reject"
                            }
                            onClick={() => handleReject(payment.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setRejectingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Builder Link */}
      {payments.length > 0 && (
        <div className="flex justify-end">
          <Link href="/tools/conf/finance/reports">
            <Button variant="outline" size="sm">
              Build Report from these Payments
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
