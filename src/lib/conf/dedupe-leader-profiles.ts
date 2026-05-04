/**
 * Booklet leader query returns global templates (`confId = null`) alongside
 * conference overrides (`confId = conferenceId`). Without merging, the same
 * dignitary can appear twice (e.g. duplicate president pages).
 *
 * Keeps one row per logical leader: prefer conference-specific over global,
 * then richer records on ties. Stable ordering follows original `sortOrder`.
 */

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeTitle(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Strip common honorifics already normalized to lowercase. */
function stripHonorifics(normName: string): string {
  return normName
    .replace(/^h\.?\s*e\.?\s+/, "")
    .replace(/^his\s+excellency\s+/, "")
    .replace(/^her\s+excellency\s+/, "")
    .trim();
}

export function leaderProfileDedupeKey(profile: {
  title: string;
  name: string;
  country?: string | null;
}): string {
  const title = normalizeTitle(profile.title);
  const name = stripHonorifics(normalizeName(profile.name));
  const country = normalizeName(profile.country ?? "");
  return `${title}|${name}|${country}`;
}

export function dedupeLeaderProfilesForConference<
  T extends {
    confId: string | null;
    title: string;
    name: string;
    country?: string | null;
    sortOrder: number;
    photoPath?: string | null;
    bio?: string | null;
  },
>(leaders: T[], conferenceId?: string): T[] {
  const conferenceTier = (l: T) => {
    if (conferenceId !== undefined) {
      if (l.confId === conferenceId) return 100;
      if (l.confId === null) return 50;
      return 0;
    }
    return l.confId !== null ? 100 : 50;
  };

  const score = (l: T) =>
    conferenceTier(l) +
    (l.photoPath ? 10 : 0) +
    (l.bio ? 4 : 0) +
    (l.country?.trim() ? 1 : 0);

  const bestByKey = new Map<string, T>();

  const sorted = [...leaders].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const l of sorted) {
    const key = leaderProfileDedupeKey(l);
    const prev = bestByKey.get(key);
    if (!prev || score(l) > score(prev)) {
      bestByKey.set(key, l);
    }
  }

  return Array.from(bestByKey.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
