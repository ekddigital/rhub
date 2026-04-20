import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { headers } from "next/headers";

// GET /api/conf/[confId]/delegates/[delegateId]/passport-view
// Proxies the delegate's passport document with Content-Disposition: inline
// so the browser renders it instead of downloading it.
// Access: manager only.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  const { confId, delegateId } = await params;

  const auth = await requireConferenceApiAccess(confId, "manager");
  if (!auth.ok) return auth.response;

  const delegate = await prisma.confDelegate.findUnique({
    where: { id: delegateId },
    select: { confId: true, passportPhotoPath: true, name: true },
  });

  if (!delegate || delegate.confId !== confId) {
    return new Response("Not found", { status: 404 });
  }

  if (!delegate.passportPhotoPath) {
    return new Response("No passport document on file", { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${proto}://${host}`;

  const assetUrl = resolveStoredAssetUrl(delegate.passportPhotoPath, origin);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(assetUrl, { cache: "no-store" });
  } catch {
    return new Response("Failed to fetch asset", { status: 502 });
  }

  if (!upstreamRes.ok) {
    return new Response("Asset unavailable", { status: upstreamRes.status });
  }

  const contentType =
    upstreamRes.headers.get("content-type") ?? "application/octet-stream";
  const safeName = delegate.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = contentType.includes("pdf")
    ? "pdf"
    : contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

  const body = await upstreamRes.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${safeName}_passport.${ext}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
