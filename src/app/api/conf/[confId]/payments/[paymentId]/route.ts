import { NextResponse } from "next/server";
import { PayMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

type Params = { params: Promise<{ confId: string; paymentId: string }> };

function normalizeScope(value: unknown) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

// GET /api/conf/[confId]/payments/[paymentId] — read one payment
export async function GET(_req: Request, { params }: Params) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const payment = await prisma.confPayment.findFirst({
      where: { id: paymentId, confId },
      include: {
        proofs: true,
        budget: { select: { id: true, title: true } },
        item: { select: { id: true, name: true } },
        submittedBy: {
          select: {
            id: true,
            name: true,
            role: true,
            committeeScope: true,
            canApprovePayments: true,
          },
        },
        committeeApprover: { select: { id: true, name: true, role: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/payments/[paymentId] — update mutable fields
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confPayment.findFirst({
      where: { id: paymentId, confId },
      select: {
        id: true,
        amount: true,
        paidBy: true,
        paidTo: true,
        method: true,
        ref: true,
        note: true,
        paymentType: true,
        incomeSource: true,
        committeeScope: true,
        status: true,
        isLocked: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (existing.isLocked || existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved/locked payments cannot be edited" },
        { status: 409 },
      );
    }

    const body = (await req.json()) as {
      amount?: number;
      paidBy?: string;
      paidTo?: string | null;
      method?: string;
      ref?: string | null;
      note?: string | null;
      paymentType?: "EXPENSE" | "INCOME";
      incomeSource?: string | null;
      committeeScope?: string | null;
    };

    const allowedTypes = ["EXPENSE", "INCOME"] as const;
    if (body.paymentType && !allowedTypes.includes(body.paymentType)) {
      return NextResponse.json(
        { error: "Invalid paymentType" },
        { status: 400 },
      );
    }

    if (body.amount !== undefined && !(Number(body.amount) > 0)) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    if (body.paidBy !== undefined && String(body.paidBy).trim().length === 0) {
      return NextResponse.json(
        { error: "paidBy is required" },
        { status: 400 },
      );
    }

    const allowedMethods = Object.values(PayMethod);
    if (
      body.method !== undefined &&
      !allowedMethods.includes(body.method as PayMethod)
    ) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const nextScope =
      body.committeeScope !== undefined
        ? normalizeScope(body.committeeScope)
        : existing.committeeScope;

    const isScopedMemberActor =
      !auth.access.isSuperAdmin &&
      !auth.access.isChair &&
      Boolean(auth.access.memberId);
    if (isScopedMemberActor && nextScope !== auth.access.committeeScope) {
      return NextResponse.json(
        {
          error:
            "You can only edit payments within your assigned committee scope",
        },
        { status: 403 },
      );
    }

    const updates = {
      ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
      ...(body.paidBy !== undefined ? { paidBy: String(body.paidBy).trim() } : {}),
      ...(body.paidTo !== undefined
        ? { paidTo: normalizeScope(body.paidTo) }
        : {}),
      ...(body.method !== undefined ? { method: body.method as PayMethod } : {}),
      ...(body.ref !== undefined ? { ref: normalizeScope(body.ref) } : {}),
      ...(body.note !== undefined ? { note: normalizeScope(body.note) } : {}),
      ...(body.paymentType !== undefined ? { paymentType: body.paymentType } : {}),
      ...(body.incomeSource !== undefined
        ? { incomeSource: normalizeScope(body.incomeSource) }
        : {}),
      ...(body.committeeScope !== undefined ? { committeeScope: nextScope } : {}),
    };

    const requiresReapproval = existing.status !== "PENDING";
    const updated = await prisma.confPayment.update({
      where: { id: paymentId },
      data: {
        ...updates,
        ...(requiresReapproval
          ? {
              status: "PENDING",
              committeeApprovedAt: null,
              committeeApprover: { disconnect: true },
              approvedBy: null,
              approvedAt: null,
            }
          : {}),
      },
      include: {
        proofs: true,
        budget: { select: { id: true, title: true } },
        submittedBy: {
          select: {
            id: true,
            name: true,
            role: true,
            committeeScope: true,
            canApprovePayments: true,
          },
        },
        committeeApprover: { select: { id: true, name: true, role: true } },
      },
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_UPDATED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        previous: existing,
        current: {
          amount: updated.amount,
          paidBy: updated.paidBy,
          paidTo: updated.paidTo,
          method: updated.method,
          ref: updated.ref,
          note: updated.note,
          paymentType: updated.paymentType,
          incomeSource: updated.incomeSource,
          committeeScope: updated.committeeScope,
          status: updated.status,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/payments/[paymentId] — remove unlocked payment
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confPayment.findFirst({
      where: { id: paymentId, confId },
      select: {
        id: true,
        amount: true,
        paidBy: true,
        paymentType: true,
        committeeScope: true,
        status: true,
        isLocked: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (existing.isLocked || existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved/locked payments cannot be deleted" },
        { status: 409 },
      );
    }

    const isScopedMemberActor =
      !auth.access.isSuperAdmin &&
      !auth.access.isChair &&
      Boolean(auth.access.memberId);
    if (
      isScopedMemberActor &&
      existing.committeeScope !== auth.access.committeeScope
    ) {
      return NextResponse.json(
        {
          error:
            "You can only delete payments within your assigned committee scope",
        },
        { status: 403 },
      );
    }

    await prisma.confPayment.delete({ where: { id: paymentId } });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "PAYMENT_DELETED",
      entityType: "payment",
      entityId: paymentId,
      details: {
        amount: existing.amount,
        paidBy: existing.paidBy,
        paymentType: existing.paymentType,
        committeeScope: existing.committeeScope,
        previousStatus: existing.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
