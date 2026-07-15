import { prisma } from "@/lib/prisma";

/** Concise booklet bio paraphrased from Liberian MOFA press coverage (June 2014). */
export const AMBASSADOR_THOMAS_BIO = [
  "His Excellency Dudley McKinley Thomas was commissioned on 25 June 2014 as Liberia’s Ambassador Extraordinary and Plenipotentiary to the People’s Republic of China.",
  "A seasoned diplomat with long Foreign Service experience, he pledged to deepen Liberia–China economic and political partnership and to advance economic and development diplomacy throughout his tour of duty.",
].join(" ");

/**
 * Global leader profiles (confId: null) shown across conference booklets.
 * LEADER section titles must contain matching keywords (see resolve-booklet-leader).
 */
export const DEFAULT_GLOBAL_LEADERS = [
  {
    role: "H.E.",
    name: "Joseph Nyuma Boakai Sr.",
    title: "President of the Republic of Liberia",
    country: "Liberia",
    photoPath: "/conf/president_boakai_Liberia.png",
    bio: null as string | null,
    sortOrder: 1,
    kind: "liberia-president" as const,
  },
  {
    role: "H.E.",
    name: "Xi Jinping",
    title: "President of the People's Republic of China",
    country: "China",
    photoPath: "/conf/president_xi_China.png",
    bio: null as string | null,
    sortOrder: 2,
    kind: "china-president" as const,
  },
  {
    role: "Ambassador",
    name: "His Excellency Dudley McKinley Thomas",
    title:
      "Liberia's Ambassador Extraordinary and Plenipotentiary to the People's Republic of China",
    country: "Liberia",
    photoPath: "/conf/ambassador.jpg",
    bio: AMBASSADOR_THOMAS_BIO,
    sortOrder: 3,
    kind: "liberia-ambassador" as const,
  },
] as const;

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function classifyLeader(leader: {
  role: string;
  name: string;
  title: string;
  country: string | null;
}): (typeof DEFAULT_GLOBAL_LEADERS)[number]["kind"] | null {
  const title = normalizeLabel(leader.title);
  const role = normalizeLabel(leader.role);
  const country = normalizeLabel(leader.country);
  const name = normalizeLabel(leader.name);

  if (
    (title.includes("ambassador") || role.includes("ambassador")) &&
    (country.includes("liberia") ||
      title.includes("liberia") ||
      name.includes("thomas") ||
      name.includes("ambassador"))
  ) {
    return "liberia-ambassador";
  }

  if (
    country.includes("liberia") &&
    title.includes("president") &&
    !title.includes("ambassador")
  ) {
    return "liberia-president";
  }

  if (
    country.includes("china") &&
    title.includes("president") &&
    !title.includes("ambassador")
  ) {
    return "china-president";
  }

  return null;
}

/**
 * Ensure the three default global dignitary profiles exist.
 * Safe to call on booklet load — creates missing rows and upgrades placeholder
 * ambassador entries (wrong name / missing photo / empty bio).
 */
export async function ensureDefaultGlobalLeaders(): Promise<void> {
  const existing = await prisma.confLeaderProfile.findMany({
    where: { confId: null, isActive: true },
  });

  const byKind = new Map<
    (typeof DEFAULT_GLOBAL_LEADERS)[number]["kind"],
    (typeof existing)[number]
  >();

  for (const leader of existing) {
    const kind = classifyLeader(leader);
    if (kind && !byKind.has(kind)) {
      byKind.set(kind, leader);
    }
  }

  for (const def of DEFAULT_GLOBAL_LEADERS) {
    const match = byKind.get(def.kind);
    if (!match) {
      await prisma.confLeaderProfile.create({
        data: {
          confId: null,
          role: def.role,
          name: def.name,
          title: def.title,
          country: def.country,
          photoPath: def.photoPath,
          bio: def.bio,
          sortOrder: def.sortOrder,
          isActive: true,
        },
      });
      continue;
    }

    const needsUpgrade =
      def.kind === "liberia-ambassador" &&
      (normalizeLabel(match.name).includes("h.e. ambassador") ||
        normalizeLabel(match.name) === "ambassador" ||
        !match.photoPath ||
        !match.bio ||
        !normalizeLabel(match.title).includes("extraordinary"));

    const needsPhoto =
      !match.photoPath && Boolean(def.photoPath);

    if (needsUpgrade || needsPhoto) {
      await prisma.confLeaderProfile.update({
        where: { id: match.id },
        data: {
          role: def.role,
          name: def.name,
          title: def.title,
          country: def.country,
          photoPath: match.photoPath || def.photoPath,
          bio: match.bio || def.bio,
          sortOrder: def.sortOrder,
        },
      });
    }
  }
}
