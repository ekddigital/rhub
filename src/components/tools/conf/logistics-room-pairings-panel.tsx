"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble } from "lucide-react";
import { PassportViewerModal } from "@/components/tools/conf/passport-viewer-modal";
import {
  OccupantGuestLines,
  OccupantsCell,
  RoomAssignmentStatusBadge,
  RoomAssignmentViewModeToggle,
  RoomOccupantPhotoThumb,
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
} from "@/lib/conf/logistics-name-list";

function logisticsOccupantPhoto(occupant: LogisticsRoomPairingOccupant) {
  return {
    name: occupant.name,
    profilePhotoUrl: occupant.profilePhotoUrl,
    profilePhotoIsPdf: occupant.profilePhotoIsPdf,
  };
}

function LogisticsCompanionGuestWithPhoto({
  guest,
}: {
  guest: LogisticsRoomPairingGuest;
}) {
  return (
    <div className="flex items-start gap-2">
      <RoomOccupantPhotoThumb
        photo={{
          name: guest.name,
          profilePhotoUrl: guest.profilePhotoUrl,
          profilePhotoIsPdf: guest.passportPhotoIsPdf,
        }}
        sizeClass="h-11 w-11"
      />
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700">
          Companion guest
        </p>
        <Link
          href={guest.profileHref}
          className="block font-medium leading-snug text-violet-900 hover:underline"
        >
          {guest.name}
        </Link>
        <p className="text-xs text-violet-800/80">
          Guest of {guest.hostDelegateName}
        </p>
        {guest.profilePhotoUrl ? (
          <PassportViewerModal
            proxyUrl={guest.profilePhotoUrl}
            isPdf={guest.passportPhotoIsPdf}
            label="View photo"
            title={`${guest.name} — passport`}
            triggerClassName="px-2 py-1 text-[11px] leading-none"
          />
        ) : null}
      </div>
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
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Room</th>
                  <th className="px-3 py-2 font-medium">Photos</th>
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
                        <div className="flex flex-wrap gap-2">
                          <RoomOccupantPhotoThumb
                            photo={logisticsOccupantPhoto(pairing.occupantA)}
                          />
                          {pairing.occupantB ? (
                            <RoomOccupantPhotoThumb
                              photo={logisticsOccupantPhoto(pairing.occupantB)}
                            />
                          ) : null}
                          {pairing.companionGuest ? (
                            <RoomOccupantPhotoThumb
                              photo={{
                                name: pairing.companionGuest.name,
                                profilePhotoUrl:
                                  pairing.companionGuest.profilePhotoUrl,
                                profilePhotoIsPdf:
                                  pairing.companionGuest.passportPhotoIsPdf,
                              }}
                            />
                          ) : null}
                        </div>
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
                    <div className="flex flex-wrap gap-2">
                      <RoomOccupantPhotoThumb
                        photo={logisticsOccupantPhoto(pairing.occupantA)}
                      />
                      {pairing.occupantB ? (
                        <RoomOccupantPhotoThumb
                          photo={logisticsOccupantPhoto(pairing.occupantB)}
                        />
                      ) : null}
                      {pairing.companionGuest ? (
                        <RoomOccupantPhotoThumb
                          photo={{
                            name: pairing.companionGuest.name,
                            profilePhotoUrl:
                              pairing.companionGuest.profilePhotoUrl,
                            profilePhotoIsPdf:
                              pairing.companionGuest.passportPhotoIsPdf,
                          }}
                        />
                      ) : null}
                    </div>
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
                    {pairing.companionGuest ? (
                      <LogisticsCompanionGuestWithPhoto
                        guest={pairing.companionGuest}
                      />
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
