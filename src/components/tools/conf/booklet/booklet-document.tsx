import { type ReactNode } from "react";
import {
  resolveChairmanAddress,
  resolveGuestBioAddress,
  resolvePresidentAddress,
  resolveRosterAddressPages,
  shouldRenderTextSection,
} from "@/lib/conf/resolve-booklet-section-content";
import { C } from "./constants";
import type { BookletData, BookletSection } from "./types";
import {
  bookletBodyPageCount,
  buildTocRenderableEntries,
  chunkDelegates,
  computeSectionTocRows,
  getFirstBodyPageNum,
  getTocPageNum,
  paginateTocEntries,
  resolveBookletTocPages,
  sectionPageSpan,
} from "./booklet-section-pages";
import { isCocMembersContinuation } from "./booklet-pagination";
import { sortBookletMembersByName } from "./sort-booklet-members";
import { CoverPage } from "./CoverPage";
import { BackCoverPage } from "./BackCoverPage";
import { TableOfContentsPage } from "./TableOfContentsPage";
import { LeaderSection } from "./LeaderSection";
import { AddressSection } from "./AddressSection";
import { CommitteeSection } from "./CommitteeSection";
import { DelegatesSection } from "./DelegatesSection";
import { TextSection } from "./TextSection";
import { BOOKLET_A4, DELEGATES_PER_BOOKLET_PAGE } from "./constants";

export type BookletLayout = {
  enabledSections: BookletSection[];
  hasCover: boolean;
  hasBackCover: boolean;
  totalPages: number;
  tocSectionRows: ReturnType<typeof computeSectionTocRows>;
  tocPageNum: number;
  tocPageCount: number;
  tocEntryPages: ReturnType<typeof paginateTocEntries>;
};

