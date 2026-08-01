"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
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
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  parsePaymentItemsNote,
  stripPaymentItemDetails,
} from "@/lib/conf/payment-items";
import {
  validatePaymentProofFile,
  CONFERENCE_UPLOAD_MAX_SIZE_LABEL,
  DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/file-upload-client";
import {
  formatUploadError,
  type UploadErrorPayload,
} from "@/lib/conf/upload-feedback-client";
import {
  FinanceLineItemsTable,
  type FinanceLineItemDraft,
  type FinanceLineItemProof,
  type FinanceLineItemReceiptState,
} from "@/components/tools/conf/finance-line-items-table";
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
import {
  canDeletePayment as canDeletePaymentAccess,
  canEditPayment as canEditPaymentAccess,
  type PaymentAccessRecord,
} from "@/lib/conf/payment-access";
import type { ConferenceAccess } from "@/lib/conf/access";

type PaymentStatus = "PENDING" | "COMMITTEE_APPROVED" | "APPROVED" | "REJECTED";
type PaymentType = "EXPENSE" | "INCOME";
type PaymentStatusFilter = PaymentStatus | "ALL" | "ACTIVE";

type Proof = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
  url?: string;
  isPdf?: boolean;
};

function proofDisplayUrl(proof: Proof) {
  return proof.url || proof.filePath;
}

