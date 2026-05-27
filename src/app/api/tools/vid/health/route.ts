import { NextResponse } from "next/server";
import {
  ensureDownloadHubDepsViaTerminal,
  isDownloadHubAutoInstallEnabled,
  isTtydTerminalConfigured,
} from "@/lib/download-hub/install-via-terminal";
import { getDownloadHubHealthResponse } from "@/lib/download-hub/health-status";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  let health = await getDownloadHubHealthResponse();
  let autoInstall: Awaited<ReturnType<typeof ensureDownloadHubDepsViaTerminal>> | undefined;

  if (
    isDownloadHubAutoInstallEnabled() &&
    isTtydTerminalConfigured() &&
    !health.readyForDownloads &&
    !health.remoteInstallOk
  ) {
    autoInstall = await ensureDownloadHubDepsViaTerminal();
    health = await getDownloadHubHealthResponse();
  }

  return NextResponse.json(
    {
      ...health,
      autoInstallAttempted: Boolean(autoInstall),
      autoInstall,
    },
    {
      status: health.readyForDownloads ? 200 : 503,
    },
  );
}
