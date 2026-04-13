import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireDefaultConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf — list conferences (or get the active one)
export async function GET() {
  try {
    const auth = await requireDefaultConferenceApiAccess("participant");
    if (!auth.ok) return auth.response;

    const events = await prisma.confEvent.findMany({
      orderBy: { year: "desc" },
      include: {
        _count: {
          select: {
            members: true,
            budgets: true,
            delegates: true,
            meetings: true,
            payments: true,
          },
        },
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch conferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch conferences" },
      { status: 500 },
    );
  }
}

// POST /api/conf — create a new conference
export async function POST(req: Request) {
  try {
    const auth = await requireDefaultConferenceApiAccess("manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      name,
      slug,
      year,
      city,
      venue,
      venueCn,
      address,
      startsAt,
      endsAt,
      xrRate,
      deposit,
    } = body;

    if (!name || !slug || !year || !city || !venue || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const event = await prisma.confEvent.create({
      data: {
        name,
        slug,
        year: Number(year),
        city,
        venue,
        venueCn: venueCn || null,
        address: address || null,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        xrRate: xrRate ? Number(xrRate) : 7.2,
        deposit: deposit ? Number(deposit) : null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Failed to create conference:", error);
    return NextResponse.json(
      { error: "Failed to create conference" },
      { status: 500 },
    );
  }
}
