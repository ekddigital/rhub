import { NextRequest, NextResponse } from "next/server";
import {
  createVideoSession,
  httpStatusForYtDlpError,
  isYtDlpUnavailableMessage,
  mapYtDlpError,
  YT_DLP_INSTALL_HINT_DEV,
  YT_DLP_MISSING_CODE,
} from "@/lib/download-hub/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function errorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (lower.includes("not available yet")) return 501;
  if (lower.includes("invalid url") || lower.includes("unsupported")) {
    return 400;
  }
  return httpStatusForYtDlpError(message);
}

export async function POST(req: NextRequest) {
  let url: string | undefined;
  try {
    const body = await req.json();
    url = (body as { url?: string }).url;

    if (!url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const session = await createVideoSession(url);
    return NextResponse.json(session);
  } catch (error) {
    console.error("Video info session error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch media info";
    const mapped = mapYtDlpError(message, { phase: "info", url: url?.trim() });
    return NextResponse.json(
      {
        error: mapped,
        ...(isYtDlpUnavailableMessage(message)
          ? {
              code: YT_DLP_MISSING_CODE,
              installHint: YT_DLP_INSTALL_HINT_DEV,
            }
          : {}),
      },
      { status: errorStatus(message) },
    );
  }
}
