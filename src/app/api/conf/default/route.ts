import { NextResponse } from "next/server";
import {
  ensureDefaultConference,
  DEFAULT_CONF_SLUG,
  isConferenceDatabaseUnavailableError,
} from "@/lib/conf/bootstrap";
import { CONF_2026 } from "@/lib/conf/config";

// GET /api/conf/default — ensure and return the LSUIC conference event
export async function GET() {
  try {
    const event = await ensureDefaultConference();
    return NextResponse.json({
      id: event.id,
      slug: event.slug,
      year: event.year,
      name: event.name,
      delegateFee: CONF_2026.delegateFee,
      defaultSlug: DEFAULT_CONF_SLUG,
    });
  } catch (error) {
    if (isConferenceDatabaseUnavailableError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to initialize default conference:", error);
    return NextResponse.json(
      { error: "Failed to initialize default conference" },
      { status: 500 },
    );
  }
}
