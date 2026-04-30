"use client";

import { useState, useRef } from "react";
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
  Printer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PAY_METHODS } from "@/lib/conf/config";
import { fmtRmb } from "@/lib/conf/currency";
import { LETTERHEAD_CONFIG } from "@/lib/conf/letterhead-config";
import { LetterheadDisplay } from "@/components/tools/conf/letterhead-display";

type LocalPayment = {
  id: string;
  amount: number;
  paidBy: string;
  paidTo: string;
  method: string;
  ref: string;
  note: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  proofFiles: File[];
  proofPreviews: string[];
  createdAt: Date;
};

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    label: "Pending",
    variant: "outline" as const,
    color: "text-yellow-500",
  },
  APPROVED: {
    icon: CheckCircle2,
    label: "Approved",
    variant: "default" as const,
    color: "text-green-500",
  },
  REJECTED: {
    icon: XCircle,
    label: "Rejected",
    variant: "destructive" as const,
    color: "text-red-500",
  },
};

export function PaymentShell() {
  const [payments, setPayments] = useState<LocalPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState("WECHAT");
  const [txRef, setTxRef] = useState("");
  const [note, setNote] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) =>
        ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(
          f.type,
        ) && f.size <= 10 * 1024 * 1024,
    );
    setProofFiles((prev) => [...prev, ...validFiles]);

    // Generate previews for images
    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setProofPreviews((prev) => [...prev, ""]);
      }
    });
  };

  const handleAddPayment = () => {
    if (!amount || !paidBy) return;

    const payment: LocalPayment = {
      id: `local_${Date.now()}`,
      amount: Number(amount),
      paidBy,
      paidTo,
      method,
      ref: txRef,
      note,
      status: "PENDING",
      proofFiles,
      proofPreviews,
      createdAt: new Date(),
    };

    setPayments((prev) => [payment, ...prev]);
    setAmount("");
    setPaidBy("");
    setPaidTo("");
    setMethod("WECHAT");
    setTxRef("");
    setNote("");
    setProofFiles([]);
    setProofPreviews([]);
    setShowForm(false);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const approvedTotal = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .payments-print-area, .payments-print-area * { visibility: visible; }
          .payments-no-print { display: none !important; }
          .payments-print-area {
            position: fixed; left: 0; top: 0;
            width: 210mm; padding: 0 16mm 12mm;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Letterhead Display - visible while editing */}
      <LetterheadDisplay
        confName={`${LETTERHEAD_CONFIG.defaultConferenceName} · Payment Tracker`}
      />

      {/* Header */}
      <div className="payments-no-print flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Payment Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Record payments and upload receipt screenshots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / PDF
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="payments-no-print grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <DollarSign className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{fmtRmb(totalPaid)}</p>
              <p className="text-xs text-muted-foreground">Total Recorded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-green-500/10 p-2">
              <CheckCircle2 className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{fmtRmb(approvedTotal)}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Clock className="size-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {payments.filter((p) => p.status === "PENDING").length}
              </p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Form */}
      {showForm && (
        <Card className="payments-no-print border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">New Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount (¥)</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {Object.entries(PAY_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Paid By</Label>
                <Input
                  placeholder="Who made the payment"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Paid To</Label>
                <Input
                  placeholder="Recipient"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction Ref</Label>
                <Input
                  placeholder="Transaction reference number"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                placeholder="Description of this payment..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <Label>Payment Screenshot / Receipt</Label>
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
                  Click to upload screenshots (PNG, JPEG, PDF)
                </p>
                <p className="text-xs text-muted-foreground">Max 10MB each</p>
              </div>

              {/* Previews */}
              {proofPreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddPayment}
                disabled={!amount || !paidBy}
              >
                <Plus className="size-4" />
                Record Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment List */}
      {payments.length === 0 && !showForm && (
        <Card className="payments-no-print">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <DollarSign className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No payments recorded yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;Add Payment&quot; to record a payment with receipt
              screenshot
            </p>
          </CardContent>
        </Card>
      )}

      <div className="payments-no-print space-y-3">
        {payments.map((payment) => {
          const config = STATUS_CONFIG[payment.status];
          const StatusIcon = config.icon;
          return (
            <Card key={payment.id}>
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {fmtRmb(payment.amount)}
                    </span>
                    <Badge variant={config.variant}>
                      <StatusIcon className={`size-3 ${config.color}`} />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Paid by</span>{" "}
                    <span className="font-medium">{payment.paidBy}</span>
                    {payment.paidTo && (
                      <>
                        {" "}
                        <span className="text-muted-foreground">to</span>{" "}
                        <span className="font-medium">{payment.paidTo}</span>
                      </>
                    )}
                  </p>
                  {payment.note && (
                    <p className="text-xs text-muted-foreground">
                      {payment.note}
                    </p>
                  )}
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{PAY_METHODS[payment.method] || payment.method}</span>
                    {payment.ref && <span>· Ref: {payment.ref}</span>}
                    <span>· {payment.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                {/* Proof thumbnails */}
                {payment.proofPreviews.length > 0 && (
                  <div className="flex gap-2">
                    {payment.proofPreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="size-16 overflow-hidden rounded-lg border"
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
                            <ImageIcon className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* A4 print area (hidden on screen, shown on print) */}
      <div className="payments-print-area" style={{ display: "none" }}>
        <LetterheadDisplay
          confName={`${LETTERHEAD_CONFIG.defaultConferenceName} · Payment Tracker`}
          printOnly
          className="px-0"
        />
        <div style={{ marginTop: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#002868" }}>
            Payment Summary
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
            Date:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
            Total Recorded: {fmtRmb(totalPaid)} · Verified: {fmtRmb(approvedTotal)}
          </div>
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}
        >
          <thead>
            <tr style={{ background: "#002868", color: "#fff" }}>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Paid By</th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Paid To</th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Method</th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Ref</th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: "10px 8px", color: "#666", textAlign: "center" }}
                >
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((payment, idx) => (
                <tr
                  key={payment.id}
                  style={{
                    background: idx % 2 === 0 ? "#FAFAFA" : "#FFFFFF",
                    borderBottom: "0.5px solid #e0e0e0",
                  }}
                >
                  <td style={{ padding: "5px 8px" }}>{payment.paidBy || "—"}</td>
                  <td style={{ padding: "5px 8px" }}>{payment.paidTo || "—"}</td>
                  <td style={{ padding: "5px 8px" }}>
                    {PAY_METHODS[payment.method] || payment.method}
                  </td>
                  <td style={{ padding: "5px 8px" }}>{payment.ref || "—"}</td>
                  <td style={{ padding: "5px 8px" }}>{payment.status}</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>
                    {fmtRmb(payment.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
