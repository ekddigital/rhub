import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/conf/[confId]/delegates
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const delegates = await prisma.confDelegate.findMany({
      where: { confId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(delegates);
  } catch (error) {
    console.error("Failed to fetch delegates:", error);
    return NextResponse.json(
      { error: "Failed to fetch delegates" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/delegates
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const body = await req.json();
    const { name, email, university, city, phone, wechat, feeAmount } = body;

    if (!name || !city) {
      return NextResponse.json(
        { error: "name and city are required" },
        { status: 400 },
      );
    }

    const delegate = await prisma.confDelegate.create({
      data: {
        confId,
        name,
        email: email || null,
        university: university || null,
        city,
        phone: phone || null,
        wechat: wechat || null,
        feeAmount: feeAmount ? Number(feeAmount) : null,
      },
    });

    return NextResponse.json(delegate, { status: 201 });
  } catch (error) {
    console.error("Failed to register delegate:", error);
    return NextResponse.json(
      { error: "Failed to register delegate" },
      { status: 500 },
    );
  }
}