function proofIsImage(proof: Proof) {
  if (proof.isPdf) return false;
  if (proof.fileType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(proof.fileName);
}

type PaymentLineItemRecord = {
  id: string;
  no: number;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  proofs: Proof[];
};

type PaymentItem = FinanceLineItemDraft;

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
  lineItems?: PaymentLineItemRecord[];
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

function emptyPaymentItem(no = 1): PaymentItem {
  return {
    id: `item-${Date.now()}-${no}`,
    no,
    name: "",
    qty: "1",
    unit: "pcs",
    unitPrice: "",
  };
}

function formatPaymentLineItemsSummary(payment: Payment) {
  if (payment.lineItems && payment.lineItems.length > 0) {
    return payment.lineItems
      .map(
        (item) =>
          `${item.name} (${item.qty} ${item.unit} × ${fmtRmb(item.unitPrice)})`,
      )
      .join("; ");
  }
  return formatPaymentItemDetailsFromNote(payment.note);
}

function formatPaymentItemDetailsFromNote(note?: string | null) {
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

function paymentItemsFromPayment(payment: Payment): PaymentItem[] {
  if (payment.lineItems && payment.lineItems.length > 0) {
    return payment.lineItems.map((item) => ({
      id: item.id,
      no: item.no,
      name: item.name,
      qty: String(item.qty),
      unit: (COMMON_UNITS as readonly string[]).includes(item.unit)
        ? item.unit
        : "custom",
      customUnit: (COMMON_UNITS as readonly string[]).includes(item.unit)
        ? undefined
        : item.unit,
      unitPrice: String(item.unitPrice),
    }));
  }

  const parsed = parsePaymentItemsNote(payment.note);
  if (parsed.length > 0) {
    return parsed.map((item, idx) => ({
      id: `legacy-${idx}-${Date.now()}`,
      no: idx + 1,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      customUnit: item.customUnit,
      unitPrice: item.unitPrice,
    }));
  }

  if (payment.amount > 0) {
    return [emptyPaymentItem(1)];
  }

  return [emptyPaymentItem(1)];
}

function allPaymentProofs(payment: Payment): Proof[] {
  const lineItemProofs =
    payment.lineItems?.flatMap((item) => item.proofs ?? []) ?? [];
  const paymentLevelProofs = payment.proofs.filter(
    (proof) =>
      !lineItemProofs.some((lineProof) => lineProof.id === proof.id),
  );
  return [...lineItemProofs, ...paymentLevelProofs];
}

function paymentFreeformNote(payment: Payment) {
  return stripPaymentItemDetails(payment.note || "");
}

function serializePaymentItems(items: PaymentItem[]) {
  return items
    .filter((item) => item.name.trim())
    .map((item, idx) => ({
      no: idx + 1,
      name: item.name.trim(),
      qty: Number(item.qty) || 0,
      unit:
        item.unit === "custom"
          ? item.customUnit?.trim() || "custom"
          : item.unit.trim() || "pcs",
      unitPrice: Number(item.unitPrice) || 0,
    }));
}

function buildSyncLineItems(items: PaymentItem[]) {
  return items.map((item, idx) => ({
    no: idx + 1,
    name: item.name.trim() || `Item ${idx + 1}`,
    qty: Number(item.qty) || 1,
    unit:
      item.unit === "custom"
        ? item.customUnit?.trim() || "custom"
        : String(item.unit).trim() || "pcs",
    unitPrice: Number(item.unitPrice) > 0 ? Number(item.unitPrice) : 0.01,
  }));
}

function remapAfterPaymentSync(
  payment: Payment,
  prevItems: PaymentItem[],
  prevReceiptState: Record<string, FinanceLineItemReceiptState>,
) {
  const serverItems = payment.lineItems ?? [];
  const items = prevItems.map((draft, idx) => {
    const server = serverItems[idx];
    return {
      ...draft,
      id: server?.id ?? draft.id,
      no: server?.no ?? idx + 1,
    };
  });

  const receiptState: Record<string, FinanceLineItemReceiptState> = {};
  prevItems.forEach((oldDraft, idx) => {
    const newItem = items[idx];
    const server = serverItems[idx];
    if (!newItem) return;

    const oldState = prevReceiptState[oldDraft.id];
    const mergedProofs = new Map<string, FinanceLineItemProof>();

    for (const proof of oldState?.existingProofs ?? []) {
      mergedProofs.set(proof.id, proof);
    }
    for (const proof of server?.proofs ?? []) {
      mergedProofs.set(proof.id, proof);
    }

    if (oldState || mergedProofs.size > 0) {
      receiptState[newItem.id] = {
        existingProofs: Array.from(mergedProofs.values()),
        pendingFile: oldState?.pendingFile ?? null,
        pendingPreview: oldState?.pendingPreview ?? null,
        uploading: oldState?.uploading,
        uploadPercent: oldState?.uploadPercent,
      };
    }
  });

  return { items, receiptState };
}

const INCOME_SOURCES = [
  "Fundraising",
  "Donation",
  "Sponsorship",
  "Contribution",
  "Other",
];

const PAYMENT_VIEW_LS_KEY = "conf_payment_list_view";
const DEFAULT_LIST_PAGE_SIZE = 10;

type PaymentListViewMode = "list" | "cards";

type PaginatedPaymentsResponse = {
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  stats: {
    totalExpense: number;
    totalIncome: number;
    pendingCount: number;
    lockedCount: number;
  };
};

function loadPaymentViewMode(): PaymentListViewMode {
  try {
    const stored = localStorage.getItem(PAYMENT_VIEW_LS_KEY);
    if (stored === "list" || stored === "cards") return stored;
  } catch {
    // ignore
  }
  return "list";
}

function savePaymentViewMode(mode: PaymentListViewMode) {
  try {
    localStorage.setItem(PAYMENT_VIEW_LS_KEY, mode);
  } catch {
    // ignore
  }
}

function paymentToAccessRecord(payment: Payment): PaymentAccessRecord {
  return {
    id: payment.id,
    status: payment.status,
    isLocked: payment.isLocked,
    committeeScope: payment.committeeScope,
    submittedByMemberId: payment.submittedBy?.id ?? null,
    submittedBy: payment.submittedBy
      ? {
          id: payment.submittedBy.id,
          committeeScope: payment.submittedBy.committeeScope,
        }
      : null,
  };
}

function toConferenceAccess(access?: AccessInfo): ConferenceAccess | null {
  if (!access) return null;
  return {
    user: null,
    confId: "",
    isParticipant: true,
    isManager: access.isManager,
    isChair: access.isChair,
    isSuperAdmin: access.isSuperAdmin,
    isHotelCheckin: false,
    delegateId: null,
    memberId: access.memberId,
    memberRole: null,
    committeeScope: access.committeeScope,
    canApprovePayments: access.canApprovePayments,
    canAssignCommittee: false,
  };
}

function canEditPayment(payment: Payment, accessInfo?: AccessInfo) {
  const access = toConferenceAccess(accessInfo);
  if (!access) return false;
  return canEditPaymentAccess(paymentToAccessRecord(payment), access);
}

function canDeletePayment(payment: Payment, accessInfo?: AccessInfo) {
  const access = toConferenceAccess(accessInfo);
  if (!access) return false;
  return canDeletePaymentAccess(paymentToAccessRecord(payment), access);
}

function buildDraftPaymentForPreview(args: {
  paymentType: PaymentType;
  paidBy: string;
  paidTo: string;
  method: string;
  txRef: string;
  note: string;
  committeeScope: string;
  incomeSource: string;
  paymentItems: PaymentItem[];
  paymentItemsTotal: number;
  receiptStateByItemId: Record<string, FinanceLineItemReceiptState>;
  preparedByMemberId: string;
  members: SignatoryMember[];
  editingPaymentId: string | null;
}): Payment {
  const preparedByName =
    args.members.find((member) => member.id === args.preparedByMemberId)?.name ??
    "";

  const lineItems: PaymentLineItemRecord[] = args.paymentItems
    .filter((item) => item.name.trim())
    .map((item, idx) => {
      const receiptState = args.receiptStateByItemId[item.id];
      const proofs: Proof[] = [];

      for (const proof of receiptState?.existingProofs ?? []) {
        proofs.push({
          id: proof.id,
          fileName: proof.fileName,
          filePath: proof.filePath,
          fileType: proof.fileType ?? null,
        });
      }

      if (receiptState?.pendingPreview) {
        proofs.push({
          id: `draft-preview-${item.id}`,
          fileName: "Receipt preview",
          filePath: receiptState.pendingPreview,
          fileType: "image/png",
        });
      }

      return {
        id: item.id,
        no: idx + 1,
        name: item.name.trim(),
        qty: Number(item.qty) || 0,
        unit:
          item.unit === "custom"
            ? item.customUnit?.trim() || "custom"
            : String(item.unit).trim() || "pcs",
        unitPrice: Number(item.unitPrice) || 0,
        proofs,
      };
    });

  return {
    id: args.editingPaymentId ?? "draft-preview",
    amount: args.paymentItemsTotal,
    paidBy: args.paidBy.trim() || preparedByName || "—",
    paidTo: args.paidTo.trim() || null,
    method: args.method,
    ref: args.txRef.trim() || null,
    note: args.note.trim() || null,
    status: "PENDING",
    paymentType: args.paymentType,
    incomeSource: args.paymentType === "INCOME" ? args.incomeSource || null : null,
    committeeScope: args.committeeScope.trim() || null,
    isLocked: false,
    committeeApprovedBy: null,
    committeeApprovedAt: null,
    approvedBy: null,
    approvedAt: null,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    proofs: [],
    lineItems,
    submittedBy: preparedByName
      ? {
          id: args.preparedByMemberId,
          name: preparedByName,
          role: "",
          committeeScope: args.committeeScope || null,
        }
      : null,
    committeeApprover: null,
    budget: null,
  };
}

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
          const itemDetails = formatPaymentLineItemsSummary(payment);
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
              allPaymentProofs(payment).length > 0
                ? `${allPaymentProofs(payment).length} file${allPaymentProofs(payment).length === 1 ? "" : "s"}`
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
    .filter((payment) => allPaymentProofs(payment).length > 0)
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
          {payments.some((payment) => allPaymentProofs(payment).length > 0) && (
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
                    allPaymentProofs(payment).map((proof) => ({
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
                      {proofIsImage(proof) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proofDisplayUrl(proof)}
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
  const [confirmedPayments, setConfirmedPayments] = useState<Payment[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [listTotal, setListTotal] = useState(0);
  const [listPages, setListPages] = useState(1);
  const [rejectedPayments, setRejectedPayments] = useState<Payment[]>([]);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [rejectedPages, setRejectedPages] = useState(1);
  const [paymentStats, setPaymentStats] = useState({
    totalExpense: 0,
    totalIncome: 0,
    pendingCount: 0,
    lockedCount: 0,
  });
  const [listViewMode, setListViewMode] = useState<PaymentListViewMode>("list");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
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
    emptyPaymentItem(),
  ]);
  const [preparedByMemberId, setPreparedByMemberId] = useState("");
  const [receiptStateByItemId, setReceiptStateByItemId] = useState<
    Record<string, FinanceLineItemReceiptState>
  >({});
  const [autoPromptReceiptForItemId, setAutoPromptReceiptForItemId] = useState<
    string | null
  >(null);
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

  const loadPayments = useCallback(
    async (
      id: string,
      opts?: {
        page?: number;
        pageSize?: number;
        statusOverride?: PaymentStatusFilter;
      },
    ) => {
      const page = opts?.page ?? listPage;
      const pageSize = opts?.pageSize ?? listPageSize;
      const effectiveStatus = opts?.statusOverride ?? filterStatus;

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (filterType !== "ALL") params.set("type", filterType);
      if (effectiveStatus !== "ALL") {
        params.set("status", effectiveStatus);
      }

      const res = await fetch(`/api/conf/${id}/payments?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load payments");
      const payload = (await res.json()) as PaginatedPaymentsResponse;
      return payload;
    },
    [filterType, filterStatus, listPage, listPageSize],
  );

  const loadConfirmedPayments = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/payments?status=APPROVED`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load confirmed payments");
    return (await res.json()) as Payment[];
  }, []);

  const loadRejectedPayments = useCallback(
    async (id: string, page = rejectedPage) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(listPageSize));
      params.set("status", "REJECTED");
      if (filterType !== "ALL") params.set("type", filterType);

      const res = await fetch(`/api/conf/${id}/payments?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load rejected payments");
      return (await res.json()) as PaginatedPaymentsResponse;
    },
    [filterType, listPageSize, rejectedPage],
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
    setListViewMode(loadPaymentViewMode());
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        const [listPayload, confirmed, rejectedPayload, , membersRes, bookletRes] =
          await Promise.all([
            loadPayments(conf.id, { page: 1 }),
            loadConfirmedPayments(conf.id),
            filterStatus === "ACTIVE" || filterStatus === "ALL"
              ? loadRejectedPayments(conf.id, 1)
              : Promise.resolve(null),
            loadCommitteeOptions(conf.id),
            fetch(`/api/conf/${conf.id}/members`, { cache: "no-store" }),
            fetch(`/api/conf/${conf.id}/booklet/data`, { cache: "no-store" }),
          ]);
        setPayments(listPayload.payments);
        setListTotal(listPayload.total);
        setListPage(listPayload.page);
        setListPages(listPayload.pages);
        setPaymentStats(listPayload.stats);
        setConfirmedPayments(confirmed);
        if (rejectedPayload) {
          setRejectedPayments(rejectedPayload.payments);
          setRejectedTotal(rejectedPayload.total);
          setRejectedPage(rejectedPayload.page);
          setRejectedPages(rejectedPayload.pages);
        } else {
          setRejectedPayments([]);
          setRejectedTotal(0);
        }

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
  }, [loadCommitteeOptions, loadConfirmedPayments, loadPayments, loadRejectedPayments]);

  const filtersInitializedRef = useRef(false);
  useEffect(() => {
    if (!confId) return;
    if (!filtersInitializedRef.current) {
      filtersInitializedRef.current = true;
      return;
    }
    const reload = async () => {
      try {
        setLoading(true);
        setListPage(1);
        setRejectedPage(1);
        const [listPayload, confirmed, rejectedPayload] = await Promise.all([
          loadPayments(confId, { page: 1 }),
          loadConfirmedPayments(confId),
          filterStatus === "ACTIVE" || filterStatus === "ALL"
            ? loadRejectedPayments(confId, 1)
            : Promise.resolve(null),
        ]);
        setPayments(listPayload.payments);
        setListTotal(listPayload.total);
        setListPages(listPayload.pages);
        setPaymentStats(listPayload.stats);
        setConfirmedPayments(confirmed);
        setSelectedPaymentIds([]);
        if (rejectedPayload) {
          setRejectedPayments(rejectedPayload.payments);
          setRejectedTotal(rejectedPayload.total);
          setRejectedPages(rejectedPayload.pages);
        } else {
          setRejectedPayments([]);
          setRejectedTotal(0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reload");
      } finally {
        setLoading(false);
      }
    };
    void reload();
  }, [confId, filterType, filterStatus, loadConfirmedPayments, loadPayments, loadRejectedPayments]);

  const addPaymentItem = useCallback(() => {
    let newItemId: string | null = null;
    setPaymentItems((prev) => {
      const newItem = emptyPaymentItem(prev.length + 1);
      newItemId = newItem.id;
      return [...prev, newItem];
    });
    if (newItemId) {
      setAutoPromptReceiptForItemId(newItemId);
    }
  }, []);

  const clearAutoPromptReceipt = useCallback(() => {
    setAutoPromptReceiptForItemId(null);
  }, []);

  const removePaymentItem = useCallback((idx: number) => {
    setPaymentItems((prev) => prev.filter((_, index) => index !== idx));
  }, []);

  const updatePaymentItem = useCallback(
    (idx: number, field: keyof PaymentItem, value: string | number) => {
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
    if (accessInfo?.memberId && !preparedByMemberId) {
      setPreparedByMemberId(accessInfo.memberId);
    }
  }, [accessInfo?.committeeScope, accessInfo?.memberId, preparedByMemberId, showForm]);

  const refresh = async () => {
    if (!confId) return;
    setLoading(true);
    try {
      const [listPayload, confirmed, rejectedPayload] = await Promise.all([
        loadPayments(confId, { page: listPage, pageSize: listPageSize }),
        loadConfirmedPayments(confId),
        filterStatus === "ACTIVE" || filterStatus === "ALL"
          ? loadRejectedPayments(confId, rejectedPage)
          : Promise.resolve(null),
      ]);
      setPayments(listPayload.payments);
      setListTotal(listPayload.total);
      setListPages(listPayload.pages);
      setPaymentStats(listPayload.stats);
      setConfirmedPayments(confirmed);
      if (rejectedPayload) {
        setRejectedPayments(rejectedPayload.payments);
        setRejectedTotal(rejectedPayload.total);
        setRejectedPages(rejectedPayload.pages);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const goToListPage = async (nextPage: number) => {
    if (!confId) return;
    setLoading(true);
    try {
      const listPayload = await loadPayments(confId, {
        page: nextPage,
        pageSize: listPageSize,
      });
      setPayments(listPayload.payments);
      setListTotal(listPayload.total);
      setListPage(listPayload.page);
      setListPages(listPayload.pages);
      setPaymentStats(listPayload.stats);
      setSelectedPaymentIds([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const goToRejectedPage = async (nextPage: number) => {
    if (!confId) return;
    setLoading(true);
    try {
      const rejectedPayload = await loadRejectedPayments(confId, nextPage);
      setRejectedPayments(rejectedPayload.payments);
      setRejectedTotal(rejectedPayload.total);
      setRejectedPage(rejectedPayload.page);
      setRejectedPages(rejectedPayload.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rejected page");
    } finally {
      setLoading(false);
    }
  };

  const handleListPageSizeChange = async (nextSize: number) => {
    setListPageSize(nextSize);
    setListPage(1);
    setRejectedPage(1);
    if (!confId) return;
    setLoading(true);
    try {
      const [listPayload, rejectedPayload] = await Promise.all([
        loadPayments(confId, { page: 1, pageSize: nextSize }),
        filterStatus === "ACTIVE" || filterStatus === "ALL"
          ? loadRejectedPayments(confId, 1)
          : Promise.resolve(null),
      ]);
      setPayments(listPayload.payments);
      setListTotal(listPayload.total);
      setListPages(listPayload.pages);
      setPaymentStats(listPayload.stats);
      if (rejectedPayload) {
        setRejectedPayments(rejectedPayload.payments);
        setRejectedTotal(rejectedPayload.total);
        setRejectedPages(rejectedPayload.pages);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change page size");
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode: PaymentListViewMode) => {
    setListViewMode(mode);
    savePaymentViewMode(mode);
  };

  const deletablePaymentsOnPage = useMemo(
    () => payments.filter((payment) => canDeletePayment(payment, accessInfo)),
    [payments, accessInfo],
  );

  const allDeletableSelected =
    deletablePaymentsOnPage.length > 0 &&
    deletablePaymentsOnPage.every((payment) =>
      selectedPaymentIds.includes(payment.id),
    );

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId],
    );
  };

  const toggleSelectAllDeletable = () => {
    if (allDeletableSelected) {
      setSelectedPaymentIds((prev) =>
        prev.filter(
          (id) => !deletablePaymentsOnPage.some((payment) => payment.id === id),
        ),
      );
      return;
    }
    setSelectedPaymentIds((prev) => [
      ...prev,
      ...deletablePaymentsOnPage
        .map((payment) => payment.id)
        .filter((id) => !prev.includes(id)),
    ]);
  };

  const uploadProofWithProgress = useCallback(
    (
      paymentId: string,
      file: File,
      lineItemId: string | undefined,
      onProgress: (percent: number) => void,
    ) =>
      new Promise<Proof>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/conf/${confId}/payments/${paymentId}/upload`);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            try {
              resolve(JSON.parse(xhr.responseText) as Proof);
            } catch {
              reject(new Error("Upload succeeded but response was invalid."));
            }
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
        if (lineItemId) fd.append("lineItemId", lineItemId);
        xhr.send(fd);
      }),
    [confId],
  );

  const syncPaymentForReceiptUpload = useCallback(
    async (
      lineItemIndex: number,
      currentItems: PaymentItem[],
      currentReceiptState: Record<string, FinanceLineItemReceiptState>,
    ) => {
      if (!confId) {
        throw new Error("Conference not loaded yet.");
      }

      const syncItems = buildSyncLineItems(currentItems);
      const syncAmount = syncItems.reduce(
        (sum, item) => sum + calcItemTotal(item.qty, item.unitPrice),
        0,
      );
      const preparedByName = members.find(
        (member) => member.id === preparedByMemberId,
      )?.name;
      const effectivePaidBy =
        paidBy.trim() || preparedByName?.trim() || "Pending";

      const payload = {
        amount: syncAmount,
        paidBy: effectivePaidBy,
        paidTo: paidTo || undefined,
        method,
        ref: txRef || undefined,
        note: note?.trim() || undefined,
        paymentType,
        incomeSource:
          paymentType === "INCOME" ? incomeSource || undefined : undefined,
        committeeScope: committeeScope || undefined,
        submittedByMemberId: preparedByMemberId || undefined,
        items: syncItems,
      };

      const endpoint = editingPaymentId
        ? `/api/conf/${confId}/payments/${editingPaymentId}`
        : `/api/conf/${confId}/payments`;
      const res = await fetch(endpoint, {
        method: editingPaymentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(
          err.error ??
            (editingPaymentId
              ? "Failed to sync payment for receipt upload"
              : "Failed to create payment for receipt upload"),
        );
      }

      const payment = (await res.json()) as Payment;
      if (!editingPaymentId) {
        setEditingPaymentId(payment.id);
      }

      const { items, receiptState } = remapAfterPaymentSync(
        payment,
        currentItems,
        currentReceiptState,
      );
      setPaymentItems(items);
      setReceiptStateByItemId(receiptState);

      const lineItemId = payment.lineItems?.[lineItemIndex]?.id;
      if (!lineItemId) {
        throw new Error("Failed to resolve line item for receipt upload.");
      }

      return {
        paymentId: payment.id,
        lineItemId,
        items,
        receiptState,
      };
    },
    [
      committeeScope,
      confId,
      editingPaymentId,
      incomeSource,
      members,
      method,
      note,
      paidBy,
      paidTo,
      paymentType,
      preparedByMemberId,
      txRef,
    ],
  );

  const handleReceiptSelect = useCallback(
    async (index: number, file: File) => {
      const validation = await validatePaymentProofFile(file);
      if (!validation.ok) {
        setProofValidationFeedback(
          validation.error.startsWith("Unsupported file format")
            ? `${file.name}: unsupported format. Use PNG, JPG, JPEG, WEBP, GIF, or PDF.`
            : `${file.name}: ${validation.error}`,
        );
        return;
      }

      setProofValidationFeedback(null);
      const item = paymentItems[index];
      if (!item || !confId) return;

      let preview = "";
      if (file.type.startsWith("image/")) {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
      }

      setReceiptStateByItemId((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          uploading: true,
          uploadPercent: 0,
          pendingPreview: preview || null,
        },
      }));

      try {
        const synced = await syncPaymentForReceiptUpload(
          index,
          paymentItems,
          receiptStateByItemId,
        );
        const syncedItemId = synced.items[index]?.id ?? item.id;

        setReceiptStateByItemId((prev) => ({
          ...synced.receiptState,
          [syncedItemId]: {
            ...synced.receiptState[syncedItemId],
            ...prev[syncedItemId],
            ...prev[item.id],
            uploading: true,
            uploadPercent: 0,
            pendingPreview: preview || null,
          },
        }));

        const proof = await uploadProofWithProgress(
          synced.paymentId,
          file,
          synced.lineItemId,
          (percent) => {
            setReceiptStateByItemId((prev) => ({
              ...prev,
              [syncedItemId]: {
                ...prev[syncedItemId],
                uploading: true,
                uploadPercent: percent,
              },
            }));
          },
        );

        setReceiptStateByItemId((prev) => ({
          ...prev,
          [syncedItemId]: {
            ...prev[syncedItemId],
            uploading: false,
            uploadPercent: undefined,
            pendingFile: null,
            pendingPreview: null,
            existingProofs: [
              {
                id: proof.id,
                fileName: proof.fileName,
                filePath: proofDisplayUrl(proof),
                fileType: proof.fileType,
              },
            ],
          },
        }));
      } catch (e) {
        setReceiptStateByItemId((prev) => ({
          ...prev,
          [item.id]: {
            ...prev[item.id],
            uploading: false,
            uploadPercent: undefined,
            pendingPreview: null,
          },
        }));
        setError(e instanceof Error ? e.message : "Failed to upload receipt");
      }
    },
    [
      confId,
      paymentItems,
      receiptStateByItemId,
      syncPaymentForReceiptUpload,
      uploadProofWithProgress,
    ],
  );

  const handleReceiptRemove = useCallback(
    async (index: number, proofId?: string) => {
      const item = paymentItems[index];
      if (!item) return;

      if (proofId && editingPaymentId && confId) {
        try {
          const res = await fetch(
            `/api/conf/${confId}/payments/${editingPaymentId}/proofs/${proofId}`,
            { method: "DELETE" },
          );
          if (!res.ok) {
            const err = (await res.json()) as { error?: string };
            throw new Error(err.error ?? "Failed to remove receipt");
          }
          setReceiptStateByItemId((prev) => ({
            ...prev,
            [item.id]: {
              ...prev[item.id],
              existingProofs: (prev[item.id]?.existingProofs ?? []).filter(
                (proof) => proof.id !== proofId,
              ),
            },
          }));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to remove receipt");
        }
        return;
      }

      setReceiptStateByItemId((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          pendingFile: null,
          pendingPreview: null,
        },
      }));
    },
    [confId, editingPaymentId, paymentItems],
  );

  const handleSubmit = async () => {
    const serializedItems = serializePaymentItems(paymentItems);
    const computedItemTotal = paymentItemsTotal;
    const effectiveAmount = computedItemTotal;

    if (!effectiveAmount || !paidBy || !confId || saving) return;
    if (!(effectiveAmount > 0)) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (serializedItems.length === 0) {
      setError("Add at least one line item with a name.");
      return;
    }

    setSaving(true);
    setError(null);
    setProofValidationFeedback(null);
    try {
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
          note: note?.trim() || undefined,
          paymentType,
          incomeSource:
            paymentType === "INCOME" ? incomeSource || undefined : undefined,
          committeeScope: committeeScope || undefined,
          submittedByMemberId: preparedByMemberId || undefined,
          items: serializedItems,
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

      await res.json();
      await refresh();
      resetForm();
    } catch (e) {
      setUploadStatus(null);
      setError(e instanceof Error ? e.message : "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    if (!canEditPayment(payment, accessInfo)) {
      setError("You do not have permission to edit this payment.");
      return;
    }

    setEditingPaymentId(payment.id);
    setPaymentType(payment.paymentType || "EXPENSE");
    setAmount(String(payment.amount));
    const loadedItems = paymentItemsFromPayment(payment);
    setPaymentItems(loadedItems);
    setPreparedByMemberId(payment.submittedBy?.id || "");
    setReceiptStateByItemId(() => {
      const next: Record<string, FinanceLineItemReceiptState> = {};
      loadedItems.forEach((item, idx) => {
        const serverItem = payment.lineItems?.[idx];
        next[item.id] = {
          existingProofs: serverItem?.proofs ?? [],
        };
      });
      return next;
    });
    setPaidBy(payment.paidBy || "");
    setPaidTo(payment.paidTo || "");
    setMethod(payment.method || "WECHAT");
    setTxRef(payment.ref || "");
    setNote(stripPaymentItemDetails(payment.note || ""));
    setCommitteeScope(payment.committeeScope || "");
    setIncomeSource(payment.incomeSource || "");
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
      setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
      if (editingPaymentId === paymentId) {
        resetForm();
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confId || bulkDeleteLoading || selectedPaymentIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedPaymentIds.length} selected payment record${selectedPaymentIds.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setBulkDeleteLoading(true);
    setError(null);
    try {
      for (const paymentId of selectedPaymentIds) {
        const res = await fetch(`/api/conf/${confId}/payments/${paymentId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Failed to delete one or more payments");
        }
      }
      if (editingPaymentId && selectedPaymentIds.includes(editingPaymentId)) {
        resetForm();
      }
      setSelectedPaymentIds([]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk delete failed");
    } finally {
      setBulkDeleteLoading(false);
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
      await res.json();
      await refresh();
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
      await refresh();
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
    setPaymentItems([emptyPaymentItem()]);
    setPreparedByMemberId(accessInfo?.memberId || "");
    setReceiptStateByItemId({});
    setAutoPromptReceiptForItemId(null);
    setPaidBy("");
    setPaidTo("");
    setMethod("WECHAT");
    setTxRef("");
    setNote("");
    setCommitteeScope("");
    setIncomeSource("");
    setProofValidationFeedback(null);
    setUploadStatus(null);
    setShowForm(false);
  };

  const draftPaymentPreview = useMemo(
    () =>
      buildDraftPaymentForPreview({
        paymentType,
        paidBy,
        paidTo,
        method,
        txRef,
        note,
        committeeScope,
        incomeSource,
        paymentItems,
        paymentItemsTotal,
        receiptStateByItemId,
        preparedByMemberId,
        members,
        editingPaymentId,
      }),
    [
      paymentType,
      paidBy,
      paidTo,
      method,
      txRef,
      note,
      committeeScope,
      incomeSource,
      paymentItems,
      paymentItemsTotal,
      receiptStateByItemId,
      preparedByMemberId,
      members,
      editingPaymentId,
    ],
  );

  const livePreviewPayments = showForm
    ? [draftPaymentPreview]
    : confirmedPayments;
  const livePreviewExpense = showForm
    ? draftPaymentPreview.paymentType === "EXPENSE"
      ? draftPaymentPreview.amount
      : 0
    : paymentStats.totalExpense;
  const livePreviewIncome = showForm
    ? draftPaymentPreview.paymentType === "INCOME"
      ? draftPaymentPreview.amount
      : 0
    : paymentStats.totalIncome;

  const showRejectedSection =
    (filterStatus === "ACTIVE" || filterStatus === "ALL") &&
    rejectedTotal > 0;
  const listIsEmpty = payments.length === 0;
  const totalExpense = paymentStats.totalExpense;
  const totalIncome = paymentStats.totalIncome;
  const pendingCount = paymentStats.pendingCount;
  const lockedCount = paymentStats.lockedCount;
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
                ? "Update line items and receipts. Each line item can have its own proof screenshot."
                : "Record expenses or incoming funds with line items and receipt proof per item"}
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
                <Label>Prepared By (Committee Member)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={preparedByMemberId}
                  onChange={(e) => setPreparedByMemberId(e.target.value)}
                  disabled={
                    Boolean(accessInfo?.memberId) && !accessInfo?.isSuperAdmin
                  }
                >
                  <option value="">Select member profile...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id ?? ""}>
                      {member.name}
                      {member.committeeScope
                        ? ` (${member.committeeScope})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Transaction Ref</Label>
                <Input
                  placeholder="Reference number"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Grand Total (auto-calculated)</Label>
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/20 px-3 text-sm font-semibold text-[#C8A061]">
                  {fmtRmb(paymentItemsTotal)}
                </div>
              </div>
            </div>

            <FinanceLineItemsTable
              items={paymentItems}
              grandTotal={paymentItemsTotal}
              onAddItem={addPaymentItem}
              onRemoveItem={removePaymentItem}
              onUpdateItem={updatePaymentItem}
              showReceiptColumn
              receiptStateByItemId={receiptStateByItemId}
              onReceiptSelect={handleReceiptSelect}
              onReceiptRemove={handleReceiptRemove}
              autoPromptReceiptForItemId={autoPromptReceiptForItemId}
              onAutoPromptReceiptHandled={clearAutoPromptReceipt}
              receiptUploadHint={`Upload a receipt or payment screenshot per line item (${DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL}). Maximum ${CONFERENCE_UPLOAD_MAX_SIZE_LABEL} per file. ${DELEGATE_UPLOAD_CONVERSION_TIP}`}
            />

            <div className="space-y-2">
              <Label>Description / Note</Label>
              <Textarea
                placeholder="Optional notes about this payment record..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
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
                    Uploading receipt {uploadStatus.currentFile}/
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
                  !(paymentItemsTotal > 0) ||
                  serializePaymentItems(paymentItems).length === 0
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

      {showForm && (
        <Card className="payments-no-print border-[#C8A061]/30">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Live Payment Document</CardTitle>
              <CardDescription>
                Full letter-style preview. Updates as you type line items,
                metadata, and receipts.
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
                  payments={livePreviewPayments}
                  totalExpense={livePreviewExpense}
                  totalIncome={livePreviewIncome}
                  confInfo={confInfo}
                  members={members}
                  signatoryDraft={signatoryDraft}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {listIsEmpty && !showForm && (
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

      {!listIsEmpty && (
        <Card className="payments-no-print">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Payment Records</CardTitle>
                <CardDescription>
                  {listTotal} record{listTotal === 1 ? "" : "s"}
                  {selectedPaymentIds.length > 0
                    ? ` · ${selectedPaymentIds.length} selected`
                    : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {deletablePaymentsOnPage.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={toggleSelectAllDeletable}
                    >
                      {allDeletableSelected ? (
                        <CheckSquare className="size-3.5" />
                      ) : (
                        <Square className="size-3.5" />
                      )}
                      Select all
                    </Button>
                    {selectedPaymentIds.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 border-red-500/40 text-xs text-red-600 hover:bg-red-500/10"
                        onClick={() => void handleBulkDelete()}
                        disabled={bulkDeleteLoading}
                      >
                        {bulkDeleteLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        Delete selected
                      </Button>
                    )}
                  </>
                )}
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                  <Button
                    type="button"
                    variant={listViewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleViewModeChange("list")}
                  >
                    <List className="size-3.5" />
                    List
                  </Button>
                  <Button
                    type="button"
                    variant={listViewMode === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleViewModeChange("cards")}
                  >
                    <LayoutGrid className="size-3.5" />
                    Cards
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={
                listViewMode === "cards"
                  ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                  : "space-y-3"
              }
            >
              {payments.map((payment) => {
          const config = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING;
          const StatusIcon = config.icon;
          const isExpense =
            payment.paymentType === "EXPENSE" || !payment.paymentType;
          const isRejecting = rejectingId === payment.id;
          const showEdit = canEditPayment(payment, accessInfo);
          const showDelete = canDeletePayment(payment, accessInfo);
          const isSelected = selectedPaymentIds.includes(payment.id);

          return (
            <Card
              key={payment.id}
              className={cn(
                payment.isLocked ? "border-purple-500/30" : "",
                listViewMode === "cards" && "h-full",
                isSelected && "border-[#002868]/50 ring-1 ring-[#002868]/20",
              )}
            >
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-2">
                    {showDelete && (
                      <button
                        type="button"
                        className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => togglePaymentSelection(payment.id)}
                        title={
                          isSelected ? "Deselect for delete" : "Select for delete"
                        }
                      >
                        {isSelected ? (
                          <CheckSquare className="size-4 text-[#C8A061]" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
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

                    {paymentFreeformNote(payment) && (
                      <p className="text-xs text-muted-foreground">
                        {paymentFreeformNote(payment)}
                      </p>
                    )}

                    {payment.lineItems && payment.lineItems.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {payment.lineItems.map((item) => (
                          <div key={item.id}>
                            {item.name}: {item.qty} {item.unit} ×{" "}
                            {fmtRmb(item.unitPrice)} ={" "}
                            {fmtRmb(calcItemTotal(item.qty, item.unitPrice))}
                          </div>
                        ))}
                      </div>
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
                  </div>

                  {/* Proof thumbnails */}
                  {allPaymentProofs(payment).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {allPaymentProofs(payment).slice(0, 4).map((proof) => (
                        <a
                          key={proof.id}
                          href={proofDisplayUrl(proof)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block size-24 overflow-hidden rounded border border-muted transition-opacity hover:opacity-80"
                          title={proof.fileName}
                        >
                          {proofIsImage(proof) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={proofDisplayUrl(proof)}
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
                      {allPaymentProofs(payment).length > 4 && (
                        <div className="flex size-24 items-center justify-center rounded border border-muted bg-muted text-xs text-muted-foreground">
                          +{allPaymentProofs(payment).length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {(showEdit || showDelete) && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                    {showEdit && (
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
                    )}
                    {showDelete && (
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
                    )}
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

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
              <div className="text-muted-foreground">
                Showing{" "}
                {listTotal === 0
                  ? 0
                  : (listPage - 1) * listPageSize + 1}{" "}
                - {Math.min(listPage * listPageSize, listTotal)} of {listTotal}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                  value={String(listPageSize)}
                  onChange={(e) =>
                    void handleListPageSizeChange(Number(e.target.value))
                  }
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => void goToListPage(listPage - 1)}
                  disabled={listPage <= 1 || loading}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {listPage} / {listPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => void goToListPage(listPage + 1)}
                  disabled={listPage >= listPages || loading}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showRejectedSection && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-base text-red-600">
              Rejected Records
            </CardTitle>
            <CardDescription>
              {rejectedTotal} rejected record{rejectedTotal === 1 ? "" : "s"} ·
              delete when no longer needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rejectedPayments.map((payment) => {
              const showDelete = canDeletePayment(payment, accessInfo);
              return (
                <div
                  key={`rejected-${payment.id}`}
                  className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="font-semibold">{payment.paidBy}</span>
                      {payment.paidTo ? ` -> ${payment.paidTo}` : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-red-600">
                        {fmtRmb(payment.amount)}
                      </div>
                      {showDelete && (
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
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(payment.paidAt).toLocaleDateString()} ·{" "}
                    {PAY_METHODS[payment.method as keyof typeof PAY_METHODS] ??
                      payment.method}
                    {payment.ref ? ` · Ref: ${payment.ref}` : ""}
                  </div>
                </div>
              );
            })}

            {rejectedPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
                <div className="text-muted-foreground">
                  Page {rejectedPage} / {rejectedPages} · {rejectedTotal} total
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => void goToRejectedPage(rejectedPage - 1)}
                    disabled={rejectedPage <= 1 || loading}
                  >
                    <ChevronLeft className="size-4" />
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => void goToRejectedPage(rejectedPage + 1)}
                    disabled={rejectedPage >= rejectedPages || loading}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card className="payments-no-print border-[#C8A061]/30">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Payments Register Preview</CardTitle>
              <CardDescription>
                Finally approved payments in register format (updates when
                records are confirmed).
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
                  payments={livePreviewPayments}
                  totalExpense={livePreviewExpense}
                  totalIncome={livePreviewIncome}
                  confInfo={confInfo}
                  members={members}
                  signatoryDraft={signatoryDraft}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
