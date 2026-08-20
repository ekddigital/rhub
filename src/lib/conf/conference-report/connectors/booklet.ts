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
import {
  REPORT_CONTENT_HEIGHT,
  REPORT_CONTENT_WIDTH,
  REPORT_CONTINUATION_BLOCK,
  REPORT_LAYOUT_SAFETY_MARGIN,
} from "@/components/tools/conf/conference-report/report-layout";
import {
  REPORT_BODY,
  REPORT_LIST_ITEM,
  REPORT_SECTION_TITLE,
  REPORT_TABLE,
} from "@/components/tools/conf/conference-report/report-typography";
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
  /** Mid-day table continuation — day header omitted; thead repeated. */
  isContinuation?: boolean;
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

/** Measured from ReportBookletProgramOutlineSection table cells. */
const REPORT_PROGRAM_OUTLINE_TABLE_LINE_PX = Math.ceil(
  REPORT_TABLE.fontSize * 1.35,
);
const REPORT_PROGRAM_OUTLINE_ROW_V_PAD_PX = 10;
const REPORT_PROGRAM_OUTLINE_ROW_BORDER_PX = 1;
const REPORT_PROGRAM_OUTLINE_TABLE_HEADER_PX = 26;
const REPORT_PROGRAM_OUTLINE_TIME_COL_PX = 120;
const REPORT_PROGRAM_OUTLINE_LOCATION_COL_PX = 140;

function wrappedProgramOutlineLines(text: string, charsPerLine: number): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / charsPerLine));
}

function estimateProgramOutlineTitlePx(): number {
  return Math.ceil((REPORT_SECTION_TITLE.fontSize - 2) * 1.2) + 8;
}

function estimateProgramOutlineIntroBlockPx(intro: string): number {
  const charsPerLine = Math.floor(REPORT_CONTENT_WIDTH / 9.5);
  const linePx = Math.ceil(REPORT_BODY.fontSize * REPORT_BODY.lineHeight);
  const lines = wrappedProgramOutlineLines(intro, charsPerLine);
  return estimateProgramOutlineTitlePx() + lines * linePx + 10;
}

function estimateProgramOutlineSourcePx(): number {
  return (
    8 +
    Math.ceil(REPORT_LIST_ITEM.fontSize * REPORT_LIST_ITEM.lineHeight) +
    8
  );
}

function estimateProgramOutlineRowPx(row: ReportBookletProgramDay["activities"][number]): number {
  const activityColPx =
    REPORT_CONTENT_WIDTH -
    REPORT_PROGRAM_OUTLINE_TIME_COL_PX -
    REPORT_PROGRAM_OUTLINE_LOCATION_COL_PX;
  const activityChars = Math.floor(activityColPx / 7.2);
  const locationChars = Math.floor(
    REPORT_PROGRAM_OUTLINE_LOCATION_COL_PX / 7.2,
  );
  const lines = Math.max(
    wrappedProgramOutlineLines(row.activity, activityChars),
    wrappedProgramOutlineLines(row.location, locationChars),
    1,
  );
  return (
    REPORT_PROGRAM_OUTLINE_ROW_V_PAD_PX +
    lines * REPORT_PROGRAM_OUTLINE_TABLE_LINE_PX +
    REPORT_PROGRAM_OUTLINE_ROW_BORDER_PX
  );
}

function estimateProgramOutlineDayHeaderPx(isContinuation: boolean): number {
  if (isContinuation) return 0;
  return (
    Math.ceil(REPORT_LIST_ITEM.fontSize * REPORT_LIST_ITEM.lineHeight) + 4 + 8
  );
}

function estimateProgramOutlineDayPx(day: ReportBookletProgramDay): number {
  const isContinuation = day.isContinuation === true;
  let px =
    estimateProgramOutlineDayHeaderPx(isContinuation) +
    REPORT_PROGRAM_OUTLINE_TABLE_HEADER_PX;
  px += day.activities.reduce(
    (sum, row) => sum + estimateProgramOutlineRowPx(row),
    0,
  );
  if (!isContinuation) px += 8;
  return px;
}

function reportProgramOutlinePageBudget(pageIndex: number): number {
  let budget = REPORT_CONTENT_HEIGHT - REPORT_LAYOUT_SAFETY_MARGIN;
  if (pageIndex > 0) budget -= REPORT_CONTINUATION_BLOCK;
  return budget;
}

