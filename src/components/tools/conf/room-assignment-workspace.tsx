"use client";

import { useMemo, useState } from "react";
import {
  BedDouble,
  LayoutGrid,
  Pencil,
  Table2,
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
  isDelegateEligibleForGuestSelfRoom,
  isDelegateEligibleForRoomAssignment,
  isDelegateEligibleForRoomPairing,
  type RoomAssignmentGuest,
} from "@/lib/conf/room-pairing-eligibility";
import { conferencePackageIncludesGuest } from "@/lib/conf/delegate-guests";

export type RoomAssignmentOccupant = {
  id: string;
  name: string;
  delegateCode: string | null;
  gender: "MALE" | "FEMALE" | null;
  city: string;
  feePackageId?: string | null;
  guestCount?: number;
  roomPref?: "PAIR" | "SINGLE";
  wantsSingleRoom?: boolean;
  accommodationNeeded?: "YES" | "NO" | "OTHER" | null;
  guests?: RoomAssignmentGuest[];
};

export type RoomAssignmentRow = {
  id: string;
  roomCode: string;
  status: "PENDING" | "ASSIGNED" | "CANCELLED";
  isManual: boolean;
  overrideReason: string | null;
  createdAt: string;
  occupantA: RoomAssignmentOccupant;
  occupantB: RoomAssignmentOccupant | null;
};

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
};

type Props = {
  confId: string;
  assignments: RoomAssignmentRow[];
  delegates: RoomAssignmentDelegate[];
  isAdminControl: boolean;
  busy: boolean;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
};

type ViewMode = "cards" | "table";
type ManualAssignmentMode = "with-guest" | "with-delegate";

const STATUS_COLOR: Record<RoomAssignmentRow["status"], string> = {
  PENDING: "text-yellow-600",
  ASSIGNED: "text-emerald-600",
  CANCELLED: "text-gray-500",
};

function assignmentTypeLabel(assignment: RoomAssignmentRow) {
  return assignment.occupantB ? "Pair" : "Single";
}

function occupantSummary(assignment: RoomAssignmentRow) {
  if (assignment.occupantB) {
    return `${assignment.occupantA.name} + ${assignment.occupantB.name}`;
  }
  return assignment.occupantA.name;
}

function companionGuestsForOccupant(
  occupant: RoomAssignmentOccupant,
  hasPairPartner = false,
) {
  if (
    occupant.feePackageId == null ||
    occupant.guestCount == null ||
    occupant.roomPref == null ||
    occupant.wantsSingleRoom == null
  ) {
    return [];
  }
  return getCompanionGuestsForRoomDisplay(
    {
      feePackageId: occupant.feePackageId,
      guestCount: occupant.guestCount,
      roomPref: occupant.roomPref,
      wantsSingleRoom: occupant.wantsSingleRoom,
      accommodationNeeded: occupant.accommodationNeeded ?? null,
      feePaid: true,
      amountPaid: null,
      feeAmount: null,
      status: "CONFIRMED",
      guests: occupant.guests,
    },
    { hasPairPartner },
  );
}

function OccupantGuestLines({
  occupant,
  hasPairPartner = false,
}: {
  occupant: RoomAssignmentOccupant;
  hasPairPartner?: boolean;
}) {
  const guests = companionGuestsForOccupant(occupant, hasPairPartner);
  if (!guests.length) return null;

  return (
    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {guests.map((guest) => (
        <li key={guest.id}>
          Guest: {guest.name}
          <span className="ml-1 italic">(companion guest)</span>
        </li>
      ))}
    </ul>
  );
}

