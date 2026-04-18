import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/payments/[paymentId]/reject
// Reject at any approval level (must provide a reason)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; paymentId: string }> },
) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    // Must be chair or have approval permission
    if (!auth.access.canApprovePayments && !auth.access.isChair) {
      return NextResponse.json(
        { error: "Payment approval/rejection permission required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "A rejection reason is required (at least 3 characters)" },
        { status: 400 },
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
        { error: "Payment is locked and cannot be rejected" },
        { status: 409 },
      );
    }

    if (payment.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot reject a finally approved payment" },
        { status: 409 },
      );
    }

    const updated = await prisma.confPayment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
      },
      include: { proofs: true },
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_REJECTED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        previousStatus: payment.status,
        amount: payment.amount,
        paymentType: payment.paymentType,
      },
      note: reason.trim(),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to reject payment:", error);
    return NextResponse.json(
      { error: "Failed to reject payment" },
      { status: 500 },
    );
  }
}
