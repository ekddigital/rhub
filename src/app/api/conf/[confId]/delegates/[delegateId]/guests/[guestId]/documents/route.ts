import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";
import { validateDelegateDocumentUpload } from "@/lib/conf/upload-validation";
import { resolveFileByteSize } from "@/lib/conf/resolve-file-size";

// POST /api/conf/[confId]/delegates/[delegateId]/guests/[guestId]/documents
export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ confId: string; delegateId: string; guestId: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const { confId, delegateId, guestId } = await params;

    const guest = await prisma.confDelegateGuest.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        confId: true,
        delegateId: true,
      },
    });

    if (
      !guest ||
      guest.confId !== confId ||
      guest.delegateId !== delegateId
    ) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") || "").toLowerCase();

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded", requestId },
        { status: 400 },
      );
    }

    if (!["passport", "entry-stamp", "visa"].includes(kind)) {
      return NextResponse.json(
        { error: "kind must be passport, entry-stamp, or visa", requestId },
        { status: 400 },
      );
    }

    const resolvedSize = await resolveFileByteSize(file);
    const validation = validateDelegateDocumentUpload(
      file,
      kind as "passport" | "entry-stamp" | "visa",
      { sizeBytes: resolvedSize },
    );
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, requestId },
        { status: 400 },
      );
    }

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType:
        validation.normalizedMime === "application/pdf" ? "document" : "image",
      projectName: `rhub-conf-guests-${kind}`,
      requestId,
      source: "conf.delegate-guest.documents",
    });
    const publicPath = uploaded.downloadUrl || uploaded.publicUrl;

    const updateData: Record<string, string> =
      kind === "passport"
        ? { passportPhotoPath: publicPath }
        : kind === "entry-stamp"
          ? { lastEntryStampPath: publicPath }
          : { currentVisaPath: publicPath };

    const updated = await prisma.confDelegateGuest.update({
      where: { id: guestId },
      data: updateData as never,
      select: { id: true },
    });

    return NextResponse.json(
      {
        guestId: updated.id,
        kind,
        filePath: publicPath,
        requestId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[conf.delegate-guest.document.upload_error]", {
      requestId,
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
