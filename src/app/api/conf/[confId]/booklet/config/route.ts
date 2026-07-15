import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { DEFAULT_CONFERENCE_INTRO } from "@/lib/conf/resolve-booklet-section-content";
import {
  isStaleConferenceIntroBody,
  resolveConferenceIntroBody,
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

const SCOPED_COMMITTEE_SECTIONS = [
  { type: "COMMITTEE", title: "Program and Planning Committee", subtitle: "PPC", committeeScope: "PPC" },
  { type: "COMMITTEE", title: "Academic Excellence Committee", subtitle: "AEC", committeeScope: "AEC" },
  { type: "COMMITTEE", title: "Constitution Review Committee", subtitle: "CRC", committeeScope: "CRC" },
  { type: "COMMITTEE", title: "Press and Public Affairs Committee", subtitle: "PPA", committeeScope: "PPA" },
  { type: "COMMITTEE", title: "Independent Elections Commission", subtitle: "IEC", committeeScope: "IEC" },
  { type: "COMMITTEE", title: "Welfare Committee", subtitle: "WC", committeeScope: "WC" },
  { type: "COMMITTEE", title: "Audit Committee", subtitle: "AC", committeeScope: "AC" },
] as const;

const DEFAULT_CONFERENCE_INTRO_BODY = DEFAULT_CONFERENCE_INTRO;

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
    sortOrder: 7,
  },
  { type: "CHAIRMAN_ADDRESS", title: "Chairman's Address", sortOrder: 8 },
  { type: "GUEST_BIO", title: "Guest Speaker Biography", sortOrder: 9 },
  {
    type: "COC",
    title: "Council of Coordinators — Leadership",
    sortOrder: 10,
    committeeScope: "CoC",
  },
  {
    type: "COC_MEMBERS",
    title: "Council of Coordinators — Members",
    sortOrder: 11,
    committeeScope: "CoC Province",
  },
  {
    type: "CITY_PRESIDENTS",
    title: "City Presidents",
    sortOrder: 12,
    committeeScope: "City",
  },
  {
    type: "JUDICIAL",
    title: "Judicial Board",
    sortOrder: 13,
    committeeScope: "Judicial",
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
  { type: "DELEGATES", title: "Delegate Roster", sortOrder: 16 + SCOPED_COMMITTEE_SECTIONS.length },
  {
    type: "PROGRAM_OUTLINE",
    title: "Program Outline",
    subtitle: "Welcome to Jinan",
    sortOrder: 17 + SCOPED_COMMITTEE_SECTIONS.length,
  },
  { type: "SPONSORS", title: "Sponsors & Partners", sortOrder: 18 + SCOPED_COMMITTEE_SECTIONS.length },
  { type: "BACK_COVER", title: "Back Cover", sortOrder: 19 + SCOPED_COMMITTEE_SECTIONS.length },
];

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
          (s) =>
            s.type === "COMMITTEE" &&
            normalizeLabel(s.title) === normalizeLabel("Conference Committee") &&
            !s.committeeScope,
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
            CHAIRMAN_ADDRESS: "Chairman's Address",
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
        if (
          introSection &&
          isStaleConferenceIntroBody(introSection.bodyText)
        ) {
          await tx.confBookletSection.update({
            where: { id: introSection.id },
            data: { bodyText: resolveConferenceIntroBody(introSection.bodyText) },
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
        title: typeof title === "string" ? title : "Conference Booklet",
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
