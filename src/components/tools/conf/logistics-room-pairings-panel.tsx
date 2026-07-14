"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble } from "lucide-react";
import { LogisticsTravelDocStrip } from "@/components/tools/conf/logistics-travel-doc-strip";
import {
  OccupantGuestLines,
  OccupantsCell,
  RoomAssignmentStatusBadge,
  RoomAssignmentViewModeToggle,
  companionGuestNamesForAssignment,
  roomAssignmentTypeLabel,
  toRoomAssignmentRowFromLogisticsPairing,
  type RoomAssignmentViewMode,
} from "@/components/tools/conf/room-assignment-display";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  LogisticsRoomPairing,
  LogisticsRoomPairingGuest,
  LogisticsRoomPairingOccupant,
  LogisticsTravelDocuments,
} from "@/lib/conf/logistics-name-list";

function occupantTravelDocs(
  occupant: LogisticsRoomPairingOccupant,
): LogisticsTravelDocuments {
  return {
    passportPhotoPath: occupant.passportPhotoPath,
    passportPhotoIsPdf: occupant.passportPhotoIsPdf,
    lastEntryStampPath: occupant.lastEntryStampPath,
    lastEntryStampIsPdf: occupant.lastEntryStampIsPdf,
    currentVisaPath: occupant.currentVisaPath,
    currentVisaIsPdf: occupant.currentVisaIsPdf,
    passportDocUrl: occupant.passportDocUrl,
    entryStampDocUrl: occupant.entryStampDocUrl,
    visaDocUrl: occupant.visaDocUrl,
  };
}

function guestTravelDocs(guest: LogisticsRoomPairingGuest): LogisticsTravelDocuments {
  return {
    passportPhotoPath: guest.passportPhotoPath,
    passportPhotoIsPdf: guest.passportPhotoIsPdf,
    lastEntryStampPath: guest.lastEntryStampPath,
    lastEntryStampIsPdf: guest.lastEntryStampIsPdf,
    currentVisaPath: guest.currentVisaPath,
    currentVisaIsPdf: guest.currentVisaIsPdf,
    passportDocUrl: guest.passportDocUrl,
    entryStampDocUrl: guest.entryStampDocUrl,
    visaDocUrl: guest.visaDocUrl,
  };
}

function RoomPairingTravelDocs({
  pairing,
}: {
  pairing: LogisticsRoomPairing;
}) {
  return (
    <div className="space-y-4">
      <LogisticsTravelDocStrip
        name={pairing.occupantA.name}
        docs={occupantTravelDocs(pairing.occupantA)}
      />
      {pairing.occupantB ? (
        <LogisticsTravelDocStrip
          name={pairing.occupantB.name}
          docs={occupantTravelDocs(pairing.occupantB)}
        />
      ) : null}
      {pairing.companionGuest ? (
        <LogisticsCompanionGuestTravelDocs guest={pairing.companionGuest} />
      ) : null}
    </div>
  );
}

function LogisticsCompanionGuestTravelDocs({
  guest,
}: {
  guest: LogisticsRoomPairingGuest;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-violet-200 bg-violet-50/40 p-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700">
        Companion guest
      </p>
      <Link
        href={guest.profileHref}
        className="block text-xs font-medium leading-snug text-violet-900 hover:underline"
      >
        {guest.name}
      </Link>
      <p className="text-[11px] text-violet-800/80">
        Guest of {guest.hostDelegateName}
      </p>
      <LogisticsTravelDocStrip
        name={guest.name}
        docs={guestTravelDocs(guest)}
        nameClassName="sr-only"
      />
    </div>
  );
}

export function LogisticsRoomPairingsPanel({
  pairings,
}: {
  pairings: LogisticsRoomPairing[];
}) {
  const [viewMode, setViewMode] = useState<RoomAssignmentViewMode>("cards");

  const activePairings = useMemo(
    () => pairings.filter((pairing) => pairing.status !== "CANCELLED"),
    [pairings],
  );

  const pairedCount = useMemo(
    () =>
      activePairings.filter((pairing) => pairing.assignmentType === "PAIR")
        .length,
    [activePairings],
  );

  return (
    <Card className="logistics-no-print border-[#C8A061]/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BedDouble className="size-4 text-[#C8A061]" />
              Room Pairings ({activePairings.length})
            </CardTitle>
            <CardDescription>
              Same data as Delegates → Room Assignment — {pairedCount} paired
              room{pairedCount === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <RoomAssignmentViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </CardHeader>
      <CardContent>
        {activePairings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
            <BedDouble className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No active room assignments yet.
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Room</th>
                  <th className="px-3 py-2 font-medium">Travel documents</th>
                  <th className="px-3 py-2 font-medium">Occupant(s)</th>
                  <th className="px-3 py-2 font-medium">Guests</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activePairings.map((pairing) => {
                  const assignment = toRoomAssignmentRowFromLogisticsPairing({
                    id: pairing.id,
                    roomCode: pairing.roomCode,
                    status: pairing.status,
                    overrideReason: pairing.overrideReason,
                    occupantA: pairing.occupantA,
                    occupantB: pairing.occupantB,
                  });

                  return (
                    <tr
                      key={pairing.id}
                      className="border-b border-border align-top last:border-b-0"
                    >
                      <td className="px-3 py-2 font-medium">
                        {pairing.roomCode}
                      </td>
                      <td className="px-3 py-2">
                        <RoomPairingTravelDocs pairing={pairing} />
                      </td>
                      <td className="px-3 py-2">
                        <OccupantsCell assignment={assignment} />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {companionGuestNamesForAssignment(assignment) ||
                          pairing.companionGuest?.name ||
                          "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">
                          {pairing.assignmentType === "SINGLE_WITH_GUEST"
                            ? "Single + guest"
                            : roomAssignmentTypeLabel(assignment)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <RoomAssignmentStatusBadge status={pairing.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activePairings.map((pairing) => {
              const assignment = toRoomAssignmentRowFromLogisticsPairing({
                id: pairing.id,
                roomCode: pairing.roomCode,
                status: pairing.status,
                overrideReason: pairing.overrideReason,
                occupantA: pairing.occupantA,
                occupantB: pairing.occupantB,
              });

              return (
                <Card key={pairing.id} className="border-border">
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="size-4 text-[#C8A061]" />
                        <p className="font-semibold text-sm">
                          Room {pairing.roomCode}
                        </p>
                      </div>
                      <RoomAssignmentStatusBadge status={pairing.status} />
                    </div>
                    <RoomPairingTravelDocs pairing={pairing} />
                    <p className="text-sm font-medium leading-snug">
                      {pairing.occupantA.name}
                      {pairing.occupantB ? ` + ${pairing.occupantB.name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pairing.assignmentType === "SINGLE_WITH_GUEST"
                        ? "Single + guest"
                        : roomAssignmentTypeLabel(assignment)}{" "}
                      · {pairing.occupantA.delegateCode || "N/A"}
                      {pairing.occupantB
                        ? ` / ${pairing.occupantB.delegateCode || "N/A"}`
                        : ""}
                    </p>
                    {pairing.overrideReason && (
                      <p className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-700">
                        {pairing.overrideReason}
                      </p>
                    )}
                    <OccupantGuestLines
                      occupant={pairing.occupantA}
                      hasPairPartner={Boolean(pairing.occupantB)}
                    />
                    {pairing.occupantB ? (
                      <OccupantGuestLines occupant={pairing.occupantB} />
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
