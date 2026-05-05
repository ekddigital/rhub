"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Layers,
  LayoutGrid,
  Loader2,
  MousePointer2,
  Palette,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  Shapes,
  Sparkles,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UnifiedTemplateEntry } from "@/lib/kit/catalog-unified";
import {
  kitSurfaceGroupLabels,
  surfacesByGroup,
  type KitSurface,
  type KitSurfaceGroupId,
} from "@/lib/kit/tools-config";
import { FlyerStudioShell } from "@/components/tools/conf/flyer-studio-shell";

type Selection =
  | { kind: "surface"; slug: string }
  | { kind: "template"; id: string }
  | null;

type PageStub = { id: string; label: string };

const surfaceIconMap: Record<string, typeof BookOpen> = {
  bkt: BookOpen,
  bro: LayoutGrid,
  fly: Layers,
  doc: Type,
  cvt: LayoutGrid,
  crt: Sparkles,
  lib: Palette,
};

function catalogCategoryIcon(category: UnifiedTemplateEntry["category"]) {
  switch (category) {
    case "certificate":
      return Sparkles;
    case "flyer":
      return Layers;
    case "document":
    case "letter":
      return Type;
    case "brochure":
    case "booklet":
      return LayoutGrid;
    case "conversion":
      return Shapes;
    default:
      return Sparkles;
  }
}

function statusStyle(status: KitSurface["status"] | undefined) {
  if (status === "live")
    return "bg-emerald-500/15 text-emerald-800 ring-emerald-600/20 dark:text-emerald-300";
  if (status === "beta")
    return "bg-amber-500/15 text-amber-900 ring-amber-600/25 dark:text-amber-200";
  return "bg-muted text-muted-foreground ring-border";
}

function kindLabel(kind: UnifiedTemplateEntry["kind"]) {
  switch (kind) {
    case "catalog":
      return "Registry";
    case "merged":
      return "Registry + DB";
    case "studio_only":
      return "Studio";
    default:
      return kind;
  }
}

function WorkspaceFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading workspace…
    </div>
  );
}

export type KitCreativeWorkspaceProps = {
  unifiedEntries: UnifiedTemplateEntry[];
};

