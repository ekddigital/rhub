import { NextRequest, NextResponse } from "next/server";
import {
  createVideoSession,
  httpStatusForYtDlpError,
  isYtDlpUnavailableMessage,
  mapYtDlpError,
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
    const safeError =
      typeof mapped === "string" &&
      mapped.trim().length > 0 &&
      !/^(null|undefined|nan)$/i.test(mapped.trim())
        ? mapped
        : "Failed to fetch media metadata from source. Try again.";
    return NextResponse.json(
      {
        error: safeError,
        ...(isYtDlpUnavailableMessage(message)
          ? {
              code: YT_DLP_MISSING_CODE,
              installHint:
                'Install on the VPS via "Install on server" or POST /api/tools/vid/setup.',
            }
          : {}),
      },
      { status: errorStatus(message) },
    );
  }
}
