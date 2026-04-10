import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conf/[confId]/payments — list all payments
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const payments = await prisma.confPayment.findMany({
      where: { confId },
      include: {
        proofs: true,
        budget: { select: { id: true, title: true } },
        item: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/payments — create a payment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const body = await req.json();
    const {
      budgetId,
      itemId,
      amount,
      paidBy,
      paidTo,
      method,
      ref: txRef,
      note,
    } = body;

    if (!amount || !paidBy) {
      return NextResponse.json(
        { error: "amount and paidBy are required" },
        { status: 400 },
      );
    }

    const payment = await prisma.confPayment.create({
      data: {
        confId,
        budgetId: budgetId || null,
        itemId: itemId || null,
        amount: Number(amount),
        paidBy,
        paidTo: paidTo || null,
        method: method || "WECHAT",
        ref: txRef || null,
        note: note || null,
      },
      include: { proofs: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
