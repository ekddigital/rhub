import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { canViewDelegateDocuments } from "@/lib/conf/conference-hotel-access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { assetsBearerHeaders } from "@/lib/conf/delegate-document-urls";

type GuestSecureDocumentKind = "passport" | "entry-stamp" | "visa";

function getKindLabel(kind: GuestSecureDocumentKind) {
  if (kind === "passport") return "passport";
  if (kind === "entry-stamp") return "last-entry-stamp";
  return "current-visa";
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

// GET /api/conf/[confId]/delegates/[delegateId]/guests/[guestId]/secure-document?kind=passport|entry-stamp|visa
export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ confId: string; delegateId: string; guestId: string }>;
  },
) {
  const { confId, delegateId, guestId } = await params;
  const requestUrl = new URL(req.url);
  const kindParam = (requestUrl.searchParams.get("kind") || "").toLowerCase();

  if (!["passport", "entry-stamp", "visa"].includes(kindParam)) {
    return new Response("Invalid document kind", { status: 400 });
  }
  const kind = kindParam as GuestSecureDocumentKind;

  const auth = await requireConferenceApiAccess(confId, "participant");
  if (!auth.ok) return auth.response;

  const canViewDocs = canViewDelegateDocuments(auth.access);
  const isOwner = auth.access.delegateId === delegateId;

  if (!canViewDocs && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const guest = await prisma.confDelegateGuest.findUnique({
    where: { id: guestId },
    select: {
      confId: true,
      delegateId: true,
      name: true,
      passportPhotoPath: true,
      lastEntryStampPath: true,
      currentVisaPath: true,
    },
  });

  if (
    !guest ||
    guest.confId !== confId ||
    guest.delegateId !== delegateId
  ) {
    return new Response("Not found", { status: 404 });
  }

  const sourcePath =
    kind === "passport"
      ? guest.passportPhotoPath
      : kind === "entry-stamp"
        ? guest.lastEntryStampPath
        : guest.currentVisaPath;

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
  const safeName = guest.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = contentType.includes("pdf")
    ? "pdf"
    : contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

  const status = upstreamRes.status === 206 ? 206 : 200;
  return new Response(upstreamRes.body, {
    status,
    headers: inlineProxyHeaders(
      upstreamRes,
      `${safeName}_guest_${getKindLabel(kind)}.${ext}`,
    ),
  });
}