function OccupantsCell({ assignment }: { assignment: RoomAssignmentRow }) {
  const hasPairPartner = Boolean(assignment.occupantB);
  return (
    <div className="space-y-2">
      <div>
        <p className="font-medium">{assignment.occupantA.name}</p>
        <p className="text-xs text-muted-foreground">
          {assignment.occupantA.delegateCode || "N/A"}
        </p>
        <OccupantGuestLines
          occupant={assignment.occupantA}
          hasPairPartner={hasPairPartner}
        />
      </div>
      {assignment.occupantB && (
        <div>
          <p className="font-medium">{assignment.occupantB.name}</p>
          <p className="text-xs text-muted-foreground">
            {assignment.occupantB.delegateCode || "N/A"}
          </p>
          <OccupantGuestLines occupant={assignment.occupantB} />
        </div>
      )}
      {!assignment.occupantB && (
        <p className="text-xs italic text-muted-foreground">Single room</p>
      )}
      {assignment.overrideReason && (
        <p className="text-xs text-amber-700">{assignment.overrideReason}</p>
      )}
    </div>
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
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [manualA, setManualA] = useState("");
  const [manualB, setManualB] = useState("");
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
    const occupantLike: RoomAssignmentOccupant = {
      id: selectedManualDelegate.id,
      name: selectedManualDelegate.name,
      delegateCode: selectedManualDelegate.delegateCode,
      gender: selectedManualDelegate.gender,
      city: selectedManualDelegate.city,
      feePackageId: selectedManualDelegate.feePackageId,
      guestCount: selectedManualDelegate.guestCount,
      roomPref: selectedManualDelegate.roomPref,
      wantsSingleRoom: selectedManualDelegate.wantsSingleRoom,
      accommodationNeeded: selectedManualDelegate.accommodationNeeded,
    };
    return companionGuestsForOccupant(
      occupantLike,
      manualAssignmentMode === "with-delegate",
    );
  }, [selectedManualDelegate, manualAssignmentMode]);

  const canAssignWithGuest = Boolean(
    selectedManualDelegate &&
      isDelegateEligibleForGuestSelfRoom(selectedManualDelegate),
  );

  const showManualAssignmentMode = Boolean(
    selectedManualDelegate &&
      conferencePackageIncludesGuest(selectedManualDelegate.feePackageId) &&
      (selectedManualDelegate.guestCount ?? 0) > 0,
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
    if (!manualA) return;
    const occupantBId =
      showManualAssignmentMode && manualAssignmentMode === "with-guest"
        ? null
        : manualB || null;

    try {
      const res = await fetch(`/api/conf/${confId}/room-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupantAId: manualA,
          occupantBId,
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
      await onRefresh();
      onNotice("Room assignment created.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to assign room");
    }
  };

  const handleSaveEdit = async (assignmentId: string) => {
    if (!editA || !editRoomCode.trim()) return;

    try {
      const res = await fetch(
        `/api/conf/${confId}/room-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode: editRoomCode.trim(),
            occupantAId: editA,
            occupantBId: editB || null,
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
    }
  };

  const handleUnassign = async (assignment: RoomAssignmentRow) => {
    const label = occupantSummary(assignment);
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
              pairing dropdowns. Guest-package delegates rooming with their guest
              are excluded unless they opted out or have extra guests.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode("table")}
            >
              <Table2 className="size-3.5" />
              Table
            </Button>
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdminControl && (
          <div className="grid gap-4 rounded-lg border border-border p-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Occupant A</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                value={manualA}
                onChange={(e) => {
                  setManualA(e.target.value);
                  setManualB("");
                  setManualAssignmentMode("with-guest");
                }}
              >
                <option value="">Select delegate</option>
                {assignmentEligibleDelegates.map((d) => (
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
                    if (mode === "with-guest") setManualB("");
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
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
                value={manualB}
                onChange={(e) => setManualB(e.target.value)}
                disabled={
                  showManualAssignmentMode && manualAssignmentMode === "with-guest"
                }
              >
                <option value="">
                  {showManualAssignmentMode && manualAssignmentMode === "with-guest"
                    ? "Room with guest(s)"
                    : "Single room"}
                </option>
                {pairingEligibleDelegates
                  .filter((d) => d.id !== manualA)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.delegateCode || "N/A"})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input
                placeholder="e.g. RM-001 or A-204"
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
              <Button size="sm" onClick={handleCreate} disabled={!manualA || busy}>
                <BedDouble className="size-4" />
                Assign Room
              </Button>
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
                                <option value="">Single room</option>
                                {occupantOptionsForEdit(assignment, "B").map(
                                  (d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name}
                                    </option>
                                  ),
                                )}
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
                            {editB ? "Pair" : "Single"}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Badge
                              variant="outline"
                              className={`text-xs ${STATUS_COLOR[assignment.status]}`}
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
                                  disabled={busy || !editRoomCode.trim()}
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
                          {assignmentTypeLabel(assignment)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_COLOR[assignment.status]}`}
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
                              <option value="">Single room</option>
                              {occupantOptionsForEdit(assignment, "B").map(
                                (d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ),
                              )}
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
                              className={`text-xs ${STATUS_COLOR[assignment.status]}`}
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
                            {assignmentTypeLabel(assignment)} ·{" "}
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
