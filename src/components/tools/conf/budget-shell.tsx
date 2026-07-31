"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  ZoomIn,
  ZoomOut,
  Eye,
  Download,
  CheckSquare,
  Square,
  XCircle,
  Lock,
  Unlock,
  LayoutGrid,
  List,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/creative/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import {
  BUDGET_CATEGORIES,
  BUDGET_STATUS_LABELS,
  BUDGET_EDIT_UNLOCK_LABELS,
  COMMON_UNITS,
} from "@/lib/conf/config";
import {
  calcItemTotal,
  calcBudgetTotal,
  fmtRmb,
  fmtDual,
} from "@/lib/conf/currency";
import { multiBudgetToCsv } from "@/lib/conf/export";
import { fetchDefaultConference } from "@/lib/conf/client";
import { resolveConferenceAccessFlags } from "@/lib/conf/client-access";
import {
  DocumentLayout,
  DocumentTable,
  normalizeConfInfo,
  normalizeSidebarMembers,
} from "@/lib/conf/document-layout";
import {
  computePageChunks,
  estimateTextBlockH,
} from "@/lib/conf/document-pagination";
import {
  validatePaymentProofFile,
  delegateDocumentAcceptAttribute,
  CONFERENCE_UPLOAD_MAX_SIZE_LABEL,
  DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/file-upload-client";
import { formatUploadError } from "@/lib/conf/upload-feedback-client";
import {
  createDefaultSignatoryDraft,
  DocumentSignatoryControls,
  SignatoryDraft,
  hasSignatories,
} from "@/components/tools/conf/document-signatory-controls";
import { DocumentSignatureBlock } from "@/components/tools/conf/document-signature-block";

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
  itemsHeading?: string;
  items: BudgetItem[];
  savedAt: string; // ISO string
};

type AccessInfo = {
  isManager: boolean;
  isChair: boolean;
  isSuperAdmin: boolean;
  canApprovePayments: boolean;
  memberId: string | null;
  committeeScope: string | null;
};

type ExportBudgetEntry = {
  key: string;
  draft: BudgetDraft;
  total: number;
  preparedByName: string;
};

type MemberOption = {
  id: string;
  name: string;
  role?: string | null;
  title?: string | null;
  committeeScope: string | null;
  canApprovePayments: boolean;
  city?: string | null;
  phone?: string | null;
};

type ConferenceEventInfo = {
  name: string;
  city: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
};

type ServerBudget = {
  id: string;
  title: string;
  category: string;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED";
  notes: string | null;
  createdAt: string;
  approvedAt: string | null;
  isLocked: boolean;
  editUnlockStatus: "NONE" | "PENDING" | "GRANTED";
  editUnlockRequestedAt: string | null;
  editUnlockRequestNote: string | null;
  rejectionNote?: string | null;
  creator: {
    id: string;
    name: string;
    committeeScope: string | null;
    canApprovePayments: boolean;
  };
  items: Array<{
    id: string;
    no: number;
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
    notes?: string | null;
  }>;
};

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "conf_budget_drafts";
const SUBMITTED_VIEW_LS_KEY = "conf_budget_submitted_view";

type SubmittedBudgetViewMode = "list" | "cards";

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
    itemsHeading: "Line Item Breakdown",
    items: [emptyItem(1)],
    savedAt: new Date().toISOString(),
  };
}

function unitLabel(item: BudgetItem) {
  return item.unit === "custom" ? item.customUnit || "—" : item.unit;
}

function draftExportKey(id: string) {
  return `draft:${id}`;
}

function serverExportKey(id: string) {
  return `server:${id}`;
}

function serverBudgetToDraft(budget: ServerBudget): BudgetDraft {
  const knownUnits = new Set<string>(COMMON_UNITS);
  return {
    id: budget.id,
    title: budget.title,
    category: budget.category,
    notes: budget.notes ?? "",
    itemsHeading: "Line Item Breakdown",
    items: budget.items.map((item) => {
      const isCustom = !knownUnits.has(item.unit);
      return {
        id: item.id,
        no: item.no,
        name: item.name,
        qty: item.qty,
        unit: isCustom ? "custom" : item.unit,
        customUnit: isCustom ? item.unit : "",
        unitPrice: item.unitPrice,
        notes: item.notes ?? "",
      };
    }),
    savedAt: budget.createdAt,
  };
}

function mergeBudgetAccessInfo(
  serverAccess?: AccessInfo,
  clientFlags?: {
    isManager: boolean;
    isSuperAdmin: boolean;
  },
): AccessInfo | undefined {
  if (!serverAccess && !clientFlags) return undefined;
  return {
    isManager: Boolean(
      serverAccess?.isManager ||
      clientFlags?.isManager ||
      clientFlags?.isSuperAdmin,
    ),
    isChair: Boolean(serverAccess?.isChair || clientFlags?.isSuperAdmin),
    isSuperAdmin: Boolean(
      serverAccess?.isSuperAdmin || clientFlags?.isSuperAdmin,
    ),
    canApprovePayments: Boolean(
      serverAccess?.canApprovePayments || clientFlags?.isSuperAdmin,
    ),
    memberId: serverAccess?.memberId ?? null,
    committeeScope: serverAccess?.committeeScope ?? null,
  };
}

function isBudgetOwner(budget: ServerBudget, accessInfo?: AccessInfo): boolean {
  return Boolean(
    accessInfo?.memberId && budget.creator.id === accessInfo.memberId,
  );
}

function canPreviewSubmittedBudget(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
  options?: {
    canCommitteeApprove?: boolean;
    canFinalApprove?: boolean;
  },
): boolean {
  if (!accessInfo) return false;
  if (options?.canCommitteeApprove || options?.canFinalApprove) return true;
  if (isBudgetOwner(budget, accessInfo)) return true;
  if (accessInfo.isSuperAdmin || accessInfo.isChair || accessInfo.isManager) {
    return true;
  }
  if (!accessInfo.canApprovePayments) return false;
  if (!budget.creator.committeeScope || !accessInfo.committeeScope) return true;
  return budget.creator.committeeScope === accessInfo.committeeScope;
}

function canSelectBudgetForExport(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo) return false;
  if (isBudgetOwner(budget, accessInfo)) return true;
  return canPreviewSubmittedBudget(budget, accessInfo);
}

function canRejectBudget(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo) return false;
  if (budget.status === "APPROVED" || budget.status === "REJECTED") {
    return false;
  }
  if (accessInfo.isChair || accessInfo.isSuperAdmin) return true;
  if (!accessInfo.canApprovePayments || !accessInfo.committeeScope)
    return false;
  if (
    budget.creator.committeeScope &&
    budget.creator.committeeScope !== accessInfo.committeeScope
  ) {
    return false;
  }
  return true;
}

function canDeleteBudget(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo) return false;
  if (budget.status === "APPROVED" || budget.isLocked) return false;

  if (accessInfo.isChair || accessInfo.isSuperAdmin) return true;

  if (isBudgetOwner(budget, accessInfo)) {
    return budget.status === "DRAFT" || budget.status === "REJECTED";
  }

  if (!accessInfo.canApprovePayments || !accessInfo.committeeScope)
    return false;
  if (
    budget.creator.committeeScope &&
    budget.creator.committeeScope !== accessInfo.committeeScope
  ) {
    return false;
  }
  return true;
}

function canEditBudget(budget: ServerBudget, accessInfo?: AccessInfo): boolean {
  if (!accessInfo) return false;
  if (accessInfo.isChair || accessInfo.isSuperAdmin) return true;
  if (!isBudgetOwner(budget, accessInfo)) return false;
  if (budget.status === "DRAFT" || budget.status === "REJECTED") return true;
  if (budget.editUnlockStatus === "GRANTED") return true;
  return false;
}

function canRequestEditAccess(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo || !isBudgetOwner(budget, accessInfo)) return false;
  if (budget.status !== "REVIEW" && budget.status !== "APPROVED") return false;
  if (
    budget.editUnlockStatus === "PENDING" ||
    budget.editUnlockStatus === "GRANTED"
  ) {
    return false;
  }
  return true;
}

function canGrantEditAccess(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo?.isChair && !accessInfo?.isSuperAdmin) return false;
  if (budget.editUnlockStatus === "GRANTED") return false;
  return budget.status === "REVIEW" || budget.status === "APPROVED";
}

