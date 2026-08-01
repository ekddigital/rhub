import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { assetsBearerHeaders } from "@/lib/conf/delegate-document-urls";

type Params = {
  params: Promise<{ confId: string; paymentId: string; proofId: string }>;
};

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

// GET /api/conf/[confId]/payments/[paymentId]/proofs/[proofId]/file
// Same-origin proxy for payment receipt images/PDFs stored in EKD assets.
export async function GET(req: Request, { params }: Params) {
  const { confId, paymentId, proofId } = await params;

  const auth = await requireConferenceApiAccess(confId, "participant");
  if (!auth.ok) return auth.response;

  const proof = await prisma.confPaymentProof.findFirst({
    where: { id: proofId, paymentId },
    select: {
      id: true,
      fileName: true,
      filePath: true,
      payment: { select: { confId: true } },
    },
  });

  if (!proof || proof.payment.confId !== confId) {
    return new Response("Not found", { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${proto}://${host}`;
  const assetUrl = resolveStoredAssetUrl(proof.filePath, origin);
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
  const safeName = proof.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = contentType.includes("pdf")
    ? "pdf"
    : contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

  const filename = safeName.includes(".") ? safeName : `${safeName}.${ext}`;
  const status = upstreamRes.status === 206 ? 206 : 200;

  return new Response(upstreamRes.body, {
    status,
    headers: inlineProxyHeaders(upstreamRes, filename),
  });
}
