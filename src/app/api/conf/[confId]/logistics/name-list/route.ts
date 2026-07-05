import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { denyIfHotelCheckinWrite, requireConferenceApiAccess } from "@/lib/conf/access";
import {
  buildLogisticsNameListResponse,
  filterFullyPaidDelegates,
} from "@/lib/conf/logistics-name-list-server";

const delegateSelect = {
  id: true,
  name: true,
  passportNo: true,
  city: true,
  feeAmount: true,
  amountPaid: true,
  feePaid: true,
  passportPhotoPath: true,
  lastEntryStampPath: true,
  currentVisaPath: true,
  status: true,
} as const;

// GET /api/conf/[confId]/logistics/name-list
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "logistics-viewer");
    if (!auth.ok) return auth.response;

    const [conf, allDelegates, manualEntries] = await Promise.all([
      prisma.confEvent.findUnique({
        where: { id: confId },
        select: {
          id: true,
          name: true,
          city: true,
          venue: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.confDelegate.findMany({
        where: { confId },
        select: delegateSelect,
      }),
      prisma.confLogisticsRosterEntry.findMany({
        where: { confId, source: "MANUAL" },
        include: {
          delegate: { select: delegateSelect },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!conf) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    const paidDelegates = filterFullyPaidDelegates(allDelegates);
    const paidDelegateIds = paidDelegates.map((d) => d.id);
    const paidDelegateGuests =
      paidDelegateIds.length > 0
        ? await prisma.confDelegateGuest.findMany({
            where: { confId, delegateId: { in: paidDelegateIds } },
            orderBy: [{ delegateId: "asc" }, { sortOrder: "asc" }],
            select: {
              id: true,
              delegateId: true,
              sortOrder: true,
              name: true,
              passportNo: true,
              nationality: true,
              passportPhotoPath: true,
              lastEntryStampPath: true,
              currentVisaPath: true,
            },
          })
        : [];

    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost";
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    const origin = `${proto}://${host}`;

    return NextResponse.json(
      await buildLogisticsNameListResponse({
        conf,
        paidDelegates,
        manualEntries,
        allDelegates,
        paidDelegateGuests,
        origin,
      }),
    );
  } catch (error) {
    console.error("[conf.logistics.name-list.get]", error);
    return NextResponse.json(
      { error: "Failed to load logistics name list" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/logistics/name-list
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;
    const writeDenied = denyIfHotelCheckinWrite(auth.access);
    if (writeDenied) return writeDenied;

    const body = (await req.json()) as { delegateId?: string; note?: string };
    const delegateId = String(body.delegateId || "").trim();
    if (!delegateId) {
      return NextResponse.json(
        { error: "delegateId is required" },
        { status: 400 },
      );
    }

    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
      select: { id: true, confId: true, status: true },
    });

    if (!delegate || delegate.confId !== confId) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 },
      );
    }

    if (delegate.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot add cancelled delegate to roster" },
        { status: 400 },
      );
    }

    const existing = await prisma.confLogisticsRosterEntry.findUnique({
      where: {
        confId_delegateId: { confId, delegateId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Delegate is already on the logistics name list" },
        { status: 409 },
      );
    }

    const entry = await prisma.confLogisticsRosterEntry.create({
      data: {
        confId,
        delegateId,
        source: "MANUAL",
        addedByMemberId: auth.access.memberId,
        note: body.note?.trim() || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[conf.logistics.name-list.post]", error);
    return NextResponse.json(
      { error: "Failed to add delegate to logistics name list" },
      { status: 500 },
    );
  }
}
