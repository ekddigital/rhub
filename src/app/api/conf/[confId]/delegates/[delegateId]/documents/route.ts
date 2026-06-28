import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";
import { validateDelegateDocumentUpload } from "@/lib/conf/upload-validation";
import { resolveFileByteSize } from "@/lib/conf/resolve-file-size";

// POST /api/conf/[confId]/delegates/[delegateId]/documents
// Upload delegate documents: kind=passport|entry-stamp|visa|booklet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const { confId, delegateId } = await params;

    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
      select: {
        id: true,
        confId: true,
        feePaid: true,
        lastEntryStampPath: true,
        currentVisaPath: true,
        bookletPhotoPath: true,
      },
    });

    if (!delegate || delegate.confId !== confId) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 },
      );
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

    if (!["passport", "entry-stamp", "visa", "booklet"].includes(kind)) {
      return NextResponse.json(
        {
          error: "kind must be passport, entry-stamp, visa, or booklet",
          requestId,
        },
        { status: 400 },
      );
    }

    const resolvedSize = await resolveFileByteSize(file);
    const validation = validateDelegateDocumentUpload(
      file,
      kind as "passport" | "entry-stamp" | "visa" | "booklet",
      { sizeBytes: resolvedSize },
    );
    if (!validation.ok) {
      console.warn("[conf.delegate.document.invalid_file]", {
        requestId,
        confId,
        delegateId,
        kind,
        fileName: file.name,
        fileType: file.type || null,
        inferredMime: validation.normalizedMime,
        fileSize: file.size,
      });
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

    const isTravelDoc = kind !== "booklet";
    console.info("[conf.delegate.document.upload_start]", {
      requestId,
      confId,
      delegateId,
      kind,
      fileName: file.name,
      fileType: file.type || null,
      inferredMime: validation.normalizedMime,
      fileSize: file.size,
    });

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType:
        isTravelDoc && validation.normalizedMime === "application/pdf"
          ? "document"
          : "image",
      projectName: `rhub-conf-delegates-${kind}`,
      requestId,
      source: "conf.delegate.documents",
    });
    const publicPath = uploaded.downloadUrl || uploaded.publicUrl;

    const updateData: Record<string, string> =
      kind === "passport"
        ? { passportPhotoPath: publicPath }
        : kind === "entry-stamp"
          ? { lastEntryStampPath: publicPath }
          : kind === "visa"
            ? { currentVisaPath: publicPath }
            : { bookletPhotoPath: publicPath };

    const updated = (await prisma.confDelegate.update({
      where: { id: delegateId },
      data: updateData as never,
    })) as unknown as {
      id: string;
      feePaid: boolean;
      bookletPhotoPath: string | null;
      flyerReady: boolean;
      flyerIssuedAt: Date | null;
    };

    const flyerReady = canIssueFlyer({
      feePaid: updated.feePaid,
      bookletPhotoPath: updated.bookletPhotoPath,
    });

    if (updated.flyerReady !== flyerReady) {
      await prisma.confDelegate.update({
        where: { id: updated.id },
        data: {
          flyerReady,
          flyerIssuedAt: flyerReady
            ? updated.flyerIssuedAt || new Date()
            : null,
        } as never,
      });
    }

    console.info("[conf.delegate.document.upload_success]", {
      requestId,
      confId,
      delegateId,
      kind,
      flyerReady,
      storedPath: publicPath,
    });

    return NextResponse.json(
      {
        delegateId: updated.id,
        kind,
        filePath: publicPath,
        flyerReady,
        requestId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[conf.delegate.document.upload_error]", {
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
