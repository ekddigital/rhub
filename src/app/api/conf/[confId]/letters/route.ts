import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { ConfLetterType } from "@prisma/client";
import { SIGNATURE_PROFILE_TITLE_PREFIX } from "@/lib/conf/signature-profiles";

const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// GET /api/conf/[confId]/letters?page=1&pageSize=20&type=MEMO
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
    const parsedSize = parseInt(
      url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
    );
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(MIN_PAGE_SIZE, Number.isFinite(parsedSize) ? parsedSize : DEFAULT_PAGE_SIZE),
    );
    const type = url.searchParams.get("type") as ConfLetterType | null;

    const where = {
      confId,
      isDeleted: false,
      title: { not: { startsWith: SIGNATURE_PROFILE_TITLE_PREFIX } },
      ...(type ? { type } : {}),
    };

    const [total, letters] = await Promise.all([
      prisma.confLetter.count({ where }),
      prisma.confLetter.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
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
