import { NextRequest, NextResponse } from "next/server";
import { getVideoSession, toSessionResponse } from "@/lib/download-hub/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = getVideoSession(id);

  if (!session) {
    return NextResponse.json(
      { error: "Session expired or not found. Paste the URL again." },
      { status: 404 },
    );
  }

  return NextResponse.json(toSessionResponse(session));
}
