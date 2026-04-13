import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";

// POST /api/conf/[confId]/payments/[paymentId]/upload — upload payment proof screenshot
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; paymentId: string }> },
) {
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const payment = await prisma.confPayment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        confId: true,
      },
    });

    if (!payment || payment.confId !== confId) {
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

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType: file.type === "application/pdf" ? "document" : "image",
      projectName: "rhub-conf-payments",
    });

    const proof = await prisma.confPaymentProof.create({
      data: {
        paymentId,
        fileName: file.name,
        filePath: uploaded.publicUrl,
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
