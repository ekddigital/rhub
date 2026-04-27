import { TimelineShell } from "@/components/tools/conf/timeline-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function TimelinePage() {
  await requireConferencePageAccess("/tools/conf/timeline", "manager");

  return (
    <div className="py-6">
      <TimelineShell />
    </div>
  );
}
