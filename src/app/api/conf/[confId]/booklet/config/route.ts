import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  DEFAULT_CHAIRMAN_ADDRESS,
  DEFAULT_PRESIDENT_ADDRESS,
  DEFAULT_CONFERENCE_INTRO,
} from "@/lib/conf/resolve-booklet-section-content";
import {
  isStaleConferenceIntroBody,
  resolveConferenceIntroBody,
  LIBERIAN_NATIONAL_ANTHEM,
  LSUIC_OVERVIEW_PARAGRAPHS,
  LSUIC_HISTORY_PARAGRAPHS,
} from "@/lib/conf/booklet-conference-copy";

const DEFAULT_ABBREVIATIONS_BODY = [
  "NEC — National Executive Committee",
  "CC — Conference Committee",
  "COC — Council of Coordinators",
  "CL — City Leadership",
  "JB — Judicial Board",
  "PPC — Planning & Program Committee",
  "PPA — Press & Public Affairs",
  "AEC — Academic Excellence Committee",
  "CRC — Constitution Review Committee",
  "IEC — Independent Elections Commission",
  "WC — Welfare Committee",
  "AC — Audit Committee",
  "GS — Guest Speaker",
  "LSUIC — Liberian Student Union in China",
].join("\n");

const DEFAULT_CHAIRMAN_ADDRESS_BODY = DEFAULT_CHAIRMAN_ADDRESS;
const DEFAULT_PRESIDENT_ADDRESS_BODY = DEFAULT_PRESIDENT_ADDRESS;

const SCOPED_COMMITTEE_SECTIONS = [
  {
    type: "COMMITTEE",
    title: "Program and Planning Committee",
    subtitle: "PPC",
    committeeScope: "PPC",
  },
  {
    type: "COMMITTEE",
    title: "Academic Excellence Committee",
    subtitle: "AEC",
    committeeScope: "AEC",
  },
  {
    type: "COMMITTEE",
    title: "Constitution Review Committee",
    subtitle: "CRC",
    committeeScope: "CRC",
  },
  {
    type: "COMMITTEE",
    title: "Press and Public Affairs Committee",
    subtitle: "PPA",
    committeeScope: "PPA",
  },
  {
    type: "COMMITTEE",
    title: "Independent Elections Commission",
    subtitle: "IEC",
    committeeScope: "IEC",
  },
  {
    type: "COMMITTEE",
    title: "Welfare Committee",
    subtitle: "WC",
    committeeScope: "WC",
  },
  {
    type: "COMMITTEE",
    title: "Audit Committee",
    subtitle: "AC",
    committeeScope: "AC",
  },
] as const;

const DEFAULT_CONFERENCE_INTRO_BODY = DEFAULT_CONFERENCE_INTRO;
const DEFAULT_LSUIC_OVERVIEW_BODY = LSUIC_OVERVIEW_PARAGRAPHS;
const DEFAULT_LSUIC_HISTORY_BODY = LSUIC_HISTORY_PARAGRAPHS;
const DEFAULT_ANTHEM_BODY = [
  ...LIBERIAN_NATIONAL_ANTHEM.verse1,
  "",
  ...LIBERIAN_NATIONAL_ANTHEM.verse2,
].join("\n");

const OVERVIEW_SECTION_TITLE = "Overview of LSUIC";
const OVERVIEW_SECTION_SUBTITLE = "History, Past Presidents & Venues";
const HISTORY_SECTION_TITLE = "History of the Union";
const HISTORY_SECTION_SUBTITLE = "Institutional Growth & Continuity";
const ANTHEM_SECTION_TITLE = "The National Anthem of Liberia";
const ANTHEM_SECTION_SUBTITLE = "Official Lyrics";

