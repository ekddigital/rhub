import { BookletShell } from "@/components/tools/conf/booklet-shell";
import { BookletManagerShell } from "@/components/tools/conf/booklet-manager-shell";
import { getConferenceAccess } from "@/lib/conf/access";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";

export default async function ConferenceBookletPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  let canManage = false;

  try {
    const event = await ensureDefaultConference();
    const access = await getConferenceAccess(event.id);
    canManage = Boolean(access.user && access.isManager);
  } catch {
    canManage = false;
  }

  if (view === "roster") {
    return <BookletShell />;
  }

  // Manager workspace is available only to conference managers/chairs/admins.
  if (view === "manage") {
    if (canManage) {
      return <BookletManagerShell />;
    }

    return <BookletShell />;
  }

  return canManage ? <BookletManagerShell /> : <BookletShell />;
}
