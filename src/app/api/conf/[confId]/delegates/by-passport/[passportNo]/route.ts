import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { normalizeDelegatePassport } from "@/lib/conf/delegate-utils";
import { mapDelegateDocumentsForClient } from "@/lib/conf/delegate-document-urls";
import { parseDelegateCommentsWithAddOns } from "@/lib/conf/delegate-fee-addons";

// GET /api/conf/[confId]/delegates/by-passport/[passportNo]
// Resolves a passport number → delegate record.
// Access rules (same as individual delegate GET):
//   - Managers (SUPER_ADMIN, ADMIN, JUDGE_ADMIN, HEAD_JUDGE, CHAIR, VICE_CHAIR) → full access
//   - A participant whose *own* delegate record matches this passport → full access
//   - Everyone else → 403
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string; passportNo: string }> },
) {
  const { confId, passportNo } = await params;

  const auth = await requireConferenceApiAccess(confId, "participant");
  if (!auth.ok) return auth.response;

  const normalized = normalizeDelegatePassport(passportNo);
  if (!normalized) {
    return NextResponse.json(
      { error: "Invalid passport number" },
      { status: 400 },
    );
  }

  const delegate = await prisma.confDelegate.findFirst({
    where: { confId, passportNo: normalized },
  });

  if (!delegate) {
    return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
  }

  // Access check: manager OR the matching delegate (by session delegateId,
  // userId, or email).
  const { isManager, delegateId, user } = auth.access;

  const isSelf =
    delegateId === delegate.id ||
    (user && delegate.userId && user.id === delegate.userId) ||
    (user &&
      delegate.email &&
      user.email.toLowerCase() === delegate.email.toLowerCase());

  if (!isManager && !isSelf) {
    return NextResponse.json(
      {
        error:
          "Access denied. You may only view your own delegate record unless you have manager access.",
      },
      { status: 403 },
    );
  }

  const parsed = parseDelegateCommentsWithAddOns(delegate.additionalComments);

  return NextResponse.json({
    ...delegate,
    additionalComments: parsed.additionalComments,
    addOnPackageIds: parsed.addOnPackageIds,
    ...mapDelegateDocumentsForClient(confId, delegate.id, {
      passportPhotoPath: delegate.passportPhotoPath,
      lastEntryStampPath: delegate.lastEntryStampPath,
      currentVisaPath: delegate.currentVisaPath,
      bookletPhotoPath: delegate.bookletPhotoPath,
    }),
  });
}