function KitCreativeWorkspaceInner({ unifiedEntries }: KitCreativeWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(100);
  /** Hide project sidebar for maximum flyer canvas width */
  const [flyerFocusLayout, setFlyerFocusLayout] = useState(true);
  const [pages, setPages] = useState<PageStub[]>([{ id: "p1", label: "Page 1" }]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const groupedSurfaces = useMemo(() => surfacesByGroup(), []);
  const groupOrder: KitSurfaceGroupId[] = [
    "print",
    "authoring",
    "media",
    "platform",
  ];

  const surfaceBySlug = useMemo(() => {
    const m = new Map<string, KitSurface>();
    for (const g of groupOrder) {
      for (const s of groupedSurfaces[g]) {
        m.set(s.slug, s);
      }
    }
    return m;
  }, [groupedSurfaces, groupOrder]);

  const templateById = useMemo(() => {
    const m = new Map<string, UnifiedTemplateEntry>();
    for (const t of unifiedEntries) {
      m.set(t.id, t);
    }
    return m;
  }, [unifiedEntries]);

  const [selection, setSelection] = useState<Selection>(null);

  useEffect(() => {
    const t = searchParams.get("template");
    const s = searchParams.get("surface");
    if (t && templateById.has(t)) {
      setSelection({ kind: "template", id: t });
      return;
    }
    if (s && surfaceBySlug.has(s)) {
      setSelection({ kind: "surface", slug: s });
      return;
    }
    setSelection(null);
  }, [searchParams, surfaceBySlug, templateById]);

  const syncUrl = useCallback(
    (next: Selection) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("surface");
      params.delete("template");
      if (next?.kind === "surface") params.set("surface", next.slug);
      if (next?.kind === "template") params.set("template", next.id);
      const q = params.toString();
      router.replace(q ? `/tools/kit?${q}` : "/tools/kit", { scroll: false });
    },
    [router, searchParams],
  );

  const selectSurface = (slug: string) => {
    const next: Selection = { kind: "surface", slug };
    setSelection(next);
    syncUrl(next);
  };

  const selectTemplate = (id: string) => {
    const next: Selection = { kind: "template", id };
    setSelection(next);
    syncUrl(next);
  };

  const q = search.trim().toLowerCase();
  const filteredSurfaces = useMemo(() => {
    if (!q) return null;
    const out: KitSurface[] = [];
    for (const g of groupOrder) {
      for (const s of groupedSurfaces[g]) {
        if (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
        ) {
          out.push(s);
        }
      }
    }
    return out;
  }, [groupedSurfaces, groupOrder, q]);

  const filteredTemplates = useMemo(() => {
    if (!q) return unifiedEntries;
    return unifiedEntries.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
  }, [unifiedEntries, q]);

  const selectedSurface: KitSurface | null =
    selection?.kind === "surface" ? surfaceBySlug.get(selection.slug) ?? null : null;
  const selectedTemplate: UnifiedTemplateEntry | null =
    selection?.kind === "template"
      ? templateById.get(selection.id) ?? null
      : null;

  /** Conference square flyer studio — full editor lives here, not on `/tools/conf/flyers`. */
  const embedConferenceFlyer =
    (selection?.kind === "surface" && selection.slug === "fly") ||
    (selection?.kind === "template" && selection.id === "conf-flyer-studio");

  useEffect(() => {
    if (!embedConferenceFlyer) setFlyerFocusLayout(false);
  }, [embedConferenceFlyer]);

  const canvasTitle =
    selectedTemplate?.title ??
    selectedSurface?.title ??
    "Select a project";

  const canvasSubtitle =
    selectedTemplate?.description ??
    selectedSurface?.description ??
    "Choose a surface or template from the left. Search narrows both lists. The full editor opens in its own workspace with your org brand kit.";

  const editorHref =
    selectedTemplate?.workspacePath ??
    (selectedSurface && !selectedSurface.href.startsWith("/api")
      ? selectedSurface.href
      : null);

  const isSelfHubLink =
    editorHref === "/tools/kit" || editorHref?.startsWith("/tools/kit?");

  /** Avoid sending users to another route when the editor is mounted in this column. */
  const outboundEditorHref =
    embedConferenceFlyer || isSelfHubLink ? null : editorHref;

  const addPage = () => {
    setPages((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        label: `Page ${prev.length + 1}`,
      },
    ]);
    setActivePageIndex((i) => i + 1);
  };

  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-lg backdrop-blur-sm lg:min-h-[calc(100vh-9rem)]",
        embedConferenceFlyer &&
          "rounded-none border-x-0 sm:rounded-2xl sm:border-x",
      )}
    >
      {/* App toolbar */}
      <header className="flex flex-col gap-3 border-b border-border/80 bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/25 text-secondary-foreground sm:flex">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
              Creative Kit · Design workspace
            </h1>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              {embedConferenceFlyer
                ? "Flyer studio — use Wider canvas to hide the list and enlarge the editor."
                : "Pick a job, edit with live preview in each tool, manage pages here (stub until the editor syncs)."}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surfaces and templates…"
            className="h-10 border-border/80 bg-background/80 pl-9 pr-3"
            aria-label="Search surfaces and templates"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/docs">Docs</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/api/v1/kit" target="_blank" rel="noopener noreferrer">
              API index
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex max-h-[40vh] flex-col border-b border-border/80 bg-muted/20 lg:max-h-none lg:shrink-0 lg:border-b-0 lg:border-r",
            embedConferenceFlyer &&
              (flyerFocusLayout
                ? "hidden"
                : "lg:w-[240px] xl:w-[260px]"),
            !embedConferenceFlyer && "lg:w-80",
          )}
        >
          <div className="border-b border-border/60 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Project types
            </p>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
            {q && filteredSurfaces && filteredSurfaces.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">
                No surfaces match “{search.trim()}”.
              </p>
            ) : null}
            {q && filteredSurfaces
              ? filteredSurfaces.map((s) => {
                  const Icon = surfaceIconMap[s.slug] ?? LayoutGrid;
                  const active =
                    selection?.kind === "surface" && selection.slug === s.slug;
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => selectSurface(s.slug)}
                      className={cn(
                        "mb-1 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-secondary/25 text-foreground ring-1 ring-secondary/40"
                          : "hover:bg-muted/80",
                      )}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">
                            {s.slug}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0 text-[9px] font-semibold uppercase ring-1",
                              statusStyle(s.status),
                            )}
                          >
                            {s.status}
                          </span>
                        </span>
                        <span className="line-clamp-2 font-medium">
                          {s.title}
                        </span>
                      </span>
                    </button>
                  );
                })
              : groupOrder.map((gid) => (
                  <div key={gid} className="mb-3">
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {kitSurfaceGroupLabels[gid]}
                    </p>
                    <ul className="space-y-0.5">
                      {groupedSurfaces[gid].map((s) => {
                        const Icon = surfaceIconMap[s.slug] ?? LayoutGrid;
                        const active =
                          selection?.kind === "surface" &&
                          selection.slug === s.slug;
                        return (
                          <li key={s.slug}>
                            <button
                              type="button"
                              onClick={() => selectSurface(s.slug)}
                              className={cn(
                                "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                active
                                  ? "bg-secondary/25 text-foreground ring-1 ring-secondary/40"
                                  : "hover:bg-muted/80",
                              )}
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                                    {s.slug}
                                  </span>
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0 text-[9px] font-semibold uppercase ring-1",
                                      statusStyle(s.status),
                                    )}
                                  >
                                    {s.status}
                                  </span>
                                </span>
                                <span className="line-clamp-2 font-medium leading-snug">
                                  {s.title}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Templates ({filteredTemplates.length})
              </p>
              <ul className="max-h-48 overflow-y-auto lg:max-h-[min(28rem,40vh)]">
                {filteredTemplates.map((t) => {
                  const CatIcon = catalogCategoryIcon(t.category);
                  const active =
                    selection?.kind === "template" && selection.id === t.id;
                  return (
                    <li key={`${t.kind}:${t.id}`}>
                      <button
                        type="button"
                        onClick={() => selectTemplate(t.id)}
                        className={cn(
                          "mb-0.5 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                          active
                            ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                            : "hover:bg-muted/80",
                        )}
                      >
                        <CatIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 font-medium">
                            {t.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {t.category} · {kindLabel(t.kind)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main workspace */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background/40">
          {/* Editor toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-card/50 px-2 py-1.5">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tools
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-foreground"
              title="Select"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Text (open full editor for rich text)"
              disabled
            >
              <Type className="h-4 w-4 opacity-50" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              asChild={Boolean(outboundEditorHref)}
              disabled={!outboundEditorHref}
              title={
                embedConferenceFlyer
                  ? "Hero image: use Visual design in the flyer panel (drop or choose file)"
                  : outboundEditorHref
                    ? "Open workspace for image uploads"
                    : "Pick a workspace that supports uploads"
              }
            >
              {outboundEditorHref ? (
                <Link href={outboundEditorHref}>
                  <ImagePlus className="h-4 w-4" />
                </Link>
              ) : (
                <span className="flex size-9 items-center justify-center">
                  <ImagePlus
                    className={cn(
                      "h-4 w-4",
                      !embedConferenceFlyer && "opacity-50",
                    )}
                  />
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Shapes — full editor"
              disabled
            >
              <Shapes className="h-4 w-4 opacity-50" />
            </Button>
            <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
            {embedConferenceFlyer ? (
              <Button
                type="button"
                variant={flyerFocusLayout ? "secondary" : "outline"}
                size="sm"
                className="h-8 gap-1 px-2 text-[11px]"
                onClick={() => setFlyerFocusLayout((v) => !v)}
                title={
                  flyerFocusLayout
                    ? "Show project list again"
                    : "Hide sidebar for a wider flyer editor"
                }
              >
                {flyerFocusLayout ? (
                  <PanelLeft className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                )}
                {flyerFocusLayout ? "Projects" : "Wider canvas"}
              </Button>
            ) : null}
            <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              disabled={embedConferenceFlyer}
              title={
                embedConferenceFlyer
                  ? "Zoom is disabled while the flyer studio is open (use the flyer preview)"
                  : "Zoom out"
              }
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-12 text-center text-[11px] tabular-nums text-muted-foreground">
              {embedConferenceFlyer ? "—" : `${zoom}%`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((z) => Math.min(160, z + 10))}
              disabled={embedConferenceFlyer}
              title={
                embedConferenceFlyer
                  ? "Zoom is disabled while the flyer studio is open (use the flyer preview)"
                  : "Zoom in"
              }
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas + inspector */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="flex min-h-[280px] min-w-0 flex-1 flex-col p-2 sm:p-3 lg:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Preview
                  </span>
                </div>
                {embedConferenceFlyer ? (
                  <p className="hidden max-w-md text-right text-[10px] leading-snug text-muted-foreground sm:block lg:max-w-lg">
                    Controls and export are in the panel beside the preview.
                    Use{" "}
                    <span className="font-medium text-foreground">
                      Wider canvas
                    </span>{" "}
                    above for full width.
                  </p>
                ) : outboundEditorHref ? (
                  <Button size="sm" className="gap-1.5" asChild>
                    <Link href={outboundEditorHref}>
                      Open full editor
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled>
                    Open full editor
                  </Button>
                )}
              </div>

              <div
                className={cn(
                  "flex min-h-0 flex-1 overflow-auto rounded-xl border border-dashed border-border/80 bg-muted/15",
                  embedConferenceFlyer
                    ? "border-border/50 bg-muted/10 p-1 sm:p-2"
                    : "items-center justify-center p-4",
                )}
              >
                {embedConferenceFlyer ? (
                  <div
                    id="flyer-studio-embed"
                    className="h-full min-h-[calc(100dvh-11rem)] w-full min-w-0 lg:min-h-[calc(100dvh-9rem)]"
                  >
                    <FlyerStudioShell embedded />
                  </div>
                ) : (
                  <div
                    className="flex aspect-3/4 w-full max-w-lg flex-col rounded-lg border border-border/90 bg-card shadow-xl ring-1 ring-black/5 dark:ring-white/10"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
                      <p className="text-xs font-semibold text-foreground">
                        {canvasTitle}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {canvasSubtitle}
                      </p>
                    </div>
                    <div className="relative flex flex-1 flex-col items-center justify-center gap-3 bg-linear-to-b from-background to-muted/30 p-6 text-center">
                      <div className="grid h-32 w-32 grid-cols-2 gap-2 opacity-30">
                        <div className="rounded-md bg-secondary/40" />
                        <div className="rounded-md bg-secondary/25" />
                        <div className="rounded-md bg-secondary/25" />
                        <div className="rounded-md bg-muted" />
                      </div>
                      <p className="max-w-xs text-xs text-muted-foreground">
                        Live canvas comes from each editor (flyers, letters,
                        booklet…). Use{" "}
                        <strong className="text-foreground">
                          Open full editor
                        </strong>{" "}
                        for pixel-accurate work, uploads, and exports.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Page strip — flyer studio uses template modes instead */}
              {!embedConferenceFlyer ? (
                <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Pages
                  </span>
                  <div className="flex flex-1 items-center gap-1 overflow-x-auto pb-1">
                    {pages.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePageIndex(i)}
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                          i === activePageIndex
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/80 bg-background/80 text-muted-foreground hover:bg-muted/60",
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1 px-2 text-[11px]"
                      onClick={addPage}
                      title="Add page (workspace stub — editors own real pages)"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                  <div className="hidden items-center gap-0.5 sm:flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={activePageIndex <= 0}
                      onClick={() =>
                        setActivePageIndex((i) => Math.max(0, i - 1))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={activePageIndex >= pages.length - 1}
                      onClick={() =>
                        setActivePageIndex((i) =>
                          Math.min(pages.length - 1, i + 1),
                        )
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Inspector — hidden for embedded flyer; the editor is self-contained */}
            {!embedConferenceFlyer ? (
            <aside className="w-full border-t border-border/80 bg-muted/15 p-4 lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Properties
              </h2>
              {selectedTemplate ? (
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedTemplate.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase">
                      {selectedTemplate.category}
                    </span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
                      {kindLabel(selectedTemplate.kind)}
                    </span>
                  </div>
                  {selectedTemplate.outputs.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Outputs: {selectedTemplate.outputs.join(", ")}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    {selectedTemplate.workspacePath ? (
                      <Button size="sm" asChild>
                        <Link href={selectedTemplate.workspacePath}>
                          Edit in workspace
                        </Link>
                      </Button>
                    ) : null}
                    {selectedTemplate.studioTemplateId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/api/v1/kit/studio-templates/${selectedTemplate.studioTemplateId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Studio template (JSON)
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                  {!selectedTemplate.workspacePath ? (
                    <p className="text-[11px] text-muted-foreground">
                      No direct workspace route yet — use the matching surface
                      or implement this template in the editor.
                    </p>
                  ) : null}
                </div>
              ) : selectedSurface ? (
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedSurface.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedSurface.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase ring-1",
                      statusStyle(selectedSurface.status),
                    )}
                  >
                    {selectedSurface.status}
                  </span>
                  <div className="flex flex-col gap-2">
                    {selectedSurface.href.startsWith("/api") ? (
                      <>
                        <Button size="sm" asChild>
                          <Link
                            href={selectedSurface.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open API
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/docs">Documentation</Link>
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" asChild>
                        <Link href={selectedSurface.href}>
                          Open workspace
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Select a project type or template. Search helps when the list
                  is long. Full WYSIWYG editing, uploads, and exports live in
                  each dedicated tool — this hub orients you and links there.
                </p>
              )}
            </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full Creative Kit workspace: toolbar, grouped sidebar, preview, pages, inspector. */
export function KitCreativeWorkspace(props: KitCreativeWorkspaceProps) {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <KitCreativeWorkspaceInner {...props} />
    </Suspense>
  );
}
