import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/payments/[paymentId]/approve
// Level-1 committee chair approval
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; paymentId: string }> },
) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    // Scoped committee chair approval is required for level-1 approval.
    if (!auth.access.isSuperAdmin && !auth.access.canApprovePayments) {
      return NextResponse.json(
        { error: "Payment approval permission required" },
        { status: 403 },
      );
    }

    const payment = await prisma.confPayment.findUnique({
      where: { id: paymentId, confId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.isLocked) {
      return NextResponse.json(
        { error: "Payment is locked and cannot be modified" },
        { status: 409 },
      );
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: `Payment is already in status: ${payment.status}` },
        { status: 409 },
      );
    }

    if (!auth.access.isSuperAdmin) {
      if (!auth.access.memberId || !auth.access.committeeScope) {
        return NextResponse.json(
          {
            error:
              "A committee chair profile with committee scope is required for committee approval",
          },
          { status: 403 },
        );
      }

      if (!payment.committeeScope) {
        return NextResponse.json(
          {
            error:
              "Payment does not have a committee scope and cannot be committee-approved",
          },
          { status: 409 },
        );
      }

      if (payment.committeeScope !== auth.access.committeeScope) {
        return NextResponse.json(
          {
            error:
              "You can only committee-approve payments for your committee scope",
          },
          { status: 403 },
        );
      }
    }

    const memberId = auth.access.memberId;

    const updated = await prisma.confPayment.update({
      where: { id: paymentId },
      data: {
        status: "COMMITTEE_APPROVED",
        committeeApprovedBy: memberId,
        committeeApprovedAt: new Date(),
      },
      include: {
        proofs: true,
        submittedBy: { select: { id: true, name: true } },
      },
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_COMMITTEE_APPROVED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        amount: payment.amount,
        paymentType: payment.paymentType,
        committeeScope: payment.committeeScope,
        approvedByMemberId: memberId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to approve payment:", error);
    return NextResponse.json(
      { error: "Failed to approve payment" },
      { status: 500 },
    );
  }
}
