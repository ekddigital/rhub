"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileUp,
  Link2,
  MapPin,
  Search,
  UserCheck,
  Users,
  BedDouble,
  Shuffle,
  XCircle,
  Clock,
  Plus,
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
import { fmtRmb } from "@/lib/conf/currency";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  DelegateRegistrationForm,
  type DelegateRegistrationPayload,
} from "@/components/tools/conf/delegate-registration-form";
import { useUser } from "@/contexts/user-context";

type Delegate = {
  id: string;
  name: string;
  passportNo: string | null;
  delegateCode: string | null;
  email: string | null;
  university: string | null;
  province: string | null;
  city: string;
  phone: string | null;
  wechat: string | null;
  gender: "MALE" | "FEMALE" | null;
  attendanceIntent: "YES" | "NO" | "OTHER" | null;
  travelAssistanceNeeded: "YES" | "NO" | "OTHER" | null;
  schoolCommunicationNeeded: "YES" | "NO" | "OTHER" | null;
  schoolCommunicationDetails: string | null;
  studyYear:
    | "BACHELOR_1"
    | "BACHELOR_2"
    | "BACHELOR_3"
    | "BACHELOR_4"
    | "GRADUATE_1"
    | "GRADUATE_2"
    | "GRADUATE_3"
    | "GRADUATE_4"
    | "OTHER"
    | null;
  bringingForeignGuest: "YES" | "NO" | "OTHER" | null;
  guestNationality: string | null;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  dietaryNeeds: "YES" | "NO" | "OTHER" | null;
  dietaryDetails: string | null;
  additionalComments: string | null;
  feeAmount: number | null;
  feePaid: boolean;
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  partnerClaimNote: string | null;
  passportPhotoPath: string | null;
  bookletPhotoPath: string | null;
  flyerReady: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  createdAt: string;
};

type PairRequest = {
  id: string;
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
  createdAt: string;
  requester: {
    id: string;
    name: string;
    delegateCode: string | null;
    gender: "MALE" | "FEMALE" | null;
    city: string;
  };
  target: {
    id: string;
    name: string;
    delegateCode: string | null;
    gender: "MALE" | "FEMALE" | null;
    city: string;
  } | null;
};

type RoomAssignment = {
  id: string;
  roomCode: string;
  status: "PENDING" | "ASSIGNED" | "CANCELLED";
  isManual: boolean;
  overrideReason: string | null;
  createdAt: string;
  occupantA: {
    id: string;
    name: string;
    delegateCode: string | null;
    gender: "MALE" | "FEMALE" | null;
    city: string;
  };
  occupantB: {
    id: string;
    name: string;
    delegateCode: string | null;
    gender: "MALE" | "FEMALE" | null;
    city: string;
  } | null;
};

