import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { assetsBearerHeaders } from "@/lib/conf/delegate-document-urls";

// GET /api/conf/[confId]/photo-samples/[delegateId]/image
// Public proxy for anonymized registration sample photos (no login required).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  const { confId, delegateId } = await params;

  const delegate = await prisma.confDelegate.findFirst({
    where: {
      id: delegateId,
      confId,
      status: { not: "CANCELLED" },
      bookletPhotoPath: { not: null },
    },
    select: { bookletPhotoPath: true },
  });

  if (!delegate?.bookletPhotoPath) {
    return new Response("Not found", { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${proto}://${host}`;

  const assetUrl = resolveStoredAssetUrl(delegate.bookletPhotoPath, origin);
  const previewUrl = assetUrl.includes("?")
    ? `${assetUrl}&preview=true`
    : `${assetUrl}?preview=true`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(previewUrl, {
      cache: "no-store",
      headers: {
        ...assetsBearerHeaders(),
        Accept: "image/*,*/*",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Failed to fetch asset", { status: 502 });
  }

  if (!upstreamRes.ok) {
    return new Response("Asset unavailable", { status: upstreamRes.status });
  }

  const contentType =
    upstreamRes.headers.get("content-type") ?? "application/octet-stream";

  return new Response(upstreamRes.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