function canRejectEditRequest(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo?.isChair && !accessInfo?.isSuperAdmin) return false;
  return budget.editUnlockStatus === "PENDING";
}

function canRelockBudget(
  budget: ServerBudget,
  accessInfo?: AccessInfo,
): boolean {
  if (!accessInfo?.isChair && !accessInfo?.isSuperAdmin) return false;
  return budget.editUnlockStatus === "GRANTED";
}

function budgetStatusBadge(budget: ServerBudget) {
  if (budget.status === "REVIEW") {
    return { label: "Committee Approved", variant: "outline" as const };
  }
  return (
    BUDGET_STATUS_LABELS[budget.status] ?? {
      label: budget.status,
      variant: "outline" as const,
    }
  );
}

function loadSubmittedViewMode(): SubmittedBudgetViewMode {
  try {
    const stored = localStorage.getItem(SUBMITTED_VIEW_LS_KEY);
    if (stored === "list" || stored === "cards") return stored;
  } catch {
    // ignore
  }
  return "list";
}

function saveSubmittedViewMode(mode: SubmittedBudgetViewMode) {
  try {
    localStorage.setItem(SUBMITTED_VIEW_LS_KEY, mode);
  } catch {
    // ignore
  }
}

type SubmittedBudgetPermissions = {
  canCommitteeApprove: boolean;
  canFinalApprove: boolean;
  showPreview: boolean;
  canExport: boolean;
  showReject: boolean;
  showDelete: boolean;
  showEdit: boolean;
  showRequestEdit: boolean;
  showUnlock: boolean;
  showRejectEditRequest: boolean;
  showRelock: boolean;
};

function getSubmittedBudgetPermissions(
  budget: ServerBudget,
  accessInfo: AccessInfo | undefined,
  canFinalApproveFromDraft: (budget: ServerBudget) => boolean,
): SubmittedBudgetPermissions {
  const canCommitteeApprove = Boolean(
    budget.status === "DRAFT" &&
    (accessInfo?.isSuperAdmin ||
      (Boolean(accessInfo?.canApprovePayments) &&
        Boolean(accessInfo?.committeeScope) &&
        budget.creator.committeeScope === accessInfo?.committeeScope)),
  );
  const canFinalApprove = Boolean(
    (budget.status === "REVIEW" || canFinalApproveFromDraft(budget)) &&
    (accessInfo?.isChair || accessInfo?.isSuperAdmin),
  );

  return {
    canCommitteeApprove,
    canFinalApprove,
    showPreview: canPreviewSubmittedBudget(budget, accessInfo, {
      canCommitteeApprove,
      canFinalApprove,
    }),
    canExport: canSelectBudgetForExport(budget, accessInfo),
    showReject: canRejectBudget(budget, accessInfo),
    showDelete: canDeleteBudget(budget, accessInfo),
    showEdit: canEditBudget(budget, accessInfo),
    showRequestEdit: canRequestEditAccess(budget, accessInfo),
    showUnlock: canGrantEditAccess(budget, accessInfo),
    showRejectEditRequest: canRejectEditRequest(budget, accessInfo),
    showRelock: canRelockBudget(budget, accessInfo),
  };
}

type SubmittedBudgetActionHandlers = {
  onView: () => void;
  onEdit: () => void;
  onCommitteeApprove: () => void;
  onFinalApprove: () => void;
  onReject: () => void;
  onRequestEdit: () => void;
  onUnlock: () => void;
  onRejectEditRequest: () => void;
  onRelock: () => void;
  onDelete: () => void;
};

function SubmittedBudgetActionsMenu({
  budget,
  permissions,
  handlers,
  actionLoading,
  deleteLoadingId,
  isEditing,
}: {
  budget: ServerBudget;
  permissions: SubmittedBudgetPermissions;
  handlers: SubmittedBudgetActionHandlers;
  actionLoading: string | null;
  deleteLoadingId: string | null;
  isEditing: boolean;
}) {
  const {
    showPreview,
    showEdit,
    canCommitteeApprove,
    canFinalApprove,
    showReject,
    showRequestEdit,
    showUnlock,
    showRejectEditRequest,
    showRelock,
    showDelete,
  } = permissions;

  const hasActions =
    showPreview ||
    showEdit ||
    canCommitteeApprove ||
    canFinalApprove ||
    showReject ||
    showRequestEdit ||
    showUnlock ||
    showRejectEditRequest ||
    showRelock ||
    showDelete;

  if (!hasActions) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const committeeLoading = actionLoading === `${budget.id}:committee`;
  const finalLoading = actionLoading === `${budget.id}:final`;
  const unlockLoading = actionLoading === `${budget.id}:unlock`;
  const rejectEditLoading = actionLoading === `${budget.id}:reject-edit`;
  const relockLoading = actionLoading === `${budget.id}:relock`;
  const deleteLoading = deleteLoadingId === budget.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Actions for ${budget.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-background border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {showPreview && (
          <DropdownMenuItem onClick={handlers.onView}>
            <Eye className="size-4" />
            View Budget
          </DropdownMenuItem>
        )}
        {showEdit && (
          <DropdownMenuItem onClick={handlers.onEdit} disabled={isEditing}>
            <Pencil className="size-4" />
            {isEditing ? "Editing…" : "Edit"}
          </DropdownMenuItem>
        )}
        {(canCommitteeApprove || canFinalApprove) && (
          <>
            {(showPreview || showEdit) && <DropdownMenuSeparator />}
            {canCommitteeApprove && (
              <DropdownMenuItem
                onClick={handlers.onCommitteeApprove}
                disabled={committeeLoading}
              >
                <CheckCircle2 className="size-4" />
                Committee Approve
              </DropdownMenuItem>
            )}
            {canFinalApprove && (
              <DropdownMenuItem
                onClick={handlers.onFinalApprove}
                disabled={finalLoading}
              >
                <CheckCircle2 className="size-4" />
                Final Approve
              </DropdownMenuItem>
            )}
          </>
        )}
        {showReject && (
          <DropdownMenuItem onClick={handlers.onReject}>
            <XCircle className="size-4" />
            Reject
          </DropdownMenuItem>
        )}
        {showRequestEdit && (
          <DropdownMenuItem onClick={handlers.onRequestEdit}>
            <Lock className="size-4" />
            Request Edit Access
          </DropdownMenuItem>
        )}
        {showUnlock && (
          <DropdownMenuItem
            onClick={handlers.onUnlock}
            disabled={unlockLoading}
          >
            <Unlock className="size-4" />
            {budget.editUnlockStatus === "PENDING"
              ? "Approve Edit Request"
              : "Unlock for Editing"}
          </DropdownMenuItem>
        )}
        {showRejectEditRequest && (
          <DropdownMenuItem
            onClick={handlers.onRejectEditRequest}
            disabled={rejectEditLoading}
          >
            <XCircle className="size-4" />
            Reject Edit Request
          </DropdownMenuItem>
        )}
        {showRelock && (
          <DropdownMenuItem
            onClick={handlers.onRelock}
            disabled={relockLoading}
          >
            <Lock className="size-4" />
            Re-lock
          </DropdownMenuItem>
        )}
        {showDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handlers.onDelete}
              disabled={deleteLoading}
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <Trash2 className="size-4" />
              {deleteLoading ? "Deleting…" : "Delete"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubmittedBudgetStatusBadges({ budget }: { budget: ServerBudget }) {
  const statusMeta = budgetStatusBadge(budget);
  const unlockMeta =
    budget.editUnlockStatus !== "NONE"
      ? BUDGET_EDIT_UNLOCK_LABELS[budget.editUnlockStatus]
      : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
      {unlockMeta?.label && (
        <Badge variant={unlockMeta.variant}>{unlockMeta.label}</Badge>
      )}
      {(budget.isLocked ||
        (budget.status === "REVIEW" &&
          budget.editUnlockStatus !== "GRANTED")) && (
        <Badge variant="outline" className="gap-1">
          <Lock className="size-3" />
          Locked
        </Badge>
      )}
    </div>
  );
}

function SubmittedBudgetInlineForms({
  budget,
  effectiveAccess,
  canFinalApproveFromDraft,
  isRejecting,
  isRequestingEdit,
  rejectReason,
  editRequestNote,
  actionLoading,
  onRejectReasonChange,
  onEditRequestNoteChange,
  onConfirmReject,
  onCancelReject,
  onConfirmEditRequest,
  onCancelEditRequest,
}: {
  budget: ServerBudget;
  effectiveAccess?: AccessInfo;
  canFinalApproveFromDraft: (budget: ServerBudget) => boolean;
  isRejecting: boolean;
  isRequestingEdit: boolean;
  rejectReason: string;
  editRequestNote: string;
  actionLoading: string | null;
  onRejectReasonChange: (value: string) => void;
  onEditRequestNoteChange: (value: string) => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
  onConfirmEditRequest: () => void;
  onCancelEditRequest: () => void;
}) {
  return (
    <>
      {budget.editUnlockStatus === "PENDING" &&
        budget.editUnlockRequestNote &&
        (effectiveAccess?.isChair || effectiveAccess?.isSuperAdmin) && (
          <p className="mt-2 text-xs text-amber-800">
            Edit request: {budget.editUnlockRequestNote}
          </p>
        )}

      {budget.status === "REJECTED" && budget.rejectionNote && (
        <p className="mt-2 text-xs text-red-700">
          Rejection reason: {budget.rejectionNote}
        </p>
      )}
      {budget.status === "REJECTED" &&
        isBudgetOwner(budget, effectiveAccess) &&
        !budget.rejectionNote && (
          <p className="mt-2 text-xs text-red-700">
            Your budget was rejected during review.
          </p>
        )}

      {isRejecting && (
        <div
          className="mt-2 flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            className="h-8 min-w-48 flex-1 text-sm"
            placeholder="Rejection reason (required)"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={
              !rejectReason.trim() || actionLoading === `${budget.id}:reject`
            }
            onClick={onConfirmReject}
          >
            Confirm Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelReject}>
            Cancel
          </Button>
        </div>
      )}

      {isRequestingEdit && (
        <div
          className="mt-2 flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            className="h-8 min-w-48 flex-1 text-sm"
            placeholder="Why do you need to edit? (required)"
            value={editRequestNote}
            onChange={(e) => onEditRequestNoteChange(e.target.value)}
          />
          <Button
            size="sm"
            disabled={
              !editRequestNote.trim() ||
              actionLoading === `${budget.id}:request-edit`
            }
            onClick={onConfirmEditRequest}
          >
            Submit Request
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEditRequest}>
            Cancel
          </Button>
        </div>
      )}

      {budget.status === "DRAFT" &&
        (effectiveAccess?.isChair || effectiveAccess?.isSuperAdmin) &&
        !canFinalApproveFromDraft(budget) && (
          <p className="mt-2 text-xs text-amber-700">
            Committee chair approval is required before final approval.
          </p>
        )}
    </>
  );
}

