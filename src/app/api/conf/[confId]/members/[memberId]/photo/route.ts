import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/conf/[confId]/members/[memberId]/photo — upload a committee profile photo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; memberId: string }> },
) {
  try {
    const { confId, memberId } = await params;

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

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "conf",
      "members",
    );
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const safeName = `${memberId}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const updated = await prisma.confMember.update({
      where: { id: memberId },
      data: {
        photoPath: `/uploads/conf/members/${safeName}`,
        photoFileName: file.name,
      },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error("Failed to upload member photo:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
