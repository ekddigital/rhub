import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  buildSignatureProfileTitle,
  normalizeSignatureProfileKey,
  SIGNATURE_PROFILE_TITLE_PREFIX,
} from "@/lib/conf/signature-profiles";

type SignatureProfileDraft = {
  profileType: "SIGNATURE_PROFILE";
  key: string;
  name: string;
  title?: string;
  signatureDataUrl: string;
  updatedAt: string;
};

// GET /api/conf/[confId]/letters/signatures
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const rows = await prisma.confLetter.findMany({
      where: {
        confId,
        isDeleted: false,
        title: { startsWith: SIGNATURE_PROFILE_TITLE_PREFIX },
      },
      orderBy: { updatedAt: "desc" },
      select: { title: true, draft: true, updatedAt: true },
    });

    const profiles = rows
      .map((row) => row.draft as unknown as Partial<SignatureProfileDraft>)
      .filter(
        (draft) =>
          draft.profileType === "SIGNATURE_PROFILE" &&
          typeof draft.key === "string" &&
          typeof draft.name === "string" &&
          typeof draft.signatureDataUrl === "string" &&
          draft.signatureDataUrl.length > 0,
      )
      .map((draft) => ({
        key: draft.key as string,
        name: draft.name as string,
        title: (draft.title as string | undefined) || "",
        signatureDataUrl: draft.signatureDataUrl as string,
      }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Failed to fetch signature profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature profiles" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/letters/signatures
// Body: { name: string, title?: string, signatureDataUrl: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      name?: string;
      title?: string;
      signatureDataUrl?: string;
    };

    const name = String(body.name || "").trim();
    const title = String(body.title || "").trim();
    const signatureDataUrl = String(body.signatureDataUrl || "").trim();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!signatureDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "signatureDataUrl must be an image data URL" },
        { status: 400 },
      );
    }

    const key = normalizeSignatureProfileKey(name);
    const profileTitle = buildSignatureProfileTitle(name);
    const draft: SignatureProfileDraft = {
      profileType: "SIGNATURE_PROFILE",
      key,
      name,
      title,
      signatureDataUrl,
      updatedAt: new Date().toISOString(),
    };

    const existing = await prisma.confLetter.findFirst({
      where: {
        confId,
        isDeleted: false,
        title: profileTitle,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.confLetter.update({
        where: { id: existing.id },
        data: {
          draft: draft as import("@prisma/client").Prisma.InputJsonValue,
          letterDate: new Date().toISOString(),
        },
      });
    } else {
      await prisma.confLetter.create({
        data: {
          confId,
          title: profileTitle,
          type: "GENERAL",
          letterDate: new Date().toISOString(),
          draft: draft as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error("Failed to save signature profile:", error);
    return NextResponse.json(
      { error: "Failed to save signature profile" },
      { status: 500 },
    );
  }
}
