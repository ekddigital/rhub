import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CONFERENCE_INTRO,
  DEFAULT_PROGRAM_OUTLINE_INTRO,
  LSUIC_OVERVIEW_PARAGRAPHS,
  LSUIC_PAST_CONFERENCES,
  LSUIC_PRESIDENT_HISTORY,
  resolveLsuicOverviewBody,
} from "@/lib/conf/booklet-conference-copy";
import {
  resolveProgramOutline,
  type ProgramOutlineDay,
} from "@/lib/conf/booklet-program-outline";
import {
  DEFAULT_CHAIRMAN_ADDRESS,
  DEFAULT_PRESIDENT_ADDRESS,
  resolveConferenceIntroBody,
} from "@/lib/conf/resolve-booklet-section-content";
import type { BookletSection } from "@/components/tools/conf/booklet/types";
import type { ReportDataSource } from "./types";

export type ReportBookletPresidentRow = {
  no: number;
  name: string;
  term: string;
};

export type ReportBookletVenueRow = {
  city: string;
  year: string;
};

export type ReportBookletBlock = {
  key: string;
  title: string;
  subtitle?: string;
  speakerName?: string;
  speakerTitle?: string;
  paragraphs: string[];
};

export type ReportBookletOverviewTables = {
  presidents: ReportBookletPresidentRow[];
  venues: ReportBookletVenueRow[];
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
  overview: (ReportBookletBlock & { tables: ReportBookletOverviewTables }) | null;
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

function mapOverviewTables(): ReportBookletOverviewTables {
  return {
    presidents: LSUIC_PRESIDENT_HISTORY.map((row, index) => ({
      no: index + 1,
      name: row.name,
      term: row.term,
    })),
    venues: LSUIC_PAST_CONFERENCES.map((row) => ({
      city: row.city,
      year: row.year,
    })),
  };
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
    ? resolveLsuicOverviewBody(overviewSection.bodyText)
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
          tables: mapOverviewTables(),
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

/** Report interior page budget (matches report-layout.ts). */
const REPORT_PAGE_CONTENT_PX = 1123 - 61 - 33 - 28;
const REPORT_PROGRAM_OUTLINE_SAFETY_PX = 12;
const REPORT_PROGRAM_OUTLINE_TITLE_PX = 28;
const REPORT_PROGRAM_OUTLINE_INTRO_LINE_PX = 26;
const REPORT_PROGRAM_OUTLINE_INTRO_CHARS = 92;
const REPORT_PROGRAM_OUTLINE_DAY_HEADER_PX = 24;
const REPORT_PROGRAM_OUTLINE_TABLE_HEADER_PX = 32;
const REPORT_PROGRAM_OUTLINE_ROW_LINE_PX = 17;
const REPORT_PROGRAM_OUTLINE_ROW_PADDING_PX = 10;
const REPORT_PROGRAM_OUTLINE_DAY_MARGIN_PX = 8;
const REPORT_PROGRAM_OUTLINE_SOURCE_PX = 32;

function estimateBookletProgramIntroHeaderPx(intro: string): number {
  const lines = Math.max(
    1,
    Math.ceil(intro.trim().length / REPORT_PROGRAM_OUTLINE_INTRO_CHARS),
  );
  return (
    REPORT_PROGRAM_OUTLINE_TITLE_PX +
    lines * REPORT_PROGRAM_OUTLINE_INTRO_LINE_PX +
    8
  );
}

function estimateBookletProgramDayPx(day: ReportBookletProgramDay): number {
  const rowsPx = day.activities.reduce((sum, row) => {
    const activityLines = Math.max(
      1,
      Math.ceil(row.activity.length / 46),
    );
    const locationLines = Math.max(
      1,
      Math.ceil(row.location.length / 36),
    );
    const lines = Math.max(activityLines, locationLines);
    return sum + REPORT_PROGRAM_OUTLINE_ROW_PADDING_PX + lines * REPORT_PROGRAM_OUTLINE_ROW_LINE_PX;
  }, 0);

  return (
    REPORT_PROGRAM_OUTLINE_DAY_HEADER_PX +
    REPORT_PROGRAM_OUTLINE_TABLE_HEADER_PX +
    rowsPx +
    REPORT_PROGRAM_OUTLINE_DAY_MARGIN_PX
  );
}

/** Pack program-outline days by estimated height instead of fixed 2-per-page. */
export function paginateReportBookletProgramOutline(
  content: ReportBookletContent,
): Array<{ showIntro: boolean; days: ReportBookletProgramDay[] }> {
  const pages: Array<{ showIntro: boolean; days: ReportBookletProgramDay[] }> =
    [];
  const budget = REPORT_PAGE_CONTENT_PX - REPORT_PROGRAM_OUTLINE_SAFETY_PX;
  let current: { showIntro: boolean; days: ReportBookletProgramDay[] } = {
    showIntro: true,
    days: [],
  };
  let usedPx = estimateBookletProgramIntroHeaderPx(content.programOutline.intro);
  if (current.showIntro) {
    usedPx += REPORT_PROGRAM_OUTLINE_SOURCE_PX;
  }

  for (const day of content.programOutline.days) {
    const dayPx = estimateBookletProgramDayPx(day);
    if (current.days.length > 0 && usedPx + dayPx > budget) {
      pages.push(current);
      current = { showIntro: false, days: [] };
      usedPx = 0;
    }
    current.days.push(day);
    usedPx += dayPx;
  }

  if (current.days.length > 0 || current.showIntro) {
    pages.push(current);
  }

  return pages.length > 0 ? pages : [{ showIntro: true, days: [] }];
}

/** LSUIC overview — page 1: intro + presidents; page 2: venues (matches booklet). */
export function paginateReportBookletOverview(
  overview: NonNullable<ReportBookletContent["overview"]>,
): Array<{
  paragraphs: string[];
  showPresidents: boolean;
  showVenues: boolean;
}> {
  return [
    {
      paragraphs: overview.paragraphs,
      showPresidents: true,
      showVenues: false,
    },
    {
      paragraphs: [],
      showPresidents: false,
      showVenues: true,
    },
  ];
}

/** Estimate report pages for booklet embed sections (after §6 Overview). */
export function countReportBookletPages(content: ReportBookletContent): number {
  let pages = 0;
  pages += chunkBookletParagraphs(content.introduction.paragraphs, 3).length;
  if (content.overview) {
    pages += paginateReportBookletOverview(content.overview).length;
  }
  pages += Math.max(1, paginateReportBookletProgramOutline(content).length);
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
        kind: "overview";
        block: NonNullable<ReportBookletContent["overview"]>;
        paragraphs: string[];
        showPresidents: boolean;
        showVenues: boolean;
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
  if (content.overview) {
    const overviewPages = paginateReportBookletOverview(content.overview);
    overviewPages.forEach((page, pageIndex) => {
      plans.push({
        kind: "overview",
        block: content.overview!,
        paragraphs: page.paragraphs,
        showPresidents: page.showPresidents,
        showVenues: page.showVenues,
        pageIndex,
        pageCount: overviewPages.length,
      });
    });
  }

  const programPages = paginateReportBookletProgramOutline(content);
  programPages.forEach((page, pageIndex) => {
    plans.push({
      kind: "program-outline",
      showIntro: page.showIntro,
      days: page.days,
      pageIndex,
      pageCount: programPages.length,
    });
  });

  return plans;
}
