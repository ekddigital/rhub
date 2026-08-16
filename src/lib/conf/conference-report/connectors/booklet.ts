import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONFERENCE_INTRO,
  DEFAULT_PROGRAM_OUTLINE_INTRO,
  LSUIC_OVERVIEW_PARAGRAPHS,
} from "@/lib/conf/booklet-conference-copy";
import {
  resolveProgramOutline,
  type ProgramOutlineDay,
} from "@/lib/conf/booklet-program-outline";
import {
  DEFAULT_CHAIRMAN_ADDRESS,
  DEFAULT_PRESIDENT_ADDRESS,
  resolveConferenceIntroBody,
  resolveTextSectionBody,
} from "@/lib/conf/resolve-booklet-section-content";
import type { BookletSection } from "@/components/tools/conf/booklet/types";
import type { ReportDataSource } from "./types";

export type ReportBookletBlock = {
  key: string;
  title: string;
  subtitle?: string;
  speakerName?: string;
  speakerTitle?: string;
  paragraphs: string[];
};

export type ReportBookletProgramDay = {
  label: string;
  dateLabel: string;
  activities: Array<{
    time: string;
    activity: string;
    location: string;
  }>;
};

export type ReportBookletContent = {
  introduction: ReportBookletBlock;
  chairmanAddress: ReportBookletBlock;
  presidentAddress: ReportBookletBlock;
  overview: ReportBookletBlock | null;
  programOutline: {
    welcomeTitle: string;
    intro: string;
    days: ReportBookletProgramDay[];
  };
  source: ReportDataSource;
};

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findSection(
  sections: readonly BookletSection[],
  type: string,
  titleIncludes?: string,
): BookletSection | undefined {
  return sections.find((section) => {
    if (section.type !== type) return false;
    if (!titleIncludes) return true;
    return normalizeLabel(section.title).includes(normalizeLabel(titleIncludes));
  });
}

function mockProgramOutlineSection(): BookletSection {
  return {
    id: "static-program-outline",
    bookletId: "static",
    type: "PROGRAM_OUTLINE",
    title: "Program Outline",
    subtitle: "Welcome to Jinan",
    bodyText: DEFAULT_PROGRAM_OUTLINE_INTRO,
    isEnabled: true,
    sortOrder: 0,
    committeeScope: null,
  };
}

function mapProgramDays(days: ProgramOutlineDay[]): ReportBookletProgramDay[] {
  return days.map((day) => ({
    label: day.label,
    dateLabel: day.dateLabel,
    activities: day.activities.map((activity) => ({
      time: activity.time,
      activity: activity.activity,
      location: activity.location,
    })),
  }));
}

function buildFromSections(
  sections: readonly BookletSection[],
  source: ReportDataSource,
): ReportBookletContent {
  const introSection = findSection(sections, "TEXT", "conference introduction");
  const overviewSection = findSection(sections, "TEXT", "overview of lsuic");
  const chairSection = findSection(sections, "CHAIRMAN_ADDRESS");
  const presidentSection = findSection(sections, "PRESIDENT_ADDRESS");
  const programSection =
    findSection(sections, "PROGRAM_OUTLINE") ?? mockProgramOutlineSection();

  const introText = introSection
    ? resolveConferenceIntroBody(introSection.bodyText)
    : DEFAULT_CONFERENCE_INTRO;

  const chairText =
    chairSection?.bodyText?.trim() || DEFAULT_CHAIRMAN_ADDRESS;
  const presidentText =
    presidentSection?.bodyText?.trim() || DEFAULT_PRESIDENT_ADDRESS;

  const overviewText = overviewSection
    ? resolveTextSectionBody(overviewSection)
    : LSUIC_OVERVIEW_PARAGRAPHS;

  const resolvedProgram = resolveProgramOutline(programSection);

  return {
    introduction: {
      key: "introduction",
      title: introSection?.title ?? "Conference Introduction",
      subtitle: introSection?.subtitle ?? "Welcome",
      paragraphs: splitParagraphs(introText),
    },
    chairmanAddress: {
      key: "chairman-address",
      title: chairSection?.title ?? "Message from the Conference Chair",
      speakerName: "Enoch Kwateh Dongbo",
      speakerTitle: "General Chairman, Conference Committee",
      paragraphs: splitParagraphs(chairText),
    },
    presidentAddress: {
      key: "president-address",
      title: presidentSection?.title ?? "National President Address",
      speakerName: "Olano Teah Bloh",
      speakerTitle: "National President, LSUIC",
      paragraphs: splitParagraphs(presidentText),
    },
    overview: overviewText
      ? {
          key: "lsuic-overview",
          title: overviewSection?.title ?? "Overview of LSUIC",
          subtitle: overviewSection?.subtitle ?? undefined,
          paragraphs: splitParagraphs(overviewText),
        }
      : null,
    programOutline: {
      welcomeTitle: resolvedProgram?.welcomeTitle ?? "Welcome to Jinan",
      intro: resolvedProgram?.intro ?? DEFAULT_PROGRAM_OUTLINE_INTRO,
      days: mapProgramDays(resolvedProgram?.days ?? []),
    },
    source,
  };
}

