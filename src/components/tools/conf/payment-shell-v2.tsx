"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
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
  ZoomIn,
  ZoomOut,
  Printer,
  Pencil,
  Trash2,
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
import { PAY_METHODS, COMMON_UNITS } from "@/lib/conf/config";
import { calcItemTotal, fmtRmb } from "@/lib/conf/currency";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  validatePaymentProofFile,
  delegateDocumentAcceptAttribute,
  CONFERENCE_UPLOAD_MAX_SIZE_LABEL,
  DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/file-upload-client";
import {
  formatUploadError,
  type UploadErrorPayload,
} from "@/lib/conf/upload-feedback-client";
import {
  DocumentLayout,
  DocumentTable,
  normalizeConfInfo,
  normalizeSidebarMembers,
} from "@/lib/conf/document-layout";
import { computePageChunks } from "@/lib/conf/document-pagination";
import {
  createDefaultSignatoryDraft,
  DocumentSignatoryControls,
  SignatoryDraft,
  SignatoryMember,
  hasSignatories,
} from "@/components/tools/conf/document-signatory-controls";
import { DocumentSignatureBlock } from "@/components/tools/conf/document-signature-block";

type PaymentStatus = "PENDING" | "COMMITTEE_APPROVED" | "APPROVED" | "REJECTED";
type PaymentType = "EXPENSE" | "INCOME";
type PaymentStatusFilter = PaymentStatus | "ALL" | "ACTIVE";

type Proof = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
};

type PaymentItem = {
  id: string;
  name: string;
  qty: string;
  unit: string;
  customUnit?: string;
  unitPrice: string;
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
    canApprovePayments?: boolean;
  } | null;
  committeeApprover: { id: string; name: string; role: string } | null;
  budget: { id: string; title: string } | null;
};

type RoleTemplate = {
  id: string;
  committeeScope: string | null;
  isActive: boolean;
};

type AccessInfo = {
  isManager: boolean;
  isChair: boolean;
  isSuperAdmin: boolean;
  canApprovePayments: boolean;
  memberId: string | null;
  committeeScope: string | null;
};

