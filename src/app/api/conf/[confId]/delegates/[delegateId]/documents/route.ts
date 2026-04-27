import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";

// POST /api/conf/[confId]/delegates/[delegateId]/documents
// Upload delegate documents: kind=passport|entry-stamp|visa|booklet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; delegateId: string }> },
) {
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
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!["passport", "entry-stamp", "visa", "booklet"].includes(kind)) {
      return NextResponse.json(
        { error: "kind must be passport, entry-stamp, visa, or booklet" },
        { status: 400 },
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

    return NextResponse.json(
      {
        delegateId: updated.id,
        kind,
        filePath: publicPath,
        flyerReady,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload delegate document:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
