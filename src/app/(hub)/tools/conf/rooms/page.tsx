import { getConferenceAccess } from "@/lib/conf/access";
import { requireConferencePageAccess } from "@/lib/conf/access";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { RoomsShell } from "@/components/tools/conf/rooms-shell";

export const metadata = {
  title: "Room Pairing | LSUIC Conference Hub",
  description:
    "Choose your conference roommate. Send and manage pairing requests with same-gender matching and legal partner exceptions.",
};

export default async function RoomsPage() {
  await requireConferencePageAccess("/tools/conf/rooms", "participant");

  const event = await ensureDefaultConference();
  const access = await getConferenceAccess(event.id);

  const isManager = access.isManager;
  const isSuperAdmin = access.isSuperAdmin;

  return (
    <div className="py-6">
      <RoomsShell
        confId={event.id}
        isManager={isManager}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
