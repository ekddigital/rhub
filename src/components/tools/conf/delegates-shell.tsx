"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Copy,
  Eye,
  Link2,
  UserCheck,
  Users,
  BedDouble,
  Shuffle,
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
import { fmtRmb } from "@/lib/conf/currency";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  getCompanionGuestsForRoomDisplay,
  isDelegateEligibleForGuestSelfRoom,
  isDelegateEligibleForRoomPairing,
} from "@/lib/conf/room-pairing-eligibility";
import { conferencePackageIncludesGuest } from "@/lib/conf/delegate-guests";
import {
  RoomAssignmentWorkspace,
  type RoomAssignmentRow,
} from "@/components/tools/conf/room-assignment-workspace";
import {
  DelegateRegistrationForm,
  type DelegateRegistrationPayload,
} from "@/components/tools/conf/delegate-registration-form";
import { uploadConferenceGuestDocuments } from "@/components/tools/conf/conference-guest-registration-section";
import { ParticipantsDataTable } from "@/components/tools/conf/participants-data-table";
import { useUser } from "@/contexts/user-context";
import { validateDelegateUploadFile } from "@/lib/conf/file-upload-client";
import {
  formatUploadError,
  parseUploadErrorPayload,
} from "@/lib/conf/upload-feedback-client";

