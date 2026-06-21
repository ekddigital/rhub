import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { uploadFileToEKDDigitalAssets, resolveStoredAssetUrl } from "@/lib/conf/assets";
import {
  assetsBearerHeaders,
  resolveMemberPhotoForClient,
} from "@/lib/conf/delegate-document-urls";
import { validateDelegateDocumentUpload } from "@/lib/conf/upload-validation";

// GET /api/conf/[confId]/members/[memberId]/photo — inline committee profile photo
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string; memberId: string }> },
) {
  const { confId, memberId } = await params;
  const auth = await requireConferenceApiAccess(confId, "participant");
  if (!auth.ok) return auth.response;

  const member = await prisma.confMember.findUnique({
    where: { id: memberId },
    select: { confId: true, photoPath: true, name: true },
  });

  if (!member || member.confId !== confId || !member.photoPath) {
    return new Response("Not found", { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${proto}://${host}`;
  const assetUrl = resolveStoredAssetUrl(member.photoPath, origin);
  const previewUrl = assetUrl.includes("?")
    ? `${assetUrl}&preview=true`
    : `${assetUrl}?preview=true`;

  const upstreamHeaders: Record<string, string> = {
    ...assetsBearerHeaders(),
    Accept: "image/*,*/*",
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
  const safeName = member.name.replace(/[^a-zA-Z0-9_-]/g, "_");

  const responseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${safeName}_photo.jpg"`,
    "Cache-Control": "private, max-age=300",
    "Accept-Ranges": "bytes",
  };

  for (const key of ["Content-Range", "Content-Length", "ETag"]) {
    const value = upstreamRes.headers.get(key);
    if (value) responseHeaders[key] = value;
  }

  const status = upstreamRes.status === 206 ? 206 : 200;
  return new Response(upstreamRes.body, {
    status,
    headers: responseHeaders,
  });
}

// POST /api/conf/[confId]/members/[memberId]/photo — upload a committee profile photo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; memberId: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const { confId, memberId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const member = await prisma.confMember.findUnique({
      where: { id: memberId },
      select: { id: true, confId: true },
    });

    if (!member || member.confId !== confId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded", requestId },
        { status: 400 },
      );
    }

    const validation = validateDelegateDocumentUpload(file, "booklet");
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: validation.error,
          requestId,
          details: {
            receivedMime: file.type || null,
            inferredMime: validation.normalizedMime,
            supportedMimeTypes: validation.supportedMimeTypes,
            maxSizeBytes: validation.maxSizeBytes,
          },
        },
        { status: 400 },
      );
    }

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType: "image",
      projectName: "rhub-conf-members",
      requestId,
      source: "conf.member.photo",
    });

    const storedPhotoPath = uploaded.downloadUrl || uploaded.publicUrl;

    const updated = await prisma.confMember.update({
      where: { id: memberId },
      data: {
        photoPath: storedPhotoPath,
        photoFileName: file.name,
      },
    });

    return NextResponse.json(
      {
        ...updated,
        requestId,
        photoPath: resolveMemberPhotoForClient(
          confId,
          memberId,
          updated.photoPath,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[conf.member.photo.upload_error]", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown upload error",
      error,
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Upload failed: ${error.message}`
            : "Upload failed",
        requestId,
      },
      { status: 500 },
    );
  }
}
