import { DelegatesShell } from "@/components/tools/conf/delegates-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function DelegatesPage() {
  await requireConferencePageAccess("/tools/conf/delegates", "participant");

  return (
    <div className="py-6">
      <DelegatesShell />
    </div>
  );
}
