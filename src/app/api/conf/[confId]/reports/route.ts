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

    const normalizedPaymentTypes = Array.isArray(paymentTypes)
      ? paymentTypes
          .filter((value: unknown): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
          .join(",") || null
      : typeof paymentTypes === "string" && paymentTypes.trim()
        ? paymentTypes.trim()
        : null;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const requestedPaymentIds = Array.isArray(paymentIds)
      ? paymentIds
          .filter((value: unknown): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const uniquePaymentIds = Array.from(new Set(requestedPaymentIds));

    if (uniquePaymentIds.length > 0) {
      const approvedPayments = await prisma.confPayment.findMany({
        where: {
          confId,
          id: { in: uniquePaymentIds },
          status: "APPROVED",
        },
        select: { id: true },
      });

      const approvedIds = new Set(approvedPayments.map((payment) => payment.id));
      const invalidIds = uniquePaymentIds.filter((id) => !approvedIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            error:
              "Only finally approved payments can be included in reports.",
            invalidPaymentIds: invalidIds,
          },
          { status: 400 },
        );
      }
    }

    const report = await prisma.confReport.create({
      data: {
        confId,
        title,
        description: description || null,
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        committeeScope: committeeScope || null,
        paymentTypes: normalizedPaymentTypes,
        generalComment: generalComment || null,
        createdByName: auth.access.user?.name ?? null,
        createdByUserId: auth.access.user?.id ?? null,
        entries: {
          create: uniquePaymentIds.map(
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
            payment: {
              include: { proofs: true },
            },
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
        entryCount: uniquePaymentIds.length,
        committeeScope,
        paymentTypes,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create report:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to create report";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
