import { FlyerStudioShell } from "@/components/tools/conf/flyer-studio-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function FlyerStudioPage() {
  await requireConferencePageAccess("/tools/conf/flyers", "manager");

  return (
    <div className="py-6">
      <FlyerStudioShell />
    </div>
  );
}
