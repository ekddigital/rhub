import { prisma } from "@/lib/prisma";

/** Booklet bio paraphrased from Liberian MOFA press coverage (June 2014). */
export const AMBASSADOR_THOMAS_BIO = [
  "His Excellency Dudley McKinley Thomas was commissioned on 25 June 2014 as Liberia's Ambassador Extraordinary and Plenipotentiary to the People's Republic of China, accredited near Beijing with a mandate to represent the Republic of Liberia and to advance the nation's interests in the PRC.",
  "A seasoned diplomat with more than sixteen years in Liberia's Foreign Service, Ambassador Thomas served with distinction for approximately ten years as Liberia's Ambassador near Paris, France, where he was recognized for productive state visits and strong representation of Liberia's interests in Europe. His prior service included appointment as Commercial Counselor in Brussels, Belgium.",
  "At his commissioning, Ambassador Thomas pledged to strengthen Liberia–China economic and political ties and to advance economic and development diplomacy throughout his tour of duty. He noted China's role as a global partner to Africa and to Liberia, and expressed commitment to deepening cooperation in support of Liberia's development goals and the enduring friendship between the two nations.",
].join("\n\n");

export const CHINA_PRESIDENT_XI_BIO =
  "His Excellency Xi Jinping serves as President of the People's Republic of China. Under his leadership, China continues to deepen friendship and practical cooperation with African nations, including Liberia, through education, development partnership, and people-to-people exchange.";

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
    bio: null,
    sortOrder: 1,
    kind: "liberia-president" as const,
  },
  {
    role: "H.E.",
    name: "Xi Jinping",
    title: "President of the People's Republic of China, General Secretary of the Communist Party of China, and Chairman of the Central Military Commission",
    country: "China",
    photoPath: "/conf/president_xi_China.png",
    bio: CHINA_PRESIDENT_XI_BIO,
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

function shouldRefreshSeedBio(
  match: { bio: string | null },
  def: (typeof DEFAULT_GLOBAL_LEADERS)[number],
): boolean {
  if (!def.bio) return false;
  if (!match.bio) return true;
  return match.bio.length < def.bio.length;
}

function shouldClearSeedBio(
  match: { bio: string | null },
  def: (typeof DEFAULT_GLOBAL_LEADERS)[number],
): boolean {
  return !def.bio && Boolean(match.bio?.trim());
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

    const needsPhoto = !match.photoPath && Boolean(def.photoPath);
    const needsBioRefresh = shouldRefreshSeedBio(match, def);
    const needsBioClear = shouldClearSeedBio(match, def);

    if (needsUpgrade || needsPhoto || needsBioRefresh || needsBioClear) {
      await prisma.confLeaderProfile.update({
        where: { id: match.id },
        data: {
          role: def.role,
          name: def.name,
          title: def.title,
          country: def.country,
          photoPath: match.photoPath || def.photoPath,
          bio: needsBioClear
            ? null
            : needsBioRefresh
              ? def.bio
              : match.bio || def.bio,
          sortOrder: def.sortOrder,
        },
      });
    }
  }
}
