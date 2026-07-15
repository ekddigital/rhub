import { Prisma, type ConfEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CONF_2026 } from "@/lib/conf/config";
import { ensureDefaultGlobalLeaders } from "@/lib/conf/default-global-leaders";
import { getDefaultMeetings } from "@/lib/conf/meetings-defaults";
import { INITIAL_TIMELINE } from "@/lib/conf/timeline-defaults";
import { DEFAULT_COMMITTEE_ROLE_TEMPLATES } from "@/lib/conf/role-defaults";

export const DEFAULT_CONF_SLUG = "lsuic-2026";

const DEFAULT_CONF_CACHE_TTL_MS = 5 * 60 * 1000;

const TRANSIENT_DB_ERROR_CODES = new Set(["P1001", "P1002", "P2024"]);

let cachedDefaultConference: ConfEvent | null = null;
let cachedDefaultConferenceAt = 0;
let inFlightDefaultConference: Promise<ConfEvent> | null = null;

export class ConferenceDatabaseUnavailableError extends Error {
  declare cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ConferenceDatabaseUnavailableError";
    this.cause = cause;
  }
}

export function isConferenceDatabaseUnavailableError(
  error: unknown,
): error is ConferenceDatabaseUnavailableError {
  return error instanceof ConferenceDatabaseUnavailableError;
}

function isTransientDatabaseError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_DB_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database server") ||
      message.includes("timed out fetching a new connection")
    );
  }

  return false;
}

const DEFAULT_MEMBERS = [
  {
    name: "Enoch Kwateh Dongbo",
    role: "CHAIR" as const,
    title: "General Chairman",
    city: "Jinan",
    phone: "18506832159",
  },
  {
    name: "Alfreda Ruth Togbah",
    role: "VICE_CHAIR" as const,
    title: "General Co-Chair",
    city: "Suzhou",
    phone: "13915437321",
  },
  {
    name: "Harris M Bowulo",
    role: "SECRETARY" as const,
    title: "General Secretary",
    city: "Beijing",
    phone: "18514556295",
  },
  {
    name: "Abdul Corneh",
    role: "COMMITTEE" as const,
    title: "PRO & Media",
    city: "Zhengzhou",
    phone: "15638483183",
  },
  {
    name: "Kukor Brooks",
    role: "COMMITTEE" as const,
    title: "Cooking Team Chair",
    city: "Jinan",
    phone: "15376176715",
  },
  {
    name: "Jefferson T Banquando",
    role: "COMMITTEE" as const,
    title: "Chair on Sports",
    city: "Suzhou",
    phone: "18662966349",
  },
  {
    name: "Lisa Y Synyenlentu",
    role: "COMMITTEE" as const,
    title: "Member, Cooking Team",
    city: "Qingdao",
    phone: "17863971479",
  },
  {
    name: "Blessing Hawa Washington",
    role: "COMMITTEE" as const,
    title: "Member, Cooking Team",
    city: "Nantong",
    phone: "19850012998",
  },
  {
    name: "Robert D. Molley",
    role: "COMMITTEE" as const,
    title: "Chair on Logistics",
    city: "Qufu",
    phone: "18853752989",
  },
  {
    name: "Priscilla Bamu Dweh",
    role: "COMMITTEE" as const,
    title: "Member, Cooking Team",
    city: "Suzhou",
    phone: "13291194526",
  },
  {
    name: "Williamena Yah Munyenneh",
    role: "COMMITTEE" as const,
    title: "Member, Cooking Team",
    city: "Suzhou",
    phone: "16606212125",
  },
];

const DEFAULT_MEMBER_NAME_CORRECTIONS = [
  {
    canonical: "Lisa Y Synyenlentu",
    aliases: ["Lisa Y SET"],
  },
  {
    canonical: "Robert D. Molley",
    aliases: ["Robert D Molley"],
  },
  {
    canonical: "Williamena Yah Munyenneh",
    aliases: [
      "Williama Yah Munyenneh",
      "Williamena Yah SENET",
      "Willimena Y. Munyenneh",
      "Willimena Yah Munyenneh",
      "Williamena Yah MUNYENEH",
    ],
  },
] as const;

