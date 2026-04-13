import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

// POST /api/conf/[confId]/members/[memberId]/photo — upload a committee profile photo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; memberId: string }> },
) {
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
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 8MB" },
        { status: 400 },
      );
    }

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType: "image",
      projectName: "rhub-conf-members",
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
        photoPath: updated.photoPath
          ? resolveStoredAssetUrl(updated.photoPath, origin)
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload member photo:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
