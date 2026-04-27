import { ReportBuilderShell } from "@/components/tools/conf/report-builder-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function ReportBuilderPage() {
  await requireConferencePageAccess("/tools/conf/finance/reports", "manager");

  return (
    <div className="py-6">
      <ReportBuilderShell />
    </div>
  );
}
