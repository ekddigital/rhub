import { ConferenceReportShell } from "@/components/tools/conf/conference-report-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function ConferenceReportPage() {
  await requireConferencePageAccess(
    "/tools/conf/conference-report",
    "participant",
  );
  return <ConferenceReportShell />;
}
