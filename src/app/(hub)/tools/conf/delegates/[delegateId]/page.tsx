import { redirect } from "next/navigation";
import { DelegateDetailShell } from "../../../../../../components/tools/conf/delegate-detail-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";
import { canViewDelegateDocuments } from "@/lib/conf/conference-hotel-access";

export default async function DelegateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ delegateId: string }>;
  searchParams: Promise<{ guest?: string }>;
}) {
  const { delegateId } = await params;
  const { guest: highlightGuestId } = await searchParams;
  const access = await requireConferencePageAccess(
    `/tools/conf/delegates/${delegateId}`,
    "participant",
  );

  const canManage = access.isManager;
  const canSelfEdit = canManage || access.delegateId === delegateId;

  if (!canViewDelegateDocuments(access) && !canSelfEdit) {
    redirect("/tools/conf/delegates?restricted=1");
  }

  return (
    <div className="py-6">
      <DelegateDetailShell
        delegateId={delegateId}
        canManage={canManage}
        canSelfEdit={canSelfEdit}
        highlightGuestId={highlightGuestId ?? null}
      />
    </div>
  );
}
