import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  uploadFileToEKDDigitalAssets,
  resolveStoredAssetUrl,
} from "@/lib/conf/assets";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";

// POST /api/conf/[confId]/delegates/[delegateId]/self-documents
// Secure delegate file updates for managers and linked delegate accounts.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
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
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!["passport", "entry-stamp", "visa", "booklet"].includes(kind)) {
      return NextResponse.json(
        { error: "kind must be passport, entry-stamp, visa, or booklet" },
        { status: 400 },
      );
    }

    if (!canManage && !["booklet", "entry-stamp", "visa"].includes(kind)) {
      return NextResponse.json(
        {
          error:
            "Only managers can replace passport files. Delegates can update booklet photo, last entry stamp, and current visa.",
        },
        { status: 403 },
      );
    }

    const isBooklet = kind === "booklet";
    const isTravelDoc = !isBooklet;
    const allowedPassport = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    const allowedBooklet = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    const allowedTypes = isTravelDoc ? allowedPassport : allowedBooklet;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: isTravelDoc
            ? "Passport/entry stamp/visa upload supports PNG, JPEG, WebP, or PDF"
            : "Booklet photo supports PNG, JPEG, or WebP",
        },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 },
      );
    }

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType:
        isTravelDoc && file.type === "application/pdf" ? "document" : "image",
      projectName: `rhub-conf-delegates-${kind}`,
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
    return NextResponse.json({
      ...finalDelegate,
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
    console.error("Failed to update delegate self documents:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
