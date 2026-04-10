import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calcItemTotal } from "@/lib/conf/currency";

// GET /api/conf/[confId]/budgets — list all budgets for a conference
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const budgets = await prisma.confBudget.findMany({
      where: { confId },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Failed to fetch budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/budgets — create a new budget with line items
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const body = await req.json();
    const { title, category, createdBy, notes, items } = body;

    if (!title || !category || !createdBy) {
      return NextResponse.json(
        { error: "title, category, and createdBy are required" },
        { status: 400 },
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one budget item is required" },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (
        !item.name ||
        item.qty === undefined ||
        item.unitPrice === undefined ||
        !item.unit
      ) {
        return NextResponse.json(
          { error: "Each item needs name, qty, unitPrice, and unit" },
          { status: 400 },
        );
      }
    }

    const budget = await prisma.confBudget.create({
      data: {
        confId,
        title,
        category,
        createdBy,
        notes: notes || null,
        items: {
          create: items.map(
            (
              item: {
                name: string;
                desc?: string;
                qty: number;
                unit: string;
                unitPrice: number;
                notes?: string;
              },
              idx: number,
            ) => ({
              no: idx + 1,
              name: item.name,
              desc: item.desc || null,
              qty: Number(item.qty),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
              notes: item.notes || null,
            }),
          ),
        },
      },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Failed to create budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }
}
