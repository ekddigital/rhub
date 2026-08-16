import { getConferenceFeePackageById } from "@/lib/conf/fees";
import { ROOM_ASSIGNMENT_INCLUDE } from "@/lib/conf/room-assignments-server";
import { prisma } from "@/lib/prisma";
import type {
  ReportAttendanceRow,
  ReportDataSource,
  ReportRoomPairingRow,
} from "./types";

/** Map fee package to register column label (matches attendance.generated.json). */
export function formatReportAttendanceRoomLabel(
  feePackageId: string | null | undefined,
): string {
  if (!feePackageId?.trim()) return "—";
  const pkg = getConferenceFeePackageById(feePackageId.trim());
  if (!pkg) return feePackageId;

  const categoryShort =
    pkg.category === "Member in Good Standing"
      ? "GS"
      : pkg.category === "Non-Good Standing Members"
        ? "NGS"
        : pkg.category === "Partnering Organizations Guests"
          ? "Partner Guest"
          : pkg.category;

  if (pkg.id === "member-guest-shared") {
    return "GS - Shared Room + Guest";
  }
  if (pkg.id === "member-march-intake") {
    return "GS - March Intake";
  }
  if (pkg.id === "veteran-single") {
    return "Veteran - Single Room";
  }
  if (pkg.id === "veteran-guest") {
    return "Veteran - Guest Package";
  }
  if (pkg.id === "guest-social-events") {
    return "Guest - Social Events";
  }

  return `${categoryShort} - ${pkg.label}`;
}

function formatReportCity(city: string, province: string | null | undefined) {
  const trimmedCity = city.trim();
  const trimmedProvince = province?.trim();
  if (!trimmedProvince || trimmedCity.includes(",")) {
    return trimmedCity;
  }
  return `${trimmedCity}, ${trimmedProvince}`;
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export async function loadReportDelegateData(confId: string): Promise<{
  attendanceRows: ReportAttendanceRow[];
  roomPairings: ReportRoomPairingRow[];
  source: ReportDataSource;
}> {
  const [delegates, assignments] = await Promise.all([
    prisma.confDelegate.findMany({
      where: { confId, status: { not: "CANCELLED" } },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        city: true,
        province: true,
        feePackageId: true,
        feeAmount: true,
        amountPaid: true,
        guests: {
          select: { name: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.confRoomAssignment.findMany({
      where: { confId, status: { not: "CANCELLED" } },
      include: ROOM_ASSIGNMENT_INCLUDE,
      orderBy: { roomCode: "asc" },
    }),
  ]);

  if (delegates.length === 0) {
    return { attendanceRows: [], roomPairings: [], source: "static" };
  }

  const attendanceRows: ReportAttendanceRow[] = delegates.map((delegate, index) => {
    const fee = delegate.feeAmount ?? 0;
    const paid = delegate.amountPaid ?? 0;
    const balance = Math.max(0, fee - paid);
    const guestSuffix =
      delegate.guests.length > 0
        ? ` (+ ${delegate.guests.map((guest) => guest.name).join(", ")})`
        : "";

    return {
      no: String(index + 1),
      name: `${delegate.name}${guestSuffix}`,
      city: formatReportCity(delegate.city, delegate.province),
      room: formatReportAttendanceRoomLabel(delegate.feePackageId),
      fee: formatMoney(fee),
      paid: formatMoney(paid),
      balance: formatMoney(balance),
    };
  });

  const roomPairings: ReportRoomPairingRow[] = assignments.map((assignment) => {
    const occupantNames = [assignment.occupantA.name];
    if (assignment.occupantB) {
      occupantNames.push(assignment.occupantB.name);
    } else if (assignment.companionGuest) {
      occupantNames.push(assignment.companionGuest.name);
    }

    const cities = [assignment.occupantA.city];
    if (assignment.occupantB?.city) {
      cities.push(assignment.occupantB.city);
    }

    return {
      roomCode: assignment.roomCode,
      type: assignment.occupantB || assignment.companionGuest ? "Pair" : "Single",
      occupants: occupantNames.join(" + "),
      cities: cities.join(" · "),
    };
  });

  return {
    attendanceRows,
    roomPairings,
    source: "live",
  };
}

export function buildReportAttendanceStats(
  rows: readonly ReportAttendanceRow[],
) {
  return {
    totalRegistered: rows.length,
    uniqueCities: new Set(rows.map((row) => row.city).filter(Boolean)).size,
    fullyPaid: rows.filter((row) => row.balance === "0").length,
    totalFeesRmb: rows.reduce(
      (sum, row) => sum + Number.parseFloat(row.fee || "0"),
      0,
    ),
    vipGuests: rows.filter((row) => row.room.includes("VIP")).length,
    veteranPlacements: rows.filter((row) => row.room.includes("Veteran")).length,
  };
}

/** ~28 room pairings per A4 report page. */
export function chunkReportRoomPairings(
  rows: readonly ReportRoomPairingRow[],
  perPage = 28,
): ReportRoomPairingRow[][] {
  const chunks: ReportRoomPairingRow[][] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    chunks.push(rows.slice(i, i + perPage));
  }
  return chunks;
}

export function countReportRoomPairingPages(
  rows: readonly ReportRoomPairingRow[],
): number {
  return chunkReportRoomPairings(rows).length;
}
