import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  uploadFileToEKDDigitalAssets,
  resolveStoredAssetUrl,
} from "@/lib/conf/assets";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";
import { validateDelegateDocumentUpload } from "@/lib/conf/upload-validation";

// POST /api/conf/[confId]/delegates/[delegateId]/self-documents
// Secure delegate file updates for managers and linked delegate accounts.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const { confId, delegateId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const canManage = auth.access.isManager;
    const isOwner = auth.access.delegateId === delegateId;

    if (!canManage && !isOwner) {
      return NextResponse.json(
        { error: "You can only edit your own delegate profile" },
        { status: 403 },
      );
    }

    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
      select: {
        id: true,
        confId: true,
        feePaid: true,
        passportPhotoPath: true,
        lastEntryStampPath: true,
        currentVisaPath: true,
        bookletPhotoPath: true,
        flyerIssuedAt: true,
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

    if (!canManage && !["booklet", "entry-stamp", "visa"].includes(kind)) {
      return NextResponse.json(
        {
          error:
            "Only managers can replace passport files. Delegates can update booklet photo, last entry stamp, and current visa.",
          requestId,
        },
        { status: 403 },
      );
    }

    const validation = validateDelegateDocumentUpload(
      file,
      kind as "passport" | "entry-stamp" | "visa" | "booklet",
    );
    if (!validation.ok) {
      console.warn("[conf.delegate.self_document.invalid_file]", {
        requestId,
        confId,
        delegateId,
        kind,
        canManage,
        isOwner,
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
    console.info("[conf.delegate.self_document.upload_start]", {
      requestId,
      confId,
      delegateId,
      kind,
      canManage,
      isOwner,
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
      source: "conf.delegate.self-documents",
    });

    const storedPath = uploaded.downloadUrl || uploaded.publicUrl;
    const updateData: Record<string, string> =
      kind === "passport"
        ? { passportPhotoPath: storedPath }
        : kind === "entry-stamp"
          ? { lastEntryStampPath: storedPath }
          : kind === "visa"
            ? { currentVisaPath: storedPath }
            : { bookletPhotoPath: storedPath };

    const updated = await prisma.confDelegate.update({
      where: { id: delegateId },
      data: updateData as never,
    });

    const flyerReady = canIssueFlyer({
      feePaid: updated.feePaid,
      bookletPhotoPath: updated.bookletPhotoPath,
    });

    const finalDelegate = await prisma.confDelegate.update({
      where: { id: delegateId },
      data: {
        flyerReady,
        flyerIssuedAt: flyerReady ? updated.flyerIssuedAt || new Date() : null,
      },
    });

    const origin = new URL(req.url).origin;
    console.info("[conf.delegate.self_document.upload_success]", {
      requestId,
      confId,
      delegateId,
      kind,
      flyerReady,
      storedPath,
    });
    return NextResponse.json({
      ...finalDelegate,
      requestId,
      passportPhotoPath: finalDelegate.passportPhotoPath
        ? resolveStoredAssetUrl(finalDelegate.passportPhotoPath, origin)
        : null,
      lastEntryStampPath: finalDelegate.lastEntryStampPath
        ? resolveStoredAssetUrl(finalDelegate.lastEntryStampPath, origin)
        : null,
      currentVisaPath: finalDelegate.currentVisaPath
        ? resolveStoredAssetUrl(finalDelegate.currentVisaPath, origin)
        : null,
      bookletPhotoPath: finalDelegate.bookletPhotoPath
        ? resolveStoredAssetUrl(finalDelegate.bookletPhotoPath, origin)
        : null,
    });
  } catch (error) {
    console.error("[conf.delegate.self_document.upload_error]", {
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
