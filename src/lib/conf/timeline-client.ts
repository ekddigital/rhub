import { INITIAL_TIMELINE as DEFAULT_TIMELINE } from "@/lib/conf/timeline-defaults";

export type TimelineItem = {
  id: string;
  dbId: string | null;
  title: string;
  description: string;
  date: string;
  category: string;
  owner: string;
  isCritical: boolean;
  isCompleted: boolean;
};

export type TimelineDbRecord = {
  id: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
  date: string;
  category?: string | null;
  responsibleLead?: string | null;
  isCritical?: boolean | null;
  isCompleted?: boolean | null;
};

export const CATEGORY_COLORS: Record<string, string> = {
  governance: "bg-indigo-500",
  finance: "bg-emerald-500",
  registration: "bg-cyan-500",
  logistics: "bg-amber-500",
  program: "bg-violet-500",
  event: "bg-emerald-500",
  "post-event": "bg-slate-500",
};

export const CATEGORY_LABELS: Record<string, string> = {
  governance: "Governance",
  finance: "Finance",
  registration: "Registration",
  logistics: "Logistics",
  program: "Program",
  event: "Conference Days",
  "post-event": "Post Event",
};

// Legacy key (pre DB-sync). Used only for one-time migration.
export const TIMELINE_STORAGE_KEY = "conf-timeline-roadmap-v2";
export const TIMELINE_DB_CACHE_KEY = "conf-timeline-db-cache-v1";
export const TIMELINE_LEGACY_MIGRATED_KEY = "conf-timeline-legacy-migrated-v1";

export function createInitialTimelineItems(): TimelineItem[] {
  return DEFAULT_TIMELINE.map((item) => ({
    ...item,
    dbId: null,
  }));
}

export function normalizeTimelineDate(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.includes("T") ? value.split("T")[0] : value;
}

export function toUiTimelineItem(db: TimelineDbRecord): TimelineItem {
  return {
    id: db.clientId ?? db.id,
    dbId: db.id,
    title: db.title,
    description: db.description ?? "",
    date: normalizeTimelineDate(db.date),
    category: db.category ?? "governance",
    owner: db.responsibleLead ?? "Unassigned",
    isCritical: Boolean(db.isCritical),
    isCompleted: Boolean(db.isCompleted),
  };
}

export function sortTimelineItems(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

export type TimelineStats = {
  completed: number;
  progress: number;
  overdueOpen: number;
  dueSoon: number;
  criticalOpen: number;
};

export function getTimelineStats(
  items: TimelineItem[],
  now = new Date(),
): TimelineStats {
  const completed = items.filter((item) => item.isCompleted).length;
  const progress =
    items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const next14 = new Date(today);
  next14.setDate(next14.getDate() + 14);

  const overdueOpen = items.filter((item) => {
    if (item.isCompleted) return false;
    const due = new Date(item.date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const dueSoon = items.filter((item) => {
    if (item.isCompleted) return false;
    const due = new Date(item.date);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= next14;
  }).length;

  const criticalOpen = items.filter(
    (item) => item.isCritical && !item.isCompleted,
  ).length;

  return { completed, progress, overdueOpen, dueSoon, criticalOpen };
}
