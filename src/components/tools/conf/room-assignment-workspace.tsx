"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Pencil,
  UserMinus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCompanionGuestsForRoomDisplay,
  guestOccupantValue,
  isDelegateEligibleForGuestSelfRoom,
  isDelegateEligibleForRoomAssignment,
  isDelegateEligibleForRoomPairing,
  isGuestOccupantValue,
  parseGuestOccupantValue,
  requiresCrossGenderOverrideReason,
  resolveOccupantBSelection,
  type RoomAssignmentGuest,
} from "@/lib/conf/room-pairing-eligibility";
import {
  OccupantGuestLines,
  OccupantsCell,
  ROOM_ASSIGNMENT_STATUS_COLOR,
  RoomAssignmentViewModeToggle,
  companionGuestNamesForAssignment,
  companionGuestsForOccupant,
  roomAssignmentTypeLabel,
  roomOccupantSummary,
  type RoomAssignmentOccupant,
  type RoomAssignmentRow,
  type RoomAssignmentViewMode,
} from "@/components/tools/conf/room-assignment-display";

export type { RoomAssignmentOccupant, RoomAssignmentRow };

export type RoomAssignmentDelegate = {
  id: string;
  name: string;
  delegateCode: string | null;
  gender: "MALE" | "FEMALE" | null;
  city: string;
  feePaid: boolean;
  amountPaid: number | null;
  feeAmount: number | null;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  feePackageId: string | null;
  guestCount: number;
  partnerClaimNote: string | null;
  bringingForeignGuest: "YES" | "NO" | "OTHER" | null;
  guests?: RoomAssignmentGuest[];
};

