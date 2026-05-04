import { NextResponse } from "next/server";
import {
  ensureDefaultConference,
  isConferenceDatabaseUnavailableError,
} from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/conf/default/delegate-register-prefill
 * Best-effort hints for the public delegate registration form when the visitor is logged in.
 * Uses hub account name/email and, when linked, committee roster phone/city.
 */
export async function GET() {
  try {
    const event = await ensureDefaultConference();
    const access = await getConferenceAccess(event.id);

    if (!access.user) {
      return NextResponse.json({ authenticated: false as const });
    }

    const user = access.user;

    const member =
      access.memberId != null
        ? await prisma.confMember.findFirst({
            where: {
              id: access.memberId,
              confId: event.id,
              isActive: true,
            },
            select: {
              name: true,
              phone: true,
              city: true,
            },
          })
        : await prisma.confMember.findFirst({
            where: {
              confId: event.id,
              isActive: true,
              OR: [{ userId: user.id }, { email: user.email }],
            },
            select: {
              name: true,
              phone: true,
              city: true,
            },
          });

    const nameFromMember = member?.name?.trim();
    const phone = member?.phone?.trim() ?? "";
    const city = member?.city?.trim() ?? "";

    return NextResponse.json({
      authenticated: true as const,
      name: nameFromMember || user.name?.trim() || "",
      email: user.email?.trim() || "",
      phone,
      city,
      province: "",
    });
  } catch (error) {
    if (isConferenceDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[delegate-register-prefill]", error);
    return NextResponse.json(
      { error: "Failed to load registration hints" },
      { status: 500 },
    );
  }
}
