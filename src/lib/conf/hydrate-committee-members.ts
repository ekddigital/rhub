import { prisma } from "@/lib/prisma";
import { getBootstrapMemberContactFallback } from "@/lib/conf/bootstrap";
import { resolveCommitteeMemberPhotoForClient } from "@/lib/conf/resolve-booklet-member-photo";

type CommitteeMemberRow = {
  id: string;
  confId: string;
  userId: string | null;
  name: string;
  phone: string | null;
  city: string | null;
  email: string | null;
  photoPath: string | null;
};

function pickLinkedDelegate<
  T extends { id: string; userId: string | null; bookletPhotoPath: string | null },
>(delegates: T[]): T | undefined {
  if (delegates.length === 0) return undefined;
  return (
    delegates.find((delegate) => Boolean(delegate.bookletPhotoPath?.trim())) ??
    delegates[0]
  );
}

export async function hydrateCommitteeMembersForClient<
  T extends CommitteeMemberRow,
>(members: T[]) {
  if (members.length === 0) return [] as Array<
    T & {
      linkedUserName: string | null;
      linkedUserEmail: string | null;
      photoPath: string | null;
    }
  >;

  const confId = members[0].confId;
  const linkedUserIds = [
    ...new Set(members.map((member) => member.userId).filter(Boolean)),
  ] as string[];

  const [linkedUsers, linkedDelegates] = await Promise.all([
    linkedUserIds.length
      ? prisma.user.findMany({
          where: { id: { in: linkedUserIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    linkedUserIds.length
      ? prisma.confDelegate.findMany({
          where: { confId, userId: { in: linkedUserIds } },
          select: {
            id: true,
            userId: true,
            bookletPhotoPath: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const userById = new Map(linkedUsers.map((user) => [user.id, user]));
  const delegatesByUserId = new Map<string, typeof linkedDelegates>();
  for (const delegate of linkedDelegates) {
    if (!delegate.userId) continue;
    const existing = delegatesByUserId.get(delegate.userId) ?? [];
    existing.push(delegate);
    delegatesByUserId.set(delegate.userId, existing);
  }

  return members.map((member) => {
    const fallback = getBootstrapMemberContactFallback(member.name);
    const phone = (member.phone ?? "").trim() || fallback?.phone || null;
    const city = (member.city ?? "").trim() || fallback?.city || null;
    const linkedUser = member.userId ? userById.get(member.userId) : undefined;
    const linkedDelegate = member.userId
      ? pickLinkedDelegate(delegatesByUserId.get(member.userId) ?? [])
      : undefined;

    return {
      ...member,
      phone,
      city,
      email: member.email || linkedUser?.email || null,
      linkedUserName: linkedUser?.name || null,
      linkedUserEmail: linkedUser?.email || null,
      photoPath: resolveCommitteeMemberPhotoForClient({
        confId,
        memberId: member.id,
        memberPhotoPath: member.photoPath,
        linkedDelegateId: linkedDelegate?.id ?? null,
        linkedDelegateBookletPhotoPath: linkedDelegate?.bookletPhotoPath ?? null,
      }),
    };
  });
}