type ConferenceEventInfo = {
  name: string;
  city: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
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

function formatPaymentItemDetails(note?: string | null) {
  if (!note) return undefined;
  const lines = note
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const itemLines = lines.filter((line) =>
    /^(Item:|Qty:|Unit price:|Unit:|Line total:)/i.test(line),
  );

  return itemLines.length ? itemLines.join("; ") : undefined;
}

function stripPaymentItemDetails(note?: string | null) {
  if (!note) return "";
  const lines = note
    .split("\n")
    .filter(
      (line) =>
        !/^(Item:|Qty:|Unit price:|Unit:|Line total:)/i.test(line.trim()),
    );
  return lines.join("\n").trim();
}

function parsePaymentItemDetails(note?: string | null) {
  const values = {
    itemName: "",
    itemQty: "1",
    itemUnit: "",
    itemUnitPrice: "",
  };

  if (!note) return values;

  for (const raw of note.split("\n")) {
    const line = raw.trim();
    if (line.toLowerCase().startsWith("item:")) {
      values.itemName = line.slice(5).trim();
    } else if (line.toLowerCase().startsWith("qty:")) {
      values.itemQty = line.slice(4).trim();
    } else if (line.toLowerCase().startsWith("unit price:")) {
      values.itemUnitPrice = line.slice(11).trim().replace(/[¥$,]/g, "");
    } else if (line.toLowerCase().startsWith("unit:")) {
      values.itemUnit = line.slice(5).trim();
    }
  }

  return values;
}

function formatPaymentItems(items: PaymentItem[]) {
  return items
    .map((item) => {
      const lines: string[] = [];
      if (item.name.trim()) {
        lines.push(`Item: ${item.name.trim()}`);
      }
      if (Number(item.qty) > 0) {
        lines.push(`Qty: ${item.qty}`);
      }
      if (item.unit === "custom") {
        if (item.customUnit?.trim()) {
          lines.push(`Unit: ${item.customUnit.trim()}`);
        }
      } else if (item.unit.trim()) {
        lines.push(`Unit: ${item.unit.trim()}`);
      }
      if (item.unitPrice.trim()) {
        const price = Number(item.unitPrice);
        if (!Number.isNaN(price)) {
          lines.push(`Unit price: ${fmtRmb(price)}`);
        }
      }
      const qty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);
      if (qty > 0 && unitPrice > 0) {
        lines.push(`Line total: ${fmtRmb(calcItemTotal(qty, unitPrice))}`);
      }
      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function parsePaymentItems(note?: string | null, fallbackAmount?: number) {
  if (!note) {
    if (fallbackAmount && fallbackAmount > 0) {
      return [
        {
          id: `item-${Date.now()}`,
          name: "",
          qty: "1",
          unit: "pcs",
          unitPrice: String(fallbackAmount),
        },
      ];
    }
    return [
      {
        id: `item-${Date.now()}`,
        name: "",
        qty: "1",
        unit: "pcs",
        unitPrice: "",
      },
    ];
  }

  const groups = note
    .split(/\n\s*\n/)
    .map((group) => group.trim())
    .filter(Boolean);

  const parsedItems: PaymentItem[] = [];
  for (const group of groups) {
    const item: PaymentItem = {
      id: `item-${Date.now()}-${parsedItems.length}`,
      name: "",
      qty: "1",
      unit: "pcs",
      unitPrice: "",
    };
    let hasItem = false;

    for (const raw of group.split("\n")) {
      const line = raw.trim();
      if (line.toLowerCase().startsWith("item:")) {
        item.name = line.slice(5).trim();
        hasItem = true;
      } else if (line.toLowerCase().startsWith("qty:")) {
        item.qty = line.slice(4).trim() || "1";
      } else if (line.toLowerCase().startsWith("unit price:")) {
        item.unitPrice = line.slice(11).trim().replace(/[¥$,]/g, "") || "";
      } else if (line.toLowerCase().startsWith("unit:")) {
        item.unit = line.slice(5).trim() || "pcs";
      }
    }

    if (hasItem) {
      parsedItems.push(item);
    }
  }

  if (parsedItems.length > 0) {
    return parsedItems;
  }

  if (fallbackAmount && fallbackAmount > 0) {
    return [
      {
        id: `item-${Date.now()}`,
        name: "",
        qty: "1",
        unit: "pcs",
        unitPrice: String(fallbackAmount),
      },
    ];
  }

  return [
    {
      id: `item-${Date.now()}`,
      name: "",
      qty: "1",
      unit: "pcs",
      unitPrice: "",
    },
  ];
}

const INCOME_SOURCES = [
  "Fundraising",
  "Donation",
  "Sponsorship",
  "Contribution",
  "Other",
];

function PaymentsDocumentPreview({
  payments,
  totalExpense,
  totalIncome,
  confInfo,
  members,
  signatoryDraft,
  forPrint = false,
}: {
  payments: Payment[];
  totalExpense: number;
  totalIncome: number;
  confInfo: ConferenceEventInfo | null;
  members: SignatoryMember[];
  signatoryDraft: SignatoryDraft;
  forPrint?: boolean;
}) {
  const rows: Record<string, unknown>[] =
    payments.length > 0
      ? payments.map((payment) => {
          const itemDetails = formatPaymentItemDetails(payment.note);
          return {
            date: new Date(payment.paidAt).toLocaleDateString(),
            type:
              payment.paymentType === "INCOME"
                ? "Income"
                : payment.paymentType === "EXPENSE"
                  ? "Expense"
                  : "Expense",
            paidBy: payment.paidBy || "—",
            paidTo: payment.paidTo || "—",
            method:
              PAY_METHODS[payment.method as keyof typeof PAY_METHODS] ??
              payment.method,
            item: itemDetails || "—",
            proofs:
              payment.proofs.length > 0
                ? `${payment.proofs.length} file${payment.proofs.length === 1 ? "" : "s"}`
                : "None",
            amount: fmtRmb(payment.amount),
            status: payment.status,
          };
        })
      : [
          {
            date: "—",
            type: "—",
            paidBy: "No records yet",
            paidTo: "—",
            method: "—",
            proofs: "—",
            amount: "—",
            status: "—",
          },
        ];

  const receiptSamples = payments
    .filter((payment) => payment.proofs.length > 0)
    .slice(0, 6);

  // ── Dynamic pagination ─────────────────────────────────────────────────
  // Page-1 overhead: title + date + income/expense summary line (~70px).
  // Trailing overhead: net balance line + receipt thumbnails + signature.
  // Continuation pages: "Continued…" label (~28px).
  const receiptTrailingH =
    receiptSamples.length > 0
      ? 38 + Math.ceil(receiptSamples.length / 2) * 110
      : 0;
  const rowChunks = computePageChunks(rows, {
    page1OverheadPx: 70,
    trailingPx:
      42 + receiptTrailingH + (hasSignatories(signatoryDraft) ? 140 : 0),
    contHeaderPx: 28,
  });
  // Scope sidebar to committees represented in this payment set (falls back to all members).
  const scopedCommitteeKeys = Array.from(
    new Set(
      payments
        .map((payment) => payment.committeeScope?.trim() || "")
        .filter(Boolean)
        .map((scope) => scope.toLowerCase()),
    ),
  );
  const scopedMembers =
    scopedCommitteeKeys.length > 0
      ? members.filter((member) =>
          scopedCommitteeKeys.includes(
            (member.committeeScope || "").trim().toLowerCase(),
          ),
        )
      : members;
  const sidebarMembers = normalizeSidebarMembers(
    scopedMembers.length > 0 ? scopedMembers : members,
  );
  const normalizedConfInfo = normalizeConfInfo(confInfo);

  return rowChunks.map((pageRows, pageIndex) => (
    <DocumentLayout
      key={`payments-v2-page-${pageIndex}`}
      forPrint={forPrint}
      confInfo={normalizedConfInfo}
      officeLabel="Office of the Finance Secretary"
      members={sidebarMembers}
      className={pageIndex > 0 ? "mt-4" : ""}
      pageNumber={pageIndex + 1}
      totalPages={rowChunks.length}
    >
      {pageIndex === 0 ? (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#002868" }}>
            Payments Register
          </div>
          <div style={{ marginTop: 3, fontSize: 10, color: "#555" }}>
            Date:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div style={{ marginTop: 2, fontSize: 10, color: "#555" }}>
            Total Income: {fmtRmb(totalIncome)} · Total Expense:{" "}
            {fmtRmb(totalExpense)}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#777", marginBottom: 12 }}>
          Continued Payment Records (Page {pageIndex + 1})
        </div>
      )}

      <DocumentTable
        caption={
          pageIndex === 0 ? "Payment Records" : "Payment Records (cont.)"
        }
        columns={[
          { key: "date", label: "Date", width: 10 },
          { key: "type", label: "Type", width: 8 },
          { key: "paidBy", label: "Paid/Received By", width: 16 },
          { key: "paidTo", label: "To/Received By", width: 14 },
          { key: "method", label: "Method", width: 10 },
          {
            key: "item",
            label: "Item details",
            width: 18,
            format: (value: unknown) => (
              <div style={{ fontSize: 10, whiteSpace: "pre-wrap" }}>
                {typeof value === "string" ? value : String(value)}
              </div>
            ),
          },
          { key: "proofs", label: "Receipts", width: 10, align: "center" },
          { key: "status", label: "Status", width: 10 },
          { key: "amount", label: "Amount", width: 10, align: "right" },
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
              NET BALANCE: {fmtRmb(totalIncome - totalExpense)}
            </div>
          </div>
          {payments.some((payment) => payment.proofs.length > 0) && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#002868",
                  marginBottom: 8,
                }}
              >
                Receipt Photos
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {payments
                  .flatMap((payment) =>
                    payment.proofs.map((proof) => ({
                      payment,
                      proof,
                    })),
                  )
                  .map(({ payment, proof }) => (
                    <div
                      key={`proof-${proof.id}`}
                      style={{
                        border: "1px solid #d9dfeb",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      {proof.fileType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proof.filePath}
                          alt={proof.fileName}
                          style={{
                            width: "100%",
                            height: 180,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 180,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f3f4f6",
                          }}
                        >
                          <span style={{ fontSize: 10, color: "#666" }}>
                            Document file
                          </span>
                        </div>
                      )}
                      <div style={{ padding: 10, fontSize: 10, color: "#555" }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {payment.paidBy} · {fmtRmb(payment.amount)}
                        </div>
                        <div>{proof.fileName}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          <DocumentSignatureBlock draft={signatoryDraft} />
        </>
      )}
    </DocumentLayout>
  ));
}

export function PaymentShell({ accessInfo }: { accessInfo?: AccessInfo }) {
  const [confId, setConfId] = useState("");
  const [confInfo, setConfInfo] = useState<ConferenceEventInfo | null>(null);
  const [members, setMembers] = useState<SignatoryMember[]>([]);
  const [previewZoom, setPreviewZoom] = useState(72);
  const [signatoryDraft, setSignatoryDraft] = useState<SignatoryDraft>(
    createDefaultSignatoryDraft(),
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<PaymentType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] =
    useState<PaymentStatusFilter>("ACTIVE");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

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
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([
    {
      id: `item-${Date.now()}`,
      name: "",
      qty: "1",
      unit: "pcs",
      unitPrice: "",
    },
  ]);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [proofValidationFeedback, setProofValidationFeedback] = useState<
    string | null
  >(null);
  const [uploadStatus, setUploadStatus] = useState<{
    currentFile: number;
    totalFiles: number;
    fileName: string;
    percent: number;
  } | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [committeeOptions, setCommitteeOptions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPayments = useCallback(
    async (id: string) => {
      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (filterStatus !== "ALL" && filterStatus !== "ACTIVE") {
        params.set("status", filterStatus);
      }
      const res = await fetch(`/api/conf/${id}/payments?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load payments");
      return (await res.json()) as Payment[];
    },
    [filterType, filterStatus],
  );

  const loadCommitteeOptions = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/roles`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load committee options");
    }
    const data = (await res.json()) as RoleTemplate[];
    const scopes = Array.from(
      new Set(
        data
          .filter((role) => role.isActive)
          .map((role) => role.committeeScope?.trim() || "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
    setCommitteeOptions(scopes);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        const [data, , membersRes, bookletRes] = await Promise.all([
          loadPayments(conf.id),
          loadCommitteeOptions(conf.id),
          fetch(`/api/conf/${conf.id}/members`, { cache: "no-store" }),
          fetch(`/api/conf/${conf.id}/booklet/data`, { cache: "no-store" }),
        ]);
        setPayments(data);

        if (membersRes.ok) {
          const payload = (await membersRes.json()) as Array<{
            id: string;
            name: string;
            role?: string | null;
            title?: string | null;
            committeeScope?: string | null;
            city?: string | null;
            phone?: string | null;
          }>;
          setMembers(
            payload.map((member) => ({
              id: member.id,
              name: member.name,
              role: member.role,
              title: member.title,
              committeeScope: member.committeeScope ?? null,
              city: member.city ?? null,
              phone: member.phone ?? null,
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
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [loadCommitteeOptions, loadPayments]);

  const addPaymentItem = useCallback(() => {
    setPaymentItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length}`,
        name: "",
        qty: "1",
        unit: "pcs",
        unitPrice: "",
      },
    ]);
  }, []);

  const removePaymentItem = useCallback((idx: number) => {
    setPaymentItems((prev) => prev.filter((_, index) => index !== idx));
  }, []);

  const updatePaymentItem = useCallback(
    (idx: number, field: keyof PaymentItem, value: string) => {
      setPaymentItems((prev) =>
        prev.map((item, index) =>
          index === idx ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const paymentItemsTotal = useMemo(() => {
    return paymentItems.reduce((sum, item) => {
      const qty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);
      if (qty > 0 && unitPrice >= 0) {
        return sum + calcItemTotal(qty, unitPrice);
      }
      return sum;
    }, 0);
  }, [paymentItems]);

  useEffect(() => {
    if (!showForm) return;
    if (accessInfo?.committeeScope) {
      setCommitteeScope(accessInfo.committeeScope);
    }
  }, [accessInfo?.committeeScope, showForm]);

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

  const uploadProofWithProgress = useCallback(
    (paymentId: string, file: File, onProgress: (percent: number) => void) =>
      new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/conf/${confId}/payments/${paymentId}/upload`);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve();
            return;
          }
          let payload: UploadErrorPayload = {};
          try {
            payload = JSON.parse(xhr.responseText) as UploadErrorPayload;
          } catch {
            payload = {};
          }
          reject(
            new Error(
              formatUploadError(
                payload,
                "Failed to upload payment proof",
                xhr.status,
              ),
            ),
          );
        };

        xhr.onerror = () => {
          reject(new Error(`Upload failed for "${file.name}". Please retry.`));
        };

        const fd = new FormData();
        fd.append("file", file);
        fd.append("paymentId", paymentId);
        xhr.send(fd);
      }),
    [confId],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    const invalidMessages: string[] = [];
    for (const file of files) {
      const validation = await validatePaymentProofFile(file);
      if (!validation.ok) {
        if (validation.error.startsWith("Unsupported file format")) {
          invalidMessages.push(
            `${file.name}: unsupported format. Use PNG, JPG, JPEG, WEBP, GIF, or PDF.`,
          );
        } else {
          invalidMessages.push(`${file.name}: ${validation.error}`);
        }
        continue;
      }
      valid.push(file);
    }

    if (invalidMessages.length > 0) {
      setProofValidationFeedback(
        `Some files were skipped: ${invalidMessages.slice(0, 2).join(" | ")}`,
      );
      setError(null);
    } else {
      setProofValidationFeedback(null);
      setError(null);
    }

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

    // Allows selecting the same file again after removing/retrying.
    e.target.value = "";
  };

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    const computedItemTotal = paymentItemsTotal;
    const effectiveAmount =
      numericAmount > 0 ? numericAmount : computedItemTotal;

    if (!effectiveAmount || !paidBy || !confId || saving) return;
    if (!(effectiveAmount > 0)) {
      setError("Amount must be greater than zero.");
      return;
    }

    const itemDetailLines = formatPaymentItems(paymentItems);
    const notePayload = [note?.trim(), itemDetailLines]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    setSaving(true);
    setError(null);
    setProofValidationFeedback(null);
    try {
      // 1. Create or update payment record
      const endpoint = editingPaymentId
        ? `/api/conf/${confId}/payments/${editingPaymentId}`
        : `/api/conf/${confId}/payments`;
      const methodVerb = editingPaymentId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method: methodVerb,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          paidBy,
          paidTo: paidTo || undefined,
          method,
          ref: txRef || undefined,
          note: notePayload || undefined,
          paymentType,
          incomeSource:
            paymentType === "INCOME" ? incomeSource || undefined : undefined,
          committeeScope: committeeScope || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(
          err.error ??
            (editingPaymentId
              ? "Failed to update payment"
              : "Failed to create payment"),
        );
      }
      const payment = (await res.json()) as Payment;

      // 2. Upload proof files if any
      for (const [index, file] of proofFiles.entries()) {
        setUploadStatus({
          currentFile: index + 1,
          totalFiles: proofFiles.length,
          fileName: file.name,
          percent: 0,
        });
        await uploadProofWithProgress(payment.id, file, (percent) => {
          setUploadStatus({
            currentFile: index + 1,
            totalFiles: proofFiles.length,
            fileName: file.name,
            percent,
          });
        });
      }

      setUploadStatus(null);
      setPayments(await loadPayments(confId));
      resetForm();
    } catch (e) {
      setUploadStatus(null);
      setError(e instanceof Error ? e.message : "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    if (payment.isLocked || payment.status === "APPROVED") {
      setError("Approved/locked payments cannot be edited.");
      return;
    }

    setEditingPaymentId(payment.id);
    setPaymentType(payment.paymentType || "EXPENSE");
    setAmount(String(payment.amount));
    setPaymentItems(parsePaymentItems(payment.note, payment.amount));
    setPaidBy(payment.paidBy || "");
    setPaidTo(payment.paidTo || "");
    setMethod(payment.method || "WECHAT");
    setTxRef(payment.ref || "");
    setNote(stripPaymentItemDetails(payment.note || ""));
    setCommitteeScope(payment.committeeScope || "");
    setIncomeSource(payment.incomeSource || "");
    setProofFiles([]);
    setProofPreviews([]);
    setProofValidationFeedback(null);
    setUploadStatus(null);
    setShowForm(true);
    setError(null);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confId || deleteLoadingId) return;
    const confirmed = window.confirm(
      "Delete this payment record? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeleteLoadingId(paymentId);
    setError(null);
    try {
      const res = await fetch(`/api/conf/${confId}/payments/${paymentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to delete payment");
      }
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
      if (editingPaymentId === paymentId) {
        resetForm();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoadingId(null);
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
    setEditingPaymentId(null);
    setPaymentType("EXPENSE");
    setAmount("");
    setPaymentItems([
      {
        id: `item-${Date.now()}`,
        name: "",
        qty: "1",
        unit: "pcs",
        unitPrice: "",
      },
    ]);
    setPaidBy("");
    setPaidTo("");
    setMethod("WECHAT");
    setTxRef("");
    setNote("");
    setCommitteeScope("");
    setIncomeSource("");
    setProofFiles([]);
    setProofPreviews([]);
    setProofValidationFeedback(null);
    setUploadStatus(null);
    setShowForm(false);
  };

  const activePayments = payments.filter((p) => p.status !== "REJECTED");
  const rejectedPayments = payments.filter((p) => p.status === "REJECTED");
  const confirmedPayments = activePayments.filter(
    (p) => p.status === "APPROVED",
  );
  const unconfirmedPayments = activePayments.filter(
    (p) => p.status !== "APPROVED",
  );

  const expenses = confirmedPayments.filter(
    (p) => p.paymentType === "EXPENSE" || !p.paymentType,
  );
  const incomes = confirmedPayments.filter((p) => p.paymentType === "INCOME");
  const totalExpense = expenses.reduce((s, p) => s + p.amount, 0);
  const totalIncome = incomes.reduce((s, p) => s + p.amount, 0);
  const lockedCount = confirmedPayments.length;
  const pendingCount = unconfirmedPayments.length;
  const isScopeLockedToMember =
    Boolean(accessInfo?.committeeScope) && !accessInfo?.isSuperAdmin;
  const canFinalApproveFromPending = useCallback((payment: Payment) => {
    if (payment.status !== "PENDING") return false;
    if (!payment.committeeScope) return true;
    const submitter = payment.submittedBy;
    if (!submitter) return false;
    return (
      Boolean(submitter.canApprovePayments) &&
      submitter.committeeScope === payment.committeeScope
    );
  }, []);
  const committeeHint = useMemo(() => {
    if (committeeOptions.length === 0) return "";
    return committeeOptions.join(", ");
  }, [committeeOptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-ekd-gold" />
      </div>
    );
  }

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
          #payments-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            pointer-events: auto !important;
          }
          .payments-no-print { display: none !important; }
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
            Record expenses and incoming funds · Two-tier approval workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (pdfExporting) return;
              setPdfExporting(true);
              document.body.setAttribute("data-print-mode", "print");
              try {
                await new Promise<void>((resolve) => {
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve()),
                  );
                });
                const { exportToPDF } =
                  await import("@/lib/creative/documents/pdfExport");
                await exportToPDF(
                  "payments-print-root",
                  "payment-tracker",
                  undefined,
                  {
                    pageSelector: ".document-page",
                    pageWrapperSelector: null,
                    mode: "download",
                    canvasScale: 2,
                    jpegQuality: 0.85,
                  },
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "PDF export failed");
              } finally {
                document.body.removeAttribute("data-print-mode");
                setPdfExporting(false);
              }
            }}
            disabled={pdfExporting}
          >
            <Download className="size-4" />
            {pdfExporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={refresh}>
            <RefreshCw className="size-4" />
          </Button>
          {accessInfo?.isManager && (
            <Button
              size="sm"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
            >
              <Plus className="size-4" />
              {showForm ? "Close Form" : "New Record"}
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
              <p className="text-xs text-muted-foreground">
                Unconfirmed Records
              </p>
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
      <p className="text-xs text-muted-foreground">
        Financial totals include only finally approved payments. Pending and
        committee-approved records are excluded until final confirmation.
      </p>

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
              "ACTIVE",
              "ALL",
              "PENDING",
              "COMMITTEE_APPROVED",
              "APPROVED",
              "REJECTED",
            ] as PaymentStatusFilter[]
          ).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilterStatus(s)}
            >
              {s === "ACTIVE"
                ? "Active"
                : s === "ALL"
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
            <CardTitle className="text-base">
              {editingPaymentId
                ? "Edit Financial Record"
                : "New Financial Record"}
            </CardTitle>
            <CardDescription>
              {editingPaymentId
                ? "Update payment details. Existing proofs remain; newly uploaded proofs are added."
                : "Record an expense payment or incoming funds with proof of transaction"}
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
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={committeeScope}
                  onChange={(e) => setCommitteeScope(e.target.value)}
                  disabled={isScopeLockedToMember}
                >
                  <option value="">Select committee...</option>
                  {committeeOptions.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
                {isScopeLockedToMember && accessInfo?.committeeScope && (
                  <p className="text-xs text-muted-foreground">
                    Scoped to your committee: {accessInfo.committeeScope}
                  </p>
                )}
                {!isScopeLockedToMember && committeeHint && (
                  <p className="text-xs text-muted-foreground">
                    Available committees: {committeeHint}
                  </p>
                )}
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

            <Card className="budget-no-print">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Line Items</CardTitle>
                  <CardDescription>
                    {paymentItems.length} item
                    {paymentItems.length !== 1 ? "s" : ""} · Total:{" "}
                    <span className="font-semibold">
                      {fmtRmb(paymentItemsTotal)}
                    </span>
                  </CardDescription>
                </div>
                <Button size="sm" onClick={addPaymentItem}>
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
                        <th className="w-28 pb-2 pr-2">Unit Price</th>
                        <th className="w-24 pb-2 pr-2 text-right">Total</th>
                        <th className="w-8 pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentItems.map((item, idx) => {
                        const total = calcItemTotal(
                          Number(item.qty),
                          Number(item.unitPrice),
                        );
                        const isCustom = item.unit === "custom";
                        return (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-2 pr-2 text-muted-foreground text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-2 pr-2">
                              <Input
                                className="h-8 text-sm"
                                placeholder="Item name"
                                value={item.name}
                                onChange={(e) =>
                                  updatePaymentItem(idx, "name", e.target.value)
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
                                value={item.qty}
                                onChange={(e) =>
                                  updatePaymentItem(idx, "qty", e.target.value)
                                }
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <div className="flex gap-1">
                                <select
                                  className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                                  style={{ width: isCustom ? "120px" : "100%" }}
                                  value={item.unit}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updatePaymentItem(idx, "unit", value);
                                    if (value !== "custom") {
                                      updatePaymentItem(idx, "customUnit", "");
                                    }
                                  }}
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
                                    value={item.customUnit || ""}
                                    onChange={(e) =>
                                      updatePaymentItem(
                                        idx,
                                        "customUnit",
                                        e.target.value,
                                      )
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
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updatePaymentItem(
                                    idx,
                                    "unitPrice",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="py-2 pr-2 text-right font-mono font-medium">
                              {fmtRmb(total)}
                            </td>
                            <td className="py-2">
                              {paymentItems.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removePaymentItem(idx)}
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
                          colSpan={5}
                          className="py-3 text-right font-semibold"
                        >
                          GRAND TOTAL
                        </td>
                        <td className="py-3 text-right font-mono text-lg font-bold text-[#C8A061]">
                          {fmtRmb(paymentItemsTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

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
              {editingPaymentId && (
                <p className="text-xs text-muted-foreground">
                  Uploading here adds extra proof files to this record.
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={delegateDocumentAcceptAttribute("passport")}
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
                  Screenshots or receipts:{" "}
                  {DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL}. Maximum{" "}
                  {CONFERENCE_UPLOAD_MAX_SIZE_LABEL} per file.
                </p>
                <p className="text-xs text-muted-foreground">
                  {DELEGATE_UPLOAD_CONVERSION_TIP}
                </p>
              </div>
              {proofValidationFeedback && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  {proofValidationFeedback}
                </div>
              )}
              {uploadStatus && (
                <div className="space-y-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <span className="truncate">
                      Uploading {uploadStatus.currentFile}/
                      {uploadStatus.totalFiles}: {uploadStatus.fileName}
                    </span>
                    <span>{uploadStatus.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/40 dark:bg-blue-950/40">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${uploadStatus.percent}%` }}
                    />
                  </div>
                </div>
              )}
              {editingPaymentId && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Existing proof files
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      payments.find((p) => p.id === editingPaymentId)?.proofs ??
                      []
                    ).map((proof) => (
                      <a
                        key={`editing-proof-${proof.id}`}
                        href={proof.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block size-20 overflow-hidden rounded border border-muted"
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
                  </div>
                </div>
              )}
              {proofPreviews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {proofPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative size-28 overflow-hidden rounded-lg border"
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
                disabled={
                  saving ||
                  !paidBy ||
                  !(Number(amount) > 0 || paymentItemsTotal > 0)
                }
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {saving
                  ? "Saving..."
                  : editingPaymentId
                    ? "Save Changes"
                    : "Submit for Approval"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {activePayments.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <DollarSign className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">
              No active payments recorded yet
            </p>
            <p className="text-sm text-muted-foreground">
              Start by adding an expense or incoming fund record.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Payment List */}
      <div className="space-y-3">
        {activePayments.map((payment) => {
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
                          className="block size-24 overflow-hidden rounded border border-muted transition-opacity hover:opacity-80"
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
                        <div className="flex size-24 items-center justify-center rounded border border-muted bg-muted text-xs text-muted-foreground">
                          +{payment.proofs.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!payment.isLocked && accessInfo?.isManager && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleEditPayment(payment)}
                      disabled={saving || deleteLoadingId === payment.id}
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-red-500/40 text-red-600 hover:bg-red-500/10 text-xs"
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={deleteLoadingId === payment.id}
                    >
                      {deleteLoadingId === payment.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                )}

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
                      {(payment.status === "COMMITTEE_APPROVED" ||
                        canFinalApproveFromPending(payment)) &&
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
                      {payment.status === "PENDING" &&
                        (accessInfo?.isChair || accessInfo?.isSuperAdmin) &&
                        !canFinalApproveFromPending(payment) && (
                          <p className="text-xs text-amber-700">
                            Committee chair approval is required before final
                            approval for this scoped payment.
                          </p>
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

      {rejectedPayments.length > 0 && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-base text-red-600">
              Rejected Records
            </CardTitle>
            <CardDescription>
              Records rejected in the approval workflow are tracked here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rejectedPayments.map((payment) => (
              <div
                key={`rejected-${payment.id}`}
                className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-semibold">{payment.paidBy}</span>
                    {payment.paidTo ? ` -> ${payment.paidTo}` : ""}
                  </div>
                  <div className="text-sm font-semibold text-red-600">
                    {fmtRmb(payment.amount)}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(payment.paidAt).toLocaleDateString()} ·{" "}
                  {PAY_METHODS[payment.method as keyof typeof PAY_METHODS] ??
                    payment.method}
                  {payment.ref ? ` · Ref: ${payment.ref}` : ""}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="payments-no-print border-[#C8A061]/30">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Live Payment Document</CardTitle>
            <CardDescription>
              Reusable document layout preview (same shared source used
              elsewhere).
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
            <span className="w-10 text-center text-xs font-mono">
              {previewZoom}%
            </span>
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
                  previewZoom < 100
                    ? `${((previewZoom - 100) / 100) * 900}px`
                    : 0,
              }}
            >
              <PaymentsDocumentPreview
                payments={confirmedPayments}
                totalExpense={totalExpense}
                totalIncome={totalIncome}
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
            Shared signatory controls, same pattern as Letters.
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

      {/* Report Builder Link */}
      {confirmedPayments.length > 0 && (
        <div className="payments-no-print flex justify-end">
          <Link href="/tools/conf/finance/reports">
            <Button variant="outline" size="sm">
              Build Report from Confirmed Payments
            </Button>
          </Link>
        </div>
      )}

      <div id="payments-print-root">
        <PaymentsDocumentPreview
          payments={confirmedPayments}
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          confInfo={confInfo}
          members={members}
          signatoryDraft={signatoryDraft}
          forPrint
        />
      </div>
    </div>
  );
}