/**
 * Normalize a display name so "Abdul M. Corneh" ↔ "Abdul Corneh" match (drops
 * single-letter middle initials): used only to pair live ConfMember rows with
 * seeded default roster contact when DB phone/city are blank.
 */
function committeeNameMatchKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
    .join(" ");
}

/**
 * Returns seeded phone/city from the default conference bootstrap roster when
 * the given display name matches a bootstrap member (including known aliases).
 * Does not replace non-empty values — merge in the API layer.
 */
export function getBootstrapMemberContactFallback(displayName: string): {
  phone: string;
  city: string;
} | null {
  const key = committeeNameMatchKey(displayName);
  if (!key) return null;

  const contactByKey = new Map<string, { phone: string; city: string }>();
  for (const row of DEFAULT_MEMBERS) {
    contactByKey.set(committeeNameMatchKey(row.name), {
      phone: row.phone,
      city: row.city,
    });
  }

  for (const correction of DEFAULT_MEMBER_NAME_CORRECTIONS) {
    const src = contactByKey.get(committeeNameMatchKey(correction.canonical));
    if (!src) continue;
    for (const alias of correction.aliases) {
      const ak = committeeNameMatchKey(alias);
      if (ak) contactByKey.set(ak, src);
    }
  }

  return contactByKey.get(key) ?? null;
}