type Delegate = {
  id: string;
  userId: string | null;
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
  addOnPackageIds?: string[];
  feeAmount: number | null;
  feePackageId: string | null;
  amountPaid: number | null;
  feePaid: boolean;
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  partnerClaimNote: string | null;
  guestCount: number;
  guests?: Array<{
    id: string;
    name: string;
    sortOrder: number;
  }>;
  passportPhotoPath: string | null;
  passportPhotoIsPdf?: boolean;
  lastEntryStampPath: string | null;
  lastEntryStampIsPdf?: boolean;
  currentVisaPath: string | null;
  currentVisaIsPdf?: boolean;
  bookletPhotoPath: string | null;
  conferencePosition: string | null;
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

type RoomAssignment = RoomAssignmentRow;

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
  const [canDeleteDelegates, setCanDeleteDelegates] = useState(false);
  const [canViewPaymentStats, setCanViewPaymentStats] = useState(false);
  const [canViewDelegateDetails, setCanViewDelegateDetails] = useState(false);
  const [defaultFeeAmount, setDefaultFeeAmount] = useState(250);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [pairRequests, setPairRequests] = useState<PairRequest[]>([]);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [canManagePairing, setCanManagePairing] = useState(false);
  const [currentDelegateId, setCurrentDelegateId] = useState<string | null>(null);
  const [pairingAvailable, setPairingAvailable] = useState(false);
  const [selfPairingMode, setSelfPairingMode] = useState<
    "with-guest" | "with-delegate" | "single-room"
  >("with-delegate");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  const [requesterId, setRequesterId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [requestType, setRequestType] = useState<
    "STANDARD_PAIR" | "LEGAL_PARTNER" | "SINGLE_ROOM"
  >("STANDARD_PAIR");
  const [requestNote, setRequestNote] = useState("");
  const [pairingBusy, setPairingBusy] = useState(false);

  const isAdminControl = Boolean(
    user &&
    ["SUPER_ADMIN", "ADMIN", "JUDGE_ADMIN", "HEAD_JUDGE"].includes(user.role),
  );

  const loadDelegates = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/delegates`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load delegates");
    const data = (await res.json()) as Delegate[];
    setDelegates(data);
  }, []);

  const loadPairingData = useCallback(async (id: string): Promise<boolean> => {
    const [requestsRes, roomsRes] = await Promise.all([
      fetch(`/api/conf/${id}/pair-requests`, { cache: "no-store" }),
      fetch(`/api/conf/${id}/room-assignments`, { cache: "no-store" }),
    ]);

    if (
      [401, 403].includes(requestsRes.status) ||
      [401, 403].includes(roomsRes.status)
    ) {
      setPairRequests([]);
      setAssignments([]);
      return false;
    }

    if (!requestsRes.ok || !roomsRes.ok) {
      throw new Error("Failed to load pairing workspace");
    }

    const [requestsData, roomsData] = (await Promise.all([
      requestsRes.json(),
      roomsRes.json(),
    ])) as [PairRequest[], RoomAssignment[]];

    setPairRequests(requestsData);
    setAssignments(roomsData);
    return true;
  }, []);

  const reloadAll = useCallback(
    async (id: string) => {
      await loadDelegates(id);
      const canUsePairing = await loadPairingData(id);
      setPairingAvailable(canUsePairing);
    },
    [loadDelegates, loadPairingData],
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setCanDeleteDelegates(Boolean(isAdminControl));
        setCanViewPaymentStats(Boolean(isAdminControl));
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        setDefaultFeeAmount(conf.delegateFee || 250);
        const accessRes = await fetch("/api/conf/default/access", {
          cache: "no-store",
        });
        if (accessRes.ok) {
          const accessPayload = (await accessRes.json()) as {
            isManager?: boolean;
            isHotelCheckin?: boolean;
            canManagePairing?: boolean;
            delegateId?: string | null;
          };
          const canManageConference = Boolean(accessPayload.isManager);
          setCanDeleteDelegates(canManageConference);
          setCanViewPaymentStats(canManageConference);
          setCanManagePairing(
            Boolean(accessPayload.canManagePairing || isAdminControl),
          );
          setCurrentDelegateId(accessPayload.delegateId ?? null);
          setCanViewDelegateDetails(
            canManageConference || Boolean(accessPayload.isHotelCheckin),
          );
        }
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
  }, [isAdminControl, reloadAll]);

  const totalFees = delegates.reduce((sum, d) => sum + (d.feeAmount || 0), 0);
  const paidFees = delegates
    .filter((d) => d.feePaid)
    .reduce((sum, d) => sum + (d.amountPaid || d.feeAmount || 0), 0);
  const cities = [...new Set(delegates.map((d) => d.city).filter(Boolean))];
  const flyerReadyCount = delegates.filter((d) => d.flyerReady).length;

  const assignedDelegateIds = new Set(
    assignments
      .filter((a) => a.status !== "CANCELLED")
      .flatMap((a) => [a.occupantA.id, a.occupantB?.id].filter(Boolean)),
  );

  const pairEligibleDelegates = delegates.filter(
    (d) =>
      isDelegateEligibleForRoomPairing(d) && !assignedDelegateIds.has(d.id),
  );

  const myDelegate = currentDelegateId
    ? delegates.find((d) => d.id === currentDelegateId) ?? null
    : null;

  const myAssignment =
    currentDelegateId && !canManagePairing
      ? assignments.find(
          (a) =>
            a.status !== "CANCELLED" &&
            (a.occupantA.id === currentDelegateId ||
              a.occupantB?.id === currentDelegateId),
        ) ?? null
      : null;

  const myRoommate = myAssignment
    ? myAssignment.occupantA.id === currentDelegateId
      ? myAssignment.occupantB
      : myAssignment.occupantA
    : null;

  const myOccupantRecord = myAssignment
    ? myAssignment.occupantA.id === currentDelegateId
      ? myAssignment.occupantA
      : myAssignment.occupantB
    : null;

  const myCompanionGuests =
    myAssignment && myDelegate
      ? getCompanionGuestsForRoomDisplay(
          {
            feePackageId: myDelegate.feePackageId,
            guestCount: myDelegate.guestCount,
            roomPref: myDelegate.roomPref,
            wantsSingleRoom: myDelegate.wantsSingleRoom,
            accommodationNeeded: myDelegate.accommodationNeeded,
            feePaid: myDelegate.feePaid,
            amountPaid: myDelegate.amountPaid,
            feeAmount: myDelegate.feeAmount,
            status: myDelegate.status,
            guests: myOccupantRecord?.guests ?? myDelegate.guests,
          },
          { hasPairPartner: Boolean(myRoommate) },
        )
      : [];

  const canSelfAssignWithGuest = Boolean(
    myDelegate && isDelegateEligibleForGuestSelfRoom(myDelegate),
  );

  const selfPairingEligibleTargets = pairEligibleDelegates.filter(
    (d) => d.id !== currentDelegateId,
  );

  const handleCopyRegistrationLink = async () => {
    try {
      const url = `${window.location.origin}/tools/conf/delegates/register`;
      await navigator.clipboard.writeText(url);
      setNotice("Public registration link copied.");
    } catch {
      setError("Could not copy link. Please copy from browser address bar.");
    }
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
          feePackageId: payload.feePackageId,
          addOnPackageIds: payload.addOnPackageIds,
          jerseyDetails: payload.jerseyDetails,
          feeAmount: payload.feeAmount,
          amountPaid: payload.amountPaid,
          feePaid: payload.feePaid,
          roomPref: payload.roomPref,
          wantsSingleRoom: payload.roomPref === "SINGLE",
          partnerClaimNote: payload.partnerClaimNote,
          conferencePosition: payload.conferencePosition || null,
          guestCount: payload.guestCount,
          guests: payload.guests.map(
            ({
              passportPhoto: _p,
              lastEntryStampPhoto: _e,
              currentVisaPhoto: _v,
              ...guest
            }) => guest,
          ),
        }),
      });

      const createdPayload = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(createdPayload.error || "Failed to register delegate");
      }

      const delegateId = createdPayload.id as string;

      const uploadDocument = async (
        kind: "passport" | "booklet" | "entry-stamp" | "visa",
        file: File | null,
      ) => {
        if (!file) return;
        const validation = await validateDelegateUploadFile(file, kind);
        if (!validation.ok) {
          throw new Error(
            `Cannot upload ${kind}: ${validation.error} (File: ${file.name})`,
          );
        }
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
        const payload = await parseUploadErrorPayload(res);
        if (!res.ok) {
          throw new Error(
            formatUploadError(
              payload,
              `Failed to upload ${kind} document`,
              res.status,
            ),
          );
        }
      };

      await uploadDocument("passport", payload.passportPhoto);
      await uploadDocument("entry-stamp", payload.lastEntryStampPhoto);
      await uploadDocument("visa", payload.currentVisaPhoto);
      await uploadDocument("booklet", payload.bookletPhoto);

      if (payload.guestCount > 0 && payload.guests.length > 0) {
        const guestRows = (createdPayload.guests ?? []) as Array<{
          id: string;
          sortOrder: number;
        }>;
        await uploadConferenceGuestDocuments({
          confId,
          delegateId,
          guestRows,
          guests: payload.guests,
        });
      }

      if (payload.feePaid) {
        await fetch(`/api/conf/${confId}/delegates/${delegateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feePaid: true,
            amountPaid: payload.feeAmount ?? 0,
            status: "CONFIRMED",
          }),
        });
      }

      await reloadAll(confId);
      setShowForm(false);
      const updatedExisting = Boolean(
        (createdPayload as { updatedExisting?: boolean }).updatedExisting,
      );
      setNotice(
        updatedExisting
          ? "Existing delegate registration updated successfully."
          : payload.feePaid
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
    kind: "passport" | "booklet" | "entry-stamp" | "visa",
    file: File | null,
  ) => {
    if (!confId || !file || uploadingDocKey) return;
    const validation = await validateDelegateUploadFile(file, kind);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const key = `${delegateId}:${kind}`;
    setUploadingDocKey(key);
    setError(null);
    setNotice(null);

    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);

      const res = await fetch(
        `/api/conf/${confId}/delegates/${delegateId}/self-documents`,
        {
          method: "POST",
          body: fd,
        },
      );

      const payload = await parseUploadErrorPayload(res);
      if (!res.ok) {
        throw new Error(
          formatUploadError(
            payload,
            `Failed to replace ${kind} file`,
            res.status,
          ),
        );
      }

      await loadDelegates(confId);
      setNotice(
        kind === "booklet"
          ? "Booklet photo updated successfully."
          : kind === "entry-stamp"
            ? "Last entry stamp updated successfully."
            : kind === "visa"
              ? "Current visa updated successfully."
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
        amountPaid: nextPaid ? (delegate.feeAmount ?? delegate.amountPaid ?? 0) : 0,
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

  const deleteDelegate = async (delegate: Delegate) => {
    if (!confId) return;
    if (
      !window.confirm(
        `Delete ${delegate.name}? This will remove their registration and related pairing/room records.`,
      )
    ) {
      return;
    }

    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/conf/${confId}/delegates/${delegate.id}`, {
        method: "DELETE",
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to delete delegate");
      }
      await reloadAll(confId);
      setNotice(`Deleted ${delegate.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete delegate");
    }
  };

  const handleCreatePairRequest = async () => {
    if (!confId || pairingBusy) return;

    const effectiveRequesterId = canManagePairing
      ? requesterId
      : currentDelegateId ?? "";
    if (!effectiveRequesterId) return;

    let effectiveRequestType = requestType;
    let effectiveTargetId = targetId;

    if (!canManagePairing) {
      if (selfPairingMode === "with-guest") {
        effectiveRequestType = "SINGLE_ROOM";
        effectiveTargetId = "";
      } else if (selfPairingMode === "single-room") {
        effectiveRequestType = "SINGLE_ROOM";
        effectiveTargetId = "";
      } else {
        effectiveRequestType = "STANDARD_PAIR";
        if (!effectiveTargetId) return;
      }
    }

    if (effectiveRequestType !== "SINGLE_ROOM" && !effectiveTargetId) return;

    setPairingBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/conf/${confId}/pair-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: effectiveRequesterId,
          targetId:
            effectiveRequestType === "SINGLE_ROOM" ? null : effectiveTargetId,
          requestType: effectiveRequestType,
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
      setPairingAvailable(await loadPairingData(confId));
      setNotice("Pairing request submitted.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to create pair request",
      );
    } finally {
      setPairingBusy(false);
    }
  };

  const handleDeletePairRequest = async (request: PairRequest) => {
    if (!confId || pairingBusy || !canManagePairing) return;
    if (
      !window.confirm(
        `Delete pairing request from ${request.requester.name}?`,
      )
    ) {
      return;
    }

    setPairingBusy(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/conf/${confId}/pair-requests/${request.id}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to delete pair request");
      }
      setPairingAvailable(await loadPairingData(confId));
      setNotice("Pairing request deleted.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to delete pair request",
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

      setPairingAvailable(await loadPairingData(confId));
      await loadDelegates(confId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to update pair request",
      );
    } finally {
      setPairingBusy(false);
    }
  };

  const refreshPairingWorkspace = async () => {
    if (!confId) return;
    setPairingAvailable(await loadPairingData(confId));
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
          <Link href="/tools/conf/booklet">
            <Button variant="outline" size="sm">
              <BookOpen className="size-4" />
              Booklet Builder
            </Button>
          </Link>
          {isAdminControl ? (
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              <Plus className="size-4" />
              Register Delegate
            </Button>
          ) : (
            <Link href="/tools/conf/delegates/register">
              <Button size="sm">
                <Plus className="size-4" />
                Open Registration Form
              </Button>
            </Link>
          )}
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

      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          canViewPaymentStats ? "lg:grid-cols-4" : "lg:grid-cols-2"
        }`}
      >
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
        {canViewPaymentStats && (
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
        )}
        {canViewPaymentStats && (
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
        )}
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

      {showForm && isAdminControl && (
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
              defaultFeeAmount={defaultFeeAmount}
              draftKey="manager-new"
              onCancel={() => setShowForm(false)}
              onSubmit={handleRegister}
            />
          </CardContent>
        </Card>
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

      {delegates.length > 0 && (
        <ParticipantsDataTable
          delegates={delegates}
          confId={confId}
          currentUserId={user?.id ?? null}
          currentUserEmail={user?.email ?? null}
          isAdminControl={Boolean(isAdminControl)}
          canDeleteDelegates={canDeleteDelegates}
          canManagePayments={isAdminControl}
          canViewDelegateDetails={canViewDelegateDetails}
          uploadingDocKey={uploadingDocKey}
          onTogglePaid={(row) => {
            const delegate = delegates.find((item) => item.id === row.id);
            if (!delegate) return;
            void togglePaid(delegate);
          }}
          onReplaceDocument={handleReplaceDelegateDocument}
          onDeleteDelegate={(row) => {
            const delegate = delegates.find((item) => item.id === row.id);
            if (!delegate) return;
            void deleteDelegate(delegate);
          }}
        />
      )}

      {pairingAvailable ? (
        <>
          <div className="flex items-center gap-2 pt-2">
            <div className="rounded-lg bg-[#C8A061]/10 p-2">
              <BedDouble className="size-5 text-[#C8A061]" />
            </div>
            <div>
              <h3 className="font-semibold leading-none">Room Pairing</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canManagePairing
                  ? "Manage roommate pairing requests and room assignments. Same-gender by default — legal partner exceptions require chair approval."
                  : "View your room assignment and manage your own pairing requests. Other delegates' pairings are private."}
              </p>
            </div>
          </div>

          {!canManagePairing && myDelegate && (
            <Card className="border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-base">My Room</CardTitle>
                <CardDescription>
                  Your room assignment and companion guests (if any).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myAssignment ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        Room {myAssignment.roomCode}
                      </Badge>
                      <Badge variant="outline">{myAssignment.status}</Badge>
                    </div>
                    {myRoommate ? (
                      <p className="text-sm">
                        Roommate:{" "}
                        <span className="font-medium">{myRoommate.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {myRoommate.delegateCode || "N/A"}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Single room assignment
                      </p>
                    )}
                    {myCompanionGuests.length > 0 && (
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {myCompanionGuests.map((guest) => (
                          <li key={guest.id}>
                            Guest: {guest.name}
                            <span className="ml-1 italic">(companion guest)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {myAssignment.overrideReason && (
                      <p className="text-xs text-amber-700">
                        {myAssignment.overrideReason}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You do not have a room assignment yet. Submit a pairing
                    request below or wait for committee assignment.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {canManagePairing ? "Pairing Requests" : "My Pairing Requests"}
              </CardTitle>
              <CardDescription>
                {canManagePairing
                  ? "Submit and review pairing requests. Only fully paid delegates appear in requester and target lists."
                  : "Send and track your own pairing requests. You cannot see other delegates' requests."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManagePairing ? (
                <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Requester</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                      value={requesterId}
                      onChange={(e) => setRequesterId(e.target.value)}
                    >
                      <option value="">Select delegate</option>
                      {pairEligibleDelegates.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.delegateCode || "N/A"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
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
                      <option value="LEGAL_PARTNER">
                        Legal Partner Exception
                      </option>
                      <option value="SINGLE_ROOM">Single Room Request</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Delegate</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      disabled={requestType === "SINGLE_ROOM"}
                    >
                      <option value="">
                        {requestType === "SINGLE_ROOM"
                          ? "Not needed"
                          : "Select delegate"}
                      </option>
                      {pairEligibleDelegates
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
              ) : (
                myDelegate && (
                  <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>What do you need?</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                        value={selfPairingMode}
                        onChange={(e) =>
                          setSelfPairingMode(
                            e.target.value as typeof selfPairingMode,
                          )
                        }
                      >
                        {canSelfAssignWithGuest && (
                          <option value="with-guest">
                            Single room with my guest(s)
                          </option>
                        )}
                        <option value="with-delegate">
                          Pair with another delegate
                        </option>
                        <option value="single-room">Single room request</option>
                      </select>
                      {selfPairingMode === "with-guest" &&
                        myDelegate &&
                        conferencePackageIncludesGuest(myDelegate.feePackageId) && (
                          <p className="text-xs text-muted-foreground">
                            Your registered guest
                            {myDelegate.guestCount === 1 ? "" : "s"} will share
                            your room once assigned.
                          </p>
                        )}
                    </div>

                    {selfPairingMode === "with-delegate" && (
                      <div className="space-y-2">
                        <Label>Choose a roommate</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                        >
                          <option value="">Select delegate</option>
                          {selfPairingEligibleTargets.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.delegateCode || "N/A"})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2 sm:col-span-2">
                      <Label>Note</Label>
                      <Input
                        placeholder="Optional context for the committee"
                        value={requestNote}
                        onChange={(e) => setRequestNote(e.target.value)}
                      />
                    </div>
                  </div>
                )
              )}

              {(canManagePairing || myDelegate) && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleCreatePairRequest}
                    disabled={
                      pairingBusy ||
                      (canManagePairing
                        ? !requesterId
                        : selfPairingMode === "with-delegate" && !targetId)
                    }
                  >
                    <Shuffle className="size-4" />
                    Submit Pair Request
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {pairRequests.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
                    <BedDouble className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {canManagePairing
                        ? "No pairing requests yet."
                        : "You have no pairing requests yet."}
                    </p>
                  </div>
                )}

                {pairRequests.map((request) => {
                  const isRequester =
                    currentDelegateId === request.requesterId;
                  const isTarget = currentDelegateId === request.targetId;

                  return (
                    <div
                      key={request.id}
                      className="rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">
                            {canManagePairing ? (
                              <>
                                {request.requester.name}
                                {request.target ? (
                                  <>
                                    <span className="mx-1.5 text-muted-foreground">
                                      →
                                    </span>
                                    {request.target.name}
                                  </>
                                ) : (
                                  <span className="ml-1.5 text-muted-foreground text-xs">
                                    (Single room request)
                                  </span>
                                )}
                              </>
                            ) : isRequester ? (
                              request.target ? (
                                <>
                                  To: {request.target.name}
                                </>
                              ) : (
                                "Single room request"
                              )
                            ) : (
                              <>From: {request.requester.name}</>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="capitalize">
                              {request.requestType.replace(/_/g, " ").toLowerCase()}
                            </span>
                            {" · "}
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                          {request.note && (
                            <p className="mt-1 text-xs text-muted-foreground italic">
                              &ldquo;{request.note}&rdquo;
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${PAIR_STATUS_COLOR[request.status]}`}
                        >
                          {request.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {request.status === "PENDING" &&
                          request.targetId &&
                          (canManagePairing || isTarget) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePairAction(request, "accept")
                                }
                                disabled={pairingBusy}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePairAction(request, "decline")
                                }
                                disabled={pairingBusy}
                              >
                                Decline
                              </Button>
                            </>
                          )}

                        {request.status === "PENDING" &&
                          (canManagePairing || isRequester) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handlePairAction(request, "cancel")
                              }
                              disabled={pairingBusy}
                            >
                              Cancel
                            </Button>
                          )}

                        {(request.status === "PENDING" ||
                          request.status === "ACCEPTED") &&
                          canManagePairing && (
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePairRequest(request)}
                                disabled={pairingBusy}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {canManagePairing ? (
            <RoomAssignmentWorkspace
              confId={confId}
              assignments={assignments}
              delegates={delegates}
              isAdminControl={canManagePairing}
              busy={pairingBusy}
              onRefresh={async () => {
                if (confId) {
                  setPairingAvailable(await loadPairingData(confId));
                }
              }}
              onError={setError}
              onNotice={setNotice}
            />
          ) : null}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BedDouble className="size-4 text-[#C8A061]" />
              Room Pairing
            </CardTitle>
            <CardDescription>
              Pairing requests and room assignments appear after signing in as
              a delegate or conference manager.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

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
