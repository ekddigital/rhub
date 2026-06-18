import { LogisticsNameListShell } from "@/components/tools/conf/logistics-name-list-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function LogisticsNameListPage() {
  await requireConferencePageAccess(
    "/tools/conf/logistics/name-list",
    "manager",
  );

  return (
    <div className="py-6">
      <LogisticsNameListShell />
    </div>
  );
}