/** Certified booklet defaults — same sources as `/tools/conf/booklet`. */
export function buildStaticReportBookletContent(): ReportBookletContent {
  return buildFromSections([], "static");
}

export async function loadReportBookletContent(
  confId: string,
): Promise<ReportBookletContent> {
  const booklet = await prisma.confBooklet.findUnique({
    where: { confId },
    include: {
      sections: {
        where: { isEnabled: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!booklet?.sections.length) {
    return buildStaticReportBookletContent();
  }

  return buildFromSections(booklet.sections as BookletSection[], "live");
}

export function chunkBookletParagraphs(
  paragraphs: readonly string[],
  perPage = 4,
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < paragraphs.length; i += perPage) {
    chunks.push(paragraphs.slice(i, i + perPage));
  }
  return chunks.length > 0 ? chunks : [[]];
}

/** Estimate report pages for booklet embed sections (after §6 Overview). */
export function countReportBookletPages(content: ReportBookletContent): number {
  let pages = 0;
  pages += chunkBookletParagraphs(content.introduction.paragraphs, 3).length;
  pages += chunkBookletParagraphs(content.chairmanAddress.paragraphs, 3).length;
  pages += Math.min(
    2,
    chunkBookletParagraphs(content.presidentAddress.paragraphs, 3).length,
  );
  if (content.overview) {
    pages += chunkBookletParagraphs(content.overview.paragraphs, 3).length;
  }
  pages += Math.max(1, Math.ceil(content.programOutline.days.length / 2));
  return pages;
}

export function buildReportBookletPagePlans(content: ReportBookletContent) {
  type Plan =
    | {
        kind: "block";
        block: ReportBookletBlock;
        paragraphs: string[];
        pageIndex: number;
        pageCount: number;
      }
    | {
        kind: "program-outline";
        showIntro: boolean;
        days: ReportBookletProgramDay[];
        pageIndex: number;
        pageCount: number;
      };

  const plans: Plan[] = [];

  const pushBlock = (block: ReportBookletBlock, perPage: number, cap?: number) => {
    let chunks = chunkBookletParagraphs(block.paragraphs, perPage);
    if (cap) chunks = chunks.slice(0, cap);
    chunks.forEach((paragraphs, pageIndex) => {
      plans.push({
        kind: "block",
        block,
        paragraphs,
        pageIndex,
        pageCount: chunks.length,
      });
    });
  };

  pushBlock(content.introduction, 3);
  pushBlock(content.chairmanAddress, 3);
  pushBlock(content.presidentAddress, 3, 2);
  if (content.overview) {
    pushBlock(content.overview, 3);
  }

  const dayChunks: ReportBookletProgramDay[][] = [];
  for (let i = 0; i < content.programOutline.days.length; i += 2) {
    dayChunks.push(content.programOutline.days.slice(i, i + 2));
  }
  if (dayChunks.length === 0) dayChunks.push([]);

  dayChunks.forEach((days, pageIndex) => {
    plans.push({
      kind: "program-outline",
      showIntro: pageIndex === 0,
      days,
      pageIndex,
      pageCount: dayChunks.length,
    });
  });

  return plans;
}
