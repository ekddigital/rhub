import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { loadConferenceReportConnectorData } from "@/lib/conf/conference-report/connectors/load-report-data";
import { createReportRuntimeContext } from "@/lib/conf/conference-report/report-runtime";
import { ConferenceReportShell } from "@/components/tools/conf/conference-report-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";
import { absolutizeReceiptPhotoEntryUrls } from "@/lib/conf/payment-receipt-entries";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function resolveReportOrigin(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost";
  const proto =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export default async function ConferenceReportPage() {
  await requireConferencePageAccess(
    "/tools/conf/conference-report",
    "participant",
  );

  let runtime = createReportRuntimeContext(null);

  try {
    const conf = await ensureDefaultConference();
    const connectorData = await loadConferenceReportConnectorData(conf.id);
    const origin = await resolveReportOrigin();
    connectorData.cookingReceiptEntries = absolutizeReceiptPhotoEntryUrls(
      connectorData.cookingReceiptEntries,
      origin,
    );
    runtime = createReportRuntimeContext(connectorData);
  } catch {
    // Fall back to certified snapshot data when database is unavailable.
  }

  return <ConferenceReportShell runtime={runtime} />;
}
