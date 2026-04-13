import { BookletShell } from "@/components/tools/conf/booklet-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function ConferenceBookletPage() {
  await requireConferencePageAccess("/tools/conf/booklet");

  return <BookletShell />;
}