const STATUS_CONFIG = {
  REGISTERED: { label: "Registered", variant: "outline" as const, icon: Clock },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  ATTENDED: {
    label: "Attended",
    variant: "secondary" as const,
    icon: UserCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const PAIR_STATUS_COLOR: Record<PairRequest["status"], string> = {
  PENDING: "text-yellow-600",
  ACCEPTED: "text-blue-600",
  DECLINED: "text-red-600",
  CHAIR_APPROVED: "text-emerald-600",
  CHAIR_REJECTED: "text-red-700",
  CANCELLED: "text-gray-500",
};

export function DelegatesShell() {
  const { user } = useUser();
  const [confId, setConfId] = useState("");
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [pairRequests, setPairRequests] = useState<PairRequest[]>([]);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  const [requesterId, setRequesterId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [requestType, setRequestType] = useState<
    "STANDARD_PAIR" | "LEGAL_PARTNER" | "SINGLE_ROOM"
  >("STANDARD_PAIR");
  const [requestNote, setRequestNote] = useState("");
  const [pairingBusy, setPairingBusy] = useState(false);

  const [manualA, setManualA] = useState("");
  const [manualB, setManualB] = useState("");
  const [manualRoomCode, setManualRoomCode] = useState("");
  const [manualOverride, setManualOverride] = useState("");

  const isAdminControl =
    user &&
    ["SUPER_ADMIN", "ADMIN", "JUDGE_ADMIN", "HEAD_JUDGE"].includes(user.role);

  const loadDelegates = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/delegates`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load delegates");
    const data = (await res.json()) as Delegate[];
    setDelegates(data);
  }, []);

  const loadPairingData = useCallback(async (id: string) => {
    const [requestsRes, roomsRes] = await Promise.all([
      fetch(`/api/conf/${id}/pair-requests`, { cache: "no-store" }),
      fetch(`/api/conf/${id}/room-assignments`, { cache: "no-store" }),
    ]);

    if (!requestsRes.ok || !roomsRes.ok) {
      throw new Error("Failed to load pairing workspace");
    }

    const [requestsData, roomsData] = (await Promise.all([
      requestsRes.json(),
      roomsRes.json(),
    ])) as [PairRequest[], RoomAssignment[]];

    setPairRequests(requestsData);
    setAssignments(roomsData);
  }, []);

  const reloadAll = useCallback(
    async (id: string) => {
      await Promise.all([loadDelegates(id), loadPairingData(id)]);
    },
    [loadDelegates, loadPairingData],
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        await reloadAll(conf.id);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to initialize delegates",
        );
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [reloadAll]);

  const filtered = useMemo(() => {
    if (!search) return delegates;
    const q = search.toLowerCase();
    return delegates.filter((d) => {
      return (
        d.name.toLowerCase().includes(q) ||
        (d.delegateCode || "").toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        (d.university || "").toLowerCase().includes(q) ||
        (d.passportNo || "").toLowerCase().includes(q)
      );
    });
  }, [delegates, search]);

  const totalFees = delegates.reduce((sum, d) => sum + (d.feeAmount || 0), 0);
  const paidFees = delegates
    .filter((d) => d.feePaid)
    .reduce((sum, d) => sum + (d.feeAmount || 0), 0);
  const cities = [...new Set(delegates.map((d) => d.city).filter(Boolean))];
  const flyerReadyCount = delegates.filter((d) => d.flyerReady).length;

  const handleCopyRegistrationLink = async () => {
    try {
      const url = `${window.location.origin}/tools/conf/delegates/register`;
      await navigator.clipboard.writeText(url);
      setNotice("Public registration link copied.");
    } catch {
      setError("Could not copy link. Please copy from browser address bar.");
    }
  };

  const handleExportCsv = () => {
    const header =
      "Conference ID,Name,Passport No,Gender,University,Province,City,Phone,WeChat,Email,Attendance Intent,Travel Assistance,School Communication Needed,School Communication Details,Study Year,Bringing Foreign Guest,Guest Nationality,Accommodation Needed,Dietary Needs,Dietary Details,Additional Comments,Fee Paid,Fee Amount,Room Preference,Status,Flyer Ready";
    const rows = delegates.map((d) =>
      [
        d.delegateCode || "",
        `"${d.name}"`,
        d.passportNo || "",
        d.gender || "",
        `"${d.university || ""}"`,
        `"${d.province || ""}"`,
        d.city,
        d.phone || "",
        d.wechat || "",
        d.email || "",
        d.attendanceIntent || "",
        d.travelAssistanceNeeded || "",
        d.schoolCommunicationNeeded || "",
        `"${d.schoolCommunicationDetails || ""}"`,
        d.studyYear || "",
        d.bringingForeignGuest || "",
        `"${d.guestNationality || ""}"`,
        d.accommodationNeeded || "",
        d.dietaryNeeds || "",
        `"${d.dietaryDetails || ""}"`,
        `"${d.additionalComments || ""}"`,
        d.feePaid ? "Yes" : "No",
        d.feeAmount || 0,
        d.roomPref,
        d.status,
        d.flyerReady ? "Yes" : "No",
      ].join(","),
    );
    const csv = `${header}\n${rows.join("\n")}`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conference-participants.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegister = async (
    payload: DelegateRegistrationPayload,
  ): Promise<boolean> => {
    if (!confId || submitting) return false;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const createRes = await fetch(`/api/conf/${confId}/delegates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          province: payload.province,
          passportNo: payload.passportNo,
          university: payload.university,
          city: payload.city,
          phone: payload.phone,
          wechat: payload.wechat,
          email: payload.email,
          gender: payload.gender,
          attendanceIntent: payload.attendanceIntent,
          travelAssistanceNeeded: payload.travelAssistanceNeeded,
          schoolCommunicationNeeded: payload.schoolCommunicationNeeded,
          schoolCommunicationDetails: payload.schoolCommunicationDetails,
          studyYear: payload.studyYear,
          bringingForeignGuest: payload.bringingForeignGuest,
          guestNationality: payload.guestNationality,
          accommodationNeeded: payload.accommodationNeeded,
          dietaryNeeds: payload.dietaryNeeds,
          dietaryDetails: payload.dietaryDetails,
          additionalComments: payload.additionalComments,
          feeAmount: payload.feeAmount,
          feePaid: payload.feePaid,
          roomPref: payload.roomPref,
          wantsSingleRoom: payload.roomPref === "SINGLE",
          partnerClaimNote: payload.partnerClaimNote,
        }),
      });

      const createdPayload = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(createdPayload.error || "Failed to register delegate");
      }

      const delegateId = createdPayload.id as string;

      const uploadDocument = async (
        kind: "passport" | "booklet",
        file: File | null,
      ) => {
        if (!file) return;
        const fd = new FormData();
        fd.append("kind", kind);
        fd.append("file", file);
        const res = await fetch(
          `/api/conf/${confId}/delegates/${delegateId}/documents`,
          {
            method: "POST",
            body: fd,
          },
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || `Failed to upload ${kind} document`);
        }
      };

      await uploadDocument("passport", payload.passportPhoto);
      await uploadDocument("booklet", payload.bookletPhoto);

      if (payload.feePaid) {
        await fetch(`/api/conf/${confId}/delegates/${delegateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feePaid: true, status: "CONFIRMED" }),
        });
      }

      await reloadAll(confId);
      setShowForm(false);
      setNotice(
        payload.feePaid
          ? "Delegate registered and flyer is now available."
          : "Delegate registered successfully.",
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplaceDelegateDocument = async (
    delegateId: string,
    kind: "passport" | "booklet",
    file: File | null,
  ) => {
    if (!confId || !file || uploadingDocKey) return;

    const key = `${delegateId}:${kind}`;
    setUploadingDocKey(key);
    setError(null);
    setNotice(null);

    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);

      const res = await fetch(
        `/api/conf/${confId}/delegates/${delegateId}/documents`,
        {
          method: "POST",
          body: fd,
        },
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || `Failed to replace ${kind} file`);
      }

      await loadDelegates(confId);
      setNotice(
        kind === "booklet"
          ? "Booklet photo updated successfully."
          : "Passport file updated successfully.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document update failed");
    } finally {
      setUploadingDocKey(null);
    }
  };

  const togglePaid = async (delegate: Delegate) => {
    if (!confId) return;
    setError(null);

    const nextPaid = !delegate.feePaid;
    const res = await fetch(`/api/conf/${confId}/delegates/${delegate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feePaid: nextPaid,
        status: nextPaid ? "CONFIRMED" : "REGISTERED",
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error || "Failed to update payment status");
      return;
    }

    await loadDelegates(confId);
  };

  const handleCreatePairRequest = async () => {
    if (!confId || !requesterId || pairingBusy) return;
    if (requestType !== "SINGLE_ROOM" && !targetId) return;

    setPairingBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/conf/${confId}/pair-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId,
          targetId: requestType === "SINGLE_ROOM" ? null : targetId,
          requestType,
          note: requestNote,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to create pair request");
      }

      setRequesterId("");
      setTargetId("");
      setRequestNote("");
      await loadPairingData(confId);
      setNotice("Pairing request submitted.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to create pair request",
      );
    } finally {
      setPairingBusy(false);
    }
  };

  const handlePairAction = async (
    request: PairRequest,
    action: "accept" | "decline" | "chair-approve" | "chair-reject" | "cancel",
  ) => {
    if (!confId || pairingBusy) return;
    setPairingBusy(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { action };
      if (action === "accept" || action === "decline") {
        body.actorDelegateId = request.targetId;
      }

      const res = await fetch(
        `/api/conf/${confId}/pair-requests/${request.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to update pair request");
      }

      await loadPairingData(confId);
      await loadDelegates(confId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to update pair request",
      );
    } finally {
      setPairingBusy(false);
    }
  };

  const handleManualAssignment = async () => {
    if (!confId || !manualA || pairingBusy) return;

    setPairingBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/conf/${confId}/room-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupantAId: manualA,
          occupantBId: manualB || null,
          roomCode: manualRoomCode || null,
          overrideReason: manualOverride || null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to assign room");
      }

      setManualA("");
      setManualB("");
      setManualRoomCode("");
      setManualOverride("");
      await loadPairingData(confId);
      setNotice("Room assignment created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign room");
    } finally {
      setPairingBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 animate-pulse rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
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
            Delegates & Participants
          </h1>
          <p className="text-sm text-muted-foreground">
            {delegates.length} registered · {cities.length} cities ·{" "}
            {assignments.length} room assignments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRegistrationLink}
          >
            <Link2 className="size-4" />
            Copy Registration Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="size-4" />
            Export
          </Button>
          <Link href="/tools/conf/booklet">
            <Button variant="outline" size="sm">
              <BookOpen className="size-4" />
              Booklet Builder
            </Button>
          </Link>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            Register Delegate
          </Button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{delegates.length}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-green-500/10 p-2">
              <CheckCircle2 className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{fmtRmb(paidFees)}</p>
              <p className="text-xs text-muted-foreground">Fees Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Clock className="size-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {fmtRmb(totalFees - paidFees)}
              </p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Eye className="size-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{flyerReadyCount}</p>
              <p className="text-xs text-muted-foreground">Flyers Ready</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-[#C8A061]/40">
          <CardHeader>
            <CardTitle className="text-base">
              Delegate Registration Form
            </CardTitle>
            <CardDescription>
              This mirrors the public registration flow and collects all
              required conference data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DelegateRegistrationForm
              submitting={submitting}
              submitLabel="Register Delegate"
              onCancel={() => setShowForm(false)}
              onSubmit={handleRegister}
            />
          </CardContent>
        </Card>
      )}

      {delegates.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, conference ID, passport no, city, or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {delegates.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <UserCheck className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No delegates registered yet</p>
            <p className="text-sm text-muted-foreground">
              Use the registration button or share the public registration link.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((delegate) => {
          const config = STATUS_CONFIG[delegate.status];
          const StatusIcon = config.icon;
          const initials = delegate.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0]?.toUpperCase())
            .join("");

          return (
            <Card key={delegate.id} className="overflow-hidden">
              <CardContent className="pt-5">
                <div className="mb-3 flex items-start gap-3">
                  {delegate.bookletPhotoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={delegate.bookletPhotoPath}
                      alt={delegate.name}
                      className="h-16 w-16 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                      {initials || "DL"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{delegate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {delegate.delegateCode || "Pending ID"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {delegate.city}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Passport: {delegate.passportNo || "—"}</p>
                  <p>University: {delegate.university || "—"}</p>
                  <p>Gender: {delegate.gender || "—"}</p>
                  <p>Room preference: {delegate.roomPref}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={config.variant}>
                    <StatusIcon className="mr-1 size-3" />
                    {config.label}
                  </Badge>

                  <button
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      delegate.feePaid
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-700"
                    }`}
                    onClick={() => togglePaid(delegate)}
                  >
                    {delegate.feePaid ? "Paid" : "Unpaid"}
                  </button>

                  {delegate.flyerReady && (
                    <>
                      <Link
                        href={`/api/conf/${confId}/delegates/${delegate.id}/flyer`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-[#0B4FD9]/10 px-2 py-1 text-xs font-medium text-[#0B4FD9]"
                      >
                        <Eye className="size-3" />
                        View Card
                      </Link>
                      <Link
                        href={`/api/conf/${confId}/delegates/${delegate.id}/flyer?download=1`}
                        className="inline-flex items-center gap-1 rounded-md bg-[#C8102E]/10 px-2 py-1 text-xs font-medium text-[#C8102E]"
                        download
                      >
                        <Download className="size-3" />
                        Download
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                      uploadingDocKey ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <Camera className="size-3.5" />
                    {uploadingDocKey === `${delegate.id}:booklet`
                      ? "Uploading..."
                      : "Replace Booklet Photo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleReplaceDelegateDocument(
                          delegate.id,
                          "booklet",
                          file,
                        );
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <label
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                      uploadingDocKey ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <FileUp className="size-3.5" />
                    {uploadingDocKey === `${delegate.id}:passport`
                      ? "Uploading..."
                      : "Replace Passport File"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleReplaceDelegateDocument(
                          delegate.id,
                          "passport",
                          file,
                        );
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pairing Requests</CardTitle>
          <CardDescription>
            Requests support same-gender pairing by default. Legal partner
            exceptions require chair approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Requester</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={requesterId}
                onChange={(e) => setRequesterId(e.target.value)}
              >
                <option value="">Select delegate</option>
                {delegates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.delegateCode || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Request Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={requestType}
                onChange={(e) =>
                  setRequestType(
                    e.target.value as
                      | "STANDARD_PAIR"
                      | "LEGAL_PARTNER"
                      | "SINGLE_ROOM",
                  )
                }
              >
                <option value="STANDARD_PAIR">Standard Pair</option>
                <option value="LEGAL_PARTNER">Legal Partner Exception</option>
                <option value="SINGLE_ROOM">Single Room Request</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Target Delegate</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={requestType === "SINGLE_ROOM"}
              >
                <option value="">
                  {requestType === "SINGLE_ROOM"
                    ? "Not needed"
                    : "Select delegate"}
                </option>
                {delegates
                  .filter((d) => d.id !== requesterId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.delegateCode || "N/A"})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                placeholder="Optional context"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleCreatePairRequest}
              disabled={pairingBusy || !requesterId}
            >
              <Shuffle className="size-4" />
              Submit Pair Request
            </Button>
          </div>

          <div className="space-y-2">
            {pairRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No pairing requests yet.
              </p>
            )}

            {pairRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {request.requester.name}
                      {request.target
                        ? ` → ${request.target.name}`
                        : " (Single room request)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.requestType} ·{" "}
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                    {request.note && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {request.note}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={PAIR_STATUS_COLOR[request.status]}
                  >
                    {request.status}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {request.status === "PENDING" && request.targetId && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePairAction(request, "accept")}
                        disabled={pairingBusy}
                      >
                        Target Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePairAction(request, "decline")}
                        disabled={pairingBusy}
                      >
                        Target Decline
                      </Button>
                    </>
                  )}

                  {(request.status === "PENDING" ||
                    request.status === "ACCEPTED") &&
                    isAdminControl && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handlePairAction(request, "chair-approve")
                          }
                          disabled={pairingBusy}
                        >
                          Chair Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handlePairAction(request, "chair-reject")
                          }
                          disabled={pairingBusy}
                        >
                          Chair Reject
                        </Button>
                      </>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room Assignment Workspace</CardTitle>
          <CardDescription>
            Manual pairing is available for admins/chair controls, including
            legal partner override notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdminControl && (
            <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label>Occupant A</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={manualA}
                  onChange={(e) => setManualA(e.target.value)}
                >
                  <option value="">Select delegate</option>
                  {delegates.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Occupant B (optional)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={manualB}
                  onChange={(e) => setManualB(e.target.value)}
                >
                  <option value="">Single room</option>
                  {delegates
                    .filter((d) => d.id !== manualA)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Room Code (optional)</Label>
                <Input
                  placeholder="e.g. A-204"
                  value={manualRoomCode}
                  onChange={(e) => setManualRoomCode(e.target.value)}
                />
              </div>

              <div className="space-y-2 xl:col-span-2">
                <Label>
                  Override Reason (required for cross-gender assignment)
                </Label>
                <Textarea
                  placeholder="Provide legal partner / approved exception context"
                  value={manualOverride}
                  onChange={(e) => setManualOverride(e.target.value)}
                  rows={1}
                />
              </div>

              <div className="xl:col-span-5 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleManualAssignment}
                  disabled={!manualA || pairingBusy}
                >
                  <BedDouble className="size-4" />
                  Assign Room
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="pt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold">Room {assignment.roomCode}</p>
                    <Badge variant="outline">{assignment.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {assignment.occupantA.name}
                    {assignment.occupantB
                      ? ` + ${assignment.occupantB.name}`
                      : " (Single)"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {assignment.occupantA.delegateCode || "N/A"}
                    {assignment.occupantB
                      ? ` / ${assignment.occupantB.delegateCode || "N/A"}`
                      : ""}
                  </p>
                  {assignment.overrideReason && (
                    <p className="mt-2 text-xs text-amber-700">
                      {assignment.overrideReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {assignments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No room assignments yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Link</CardTitle>
          <CardDescription>
            Share this with participants for self-registration and document
            submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-xs">
              /tools/conf/delegates/register
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRegistrationLink}
            >
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
