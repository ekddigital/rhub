"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { AdaptivePhotoFrame } from "@/components/tools/conf/adaptive-photo-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCompanionGuestsForRoomDisplay,
  type RoomAssignmentGuest,
} from "@/lib/conf/room-pairing-eligibility";

export type { RoomAssignmentGuest };

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

export type RoomAssignmentViewMode = "cards" | "table";

export const ROOM_ASSIGNMENT_STATUS_COLOR: Record<
  RoomAssignmentRow["status"],
  string
> = {
  PENDING: "text-yellow-600",
  ASSIGNED: "text-emerald-600",
  CANCELLED: "text-gray-500",
};

export function roomAssignmentTypeLabel(assignment: RoomAssignmentRow) {
  return assignment.occupantB ? "Pair" : "Single";
}

export function roomOccupantSummary(assignment: RoomAssignmentRow) {
  if (assignment.occupantB) {
    return `${assignment.occupantA.name} + ${assignment.occupantB.name}`;
  }
  return assignment.occupantA.name;
}

export function companionGuestsForOccupant(
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

export function companionGuestNamesForAssignment(assignment: RoomAssignmentRow) {
  return [
    ...companionGuestsForOccupant(
      assignment.occupantA,
      Boolean(assignment.occupantB),
    ),
    ...(assignment.occupantB
      ? companionGuestsForOccupant(assignment.occupantB)
      : []),
  ]
    .map((guest) => guest.name)
    .join(", ");
}

export function RoomAssignmentViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: RoomAssignmentViewMode;
  onViewModeChange: (mode: RoomAssignmentViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
      <Button
        type="button"
        variant={viewMode === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onViewModeChange("table")}
      >
        <Table2 className="size-3.5" />
        Table
      </Button>
      <Button
        type="button"
        variant={viewMode === "cards" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onViewModeChange("cards")}
      >
        <LayoutGrid className="size-3.5" />
        Cards
      </Button>
    </div>
  );
}

export function OccupantGuestLines({
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

export function OccupantsCell({ assignment }: { assignment: RoomAssignmentRow }) {
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

export function RoomAssignmentStatusBadge({
  status,
}: {
  status: RoomAssignmentRow["status"];
}) {
  return (
    <Badge
      variant="outline"
      className={`text-xs ${ROOM_ASSIGNMENT_STATUS_COLOR[status]}`}
    >
      {status}
    </Badge>
  );
}

export type RoomOccupantPhoto = {
  name: string;
  profilePhotoUrl: string | null;
  profilePhotoIsPdf: boolean;
};

/** Matches participants-data-table booklet thumbnail pattern. */
export function RoomOccupantPhotoThumb({
  photo,
  sizeClass = "h-11 w-11",
}: {
  photo: RoomOccupantPhoto;
  sizeClass?: string;
}) {
  return (
    <div
      className={`${sizeClass} overflow-hidden rounded-md border border-border bg-muted`}
    >
      {photo.profilePhotoUrl && !photo.profilePhotoIsPdf ? (
        <AdaptivePhotoFrame
          src={photo.profilePhotoUrl}
          alt={photo.name}
          containerClassName={`${sizeClass} border-0 rounded-none`}
        />
      ) : photo.profilePhotoUrl ? (
        <iframe
          src={photo.profilePhotoUrl}
          title={photo.name}
          className="h-full w-full border-0 bg-white"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
          N/A
        </div>
      )}
    </div>
  );
}

export function toRoomAssignmentRowFromLogisticsPairing(input: {
  id: string;
  roomCode: string;
  status: RoomAssignmentRow["status"];
  overrideReason: string | null;
  occupantA: RoomAssignmentOccupant;
  occupantB: RoomAssignmentOccupant | null;
}): RoomAssignmentRow {
  return {
    id: input.id,
    roomCode: input.roomCode,
    status: input.status,
    isManual: true,
    overrideReason: input.overrideReason,
    createdAt: "",
    occupantA: input.occupantA,
    occupantB: input.occupantB,
  };
}
