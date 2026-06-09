import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { requireConferencePageAccess } from "@/lib/conf/access";
import { prisma } from "@/lib/prisma";
import { normalizeDelegatePassport } from "@/lib/conf/delegate-utils";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { DelegateDetailShell } from "@/components/tools/conf/delegate-detail-shell";

interface Props {
  params: Promise<{ passport: string }>;
}

export default async function DelegateEditByPassportPage({ params }: Props) {
  const { passport } = await params;

  const normalized = normalizeDelegatePassport(passport);
  if (!normalized) notFound();

  const conf = await ensureDefaultConference().catch(() => null);
  if (!conf) notFound();

  const delegate = await prisma.confDelegate.findFirst({
    where: { confId: conf.id, passportNo: normalized },
    select: { id: true, userId: true, email: true },
  });

  if (!delegate) notFound();

  const access = await requireConferencePageAccess(
    `/tools/conf/delegates/p/${passport}/edit`,
    "participant",
  );

  const isManager = access.isManager;
  const isSelf =
    access.delegateId === delegate.id ||
    (access.user && delegate.userId && access.user.id === delegate.userId) ||
    (access.user &&
      delegate.email &&
      access.user.email.toLowerCase() === delegate.email.toLowerCase());

  // Edit requires ownership or manager privileges
  if (!isManager && !isSelf) {
    redirect("/tools/conf/delegates?restricted=1");
  }

  return (
    <div className="py-6">
      {/* startInEditMode prop signals the shell to open the edit form immediately */}
      <DelegateDetailShell
        delegateId={delegate.id}
        canManage={isManager}
        canSelfEdit={isManager || Boolean(isSelf)}
        startInEditMode
      />
    </div>
  );
}
