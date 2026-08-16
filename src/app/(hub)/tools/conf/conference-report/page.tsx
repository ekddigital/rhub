import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { loadConferenceReportConnectorData } from "@/lib/conf/conference-report/connectors";
import { createReportRuntimeContext } from "@/lib/conf/conference-report/report-runtime";
import { ConferenceReportShell } from "@/components/tools/conf/conference-report-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export const dynamic = "force-dynamic";

export default async function ConferenceReportPage() {
  await requireConferencePageAccess(
    "/tools/conf/conference-report",
    "participant",
  );

  let runtime = createReportRuntimeContext(null);

  try {
    const conf = await ensureDefaultConference();
    const connectorData = await loadConferenceReportConnectorData(conf.id);
    runtime = createReportRuntimeContext(connectorData);
  } catch {
    // Fall back to certified snapshot data when database is unavailable.
  }

  return <ConferenceReportShell runtime={runtime} />;
}
