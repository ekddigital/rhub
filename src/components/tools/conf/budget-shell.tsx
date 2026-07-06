"use client";

import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from "react";
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
import { Badge } from "@/components/ui/badge";
import { BUDGET_CATEGORIES, BUDGET_STATUS_LABELS, COMMON_UNITS } from "@/lib/conf/config";
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
  if (!accessInfo.canApprovePayments || !accessInfo.committeeScope) return false;
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
  if (budget.status === "APPROVED") return false;
  if (accessInfo.isChair || accessInfo.isSuperAdmin) return true;
  if (!accessInfo.canApprovePayments || !accessInfo.committeeScope) return false;
  if (
    budget.creator.committeeScope &&
    budget.creator.committeeScope !== accessInfo.committeeScope
  ) {
    return false;
  }
  return true;
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
      className={forPrint ? "" : "rounded-lg border border-[#C8A061]/40 bg-[#C8A061]/5 p-4"}
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
      <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 11, color: "#444" }}>
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
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
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
  const [pdfExporting, setPdfExporting] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadDrafts();
    setDrafts(stored);
    if (stored.length > 0) {
      setActiveDraft(stored[0]);
    }
  }, []);

  useEffect(() => {
    const onAfterPrint = () => {
      document.body.removeAttribute("data-print-mode");
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

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
  }, [drafts, effectiveAccess, preparedByName, selectedExportKeys, serverBudgets]);

  const combinedExportGrandTotal = useMemo(
    () => selectedExportBudgets.reduce((sum, entry) => sum + entry.total, 0),
    [selectedExportBudgets],
  );

  const allDraftsSelected =
    drafts.length > 0 &&
    drafts.every((draft) => selectedExportKeys.includes(draftExportKey(draft.id)));

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

        const { exportToPDF } = await import("@/lib/creative/documents/pdfExport");
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
    [
      activeDraft.title,
      pdfExporting,
      selectedExportBudgets.length,
    ],
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
      const res = await fetch(`/api/conf/${confId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDraft.title.trim(),
          category: activeDraft.category,
          notes: activeDraft.notes.trim() || null,
          createdBy: creatorMemberId,
          items: validItems.map((item) => ({
            name: item.name.trim(),
            qty: item.qty,
            unit: unitLabel(item),
            unitPrice: item.unitPrice,
            notes: item.notes.trim() || null,
          })),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Failed to submit budget");
      }

      await refreshConferenceBudgets(confId);
      setNotice("Budget submitted successfully.");
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
        setNotice("Budget deleted.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete budget");
      } finally {
        setDeleteLoadingId(null);
      }
    },
    [confId, deleteLoadingId, previewServerBudget?.id, refreshConferenceBudgets],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Print CSS — single off-screen root (logistics / letter pattern) */}
      <style>{`
        #budget-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          pointer-events: none;
          z-index: -1;
        }
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
          body * { visibility: hidden !important; }
          #budget-print-root,
          #budget-print-root * { visibility: visible !important; }
          .budget-no-print { display: none !important; }
          #budget-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
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
            break-after: page;
            page-break-after: always;
          }
          .combined-budget-export-block .document-page:last-child {
            break-after: page;
            page-break-after: always;
          }
          .combined-export-summary-page {
            break-before: page;
            page-break-before: always;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 20mm;
            box-sizing: border-box;
            background: #fff;
          }
          .budget-print-single .document-page:last-child,
          .budget-print-combined .combined-export-summary-page {
            break-after: auto;
            page-break-after: auto;
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
                        title={isSelected ? "Deselect for export" : "Select for export"}
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
          <CardTitle className="text-base">Submitted Budgets</CardTitle>
          <CardDescription>
            Committee review then conference chair final approval. Budget owners
            and authorities can preview and select budgets for combined export.
          </CardDescription>
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
              const canCommitteeApprove =
                budget.status === "DRAFT" &&
                (effectiveAccess?.isSuperAdmin ||
                  (Boolean(effectiveAccess?.canApprovePayments) &&
                    Boolean(effectiveAccess?.committeeScope) &&
                    budget.creator.committeeScope ===
                      effectiveAccess?.committeeScope));
              const canFinalApprove =
                (budget.status === "REVIEW" ||
                  canFinalApproveFromDraft(budget)) &&
                (effectiveAccess?.isChair || effectiveAccess?.isSuperAdmin);
              const showPreview = canPreviewSubmittedBudget(
                budget,
                effectiveAccess,
                { canCommitteeApprove, canFinalApprove },
              );
              const canExport = canSelectBudgetForExport(budget, effectiveAccess);
              const showReject = canRejectBudget(budget, effectiveAccess);
              const showDelete = canDeleteBudget(budget, effectiveAccess);
              const isRejecting = rejectingBudgetId === budget.id;
              const statusMeta = budgetStatusBadge(budget);
              const serverKey = serverExportKey(budget.id);
              const isExportSelected = selectedExportKeys.includes(serverKey);

              return (
                <div
                  key={budget.id}
                  className={`rounded-lg border p-3 ${
                    budget.status === "REJECTED"
                      ? "border-red-500/30 bg-red-500/5"
                      : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      {canExport && (
                      <button
                        type="button"
                        className="mt-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleExportKey(serverKey)}
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
                    <div>
                      <p className="font-medium">{budget.title}</p>
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
                      </p>
                    </div>
                    </div>
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  </div>

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

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {showPreview && (
                      <Button
                        size="sm"
                        className="border-[#002868]/30 bg-[#002868] text-white hover:bg-[#002868]/90"
                        onClick={() => setPreviewServerBudget(budget)}
                      >
                        <Eye className="size-3.5" />
                        View Budget
                      </Button>
                    )}
                  {(canCommitteeApprove || canFinalApprove) && (
                    <>
                      {canCommitteeApprove && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void handleBudgetAction(budget.id, "committee")
                          }
                          disabled={actionLoading === `${budget.id}:committee`}
                        >
                          Committee Approve
                        </Button>
                      )}
                      {canFinalApprove && (
                        <Button
                          size="sm"
                          onClick={() =>
                            void handleBudgetAction(budget.id, "final")
                          }
                          disabled={actionLoading === `${budget.id}:final`}
                        >
                          Final Approve
                        </Button>
                      )}
                    </>
                  )}
                    {showReject &&
                      (!isRejecting ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            setRejectingBudgetId(budget.id);
                            setRejectReason("");
                          }}
                        >
                          <XCircle className="size-3.5" />
                          Reject
                        </Button>
                      ) : (
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <Input
                            className="h-8 min-w-48 flex-1 text-sm"
                            placeholder="Rejection reason (required)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={
                              !rejectReason.trim() ||
                              actionLoading === `${budget.id}:reject`
                            }
                            onClick={() => void handleRejectBudget(budget.id)}
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejectingBudgetId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ))}
                    {showDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 text-red-600 hover:bg-red-500/10"
                        disabled={deleteLoadingId === budget.id}
                        onClick={() =>
                          void handleDeleteBudget(budget.id, budget.title)
                        }
                      >
                        <Trash2 className="size-3.5" />
                        {deleteLoadingId === budget.id ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>

                  {budget.status === "DRAFT" &&
                    (effectiveAccess?.isChair || effectiveAccess?.isSuperAdmin) &&
                    !canFinalApproveFromDraft(budget) && (
                      <p className="mt-2 text-xs text-amber-700">
                        Committee chair approval is required before final
                        approval.
                      </p>
                    )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div id="budget-print-root">
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
      </div>

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
              {submitLoading ? "Submitting..." : "Submit Budget"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
