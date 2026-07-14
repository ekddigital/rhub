import { NavigationGuideShell } from "@/components/tools/conf/navigation-guide-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function NavigationGuidePage() {
  await requireConferencePageAccess(
    "/tools/conf/navigation-guide",
    "participant",
  );
  return <NavigationGuideShell />;
}
