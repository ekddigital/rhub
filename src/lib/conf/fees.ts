export type ConferenceFeePackage = {
  id: string;
  category: string;
  label: string;
  packageSummary: string;
  price: number;
  isOptionalAddOn?: boolean;
};

export const CONFERENCE_FEE_PACKAGES: ConferenceFeePackage[] = [
  {
    id: "member-shared",
    category: "Member in Good Standing",
    label: "Shared Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 250,
  },
  {
    id: "member-single",
    category: "Member in Good Standing",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 600,
  },
  {
    id: "member-no-accommodation",
    category: "Member in Good Standing",
    label: "No Accommodation",
    packageSummary:
      "Feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 175,
  },
  {
    id: "member-guest-shared",
    category: "Member in Good Standing + Guest",
    label: "Shared Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 750,
  },
  {
    id: "member-guest-no-accommodation",
    category: "Member in Good Standing + Guest",
    label: "No Accommodation",
    packageSummary:
      "Feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 400,
  },
  {
    id: "non-good-standing-shared",
    category: "Non-Good Standing Members",
    label: "Shared Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 775,
  },
  {
    id: "non-good-standing-single",
    category: "Non-Good Standing Members",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 900,
  },
  {
    id: "non-good-standing-no-accommodation",
    category: "Non-Good Standing Members",
    label: "No Accommodation",
    packageSummary:
      "Feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 500,
  },
  {
    id: "partnering-org-single",
    category: "Partnering Organizations Guests",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 500,
  },
  {
    id: "guest-social-events",
    category: "Guests",
    label: "Social Events Only",
    packageSummary:
      "Pool party ticket, achievers awards night and dinner ticket (single event ticket 200 RMB, feedings included)",
    price: 400,
  },
  {
    id: "member-march-intake",
    category: "Member in Good Standing",
    label: "March Intake",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 330,
  },
  {
    id: "veteran-single",
    category: "Veteran",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, conference shirt, pool party ticket, achievers awards night and dinner ticket, VVIP table",
    price: 1000,
  },
  {
    id: "veteran-guest",
    category: "Veteran",
    label: "Guest Package",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, conference shirt, pool party ticket, achievers awards night and dinner ticket, VVIP table of 4",
    price: 3000,
  },
  {
    id: "conference-jersey",
    category: "Conference Jersey",
    label: "Conference Jersey",
    packageSummary:
      "RMB 60.00 per set. Each set is one jersey — choose male or female when entering details below.",
    price: 60,
    isOptionalAddOn: true,
  },
  {
    id: "achievers-platinum",
    category: "Achievers Award Dinner & Ms. LSUIC Pageant Patrons",
    label: "Platinum Table of 8",
    packageSummary: "Free flow drinks and food through the night",
    price: 700,
    isOptionalAddOn: true,
  },
  {
    id: "achievers-gold",
    category: "Achievers Award Dinner & Ms. LSUIC Pageant Patrons",
    label: "Gold Table of 5",
    packageSummary: "Free flow drinks and food through the night",
    price: 450,
    isOptionalAddOn: true,
  },
  {
    id: "achievers-vip",
    category: "Achievers Award Dinner & Ms. LSUIC Pageant Patrons",
    label: "VIP Table of 4",
    packageSummary: "Free flow drinks and food through the night",
    price: 350,
    isOptionalAddOn: true,
  },
];

export function getConferenceFeePackageById(packageId: string) {
  return CONFERENCE_FEE_PACKAGES.find((item) => item.id === packageId) ?? null;
}

export function getConferenceFeePackageByPrice(price: number) {
  return CONFERENCE_FEE_PACKAGES.find((item) => item.price === price) ?? null;
}

export function getConferenceFeeAccommodationMode(
  packageId: string | null | undefined,
): "PAIR" | "SINGLE" | "NONE" | null {
  if (!packageId) return null;
  const pkg = getConferenceFeePackageById(packageId);
  if (!pkg) return null;

  const label = pkg.label.toLowerCase();
  const category = pkg.category.toLowerCase();

  if (label.includes("single room")) return "SINGLE";
  if (label.includes("shared room")) return "PAIR";
  if (label.includes("no accommodation")) return "NONE";
  if (label.includes("social events only")) return "NONE";
  if (category.includes("conference jersey")) return "NONE";
  if (category.includes("achievers award dinner")) return "NONE";
  if (label.includes("table")) return "NONE";

  return null;
}

export function isConferenceOptionalAddOnPackage(
  packageId: string | null | undefined,
): boolean {
  if (!packageId) return false;
  const pkg = getConferenceFeePackageById(packageId);
  return Boolean(pkg?.isOptionalAddOn);
}

export function getConferenceRequiredFeePackages() {
  return CONFERENCE_FEE_PACKAGES.filter((item) => !item.isOptionalAddOn);
}

export function getConferenceOptionalAddOnPackages() {
  return CONFERENCE_FEE_PACKAGES.filter((item) => item.isOptionalAddOn);
}

/** Optional add-on id for conference jersey — quantity is encoded by repeating this id (one jersey per set). */
export const CONFERENCE_JERSEY_PACKAGE_ID = "conference-jersey";

/** Upper bound on jerseys per registration (abuse / typo guard). */
export const MAX_CONFERENCE_JERSEY_SETS = 20;

export function countConferenceJerseySets(packageIds: string[]): number {
  return packageIds.filter((id) => id === CONFERENCE_JERSEY_PACKAGE_ID).length;
}

/**
 * Normalizes optional add-on ids: achievers tables etc. stay unique;
 * `conference-jersey` may appear multiple times (one per set ordered).
 */
export function normalizeConferenceOptionalAddOnPackageIds(
  packageIds: unknown,
): string[] {
  if (!Array.isArray(packageIds)) return [];
  const jerseySlots: string[] = [];
  const seenNonJersey = new Set<string>();
  const othersOrdered: string[] = [];

  for (const value of packageIds) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (!id || !isConferenceOptionalAddOnPackage(id)) continue;
    if (id === CONFERENCE_JERSEY_PACKAGE_ID) {
      jerseySlots.push(id);
      continue;
    }
    if (seenNonJersey.has(id)) continue;
    seenNonJersey.add(id);
    othersOrdered.push(id);
  }

  const jerseys = jerseySlots.slice(0, MAX_CONFERENCE_JERSEY_SETS);
  return [...othersOrdered, ...jerseys];
}

/** Human-readable list for emails/admin (collapses duplicate jersey ids). */
export function formatConferenceOptionalAddOnsSummary(
  packageIds: string[],
): string {
  if (!packageIds.length) return "None";
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const id of packageIds) {
    if (!counts.has(id)) order.push(id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return order
    .map((id) => {
      const pkg = getConferenceFeePackageById(id);
      const label = pkg?.label ?? id;
      const n = counts.get(id) ?? 1;
      return n > 1 ? `${label} × ${n}` : label;
    })
    .join(", ");
}

export function sumConferenceOptionalAddOns(packageIds: string[]): number {
  return packageIds.reduce((sum, packageId) => {
    const pkg = getConferenceFeePackageById(packageId);
    if (!pkg || !pkg.isOptionalAddOn) return sum;
    return sum + pkg.price;
  }, 0);
}

export function groupConferenceFeePackages() {
  return CONFERENCE_FEE_PACKAGES.reduce<Record<string, ConferenceFeePackage[]>>(
    (acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    },
    {},
  );
}

export function formatFeeRmb(amount: number): string {
  return `RMB ${amount.toFixed(2)}`;
}
