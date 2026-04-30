import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";
import { validateDelegateDocumentUpload } from "@/lib/conf/upload-validation";

// POST /api/conf/[confId]/payments/[paymentId]/upload — upload payment proof screenshot
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; paymentId: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const { confId, paymentId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const payment = await prisma.confPayment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        confId: true,
        isLocked: true,
        status: true,
      },
    });

    if (!payment || payment.confId !== confId) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.isLocked || payment.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved/locked payments cannot receive new proof files" },
        { status: 409 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded", requestId },
        { status: 400 },
      );
    }

    const validation = validateDelegateDocumentUpload(file, "passport");
    if (!validation.ok) {
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

    const uploaded = await uploadFileToEKDDigitalAssets({
      file,
      assetType: validation.normalizedMime === "application/pdf" ? "document" : "image",
      projectName: "rhub-conf-payments",
      requestId,
      source: "conf.payment.proof-upload",
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

    return NextResponse.json({ ...proof, requestId }, { status: 201 });
  } catch (error) {
    console.error("[conf.payment.proof_upload_error]", {
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