async function bootstrapDefaultConference() {
  let event = await prisma.confEvent.findUnique({
    where: { slug: DEFAULT_CONF_SLUG },
  });

  if (!event) {
    try {
      event = await prisma.confEvent.create({
        data: {
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
      });
    } catch (error) {
      // Another request may have created the default event first.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        event = await prisma.confEvent.findUnique({
          where: { slug: DEFAULT_CONF_SLUG },
        });
      } else {
        throw error;
      }
    }
  }

  if (!event) {
    throw new Error("Default conference bootstrap failed");
  }

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
        phone: member.phone,
      })),
    });
  }

  // Idempotent name corrections — fixes historical misspellings on every bootstrap run.
  for (const correction of DEFAULT_MEMBER_NAME_CORRECTIONS) {
    await prisma.confMember.updateMany({
      where: {
        confId: event.id,
        name: { in: [...correction.aliases] },
      },
      data: { name: correction.canonical },
    });
  }

  // Backfill phone/title/city on existing committee records where legacy rows are missing fields.
  for (const member of DEFAULT_MEMBERS) {
    await prisma.confMember.updateMany({
      where: {
        confId: event.id,
        name: member.name,
        OR: [{ phone: null }, { city: null }, { title: null }],
      },
      data: {
        phone: member.phone,
        city: member.city,
        title: member.title,
      },
    });
  }

  // Seed role templates used for role assignment dropdowns and letter office presets.
  for (const template of DEFAULT_COMMITTEE_ROLE_TEMPLATES) {
    await prisma.confCommitteeRole.upsert({
      where: {
        confId_key: {
          confId: event.id,
          key: template.key,
        },
      },
      update: {
        label: template.label,
        baseRole: template.baseRole,
        title: template.title,
        committeeScope: template.committeeScope,
        officeLabel: template.officeLabel,
        sortOrder: template.sortOrder,
        isSystem: template.isSystem,
        isActive: true,
      },
      create: {
        confId: event.id,
        key: template.key,
        label: template.label,
        baseRole: template.baseRole,
        title: template.title,
        committeeScope: template.committeeScope,
        officeLabel: template.officeLabel,
        sortOrder: template.sortOrder,
        isSystem: template.isSystem,
        isActive: true,
      },
    });
  }

  // Idempotent delegate code migration — fixes old prefix formats to LSUICNC{YY}-{NNNN}.
  {
    const yearShort = String(event.year).slice(-2);
    const oldPrefixPattern = `LSUIC${yearShort}-`;
    const oldDelegates = await prisma.confDelegate.findMany({
      where: {
        confId: event.id,
        delegateCode: { startsWith: oldPrefixPattern },
      },
      select: { id: true, delegateCode: true },
    });
    for (const d of oldDelegates) {
      const match = d.delegateCode!.match(/-(\d+)$/);
      if (!match) continue;
      const num = String(parseInt(match[1])).padStart(4, "0");
      await prisma.confDelegate.update({
        where: { id: d.id },
        data: { delegateCode: `LSUICNC${yearShort}-${num}` },
      });
    }
  }

  const meetingCount = await prisma.confMeeting.count({
    where: { confId: event.id },
  });

  const defaults = getDefaultMeetings();

  if (meetingCount === 0) {
    await prisma.confMeeting.createMany({
      data: defaults.map((meeting) => ({
        confId: event.id,
        title: meeting.title,
        meetingNo: meeting.meetingNo,
        scheduled: new Date(meeting.scheduled),
        location: meeting.location,
        agenda: meeting.agenda || null,
        minutes: meeting.minutes || null,
        minutesStatus: meeting.minutesStatus,
        minutesSubmittedBy: meeting.minutesSubmittedBy,
        chairNote: meeting.chairNote,
        status: meeting.status,
      })),
      skipDuplicates: true,
    });
  } else {
    // Keep schedule + agenda templates aligned for upcoming meetings.
    // We only touch meetings that are not completed and not already approved.
    for (const meeting of defaults) {
      if (meeting.meetingNo <= 1) continue;

      await prisma.confMeeting.updateMany({
        where: {
          confId: event.id,
          meetingNo: meeting.meetingNo,
          status: { not: "DONE" },
          minutesStatus: { not: "APPROVED" },
        },
        data: {
          title: meeting.title,
          scheduled: new Date(meeting.scheduled),
          location: meeting.location,
          agenda: meeting.agenda || null,
        },
      });
    }
  }

  // Seed / upgrade global leader profiles (presidents + ambassador).
  await ensureDefaultGlobalLeaders();

  await prisma.confTimeline.createMany({
    data: INITIAL_TIMELINE.map((item, index) => ({
      confId: event.id,
      clientId: item.id,
      title: item.title,
      description: item.description || null,
      responsibleLead: item.owner || null,
      date: new Date(item.date),
      category: item.category || null,
      isCritical: item.isCritical,
      isCompleted: item.isCompleted,
      sortOrder: index,
    })),
    skipDuplicates: true,
  });

  // Keep upcoming timeline defaults aligned for active (not completed) tasks.
  for (const item of INITIAL_TIMELINE) {
    await prisma.confTimeline.updateMany({
      where: {
        confId: event.id,
        clientId: item.id,
        isCompleted: false,
      },
      data: {
        title: item.title,
        description: item.description || null,
        responsibleLead: item.owner || null,
        date: new Date(item.date),
        category: item.category || null,
        isCritical: item.isCritical,
      },
    });
  }

  return event;
}

export async function ensureDefaultConference() {
  const cacheAge = Date.now() - cachedDefaultConferenceAt;
  if (cachedDefaultConference && cacheAge < DEFAULT_CONF_CACHE_TTL_MS) {
    return cachedDefaultConference;
  }

  if (!inFlightDefaultConference) {
    inFlightDefaultConference = (async () => {
      try {
        const event = await bootstrapDefaultConference();
        cachedDefaultConference = event;
        cachedDefaultConferenceAt = Date.now();
        return event;
      } catch (error) {
        if (isTransientDatabaseError(error)) {
          if (cachedDefaultConference) {
            return cachedDefaultConference;
          }

          throw new ConferenceDatabaseUnavailableError(
            "Conference database is temporarily unavailable. Please retry shortly.",
            error,
          );
        }

        throw error;
      } finally {
        inFlightDefaultConference = null;
      }
    })();
  }

  return inFlightDefaultConference;
}
