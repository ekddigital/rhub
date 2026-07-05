import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { requireConferencePageAccess } from "@/lib/conf/access";
import { canViewDelegateDocuments } from "@/lib/conf/conference-hotel-access";
import { prisma } from "@/lib/prisma";
import { normalizeDelegatePassport } from "@/lib/conf/delegate-utils";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { DelegateDetailShell } from "@/components/tools/conf/delegate-detail-shell";

interface Props {
  params: Promise<{ passport: string }>;
}

export default async function DelegateByPassportPage({ params }: Props) {
  const { passport } = await params;

  const normalized = normalizeDelegatePassport(passport);
  if (!normalized) notFound();

  // Load the default conference to get confId
  const conf = await ensureDefaultConference().catch(() => null);
  if (!conf) notFound();

  // Fetch delegate by passport + confId
  const delegate = await prisma.confDelegate.findFirst({
    where: { confId: conf.id, passportNo: normalized },
    select: { id: true, userId: true, email: true },
  });

  if (!delegate) {
    const guest = await prisma.confDelegateGuest.findFirst({
      where: { confId: conf.id, passportNo: normalized },
      select: { id: true, delegateId: true },
    });

    if (!guest) notFound();

    const host = await prisma.confDelegate.findUnique({
      where: { id: guest.delegateId },
      select: { id: true, userId: true, email: true },
    });

    if (!host) notFound();

    const access = await requireConferencePageAccess(
      `/tools/conf/delegates/p/${passport}`,
      "participant",
    );

    const isManager = access.isManager;
    const isSelf =
      access.delegateId === host.id ||
      (access.user && host.userId && access.user.id === host.userId) ||
      (access.user &&
        host.email &&
        access.user.email.toLowerCase() === host.email.toLowerCase());

    if (!canViewDelegateDocuments(access) && !isSelf) {
      redirect("/tools/conf/delegates?restricted=1");
    }

    redirect(
      `/tools/conf/delegates/${guest.delegateId}?guest=${encodeURIComponent(guest.id)}`,
    );
  }

  // Auth check
  const access = await requireConferencePageAccess(
    `/tools/conf/delegates/p/${passport}`,
    "participant",
  );

  const isManager = access.isManager;
  const isSelf =
    access.delegateId === delegate.id ||
    (access.user && delegate.userId && access.user.id === delegate.userId) ||
    (access.user &&
      delegate.email &&
      access.user.email.toLowerCase() === delegate.email.toLowerCase());

  if (!canViewDelegateDocuments(access) && !isSelf) {
    redirect("/tools/conf/delegates?restricted=1");
  }

  return (
    <div className="py-6">
      <DelegateDetailShell
        delegateId={delegate.id}
        canManage={isManager}
        canSelfEdit={isManager || Boolean(isSelf)}
      />
    </div>
  );
}
