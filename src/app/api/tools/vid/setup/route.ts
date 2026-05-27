import { NextRequest, NextResponse } from "next/server";
import { isAdminApiAuthorized } from "@/lib/admin-api-auth";
import { ensureDownloadHubDepsViaTerminal } from "@/lib/download-hub/install-via-terminal";
import { getDownloadHubHealthResponse } from "@/lib/download-hub/health-status";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GET: Check yt-dlp/ffmpeg on the TTYD host and on the current Next.js runtime host.
 */
export async function GET() {
  try {
    const health = await getDownloadHubHealthResponse();

    return NextResponse.json({
      success: true,
      ready: health.readyForDownloads,
      remoteReady: health.remoteInstallOk,
      readyForDownloads: health.readyForDownloads,
      remoteInstallOk: health.remoteInstallOk,
      local: health.local,
      remote: health.remote,
      statusMessage: health.statusMessage,
      envSuggestions: health.envSuggestions,
      message: health.statusMessage,
      curlExample: "curl -X POST http://localhost:3000/api/tools/vid/setup",
    });
  } catch (error) {
    console.error("[Vid Setup] Check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST: Install yt-dlp + ffmpeg on the TTYD host via executeRemoteCommand (admin/setup style).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdminApiAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized. Provide valid admin key in Authorization header.",
        },
        { status: 401 },
      );
    }

    const result = await ensureDownloadHubDepsViaTerminal();

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      {
        status: result.success ? 200 : 503,
      },
    );
  } catch (error) {
    console.error("[Vid Setup] Install error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