const DEFAULT_SECTIONS = [
  { type: "COVER", title: "Cover Page", sortOrder: 1 },
  {
    type: "TEXT",
    title: "Conference Introduction",
    subtitle: "Welcome",
    sortOrder: 2,
    bodyText: DEFAULT_CONFERENCE_INTRO_BODY,
  },
  { type: "LEADER", title: "President of Liberia", sortOrder: 3 },
  { type: "LEADER", title: "President of China", sortOrder: 4 },
  { type: "LEADER", title: "Liberian Ambassador to China", sortOrder: 5 },
  { type: "NEC", title: "NEC Leadership", sortOrder: 6 },
  {
    type: "PRESIDENT_ADDRESS",
    title: "National President Address",
    bodyText: DEFAULT_PRESIDENT_ADDRESS_BODY,
    sortOrder: 7,
  },
  { type: "GUEST_BIO", title: "Guest Speaker Biography", sortOrder: 8 },
  {
    type: "COC",
    title: "Council of Coordinators — Leadership",
    sortOrder: 9,
    committeeScope: "CoC",
  },
  {
    type: "COC_MEMBERS",
    title: "Council of Coordinators — Members",
    sortOrder: 10,
    committeeScope: "CoC Province",
  },
  {
    type: "CITY_PRESIDENTS",
    title: "City Presidents",
    sortOrder: 11,
    committeeScope: "City",
  },
  {
    type: "JUDICIAL",
    title: "Judicial Board",
    sortOrder: 12,
    committeeScope: "Judicial",
  },
  {
    type: "CHAIRMAN_ADDRESS",
    title: "Message from the Conference Chair",
    sortOrder: 13,
    bodyText: DEFAULT_CHAIRMAN_ADDRESS_BODY,
  },
  {
    type: "COMMITTEE",
    title: "Conference Committee",
    subtitle: "CC",
    sortOrder: 14,
    committeeScope: null,
  },
  ...SCOPED_COMMITTEE_SECTIONS.map((section, index) => ({
    ...section,
    sortOrder: 15 + index,
  })),
  {
    type: "ABBREVIATIONS",
    title: "Abbreviations",
    subtitle: "Glossary",
    sortOrder: 15 + SCOPED_COMMITTEE_SECTIONS.length,
    bodyText: DEFAULT_ABBREVIATIONS_BODY,
  },
  {
    type: "DELEGATES",
    title: "Delegate Roster",
    sortOrder: 16 + SCOPED_COMMITTEE_SECTIONS.length,
  },
  {
    type: "PROGRAM_OUTLINE",
    title: "Program Outline",
    subtitle: "Welcome to Jinan",
    sortOrder: 17 + SCOPED_COMMITTEE_SECTIONS.length,
  },
  {
    type: "TEXT",
    title: OVERVIEW_SECTION_TITLE,
    subtitle: OVERVIEW_SECTION_SUBTITLE,
    sortOrder: 18 + SCOPED_COMMITTEE_SECTIONS.length,
    bodyText: DEFAULT_LSUIC_OVERVIEW_BODY,
  },
  {
    type: "TEXT",
    title: HISTORY_SECTION_TITLE,
    subtitle: HISTORY_SECTION_SUBTITLE,
    sortOrder: 19 + SCOPED_COMMITTEE_SECTIONS.length,
    bodyText: DEFAULT_LSUIC_HISTORY_BODY,
  },
  {
    type: "TEXT",
    title: ANTHEM_SECTION_TITLE,
    subtitle: ANTHEM_SECTION_SUBTITLE,
    sortOrder: 20 + SCOPED_COMMITTEE_SECTIONS.length,
    bodyText: DEFAULT_ANTHEM_BODY,
  },
  {
    type: "SPONSORS",
    title: "Sponsors & Partners",
    sortOrder: 21 + SCOPED_COMMITTEE_SECTIONS.length,
  },
  {
    type: "BACK_COVER",
    title: "Back Cover",
    sortOrder: 22 + SCOPED_COMMITTEE_SECTIONS.length,
  },
];

function isConferenceCommitteeSection(section: {
  type: string;
  title: string | null;
  committeeScope: string | null;
}): boolean {
  return (
    section.type === "COMMITTEE" &&
    normalizeLabel(section.title) === normalizeLabel("Conference Committee") &&
    !section.committeeScope
  );
}

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