function CombinedExportSummary({
  budgets,
  combinedGrandTotal,
  exportComment,
  forPrint = false,
}: {
  budgets: ExportBudgetEntry[];
  combinedGrandTotal: number;
  exportComment: string;
  forPrint?: boolean;
}) {
  return (
    <div
      className={
        forPrint
          ? ""
          : "rounded-lg border border-[#C8A061]/40 bg-[#C8A061]/5 p-4"
      }
      style={
        forPrint
          ? {
              marginTop: 24,
              padding: "16px 20px",
              border: "1.5px solid #C8A061",
              borderRadius: 8,
            }
          : undefined
      }
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: "#002868" }}>
        Combined Export Summary
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>
        {budgets.length} budget{budgets.length === 1 ? "" : "s"} selected
      </div>
      <ul
        style={{ marginTop: 10, paddingLeft: 18, fontSize: 11, color: "#444" }}
      >
        {budgets.map((entry) => (
          <li key={entry.key} style={{ marginBottom: 4 }}>
            {entry.draft.title || "Untitled Budget"} — {fmtRmb(entry.total)}
          </li>
        ))}
      </ul>
      {exportComment.trim() && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            border: "1px solid #d9dfeb",
            borderRadius: 8,
            fontSize: 10.5,
            color: "#444",
            fontStyle: "italic",
            whiteSpace: "pre-wrap",
          }}
        >
          {exportComment}
        </div>
      )}
      <div
        style={{
          marginTop: 14,
          borderTop: "1.5px solid #002868",
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 11, color: "#666" }}>Combined grand total</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#C8A061" }}>
          {fmtRmb(combinedGrandTotal)}
        </div>
      </div>
    </div>
  );
}

function BudgetPreviewModal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center budget-no-print"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 flex max-h-[92vh] min-h-0 w-[96vw] max-w-6xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="size-4 text-muted-foreground" />
            {title}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-4">
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetDocumentPreview({
  draft,
  grandTotal,
  confInfo,
  members,
  preparedByName,
  signatoryDraft,
  forPrint = false,
  instanceKey,
}: {
  draft: BudgetDraft;
  grandTotal: number;
  confInfo: ConferenceEventInfo | null;
  members: MemberOption[];
  preparedByName: string;
  signatoryDraft: SignatoryDraft;
  forPrint?: boolean;
  instanceKey?: string;
}) {
  const documentKey = instanceKey ?? draft.id;
  const createdAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryLabel =
    BUDGET_CATEGORIES[draft.category]?.label ?? draft.category ?? "General";
  const itemsHeading = draft.itemsHeading?.trim() || "Line Item Breakdown";
  const nonEmptyItems = draft.items.filter((item) => item.name.trim());
  const rows: Record<string, unknown>[] =
    nonEmptyItems.length > 0
      ? nonEmptyItems.map((item) => ({
          no: item.no,
          item: item.name,
          qty: item.qty,
          unit: unitLabel(item),
          unitPrice: fmtRmb(item.unitPrice),
          total: fmtRmb(calcItemTotal(item.qty, item.unitPrice)),
        }))
      : [
          {
            no: "—",
            item: "No line items yet",
            qty: "—",
            unit: "—",
            unitPrice: "—",
            total: "—",
          },
        ];
  // ── Dynamic pagination ─────────────────────────────────────────────────
  // Page-1 overhead: title+date block (~62px) + optional notes box.
  // Trailing overhead: grand total line + signature block (if sigs present).
  // Continuation pages: "Continued…" label (~32px).
  const notesH = estimateTextBlockH(draft.notes, 70, 50, 15);
  const rowChunks = computePageChunks(rows, {
    page1OverheadPx: 62 + notesH,
    trailingPx: 42 + (hasSignatories(signatoryDraft) ? 140 : 0),
    contHeaderPx: 32,
  });

  const sidebarMembers = normalizeSidebarMembers(members);
  const normalizedConfInfo = normalizeConfInfo(confInfo);

  return rowChunks.map((pageRows, pageIndex) => (
    <DocumentLayout
      key={`${documentKey}-page-${pageIndex}`}
      forPrint={forPrint}
      confInfo={normalizedConfInfo}
      officeLabel="Office of the Finance Secretary"
      members={sidebarMembers}
      className={pageIndex > 0 && !forPrint ? "mt-4" : ""}
      pageNumber={pageIndex + 1}
      totalPages={rowChunks.length}
    >
      {pageIndex === 0 ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#002868" }}>
                {draft.title?.trim() || "Budget Proposal"}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: "#555" }}>
                Category: {categoryLabel}
              </div>
              <div style={{ marginTop: 2, fontSize: 10, color: "#555" }}>
                Date: {createdAt}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, color: "#555" }}>
              <div>Prepared By:</div>
              <div style={{ fontWeight: 700, color: "#002868", marginTop: 2 }}>
                {preparedByName || "Pending selection"}
              </div>
            </div>
          </div>

          {draft.notes.trim() && (
            <div
              style={{
                marginTop: 14,
                marginBottom: 14,
                padding: "10px 12px",
                border: "1px solid #d9dfeb",
                borderRadius: 8,
                fontSize: 10.5,
                color: "#444",
                fontStyle: "italic",
                whiteSpace: "pre-wrap",
              }}
            >
              {draft.notes}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 11, color: "#777", marginBottom: 12 }}>
          Continued Budget Items (Page {pageIndex + 1})
        </div>
      )}

      <DocumentTable
        caption={pageIndex === 0 ? itemsHeading : `${itemsHeading} (cont.)`}
        columns={[
          { key: "no", label: "#", width: 8, align: "center" },
          { key: "item", label: "Item", width: 34 },
          { key: "qty", label: "Qty", width: 10, align: "center" },
          { key: "unit", label: "Unit", width: 14, align: "center" },
          {
            key: "unitPrice",
            label: "Unit Price (¥)",
            width: 17,
            align: "right",
          },
          { key: "total", label: "Total (¥)", width: 17, align: "right" },
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
              {nonEmptyItems.length} line item
              {nonEmptyItems.length === 1 ? "" : "s"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#C8A061" }}>
              GRAND TOTAL: {fmtRmb(grandTotal)}
            </div>
          </div>
          <DocumentSignatureBlock draft={signatoryDraft} />
        </>
      )}
    </DocumentLayout>
  ));
}

