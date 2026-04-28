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
      "Content-Disposition": `inline; filename="${safeName}_${getKindLabel(kind)}.${ext}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

