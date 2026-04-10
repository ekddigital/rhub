import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/conf/[confId]/payments/[paymentId]/upload — upload payment proof screenshot
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; paymentId: string }> },
) {
  try {
    const { paymentId } = await params;

    const payment = await prisma.confPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, and PDF files are allowed" },
        { status: 400 },
      );
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 },
      );
    }

    // Save file to disk
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "conf",
      "payments",
    );
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".png";
    const safeName = `${paymentId}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const proof = await prisma.confPaymentProof.create({
      data: {
        paymentId,
        fileName: file.name,
        filePath: `/uploads/conf/payments/${safeName}`,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    return NextResponse.json(proof, { status: 201 });
  } catch (error) {
    console.error("Failed to upload payment proof:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