// ── Component ────────────────────────────────────────────────────────────────

export function BudgetShell({ accessInfo }: { accessInfo?: AccessInfo }) {
  const [clientAccessFlags, setClientAccessFlags] = useState<{
    isManager: boolean;
    isSuperAdmin: boolean;
  } | null>(null);
  const effectiveAccess = useMemo(
    () => mergeBudgetAccessInfo(accessInfo, clientAccessFlags ?? undefined),
    [accessInfo, clientAccessFlags],
  );
  const [drafts, setDrafts] = useState<BudgetDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<BudgetDraft>(newDraft());
  const [showList, setShowList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [confId, setConfId] = useState("");
  const [confInfo, setConfInfo] = useState<ConferenceEventInfo | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [creatorMemberId, setCreatorMemberId] = useState("");
  const [signatoryDraft, setSignatoryDraft] = useState<SignatoryDraft>(
    createDefaultSignatoryDraft(),
  );
  const [previewZoom, setPreviewZoom] = useState(72);
  const [serverBudgets, setServerBudgets] = useState<ServerBudget[]>([]);
  const [loadingServer, setLoadingServer] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedExportKeys, setSelectedExportKeys] = useState<string[]>([]);
  const [exportComment, setExportComment] = useState("");
  const [showCombinedExportPreview, setShowCombinedExportPreview] =
    useState(false);
  const [previewServerBudget, setPreviewServerBudget] =
    useState<ServerBudget | null>(null);
  const [rejectingBudgetId, setRejectingBudgetId] = useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [editingServerBudgetId, setEditingServerBudgetId] = useState<
    string | null
  >(null);
  const [selectedServerBudgetId, setSelectedServerBudgetId] = useState<
    string | null
  >(null);
  const [submittedBudgetViewMode, setSubmittedBudgetViewMode] =
    useState<SubmittedBudgetViewMode>("list");
  const [editRequestBudgetId, setEditRequestBudgetId] = useState<string | null>(
    null,
  );
  const [editRequestNote, setEditRequestNote] = useState("");
  const [pdfExporting, setPdfExporting] = useState(false);
  const [printPortalReady, setPrintPortalReady] = useState(false);
  const [budgetProofFiles, setBudgetProofFiles] = useState<File[]>([]);
  const [budgetProofPreviews, setBudgetProofPreviews] = useState<string[]>([]);
  const [budgetProofValidationFeedback, setBudgetProofValidationFeedback] =
    useState<string | null>(null);
  const [budgetUploadStatus, setBudgetUploadStatus] = useState<{
    currentFile: number;
    totalFiles: number;
    fileName: string;
    percent: number;
  } | null>(null);
  const budgetFileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadDrafts();
    setDrafts(stored);
    if (stored.length > 0) {
      setActiveDraft(stored[0]);
    }
    setSubmittedBudgetViewMode(loadSubmittedViewMode());
  }, []);

  useEffect(() => {
    setPrintPortalReady(true);
  }, []);

  useEffect(() => {
    const onAfterPrint = () => {
      document.body.removeAttribute("data-print-mode");
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  const handleBudgetFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      setBudgetProofValidationFeedback(
        `Some files were skipped: ${invalidMessages.slice(0, 2).join(" | ")}`,
      );
      setError(null);
    } else {
      setBudgetProofValidationFeedback(null);
      setError(null);
    }

    setBudgetProofFiles((prev) => [...prev, ...valid]);
    valid.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () =>
          setBudgetProofPreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      } else {
        setBudgetProofPreviews((prev) => [...prev, ""]);
      }
    });

    e.target.value = "";
  };

  useEffect(() => {
    let mounted = true;
    void resolveConferenceAccessFlags()
      .then((flags) => {
        if (!mounted) return;
        setClientAccessFlags({
          isManager: flags.isManager,
          isSuperAdmin: flags.isSuperAdmin,
        });
      })
      .catch(() => {
        // Keep server-provided access when client lookup fails.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const refreshConferenceBudgets = useCallback(async (conferenceId: string) => {
    const res = await fetch(`/api/conf/${conferenceId}/budgets`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to load submitted budgets");
    }
    const payload = (await res.json()) as ServerBudget[];
    setServerBudgets(payload);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingServer(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);

        const [membersRes, bookletRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/members`, { cache: "no-store" }),
          fetch(`/api/conf/${conf.id}/booklet/data`, { cache: "no-store" }),
          refreshConferenceBudgets(conf.id),
        ]);

        if (membersRes.ok) {
          const memberPayload = (await membersRes.json()) as MemberOption[];
          setMembers(memberPayload);
          if (effectiveAccess?.memberId) {
            setCreatorMemberId(effectiveAccess.memberId);
          } else if (memberPayload.length > 0) {
            setCreatorMemberId(memberPayload[0].id);
          }
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
        setError(e instanceof Error ? e.message : "Failed to load budget data");
      } finally {
        setLoadingServer(false);
      }
    };

    void init();
  }, [effectiveAccess?.memberId, refreshConferenceBudgets]);

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
    setEditingServerBudgetId(null);
    setSelectedServerBudgetId(null);
    setShowList(false);
  }, []);

  const handleLoadDraft = useCallback((draft: BudgetDraft) => {
    setActiveDraft(draft);
    setEditingServerBudgetId(null);
    setSelectedServerBudgetId(null);
    setShowList(false);
  }, []);

  const handleEditServerBudget = useCallback((budget: ServerBudget) => {
    setActiveDraft(serverBudgetToDraft(budget));
    setCreatorMemberId(budget.creator.id);
    setEditingServerBudgetId(budget.id);
    setSelectedServerBudgetId(budget.id);
    setShowList(false);
    setNotice(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectServerBudget = useCallback(
    (budget: ServerBudget) => {
      setSelectedServerBudgetId(budget.id);
      if (canEditBudget(budget, effectiveAccess)) {
        handleEditServerBudget(budget);
      }
    },
    [effectiveAccess, handleEditServerBudget],
  );

  const handleCancelServerEdit = useCallback(() => {
    setEditingServerBudgetId(null);
    setSelectedServerBudgetId(null);
    setActiveDraft(newDraft());
  }, []);

  const handleSubmittedViewModeChange = useCallback(
    (mode: SubmittedBudgetViewMode) => {
      setSubmittedBudgetViewMode(mode);
      saveSubmittedViewMode(mode);
    },
    [],
  );

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
  const setItemsHeading = (v: string) =>
    setActiveDraft((d) => ({ ...d, itemsHeading: v }));

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
  const preparedByName =
    members.find((member) => member.id === creatorMemberId)?.name ?? "";
  const creatorCommitteeScope = useMemo(() => {
    const selected = members.find((member) => member.id === creatorMemberId);
    return selected?.committeeScope?.trim() || null;
  }, [creatorMemberId, members]);
  const documentMembers = useMemo(() => {
    if (!members.length) return [];
    if (!creatorCommitteeScope) return members;
    const scopeKey = creatorCommitteeScope.toLowerCase();
    const scoped = members.filter(
      (member) =>
        (member.committeeScope || "").trim().toLowerCase() === scopeKey,
    );
    return scoped.length > 0 ? scoped : members;
  }, [creatorCommitteeScope, members]);

  const selectedExportBudgets = useMemo((): ExportBudgetEntry[] => {
    const entries: ExportBudgetEntry[] = [];
    for (const key of selectedExportKeys) {
      if (key.startsWith("draft:")) {
        const draft = drafts.find((d) => draftExportKey(d.id) === key);
        if (draft) {
          entries.push({
            key,
            draft,
            total: calcBudgetTotal(draft.items),
            preparedByName,
          });
        }
      } else if (key.startsWith("server:")) {
        const budget = serverBudgets.find((b) => serverExportKey(b.id) === key);
        if (budget && canSelectBudgetForExport(budget, effectiveAccess)) {
          const draft = serverBudgetToDraft(budget);
          entries.push({
            key,
            draft,
            total: calcBudgetTotal(draft.items),
            preparedByName: budget.creator.name,
          });
        }
      }
    }
    return entries;
  }, [
    drafts,
    effectiveAccess,
    preparedByName,
    selectedExportKeys,
    serverBudgets,
  ]);

  const combinedExportGrandTotal = useMemo(
    () => selectedExportBudgets.reduce((sum, entry) => sum + entry.total, 0),
    [selectedExportBudgets],
  );

  const allDraftsSelected =
    drafts.length > 0 &&
    drafts.every((draft) =>
      selectedExportKeys.includes(draftExportKey(draft.id)),
    );

  const toggleExportKey = useCallback((key: string) => {
    setSelectedExportKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const toggleSelectAllDrafts = useCallback(() => {
    setSelectedExportKeys((prev) => {
      const draftKeys = drafts.map((d) => draftExportKey(d.id));
      const allSelected = draftKeys.every((key) => prev.includes(key));
      if (allSelected) {
        return prev.filter((key) => !draftKeys.includes(key));
      }
      return [...new Set([...prev, ...draftKeys])];
    });
  }, [drafts]);

  const clearExportSelection = useCallback(() => {
    setSelectedExportKeys([]);
  }, []);

  const handleCombinedExportCsv = useCallback(() => {
    if (selectedExportBudgets.length === 0) return;
    const csv = multiBudgetToCsv(
      selectedExportBudgets.map((entry) => ({
        title: entry.draft.title || "Budget",
        items: entry.draft.items.map((item, idx) => ({
          no: item.no || idx + 1,
          name: item.name,
          desc: null,
          qty: item.qty,
          unit: unitLabel(item),
          unitPrice: item.unitPrice,
          notes: item.notes || null,
        })),
      })),
      7.2,
      exportComment,
    );
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combined_budgets_${selectedExportBudgets.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportComment, selectedExportBudgets]);

  const triggerPrint = useCallback((mode: "single" | "combined") => {
    document.body.setAttribute("data-print-mode", mode);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, []);

  const handleCombinedPrint = useCallback(() => {
    if (selectedExportBudgets.length === 0) return;
    setShowCombinedExportPreview(false);
    triggerPrint("combined");
  }, [selectedExportBudgets.length, triggerPrint]);

  const handleSinglePrint = useCallback(() => {
    triggerPrint("single");
  }, [triggerPrint]);

  const handleExportPdf = useCallback(
    async (mode: "single" | "combined") => {
      if (pdfExporting) return;
      if (mode === "combined" && selectedExportBudgets.length === 0) return;

      setPdfExporting(true);
      setShowCombinedExportPreview(false);
      document.body.setAttribute("data-print-mode", mode);

      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

        const { exportToPDF } =
          await import("@/lib/creative/documents/pdfExport");
        const filename =
          mode === "combined"
            ? `combined_budgets_${selectedExportBudgets.length}`
            : (activeDraft.title || "budget").replace(/\s+/g, "_");

        await exportToPDF("budget-print-root", filename, undefined, {
          pageSelector: ".document-page, .combined-export-summary-page",
          pageWrapperSelector: null,
          mode: "download",
          canvasScale: 2,
          jpegQuality: 0.85,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "PDF export failed");
      } finally {
        document.body.removeAttribute("data-print-mode");
        setPdfExporting(false);
      }
    },
    [activeDraft.title, pdfExporting, selectedExportBudgets.length],
  );

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

  const handleSubmitToConference = useCallback(async () => {
    if (!confId || !creatorMemberId || submitLoading) return;
    if (!activeDraft.title.trim()) {
      setError("Budget title is required before submission.");
      return;
    }
    const validItems = activeDraft.items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      setError("Add at least one named line item before submission.");
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        title: activeDraft.title.trim(),
        category: activeDraft.category,
        notes: activeDraft.notes.trim() || null,
        items: validItems.map((item) => ({
          name: item.name.trim(),
          qty: item.qty,
          unit: unitLabel(item),
          unitPrice: item.unitPrice,
          notes: item.notes.trim() || null,
        })),
      };

      const isUpdate = Boolean(editingServerBudgetId);
      const res = await fetch(
        isUpdate
          ? `/api/conf/${confId}/budgets/${editingServerBudgetId}`
          : `/api/conf/${confId}/budgets`,
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isUpdate
              ? payload
              : {
                  ...payload,
                  createdBy: creatorMemberId,
                },
          ),
        },
      );
      if (!res.ok) {
        const responsePayload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          responsePayload.error ??
            (isUpdate ? "Failed to update budget" : "Failed to submit budget"),
        );
      }

      await refreshConferenceBudgets(confId);
      if (isUpdate) {
        setNotice("Budget updated successfully.");
      } else {
        setNotice("Budget submitted successfully.");
        setEditingServerBudgetId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit budget");
    } finally {
      setSubmitLoading(false);
    }
  }, [
    activeDraft.category,
    activeDraft.items,
    activeDraft.notes,
    activeDraft.title,
    confId,
    creatorMemberId,
    editingServerBudgetId,
    refreshConferenceBudgets,
    submitLoading,
  ]);

  const canFinalApproveFromDraft = useCallback((budget: ServerBudget) => {
    if (budget.status !== "DRAFT") return false;
    if (!budget.creator.committeeScope) return true;
    return Boolean(budget.creator.canApprovePayments);
  }, []);

  const handleBudgetAction = useCallback(
    async (budgetId: string, action: "committee" | "final") => {
      if (!confId || actionLoading) return;
      setActionLoading(`${budgetId}:${action}`);
      setError(null);
      setNotice(null);
      try {
        const endpoint =
          action === "committee"
            ? `/api/conf/${confId}/budgets/${budgetId}/approve`
            : `/api/conf/${confId}/budgets/${budgetId}/final-approve`;
        const res = await fetch(endpoint, { method: "POST" });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Budget action failed");
        }
        await refreshConferenceBudgets(confId);
        setNotice(
          action === "committee"
            ? "Budget committee-approved."
            : "Budget final-approved.",
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Budget action failed");
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, confId, refreshConferenceBudgets],
  );

  const handleRejectBudget = useCallback(
    async (budgetId: string) => {
      if (!confId || !rejectReason.trim() || actionLoading) return;
      setActionLoading(`${budgetId}:reject`);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/conf/${confId}/budgets/${budgetId}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: rejectReason.trim() }),
          },
        );
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to reject budget");
        }
        await refreshConferenceBudgets(confId);
        setRejectingBudgetId(null);
        setRejectReason("");
        setNotice("Budget rejected.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reject budget");
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, confId, refreshConferenceBudgets, rejectReason],
  );

  const handleDeleteBudget = useCallback(
    async (budgetId: string, title: string) => {
      if (!confId || deleteLoadingId) return;
      const confirmed = window.confirm(
        `Delete "${title}"? This action cannot be undone.`,
      );
      if (!confirmed) return;

      setDeleteLoadingId(budgetId);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(`/api/conf/${confId}/budgets/${budgetId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to delete budget");
        }
        await refreshConferenceBudgets(confId);
        setSelectedExportKeys((prev) =>
          prev.filter((key) => key !== serverExportKey(budgetId)),
        );
        if (previewServerBudget?.id === budgetId) {
          setPreviewServerBudget(null);
        }
        if (editingServerBudgetId === budgetId) {
          setEditingServerBudgetId(null);
          setSelectedServerBudgetId(null);
          setActiveDraft(newDraft());
        } else if (selectedServerBudgetId === budgetId) {
          setSelectedServerBudgetId(null);
        }
        setNotice("Budget deleted.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete budget");
      } finally {
        setDeleteLoadingId(null);
      }
    },
    [
      confId,
      deleteLoadingId,
      editingServerBudgetId,
      previewServerBudget?.id,
      refreshConferenceBudgets,
      selectedServerBudgetId,
    ],
  );

  const handleRequestEditAccess = useCallback(
    async (budgetId: string) => {
      if (!confId || !editRequestNote.trim() || actionLoading) return;
      setActionLoading(`${budgetId}:request-edit`);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/conf/${confId}/budgets/${budgetId}/request-edit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: editRequestNote.trim() }),
          },
        );
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to request edit access");
        }
        await refreshConferenceBudgets(confId);
        setEditRequestBudgetId(null);
        setEditRequestNote("");
        setNotice("Edit access request submitted.");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to request edit access",
        );
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, confId, editRequestNote, refreshConferenceBudgets],
  );

  const handleUnlockBudget = useCallback(
    async (budgetId: string) => {
      if (!confId || actionLoading) return;
      setActionLoading(`${budgetId}:unlock`);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/conf/${confId}/budgets/${budgetId}/unlock-edit`,
          { method: "POST" },
        );
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to unlock budget");
        }
        await refreshConferenceBudgets(confId);
        setNotice("Budget unlocked for editing.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to unlock budget");
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, confId, refreshConferenceBudgets],
  );

  const handleRejectEditRequest = useCallback(
    async (budgetId: string) => {
      if (!confId || actionLoading) return;
      setActionLoading(`${budgetId}:reject-edit`);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/conf/${confId}/budgets/${budgetId}/reject-edit-request`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject" }),
          },
        );
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to reject edit request");
        }
        await refreshConferenceBudgets(confId);
        setNotice("Edit request rejected.");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to reject edit request",
        );
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, confId, refreshConferenceBudgets],
  );

  const handleRelockBudget = useCallback(
    async (budgetId: string) => {
      if (!confId || actionLoading) return;
      setActionLoading(`${budgetId}:relock`);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/conf/${confId}/budgets/${budgetId}/reject-edit-request`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "relock" }),
          },
        );
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to re-lock budget");
        }
        await refreshConferenceBudgets(confId);
        setNotice("Budget re-locked.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to re-lock budget");
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, confId, refreshConferenceBudgets],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Off-screen positioning for screen; @media print rules live in portaled root */}
      <style>{`
        #budget-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          pointer-events: none;
          z-index: -1;
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
            onClick={handleSinglePrint}
            title="Print or save as PDF"
          >
            <Printer className="size-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pdfExporting}
            onClick={() => void handleExportPdf("single")}
            title="Download PDF"
          >
            <Download className="size-4" />
            {pdfExporting ? "Exporting…" : "Export PDF"}
          </Button>
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

      {editingServerBudgetId && (
        <div className="budget-no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#002868]/30 bg-[#002868]/5 px-4 py-3">
          <div className="text-sm">
            <span className="font-medium text-[#002868]">
              Editing: {activeDraft.title?.trim() || "Untitled Budget"}
            </span>
            <span className="ml-2 text-muted-foreground">
              Changes save back to the server when you click Save Changes.
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleCancelServerEdit}>
            <X className="size-3.5" />
            Cancel Edit
          </Button>
        </div>
      )}

      {selectedServerBudgetId &&
        !editingServerBudgetId &&
        (() => {
          const selected = serverBudgets.find(
            (b) => b.id === selectedServerBudgetId,
          );
          if (!selected) return null;
          return (
            <div className="budget-no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C8A061]/40 bg-[#C8A061]/5 px-4 py-3">
              <div className="text-sm">
                <span className="font-medium text-[#002868]">
                  Selected: {selected.title}
                </span>
                <span className="ml-2 text-muted-foreground">
                  Use the actions menu to view or manage this budget.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedServerBudgetId(null)}
              >
                <X className="size-3.5" />
                Clear Selection
              </Button>
            </div>
          );
        })()}

      {/* Drafts list */}
      {showList && (
        <Card className="budget-no-print border-[#C8A061]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Saved Drafts</CardTitle>
            <CardDescription className="text-xs">
              Click a draft to load it. Select drafts to include in a combined
              export.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No saved drafts yet. Changes auto-save as you type.
              </p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-dashed px-3 py-2 text-xs">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                    onClick={toggleSelectAllDrafts}
                  >
                    {allDraftsSelected ? (
                      <CheckSquare className="size-3.5" />
                    ) : (
                      <Square className="size-3.5" />
                    )}
                    Select all drafts
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearExportSelection}
                    disabled={selectedExportKeys.length === 0}
                  >
                    Clear selection
                  </Button>
                  <span className="text-muted-foreground">
                    {selectedExportKeys.length} selected for export
                  </span>
                </div>
                <div className="space-y-2">
                  {drafts.map((d) => {
                    const exportKey = draftExportKey(d.id);
                    const isSelected = selectedExportKeys.includes(exportKey);
                    return (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                          d.id === activeDraft.id
                            ? "border-[#C8A061]/50 bg-[#C8A061]/5"
                            : "hover:bg-muted/50 cursor-pointer"
                        }`}
                        onClick={() => handleLoadDraft(d)}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="mt-0.5 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExportKey(exportKey);
                            }}
                            title={
                              isSelected
                                ? "Deselect for export"
                                : "Select for export"
                            }
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-[#C8A061]" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </button>
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
                              {BUDGET_CATEGORIES[d.category]?.label ??
                                d.category}{" "}
                              · {d.items.length} items ·{" "}
                              {fmtRmb(calcBudgetTotal(d.items))} · saved{" "}
                              {new Date(d.savedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
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
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedExportKeys.length > 0 && (
        <Card className="budget-no-print border-[#C8A061]/30">
          <CardHeader>
            <CardTitle className="text-base">Combined Export</CardTitle>
            <CardDescription>
              Preview and download {selectedExportBudgets.length} selected
              budget{selectedExportBudgets.length === 1 ? "" : "s"} · Combined
              total:{" "}
              <span className="font-semibold text-foreground">
                {fmtDual(combinedExportGrandTotal)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportComment">Export comment (optional)</Label>
              <Textarea
                id="exportComment"
                placeholder="Notes to include on the combined export..."
                value={exportComment}
                onChange={(e) => setExportComment(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCombinedExportPreview(true)}
                disabled={selectedExportBudgets.length === 0}
              >
                <Eye className="size-4" />
                Preview Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCombinedExportCsv}
                disabled={selectedExportBudgets.length === 0}
              >
                <Download className="size-4" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCombinedPrint}
                disabled={selectedExportBudgets.length === 0}
              >
                <Printer className="size-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedExportBudgets.length === 0 || pdfExporting}
                onClick={() => void handleExportPdf("combined")}
              >
                <Download className="size-4" />
                {pdfExporting ? "Exporting…" : "Export PDF"}
              </Button>
            </div>
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="itemsHeading">
              Line Items Section Title (Document)
            </Label>
            <Input
              id="itemsHeading"
              placeholder="e.g. Day 1 Budget Breakdown"
              value={activeDraft.itemsHeading ?? ""}
              onChange={(e) => setItemsHeading(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prepared By (Committee Member)</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={creatorMemberId}
              onChange={(e) => setCreatorMemberId(e.target.value)}
              disabled={
                Boolean(effectiveAccess?.memberId) &&
                !effectiveAccess?.isSuperAdmin
              }
            >
              <option value="">Select member profile...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.committeeScope ? ` (${member.committeeScope})` : ""}
                </option>
              ))}
            </select>
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

      <Card className="budget-no-print border-[#C8A061]/30">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Live Budget Document</CardTitle>
            <CardDescription>
              This is the full letter-style budget page. It updates as you type.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
              <BudgetDocumentPreview
                draft={activeDraft}
                grandTotal={grandTotal}
                confInfo={confInfo}
                members={documentMembers}
                preparedByName={preparedByName}
                signatoryDraft={signatoryDraft}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="budget-no-print border-[#C8A061]/30">
        <CardHeader>
          <CardTitle className="text-base">Signatories</CardTitle>
          <CardDescription>
            Uses the same signature workflow as the letters page.
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

      <Card className="budget-no-print border-[#C8A061]/30">
        <CardHeader>
          <div>
            <CardTitle className="text-base">Receipts / Attachments</CardTitle>
            <CardDescription>
              Upload screenshots, receipt photos, or supporting attachments for
              inclusion in the budget export.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={budgetFileInputRef}
            type="file"
            accept={delegateDocumentAcceptAttribute("passport")}
            multiple
            onChange={handleBudgetFileChange}
            className="hidden"
          />
          <div
            className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 transition-colors hover:border-[#C8A061]/50"
            onClick={() => budgetFileInputRef.current?.click()}
          >
            <FolderOpen className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Screenshots or receipts: {DELEGATE_TRAVEL_DOC_EXTENSIONS_LABEL}.
              Maximum {CONFERENCE_UPLOAD_MAX_SIZE_LABEL} per file.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {DELEGATE_UPLOAD_CONVERSION_TIP}
            </p>
          </div>

          {budgetProofValidationFeedback && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 mt-2">
              {budgetProofValidationFeedback}
            </div>
          )}

          {budgetUploadStatus && (
            <div className="space-y-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 mt-2">
              <div className="flex items-center justify-between gap-2 text-xs text-blue-700 dark:text-blue-300">
                <span className="truncate">
                  Uploading {budgetUploadStatus.currentFile}/
                  {budgetUploadStatus.totalFiles}: {budgetUploadStatus.fileName}
                </span>
                <span>{budgetUploadStatus.percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/40 dark:bg-blue-950/40">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${budgetUploadStatus.percent}%` }}
                />
              </div>
            </div>
          )}

          {budgetProofPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {budgetProofPreviews.map((preview, idx) => (
                <div
                  key={idx}
                  className="relative h-28 w-28 overflow-hidden rounded-lg border bg-white"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt={`Receipt ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <FileSpreadsheet className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="budget-no-print border-[#C8A061]/30">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Submitted Budgets</CardTitle>
              <CardDescription>
                Committee review then conference chair final approval. Click a
                budget to edit (when permitted) or use the actions menu.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <Button
                type="button"
                variant={
                  submittedBudgetViewMode === "list" ? "secondary" : "ghost"
                }
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSubmittedViewModeChange("list")}
              >
                <List className="size-3.5" />
                List
              </Button>
              <Button
                type="button"
                variant={
                  submittedBudgetViewMode === "cards" ? "secondary" : "ghost"
                }
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSubmittedViewModeChange("cards")}
              >
                <LayoutGrid className="size-3.5" />
                Cards
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingServer ? (
            <p className="text-sm text-muted-foreground">
              Loading submitted budgets...
            </p>
          ) : serverBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No submitted budgets yet.
            </p>
          ) : submittedBudgetViewMode === "cards" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {serverBudgets.map((budget) => {
                const budgetTotal = calcBudgetTotal(
                  budget.items.map((item) => ({
                    id: item.id,
                    no: item.no,
                    name: item.name,
                    qty: item.qty,
                    unit: item.unit,
                    customUnit: "",
                    unitPrice: item.unitPrice,
                    notes: "",
                  })),
                );
                const permissions = getSubmittedBudgetPermissions(
                  budget,
                  effectiveAccess,
                  canFinalApproveFromDraft,
                );
                const isRejecting = rejectingBudgetId === budget.id;
                const isRequestingEdit = editRequestBudgetId === budget.id;
                const serverKey = serverExportKey(budget.id);
                const isExportSelected = selectedExportKeys.includes(serverKey);
                const isSelected =
                  selectedServerBudgetId === budget.id ||
                  editingServerBudgetId === budget.id;
                const isEditing = editingServerBudgetId === budget.id;
                const actionHandlers: SubmittedBudgetActionHandlers = {
                  onView: () => setPreviewServerBudget(budget),
                  onEdit: () => handleEditServerBudget(budget),
                  onCommitteeApprove: () =>
                    void handleBudgetAction(budget.id, "committee"),
                  onFinalApprove: () =>
                    void handleBudgetAction(budget.id, "final"),
                  onReject: () => {
                    setRejectingBudgetId(budget.id);
                    setRejectReason("");
                  },
                  onRequestEdit: () => {
                    setEditRequestBudgetId(budget.id);
                    setEditRequestNote("");
                  },
                  onUnlock: () => void handleUnlockBudget(budget.id),
                  onRejectEditRequest: () =>
                    void handleRejectEditRequest(budget.id),
                  onRelock: () => void handleRelockBudget(budget.id),
                  onDelete: () =>
                    void handleDeleteBudget(budget.id, budget.title),
                };

                return (
                  <div
                    key={budget.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex flex-col rounded-lg border p-4 transition-colors",
                      isSelected
                        ? "border-[#002868]/50 bg-[#002868]/5 ring-1 ring-[#002868]/20"
                        : budget.status === "REJECTED"
                          ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                          : "hover:border-[#C8A061]/40 hover:bg-muted/30",
                      permissions.showEdit && "cursor-pointer",
                    )}
                    onClick={() => handleSelectServerBudget(budget)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectServerBudget(budget);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        {permissions.canExport && (
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExportKey(serverKey);
                            }}
                            title={
                              isExportSelected
                                ? "Deselect for export"
                                : "Select for export"
                            }
                          >
                            {isExportSelected ? (
                              <CheckSquare className="size-4 text-[#C8A061]" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </button>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{budget.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {budget.creator.name}
                          </p>
                        </div>
                      </div>
                      <SubmittedBudgetActionsMenu
                        budget={budget}
                        permissions={permissions}
                        handlers={actionHandlers}
                        actionLoading={actionLoading}
                        deleteLoadingId={deleteLoadingId}
                        isEditing={isEditing}
                      />
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {BUDGET_CATEGORIES[budget.category]?.label ||
                            budget.category}
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {fmtRmb(budgetTotal)}
                        </span>
                      </div>
                      {budget.creator.committeeScope && (
                        <p className="truncate">
                          {budget.creator.committeeScope}
                        </p>
                      )}
                      <p>
                        {budget.items.length} item
                        {budget.items.length === 1 ? "" : "s"}
                        {budget.approvedAt &&
                          ` · approved ${new Date(budget.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </p>
                    </div>

                    <div className="mt-3">
                      <SubmittedBudgetStatusBadges budget={budget} />
                    </div>

                    {isEditing && (
                      <p className="mt-2 text-xs font-medium text-[#002868]">
                        Currently editing
                      </p>
                    )}

                    <SubmittedBudgetInlineForms
                      budget={budget}
                      effectiveAccess={effectiveAccess}
                      canFinalApproveFromDraft={canFinalApproveFromDraft}
                      isRejecting={isRejecting}
                      isRequestingEdit={isRequestingEdit}
                      rejectReason={rejectReason}
                      editRequestNote={editRequestNote}
                      actionLoading={actionLoading}
                      onRejectReasonChange={setRejectReason}
                      onEditRequestNoteChange={setEditRequestNote}
                      onConfirmReject={() => void handleRejectBudget(budget.id)}
                      onCancelReject={() => setRejectingBudgetId(null)}
                      onConfirmEditRequest={() =>
                        void handleRequestEditAccess(budget.id)
                      }
                      onCancelEditRequest={() => setEditRequestBudgetId(null)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            serverBudgets.map((budget) => {
              const budgetTotal = calcBudgetTotal(
                budget.items.map((item) => ({
                  id: item.id,
                  no: item.no,
                  name: item.name,
                  qty: item.qty,
                  unit: item.unit,
                  customUnit: "",
                  unitPrice: item.unitPrice,
                  notes: "",
                })),
              );
              const permissions = getSubmittedBudgetPermissions(
                budget,
                effectiveAccess,
                canFinalApproveFromDraft,
              );
              const isRejecting = rejectingBudgetId === budget.id;
              const isRequestingEdit = editRequestBudgetId === budget.id;
              const serverKey = serverExportKey(budget.id);
              const isExportSelected = selectedExportKeys.includes(serverKey);
              const isSelected =
                selectedServerBudgetId === budget.id ||
                editingServerBudgetId === budget.id;
              const isEditing = editingServerBudgetId === budget.id;
              const actionHandlers: SubmittedBudgetActionHandlers = {
                onView: () => setPreviewServerBudget(budget),
                onEdit: () => handleEditServerBudget(budget),
                onCommitteeApprove: () =>
                  void handleBudgetAction(budget.id, "committee"),
                onFinalApprove: () =>
                  void handleBudgetAction(budget.id, "final"),
                onReject: () => {
                  setRejectingBudgetId(budget.id);
                  setRejectReason("");
                },
                onRequestEdit: () => {
                  setEditRequestBudgetId(budget.id);
                  setEditRequestNote("");
                },
                onUnlock: () => void handleUnlockBudget(budget.id),
                onRejectEditRequest: () =>
                  void handleRejectEditRequest(budget.id),
                onRelock: () => void handleRelockBudget(budget.id),
                onDelete: () =>
                  void handleDeleteBudget(budget.id, budget.title),
              };

              return (
                <div
                  key={budget.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isSelected
                      ? "border-[#002868]/50 bg-[#002868]/5 ring-1 ring-[#002868]/20"
                      : budget.status === "REJECTED"
                        ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                        : "hover:bg-muted/40",
                    permissions.showEdit && "cursor-pointer",
                  )}
                  onClick={() => handleSelectServerBudget(budget)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectServerBudget(budget);
                    }
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      {permissions.canExport && (
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExportKey(serverKey);
                          }}
                          title={
                            isExportSelected
                              ? "Deselect for export"
                              : "Select for export"
                          }
                        >
                          {isExportSelected ? (
                            <CheckSquare className="size-4 text-[#C8A061]" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">
                          {budget.title}
                          {isEditing && (
                            <span className="ml-2 text-xs font-normal text-[#002868]">
                              editing
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {budget.creator.name}
                          {budget.creator.committeeScope
                            ? ` · ${budget.creator.committeeScope}`
                            : ""}
                          {" · "}
                          {BUDGET_CATEGORIES[budget.category]?.label ||
                            budget.category}
                          {" · "}
                          {fmtRmb(budgetTotal)}
                          {" · "}
                          {budget.items.length} item
                          {budget.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SubmittedBudgetStatusBadges budget={budget} />
                      <SubmittedBudgetActionsMenu
                        budget={budget}
                        permissions={permissions}
                        handlers={actionHandlers}
                        actionLoading={actionLoading}
                        deleteLoadingId={deleteLoadingId}
                        isEditing={isEditing}
                      />
                    </div>
                  </div>

                  <SubmittedBudgetInlineForms
                    budget={budget}
                    effectiveAccess={effectiveAccess}
                    canFinalApproveFromDraft={canFinalApproveFromDraft}
                    isRejecting={isRejecting}
                    isRequestingEdit={isRequestingEdit}
                    rejectReason={rejectReason}
                    editRequestNote={editRequestNote}
                    actionLoading={actionLoading}
                    onRejectReasonChange={setRejectReason}
                    onEditRequestNoteChange={setEditRequestNote}
                    onConfirmReject={() => void handleRejectBudget(budget.id)}
                    onCancelReject={() => setRejectingBudgetId(null)}
                    onConfirmEditRequest={() =>
                      void handleRequestEditAccess(budget.id)
                    }
                    onCancelEditRequest={() => setEditRequestBudgetId(null)}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {printPortalReady &&
        createPortal(
          <div id="budget-print-root">
            <style>{`
              @media print {
                html,
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  background: white !important;
                }
                body > :not(#budget-print-root) {
                  display: none !important;
                }
                #budget-print-root {
                  display: block !important;
                  position: static !important;
                  left: auto !important;
                  top: auto !important;
                  width: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  pointer-events: auto !important;
                  z-index: auto !important;
                }
                body:not([data-print-mode="combined"]) .budget-print-combined {
                  display: none !important;
                }
                body[data-print-mode="combined"] .budget-print-single {
                  display: none !important;
                }
                #budget-print-root .mt-4 {
                  margin-top: 0 !important;
                }
                .document-page {
                  width: 210mm !important;
                  min-height: 297mm !important;
                  height: auto !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  display: flex !important;
                  flex-direction: column !important;
                  break-after: page;
                  page-break-after: always;
                }
                .budget-print-single .document-page:last-child {
                  break-after: auto;
                  page-break-after: auto;
                }
                .combined-budget-export-block .document-page:last-child {
                  break-after: page;
                  page-break-after: always;
                }
                .combined-export-summary-page {
                  break-before: page;
                  page-break-before: always;
                  width: 210mm;
                  margin: 0;
                  padding: 20mm;
                  box-sizing: border-box;
                  background: #fff;
                }
                .budget-print-combined .combined-export-summary-page {
                  break-after: auto;
                  page-break-after: auto;
                }
                @page { size: A4 portrait; margin: 0; }
              }
            `}</style>
            <div className="budget-print-single">
              <BudgetDocumentPreview
                draft={activeDraft}
                grandTotal={grandTotal}
                confInfo={confInfo}
                members={documentMembers}
                preparedByName={preparedByName}
                signatoryDraft={signatoryDraft}
                forPrint
              />
              {/* Render budget receipts in the print root so exportToPDF captures them */}
              {budgetProofPreviews.length > 0 && (
                <div style={{ padding: 20 }}>
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
                    {budgetProofPreviews.map((preview, idx) => (
                      <div
                        key={`budget-proof-${idx}`}
                        style={{
                          border: "1px solid #d9dfeb",
                          borderRadius: 6,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={preview}
                            alt={`Receipt ${idx + 1}`}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {selectedExportBudgets.length > 0 && (
              <div className="budget-print-combined">
                {selectedExportBudgets.map((entry) => (
                  <div
                    key={`combined-print-${entry.key}`}
                    className="combined-budget-export-block"
                  >
                    <BudgetDocumentPreview
                      draft={entry.draft}
                      grandTotal={entry.total}
                      confInfo={confInfo}
                      members={documentMembers}
                      preparedByName={entry.preparedByName}
                      signatoryDraft={signatoryDraft}
                      instanceKey={entry.key}
                      forPrint
                    />
                  </div>
                ))}
                <div className="combined-export-summary-page">
                  <CombinedExportSummary
                    budgets={selectedExportBudgets}
                    combinedGrandTotal={combinedExportGrandTotal}
                    exportComment={exportComment}
                    forPrint
                  />
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}

      {showCombinedExportPreview && selectedExportBudgets.length > 0 && (
        <BudgetPreviewModal
          title="Combined Budget Export Preview"
          onClose={() => setShowCombinedExportPreview(false)}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCombinedExportCsv}
              >
                <Download className="size-4" />
                Download CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleCombinedPrint}>
                <Printer className="size-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pdfExporting}
                onClick={() => void handleExportPdf("combined")}
              >
                <Download className="size-4" />
                {pdfExporting ? "Exporting…" : "Export PDF"}
              </Button>
            </>
          }
        >
          <div className="space-y-6">
            {selectedExportBudgets.map((entry) => (
              <div
                key={`combined-preview-${entry.key}`}
                className="combined-budget-export-block"
              >
                <BudgetDocumentPreview
                  draft={entry.draft}
                  grandTotal={entry.total}
                  confInfo={confInfo}
                  members={documentMembers}
                  preparedByName={entry.preparedByName}
                  signatoryDraft={signatoryDraft}
                  instanceKey={entry.key}
                />
              </div>
            ))}
            <CombinedExportSummary
              budgets={selectedExportBudgets}
              combinedGrandTotal={combinedExportGrandTotal}
              exportComment={exportComment}
            />
          </div>
        </BudgetPreviewModal>
      )}

      {previewServerBudget && (
        <BudgetPreviewModal
          title={`Submitted Budget — ${previewServerBudget.title}`}
          onClose={() => setPreviewServerBudget(null)}
        >
          <div style={{ width: 794, margin: "0 auto" }}>
            <BudgetDocumentPreview
              draft={serverBudgetToDraft(previewServerBudget)}
              grandTotal={calcBudgetTotal(
                previewServerBudget.items.map((item) => ({
                  id: item.id,
                  no: item.no,
                  name: item.name,
                  qty: item.qty,
                  unit: item.unit,
                  customUnit: "",
                  unitPrice: item.unitPrice,
                  notes: item.notes ?? "",
                })),
              )}
              confInfo={confInfo}
              members={documentMembers}
              preparedByName={previewServerBudget.creator.name}
              signatoryDraft={signatoryDraft}
            />
          </div>
        </BudgetPreviewModal>
      )}

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
            <Button
              size="sm"
              onClick={() => void handleSubmitToConference()}
              disabled={!creatorMemberId || submitLoading}
            >
              {submitLoading
                ? editingServerBudgetId
                  ? "Saving..."
                  : "Submitting..."
                : editingServerBudgetId
                  ? "Save Changes"
                  : "Submit Budget"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
