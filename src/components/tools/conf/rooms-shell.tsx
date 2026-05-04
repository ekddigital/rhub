"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  BedDouble,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  AlertTriangle,
  ShieldCheck,
  Info,
  Heart,
  Loader2,
  Search,
  Filter,
  Ban,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface DelegateSnippet {
  id: string;
  name: string;
  delegateCode: string | null;
  gender: "MALE" | "FEMALE" | null;
  city: string;
  feePackageId?: string | null;
}

interface RoomAssignment {
  id: string;
  confId: string;
  roomCode: string;
  occupantAId: string;
  occupantBId: string | null;
  status: "PENDING" | "ASSIGNED" | "CANCELLED";
  isManual: boolean;
  overrideReason: string | null;
  occupantA: DelegateSnippet;
  occupantB: DelegateSnippet | null;
  createdAt: string;
}

interface PairRequest {
  id: string;
  confId: string;
  requesterId: string;
  targetId: string | null;
  requestType: "STANDARD_PAIR" | "LEGAL_PARTNER" | "SINGLE_ROOM";
  status:
    | "PENDING"
    | "ACCEPTED"
    | "DECLINED"
    | "CHAIR_APPROVED"
    | "CHAIR_REJECTED"
    | "CANCELLED";
  note: string | null;
  adminNote: string | null;
  respondedAt: string | null;
  createdAt: string;
  requester?: DelegateSnippet;
  target?: DelegateSnippet | null;
}

interface MyDelegate {
  id: string;
  name: string;
  delegateCode: string | null;
  gender: "MALE" | "FEMALE" | null;
  city: string;
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  feePackageId: string | null;
  partnerClaimNote: string | null;
}

interface RoomsData {
  myDelegate: MyDelegate | null;
  myAssignment: RoomAssignment | null;
  sentRequests: PairRequest[];
  receivedRequests: PairRequest[];
  eligibleDelegates: DelegateSnippet[];
  // manager fields
  allRequests?: PairRequest[];
  allAssignments?: RoomAssignment[];
}

