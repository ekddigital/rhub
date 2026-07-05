import type { Prisma } from "@prisma/client";

type GuestRow = {
  name: string;
  passportNo: string;
  nationality: string;
  passportExpiry: Date | null;
};

type Tx = Prisma.TransactionClient;

export async function syncDelegateGuests(
  tx: Tx,
  args: {
    confId: string;
    delegateId: string;
    guestCount: number;
    guests: GuestRow[];
  },
): Promise<Array<{ id: string; sortOrder: number }>> {
  await tx.confDelegateGuest.deleteMany({
    where: { delegateId: args.delegateId },
  });

  const created: Array<{ id: string; sortOrder: number }> = [];
  for (let i = 0; i < args.guests.length; i++) {
    const guest = args.guests[i];
    const row = await tx.confDelegateGuest.create({
      data: {
        confId: args.confId,
        delegateId: args.delegateId,
        sortOrder: i,
        name: guest.name,
        passportNo: guest.passportNo,
        nationality: guest.nationality,
        passportExpiry: guest.passportExpiry,
      },
      select: { id: true, sortOrder: true },
    });
    created.push(row);
  }

  await tx.confDelegate.update({
    where: { id: args.delegateId },
    data: { guestCount: args.guestCount },
  });

  return created;
}
