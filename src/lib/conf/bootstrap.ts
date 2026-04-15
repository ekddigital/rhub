import { Prisma, type ConfEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CONF_2026 } from "@/lib/conf/config";
import { getDefaultMeetings } from "@/lib/conf/meetings-defaults";
import { INITIAL_TIMELINE } from "@/lib/conf/timeline-defaults";

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
      })),
    });
  }

  const meetingCount = await prisma.confMeeting.count({
    where: { confId: event.id },
  });

  if (meetingCount === 0) {
    const defaults = getDefaultMeetings();
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
  }

  const timelineCount = await prisma.confTimeline.count({
    where: { confId: event.id },
  });

  if (timelineCount === 0) {
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
