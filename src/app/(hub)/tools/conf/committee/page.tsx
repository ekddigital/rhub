import { CommitteeShell } from "@/components/tools/conf/committee-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function CommitteePage() {
  await requireConferencePageAccess("/tools/conf/committee");

  return (
    <div className="py-6">
      <CommitteeShell />
    </div>
  );
}
