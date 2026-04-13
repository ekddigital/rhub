import { prisma } from "@/lib/prisma";
import { CONF_2026 } from "@/lib/conf/config";

export const DEFAULT_CONF_SLUG = "lsuic-2026";

const DEFAULT_MEMBERS = [
  {
    name: "Enoch Kwateh Dongbo",
    role: "CHAIR" as const,
    title: "Conference Chair",
    city: "Jinan",
  },
  {
    name: "Alfreda Ruth Togbah",
    role: "VICE_CHAIR" as const,
    title: "Co-Chair",
    city: "Suzhou",
  },
  {
    name: "Harris M Bowulo",
    role: "SECRETARY" as const,
    title: "Secretary",
    city: "Beijing",
  },
  {
    name: "Abdul Corneh",
    role: "COMMITTEE" as const,
    title: "PRO/Media",
    city: "Zhengzhou",
  },
  {
    name: "Kukor Brooks",
    role: "COMMITTEE" as const,
    title: "Cooking Chair",
    city: "Jinan",
  },
  {
    name: "Jefferson T Banquando",
    role: "COMMITTEE" as const,
    title: "Sports Chair",
    city: "Suzhou",
  },
  {
    name: "Lisa Y SET",
    role: "COMMITTEE" as const,
    title: "Cooking",
    city: "Qingdao",
  },
  {
    name: "Blessing Hawa Washington",
    role: "COMMITTEE" as const,
    title: "Cooking",
    city: "Nantong",
  },
  {
    name: "Robert D Molley",
    role: "COMMITTEE" as const,
    title: "Logistics Chair",
    city: "Qufu",
  },
  {
    name: "Priscilla Bamu Dweh",
    role: "COMMITTEE" as const,
    title: "Cooking",
    city: "Suzhou",
  },
  {
    name: "Williamena Yah SENET",
    role: "COMMITTEE" as const,
    title: "Cooking",
    city: "Suzhou",
  },
];

export async function ensureDefaultConference() {
  const event = await prisma.confEvent.upsert({
    where: { slug: DEFAULT_CONF_SLUG },
    create: {
      name: CONF_2026.name,
      slug: DEFAULT_CONF_SLUG,
      year: CONF_2026.year,
      city: CONF_2026.city,
      venue: CONF_2026.venue,
      venueCn: CONF_2026.venueCn,
      address: CONF_2026.address,
      startsAt: new Date(CONF_2026.startsAt),
      endsAt: new Date(CONF_2026.endsAt),
      xrRate: CONF_2026.xrRate,
      deposit: CONF_2026.deposit,
    },
    update: {
      name: CONF_2026.name,
      year: CONF_2026.year,
      city: CONF_2026.city,
      venue: CONF_2026.venue,
      venueCn: CONF_2026.venueCn,
      address: CONF_2026.address,
      startsAt: new Date(CONF_2026.startsAt),
      endsAt: new Date(CONF_2026.endsAt),
      xrRate: CONF_2026.xrRate,
      deposit: CONF_2026.deposit,
    },
  });

  const memberCount = await prisma.confMember.count({
    where: { confId: event.id },
  });

  if (memberCount === 0) {
    await prisma.confMember.createMany({
      data: DEFAULT_MEMBERS.map((member) => ({
        confId: event.id,
        name: member.name,
        role: member.role,
        title: member.title,
        city: member.city,
      })),
    });
  }

  return event;
}
