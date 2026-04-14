import { redirect } from "next/navigation";
import { DelegateDetailShell } from "../../../../../../components/tools/conf/delegate-detail-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function DelegateDetailPage({
  params,
}: {
  params: Promise<{ delegateId: string }>;
}) {
  const { delegateId } = await params;
  const access = await requireConferencePageAccess(
    `/tools/conf/delegates/${delegateId}`,
    "participant",
  );

  const canManage = access.isManager;
  const canSelfEdit = canManage || access.delegateId === delegateId;

  if (!canSelfEdit) {
    redirect("/tools/conf/delegates?restricted=1");
  }

  return (
    <div className="py-6">
      <DelegateDetailShell
        delegateId={delegateId}
        canManage={canManage}
        canSelfEdit={canSelfEdit}
      />
    </div>
  );
}