interface RoomsShellProps {
  confId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genderLabel(g: string | null): string {
  if (g === "MALE") return "Male";
  if (g === "FEMALE") return "Female";
  return "—";
}

function genderColor(g: string | null): string {
  if (g === "MALE") return "border-blue-500/40 text-blue-400";
  if (g === "FEMALE") return "border-pink-500/40 text-pink-400";
  return "border-white/20 text-muted-foreground";
}

function statusLabel(s: PairRequest["status"]): string {
  const map: Record<PairRequest["status"], string> = {
    PENDING: "Awaiting response",
    ACCEPTED: "Accepted — awaiting confirmation",
    DECLINED: "Declined",
    CHAIR_APPROVED: "Confirmed by committee",
    CHAIR_REJECTED: "Rejected by committee",
    CANCELLED: "Cancelled",
  };
  return map[s] ?? s;
}

function statusColor(s: PairRequest["status"]): string {
  if (s === "CHAIR_APPROVED") return "border-emerald-500/40 text-emerald-400";
  if (s === "ACCEPTED") return "border-emerald-500/30 text-emerald-300";
  if (s === "PENDING") return "border-amber-500/40 text-amber-400";
  if (s === "DECLINED" || s === "CHAIR_REJECTED")
    return "border-red-500/40 text-red-400";
  return "border-white/20 text-muted-foreground";
}

function typeLabel(t: PairRequest["requestType"]): string {
  if (t === "LEGAL_PARTNER") return "Legal Partner Exception";
  if (t === "SINGLE_ROOM") return "Single Room Request";
  return "Standard Pairing";
}

function timeAgo(d: string): string {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(d).toLocaleDateString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoBanner({
  type,
  children,
}: {
  type: "info" | "warn" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-blue-950/40 border-blue-500/30 text-blue-300",
    warn: "bg-amber-950/40 border-amber-500/30 text-amber-300",
    success: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
    error: "bg-red-950/40 border-red-500/30 text-red-300",
  };
  const icons = {
    info: <Info className="size-4 shrink-0" />,
    warn: <AlertTriangle className="size-4 shrink-0" />,
    success: <CheckCircle2 className="size-4 shrink-0" />,
    error: <XCircle className="size-4 shrink-0" />,
  };
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
    >
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}

function DelegateCard({
  delegate,
  onRequest,
  hasPendingRequest,
}: {
  delegate: DelegateSnippet;
  onRequest: (d: DelegateSnippet) => void;
  hasPendingRequest: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 transition-colors hover:border-[#C8A061]/30">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{delegate.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] ${genderColor(delegate.gender)}`}
          >
            {genderLabel(delegate.gender)}
          </Badge>
          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <MapPin className="size-2.5" />
            {delegate.city}
          </span>
          {delegate.delegateCode && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {delegate.delegateCode}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRequest(delegate)}
        disabled={hasPendingRequest}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#C8A061]/40 px-2.5 py-1.5 text-[11px] font-semibold text-[#C8A061] transition-colors hover:bg-[#C8A061]/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {hasPendingRequest ? (
          <>
            <Clock className="size-3" />
            Pending
          </>
        ) : (
          <>
            <UserPlus className="size-3" />
            Request
          </>
        )}
      </button>
    </div>
  );
}

// ─── Request Row (sent/received) ──────────────────────────────────────────────

function RequestRow({
  request,
  mode,
  myId,
  isManager,
  confId,
  onAction,
}: {
  request: PairRequest;
  mode: "sent" | "received" | "admin";
  myId: string | null;
  isManager: boolean;
  confId: string;
  onAction: (requestId: string, action: string, note?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [showAdminNote, setShowAdminNote] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const counterpart =
    mode === "sent" ? request.target : mode === "received" ? request.requester : null;
  const isLegalPartner = request.requestType === "LEGAL_PARTNER";
  const canAct = request.status === "PENDING" || request.status === "ACCEPTED";

  const act = async (action: string, note?: string) => {
    setBusy(true);
    try {
      await onAction(request.id, action, note);
    } finally {
      setBusy(false);
      setShowAdminNote(false);
    }
  };

  return (
    <div
      className={`rounded-xl border p-3.5 ${
        isLegalPartner
          ? "border-purple-500/25 bg-purple-950/10"
          : "border-white/10 bg-white/3"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] ${statusColor(request.status)}`}
            >
              {statusLabel(request.status)}
            </Badge>
            {isLegalPartner && (
              <Badge
                variant="outline"
                className="border-purple-500/40 text-[10px] text-purple-400"
              >
                <Heart className="mr-1 size-2.5" />
                Legal Partner Exception
              </Badge>
            )}
          </div>

          {counterpart && (
            <p className="mt-1.5 text-sm">
              <span className="text-muted-foreground">
                {mode === "sent" ? "To: " : mode === "received" ? "From: " : ""}
              </span>
              <span className="font-semibold">{counterpart.name}</span>
              <span className="ml-2 text-[11px] text-muted-foreground">
                {genderLabel(counterpart.gender)} · {counterpart.city}
              </span>
            </p>
          )}
          {mode === "admin" && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">{request.requester?.name ?? "—"}</span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="font-semibold">{request.target?.name ?? "Any"}</span>
              <span className="ml-2 text-[11px] text-muted-foreground">
                {typeLabel(request.requestType)}
              </span>
            </p>
          )}

          {request.note && (
            <p className="mt-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground">
              &ldquo;{request.note}&rdquo;
            </p>
          )}
          {request.adminNote && (
            <p className="mt-1 text-xs text-amber-400">
              Committee note: {request.adminNote}
            </p>
          )}

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {timeAgo(request.createdAt)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}

          {!busy && mode === "received" && canAct && (
            <>
              <button
                onClick={() => act("accept", undefined)}
                className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30"
              >
                <Check className="size-3" />
                Accept
              </button>
              <button
                onClick={() => act("decline", undefined)}
                className="flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/30"
              >
                <X className="size-3" />
                Decline
              </button>
            </>
          )}

          {!busy && mode === "sent" && canAct && (
            <button
              onClick={() => act("cancel", undefined)}
              className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/10"
            >
              <Ban className="size-3" />
              Cancel
            </button>
          )}

          {/* Admin chair-approve / chair-reject */}
          {!busy && mode === "admin" && isManager && canAct && (
            <>
              <button
                onClick={() => {
                  if (showAdminNote) {
                    void act("chair-approve", adminNote);
                  } else {
                    setShowAdminNote(true);
                  }
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30"
              >
                <ShieldCheck className="size-3" />
                {showAdminNote ? "Confirm Approve" : "Approve"}
              </button>
              <button
                onClick={() => {
                  if (showAdminNote) {
                    void act("chair-reject", adminNote);
                  } else {
                    setShowAdminNote(true);
                  }
                }}
                className="flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/30"
              >
                <X className="size-3" />
                {showAdminNote ? "Confirm Reject" : "Reject"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin note textarea */}
      {showAdminNote && (
        <div className="mt-2">
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Optional note to the requester…"
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowAdminNote(false)}
            className="mt-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Cancel note
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Request dialog (inline form) ────────────────────────────────────────────

function SendRequestForm({
  target,
  forceType,
  onSubmit,
  onCancel,
}: {
  target: DelegateSnippet | null;
  forceType?: "LEGAL_PARTNER";
  onSubmit: (opts: {
    targetId: string | null;
    requestType: string;
    note: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const isLP = forceType === "LEGAL_PARTNER";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        targetId: target?.id ?? null,
        requestType: isLP ? "LEGAL_PARTNER" : "STANDARD_PAIR",
        note,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-4 rounded-xl border p-4 ${
        isLP
          ? "border-purple-500/30 bg-purple-950/10"
          : "border-[#C8A061]/25 bg-[#C8A061]/5"
      }`}
    >
      <p className="mb-1 text-sm font-semibold">
        {isLP ? (
          <>
            <Heart className="mr-1 inline size-3.5 text-pink-400" />
            Legal Partner Exception Request
          </>
        ) : (
          <>
            <UserPlus className="mr-1 inline size-3.5 text-[#C8A061]" />
            Send Roommate Request to{" "}
            <span className="text-[#C8A061]">{target?.name}</span>
          </>
        )}
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        {isLP
          ? "This request is for married couples or legal domestic partners sharing a room. The conference committee (NEC / Chair) must approve this before any room assignment is made."
          : "Your request will be sent to them for acceptance. Once both sides agree, you will be paired. Pairing is same-gender only by default."}
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          isLP
            ? "Briefly describe your relationship (e.g., married couple, legal domestic partners)…"
            : "Optional message to your roommate request…"
        }
        rows={3}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || (isLP && !note.trim())}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 ${
            isLP ? "bg-purple-700 hover:bg-purple-600" : "bg-[#C8A061]"
          }`}
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          {isLP ? "Submit for approval" : "Send request"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoomsShell({ confId, isManager, isSuperAdmin }: RoomsShellProps) {
  const [data, setData] = useState<RoomsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "MALE" | "FEMALE">("ALL");
  const [activeTab, setActiveTab] = useState<"my-room" | "find" | "requests" | "admin">(
    "my-room",
  );

  // Request form state
  const [requestTarget, setRequestTarget] = useState<DelegateSnippet | null>(null);
  const [showLPForm, setShowLPForm] = useState(false);

  // Feedback
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(
    null,
  );

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/conf/${confId}/rooms`);
      if (!res.ok) throw new Error("Failed to load room data");
      setData((await res.json()) as RoomsData);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [confId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendRequest = async (opts: {
    targetId: string | null;
    requestType: string;
    note: string;
  }) => {
    const res = await fetch(`/api/conf/${confId}/pair-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "Failed to send request");
    }
    setRequestTarget(null);
    setShowLPForm(false);
    showToast("success", "Request sent!");
    await load();
  };

  const handleAction = async (requestId: string, action: string, note?: string) => {
    const myDelegateId = data?.myDelegate?.id;
    const res = await fetch(`/api/conf/${confId}/pair-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        actorDelegateId: myDelegateId,
        adminNote: note,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      showToast("error", j.error ?? "Action failed");
      return;
    }
    showToast(
      "success",
      action === "accept"
        ? "Request accepted!"
        : action === "decline"
          ? "Request declined."
          : action === "cancel"
            ? "Request cancelled."
            : action === "chair-approve"
              ? "Request approved and room assigned!"
              : "Request rejected.",
    );
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading room information…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <InfoBanner type="error">{error}</InfoBanner>
      </div>
    );
  }

  const md = data?.myDelegate ?? null;
  const ma = data?.myAssignment ?? null;
  const sent = data?.sentRequests ?? [];
  const received = data?.receivedRequests ?? [];
  const eligible = data?.eligibleDelegates ?? [];

  const pendingSent = sent.filter((r) => ["PENDING", "ACCEPTED"].includes(r.status));
  const pendingReceived = received.filter((r) =>
    ["PENDING", "ACCEPTED"].includes(r.status),
  );
  const hasPendingWithId = (id: string) =>
    pendingSent.some((r) => r.targetId === id);

  // Filter eligible delegates
  const filteredEligible = eligible.filter((d) => {
    const matchGender =
      genderFilter === "ALL" || d.gender === genderFilter;
    const matchSearch =
      !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.delegateCode ?? "").toLowerCase().includes(search.toLowerCase());
    return matchGender && matchSearch;
  });

  const totalRequestAlerts = pendingReceived.length;

  // ─── Accommodation eligibility check ─────────────────────────────────────
  const isNotRegistered = !md;
  const wantsSingle = md?.wantsSingleRoom;
  const noAccom = md?.accommodationNeeded === "NO";
  const isPrefPair = md?.roomPref === "PAIR";
  const hasRoom = Boolean(ma && ma.status !== "CANCELLED");

  // Derive same-gender eligible from the full list
  const samegenderEligible = filteredEligible.filter(
    (d) => !md?.gender || d.gender === md.gender,
  );
  const crossGenderEligible = filteredEligible.filter(
    (d) => md?.gender && d.gender !== md.gender,
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${
            toast.type === "success"
              ? "bg-emerald-700 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <BedDouble className="size-5 text-[#C8A061]" />
            Room Pairing
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose your roommate for the conference. Same-gender pairing by default — legal partner exceptions require committee approval.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* Rules banner */}
      <InfoBanner type="info">
        <strong>How it works:</strong> Everyone with a shared-room package can choose a
        roommate. Pick someone from the list below and send a request — they must accept
        before the pairing is confirmed.
        <br />
        <strong>Same-gender only</strong> by default. Married or legally partnered couples
        who wish to share a room must submit a{" "}
        <span className="font-semibold text-purple-300">Legal Partner Exception</span>{" "}
        request. The conference committee (NEC / Chair) will review and confirm.
      </InfoBanner>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/3 p-1">
        {(
          [
            {
              key: "my-room",
              label: "My Room",
              icon: BedDouble,
            },
            {
              key: "find",
              label: "Find a Roommate",
              icon: Search,
            },
            {
              key: "requests",
              label: `Requests${totalRequestAlerts > 0 ? ` (${totalRequestAlerts})` : ""}`,
              icon: Send,
            },
            ...(isManager
              ? [{ key: "admin", label: "Committee View", icon: ShieldCheck }]
              : []),
          ] as { key: typeof activeTab; label: string; icon: React.ElementType }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#C8A061] text-white"
                : tab.key === "requests" && totalRequestAlerts > 0
                  ? "text-amber-400 hover:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MY ROOM TAB ── */}
      {activeTab === "my-room" && (
        <div className="space-y-4">
          {isNotRegistered && (
            <InfoBanner type="warn">
              You are not yet registered as a delegate for this conference. Please complete
              delegate registration to access room pairing.
            </InfoBanner>
          )}

          {md && (noAccom || wantsSingle) && !hasRoom && (
            <InfoBanner type="warn">
              Your registration indicates you do not need shared accommodation or have
              selected a single room. Room pairing is not available for your current
              registration. Contact the committee if you need to update your preferences.
            </InfoBanner>
          )}

          {/* Current assignment */}
          {hasRoom && ma ? (
            <Card className="border-emerald-500/30 bg-emerald-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  You have a room assignment!
                </CardTitle>
                <CardDescription>
                  Room code:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {ma.roomCode}
                  </span>
                  {ma.isManual && (
                    <span className="ml-2 text-[11px] text-amber-400">
                      (Manually assigned)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[ma.occupantA, ma.occupantB].filter(Boolean).map((occ) => (
                    <div
                      key={occ!.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/4 px-3 py-2.5"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#C8A061]/20 text-sm font-bold text-[#C8A061]">
                        {occ!.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {occ!.name}
                          {occ!.id === md?.id && (
                            <span className="ml-1.5 text-[10px] text-[#C8A061]">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {genderLabel(occ!.gender)} · {occ!.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {ma.overrideReason && (
                  <p className="text-xs text-amber-400">
                    <Info className="mr-1 inline size-3" />
                    {ma.overrideReason}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            md &&
            !noAccom &&
            !wantsSingle && (
              <InfoBanner type="info">
                You do not have a room assignment yet. Use the{" "}
                <button
                  className="font-semibold text-[#C8A061] underline-offset-2 hover:underline"
                  onClick={() => setActiveTab("find")}
                >
                  Find a Roommate
                </button>{" "}
                tab to send a pairing request, or wait for someone to request you.
              </InfoBanner>
            )
          )}

          {/* My delegate summary */}
          {md && (
            <Card className="border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Your Registration Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Name</p>
                    <p className="font-semibold">{md.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Gender</p>
                    <p className="font-semibold">{genderLabel(md.gender)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">City</p>
                    <p className="font-semibold">{md.city}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Room Pref</p>
                    <p className="font-semibold">
                      {md.roomPref === "PAIR" ? "Shared room" : "Single room"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Accommodation</p>
                    <p className="font-semibold">
                      {md.accommodationNeeded === "YES"
                        ? "Needed"
                        : md.accommodationNeeded === "NO"
                          ? "Not needed"
                          : "TBD"}
                    </p>
                  </div>
                </div>
                {md.partnerClaimNote && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Note: {md.partnerClaimNote}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── FIND ROOMMATE TAB ── */}
      {activeTab === "find" && (
        <div className="space-y-4">
          {isNotRegistered && (
            <InfoBanner type="warn">
              You must be a registered delegate to send pairing requests.
            </InfoBanner>
          )}

          {/* Legal Partner Exception button */}
          {md && !hasRoom && (
            <Card className="border-purple-500/20 bg-purple-950/10">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-purple-300">
                    <Heart className="size-4" />
                    Married or legal domestic partners?
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Submit a Legal Partner Exception — the committee will review and
                    confirm your pairing regardless of gender.
                  </p>
                </div>
                {!showLPForm ? (
                  <button
                    onClick={() => {
                      setShowLPForm(true);
                      setRequestTarget(null);
                    }}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-700/30 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-700/50"
                  >
                    <UserPlus className="size-3.5" />
                    Request Exception
                  </button>
                ) : null}
              </CardContent>

              {showLPForm && (
                <CardContent className="pt-0">
                  <SendRequestForm
                    target={null}
                    forceType="LEGAL_PARTNER"
                    onSubmit={(opts) =>
                      sendRequest(opts).catch((e: unknown) => {
                        showToast("error", String((e as Error).message));
                        throw e;
                      })
                    }
                    onCancel={() => setShowLPForm(false)}
                  />
                </CardContent>
              )}
            </Card>
          )}

          {/* Request form (inline) */}
          {requestTarget && !showLPForm && (
            <SendRequestForm
              target={requestTarget}
              onSubmit={(opts) =>
                sendRequest(opts).catch((e: unknown) => {
                  showToast("error", String((e as Error).message));
                  throw e;
                })
              }
              onCancel={() => setRequestTarget(null)}
            />
          )}

          {/* Search + filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, or code…"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="size-3.5 text-muted-foreground" />
              {(["ALL", "MALE", "FEMALE"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    genderFilter === g
                      ? "bg-[#C8A061] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g === "ALL" ? "All" : g === "MALE" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Same-gender section */}
          {samegenderEligible.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {md?.gender
                  ? `${genderLabel(md.gender)} delegates available`
                  : "Available delegates"}
              </p>
              <div className="space-y-2">
                {samegenderEligible.map((d) => (
                  <DelegateCard
                    key={d.id}
                    delegate={d}
                    hasPendingRequest={hasPendingWithId(d.id)}
                    onRequest={(del) => {
                      setShowLPForm(false);
                      setRequestTarget(del);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cross-gender section — shown only with explanation */}
          {crossGenderEligible.length > 0 && genderFilter === "ALL" && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-400">
                <Heart className="size-3.5" />
                Other gender — legal partner exception required
              </p>
              <InfoBanner type="warn">
                Selecting a delegate of a different gender requires a{" "}
                <strong>Legal Partner Exception</strong> request (above). Standard
                roommate requests with different genders are not allowed.
              </InfoBanner>
              <div className="mt-2 space-y-2">
                {crossGenderEligible.map((d) => (
                  <DelegateCard
                    key={d.id}
                    delegate={d}
                    hasPendingRequest={false}
                    onRequest={() => {
                      setShowLPForm(true);
                      setRequestTarget(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {samegenderEligible.length === 0 && crossGenderEligible.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-3 size-8 opacity-30" />
              No eligible delegates found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === "requests" && (
        <div className="space-y-5">
          {/* Received */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Requests Received
              {pendingReceived.length > 0 && (
                <Badge className="ml-1 bg-amber-500 text-[10px] text-white">
                  {pendingReceived.length} new
                </Badge>
              )}
            </p>
            {received.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No roommate requests received yet.
              </p>
            ) : (
              <div className="space-y-3">
                {received.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    mode="received"
                    myId={md?.id ?? null}
                    isManager={isManager}
                    confId={confId}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sent */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Send className="size-4 text-[#C8A061]" />
              Requests Sent
            </p>
            {sent.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                You have not sent any roommate requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sent.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    mode="sent"
                    myId={md?.id ?? null}
                    isManager={isManager}
                    confId={confId}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN / COMMITTEE VIEW TAB ── */}
      {activeTab === "admin" && isManager && (
        <div className="space-y-5">
          <InfoBanner type="info">
            Committee view: you can approve or reject pending pairing requests,
            including Legal Partner Exception requests. All approvals create a room
            assignment.
          </InfoBanner>

          {/* All pending requests */}
          <div>
            <p className="mb-3 text-sm font-bold">
              All Pair Requests ({data?.allRequests?.length ?? 0})
            </p>
            {(data?.allRequests ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {(data?.allRequests ?? []).map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    mode="admin"
                    myId={null}
                    isManager={isManager}
                    confId={confId}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* All room assignments */}
          <div>
            <p className="mb-3 text-sm font-bold">
              Room Assignments ({data?.allAssignments?.length ?? 0})
            </p>
            {(data?.allAssignments ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No room assignments yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(data?.allAssignments ?? []).map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-xl border p-3.5 ${
                      a.status === "CANCELLED"
                        ? "border-white/8 opacity-50"
                        : "border-emerald-500/25 bg-emerald-950/10"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#C8A061]">
                        {a.roomCode}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          a.status === "ASSIGNED"
                            ? "border-emerald-500/40 text-[10px] text-emerald-400"
                            : a.status === "CANCELLED"
                              ? "border-white/20 text-[10px] text-muted-foreground"
                              : "border-amber-500/40 text-[10px] text-amber-400"
                        }
                      >
                        {a.status}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {[a.occupantA, a.occupantB]
                        .filter(Boolean)
                        .map((occ) => (
                          <div
                            key={occ!.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C8A061]/15 text-xs font-bold text-[#C8A061]">
                              {occ!.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium">{occ!.name}</span>
                              <span className="ml-1.5 text-[11px] text-muted-foreground">
                                {genderLabel(occ!.gender)} · {occ!.city}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    {a.isManual && (
                      <p className="mt-1.5 text-[11px] text-amber-400">
                        <ShieldCheck className="mr-0.5 inline size-3" />
                        {a.overrideReason ?? "Manually assigned"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
