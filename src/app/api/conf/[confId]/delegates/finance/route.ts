import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getConferenceAccess } from "@/lib/conf/access";
import {
  canAccessConferenceTreasurerFinance,
  canManageConferenceDelegateFinanceFs,
} from "@/lib/conf/conference-finance-access";
import {
  buildDelegateListViewerContext,
  mapDelegatesForApiResponse,
} from "@/lib/conf/map-delegates-for-api-response";

// GET /api/conf/[confId]/delegates/finance?lane=fs|treasurer
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const access = await getConferenceAccess(confId);
    if (!access.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const lane = new URL(req.url).searchParams.get("lane");
    if (lane !== "fs" && lane !== "treasurer") {
      return NextResponse.json(
        { error: "Query lane=fs or lane=treasurer is required" },
        { status: 400 },
      );
    }

    if (lane === "fs" && !canManageConferenceDelegateFinanceFs(access)) {
      return NextResponse.json(
        { error: "Financial Secretary or Chair access required" },
        { status: 403 },
      );
    }

    if (lane === "treasurer" && !canAccessConferenceTreasurerFinance(access)) {
      return NextResponse.json(
        { error: "Treasurer access required" },
        { status: 403 },
      );
    }

    const viewer = buildDelegateListViewerContext({
      isManager: access.isManager,
      delegateId: access.delegateId,
      user: access.user
        ? { id: access.user.id, email: access.user.email }
        : null,
    });

    const delegates = await prisma.confDelegate.findMany({
      where: {
        confId,
        status: { not: "CANCELLED" },
        ...(lane === "treasurer" ? { feeFsApprovedAt: { not: null } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json(await mapDelegatesForApiResponse(delegates, viewer, origin));
  } catch (error) {
    console.error("Failed to fetch finance delegates:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance delegates" },
      { status: 500 },
    );
  }
}
