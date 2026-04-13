import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canIssueFlyer } from "@/lib/conf/delegate-utils";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";

// POST /api/conf/[confId]/delegates/[delegateId]/documents
// Upload delegate documents: kind=passport|booklet
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

    if (!["passport", "booklet"].includes(kind)) {
      return NextResponse.json(
        { error: "kind must be passport or booklet" },
        { status: 400 },
      );
    }

    const isPassport = kind === "passport";
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

    const allowedTypes = isPassport ? allowedPassport : allowedBooklet;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: isPassport
            ? "Passport upload supports PNG, JPEG, WebP, or PDF"
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
        isPassport && file.type === "application/pdf" ? "document" : "image",
      projectName: `rhub-conf-delegates-${kind}`,
    });
    const publicPath = uploaded.downloadUrl || uploaded.publicUrl;

    const updateData = (
      isPassport
        ? { passportPhotoPath: publicPath }
        : { bookletPhotoPath: publicPath }
    ) as Record<string, string>;

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
