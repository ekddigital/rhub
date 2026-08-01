import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  PAYMENT_REGISTER_CONFIG_TITLE,
  createDefaultPaymentRegisterConfig,
  parsePaymentRegisterConfig,
  migrateSignatoryDraft,
  type PaymentRegisterConfig,
} from "@/lib/conf/payment-register-config";
import type { SignatoryDraft } from "@/components/tools/conf/document-signatory-controls";

// GET /api/conf/[confId]/payments/register-config
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const row = await prisma.confLetter.findFirst({
      where: {
        confId,
        isDeleted: false,
        title: PAYMENT_REGISTER_CONFIG_TITLE,
      },
      select: { draft: true, updatedAt: true },
    });

    if (!row) {
      return NextResponse.json(createDefaultPaymentRegisterConfig());
    }

    const parsed = parsePaymentRegisterConfig(row.draft);
    if (!parsed) {
      return NextResponse.json(createDefaultPaymentRegisterConfig());
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch payment register config:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment register config" },
      { status: 500 },
    );
  }
}

// PUT /api/conf/[confId]/payments/register-config
// Body: { preparedByMemberId?: string, signatoryDraft?: SignatoryDraft }
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      preparedByMemberId?: string;
      signatoryDraft?: SignatoryDraft;
    };

    const existing = await prisma.confLetter.findFirst({
      where: {
        confId,
        isDeleted: false,
        title: PAYMENT_REGISTER_CONFIG_TITLE,
      },
      select: { id: true, draft: true },
    });

    const current =
      parsePaymentRegisterConfig(existing?.draft) ??
      createDefaultPaymentRegisterConfig();

    const config: PaymentRegisterConfig = {
      configType: "PAYMENT_REGISTER_CONFIG",
      preparedByMemberId:
        body.preparedByMemberId !== undefined
          ? String(body.preparedByMemberId)
          : current.preparedByMemberId,
      signatoryDraft: body.signatoryDraft
        ? migrateSignatoryDraft(body.signatoryDraft)
        : current.signatoryDraft,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await prisma.confLetter.update({
        where: { id: existing.id },
        data: {
          draft: config as import("@prisma/client").Prisma.InputJsonValue,
          letterDate: config.updatedAt,
        },
      });
    } else {
      await prisma.confLetter.create({
        data: {
          confId,
          title: PAYMENT_REGISTER_CONFIG_TITLE,
          type: "GENERAL",
          letterDate: config.updatedAt,
          draft: config as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Failed to save payment register config:", error);
    return NextResponse.json(
      { error: "Failed to save payment register config" },
      { status: 500 },
    );
  }
}