type Props = {
  confId: string;
  assignments: RoomAssignmentRow[];
  delegates: RoomAssignmentDelegate[];
  isAdminControl: boolean;
  busy: boolean;
  onRefresh: () => Promise<void>;
  onError: (message: string | null) => void;
  onNotice: (message: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
};

type ViewMode = RoomAssignmentViewMode;
type ManualAssignmentMode = "with-guest" | "with-delegate";

function matchesSearch(value: string, query: string) {
  if (!query.trim()) return true;
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function nextAutoRoomCode(assignments: RoomAssignmentRow[]) {
  const autoRoomPattern = /^RM-(\d+)$/i;
  const existingAutoCodes = new Set<string>();
  let maxSequence = 0;

  for (const assignment of assignments) {
    const code = assignment.roomCode.trim();
    const normalizedCode = code.toUpperCase();
    existingAutoCodes.add(normalizedCode);

    const match = normalizedCode.match(autoRoomPattern);
    if (!match) continue;
    const sequence = Number.parseInt(match[1], 10);
    if (Number.isFinite(sequence)) {
      maxSequence = Math.max(maxSequence, sequence);
    }
  }

  let nextSequence = maxSequence + 1;
  while (true) {
    const candidate = `RM-${String(nextSequence).padStart(3, "0")}`;
    if (!existingAutoCodes.has(candidate)) {
      return candidate;
    }
    nextSequence += 1;
  }
}

function companionGuestsForDelegate(
  delegate: Pick<
    RoomAssignmentDelegate,
    | "feePackageId"
    | "guestCount"
    | "roomPref"
    | "wantsSingleRoom"
    | "accommodationNeeded"
    | "feePaid"
    | "amountPaid"
    | "feeAmount"
    | "status"
    | "guests"
  >,
  hasPairPartner = false,
) {
  return getCompanionGuestsForRoomDisplay(
    {
      feePackageId: delegate.feePackageId,
      guestCount: delegate.guestCount,
      roomPref: delegate.roomPref,
      wantsSingleRoom: delegate.wantsSingleRoom,
      accommodationNeeded: delegate.accommodationNeeded,
      feePaid: delegate.feePaid,
      amountPaid: delegate.amountPaid,
      feeAmount: delegate.feeAmount,
      status: delegate.status,
      guests: delegate.guests,
    },
    { hasPairPartner },
  );
}

function validateManualAssignmentInput({
  occupantA,
  occupantBValue,
  overrideReason,
  delegates,
  assignedDelegateIds,
}: {
  occupantA: RoomAssignmentDelegate | null;
  occupantBValue: string;
  overrideReason: string;
  delegates: RoomAssignmentDelegate[];
  assignedDelegateIds: Set<string>;
}): string | null {
  if (!occupantA) {
    return "Select a primary delegate (Occupant A).";
  }

  if (assignedDelegateIds.has(occupantA.id)) {
    return `${occupantA.name} already has an active room assignment. Edit that row instead of creating a new one.`;
  }

  const { occupantBId, companionGuestId } =
    resolveOccupantBSelection(occupantBValue);

  if (companionGuestId) {
    if (!isDelegateEligibleForGuestSelfRoom(occupantA)) {
      return `${occupantA.name} is not eligible for a single room with guest(s).`;
    }

    const knownGuestIds = new Set((occupantA.guests ?? []).map((guest) => guest.id));
    if (knownGuestIds.size > 0 && !knownGuestIds.has(companionGuestId)) {
      return "Selected guest does not belong to the primary delegate.";
    }

    return null;
  }

  if (occupantBId) {
    if (assignedDelegateIds.has(occupantBId)) {
      const occupantB = delegates.find((delegate) => delegate.id === occupantBId);
      return `${occupantB?.name ?? "The selected delegate"} already has an active room assignment.`;
    }

    if (!isDelegateEligibleForRoomPairing(occupantA)) {
      return `${occupantA.name} is not eligible for delegate pairing.`;
    }

    const occupantB = delegates.find((delegate) => delegate.id === occupantBId);
    if (!occupantB) {
      return "Second delegate not found.";
    }

    if (!isDelegateEligibleForRoomPairing(occupantB)) {
      return `${occupantB.name} is not eligible for delegate pairing.`;
    }

    if (
      requiresCrossGenderOverrideReason(occupantA, occupantB) &&
      !overrideReason.trim()
    ) {
      return "Cross-gender delegate pairing requires an override reason.";
    }

    return null;
  }

  if (!isDelegateEligibleForRoomAssignment(occupantA)) {
    return `${occupantA.name} is not eligible for room assignment (payment or accommodation rules).`;
  }

  return null;
}

function OccupantBSelectOptions({
  guestOptions,
  delegateOptions,
}: {
  guestOptions: Array<{ value: string; label: string }>;
  delegateOptions: Array<{
    id: string;
    name: string;
    delegateCode: string | null;
  }>;
}) {
  return (
    <>
      <option value="">Single room</option>
      {guestOptions.length > 0 ? (
        <optgroup label="Guests">
          {guestOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ) : null}
      {delegateOptions.length > 0 ? (
        <optgroup label="Delegates">
          {delegateOptions.map((delegate) => (
            <option key={delegate.id} value={delegate.id}>
              {delegate.name} ({delegate.delegateCode || "N/A"})
            </option>
          ))}
        </optgroup>
      ) : null}
    </>
  );
}

export function RoomAssignmentWorkspace({
  confId,
  assignments,
  delegates,
  isAdminControl,
  busy,
  onRefresh,
  onError,
  onNotice,
  onBusyChange,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [manualA, setManualA] = useState("");
  const [manualB, setManualB] = useState("");
  const [manualASearch, setManualASearch] = useState("");
  const [manualBSearch, setManualBSearch] = useState("");
  const [manualRoomCode, setManualRoomCode] = useState("");
  const [manualOverride, setManualOverride] = useState("");
  const [manualAssignmentMode, setManualAssignmentMode] =
    useState<ManualAssignmentMode>("with-guest");

  const selectedManualDelegate = useMemo(
    () => delegates.find((d) => d.id === manualA) ?? null,
    [delegates, manualA],
  );

  const manualGuestPreview = useMemo(() => {
    if (!selectedManualDelegate) return [];
    return companionGuestsForDelegate(
      selectedManualDelegate,
      manualAssignmentMode === "with-delegate" || Boolean(manualB && !isGuestOccupantValue(manualB)),
    );
  }, [selectedManualDelegate, manualAssignmentMode, manualB]);

  const manualGuestOptions = useMemo(() => {
    if (!selectedManualDelegate) return [];
    if (!isDelegateEligibleForGuestSelfRoom(selectedManualDelegate)) return [];
    return companionGuestsForDelegate(selectedManualDelegate).map((guest) => ({
      value: guestOccupantValue(guest.id),
      label: `Guest: ${guest.name} (guest of ${selectedManualDelegate.name})`,
    }));
  }, [selectedManualDelegate]);

  const canAssignWithGuest = Boolean(
    selectedManualDelegate &&
      isDelegateEligibleForGuestSelfRoom(selectedManualDelegate),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoomCode, setEditRoomCode] = useState("");
  const [editA, setEditA] = useState("");
  const [editB, setEditB] = useState("");
  const [editOverride, setEditOverride] = useState("");

  const assignedDelegateIds = useMemo(() => {
    const ids = new Set<string>();
    for (const assignment of assignments) {
      if (assignment.status === "CANCELLED") continue;
      ids.add(assignment.occupantA.id);
      if (assignment.occupantB) ids.add(assignment.occupantB.id);
    }
    return ids;
  }, [assignments]);

  const pairingEligibleDelegates = useMemo(
    () =>
      delegates.filter(
        (d) =>
          isDelegateEligibleForRoomPairing(d) && !assignedDelegateIds.has(d.id),
      ),
    [delegates, assignedDelegateIds],
  );

  const assignmentEligibleDelegates = useMemo(
    () =>
      delegates.filter(
        (d) =>
          isDelegateEligibleForRoomAssignment(d) &&
          !assignedDelegateIds.has(d.id),
      ),
    [delegates, assignedDelegateIds],
  );

  const suggestedRoomCode = useMemo(
    () => nextAutoRoomCode(assignments),
    [assignments],
  );

  useEffect(() => {
    if (!manualRoomCode.trim()) {
      setManualRoomCode(suggestedRoomCode);
    }
  }, [suggestedRoomCode, manualRoomCode]);

  const filteredAssignmentEligibleDelegates = useMemo(
    () =>
      assignmentEligibleDelegates.filter((delegate) =>
        matchesSearch(
          `${delegate.name} ${delegate.delegateCode ?? ""}`,
          manualASearch,
        ),
      ),
    [assignmentEligibleDelegates, manualASearch],
  );

  const filteredManualGuestOptions = useMemo(
    () =>
      manualGuestOptions.filter((option) =>
        matchesSearch(option.label, manualBSearch),
      ),
    [manualGuestOptions, manualBSearch],
  );

  const filteredPairingEligibleDelegates = useMemo(
    () =>
      pairingEligibleDelegates
        .filter((delegate) => delegate.id !== manualA)
        .filter((delegate) =>
          matchesSearch(
            `${delegate.name} ${delegate.delegateCode ?? ""}`,
            manualBSearch,
          ),
        ),
    [pairingEligibleDelegates, manualA, manualBSearch],
  );

  const manualBGuestOptionsForSelect = useMemo(() => {
    if (!manualB || !isGuestOccupantValue(manualB)) {
      return filteredManualGuestOptions;
    }
    if (
      filteredManualGuestOptions.some((option) => option.value === manualB)
    ) {
      return filteredManualGuestOptions;
    }

    const selectedGuest = manualGuestOptions.find(
      (option) => option.value === manualB,
    );
    return selectedGuest
      ? [selectedGuest, ...filteredManualGuestOptions]
      : filteredManualGuestOptions;
  }, [manualB, manualGuestOptions, filteredManualGuestOptions]);

  const manualBDelegateOptionsForSelect = useMemo(() => {
    if (!manualB || isGuestOccupantValue(manualB)) {
      return filteredPairingEligibleDelegates;
    }
    if (
      filteredPairingEligibleDelegates.some((delegate) => delegate.id === manualB)
    ) {
      return filteredPairingEligibleDelegates;
    }

    const selectedDelegate = pairingEligibleDelegates.find(
      (delegate) => delegate.id === manualB,
    );
    return selectedDelegate
      ? [selectedDelegate, ...filteredPairingEligibleDelegates]
      : filteredPairingEligibleDelegates;
  }, [manualB, pairingEligibleDelegates, filteredPairingEligibleDelegates]);

  const showManualAssignmentMode = Boolean(
    selectedManualDelegate &&
      (selectedManualDelegate.guestCount ?? 0) > 0 &&
      (canAssignWithGuest ||
        pairingEligibleDelegates.some((d) => d.id !== selectedManualDelegate.id)),
  );

  const activeAssignments = useMemo(
    () =>
      assignments
        .filter((a) => a.status !== "CANCELLED")
        .sort((a, b) => a.roomCode.localeCompare(b.roomCode)),
    [assignments],
  );

  const totalPages = Math.max(1, Math.ceil(activeAssignments.length / pageSize));
  const effectivePage = Math.min(page, totalPages);

  const paginatedAssignments = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return activeAssignments.slice(start, start + pageSize);
  }, [activeAssignments, effectivePage, pageSize]);

  const occupantOptionsForEdit = (
    currentAssignment: RoomAssignmentRow,
    slot: "A" | "B",
  ) => {
    const currentId =
      slot === "A"
        ? currentAssignment.occupantA.id
        : (currentAssignment.occupantB?.id ?? "");
    const otherEditId = slot === "A" ? editB : editA;

    const pool =
      slot === "B"
        ? pairingEligibleDelegates
        : assignmentEligibleDelegates;

    const options = pool.filter((d) => d.id !== otherEditId);
    const currentDelegate = delegates.find((d) => d.id === currentId);
    if (
      currentDelegate &&
      !options.some((d) => d.id === currentDelegate.id)
    ) {
      options.unshift(currentDelegate);
    }
    return options;
  };

  const guestOptionsForPrimary = (
    primaryDelegateId: string,
    currentGuestValue = "",
  ) => {
    const primary = delegates.find((d) => d.id === primaryDelegateId) ?? null;
    if (!primary || !isDelegateEligibleForGuestSelfRoom(primary)) return [];

    const options = companionGuestsForDelegate(primary).map((guest) => ({
      value: guestOccupantValue(guest.id),
      label: `Guest: ${guest.name} (guest of ${primary.name})`,
    }));

    if (
      currentGuestValue &&
      isGuestOccupantValue(currentGuestValue) &&
      !options.some((option) => option.value === currentGuestValue)
    ) {
      const guestId = parseGuestOccupantValue(currentGuestValue);
      const guest = guestId
        ? primary.guests?.find((item) => item.id === guestId)
        : undefined;
      if (guest) {
        options.unshift({
          value: currentGuestValue,
          label: `Guest: ${guest.name} (guest of ${primary.name})`,
        });
      }
    }

    return options;
  };

  const startEdit = (assignment: RoomAssignmentRow) => {
    setEditingId(assignment.id);
    setEditRoomCode(assignment.roomCode);
    setEditA(assignment.occupantA.id);
    setEditB(assignment.occupantB?.id ?? "");
    setEditOverride(assignment.overrideReason ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRoomCode("");
    setEditA("");
    setEditB("");
    setEditOverride("");
  };

  const handleCreate = async () => {
    if (busy || submitting) return;

    const validationError = validateManualAssignmentInput({
      occupantA: selectedManualDelegate,
      occupantBValue: manualB,
      overrideReason: manualOverride,
      delegates,
      assignedDelegateIds,
    });

    if (validationError) {
      setFormError(validationError);
      onError(validationError);
      return;
    }

    const { occupantBId, companionGuestId } =
      resolveOccupantBSelection(manualB);

    setSubmitting(true);
    onBusyChange?.(true);
    setFormError(null);
    onError(null);
    onNotice(null);

    try {
      const res = await fetch(`/api/conf/${confId}/room-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupantAId: manualA,
          occupantBId,
          companionGuestId,
          roomCode: manualRoomCode.trim() || null,
          overrideReason: manualOverride.trim() || null,
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
      setManualAssignmentMode("with-guest");
      setFormError(null);
      await onRefresh();
      onNotice("Room assignment created.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to assign room";
      setFormError(message);
      onError(message);
    } finally {
      setSubmitting(false);
      onBusyChange?.(false);
    }
  };

  const handleSaveEdit = async (assignmentId: string) => {
    if (busy || submitting || !editA || !editRoomCode.trim()) return;

    const editDelegateA = delegates.find((delegate) => delegate.id === editA) ?? null;
    const validationError = validateManualAssignmentInput({
      occupantA: editDelegateA,
      occupantBValue: editB,
      overrideReason: editOverride,
      delegates,
      assignedDelegateIds: new Set(
        [...assignedDelegateIds].filter((id) => {
          const assignment = assignments.find((item) => item.id === assignmentId);
          if (!assignment || assignment.status === "CANCELLED") return true;
          return id !== assignment.occupantA.id && id !== assignment.occupantB?.id;
        }),
      ),
    });

    if (validationError) {
      onError(validationError);
      return;
    }

    const { occupantBId, companionGuestId } = resolveOccupantBSelection(editB);

    setSubmitting(true);
    onBusyChange?.(true);
    onError(null);
    onNotice(null);

    try {
      const res = await fetch(
        `/api/conf/${confId}/room-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: editRoomCode.trim(),
            occupantAId: editA,
            occupantBId,
            companionGuestId,
            overrideReason: editOverride.trim() || null,
          }),
        },
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to update room assignment");
      }

      cancelEdit();
      await onRefresh();
      onNotice("Room assignment updated.");
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Failed to update room assignment",
      );
    } finally {
      setSubmitting(false);
      onBusyChange?.(false);
    }
  };

  const handleUnassign = async (assignment: RoomAssignmentRow) => {
    const label = roomOccupantSummary(assignment);
    if (
      !window.confirm(
        `Unassign ${label} from room ${assignment.roomCode}? They will be free for re-pairing.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/conf/${confId}/room-assignments/${assignment.id}`,
        { method: "DELETE" },
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to unassign room");
      }

      if (editingId === assignment.id) cancelEdit();
      await onRefresh();
      onNotice(`Unassigned ${label} from room ${assignment.roomCode}.`);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to unassign room");
    }
  };

  const paginationFooter =
    activeAssignments.length > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <p>
          Showing {(effectivePage - 1) * pageSize + 1} -{" "}
          {Math.min(effectivePage * pageSize, activeAssignments.length)} of{" "}
          {activeAssignments.length} assigned
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={effectivePage <= 1}
          >
            Prev
          </Button>
          <span>
            Page {effectivePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={effectivePage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Room Assignment Workspace</CardTitle>
            <CardDescription>
              Assign paid delegates to rooms. Only fully paid delegates appear in
              pairing dropdowns. Companion guests appear in Occupant B for
              guest-package delegates (single room with guest).
            </CardDescription>
          </div>
          <RoomAssignmentViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdminControl && (
          <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Occupant A</Label>
              <Input
                value={manualASearch}
                onChange={(e) => setManualASearch(e.target.value)}
                placeholder="Search name or code"
                className="h-8"
              />
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                value={manualA}
                onChange={(e) => {
                  const nextA = e.target.value;
                  setManualA(nextA);
                  setManualAssignmentMode("with-guest");

                  const nextDelegate =
                    delegates.find((delegate) => delegate.id === nextA) ?? null;
                  const nextGuestOptions = nextDelegate
                    ? companionGuestsForDelegate(nextDelegate)
                    : [];
                  if (
                    nextDelegate &&
                    isDelegateEligibleForGuestSelfRoom(nextDelegate) &&
                    nextGuestOptions.length > 0
                  ) {
                    setManualB(guestOccupantValue(nextGuestOptions[0].id));
                  } else {
                    setManualB("");
                  }
                }}
              >
                <option value="">Select delegate</option>
                {filteredAssignmentEligibleDelegates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.delegateCode || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            {showManualAssignmentMode && (
              <div className="space-y-2 xl:col-span-2">
                <Label>Assignment Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                  value={manualAssignmentMode}
                  onChange={(e) => {
                    const mode = e.target.value as ManualAssignmentMode;
                    setManualAssignmentMode(mode);
                    if (mode === "with-guest") {
                      const firstGuest = manualGuestOptions[0];
                      setManualB(firstGuest ? firstGuest.value : "");
                    } else if (isGuestOccupantValue(manualB)) {
                      setManualB("");
                    }
                  }}
                >
                  <option value="with-guest" disabled={!canAssignWithGuest}>
                    Single room with guest(s)
                  </option>
                  <option value="with-delegate">
                    Pair with another delegate
                  </option>
                </select>
                {manualAssignmentMode === "with-guest" &&
                  (manualGuestPreview.length > 0 ? (
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      {manualGuestPreview.map((guest) => (
                        <li key={guest.id}>
                          Guest: {guest.name}
                          <span className="ml-1 italic">(companion guest)</span>
                        </li>
                      ))}
                    </ul>
                  ) : canAssignWithGuest ? (
                    <p className="text-xs text-muted-foreground">
                      {selectedManualDelegate?.guestCount ?? 0} registered guest
                      {(selectedManualDelegate?.guestCount ?? 0) === 1
                        ? ""
                        : "s"}{" "}
                      will share this room.
                    </p>
                  ) : null)}
              </div>
            )}

            <div className="space-y-2">
              <Label>Occupant B (optional)</Label>
              <Input
                value={manualBSearch}
                onChange={(e) => setManualBSearch(e.target.value)}
                placeholder="Search guest or delegate"
                className="h-8"
              />
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                value={manualB}
                onChange={(e) => {
                  const nextB = e.target.value;
                  setManualB(nextB);
                  if (isGuestOccupantValue(nextB)) {
                    setManualAssignmentMode("with-guest");
                  } else if (nextB) {
                    setManualAssignmentMode("with-delegate");
                  }
                }}
              >
                <OccupantBSelectOptions
                  guestOptions={manualBGuestOptionsForSelect}
                  delegateOptions={manualBDelegateOptionsForSelect}
                />
              </select>
            </div>

            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="e.g. RM-001 or A-204"
                value={manualRoomCode}
                onChange={(e) => setManualRoomCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-suggested next room: {suggestedRoomCode}
              </p>
            </div>

            <div className="space-y-2 xl:col-span-2">
              <Label>
                Override Reason (required for cross-gender delegate pairing)
              </Label>
              <Textarea
                placeholder="Required only when pairing two delegates of different genders"
                value={manualOverride}
                onChange={(e) => {
                  setManualOverride(e.target.value);
                  if (formError) setFormError(null);
                }}
                rows={1}
              />
            </div>

            <div className="xl:col-span-5 space-y-2">
              {formError ? (
                <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {formError}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreate}
                  disabled={!manualA || busy || submitting}
                >
                  <BedDouble className="size-4" />
                  {submitting ? "Assigning..." : "Assign Room"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {viewMode === "table" ? (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Room</th>
                    <th className="px-3 py-2 font-medium">Occupant(s)</th>
                    <th className="px-3 py-2 font-medium">Guests</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    {isAdminControl && (
                      <th className="px-3 py-2 font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssignments.map((assignment) => {
                    const isEditing = editingId === assignment.id;

                    if (isEditing) {
                      return (
                        <tr
                          key={assignment.id}
                          className="border-b border-border bg-muted/20"
                        >
                          <td className="px-3 py-2 align-top">
                            <Input
                              value={editRoomCode}
                              onChange={(e) => setEditRoomCode(e.target.value)}
                              className="h-8"
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="space-y-2">
                              <select
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                value={editA}
                                onChange={(e) => setEditA(e.target.value)}
                              >
                                {occupantOptionsForEdit(assignment, "A").map(
                                  (d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name}
                                    </option>
                                  ),
                                )}
                              </select>
                              <select
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                value={editB}
                                onChange={(e) => setEditB(e.target.value)}
                              >
                                <OccupantBSelectOptions
                                  guestOptions={guestOptionsForPrimary(editA, editB)}
                                  delegateOptions={occupantOptionsForEdit(
                                    assignment,
                                    "B",
                                  )}
                                />
                              </select>
                              <Textarea
                                placeholder="Override reason (if cross-gender)"
                                value={editOverride}
                                onChange={(e) => setEditOverride(e.target.value)}
                                rows={1}
                                className="text-xs"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                            —
                          </td>
                          <td className="px-3 py-2 align-top text-muted-foreground">
                            {editB && !isGuestOccupantValue(editB) ? "Pair" : "Single"}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Badge
                              variant="outline"
                              className={`text-xs ${ROOM_ASSIGNMENT_STATUS_COLOR[assignment.status]}`}
                            >
                              {assignment.status}
                            </Badge>
                          </td>
                          {isAdminControl && (
                            <td className="px-3 py-2 align-top">
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleSaveEdit(assignment.id)}
                                  disabled={busy || submitting || !editRoomCode.trim()}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={cancelEdit}
                                  disabled={busy}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={assignment.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-3 py-2 font-medium">
                          {assignment.roomCode}
                        </td>
                        <td className="px-3 py-2">
                          <OccupantsCell assignment={assignment} />
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {[
                            ...companionGuestsForOccupant(
                              assignment.occupantA,
                              Boolean(assignment.occupantB),
                            ),
                            ...(assignment.occupantB
                              ? companionGuestsForOccupant(assignment.occupantB)
                              : []),
                          ]
                            .map((g) => g.name)
                            .join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {roomAssignmentTypeLabel(assignment)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${ROOM_ASSIGNMENT_STATUS_COLOR[assignment.status]}`}
                          >
                            {assignment.status}
                          </Badge>
                        </td>
                        {isAdminControl && (
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => startEdit(assignment)}
                                disabled={busy}
                              >
                                <Pencil className="size-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => handleUnassign(assignment)}
                                disabled={busy}
                              >
                                <UserMinus className="size-3" />
                                Unassign
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {activeAssignments.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
                <BedDouble className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No active room assignments yet.
                </p>
              </div>
            )}
            {paginationFooter}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedAssignments.map((assignment) => {
                const isEditing = editingId === assignment.id;

                return (
                  <Card key={assignment.id} className="border-border">
                    <CardContent className="space-y-3 pt-4">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Room Number</Label>
                            <Input
                              value={editRoomCode}
                              onChange={(e) => setEditRoomCode(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Occupant A</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              value={editA}
                              onChange={(e) => setEditA(e.target.value)}
                            >
                              {occupantOptionsForEdit(assignment, "A").map(
                                (d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Occupant B</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              value={editB}
                              onChange={(e) => setEditB(e.target.value)}
                            >
                              <OccupantBSelectOptions
                                guestOptions={guestOptionsForPrimary(editA, editB)}
                                delegateOptions={occupantOptionsForEdit(
                                  assignment,
                                  "B",
                                )}
                              />
                            </select>
                          </div>
                          <Textarea
                            placeholder="Override reason (if cross-gender)"
                            value={editOverride}
                            onChange={(e) => setEditOverride(e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(assignment.id)}
                              disabled={busy || !editRoomCode.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              disabled={busy}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <BedDouble className="size-4 text-[#C8A061]" />
                              <p className="font-semibold text-sm">
                                Room {assignment.roomCode}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${ROOM_ASSIGNMENT_STATUS_COLOR[assignment.status]}`}
                            >
                              {assignment.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium leading-snug">
                            {assignment.occupantA.name}
                            {assignment.occupantB
                              ? ` + ${assignment.occupantB.name}`
                              : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {roomAssignmentTypeLabel(assignment)} ·{" "}
                            {assignment.occupantA.delegateCode || "N/A"}
                            {assignment.occupantB
                              ? ` / ${assignment.occupantB.delegateCode || "N/A"}`
                              : ""}
                          </p>
                          <OccupantGuestLines
                            occupant={assignment.occupantA}
                            hasPairPartner={Boolean(assignment.occupantB)}
                          />
                          {assignment.occupantB && (
                            <OccupantGuestLines occupant={assignment.occupantB} />
                          )}
                          {assignment.overrideReason && (
                            <p className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-700">
                              {assignment.overrideReason}
                            </p>
                          )}
                          {isAdminControl && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(assignment)}
                                disabled={busy}
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUnassign(assignment)}
                                disabled={busy}
                              >
                                <UserMinus className="size-3.5" />
                                Unassign
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {activeAssignments.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
                <BedDouble className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No active room assignments yet.
                </p>
              </div>
            )}
            {paginationFooter}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
