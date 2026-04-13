import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

function parseLimit(raw: string | null) {
  const value = raw ? Number(raw) : 8;
  if (!Number.isFinite(value)) return 8;
  return Math.min(20, Math.max(4, Math.floor(value)));
}

function shuffleInPlace<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

// GET /api/conf/[confId]/photo-samples
// Public endpoint that returns random booklet-photo samples for registration UX.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const limit = parseLimit(new URL(req.url).searchParams.get("limit"));

    const delegates = await prisma.confDelegate.findMany({
      where: {
        confId,
        status: { not: "CANCELLED" },
        bookletPhotoPath: { not: null },
      },
      select: {
        id: true,
        bookletPhotoPath: true,
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    const origin = new URL(req.url).origin;
    const items = delegates
      .filter((d) => Boolean(d.bookletPhotoPath))
      .map((d) => ({
        id: d.id,
        imageUrl: resolveStoredAssetUrl(d.bookletPhotoPath!, origin),
      }));

    shuffleInPlace(items);

    return NextResponse.json({
      items: items.slice(0, limit),
      total: items.length,
    });
  } catch (error) {
    console.error("Failed to fetch conference photo samples:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo samples" },
      { status: 500 },
    );
  }
}
