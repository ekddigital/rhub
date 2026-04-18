import { BookletShell } from "@/components/tools/conf/booklet-shell";
import { BookletManagerShell } from "@/components/tools/conf/booklet-manager-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function ConferenceBookletPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireConferencePageAccess("/tools/conf/booklet");
  const { view } = await searchParams;

  // ?view=roster → existing print-focused delegate roster
  if (view === "roster") {
    return <BookletShell />;
  }

  return <BookletManagerShell />;
}
