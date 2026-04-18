import { CommitteeShell } from "@/components/tools/conf/committee-shell";
import {
  requireConferencePageAccess,
  getConferenceAccess,
} from "@/lib/conf/access";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";

export default async function CommitteePage() {
  await requireConferencePageAccess("/tools/conf/committee");

  let accessInfo = {
    isSuperAdmin: false,
    isChair: false,
    canAssignCommittee: false,
    memberId: null as string | null,
    committeeScope: null as string | null,
  };

  try {
    const conf = await ensureDefaultConference();
    const access = await getConferenceAccess(conf.id);
    accessInfo = {
      isSuperAdmin: access.isSuperAdmin,
      isChair: access.isChair,
      canAssignCommittee: access.canAssignCommittee,
      memberId: access.memberId,
      committeeScope: access.committeeScope,
    };
  } catch {
    // fallback — read-only view
  }

  return (
    <div className="py-6">
      <CommitteeShell accessInfo={accessInfo} />
    </div>
  );
}
