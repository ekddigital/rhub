/**
 * Creative Kit — short slugs, same spirit as lib/doc/tools-config & tools/conf.
 * Hub: /tools/kit. Sub-routes use 3-letter style where it helps (fly, crt, …).
 */

export type KitSurfaceGroupId = "print" | "authoring" | "media" | "platform";

export const kitSurfaceGroupLabels: Record<KitSurfaceGroupId, string> = {
  print: "Print & events",
  authoring: "Authoring & documents",
  media: "Files & conversion",
  platform: "Platform & API",
};

export interface KitSurface {
  slug: string;
  title: string;
  description: string;
  href: string;
  /** Use in nav/menus when `href` is an API URL (e.g. lib surface). */
  navHref?: string;
  status: "live" | "beta" | "planned";
  /** Group for workspace sidebar navigation */
  group: KitSurfaceGroupId;
  /** Sort order within the group */
  order: number;
}

/** Surfaces: merge vendor creative + native rhub tools */
export const kitSurfaces: KitSurface[] = [
  {
    slug: "fly",
    title: "Flyers & layouts",
    description:
      "Conference flyer studio + imported flyer builder (org colors)",
    href: "/tools/kit?surface=fly",
    status: "live",
    group: "print",
    order: 10,
  },
  {
    slug: "bkt",
    title: "Booklet",
    description: "Multi-page conference booklet (print / PDF)",
    href: "/tools/conf/booklet",
    status: "live",
    group: "print",
    order: 20,
  },
  {
    slug: "bro",
    title: "Brochure",
    description: "Tri-fold and print surfaces (workspace growing)",
    href: "/tools/kit/bro",
    status: "planned",
    group: "print",
    order: 30,
  },
  {
    slug: "crt",
    title: "Certificates",
    description: "Issuance, templates, verify — creative stack (wiring)",
    href: "/tools/kit/crt",
    status: "planned",
    group: "print",
    order: 40,
  },
  {
    slug: "doc",
    title: "Authoring & letters",
    description:
      "Conference letters + document converters; brand doc studio (planned)",
    href: "/tools/conf/letters",
    status: "beta",
    group: "authoring",
    order: 10,
  },
  {
    slug: "cvt",
    title: "File conversion",
    description: "PDF / Word / HTML pipelines (existing doc & img tools)",
    href: "/tools/doc",
    status: "live",
    group: "media",
    order: 10,
  },
  {
    slug: "lib",
    title: "Brand kit & API",
    description:
      "OrganizationBrandKit tokens and JSON discovery for integrations",
    href: "/api/v1/kit",
    navHref: "/tools/kit",
    status: "beta",
    group: "platform",
    order: 10,
  },
];

export function surfacesByGroup(): Record<KitSurfaceGroupId, KitSurface[]> {
  const groups: Record<KitSurfaceGroupId, KitSurface[]> = {
    print: [],
    authoring: [],
    media: [],
    platform: [],
  };
  for (const s of kitSurfaces) {
    groups[s.group].push(s);
  }
  (Object.keys(groups) as KitSurfaceGroupId[]).forEach((g) => {
    groups[g].sort((a, b) => a.order - b.order);
  });
  return groups;
}

export function getKitSurfacesByStatus(
  status: KitSurface["status"],
): KitSurface[] {
  return kitSurfaces.filter((s) => s.status === status);
}
