import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

type SecureDocumentKind = "passport" | "entry-stamp" | "visa";

function getKindLabel(kind: SecureDocumentKind) {
  if (kind === "passport") return "passport";
  if (kind === "entry-stamp") return "last-entry-stamp";
  return "current-visa";
}

function assetsBearerHeaders(): Record<string, string> {
  const secret =
    process.env.EKD_DIGITAL_ASSETS_API_SECRET?.trim() ||
    process.env.ASSETS_API_SECRET?.trim();
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

function inlineProxyHeaders(upstream: Response, filename: string): HeadersInit {
  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "private, max-age=300",
    "X-Frame-Options": "SAMEORIGIN",
    "Accept-Ranges": "bytes",
  };

  for (const key of ["Content-Range", "Content-Length", "ETag"]) {
    const value = upstream.headers.get(key);
    if (value) headers[key] = value;
  }

  return headers;
}

// GET /api/conf/[confId]/delegates/[delegateId]/secure-document?kind=passport|entry-stamp|visa
// Proxies sensitive delegate documents with Content-Disposition:inline.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  const { confId, delegateId } = await params;
  const requestUrl = new URL(req.url);
  const kindParam = (requestUrl.searchParams.get("kind") || "").toLowerCase();

  if (!["passport", "entry-stamp", "visa"].includes(kindParam)) {
    return new Response("Invalid document kind", { status: 400 });
  }
  const kind = kindParam as SecureDocumentKind;

  const auth = await requireConferenceApiAccess(confId, "participant");
  if (!auth.ok) return auth.response;

  const isManager = auth.access.isManager;
  const isOwner = auth.access.delegateId === delegateId;

  if (kind === "passport" && !isManager) {
    return new Response("Forbidden", { status: 403 });
  }
  if ((kind === "entry-stamp" || kind === "visa") && !isManager && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const delegate = await prisma.confDelegate.findUnique({
    where: { id: delegateId },
    select: {
      confId: true,
      name: true,
      passportPhotoPath: true,
      lastEntryStampPath: true,
      currentVisaPath: true,
    },
  });

  if (!delegate || delegate.confId !== confId) {
    return new Response("Not found", { status: 404 });
  }

  const sourcePath =
    kind === "passport"
      ? delegate.passportPhotoPath
      : kind === "entry-stamp"
        ? delegate.lastEntryStampPath
        : delegate.currentVisaPath;

  if (!sourcePath) {
    return new Response("Document not found", { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${proto}://${host}`;
  const assetUrl = resolveStoredAssetUrl(sourcePath, origin);
  const previewUrl = assetUrl.includes("?")
    ? `${assetUrl}&preview=true`
    : `${assetUrl}?preview=true`;

  const upstreamHeaders: Record<string, string> = {
    ...assetsBearerHeaders(),
    Accept: "*/*",
    "Cache-Control": "no-store",
  };
  const range = req.headers.get("range");
  if (range) upstreamHeaders.Range = range;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(previewUrl, {
      cache: "no-store",
      headers: upstreamHeaders,
    });
  } catch {
    return new Response("Failed to fetch asset", { status: 502 });
  }

  if (!upstreamRes.ok && upstreamRes.status !== 206) {
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
        : contentType.includes("video")
          ? "mp4"
          : "jpg";

  const status = upstreamRes.status === 206 ? 206 : 200;
  return new Response(upstreamRes.body, {
    status,
    headers: inlineProxyHeaders(
      upstreamRes,
      `${safeName}_${getKindLabel(kind)}.${ext}`,
    ),
  });
}