export function computeBookletLayout(data: BookletData): BookletLayout {
  const enabledSections = [...(data.booklet?.sections ?? [])]
    .filter(
      (s) =>
        s.isEnabled &&
        s.type !== "COVER" &&
        s.type !== "BACK_COVER" &&
        s.type !== "SCHEDULE",
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const hasCover = (data.booklet?.sections ?? []).some(
    (s) => s.type === "COVER" && s.isEnabled,
  );
  const hasBackCover = (data.booklet?.sections ?? []).some(
    (s) => s.type === "BACK_COVER" && s.isEnabled,
  );

  const bodyPageCount = bookletBodyPageCount(enabledSections, data);
  const tocPageCount = resolveBookletTocPages(
    enabledSections,
    data,
    hasCover,
    hasBackCover,
    bodyPageCount,
  );
  const tocSectionRows = computeSectionTocRows(
    enabledSections,
    data,
    hasCover,
    tocPageCount,
  );
  const tocPageNum = getTocPageNum(hasCover);
  const totalPages =
    (hasCover ? 1 : 0) + tocPageCount + bodyPageCount + (hasBackCover ? 1 : 0);
  const tocEntryPages = paginateTocEntries(
    buildTocRenderableEntries(
      tocSectionRows,
      hasCover,
      hasBackCover,
      totalPages,
    ),
  );

  return {
    enabledSections,
    hasCover,
    hasBackCover,
    totalPages,
    tocSectionRows,
    tocPageNum,
    tocPageCount,
    tocEntryPages,
  };
}

function filterCommitteeMembersForSection(
  section: BookletSection,
  data: BookletData,
  leaderNames: Set<string>,
): BookletData["committeeMembers"] {
  if (section.type === "CITY_PRESIDENTS") {
    return data.committeeMembers.filter(
      (m) => !leaderNames.has(normalizeBookletName(m.name)),
    );
  }
  if (section.type === "COMMITTEE" && !section.committeeScope?.trim()) {
    return data.committeeMembers.filter((m) => m.committeeScope === null);
  }
  if (section.committeeScope) {
    return data.committeeMembers.filter(
      (m) => m.committeeScope === section.committeeScope,
    );
  }
  return data.committeeMembers;
}

function normalizeBookletName(name: string): string {
  return (name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function renderSection(
  section: BookletSection,
  data: BookletData,
  startPageNum: number,
  totalPages: number,
  options?: {
    allSections?: BookletSection[];
    sectionIndex?: number;
  },
) {
  const { event, leaders, necMembers, delegates } = data;
  const confName = event.name;
  const confYear = event.year;
  const key = section.id;
  const common = { startPageNum, totalPages, confName, confYear };
  const pageNum = startPageNum;
  const commonSingle = { pageNum, totalPages, confName, confYear };

  function normalizeName(name: string): string {
    return normalizeBookletName(name);
  }

  const leaderNames = new Set(leaders.map((l) => normalizeName(l.name)));
  const nextSection =
    options?.allSections && options.sectionIndex != null
      ? options.allSections[options.sectionIndex + 1]
      : undefined;
  const cocContinuation =
    isCocMembersContinuation(section, nextSection) && nextSection
      ? {
          section: nextSection,
          members: filterCommitteeMembersForSection(
            nextSection,
            data,
            leaderNames,
          ),
        }
      : undefined;

  const rosterLinks = data.rosterAddressLinks ?? [];

  switch (section.type) {
    case "LEADER":
      return (
        <LeaderSection
          key={key}
          section={section}
          leaders={leaders}
          conferenceId={event.id}
          startPageNum={common.startPageNum}
          totalPages={totalPages}
          confName={confName}
          confYear={confYear}
        />
      );

    case "PRESIDENT_ADDRESS": {
      const resolved = resolvePresidentAddress(section, data, rosterLinks);
      const extraPages = resolveRosterAddressPages(data, rosterLinks);
      if (!resolved && extraPages.length === 0) return null;

      let pageCursor = pageNum;
      return (
        <>
          {resolved ? (
            <AddressSection
              key={key}
              section={section}
              speaker={resolved.speaker}
              content={resolved.content}
              pageNum={pageCursor++}
              totalPages={totalPages}
              confName={confName}
              confYear={confYear}
            />
          ) : null}
          {extraPages.map((page) => (
            <AddressSection
              key={`${key}-${page.rosterKey}`}
              section={section}
              sectionLabel={page.title}
              speaker={page.speaker}
              content={page.content}
              pageNum={pageCursor++}
              totalPages={totalPages}
              confName={confName}
              confYear={confYear}
            />
          ))}
        </>
      );
    }

    case "GUEST_BIO": {
      const resolved = resolveGuestBioAddress(section);
      if (!resolved) return null;
      return (
        <AddressSection
          key={key}
          section={section}
          speaker={resolved.speaker}
          content={resolved.content}
          {...commonSingle}
        />
      );
    }

    case "CHAIRMAN_ADDRESS": {
      const resolved = resolveChairmanAddress(section, data);
      if (!resolved) return null;
      return (
        <AddressSection
          key={key}
          section={section}
          speaker={resolved.speaker}
          content={resolved.content}
          {...commonSingle}
        />
      );
    }

    case "NEC":
      return (
        <CommitteeSection
          key={key}
          section={section}
          members={necMembers}
          startPageNum={startPageNum}
          totalPages={totalPages}
          confName={confName}
          confYear={confYear}
        />
      );

    case "COMMITTEE":
    case "COC":
    case "COC_MEMBERS":
    case "CITY_PRESIDENTS":
    case "JUDICIAL":
      return (
        <CommitteeSection
          key={key}
          section={section}
          members={filterCommitteeMembersForSection(
            section,
            data,
            leaderNames,
          )}
          continuation={cocContinuation}
          startPageNum={startPageNum}
          totalPages={totalPages}
          confName={confName}
          confYear={confYear}
        />
      );

    case "DELEGATES": {
      const sortedDelegates = sortBookletMembersByName(delegates);
      const rosterChunks =
        sortedDelegates.length === 0
          ? [[] as typeof delegates]
          : chunkDelegates(sortedDelegates, DELEGATES_PER_BOOKLET_PAGE);
      return (
        <>
          {rosterChunks.map((chunk, idx) => (
            <DelegatesSection
              key={`${key}-${idx}`}
              section={section}
              delegates={chunk}
              totalDelegateCount={sortedDelegates.length}
              rosterPageIndex={idx}
              rosterPageCount={rosterChunks.length}
              pageNum={startPageNum + idx}
              totalPages={totalPages}
              confName={confName}
              confYear={confYear}
            />
          ))}
        </>
      );
    }

    default:
      if (!shouldRenderTextSection(section)) return null;
      return <TextSection key={key} section={section} {...commonSingle} />;
  }
}

export function BookletDocument({
  data,
  layout,
  gap = 0,
}: {
  data: BookletData;
  layout: BookletLayout;
  /** Preview uses spacing between pages; print/export uses 0. */
  gap?: number;
}) {
  const {
    enabledSections,
    hasCover,
    hasBackCover,
    totalPages,
    tocPageNum,
    tocPageCount,
    tocEntryPages,
  } = layout;

  const sectionNodes = enabledSections.reduce<{ nodes: ReactNode[]; rp: number }>(
    ({ nodes, rp }, s, index) => {
      const prev = enabledSections[index - 1];
      if (prev && isCocMembersContinuation(prev, s)) {
        return { nodes, rp };
      }

      const startPage = rp;
      const delta = sectionPageSpan(s, data, {
        allSections: enabledSections,
        index,
      });
      return {
        nodes: [
          ...nodes,
          renderSection(s, data, startPage, totalPages, {
            allSections: enabledSections,
            sectionIndex: index,
          }),
        ],
        rp: rp + delta,
      };
    },
    { nodes: [], rp: getFirstBodyPageNum(hasCover, tocPageCount) },
  ).nodes;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${gap}px`,
      }}
    >
      {hasCover && (
        <CoverPage
          event={data.event}
          bookletTitle={data.booklet?.title ?? data.event.name}
          bookletSubtitle={data.booklet?.subtitle ?? null}
          theme={data.booklet?.theme ?? null}
        />
      )}

      {tocEntryPages.map((entryPage, idx) => (
        <TableOfContentsPage
          key={`toc-${idx}`}
          tocPageNum={tocPageNum + idx}
          showHeading={idx === 0}
          entries={entryPage}
          confName={data.event.name}
          confYear={data.event.year}
          totalPages={totalPages}
        />
      ))}

      {sectionNodes}

      {hasBackCover && (
        <BackCoverPage event={data.event} totalPages={totalPages} />
      )}

      {!hasBackCover && (
        <div
          className="booklet-page"
          style={{
            width: `${BOOKLET_A4.width}px`,
            height: `${BOOKLET_A4.height}px`,
            padding: "18px 40px",
            background: C.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: `${C.white}70`,
            }}
          >
            Liberian Student Union in China · {data.event.name} ·{" "}
            {data.event.year}
          </p>
        </div>
      )}
    </div>
  );
}
