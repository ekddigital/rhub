import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { ConfLetterType } from "@prisma/client";

const PAGE_SIZE = 12;

// GET /api/conf/[confId]/letters?page=1&type=MEMO
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const type = url.searchParams.get("type") as ConfLetterType | null;

    const where = {
      confId,
      isDeleted: false,
      ...(type ? { type } : {}),
    };

    const [total, letters] = await Promise.all([
      prisma.confLetter.count({ where }),
      prisma.confLetter.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          type: true,
          letterDate: true,
          createdAt: true,
          updatedAt: true,
          // Exclude the full draft JSON from list view for performance
        },
      }),
    ]);

    return NextResponse.json({
      letters,
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    console.error("Failed to fetch letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch letters" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/letters
// Body: { title, type, letterDate, draft }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { title, type, letterDate, draft } = body as {
      title?: string;
      type?: string;
      letterDate?: string;
      draft?: unknown;
    };

    if (!draft || typeof draft !== "object") {
      return NextResponse.json(
        { error: "draft is required" },
        { status: 400 },
      );
    }

    const validTypes = Object.values(ConfLetterType);
    const resolvedType: ConfLetterType =
      type && validTypes.includes(type as ConfLetterType)
        ? (type as ConfLetterType)
        : ConfLetterType.GENERAL;

    const letter = await prisma.confLetter.create({
      data: {
        confId,
        title: (title ?? "").trim() || "Untitled Letter",
        type: resolvedType,
        letterDate: letterDate ?? null,
        draft,
      },
    });

    return NextResponse.json(letter, { status: 201 });
  } catch (error) {
    console.error("Failed to create letter:", error);
    return NextResponse.json(
      { error: "Failed to create letter" },
      { status: 500 },
    );
  }
}
