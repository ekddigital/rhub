import { ConfDashboard } from "@/components/tools/conf/conf-dashboard";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function ConferencePage() {
  await requireConferencePageAccess("/tools/conf");

  return (
    <div className="py-6">
      <ConfDashboard />
    </div>
  );
}
