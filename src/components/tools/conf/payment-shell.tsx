"use client";

import { useEffect, useRef, useState } from "react";
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
  ZoomIn,
  ZoomOut,
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
import { DocumentLayout, DocumentTable } from "@/lib/conf/document-layout";
import {
  createDefaultSignatoryDraft,
  DocumentSignatoryControls,
  SignatoryDraft,
  SignatoryMember,
} from "@/components/tools/conf/document-signatory-controls";
import { DocumentSignatureBlock } from "@/components/tools/conf/document-signature-block";

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

type ConferenceEventInfo = {
  name: string;
  city: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
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

function chunkArray<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function PaymentsDocumentPreview({
  payments,
  totalPaid,
  approvedTotal,
  confInfo,
  members,
  signatoryDraft,
  forPrint = false,
}: {
  payments: LocalPayment[];
  totalPaid: number;
  approvedTotal: number;
  confInfo: ConferenceEventInfo | null;
  members: SignatoryMember[];
  signatoryDraft: SignatoryDraft;
  forPrint?: boolean;
}) {
  const createdAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const rows =
    payments.length > 0
      ? payments.map((payment) => ({
          date: payment.createdAt.toLocaleDateString(),
          paidBy: payment.paidBy || "—",
          paidTo: payment.paidTo || "—",
          method: PAY_METHODS[payment.method] || payment.method,
          status: payment.status,
          amount: fmtRmb(payment.amount),
        }))
      : [
          {
            date: "—",
            paidBy: "No payments recorded yet",
            paidTo: "—",
            method: "—",
            status: "—",
            amount: "—",
          },
        ];
  const rowChunks = chunkArray(rows, 24);
  const normalizedConfInfo = confInfo
    ? {
        ...confInfo,
        venue: confInfo.venue ?? undefined,
      }
    : undefined;

  const sidebarMembers = members.slice(0, 8).map((member, idx) => ({
    id: `payment-member-${idx}`,
    name: member.name,
    role: "COMMITTEE",
    title: member.title || member.role || "Committee Member",
    committeeScope: member.role || null,
  }));

  return rowChunks.map((pageRows, pageIndex) => (
    <DocumentLayout
      key={`payments-page-${pageIndex}`}
      forPrint={forPrint}
      confInfo={normalizedConfInfo}
      officeLabel="Office of the Finance Secretary"
      members={sidebarMembers}
      className={pageIndex > 0 ? "mt-4" : ""}
      pageNumber={pageIndex + 1}
      totalPages={rowChunks.length}
    >
      {pageIndex === 0 ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#002868" }}>
            Payment Summary
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: "#555" }}>
            Date: {createdAt}
          </div>
          <div style={{ marginTop: 3, fontSize: 10, color: "#555" }}>
            Total Recorded: {fmtRmb(totalPaid)} · Verified: {fmtRmb(approvedTotal)}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#777", marginBottom: 12 }}>
          Continued Payment Records (Page {pageIndex + 1})
        </div>
      )}

      <DocumentTable
        caption={pageIndex === 0 ? "Payment Log" : "Payment Log (cont.)"}
        columns={[
          { key: "date", label: "Date", width: 14 },
          { key: "paidBy", label: "Paid By", width: 21 },
          { key: "paidTo", label: "Paid To", width: 21 },
          { key: "method", label: "Method", width: 16 },
          { key: "status", label: "Status", width: 13 },
          { key: "amount", label: "Amount", width: 15, align: "right" },
        ]}
        data={pageRows}
        forPrint={forPrint}
      />

      {pageIndex === rowChunks.length - 1 && (
        <>
          <div
            style={{
              marginTop: 12,
              borderTop: "1.5px solid #002868",
              paddingTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#666" }}>
              {payments.length} payment record{payments.length === 1 ? "" : "s"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#C8A061" }}>
              TOTAL RECEIVED: {fmtRmb(totalPaid)}
            </div>
          </div>
          <DocumentSignatureBlock draft={signatoryDraft} />
        </>
      )}
    </DocumentLayout>
  ));
}

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
  const [confInfo, setConfInfo] = useState<ConferenceEventInfo | null>(null);
  const [members, setMembers] = useState<SignatoryMember[]>([]);
  const [previewZoom, setPreviewZoom] = useState(72);
  const [signatoryDraft, setSignatoryDraft] = useState<SignatoryDraft>(
    createDefaultSignatoryDraft(),
  );

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        const [membersRes, bookletRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/members`, { cache: "no-store" }),
          fetch(`/api/conf/${conf.id}/booklet/data`, { cache: "no-store" }),
        ]);

        if (membersRes.ok) {
          const payload = (await membersRes.json()) as Array<{
            name: string;
            role?: string | null;
            title?: string | null;
          }>;
          setMembers(
            payload.map((member) => ({
              name: member.name,
              role: member.role,
              title: member.title,
            })),
          );
        }

        if (bookletRes.ok) {
          const bookletPayload = (await bookletRes.json()) as {
            event?: ConferenceEventInfo;
          };
          if (bookletPayload.event) {
            setConfInfo(bookletPayload.event);
          }
        }
      } catch {
        // Keep graceful fallback for local-only payment tracking.
      }
    };
    void init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) =>
        ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(
          f.type,
        ) && f.size <= 10 * 1024 * 1024,
    );
    setProofFiles((prev) => [...prev, ...validFiles]);

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
        #payments-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          pointer-events: none;
        }
        @media print {
          body * { visibility: hidden; }
          #payments-print-root,
          #payments-print-root * { visibility: visible !important; }
          .payments-no-print { display: none !important; }
          #payments-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            pointer-events: auto !important;
          }
          .document-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
          }
          .document-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className="payments-no-print flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Payment Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Record payments and generate a full letter-style payment document.
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

      {payments.length === 0 && !showForm && (
        <Card className="payments-no-print">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <DollarSign className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No payments recorded yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;Add Payment&quot; to record a payment with receipt screenshot
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
                    <span className="text-lg font-bold">{fmtRmb(payment.amount)}</span>
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
                    <p className="text-xs text-muted-foreground">{payment.note}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="payments-no-print border-[#C8A061]/30">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Live Payment Document</CardTitle>
            <CardDescription>
              Full letter-style payment page with proper pagination and signatures.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-md border px-1 py-1">
            <button
              type="button"
              className="rounded p-1 hover:bg-muted"
              onClick={() => setPreviewZoom((z) => Math.max(55, z - 5))}
              title="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="w-10 text-center text-xs font-mono">{previewZoom}%</span>
            <button
              type="button"
              className="rounded p-1 hover:bg-muted"
              onClick={() => setPreviewZoom((z) => Math.min(100, z + 5))}
              title="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg bg-muted/20 p-4">
            <div
              style={{
                width: 794,
                margin: "0 auto",
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top center",
                marginBottom:
                  previewZoom < 100 ? `${((previewZoom - 100) / 100) * 900}px` : 0,
              }}
            >
              <PaymentsDocumentPreview
                payments={payments}
                totalPaid={totalPaid}
                approvedTotal={approvedTotal}
                confInfo={confInfo}
                members={members}
                signatoryDraft={signatoryDraft}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="payments-no-print border-[#C8A061]/30">
        <CardHeader>
          <CardTitle className="text-base">Signatories</CardTitle>
          <CardDescription>
            Same signatory management pattern used in letters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentSignatoryControls
            value={signatoryDraft}
            onChange={setSignatoryDraft}
            members={members}
          />
        </CardContent>
      </Card>

      <div id="payments-print-root">
        <PaymentsDocumentPreview
          payments={payments}
          totalPaid={totalPaid}
          approvedTotal={approvedTotal}
          confInfo={confInfo}
          members={members}
          signatoryDraft={signatoryDraft}
          forPrint
        />
      </div>
    </div>
  );
}
