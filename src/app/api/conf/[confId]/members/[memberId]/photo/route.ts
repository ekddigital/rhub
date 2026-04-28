import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { validateDelegateDocumentUpload } from "@/lib/conf/upload-validation";

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

    const origin = new URL(req.url).origin;
    return NextResponse.json(
      {
        ...updated,
        requestId,
        photoPath: updated.photoPath
          ? resolveStoredAssetUrl(updated.photoPath, origin)
          : null,
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
