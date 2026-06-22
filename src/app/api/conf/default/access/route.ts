import { NextResponse } from "next/server";
import {
  ensureDefaultConference,
  isConferenceDatabaseUnavailableError,
} from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";
import { isConferenceHotelCheckinOnly } from "@/lib/conf/conference-hotel-access";

// GET /api/conf/default/access
// Returns lightweight conference access flags for navigation filtering.
export async function GET() {
  try {
    const event = await ensureDefaultConference();
    const access = await getConferenceAccess(event.id);

    return NextResponse.json({
      confId: event.id,
      isAuthenticated: Boolean(access.user),
      isParticipant: access.isParticipant,
      isManager: access.isManager,
      isChair: access.isChair,
      isSuperAdmin: access.isSuperAdmin,
      isHotelCheckin: access.isHotelCheckin,
      isHotelCheckinOnly: isConferenceHotelCheckinOnly(access),
    });
  } catch (error) {
    if (isConferenceDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to resolve conference access:", error);
    return NextResponse.json(
      { error: "Failed to resolve conference access" },
      { status: 500 },
    );
  }
}
