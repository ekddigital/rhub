import { dedupeLeaderProfilesForConference } from "@/lib/conf/dedupe-leader-profiles";

export type BookletLeaderProfile = {
  confId: string | null;
  role: string;
  name: string;
  title: string;
  country?: string | null;
  sortOrder: number;
  photoPath?: string | null;
  bio?: string | null;
};

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Each LEADER booklet section is one dignitary page. Match the enabled section
 * title to a single profile instead of rendering the full roster per section.
 */
export function resolveLeadersForBookletSection<
  T extends BookletLeaderProfile,
>(
  sectionTitle: string,
  leaders: T[],
  conferenceId: string,
): T[] {
  const deduped = dedupeLeaderProfilesForConference(leaders, conferenceId);
  const title = normalizeLabel(sectionTitle);

  const isLiberiaPresident =
    title.includes("liberia") &&
    title.includes("president") &&
    !title.includes("ambassador");
  const isChinaPresident =
    title.includes("china") &&
    title.includes("president") &&
    !title.includes("ambassador");
  const isAmbassador = title.includes("ambassador");

  const pick = (predicate: (leader: T) => boolean) => {
    const match = deduped.find(predicate);
    return match ? [match] : [];
  };

  if (isLiberiaPresident) {
    return pick(
      (l) =>
        normalizeLabel(l.country).includes("liberia") &&
        normalizeLabel(l.title).includes("president"),
    );
  }

  if (isChinaPresident) {
    return [];
  }

  if (isAmbassador) {
    return pick(
      (l) =>
        normalizeLabel(l.title).includes("ambassador") ||
        normalizeLabel(l.role).includes("ambassador"),
    );
  }

  return [];
}
