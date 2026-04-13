import { MeetingsShell } from "@/components/tools/conf/meetings-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function MeetingsPage() {
  await requireConferencePageAccess("/tools/conf/meetings");

  return (
    <div className="py-6">
      <MeetingsShell />
    </div>
  );
}
