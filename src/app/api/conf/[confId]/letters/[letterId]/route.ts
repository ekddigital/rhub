import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { ConfLetterType } from "@prisma/client";

// GET /api/conf/[confId]/letters/[letterId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; letterId: string }> },
) {
  try {
    const { confId, letterId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const letter = await prisma.confLetter.findFirst({
      where: { id: letterId, confId, isDeleted: false },
    });

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    return NextResponse.json(letter);
  } catch (error) {
    console.error("Failed to fetch letter:", error);
    return NextResponse.json(
      { error: "Failed to fetch letter" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/letters/[letterId]
// Body: { title?, type?, letterDate?, draft? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; letterId: string }> },
) {
  try {
    const { confId, letterId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confLetter.findFirst({
      where: { id: letterId, confId, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, type, letterDate, draft } = body as {
      title?: string;
      type?: string;
      letterDate?: string;
      draft?: unknown;
    };

    const validTypes = Object.values(ConfLetterType);

    const letter = await prisma.confLetter.update({
      where: { id: letterId },
      data: {
        ...(title !== undefined
          ? { title: title.trim() || "Untitled Letter" }
          : {}),
        ...(type !== undefined && validTypes.includes(type as ConfLetterType)
          ? { type: type as ConfLetterType }
          : {}),
        ...(letterDate !== undefined ? { letterDate } : {}),
        ...(draft !== undefined ? { draft: draft as import("@prisma/client").Prisma.InputJsonValue } : {}),
      },
    });

    return NextResponse.json(letter);
  } catch (error) {
    console.error("Failed to update letter:", error);
    return NextResponse.json(
      { error: "Failed to update letter" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/letters/[letterId]  — soft delete
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; letterId: string }> },
) {
  try {
    const { confId, letterId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confLetter.findFirst({
      where: { id: letterId, confId, isDeleted: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    await prisma.confLetter.update({
      where: { id: letterId },
      data: { isDeleted: true },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete letter:", error);
    return NextResponse.json(
      { error: "Failed to delete letter" },
      { status: 500 },
    );
  }
}