// GET /api/conf/[confId]/booklet/config
// Returns the booklet config. Creates it with defaults if it doesn't exist.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    let booklet = await prisma.confBooklet.findUnique({
      where: { confId },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!booklet) {
      booklet = await prisma.confBooklet.create({
        data: {
          confId,
          sections: {
            create: DEFAULT_SECTIONS,
          },
        },
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    } else {
      const existingBooklet = booklet;
      // Backfill existing booklets with updated section naming and required
      // conference committee section so TOC stays complete. Also keep internal
      // schedule items out of the public booklet output.
      await prisma.$transaction(async (tx) => {
        const existingSections = [...existingBooklet.sections].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        const presidentAddress = existingSections.find(
          (s) => s.type === "PRESIDENT_ADDRESS",
        );
        if (
          presidentAddress &&
          normalizeLabel(presidentAddress.title) ===
            normalizeLabel("President's Address")
        ) {
          await tx.confBookletSection.update({
            where: { id: presidentAddress.id },
            data: { title: "National President Address" },
          });
        }

        // Ensure National President Address exists and is placed directly
        // after NEC Leadership (same office holder context).
        {
          const sectionsForPresident = await tx.confBookletSection.findMany({
            where: { bookletId: existingBooklet.id },
            orderBy: { sortOrder: "asc" },
          });

          const necSection = sectionsForPresident.find((s) => s.type === "NEC");
          const presidentSection = sectionsForPresident.find(
            (s) => s.type === "PRESIDENT_ADDRESS",
          );
          const targetSort = necSection ? necSection.sortOrder + 1 : 7;

          if (!presidentSection) {
            await tx.confBookletSection.updateMany({
              where: {
                bookletId: existingBooklet.id,
                sortOrder: { gte: targetSort },
              },
              data: { sortOrder: { increment: 1 } },
            });

            await tx.confBookletSection.create({
              data: {
                bookletId: existingBooklet.id,
                type: "PRESIDENT_ADDRESS",
                title: "National President Address",
                subtitle: null,
                bodyText: DEFAULT_PRESIDENT_ADDRESS_BODY,
                isEnabled: true,
                sortOrder: targetSort,
                committeeScope: null,
              },
            });
          } else {
            if (
              normalizeLabel(presidentSection.title) !==
              normalizeLabel("National President Address")
            ) {
              await tx.confBookletSection.update({
                where: { id: presidentSection.id },
                data: { title: "National President Address" },
              });
            }

            if (!presidentSection.isEnabled) {
              await tx.confBookletSection.update({
                where: { id: presidentSection.id },
                data: { isEnabled: true },
              });
            }

            if (!(presidentSection.bodyText ?? "").trim()) {
              await tx.confBookletSection.update({
                where: { id: presidentSection.id },
                data: { bodyText: DEFAULT_PRESIDENT_ADDRESS_BODY },
              });
            }

            if (presidentSection.sortOrder !== targetSort) {
              const currentSort = presidentSection.sortOrder;

              if (currentSort < targetSort) {
                await tx.confBookletSection.updateMany({
                  where: {
                    bookletId: existingBooklet.id,
                    id: { not: presidentSection.id },
                    sortOrder: { gt: currentSort, lte: targetSort },
                  },
                  data: { sortOrder: { decrement: 1 } },
                });
              } else {
                await tx.confBookletSection.updateMany({
                  where: {
                    bookletId: existingBooklet.id,
                    id: { not: presidentSection.id },
                    sortOrder: { gte: targetSort, lt: currentSort },
                  },
                  data: { sortOrder: { increment: 1 } },
                });
              }

              await tx.confBookletSection.update({
                where: { id: presidentSection.id },
                data: { sortOrder: targetSort },
              });
            }
          }
        }

        const chairmanAddress = existingSections.find(
          (s) => s.type === "CHAIRMAN_ADDRESS",
        );
        if (chairmanAddress) {
          const needsTitle =
            normalizeLabel(chairmanAddress.title) ===
              normalizeLabel("Chairman's Address") ||
            !chairmanAddress.title?.trim();
          const needsBody = !(chairmanAddress.bodyText ?? "").trim();
          if (needsTitle || needsBody) {
            await tx.confBookletSection.update({
              where: { id: chairmanAddress.id },
              data: {
                ...(needsTitle
                  ? { title: "Message from the Conference Chair" }
                  : {}),
                ...(needsBody
                  ? { bodyText: DEFAULT_CHAIRMAN_ADDRESS_BODY }
                  : {}),
                isEnabled: true,
              },
            });
          }
        }
        // Create/reorder CHAIRMAN_ADDRESS after Conference Committee is ensured
        // (see below) so it sits with the committee, not after NEC.

        const hasConferenceIntro = existingSections.some(
          (s) =>
            s.type === "TEXT" &&
            normalizeLabel(s.title).includes("conference introduction"),
        );
        if (!hasConferenceIntro) {
          const firstLeaderSort =
            existingSections.find((s) => s.type === "LEADER")?.sortOrder ??
            existingSections.find((s) => s.type === "NEC")?.sortOrder ??
            2;

          await tx.confBookletSection.updateMany({
            where: {
              bookletId: existingBooklet.id,
              sortOrder: { gte: firstLeaderSort },
            },
            data: { sortOrder: { increment: 1 } },
          });

          await tx.confBookletSection.create({
            data: {
              bookletId: existingBooklet.id,
              type: "TEXT",
              title: "Conference Introduction",
              subtitle: "Welcome",
              bodyText: DEFAULT_CONFERENCE_INTRO_BODY,
              isEnabled: true,
              sortOrder: firstLeaderSort,
              committeeScope: null,
            },
          });
        }

        const hasConferenceCommittee = existingSections.some(
          isConferenceCommitteeSection,
        );

        if (!hasConferenceCommittee) {
          const firstScopedCommitteeSort =
            existingSections.find(
              (s) => s.type === "COMMITTEE" && s.committeeScope,
            )?.sortOrder ?? null;
          const scheduleSort =
            existingSections.find((s) => s.type === "SCHEDULE")?.sortOrder ??
            existingSections.length + 1;
          const insertSort = firstScopedCommitteeSort ?? scheduleSort;

          await tx.confBookletSection.updateMany({
            where: {
              bookletId: existingBooklet.id,
              sortOrder: { gte: insertSort },
            },
            data: { sortOrder: { increment: 1 } },
          });

          await tx.confBookletSection.create({
            data: {
              bookletId: existingBooklet.id,
              type: "COMMITTEE",
              title: "Conference Committee",
              subtitle: null,
              bodyText: null,
              isEnabled: true,
              sortOrder: insertSort,
              committeeScope: null,
            },
          });
        }

        // Place Message from the Conference Chair immediately before Conference
        // Committee. National President Address stays after NEC; Chair must not
        // occupy that slot.
        {
          const sectionsForChair = await tx.confBookletSection.findMany({
            where: { bookletId: existingBooklet.id },
            orderBy: { sortOrder: "asc" },
          });
          const chairman = sectionsForChair.find(
            (s) => s.type === "CHAIRMAN_ADDRESS",
          );
          const conferenceCommittee = sectionsForChair.find(
            isConferenceCommitteeSection,
          );

          if (!chairman) {
            const judicialSort = sectionsForChair.find(
              (s) => s.type === "JUDICIAL",
            )?.sortOrder;
            const insertSort =
              conferenceCommittee?.sortOrder ??
              (judicialSort != null
                ? judicialSort + 1
                : (sectionsForChair.find((s) => s.type === "PRESIDENT_ADDRESS")
                    ?.sortOrder ?? 7) + 1);

            await tx.confBookletSection.updateMany({
              where: {
                bookletId: existingBooklet.id,
                sortOrder: { gte: insertSort },
              },
              data: { sortOrder: { increment: 1 } },
            });

            await tx.confBookletSection.create({
              data: {
                bookletId: existingBooklet.id,
                type: "CHAIRMAN_ADDRESS",
                title: "Message from the Conference Chair",
                subtitle: null,
                bodyText: DEFAULT_CHAIRMAN_ADDRESS_BODY,
                isEnabled: true,
                sortOrder: insertSort,
                committeeScope: null,
              },
            });
          } else if (conferenceCommittee) {
            const chairIdx = sectionsForChair.findIndex(
              (s) => s.id === chairman.id,
            );
            const ccIdx = sectionsForChair.findIndex(
              (s) => s.id === conferenceCommittee.id,
            );
            if (chairIdx !== ccIdx - 1) {
              const chairSort = chairman.sortOrder;
              const ccSort = conferenceCommittee.sortOrder;

              // Lift chairman out of the sequence.
              await tx.confBookletSection.updateMany({
                where: {
                  bookletId: existingBooklet.id,
                  id: { not: chairman.id },
                  sortOrder: { gt: chairSort },
                },
                data: { sortOrder: { decrement: 1 } },
              });

              const targetSort = ccSort > chairSort ? ccSort - 1 : ccSort;

              await tx.confBookletSection.updateMany({
                where: {
                  bookletId: existingBooklet.id,
                  id: { not: chairman.id },
                  sortOrder: { gte: targetSort },
                },
                data: { sortOrder: { increment: 1 } },
              });

              await tx.confBookletSection.update({
                where: { id: chairman.id },
                data: { sortOrder: targetSort, isEnabled: true },
              });
            }
          }
        }

        await tx.confBookletSection.updateMany({
          where: {
            bookletId: existingBooklet.id,
            type: "SCHEDULE",
          },
          data: {
            isEnabled: false,
          },
        });

        const hasAbbreviations = existingSections.some(
          (s) => s.type === "ABBREVIATIONS",
        );
        if (!hasAbbreviations) {
          const delegatesSort =
            existingSections.find((s) => s.type === "DELEGATES")?.sortOrder ??
            existingSections.length + 1;

          await tx.confBookletSection.updateMany({
            where: {
              bookletId: existingBooklet.id,
              sortOrder: { gte: delegatesSort },
            },
            data: { sortOrder: { increment: 1 } },
          });

          await tx.confBookletSection.create({
            data: {
              bookletId: existingBooklet.id,
              type: "ABBREVIATIONS",
              title: "Abbreviations",
              subtitle: "Glossary",
              bodyText: DEFAULT_ABBREVIATIONS_BODY,
              isEnabled: true,
              sortOrder: delegatesSort,
              committeeScope: null,
            },
          });
        }

        const existingScopes = new Set(
          existingSections
            .filter((s) => s.type === "COMMITTEE" && s.committeeScope)
            .map((s) => s.committeeScope),
        );
        const missingScoped = SCOPED_COMMITTEE_SECTIONS.filter(
          (section) => !existingScopes.has(section.committeeScope),
        );

        if (missingScoped.length > 0) {
          const insertBeforeSort =
            existingSections.find((s) => s.type === "ABBREVIATIONS")
              ?.sortOrder ??
            existingSections.find((s) => s.type === "DELEGATES")?.sortOrder ??
            existingSections.length + 1;

          await tx.confBookletSection.updateMany({
            where: {
              bookletId: existingBooklet.id,
              sortOrder: { gte: insertBeforeSort },
            },
            data: { sortOrder: { increment: missingScoped.length } },
          });

          for (let i = 0; i < missingScoped.length; i++) {
            const section = missingScoped[i];
            await tx.confBookletSection.create({
              data: {
                bookletId: existingBooklet.id,
                type: section.type,
                title: section.title,
                subtitle: section.subtitle,
                bodyText: null,
                isEnabled: true,
                sortOrder: insertBeforeSort + i,
                committeeScope: section.committeeScope,
              },
            });
          }
        }

        // Backfill missing LEADER dignitary sections (president / ambassador pages).
        const DEFAULT_LEADER_SECTIONS = [
          { title: "President of Liberia", sortHint: 3 },
          { title: "President of China", sortHint: 4 },
          { title: "Liberian Ambassador to China", sortHint: 5 },
        ] as const;

        const leaderSections = existingSections.filter(
          (s) => s.type === "LEADER",
        );
        const hasLeaderTitle = (wanted: string) =>
          leaderSections.some((s) => {
            const t = normalizeLabel(s.title);
            const w = normalizeLabel(wanted);
            if (w.includes("ambassador")) return t.includes("ambassador");
            if (w.includes("liberia")) {
              return (
                t.includes("liberia") &&
                t.includes("president") &&
                !t.includes("ambassador")
              );
            }
            if (w.includes("china")) {
              return (
                t.includes("china") &&
                t.includes("president") &&
                !t.includes("ambassador")
              );
            }
            return t === w;
          });

        const missingLeaders = DEFAULT_LEADER_SECTIONS.filter(
          (def) => !hasLeaderTitle(def.title),
        );
        if (missingLeaders.length > 0) {
          const insertAfter =
            existingSections.find(
              (s) =>
                s.type === "TEXT" &&
                normalizeLabel(s.title).includes("conference introduction"),
            )?.sortOrder ??
            existingSections.find((s) => s.type === "COVER")?.sortOrder ??
            1;
          const insertSort = insertAfter + 1;

          await tx.confBookletSection.updateMany({
            where: {
              bookletId: existingBooklet.id,
              sortOrder: { gte: insertSort },
            },
            data: { sortOrder: { increment: missingLeaders.length } },
          });

          for (let i = 0; i < missingLeaders.length; i++) {
            await tx.confBookletSection.create({
              data: {
                bookletId: existingBooklet.id,
                type: "LEADER",
                title: missingLeaders[i].title,
                subtitle: null,
                bodyText: null,
                isEnabled: true,
                sortOrder: insertSort + i,
                committeeScope: null,
              },
            });
          }
        }

        // Re-read after LEADER inserts so PROGRAM_OUTLINE lands after Delegates.
        const sectionsForProgram = await tx.confBookletSection.findMany({
          where: { bookletId: existingBooklet.id },
          orderBy: { sortOrder: "asc" },
        });

        const hasProgramOutline = sectionsForProgram.some(
          (s) => s.type === "PROGRAM_OUTLINE",
        );
        if (!hasProgramOutline) {
          // Prefer immediately after Delegate Roster; fall back before Sponsors.
          const delegatesSort = sectionsForProgram.find(
            (s) => s.type === "DELEGATES",
          )?.sortOrder;
          const insertSort =
            delegatesSort != null
              ? delegatesSort + 1
              : (sectionsForProgram.find((s) => s.type === "SPONSORS")
                  ?.sortOrder ?? sectionsForProgram.length + 1);

          await tx.confBookletSection.updateMany({
            where: {
              bookletId: existingBooklet.id,
              sortOrder: { gte: insertSort },
            },
            data: { sortOrder: { increment: 1 } },
          });

          await tx.confBookletSection.create({
            data: {
              bookletId: existingBooklet.id,
              type: "PROGRAM_OUTLINE",
              title: "Program Outline",
              subtitle: "Welcome to Jinan",
              bodyText: null,
              isEnabled: true,
              sortOrder: insertSort,
              committeeScope: null,
            },
          });
        } else {
          // Recover if the unscoped WMF updateMany bug disabled/renamed it.
          const programOutline = sectionsForProgram.find(
            (s) => s.type === "PROGRAM_OUTLINE",
          );
          if (
            programOutline &&
            (!programOutline.isEnabled ||
              normalizeLabel(programOutline.title).includes("ways, means"))
          ) {
            await tx.confBookletSection.update({
              where: { id: programOutline.id },
              data: {
                isEnabled: true,
                title: "Program Outline",
                subtitle: programOutline.subtitle || "Welcome to Jinan",
              },
            });
          }
        }

        // Ensure LSUIC overview/history narrative pages exist after Program
        // Outline while preserving current booklet template and custom ordering.
        {
          const sectionsForOverview = await tx.confBookletSection.findMany({
            where: { bookletId: existingBooklet.id },
            orderBy: { sortOrder: "asc" },
          });

          const overviewExisting = sectionsForOverview.find(
            (s) =>
              s.type === "TEXT" &&
              normalizeLabel(s.title) ===
                normalizeLabel(OVERVIEW_SECTION_TITLE),
          );
          const historyExisting = sectionsForOverview.find(
            (s) =>
              s.type === "TEXT" &&
              normalizeLabel(s.title) === normalizeLabel(HISTORY_SECTION_TITLE),
          );
          const anthemExisting = sectionsForOverview.find(
            (s) =>
              s.type === "TEXT" &&
              normalizeLabel(s.title) === normalizeLabel(ANTHEM_SECTION_TITLE),
          );

          const missingNarrative = [
            overviewExisting
              ? null
              : {
                  title: OVERVIEW_SECTION_TITLE,
                  subtitle: OVERVIEW_SECTION_SUBTITLE,
                  bodyText: DEFAULT_LSUIC_OVERVIEW_BODY,
                },
            historyExisting
              ? null
              : {
                  title: HISTORY_SECTION_TITLE,
                  subtitle: HISTORY_SECTION_SUBTITLE,
                  bodyText: DEFAULT_LSUIC_HISTORY_BODY,
                },
            anthemExisting
              ? null
              : {
                  title: ANTHEM_SECTION_TITLE,
                  subtitle: ANTHEM_SECTION_SUBTITLE,
                  bodyText: DEFAULT_ANTHEM_BODY,
                },
          ].filter(Boolean) as Array<{
            title: string;
            subtitle: string;
            bodyText: string;
          }>;

          const programSort = sectionsForOverview.find(
            (s) => s.type === "PROGRAM_OUTLINE",
          )?.sortOrder;
          const fallbackInsertBefore =
            sectionsForOverview.find((s) => s.type === "SPONSORS")?.sortOrder ??
            sectionsForOverview.length + 1;
          const insertSort =
            programSort != null ? programSort + 1 : fallbackInsertBefore;

          if (missingNarrative.length > 0) {
            await tx.confBookletSection.updateMany({
              where: {
                bookletId: existingBooklet.id,
                sortOrder: { gte: insertSort },
              },
              data: { sortOrder: { increment: missingNarrative.length } },
            });

            for (let i = 0; i < missingNarrative.length; i++) {
              const section = missingNarrative[i];
              await tx.confBookletSection.create({
                data: {
                  bookletId: existingBooklet.id,
                  type: "TEXT",
                  title: section.title,
                  subtitle: section.subtitle,
                  bodyText: section.bodyText,
                  isEnabled: true,
                  sortOrder: insertSort + i,
                  committeeScope: null,
                },
              });
            }
          }

          if (overviewExisting) {
            await tx.confBookletSection.update({
              where: { id: overviewExisting.id },
              data: {
                isEnabled: true,
                subtitle:
                  overviewExisting.subtitle || OVERVIEW_SECTION_SUBTITLE,
                bodyText:
                  overviewExisting.bodyText?.trim() ||
                  DEFAULT_LSUIC_OVERVIEW_BODY,
              },
            });
          }

          if (historyExisting) {
            await tx.confBookletSection.update({
              where: { id: historyExisting.id },
              data: {
                isEnabled: true,
                subtitle: historyExisting.subtitle || HISTORY_SECTION_SUBTITLE,
                bodyText:
                  historyExisting.bodyText?.trim() ||
                  DEFAULT_LSUIC_HISTORY_BODY,
              },
            });
          }

          if (anthemExisting) {
            await tx.confBookletSection.update({
              where: { id: anthemExisting.id },
              data: {
                isEnabled: true,
                subtitle: anthemExisting.subtitle || ANTHEM_SECTION_SUBTITLE,
                bodyText:
                  anthemExisting.bodyText?.trim() || DEFAULT_ANTHEM_BODY,
              },
            });
          }
        }

        // Recover titles wiped by unscoped updateMany
        // (50301af accidentally dropped the WMF where clause).
        const sectionsForRecovery = await tx.confBookletSection.findMany({
          where: { bookletId: existingBooklet.id },
          orderBy: { sortOrder: "asc" },
        });
        const wipedSections = sectionsForRecovery.filter(
          (s) =>
            normalizeLabel(s.title) ===
              normalizeLabel("Ways, Means & Finance (Legacy)") &&
            !(s.type === "COMMITTEE" && s.committeeScope === "WMF"),
        );
        if (wipedSections.length > 0) {
          const TYPE_DEFAULT_TITLE: Record<string, string> = {
            COVER: "Cover Page",
            TEXT: "Conference Introduction",
            NEC: "NEC Leadership",
            PRESIDENT_ADDRESS: "National President Address",
            CHAIRMAN_ADDRESS: "Message from the Conference Chair",
            GUEST_BIO: "Guest Speaker Biography",
            COC: "Council of Coordinators — Leadership",
            COC_MEMBERS: "Council of Coordinators — Members",
            CITY_PRESIDENTS: "City Presidents",
            JUDICIAL: "Judicial Board",
            COMMITTEE: "Conference Committee",
            ABBREVIATIONS: "Abbreviations",
            DELEGATES: "Delegate Roster",
            PROGRAM_OUTLINE: "Program Outline",
            SPONSORS: "Sponsors & Partners",
            BACK_COVER: "Back Cover",
            SCHEDULE: "Schedule",
          };

          const wipedLeaders = wipedSections
            .filter((s) => s.type === "LEADER")
            .sort((a, b) => a.sortOrder - b.sortOrder);
          const leaderTitles = [
            "President of Liberia",
            "President of China",
            "Liberian Ambassador to China",
          ];

          for (const section of wipedSections) {
            let restoredTitle =
              TYPE_DEFAULT_TITLE[section.type] ?? section.title;
            if (section.type === "LEADER") {
              const idx = wipedLeaders.findIndex((s) => s.id === section.id);
              restoredTitle =
                leaderTitles[idx] ?? `Leadership Profile ${idx + 1}`;
            }
            await tx.confBookletSection.update({
              where: { id: section.id },
              data: {
                title: restoredTitle,
                isEnabled: section.type !== "SCHEDULE",
                ...(section.type === "PROGRAM_OUTLINE"
                  ? { subtitle: "Welcome to Jinan" }
                  : {}),
                ...(section.type === "TEXT" &&
                restoredTitle === "Conference Introduction"
                  ? {
                      bodyText:
                        section.bodyText || DEFAULT_CONFERENCE_INTRO_BODY,
                    }
                  : {}),
              },
            });
          }
        }

        // Disable legacy Ways, Means & Finance committee only — never all sections.
        await tx.confBookletSection.updateMany({
          where: {
            bookletId: existingBooklet.id,
            type: "COMMITTEE",
            committeeScope: "WMF",
          },
          data: {
            isEnabled: false,
            title: "Ways, Means & Finance (Legacy)",
          },
        });

        // Upgrade stale Conference Introduction copy saved before expanded Jinan 2026 prose.
        const introSection = (
          await tx.confBookletSection.findMany({
            where: { bookletId: existingBooklet.id },
            orderBy: { sortOrder: "asc" },
          })
        ).find(
          (s) =>
            s.type === "TEXT" &&
            normalizeLabel(s.title).includes("conference introduction"),
        );
        if (introSection && isStaleConferenceIntroBody(introSection.bodyText)) {
          await tx.confBookletSection.update({
            where: { id: introSection.id },
            data: {
              bodyText: resolveConferenceIntroBody(introSection.bodyText),
            },
          });
        }
      });

      booklet = await prisma.confBooklet.findUnique({
        where: { confId },
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    return NextResponse.json({ booklet });
  } catch (error) {
    console.error("GET /booklet/config error:", error);
    return NextResponse.json(
      { error: "Failed to load booklet config" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/booklet/config
// Update booklet title, subtitle, theme, cover image, or status.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as Record<string, unknown>;
    const { title, subtitle, theme, coverImagePath, status } = body;

    const updated = await prisma.confBooklet.upsert({
      where: { confId },
      create: {
        confId,
        title:
          typeof title === "string"
            ? title
            : "20th Annaual Conference & 179th Independence Day Celebration of Liberia",
        subtitle: typeof subtitle === "string" ? subtitle : undefined,
        theme: typeof theme === "string" ? theme : undefined,
        coverImagePath:
          typeof coverImagePath === "string" ? coverImagePath : undefined,
        status:
          status === "DRAFT" || status === "READY" || status === "PUBLISHED"
            ? status
            : "DRAFT",
      },
      update: {
        ...(typeof title === "string" && { title }),
        ...(typeof subtitle === "string" && { subtitle }),
        ...(typeof theme === "string" && { theme }),
        ...(typeof coverImagePath === "string" && { coverImagePath }),
        ...(status === "DRAFT" || status === "READY" || status === "PUBLISHED"
          ? { status }
          : {}),
      },
    });

    return NextResponse.json({ booklet: updated });
  } catch (error) {
    console.error("PATCH /booklet/config error:", error);
    return NextResponse.json(
      { error: "Failed to update booklet config" },
      { status: 500 },
    );
  }
}
