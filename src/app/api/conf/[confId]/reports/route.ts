import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// GET /api/conf/[confId]/reports — list reports
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const reports = await prisma.confReport.findMany({
      where: { confId },
      include: {
        entries: {
          include: {
            payment: {
              include: { proofs: true },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/reports — create a new report
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      title,
      description,
      dateFrom,
      dateTo,
      committeeScope,
      paymentTypes,
      generalComment,
      paymentIds, // array of payment IDs to include
      lineComments, // { [paymentId]: string } map
    } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const report = await prisma.confReport.create({
      data: {
        confId,
        title,
        description: description || null,
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        committeeScope: committeeScope || null,
        paymentTypes: paymentTypes || null,
        generalComment: generalComment || null,
        createdByName: auth.access.user?.name ?? null,
        createdByUserId: auth.access.user?.id ?? null,
        entries: {
          create: (Array.isArray(paymentIds) ? paymentIds : []).map(
            (pid: string, idx: number) => ({
              paymentId: pid,
              lineComment: lineComments?.[pid] ?? null,
              displayOrder: idx,
            }),
          ),
        },
      },
      include: {
        entries: {
          include: {
            payment: { include: { proofs: true } },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "REPORT_CREATED",
      entityType: "report",
      entityId: report.id,
      details: {
        title,
        entryCount: report.entries.length,
        committeeScope,
        paymentTypes,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 },
    );
  }
}