function measureProgramOutlinePagePx(
  page: { showIntro: boolean; days: readonly ReportBookletProgramDay[] },
  pageIndex: number,
  intro: string,
): number {
  let height = pageIndex > 0 ? REPORT_CONTINUATION_BLOCK : 0;
  if (page.showIntro) {
    height += estimateProgramOutlineIntroBlockPx(intro);
    height += estimateProgramOutlineSourcePx();
  }
  for (const day of page.days) {
    height += estimateProgramOutlineDayPx(day);
  }
  return height;
}

/** Split one day's table rows when a full day exceeds the remaining page budget. */
function splitProgramOutlineDayRows(
  day: ReportBookletProgramDay,
  firstChunkBudget: number,
): ReportBookletProgramDay[] {
  const fullPx = estimateProgramOutlineDayPx(day);
  if (fullPx <= firstChunkBudget) return [day];

  const chunks: ReportBookletProgramDay[] = [];
  let cursor = 0;
  let isContinuation = false;

  while (cursor < day.activities.length) {
    const chunk: ReportBookletProgramDay = {
      label: day.label,
      dateLabel: day.dateLabel,
      activities: [],
      isContinuation,
    };
    const chunkBudget = isContinuation
      ? reportProgramOutlinePageBudget(1)
      : firstChunkBudget;
    let usedPx =
      estimateProgramOutlineDayHeaderPx(isContinuation) +
      REPORT_PROGRAM_OUTLINE_TABLE_HEADER_PX;

    while (cursor < day.activities.length) {
      const row = day.activities[cursor];
      const rowPx = estimateProgramOutlineRowPx(row);
      if (usedPx + rowPx > chunkBudget && chunk.activities.length > 0) break;

      chunk.activities.push(row);
      usedPx += rowPx;
      cursor += 1;

      if (usedPx > chunkBudget && chunk.activities.length === 1) break;
    }

    if (chunk.activities.length === 0) break;
    chunks.push(chunk);
    isContinuation = true;
  }

  return chunks.length > 0 ? chunks : [day];
}

/** Pack program-outline days by estimated height instead of fixed 2-per-page. */
export function paginateReportBookletProgramOutline(
  content: ReportBookletContent,
): Array<{ showIntro: boolean; days: ReportBookletProgramDay[] }> {
  const introBlockPx =
    estimateProgramOutlineIntroBlockPx(content.programOutline.intro) +
    estimateProgramOutlineSourcePx();
  const firstDayBudget = Math.max(
    reportProgramOutlinePageBudget(0) - introBlockPx,
    reportProgramOutlinePageBudget(1) / 2,
  );

  const expandedDays = content.programOutline.days.flatMap((day, index) =>
    splitProgramOutlineDayRows(
      day,
      index === 0 ? firstDayBudget : reportProgramOutlinePageBudget(1),
    ),
  );

  const pages: Array<{ showIntro: boolean; days: ReportBookletProgramDay[] }> =
    [];
  let current: { showIntro: boolean; days: ReportBookletProgramDay[] } = {
    showIntro: true,
    days: [],
  };
  let pageIndex = 0;
  let usedPx = introBlockPx;

  for (const dayChunk of expandedDays) {
    const dayPx = estimateProgramOutlineDayPx(dayChunk);
    const budget = reportProgramOutlinePageBudget(pageIndex);

    if (current.days.length > 0 && usedPx + dayPx > budget) {
      pages.push(current);
      pageIndex += 1;
      current = { showIntro: false, days: [] };
      usedPx = REPORT_CONTINUATION_BLOCK;
    }

    current.days.push(dayChunk);
    usedPx += dayPx;
  }

  if (current.days.length > 0 || current.showIntro) {
    pages.push(current);
  }

  const result = pages.length > 0 ? pages : [{ showIntro: true, days: [] }];

  result.forEach((page, idx) => {
    const height = measureProgramOutlinePagePx(
      page,
      idx,
      content.programOutline.intro,
    );
    const budget = reportProgramOutlinePageBudget(idx);
    if (height > budget) {
      throw new Error(
        `Program outline page ${idx + 1} exceeds budget: ${Math.round(height)}px > ${Math.round(budget)}px`,
      );
    }
  });

  return result;
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
