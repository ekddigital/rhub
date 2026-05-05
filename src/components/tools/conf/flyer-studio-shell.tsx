"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  ExternalLink,
  GripHorizontal,
  Images,
  Loader2,
  Megaphone,
  QrCode,
  RefreshCcw,
  Save,
  Square,
  Timer,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/creative/ui/dropdown-menu";
import { fetchDefaultConference } from "@/lib/conf/client";
import { CONF_2026 } from "@/lib/conf/config";
import { daysUntilDate } from "@/lib/conf/dates";
import { cn } from "@/lib/utils";

type FlyerMode = "promo" | "signup" | "countdown";

type PromoFlyer = {
  /** Shown in preview header (was fixed org name) */
  orgName: string;
  headerTagline: string;
  bannerLocation: string;
  bannerSchedule: string;
  conferenceTag: string;
  title: string;
  subtitle: string;
  highlights: string[];
  cta: string;
  footer: string;
  website: string;
  motto: string;
};

type SignupFlyer = {
  orgName: string;
  headerTagline: string;
  bannerLocation: string;
  bannerSchedule: string;
  conferenceTag: string;
  title: string;
  subtitle: string;
  steps: string[];
  signupLink: string;
  paymentInstruction: string;
  verificationNote: string;
  footer: string;
  website: string;
  motto: string;
};

export type FlyerVisualTheme = {
  /** Main brand panels (headers, outer crop) */
  primaryBg: string;
  /** Footer / thin banner bands */
  deepBand: string;
  accent: string;
  /** Light content stack background */
  contentBg: string;
  textOnDark: string;
  textOnLight: string;
  /** Promo / signup hero title */
  titleFontPx: number;
  /** Scales supporting text (px applied on flyer root) */
  baseFontPx: number;
  /** Optional — replaces default stock hero photo for current template */
  customHeroImage: string | null;
  /** 0–1 opacity of hero photo */
  heroPhotoOpacity: number;
  /** 0–1 strength of dark gradient over hero */
  heroOverlayStrength: number;
  /** Hero image focal X / Y for object-position (0–100) */
  heroFocalXPct: number;
  heroFocalYPct: number;
  /** Zoom hero inside its band */
  heroImageScale: number;
  /** Nudge headline block on hero (% of band size) */
  heroTextNudgeXPct: number;
  heroTextNudgeYPct: number;
  /** Promo: hero band height as % of total flyer */
  promoHeroHeightPct: number;
  /** Signup: hero band height % */
  signupHeroHeightPct: number;
};

export type FlyerCanvasTextLayer = {
  id: string;
  kind: "text";
  xPct: number;
  yPct: number;
  widthPct: number;
  /** Bounding height as % of artboard (text scrolls inside when needed). */
  heightPct: number;
  rotationDeg: number;
  zIndex: number;
  text: string;
  fontSizePx: number;
  color: string;
  fontWeight: number;
  textAlign: "left" | "center" | "right";
};

export type FlyerCanvasShapeLayer = {
  id: string;
  kind: "rect" | "ellipse";
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  rotationDeg: number;
  zIndex: number;
  fill: string;
  stroke: string;
  strokeWidthPx: number;
  opacity: number;
};

export type FlyerCanvasLayer = FlyerCanvasTextLayer | FlyerCanvasShapeLayer;

export type FlyerStudioState = {
  mode: FlyerMode;
  promo: PromoFlyer;
  signup: SignupFlyer;
  theme: FlyerVisualTheme;
  /** Freeform layers drawn above the template (Creative Kit canvas mode). */
  canvasLayers: FlyerCanvasLayer[];
};

type ExportFormat = "png" | "svg";

const LOCAL_STORAGE_KEY = "conf-flyer-studio-v3";
const LEGACY_STORAGE_KEY = "conf-flyer-studio-v2";

const DEFAULT_THEME: FlyerVisualTheme = {
  primaryBg: "#0B1E78",
  deepBand: "#071B4D",
  accent: "#C8A061",
  contentBg: "#F0F5FF",
  textOnDark: "#ffffff",
  textOnLight: "#0B1E78",
  titleFontPx: 32,
  baseFontPx: 10,
  customHeroImage: null,
  heroPhotoOpacity: 1,
  heroOverlayStrength: 1,
  heroFocalXPct: 50,
  heroFocalYPct: 50,
  heroImageScale: 1,
  heroTextNudgeXPct: 0,
  heroTextNudgeYPct: 0,
  promoHeroHeightPct: 26,
  signupHeroHeightPct: 20,
};

const DELEGATE_FLYER_REFERENCE =
  "Delegate card generator palette (red/white/blue): C8102E, 0B1E78, 0B4FD9";

const UNION_NAME = "Liberian Student Union in China";

const KIT_FLYER_ASSET_PROJECT = "rhub-kit-flyer";
const HERO_DATA_URL_UPLOAD_THRESHOLD = 320_000;

type BuiltinVisualAsset = {
  label: string;
  url: string;
  kind: "photo" | "vector";
};

/** Curated backgrounds — mix of on-site SVGs and CDN photos for generic events. */
const BUILTIN_VISUAL_ASSETS: BuiltinVisualAsset[] = [
  {
    label: "Liberia seal (SVG)",
    url: "/conf/liberia-seal.svg",
    kind: "vector",
  },
  {
    label: "Delegate placeholder (SVG)",
    url: "/conf/placeholder-delegate.svg",
    kind: "vector",
  },
  {
    label: "Abstract light",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80",
    kind: "photo",
  },
  {
    label: "Conference hall",
    url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1080&q=80",
    kind: "photo",
  },
  {
    label: "Outdoor crowd",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1080&q=80",
    kind: "photo",
  },
];

const DEFAULT_STATE: FlyerStudioState = {
  mode: "promo",
  theme: { ...DEFAULT_THEME },
  canvasLayers: [],
  promo: {
    orgName: UNION_NAME,
    headerTagline: `LSUIC · ${CONF_2026.year}`,
    bannerLocation: `${CONF_2026.city.toUpperCase()}, ${CONF_2026.province.toUpperCase()}`,
    bannerSchedule: `JULY ${new Date(CONF_2026.startsAt).getUTCDate()}–${new Date(CONF_2026.endsAt).getUTCDate()}, ${new Date(CONF_2026.endsAt).getUTCFullYear()}`,
    conferenceTag: `${CONF_2026.shortLabel} Conference | ${CONF_2026.city}`,
    title: CONF_2026.theme,
    subtitle: CONF_2026.subTheme,
    highlights: [
      "Pool Party and Recreation",
      "Achievers Awards Night",
      "Welcome and Meet-and-Greet Party",
      "Roommate Choice Option",
    ],
    cta: "Signup flyer will be released immediately after confirmation hearing.",
    footer: "LSUIC Conference Committee",
    website: "https://www.lsuic.org",
    motto: "Excellence Through Hard Work",
  },
  signup: {
    orgName: UNION_NAME,
    headerTagline: "2026 National Conference",
    bannerLocation: "DELEGATE REGISTRATION",
    bannerSchedule: `${CONF_2026.city.toUpperCase()} · ${new Date(CONF_2026.startsAt).toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase()} ${new Date(CONF_2026.endsAt).getUTCFullYear()}`,
    conferenceTag: `${CONF_2026.shortLabel} Delegate Registration`,
    title: "Signup Is Open",
    subtitle: `${CONF_2026.theme} · Fee: RMB ${CONF_2026.delegateFee}`,
    steps: [
      "Complete delegate signup form",
      "Pay conference fee using Financial Secretary channel",
      "Wait for payment verification approval",
    ],
    signupLink: "https://rhub.ekddigital.com/tools/conf/delegates/register",
    paymentInstruction: "Scan payment QR provided by Financial Secretary",
    verificationNote:
      "Only delegates with verified payment are marked complete in the system.",
    footer: `${CONF_2026.shortLabel} | Register early and secure your place`,
    website: "https://www.lsuic.org",
    motto: "Excellence Through Hard Work",
  },
};

/** Neutral starter — not tied to a single organization. */
const GENERIC_EVENT_STATE: FlyerStudioState = {
  mode: "promo",
  theme: { ...DEFAULT_THEME },
  canvasLayers: [],
  promo: {
    orgName: "Your organization",
    headerTagline: "Annual conference",
    bannerLocation: "YOUR CITY",
    bannerSchedule: "DATES TBD",
    conferenceTag: "Annual conference · Your city",
    title: "Your event headline",
    subtitle: "Tagline, theme, or date range",
    highlights: [
      "Keynotes and workshops",
      "Networking and community",
      "Celebration and awards",
    ],
    cta: "Registration details coming soon",
    footer: "Events committee",
    website: "https://example.org",
    motto: "Your motto",
  },
  signup: {
    orgName: "Your organization",
    headerTagline: "Registration",
    bannerLocation: "DELEGATE REGISTRATION",
    bannerSchedule: "Opens soon · city & month here",
    conferenceTag: "Delegate registration",
    title: "Registration is open",
    subtitle: "Fees, venue, and dates — customize in the form",
    steps: [
      "Complete the signup form",
      "Pay per organizer instructions",
      "Await verification",
    ],
    signupLink: "https://example.org/register",
    paymentInstruction: "Treasurer / finance channel",
    verificationNote:
      "Only verified registrations receive full delegate access.",
    footer: "Questions? Contact the events team",
    website: "https://example.org",
    motto: "Your motto",
  },
};

function coerceTheme(value: unknown): FlyerVisualTheme {
  if (!value || typeof value !== "object") return { ...DEFAULT_THEME };
  const t = value as Partial<FlyerVisualTheme>;
  return {
    ...DEFAULT_THEME,
    ...t,
    primaryBg: typeof t.primaryBg === "string" ? t.primaryBg : DEFAULT_THEME.primaryBg,
    deepBand: typeof t.deepBand === "string" ? t.deepBand : DEFAULT_THEME.deepBand,
    accent: typeof t.accent === "string" ? t.accent : DEFAULT_THEME.accent,
    contentBg: typeof t.contentBg === "string" ? t.contentBg : DEFAULT_THEME.contentBg,
    textOnDark: typeof t.textOnDark === "string" ? t.textOnDark : DEFAULT_THEME.textOnDark,
    textOnLight: typeof t.textOnLight === "string" ? t.textOnLight : DEFAULT_THEME.textOnLight,
    titleFontPx:
      typeof t.titleFontPx === "number" && t.titleFontPx >= 20 && t.titleFontPx <= 52
        ? t.titleFontPx
        : DEFAULT_THEME.titleFontPx,
    baseFontPx:
      typeof t.baseFontPx === "number" && t.baseFontPx >= 7 && t.baseFontPx <= 14
        ? t.baseFontPx
        : DEFAULT_THEME.baseFontPx,
    customHeroImage:
      typeof t.customHeroImage === "string" ? t.customHeroImage : null,
    heroPhotoOpacity:
      typeof t.heroPhotoOpacity === "number"
        ? Math.min(1, Math.max(0.05, t.heroPhotoOpacity))
        : DEFAULT_THEME.heroPhotoOpacity,
    heroOverlayStrength:
      typeof t.heroOverlayStrength === "number"
        ? Math.min(1, Math.max(0, t.heroOverlayStrength))
        : DEFAULT_THEME.heroOverlayStrength,
    heroFocalXPct:
      typeof t.heroFocalXPct === "number"
        ? Math.min(100, Math.max(0, t.heroFocalXPct))
        : DEFAULT_THEME.heroFocalXPct,
    heroFocalYPct:
      typeof t.heroFocalYPct === "number"
        ? Math.min(100, Math.max(0, t.heroFocalYPct))
        : DEFAULT_THEME.heroFocalYPct,
    heroImageScale:
      typeof t.heroImageScale === "number"
        ? Math.min(1.45, Math.max(0.85, t.heroImageScale))
        : DEFAULT_THEME.heroImageScale,
    heroTextNudgeXPct:
      typeof t.heroTextNudgeXPct === "number"
        ? Math.min(22, Math.max(-22, t.heroTextNudgeXPct))
        : DEFAULT_THEME.heroTextNudgeXPct,
    heroTextNudgeYPct:
      typeof t.heroTextNudgeYPct === "number"
        ? Math.min(18, Math.max(-18, t.heroTextNudgeYPct))
        : DEFAULT_THEME.heroTextNudgeYPct,
    promoHeroHeightPct:
      typeof t.promoHeroHeightPct === "number"
        ? Math.min(42, Math.max(16, t.promoHeroHeightPct))
        : DEFAULT_THEME.promoHeroHeightPct,
    signupHeroHeightPct:
      typeof t.signupHeroHeightPct === "number"
        ? Math.min(36, Math.max(12, t.signupHeroHeightPct))
        : DEFAULT_THEME.signupHeroHeightPct,
  };
}

function newCanvasLayerId(): string {
  return `ly_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function clampNum(v: unknown, min: number, max: number, fallback: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function coerceCanvasLayers(value: unknown): FlyerCanvasLayer[] {
  if (!Array.isArray(value)) return [];
  const out: FlyerCanvasLayer[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : newCanvasLayerId();
    const kind = o.kind;
    const zIndex = typeof o.zIndex === "number" ? o.zIndex : out.length;
    const rotationDeg =
      typeof o.rotationDeg === "number"
        ? Math.max(-180, Math.min(180, o.rotationDeg))
        : 0;
    if (kind === "text") {
      out.push({
        id,
        kind: "text",
        xPct: clampNum(o.xPct, 0, 100, 10),
        yPct: clampNum(o.yPct, 0, 100, 10),
        widthPct: clampNum(o.widthPct, 8, 100, 40),
        heightPct: clampNum(o.heightPct, 6, 100, 18),
        rotationDeg,
        zIndex,
        text: typeof o.text === "string" ? o.text : "Text",
        fontSizePx: clampNum(o.fontSizePx, 8, 120, 18),
        color: typeof o.color === "string" ? o.color : "#0B1E78",
        fontWeight: clampNum(o.fontWeight, 100, 900, 600),
        textAlign:
          o.textAlign === "center" || o.textAlign === "right"
            ? o.textAlign
            : "left",
      });
    } else if (kind === "rect" || kind === "ellipse") {
      out.push({
        id,
        kind,
        xPct: clampNum(o.xPct, 0, 100, 20),
        yPct: clampNum(o.yPct, 0, 100, 20),
        widthPct: clampNum(o.widthPct, 2, 100, 25),
        heightPct: clampNum(o.heightPct, 2, 100, 12),
        rotationDeg,
        zIndex,
        fill: typeof o.fill === "string" ? o.fill : "#C8A061",
        stroke: typeof o.stroke === "string" ? o.stroke : "#071B4D",
        strokeWidthPx: clampNum(o.strokeWidthPx, 0, 20, 1),
        opacity: clampNum(o.opacity, 0.05, 1, 0.4),
      });
    }
  }
  return out;
}

function coerceState(value: unknown): FlyerStudioState {
  if (!value || typeof value !== "object") return DEFAULT_STATE;

  const raw = value as Partial<FlyerStudioState>;
  const rawPromo = (raw.promo ?? {}) as Partial<PromoFlyer>;
  const rawSignup = (raw.signup ?? {}) as Partial<SignupFlyer>;

  const promoHighlights = Array.isArray(rawPromo.highlights)
    ? normalizeListInput(rawPromo.highlights.join("\n"))
    : DEFAULT_STATE.promo.highlights;

  const signupSteps = Array.isArray(rawSignup.steps)
    ? normalizeListInput(rawSignup.steps.join("\n"))
    : DEFAULT_STATE.signup.steps;

  return {
    mode: (["promo", "signup", "countdown"] as FlyerMode[]).includes(
      raw.mode as FlyerMode,
    )
      ? (raw.mode as FlyerMode)
      : "promo",
    theme: coerceTheme(raw.theme),
    canvasLayers: coerceCanvasLayers(
      (raw as Partial<FlyerStudioState>).canvasLayers,
    ),
    promo: {
      ...DEFAULT_STATE.promo,
      ...rawPromo,
      orgName:
        typeof rawPromo.orgName === "string"
          ? rawPromo.orgName
          : DEFAULT_STATE.promo.orgName,
      headerTagline:
        typeof rawPromo.headerTagline === "string"
          ? rawPromo.headerTagline
          : DEFAULT_STATE.promo.headerTagline,
      bannerLocation:
        typeof rawPromo.bannerLocation === "string"
          ? rawPromo.bannerLocation
          : DEFAULT_STATE.promo.bannerLocation,
      bannerSchedule:
        typeof rawPromo.bannerSchedule === "string"
          ? rawPromo.bannerSchedule
          : DEFAULT_STATE.promo.bannerSchedule,
      highlights: promoHighlights,
      website: rawPromo.website || DEFAULT_STATE.promo.website,
      motto: rawPromo.motto || DEFAULT_STATE.promo.motto,
    },
    signup: {
      ...DEFAULT_STATE.signup,
      ...rawSignup,
      orgName:
        typeof rawSignup.orgName === "string"
          ? rawSignup.orgName
          : DEFAULT_STATE.signup.orgName,
      headerTagline:
        typeof rawSignup.headerTagline === "string"
          ? rawSignup.headerTagline
          : DEFAULT_STATE.signup.headerTagline,
      bannerLocation:
        typeof rawSignup.bannerLocation === "string"
          ? rawSignup.bannerLocation
          : DEFAULT_STATE.signup.bannerLocation,
      bannerSchedule:
        typeof rawSignup.bannerSchedule === "string"
          ? rawSignup.bannerSchedule
          : DEFAULT_STATE.signup.bannerSchedule,
      steps: signupSteps,
      website: rawSignup.website || DEFAULT_STATE.signup.website,
      motto: rawSignup.motto || DEFAULT_STATE.signup.motto,
    },
  };
}

function normalizeListInput(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTextAreaValue(items: string[]): string {
  return items.join("\n");
}

function downloadJson(payload: FlyerStudioState) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lsuic-flyer-studio-config.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function pickAssetUrl(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const u =
    o.url ??
    o.public_url ??
    o.publicUrl ??
    o.download_url ??
    o.downloadUrl;
  return typeof u === "string" ? u : null;
}

async function uploadBlobAsKitAsset(
  blob: Blob,
  fileName: string,
): Promise<string | null> {
  const form = new FormData();
  form.append("file", blob, fileName);
  form.append("project_name", KIT_FLYER_ASSET_PROJECT);
  form.append("source", "kit.flyer.hero");
  const res = await fetch("/api/v1/kit/assets/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    url?: string;
    public_url?: string;
  };
  return j.url ?? j.public_url ?? null;
}

type CloudSyncLabel =
  | "idle"
  | "synced"
  | "saving"
  | "local"
  | "auth"
  | "schema";

export type FlyerStudioShellProps = {
  /** Render inside Creative Kit without “back to conference” chrome */
  embedded?: boolean;
};

export function FlyerStudioShell({ embedded = false }: FlyerStudioShellProps = {}) {
  const [state, setState] = useState<FlyerStudioState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null,
  );
  const [confId, setConfId] = useState("");
  const [downloadingCountdown, setDownloadingCountdown] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);
  const heroImportRef = useRef<HTMLInputElement | null>(null);
  const kitAssetUploadRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cloudSync, setCloudSync] = useState<CloudSyncLabel>("idle");
  const [kitUserAssets, setKitUserAssets] = useState<string[]>([]);
  const [kitAssetsLoading, setKitAssetsLoading] = useState(false);
  const [selectedCanvasLayerId, setSelectedCanvasLayerId] = useState<
    string | null
  >(null);

  const loadKitAssets = useCallback(async () => {
    setKitAssetsLoading(true);
    try {
      const res = await fetch(
        `/api/v1/kit/assets?project_name=${encodeURIComponent(KIT_FLYER_ASSET_PROJECT)}&size=48`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setKitUserAssets([]);
        return;
      }
      const j = (await res.json()) as { assets?: unknown[] };
      const urls = (j.assets ?? [])
        .map((item) => pickAssetUrl(item))
        .filter((u): u is string => Boolean(u));
      setKitUserAssets(urls);
    } catch {
      setKitUserAssets([]);
    } finally {
      setKitAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDefaultConference()
      .then((c) => setConfId(c.id))
      .catch(() => {});

    let cancelled = false;
    (async () => {
      let localRaw: string | null = null;
      try {
        localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localRaw) {
          const leg = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (leg) {
            localStorage.setItem(LOCAL_STORAGE_KEY, leg);
            localRaw = leg;
          }
        }
      } catch {
        localRaw = null;
      }

      const fromLocal = localRaw
        ? coerceState(JSON.parse(localRaw) as unknown)
        : DEFAULT_STATE;

      let fromRemote: FlyerStudioState | null = null;
      let sync: CloudSyncLabel = localRaw ? "local" : "idle";

      try {
        const res = await fetch("/api/v1/kit/flyer-document", {
          credentials: "include",
        });
        if (res.status === 401) {
          sync = "auth";
        } else if (res.status === 503) {
          sync = "schema";
        } else if (res.ok) {
          const j = (await res.json()) as {
            saved?: boolean;
            definition?: unknown;
          };
          if (j.saved && j.definition) {
            fromRemote = coerceState(j.definition);
            sync = "synced";
          } else {
            sync = "local";
          }
        } else {
          sync = "local";
        }
      } catch {
        sync = "local";
      }

      if (cancelled) return;

      const next = fromRemote ?? fromLocal;
      setState(next);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      setCloudSync(sync);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loaded) void loadKitAssets();
  }, [loaded, loadKitAssets]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void (async () => {
        setCloudSync((s) => (s === "schema" || s === "auth" ? s : "saving"));
        try {
          const res = await fetch("/api/v1/kit/flyer-document", {
            method: "PUT",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ definition: state }),
          });
          if (res.status === 401) {
            setCloudSync("auth");
            return;
          }
          if (res.status === 503) {
            setCloudSync("schema");
            return;
          }
          if (res.ok) {
            setCloudSync("synced");
            return;
          }
          if (res.status === 413) {
            try {
              const j = (await res.json()) as { error?: string };
              setSaveNotice(
                j.error ??
                  "Document too large — upload images via the asset library instead of embedding huge files.",
              );
            } catch {
              setSaveNotice(
                "Document too large — use smaller images or Kit asset uploads.",
              );
            }
          }
          setCloudSync("local");
        } catch {
          setCloudSync("local");
        }
      })();
    }, 1800);

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [state, loaded]);

  const promoHighlightsValue = useMemo(
    () => toTextAreaValue(state.promo.highlights),
    [state.promo.highlights],
  );

  const signupStepsValue = useMemo(
    () => toTextAreaValue(state.signup.steps),
    [state.signup.steps],
  );

  const setMode = (mode: FlyerMode) => {
    setState((prev) => ({ ...prev, mode }));
    setSelectedCanvasLayerId(null);
  };

  const resetDefaults = () => {
    setState(DEFAULT_STATE);
    setSelectedCanvasLayerId(null);
    setSaveNotice("Reset to LSUIC-style defaults (still your choice — switch to generic anytime).");
  };

  const loadGenericTemplate = () => {
    setState(GENERIC_EVENT_STATE);
    setSelectedCanvasLayerId(null);
    setSaveNotice(
      "Loaded a neutral event template — edit headers, colors, and hero for any organization.",
    );
  };

  const saveNow = async () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    setCloudSync("saving");
    try {
      const res = await fetch("/api/v1/kit/flyer-document", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definition: state }),
      });
      if (res.status === 401) {
        setCloudSync("auth");
        setSaveNotice(
          "Saved locally. Sign in to sync this flyer to the database.",
        );
        return;
      }
      if (res.status === 503) {
        setCloudSync("schema");
        setSaveNotice(
          "Saved locally. Run `npx prisma db push` (or migrations) so CreativeTemplate exists for cloud sync.",
        );
        return;
      }
      if (!res.ok) {
        setCloudSync("local");
        setSaveNotice("Saved locally. Cloud save failed — try again.");
        return;
      }
      setCloudSync("synced");
      setSaveNotice("Saved to the cloud and in this browser.");
    } catch {
      setCloudSync("local");
      setSaveNotice("Saved locally. Network error while syncing.");
    }
  };

  const exportConfig = () => {
    downloadJson(state);
    setSaveNotice("Configuration exported to JSON.");
  };

  const exportPreviewAs = async (format: ExportFormat) => {
    if (state.mode === "countdown") {
      await downloadCountdownPng();
      return;
    }

    // Signup flyer: use server-side SVG→PNG for crisp, font-correct output
    if (state.mode === "signup" && format === "png") {
      if (!confId) {
        setSaveNotice("Conference not loaded yet.");
        return;
      }
      try {
        setExportingFormat("png");
        const res = await fetch(`/api/conf/${confId}/signup-flyer`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: state.signup, download: true }),
        });
        if (!res.ok) throw new Error("Server error");
        const blob = await res.blob();
        const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lsuic-signup-flyer-${ts}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSaveNotice("Signup flyer downloaded as PNG.");
      } catch {
        setSaveNotice("Download failed. Please try again.");
      } finally {
        setExportingFormat(null);
      }
      return;
    }

    if (!previewRef.current || !loaded) {
      setSaveNotice("Preview is not ready yet. Please try again in a moment.");
      return;
    }

    try {
      setExportingFormat(format);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[T:]/g, "-");
      const fileName = `lsuic-${state.mode}-flyer-${timestamp}.${format}`;
      const { toPng, toSvg } = await import("html-to-image");

      if (format === "png") {
        const dataUrl = await toPng(previewRef.current, {
          backgroundColor: "#FFFFFF",
          pixelRatio: 3,
          cacheBust: true,
          style: { borderRadius: "0", overflow: "hidden" },
        });
        downloadDataUrl(dataUrl, fileName);
      } else {
        const dataUrl = await toSvg(previewRef.current, {
          backgroundColor: "#FFFFFF",
          cacheBust: true,
        });
        downloadDataUrl(dataUrl, fileName);
      }

      setSaveNotice(`Flyer exported as ${format.toUpperCase()}.`);
    } catch {
      setSaveNotice(
        `Could not export ${format.toUpperCase()}. Please try again.`,
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const importConfig = async (file: File | null) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      setState(coerceState(parsed));
      setSelectedCanvasLayerId(null);
      setSaveNotice("Configuration imported successfully.");
    } catch {
      setSaveNotice("Could not import file. Use a valid flyer JSON export.");
    }
  };

  const applyHeroUrl = (
    url: string,
    notice = "Hero image updated — shown in preview.",
  ) => {
    setState((prev) => ({
      ...prev,
      theme: { ...prev.theme, customHeroImage: url },
    }));
    setSaveNotice(notice);
  };

  const applyHeroDataUrl = async (dataUrl: string) => {
    let url = dataUrl;
    if (
      dataUrl.startsWith("data:") &&
      dataUrl.length > HERO_DATA_URL_UPLOAD_THRESHOLD
    ) {
      setSaveNotice("Uploading large image to your Kit asset library…");
      try {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const uploaded = await uploadBlobAsKitAsset(blob, "flyer-hero.png");
        if (!uploaded) {
          setSaveNotice(
            "Upload failed (sign in?). Try a smaller file or pick from the library.",
          );
          return;
        }
        url = uploaded;
        void loadKitAssets();
      } catch {
        setSaveNotice("Could not process image for upload.");
        return;
      }
    }
    applyHeroUrl(url);
  };

  const onHeroFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    void (async () => {
      setSaveNotice("Uploading to Kit assets…");
      const uploaded = await uploadBlobAsKitAsset(
        file,
        file.name || "flyer-hero.png",
      );
      if (uploaded) {
        applyHeroUrl(
          uploaded,
          "Hero set from file — stored in your Kit asset project.",
        );
        void loadKitAssets();
        return;
      }
      setSaveNotice("Cloud upload unavailable — using local preview (data URL).");
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          void applyHeroDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    })();
  };

  const onHeroDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    onHeroFile(f ?? null);
  };

  const startPrint = () => {
    window.print();
  };

  // Download countdown via fetch → blob (works cross-browser, no CORS issues)
  const downloadCountdownPng = async () => {
    if (!confId) {
      setSaveNotice("Conference not loaded yet.");
      return;
    }
    setDownloadingCountdown(true);
    try {
      const res = await fetch(`/api/conf/${confId}/countdown-flyer?format=png`);
      if (!res.ok) throw new Error("Server error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lsuic-2026-countdown-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveNotice("Countdown flyer downloaded as PNG.");
    } catch {
      setSaveNotice("Download failed. Please try again.");
    } finally {
      setDownloadingCountdown(false);
    }
  };

  useEffect(() => {
    if (!embedded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCanvasLayerId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedded]);

  const addCanvasTextLayer = useCallback(() => {
    const id = newCanvasLayerId();
    setState((p) => {
      const z = p.canvasLayers.reduce((m, l) => Math.max(m, l.zIndex), -1);
      return {
        ...p,
        canvasLayers: [
          ...p.canvasLayers,
          {
            id,
            kind: "text",
            xPct: 12,
            yPct: 58,
            widthPct: 76,
            heightPct: 22,
            rotationDeg: 0,
            zIndex: z + 1,
            text: "New text — double-click to edit",
            fontSizePx: Math.max(14, Math.round(p.theme.baseFontPx * 1.6)),
            color: p.theme.textOnLight,
            fontWeight: 600,
            textAlign: "left",
          },
        ],
      };
    });
    setSelectedCanvasLayerId(id);
  }, []);

  const addCanvasShapeLayer = useCallback((kind: "rect" | "ellipse") => {
    const id = newCanvasLayerId();
    setState((p) => {
      const z = p.canvasLayers.reduce((m, l) => Math.max(m, l.zIndex), -1);
      return {
        ...p,
        canvasLayers: [
          ...p.canvasLayers,
          {
            id,
            kind,
            xPct: 30,
            yPct: 40,
            widthPct: 40,
            heightPct: 14,
            rotationDeg: 0,
            zIndex: z + 1,
            fill: p.theme.accent,
            stroke: p.theme.deepBand,
            strokeWidthPx: 2,
            opacity: 0.35,
          },
        ],
      };
    });
    setSelectedCanvasLayerId(id);
  }, []);

  const patchCanvasLayer = useCallback(
    (id: string, patch: Partial<FlyerCanvasLayer>) => {
      setState((p) => ({
        ...p,
        canvasLayers: p.canvasLayers.map((ly) =>
          ly.id === id ? ({ ...ly, ...patch } as FlyerCanvasLayer) : ly,
        ),
      }));
    },
    [],
  );

  const deleteCanvasLayer = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      canvasLayers: p.canvasLayers.filter((ly) => ly.id !== id),
    }));
    setSelectedCanvasLayerId((cur) => (cur === id ? null : cur));
  }, []);

  const bumpCanvasLayerZ = useCallback((id: string, dir: 1 | -1) => {
    setState((p) => {
      const sorted = [...p.canvasLayers].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx < 0) return p;
      const j = idx + dir;
      if (j < 0 || j >= sorted.length) return p;
      const zi = sorted[idx].zIndex;
      const zj = sorted[j].zIndex;
      return {
        ...p,
        canvasLayers: p.canvasLayers.map((ly) => {
          if (ly.id === sorted[idx].id) return { ...ly, zIndex: zj };
          if (ly.id === sorted[j].id) return { ...ly, zIndex: zi };
          return ly;
        }),
      };
    });
  }, []);

  const selectedCanvasLayer = useMemo(
    () =>
      state.canvasLayers.find((l) => l.id === selectedCanvasLayerId) ?? null,
    [state.canvasLayers, selectedCanvasLayerId],
  );

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 py-6"}>
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => void importConfig(e.target.files?.[0] || null)}
      />
      {!embedded ? (
        <div className="flex items-center gap-4">
          <Link href="/tools/conf">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Flyer Studio</h1>
            <p className="text-sm text-muted-foreground">
              Square 1080×1080 format — ready for WhatsApp, WeChat, and social
              media. Includes live countdown flyer download.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Editable Anytime
          </Badge>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Flyer studio
              </p>
              <p className="text-xs text-muted-foreground">
                Edit text on the artboard, add draggable layers, and tune the
                hero in the side panel. Press Esc to deselect a layer.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="gap-1"
                  >
                    <Download className="size-3.5" />
                    Export &amp; file
                    <ChevronDown className="size-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Save</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => void saveNow()}>
                    <Save className="size-4" />
                    Save to device &amp; cloud
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Export artboard</DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={!loaded || exportingFormat !== null}
                    onClick={() => void exportPreviewAs("png")}
                  >
                    <Download className="size-4" />
                    PNG (1080×1080)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!loaded || exportingFormat !== null}
                    onClick={() => void exportPreviewAs("svg")}
                  >
                    <Download className="size-4" />
                    SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={startPrint}>
                    Print / PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Config</DropdownMenuLabel>
                  <DropdownMenuItem onClick={exportConfig}>
                    <Download className="size-4" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importRef.current?.click()}>
                    Import JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Templates</DropdownMenuLabel>
                  <DropdownMenuItem onClick={loadGenericTemplate}>
                    Generic event starter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={resetDefaults}>
                    <RefreshCcw className="size-4" />
                    Reset LSUIC-style defaults
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
                {cloudSync === "synced" ? (
                  <>
                    <Cloud className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Synced
                    </span>
                  </>
                ) : cloudSync === "saving" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving…</span>
                  </>
                ) : cloudSync === "auth" ? (
                  <>
                    <CloudOff className="size-3.5 text-amber-600" />
                    <span className="text-amber-800 dark:text-amber-200">
                      Sign in to sync
                    </span>
                  </>
                ) : cloudSync === "schema" ? (
                  <>
                    <CloudOff className="size-3.5 text-destructive" />
                    <span className="text-destructive">DB not ready</span>
                  </>
                ) : (
                  <>
                    <Cloud className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Draft</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {saveNotice && (
        <div className="rounded-lg border border-[#0B1E78]/35 bg-[#0B4FD9]/10 px-3 py-2 text-sm text-foreground">
          {saveNotice}
        </div>
      )}

      <div
        className={
          embedded
            ? "grid min-h-0 grid-cols-1 content-start gap-4 overflow-y-auto pb-2 lg:max-h-[calc(100dvh-7rem)] lg:grid-cols-[minmax(240px,22%)_minmax(0,1fr)] lg:gap-6 lg:overflow-y-auto lg:pr-1 xl:grid-cols-[minmax(260px,20%)_1fr] 2xl:gap-8"
            : "grid gap-6 xl:grid-cols-[1.05fr_1fr]"
        }
      >
        <Card className={embedded ? "min-w-0 shadow-sm" : undefined}>
          <CardHeader>
            <CardTitle className="text-base">
              {state.mode === "countdown"
                ? "Countdown Flyer"
                : "Flyer Controls"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={state.mode === "promo" ? "default" : "outline"}
                  onClick={() => setMode("promo")}
                >
                  <Megaphone className="size-4" />
                  Promo
                </Button>
                <Button
                  type="button"
                  variant={state.mode === "signup" ? "default" : "outline"}
                  onClick={() => setMode("signup")}
                >
                  <QrCode className="size-4" />
                  Signup
                </Button>
                <Button
                  type="button"
                  variant={state.mode === "countdown" ? "default" : "outline"}
                  onClick={() => setMode("countdown")}
                  className={
                    state.mode === "countdown"
                      ? "bg-[#C8A061] hover:bg-[#B8904F] text-white border-transparent"
                      : ""
                  }
                >
                  <Timer className="size-4" />
                  Countdown
                </Button>
              </div>
            </div>

            {state.mode === "countdown" ? (
              /* ── Countdown controls ── */
              <div className="space-y-4">
                <div className="rounded-xl border border-[#C8A061]/30 bg-[#182e5f]/5 p-4 text-center">
                  <p className="text-5xl font-black text-[#182e5f]">
                    {daysUntilConf()}
                  </p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Days Remaining
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Auto-calculated from July 24, 2026. Updates daily — no
                    manual editing needed.
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border p-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    About this flyer
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    <li>
                      1080 × 1080 square PNG — WhatsApp, WeChat, Telegram ready
                    </li>
                    <li>
                      Branded with LSUIC logo, Jinan cityscape, and gold accents
                    </li>
                    <li>Share daily to build conference excitement</li>
                    <li>
                      Download a fresh copy each day for the updated number
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    disabled={downloadingCountdown || !confId}
                    onClick={() => void downloadCountdownPng()}
                    className="w-full gap-2 bg-[#C8A061] text-white hover:bg-[#B8904F]"
                  >
                    <Download className="size-4" />
                    {downloadingCountdown
                      ? "Downloading…"
                      : "Download PNG (1080×1080)"}
                  </Button>
                  {confId && (
                    <a
                      href={`/api/conf/${confId}/countdown-flyer`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <ExternalLink className="size-4" />
                      Preview SVG in browser tab
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-4 shrink-0" />
                  Conference: July {new Date(CONF_2026.startsAt).getUTCDate()}–
                  {new Date(CONF_2026.endsAt).getUTCDate()},{" "}
                  {new Date(CONF_2026.endsAt).getUTCFullYear()} · Arcadia Hotel,{" "}
                  {CONF_2026.city}
                </div>
              </div>
            ) : (
              /* ── Promo / Signup controls ── */
              <>
                <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    Visual design
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Live preview updates as you change colors, type sizes, or hero
                    photo (drag & drop or file pick).
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Primary background</Label>
                      <Input
                        type="color"
                        className="h-9 w-full cursor-pointer border-border p-1"
                        value={state.theme.primaryBg}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: { ...p.theme, primaryBg: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Accent</Label>
                      <Input
                        type="color"
                        className="h-9 w-full cursor-pointer border-border p-1"
                        value={state.theme.accent}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: { ...p.theme, accent: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Banner / footer band</Label>
                      <Input
                        type="color"
                        className="h-9 w-full cursor-pointer border-border p-1"
                        value={state.theme.deepBand}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: { ...p.theme, deepBand: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Content panel</Label>
                      <Input
                        type="color"
                        className="h-9 w-full cursor-pointer border-border p-1"
                        value={state.theme.contentBg}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: { ...p.theme, contentBg: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Text on dark</Label>
                      <Input
                        type="color"
                        className="h-9 w-full cursor-pointer border-border p-1"
                        value={state.theme.textOnDark}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: { ...p.theme, textOnDark: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Text on light</Label>
                      <Input
                        type="color"
                        className="h-9 w-full cursor-pointer border-border p-1"
                        value={state.theme.textOnLight}
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: { ...p.theme, textOnLight: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Title size ({state.theme.titleFontPx}px)
                      </Label>
                      <input
                        type="range"
                        min={20}
                        max={48}
                        value={state.theme.titleFontPx}
                        className="w-full accent-primary"
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              titleFontPx: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Body scale ({state.theme.baseFontPx}px)
                      </Label>
                      <input
                        type="range"
                        min={7}
                        max={14}
                        value={state.theme.baseFontPx}
                        className="w-full accent-primary"
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              baseFontPx: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Hero photo opacity (
                        {Math.round(state.theme.heroPhotoOpacity * 100)}%)
                      </Label>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={Math.round(state.theme.heroPhotoOpacity * 100)}
                        className="w-full accent-primary"
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              heroPhotoOpacity:
                                Number(e.target.value) / 100,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Hero overlay strength (
                        {Math.round(state.theme.heroOverlayStrength * 100)}%)
                      </Label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(
                          state.theme.heroOverlayStrength * 100,
                        )}
                        className="w-full accent-primary"
                        onChange={(e) =>
                          setState((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              heroOverlayStrength:
                                Number(e.target.value) / 100,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        Layout (canvas-style)
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Reposition the photo focal point and zoom. Resize the hero
                        band. In Creative Kit, drag the headline area on the
                        preview to nudge text; sliders fine-tune.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Photo focal left→right ({state.theme.heroFocalXPct}%)
                        </Label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={state.theme.heroFocalXPct}
                          className="w-full accent-primary"
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              theme: {
                                ...p.theme,
                                heroFocalXPct: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Photo focal top→bottom ({state.theme.heroFocalYPct}%)
                        </Label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={state.theme.heroFocalYPct}
                          className="w-full accent-primary"
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              theme: {
                                ...p.theme,
                                heroFocalYPct: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Hero zoom (
                          {Math.round(state.theme.heroImageScale * 100)}%)
                        </Label>
                        <input
                          type="range"
                          min={85}
                          max={140}
                          value={Math.round(state.theme.heroImageScale * 100)}
                          className="w-full accent-primary"
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              theme: {
                                ...p.theme,
                                heroImageScale: Number(e.target.value) / 100,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Hero band height (
                          {state.mode === "signup"
                            ? state.theme.signupHeroHeightPct
                            : state.theme.promoHeroHeightPct}
                          % of flyer)
                        </Label>
                        <input
                          type="range"
                          min={state.mode === "signup" ? 12 : 16}
                          max={state.mode === "signup" ? 34 : 40}
                          value={
                            state.mode === "signup"
                              ? state.theme.signupHeroHeightPct
                              : state.theme.promoHeroHeightPct
                          }
                          className="w-full accent-primary"
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setState((p) => {
                              const key =
                                p.mode === "signup"
                                  ? "signupHeroHeightPct"
                                  : "promoHeroHeightPct";
                              return {
                                ...p,
                                theme: { ...p.theme, [key]: v },
                              };
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Headline nudge ↔ ({state.theme.heroTextNudgeXPct.toFixed(0)}%)
                        </Label>
                        <input
                          type="range"
                          min={-22}
                          max={22}
                          value={state.theme.heroTextNudgeXPct}
                          className="w-full accent-primary"
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              theme: {
                                ...p.theme,
                                heroTextNudgeXPct: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Headline nudge ↕ ({state.theme.heroTextNudgeYPct.toFixed(0)}%)
                        </Label>
                        <input
                          type="range"
                          min={-18}
                          max={18}
                          value={state.theme.heroTextNudgeYPct}
                          className="w-full accent-primary"
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              theme: {
                                ...p.theme,
                                heroTextNudgeYPct: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className="rounded-md border-2 border-dashed border-border/80 bg-background/60 p-3 text-center text-xs text-muted-foreground transition-colors hover:border-secondary/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onHeroDrop}
                  >
                    <p className="font-medium text-foreground">
                      Hero background image
                    </p>
                    <p className="mt-1">
                      Drag an image here or choose a file. Clears to stock photo
                      when removed.
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => heroImportRef.current?.click()}
                      >
                        Choose image
                      </Button>
                      {state.theme.customHeroImage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setState((p) => ({
                              ...p,
                              theme: {
                                ...p.theme,
                                customHeroImage: null,
                              },
                            }))
                          }
                        >
                          Use stock hero
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    ref={heroImportRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      onHeroFile(e.target.files?.[0] ?? null)
                    }
                  />

                  <div className="space-y-2 rounded-md border border-border/70 bg-background/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        <Images className="mr-1 inline size-3.5 align-text-bottom opacity-80" />
                        Visual library
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => void loadKitAssets()}
                          disabled={kitAssetsLoading}
                        >
                          {kitAssetsLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          Refresh
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => kitAssetUploadRef.current?.click()}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Stock art and your uploads (project{" "}
                      <span className="font-mono">{KIT_FLYER_ASSET_PROJECT}</span>
                      ). Click a tile to use it as the hero background.
                    </p>
                    <input
                      ref={kitAssetUploadRef}
                      type="file"
                      accept="image/*,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        onHeroFile(f);
                      }}
                    />
                    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto overscroll-contain py-0.5">
                      {BUILTIN_VISUAL_ASSETS.map((a) => (
                        <button
                          key={a.url}
                          type="button"
                          onClick={() =>
                            applyHeroUrl(
                              a.url,
                              `${a.kind === "vector" ? "Vector" : "Photo"} applied as hero.`,
                            )
                          }
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border transition hover:ring-primary"
                          title={a.label}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.url}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                      {kitUserAssets.map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() =>
                            applyHeroUrl(
                              url,
                              "Hero from your Kit asset library.",
                            )
                          }
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border transition hover:ring-primary"
                          title="Your upload"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {embedded ? (
                  <div className="space-y-3 rounded-lg border border-border/80 bg-card/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Artboard layers
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      <strong>Text:</strong> hover the layer, then drag from the
                      thin bar at the top (grip icon).{" "}
                      <strong>Shapes:</strong> drag the fill to move, or hover for
                      a floating grip. <strong>Corners</strong> resize.{" "}
                      <strong>Double-click</strong> text to edit.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="gap-1"
                        onClick={addCanvasTextLayer}
                      >
                        <Type className="size-3.5" />
                        Text
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => addCanvasShapeLayer("rect")}
                      >
                        <Square className="size-3.5" />
                        Rectangle
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => addCanvasShapeLayer("ellipse")}
                      >
                        <span className="inline-flex size-3.5 items-center justify-center rounded-full border border-current" />
                        Ellipse
                      </Button>
                    </div>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {[...state.canvasLayers]
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((ly) => (
                          <li key={ly.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedCanvasLayerId(ly.id)}
                              className={cn(
                                "flex w-full items-center justify-between rounded border px-2 py-1 text-left transition-colors",
                                selectedCanvasLayerId === ly.id
                                  ? "border-primary bg-primary/10"
                                  : "border-transparent bg-muted/40 hover:bg-muted/70",
                              )}
                            >
                              <span className="truncate">
                                {ly.kind === "text"
                                  ? ly.text.slice(0, 28) +
                                    (ly.text.length > 28 ? "…" : "")
                                  : ly.kind === "rect"
                                    ? "Rectangle"
                                    : "Ellipse"}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                z{ly.zIndex}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                    {selectedCanvasLayer ? (
                      <div className="space-y-2 rounded-md border border-border/70 bg-background/60 p-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            title="Move backward"
                            onClick={() =>
                              selectedCanvasLayer &&
                              bumpCanvasLayerZ(selectedCanvasLayer.id, -1)
                            }
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            title="Move forward"
                            onClick={() =>
                              selectedCanvasLayer &&
                              bumpCanvasLayerZ(selectedCanvasLayer.id, 1)
                            }
                          >
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="ml-auto gap-1"
                            onClick={() =>
                              selectedCanvasLayer &&
                              deleteCanvasLayer(selectedCanvasLayer.id)
                            }
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </Button>
                        </div>
                        {selectedCanvasLayer.kind === "text" ? (
                          <>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-[11px]">Size (px)</Label>
                                <Input
                                  type="number"
                                  min={8}
                                  max={120}
                                  value={selectedCanvasLayer.fontSizePx}
                                  onChange={(e) =>
                                    patchCanvasLayer(selectedCanvasLayer.id, {
                                      fontSizePx: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px]">Color</Label>
                                <Input
                                  type="color"
                                  className="h-9 cursor-pointer border-border p-1"
                                  value={selectedCanvasLayer.color}
                                  onChange={(e) =>
                                    patchCanvasLayer(selectedCanvasLayer.id, {
                                      color: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Align</Label>
                              <div className="flex gap-2">
                                {(
                                  ["left", "center", "right"] as const
                                ).map((a) => (
                                  <Button
                                    key={a}
                                    type="button"
                                    size="sm"
                                    variant={
                                      selectedCanvasLayer.textAlign === a
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      patchCanvasLayer(selectedCanvasLayer.id, {
                                        textAlign: a,
                                      })
                                    }
                                  >
                                    {a}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Width %</Label>
                              <input
                                type="range"
                                min={12}
                                max={100}
                                value={selectedCanvasLayer.widthPct}
                                className="w-full accent-primary"
                                onChange={(e) =>
                                  patchCanvasLayer(selectedCanvasLayer.id, {
                                    widthPct: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Height %</Label>
                              <input
                                type="range"
                                min={6}
                                max={80}
                                value={selectedCanvasLayer.heightPct}
                                className="w-full accent-primary"
                                onChange={(e) =>
                                  patchCanvasLayer(selectedCanvasLayer.id, {
                                    heightPct: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-[11px]">Fill</Label>
                                <Input
                                  type="color"
                                  className="h-9 cursor-pointer border-border p-1"
                                  value={selectedCanvasLayer.fill}
                                  onChange={(e) =>
                                    patchCanvasLayer(selectedCanvasLayer.id, {
                                      fill: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px]">Stroke</Label>
                                <Input
                                  type="color"
                                  className="h-9 cursor-pointer border-border p-1"
                                  value={selectedCanvasLayer.stroke}
                                  onChange={(e) =>
                                    patchCanvasLayer(selectedCanvasLayer.id, {
                                      stroke: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Opacity</Label>
                              <input
                                type="range"
                                min={5}
                                max={100}
                                value={Math.round(
                                  selectedCanvasLayer.opacity * 100,
                                )}
                                className="w-full accent-primary"
                                onChange={(e) =>
                                  patchCanvasLayer(selectedCanvasLayer.id, {
                                    opacity: Number(e.target.value) / 100,
                                  })
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[11px]">W %</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  max={100}
                                  value={selectedCanvasLayer.widthPct}
                                  onChange={(e) =>
                                    patchCanvasLayer(selectedCanvasLayer.id, {
                                      widthPct: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[11px]">H %</Label>
                                <Input
                                  type="number"
                                  min={2}
                                  max={100}
                                  value={selectedCanvasLayer.heightPct}
                                  onChange={(e) =>
                                    patchCanvasLayer(selectedCanvasLayer.id, {
                                      heightPct: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {!embedded ? (
                <>
                  {state.mode === "promo" ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Header — organization</Label>
                        <Input
                          value={state.promo.orgName}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              promo: {
                                ...prev.promo,
                                orgName: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Header — tagline</Label>
                        <Input
                          value={state.promo.headerTagline}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              promo: {
                                ...prev.promo,
                                headerTagline: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Banner — location line</Label>
                        <Input
                          value={state.promo.bannerLocation}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              promo: {
                                ...prev.promo,
                                bannerLocation: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Banner — date / schedule line</Label>
                        <Input
                          value={state.promo.bannerSchedule}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              promo: {
                                ...prev.promo,
                                bannerSchedule: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Conference Tag</Label>
                      <Input
                        value={state.promo.conferenceTag}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: {
                              ...prev.promo,
                              conferenceTag: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={state.promo.title}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: { ...prev.promo, title: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subtitle</Label>
                      <Input
                        value={state.promo.subtitle}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: { ...prev.promo, subtitle: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Highlights (one per line)</Label>
                      <Textarea
                        rows={5}
                        value={promoHighlightsValue}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: {
                              ...prev.promo,
                              highlights: normalizeListInput(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Call To Action</Label>
                      <Textarea
                        rows={2}
                        value={state.promo.cta}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: { ...prev.promo, cta: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Footer</Label>
                      <Input
                        value={state.promo.footer}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: { ...prev.promo, footer: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Website</Label>
                      <Input
                        value={state.promo.website}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: { ...prev.promo, website: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Motto</Label>
                      <Input
                        value={state.promo.motto}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            promo: { ...prev.promo, motto: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Header — organization</Label>
                        <Input
                          value={state.signup.orgName}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              signup: {
                                ...prev.signup,
                                orgName: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Header — tagline</Label>
                        <Input
                          value={state.signup.headerTagline}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              signup: {
                                ...prev.signup,
                                headerTagline: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Banner — emphasis line</Label>
                        <Input
                          value={state.signup.bannerLocation}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              signup: {
                                ...prev.signup,
                                bannerLocation: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Banner — detail line</Label>
                        <Input
                          value={state.signup.bannerSchedule}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              signup: {
                                ...prev.signup,
                                bannerSchedule: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Conference Tag</Label>
                      <Input
                        value={state.signup.conferenceTag}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: {
                              ...prev.signup,
                              conferenceTag: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input
                        value={state.signup.title}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: { ...prev.signup, title: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subtitle</Label>
                      <Input
                        value={state.signup.subtitle}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: {
                              ...prev.signup,
                              subtitle: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Registration Steps (one per line)</Label>
                      <Textarea
                        rows={4}
                        value={signupStepsValue}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: {
                              ...prev.signup,
                              steps: normalizeListInput(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Signup Link</Label>
                      <Input
                        value={state.signup.signupLink}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: {
                              ...prev.signup,
                              signupLink: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Payment Instruction</Label>
                      <Input
                        value={state.signup.paymentInstruction}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: {
                              ...prev.signup,
                              paymentInstruction: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Verification Note</Label>
                      <Textarea
                        rows={2}
                        value={state.signup.verificationNote}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: {
                              ...prev.signup,
                              verificationNote: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Footer</Label>
                      <Input
                        value={state.signup.footer}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: { ...prev.signup, footer: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Website</Label>
                      <Input
                        value={state.signup.website}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: { ...prev.signup, website: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Motto</Label>
                      <Input
                        value={state.signup.motto}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            signup: { ...prev.signup, motto: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={saveNow}
                  >
                    <Save className="size-4" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadGenericTemplate}
                  >
                    Generic event
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetDefaults}
                  >
                    <RefreshCcw className="size-4" />
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportConfig}
                  >
                    <Download className="size-4" />
                    Export Config JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!loaded || exportingFormat !== null}
                    onClick={() => void exportPreviewAs("png")}
                  >
                    <Download className="size-4" />
                    {exportingFormat === "png"
                      ? "Exporting PNG..."
                      : "Export PNG"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!loaded || exportingFormat !== null}
                    onClick={() => void exportPreviewAs("svg")}
                  >
                    <Download className="size-4" />
                    {exportingFormat === "svg"
                      ? "Exporting SVG..."
                      : "Export SVG"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => importRef.current?.click()}
                  >
                    Import JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startPrint}
                  >
                    Print / PDF
                  </Button>
                </div>
              </>
            ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className={
            embedded ? "min-w-0 shadow-sm lg:sticky lg:top-0 lg:self-start" : undefined
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Live Preview —{" "}
              {state.mode === "countdown" ? "Countdown" : "1080×1080 Square"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!loaded ? (
              <div
                className={cn(
                  "mx-auto w-full animate-pulse rounded-2xl bg-muted",
                  embedded ? "max-w-[min(100%,920px)]" : "max-w-[540px]",
                )}
                style={{ aspectRatio: "1/1" }}
              />
            ) : state.mode === "countdown" ? (
              /* ── Countdown live preview from API ── */
              <div
                className={cn(
                  "mx-auto w-full space-y-2",
                  embedded ? "max-w-[min(100%,920px)]" : "max-w-[540px]",
                )}
              >
                {confId ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/conf/${confId}/countdown-flyer`}
                      alt={`${daysUntilConf()} days countdown flyer`}
                      className="w-full rounded-2xl shadow-xl"
                      style={{ aspectRatio: "1/1", objectFit: "contain" }}
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      Live from server · refreshes on page load
                    </p>
                  </>
                ) : (
                  <div
                    className="animate-pulse rounded-2xl bg-muted"
                    style={{ aspectRatio: "1/1" }}
                  />
                )}
              </div>
            ) : state.mode === "promo" ? (
              /* ── Square promo flyer ── */
              <div
                ref={previewRef}
                className={cn(
                  "relative mx-auto w-full rounded-2xl shadow-xl",
                  embedded ? "overflow-visible" : "overflow-hidden",
                  embedded ? "max-w-[min(100%,920px)]" : "max-w-[540px]",
                )}
                style={{ aspectRatio: "1/1" }}
              >
                <SquarePromoFlyer
                  state={state}
                  previewInteractive={embedded}
                  onPromoPatch={
                    embedded
                      ? (patch) =>
                          setState((p) => ({
                            ...p,
                            promo: { ...p.promo, ...patch },
                          }))
                      : undefined
                  }
                  onHeroTextNudgeChange={
                    embedded
                      ? (x, y) =>
                          setState((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              heroTextNudgeXPct: x,
                              heroTextNudgeYPct: y,
                            },
                          }))
                      : undefined
                  }
                />
                {embedded ? (
                  <FlyerCanvasLayersOverlay
                    layers={state.canvasLayers}
                    selectedId={selectedCanvasLayerId}
                    onSelect={setSelectedCanvasLayerId}
                    onUpdateLayer={patchCanvasLayer}
                    artboardRef={previewRef}
                  />
                ) : null}
              </div>
            ) : (
              /* ── Square signup flyer ── */
              <div
                ref={previewRef}
                className={cn(
                  "relative mx-auto w-full rounded-2xl shadow-xl",
                  embedded ? "overflow-visible" : "overflow-hidden",
                  embedded ? "max-w-[min(100%,920px)]" : "max-w-[540px]",
                )}
                style={{ aspectRatio: "1/1" }}
              >
                <SquareSignupFlyer
                  state={state}
                  previewInteractive={embedded}
                  onHeroTextNudgeChange={
                    embedded
                      ? (x, y) =>
                          setState((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              heroTextNudgeXPct: x,
                              heroTextNudgeYPct: y,
                            },
                          }))
                      : undefined
                  }
                />
                {embedded ? (
                  <FlyerCanvasLayersOverlay
                    layers={state.canvasLayers}
                    selectedId={selectedCanvasLayerId}
                    onSelect={setSelectedCanvasLayerId}
                    onUpdateLayer={patchCanvasLayer}
                    artboardRef={previewRef}
                  />
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type ArtboardCorner = "nw" | "ne" | "sw" | "se";

type ArtboardBoxPct = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

function startArtboardLayerDrag(
  e: PointerEvent<HTMLElement>,
  artboardRef: RefObject<HTMLDivElement | null>,
  box: Pick<ArtboardBoxPct, "xPct" | "yPct" | "wPct" | "hPct">,
  onUpdate: (xPct: number, yPct: number) => void,
) {
  e.preventDefault();
  e.stopPropagation();
  const captureEl = e.currentTarget;
  if (captureEl.setPointerCapture) {
    try {
      captureEl.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  const startX = e.clientX;
  const startY = e.clientY;
  const { xPct: origXPct, yPct: origYPct, wPct, hPct } = box;
  document.body.style.cursor = "grabbing";
  document.body.style.userSelect = "none";

  const onMove = (ev: globalThis.PointerEvent) => {
    const board = artboardRef.current?.getBoundingClientRect();
    if (!board || board.width <= 0 || board.height <= 0) return;
    const dxPct = ((ev.clientX - startX) / board.width) * 100;
    const dyPct = ((ev.clientY - startY) / board.height) * 100;
    onUpdate(
      Math.min(100 - wPct, Math.max(0, origXPct + dxPct)),
      Math.min(100 - hPct, Math.max(0, origYPct + dyPct)),
    );
  };
  const onUp = (ev: globalThis.PointerEvent) => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    try {
      captureEl.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function clampArtboardBox(box: ArtboardBoxPct): ArtboardBoxPct {
  const minW = 5;
  const minH = 4;
  let { xPct: x, yPct: y, wPct: w, hPct: h } = box;
  w = Math.max(minW, w);
  h = Math.max(minH, h);
  x = Math.max(0, Math.min(100 - w, x));
  y = Math.max(0, Math.min(100 - h, y));
  if (x + w > 100) w = 100 - x;
  if (y + h > 100) h = 100 - y;
  return {
    xPct: x,
    yPct: y,
    wPct: Math.max(minW, w),
    hPct: Math.max(minH, h),
  };
}

function startArtboardLayerResize(
  e: PointerEvent<HTMLElement>,
  artboardRef: RefObject<HTMLDivElement | null>,
  corner: ArtboardCorner,
  initial: ArtboardBoxPct,
  onCommit: (box: ArtboardBoxPct) => void,
) {
  e.preventDefault();
  e.stopPropagation();
  const captureEl = e.currentTarget;
  if (captureEl.setPointerCapture) {
    try {
      captureEl.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  const startX = e.clientX;
  const startY = e.clientY;
  const { xPct: x0, yPct: y0, wPct: w0, hPct: h0 } = initial;
  document.body.style.userSelect = "none";

  const onMove = (ev: globalThis.PointerEvent) => {
    const board = artboardRef.current?.getBoundingClientRect();
    if (!board || board.width <= 0 || board.height <= 0) return;
    const dxPct = ((ev.clientX - startX) / board.width) * 100;
    const dyPct = ((ev.clientY - startY) / board.height) * 100;

    let x = x0,
      y = y0,
      w = w0,
      h = h0;
    switch (corner) {
      case "se":
        x = x0;
        y = y0;
        w = w0 + dxPct;
        h = h0 + dyPct;
        break;
      case "ne":
        x = x0;
        y = y0 + dyPct;
        w = w0 + dxPct;
        h = h0 - dyPct;
        break;
      case "sw":
        x = x0 + dxPct;
        y = y0;
        w = w0 - dxPct;
        h = h0 + dyPct;
        break;
      case "nw":
        x = x0 + dxPct;
        y = y0 + dyPct;
        w = w0 - dxPct;
        h = h0 - dyPct;
        break;
      default:
        break;
    }
    onCommit(
      clampArtboardBox({
        xPct: x,
        yPct: y,
        wPct: w,
        hPct: h,
      }),
    );
  };

  const onUp = (ev: globalThis.PointerEvent) => {
    document.body.style.userSelect = "";
    try {
      captureEl.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function InlineCanvasText({
  value,
  onCommit,
  className,
  style,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const committed = useRef(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) {
      el.textContent = value;
    }
    committed.current = value;
  }, [value]);

  return (
    <p
      ref={ref}
      className={cn(className, "min-h-[1em]")}
      style={style}
      contentEditable
      suppressContentEditableWarning
      onDoubleClick={(e) => {
        e.stopPropagation();
        ref.current?.focus();
      }}
      onBlur={(e) => {
        const t = e.currentTarget.textContent ?? "";
        if (t !== committed.current) {
          committed.current = t;
          onCommit(t);
        }
      }}
    />
  );
}

const FLYER_CORNER_CURSOR: Record<ArtboardCorner, string> = {
  nw: "nw-resize",
  ne: "ne-resize",
  sw: "sw-resize",
  se: "se-resize",
};

const FLYER_CORNER_POS: Record<ArtboardCorner, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
  ne: "left-full top-0 -translate-x-1/2 -translate-y-1/2",
  sw: "left-0 top-full -translate-x-1/2 -translate-y-1/2",
  se: "left-full top-full -translate-x-1/2 -translate-y-1/2",
};

function FlyerLayerMoveGrip({
  layerId,
  box,
  artboardRef,
  onUpdateLayer,
}: {
  layerId: string;
  box: ArtboardBoxPct;
  artboardRef: RefObject<HTMLDivElement | null>;
  onUpdateLayer: (id: string, patch: Partial<FlyerCanvasLayer>) => void;
}) {
  return (
    <div
      data-move-grip
      title="Drag to move"
      className={cn(
        "pointer-events-auto absolute -top-3 left-1/2 z-[24] flex -translate-x-1/2 -translate-y-full cursor-grab touch-manipulation items-center justify-center rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-md backdrop-blur-[2px] transition-[opacity,transform,box-shadow] duration-150 active:cursor-grabbing",
        "hover:border-primary/50 hover:shadow-lg",
        "flyer-layer-move-affordance",
      )}
      onPointerDown={(e) => {
        e.stopPropagation();
        startArtboardLayerDrag(
          e,
          artboardRef,
          box,
          (nx, ny) => onUpdateLayer(layerId, { xPct: nx, yPct: ny }),
        );
      }}
    >
      <GripHorizontal className="size-3.5 text-muted-foreground" aria-hidden />
    </div>
  );
}

function FlyerLayerTextDragStrip({
  layerId,
  box,
  artboardRef,
  onUpdateLayer,
}: {
  layerId: string;
  box: ArtboardBoxPct;
  artboardRef: RefObject<HTMLDivElement | null>;
  onUpdateLayer: (id: string, patch: Partial<FlyerCanvasLayer>) => void;
}) {
  return (
    <div
      data-move-grip
      title="Drag to move"
      className={cn(
        "flex shrink-0 cursor-grab items-center justify-center gap-1 rounded-t-sm border-b border-border/40 px-2 py-1 outline-none",
        "bg-muted/15 hover:bg-muted/30 active:cursor-grabbing",
        "flyer-layer-move-affordance flyer-layer-move-affordance--subtle",
      )}
      onPointerDown={(e) => {
        e.stopPropagation();
        startArtboardLayerDrag(
          e,
          artboardRef,
          box,
          (nx, ny) => onUpdateLayer(layerId, { xPct: nx, yPct: ny }),
        );
      }}
    >
      <GripHorizontal
        className="size-3 text-muted-foreground/70"
        aria-hidden
      />
    </div>
  );
}

function FlyerLayerResizeCorners({
  layerId,
  box,
  artboardRef,
  onUpdateLayer,
}: {
  layerId: string;
  box: ArtboardBoxPct;
  artboardRef: RefObject<HTMLDivElement | null>;
  onUpdateLayer: (id: string, patch: Partial<FlyerCanvasLayer>) => void;
}) {
  const corners: ArtboardCorner[] = ["nw", "ne", "sw", "se"];
  return (
    <>
      {corners.map((c) => (
        <div
          key={c}
          data-resize-handle={c}
          role="presentation"
          className={cn(
            "pointer-events-auto absolute z-[25] box-border size-3.5 rounded-full border-[2.5px] border-primary bg-background shadow-md outline-none",
            "hover:scale-110 hover:border-[#0B4FD9] hover:shadow-lg active:scale-105",
            "touch-manipulation transition-transform duration-150 focus:outline-none",
            FLYER_CORNER_POS[c],
          )}
          tabIndex={-1}
          style={{ cursor: FLYER_CORNER_CURSOR[c] }}
          onPointerDown={(e) =>
            startArtboardLayerResize(
              e,
              artboardRef,
              c,
              box,
              (next) =>
                onUpdateLayer(layerId, {
                  xPct: next.xPct,
                  yPct: next.yPct,
                  widthPct: next.wPct,
                  heightPct: next.hPct,
                }),
            )
          }
        />
      ))}
    </>
  );
}

function FlyerCanvasLayersOverlay({
  layers,
  selectedId,
  onSelect,
  onUpdateLayer,
  artboardRef,
}: {
  layers: FlyerCanvasLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<FlyerCanvasLayer>) => void;
  artboardRef: RefObject<HTMLDivElement | null>;
}) {
  const sorted = useMemo(
    () => [...layers].sort((a, b) => a.zIndex - b.zIndex),
    [layers],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-5"
      aria-hidden
    >
      {sorted.map((ly) => {
        const selected = ly.id === selectedId;

        if (ly.kind === "text") {
          const box: ArtboardBoxPct = {
            xPct: ly.xPct,
            yPct: ly.yPct,
            wPct: ly.widthPct,
            hPct: ly.heightPct,
          };
          const commonStyle: CSSProperties = {
            position: "absolute",
            left: `${ly.xPct}%`,
            top: `${ly.yPct}%`,
            width: `${ly.widthPct}%`,
            height: `${ly.heightPct}%`,
            transform: `rotate(${ly.rotationDeg}deg)`,
            zIndex: 10 + ly.zIndex,
          };
          return (
            <div
              key={ly.id}
              className={cn(
                "pointer-events-auto flex touch-manipulation flex-col overflow-visible rounded-sm",
                selected && "group ring-1 ring-primary/90 ring-offset-2 ring-offset-background",
              )}
              style={commonStyle}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("[data-resize-handle]"))
                  return;
                if ((e.target as HTMLElement).closest("[data-move-grip]"))
                  return;
                e.stopPropagation();
                onSelect(ly.id);
              }}
            >
              {selected ? (
                <FlyerLayerTextDragStrip
                  layerId={ly.id}
                  box={box}
                  artboardRef={artboardRef}
                  onUpdateLayer={onUpdateLayer}
                />
              ) : null}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <InlineCanvasText
                  value={ly.text}
                  onCommit={(t) => onUpdateLayer(ly.id, { text: t })}
                  className="min-h-0 flex-1 overflow-auto font-semibold leading-snug outline-none"
                  style={{
                    fontSize: ly.fontSizePx,
                    color: ly.color,
                    fontWeight: ly.fontWeight,
                    textAlign: ly.textAlign,
                    wordBreak: "break-word",
                  }}
                />
              </div>
              {selected ? (
                <FlyerLayerResizeCorners
                  layerId={ly.id}
                  box={box}
                  artboardRef={artboardRef}
                  onUpdateLayer={onUpdateLayer}
                />
              ) : null}
            </div>
          );
        }

        const s = ly;
        const shapeBox: ArtboardBoxPct = {
          xPct: s.xPct,
          yPct: s.yPct,
          wPct: s.widthPct,
          hPct: s.heightPct,
        };
        const shapeStyle: CSSProperties = {
          position: "absolute",
          left: `${s.xPct}%`,
          top: `${s.yPct}%`,
          width: `${s.widthPct}%`,
          height: `${s.heightPct}%`,
          transform: `rotate(${s.rotationDeg}deg)`,
          zIndex: 10 + s.zIndex,
          backgroundColor: s.fill,
          opacity: s.opacity,
          borderRadius: ly.kind === "ellipse" ? "9999px" : "6px",
          border:
            s.strokeWidthPx > 0
              ? `${s.strokeWidthPx}px solid ${s.stroke}`
              : undefined,
        };

        return (
          <div
            key={ly.id}
            role="presentation"
            className={cn(
              "pointer-events-auto relative touch-manipulation overflow-visible",
              selected &&
                "group cursor-grab ring-1 ring-primary/90 ring-offset-2 ring-offset-background active:cursor-grabbing",
            )}
            style={shapeStyle}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("[data-resize-handle]"))
                return;
              if ((e.target as HTMLElement).closest("[data-move-grip]"))
                return;
              e.stopPropagation();
              onSelect(ly.id);
              startArtboardLayerDrag(
                e,
                artboardRef,
                shapeBox,
                (xPct, yPct) => onUpdateLayer(ly.id, { xPct, yPct }),
              );
            }}
          >
            {selected ? (
              <>
                <FlyerLayerMoveGrip
                  layerId={ly.id}
                  box={shapeBox}
                  artboardRef={artboardRef}
                  onUpdateLayer={onUpdateLayer}
                />
                <FlyerLayerResizeCorners
                  layerId={ly.id}
                  box={shapeBox}
                  artboardRef={artboardRef}
                  onUpdateLayer={onUpdateLayer}
                />
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ── Square Promo Flyer ────────────────────────────────────────────────────────

function SquarePromoFlyer({
  state,
  previewInteractive = false,
  onHeroTextNudgeChange,
  onPromoPatch,
}: {
  state: FlyerStudioState;
  previewInteractive?: boolean;
  onHeroTextNudgeChange?: (xPct: number, yPct: number) => void;
  onPromoPatch?: (patch: Partial<PromoFlyer>) => void;
}) {
  const th = state.theme;
  const heroBandRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    cx: number;
    cy: number;
    sx: number;
    sy: number;
  } | null>(null);
  const heroSrc =
    th.customHeroImage ?? "/conf/assets/jinan_city/day_view_landscape.png";
  const hf = th.baseFontPx / 10;
  const allowHeroDrag =
    previewInteractive && Boolean(onHeroTextNudgeChange) && !onPromoPatch;

  const onTitlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!allowHeroDrag || !onHeroTextNudgeChange) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      cx: e.clientX,
      cy: e.clientY,
      sx: th.heroTextNudgeXPct,
      sy: th.heroTextNudgeYPct,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onTitlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!allowHeroDrag) return;
    if (!dragRef.current || !heroBandRef.current || !onHeroTextNudgeChange) {
      return;
    }
    if ((e.buttons & 1) === 0) return;
    const rect = heroBandRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.cx) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.cy) / rect.height) * 100;
    const nx = Math.max(-22, Math.min(22, dragRef.current.sx + dx));
    const ny = Math.max(-18, Math.min(18, dragRef.current.sy + dy));
    onHeroTextNudgeChange(nx, ny);
  };
  const onTitlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: th.primaryBg, fontSize: th.baseFontPx }}
    >
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: th.primaryBg }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white"
            style={{ borderColor: th.accent }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/lsuic_logo.png"
              alt="LSUIC logo"
              className="h-full w-full object-contain p-0.5"
            />
          </div>
          <div>
            {previewInteractive && onPromoPatch ? (
              <>
                <InlineCanvasText
                  value={state.promo.orgName}
                  onCommit={(t) => onPromoPatch({ orgName: t })}
                  className="font-black uppercase leading-none tracking-wide"
                  style={{
                    fontSize: `${0.85 * hf}em`,
                    color: th.textOnDark,
                  }}
                />
                <InlineCanvasText
                  value={state.promo.headerTagline}
                  onCommit={(t) => onPromoPatch({ headerTagline: t })}
                  className="mt-0.5 leading-none"
                  style={{
                    fontSize: `${0.7 * hf}em`,
                    color: th.accent,
                  }}
                />
              </>
            ) : (
              <>
                <p
                  className="font-black uppercase leading-none tracking-wide"
                  style={{
                    fontSize: `${0.85 * hf}em`,
                    color: th.textOnDark,
                  }}
                >
                  {state.promo.orgName}
                </p>
                <p
                  className="mt-0.5 leading-none"
                  style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
                >
                  {state.promo.headerTagline}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          {previewInteractive && onPromoPatch ? (
            <>
              <InlineCanvasText
                value={state.promo.bannerLocation}
                onCommit={(t) => onPromoPatch({ bannerLocation: t })}
                className="font-bold uppercase leading-none tracking-[0.1em]"
                style={{
                  fontSize: `${0.7 * hf}em`,
                  color: th.accent,
                }}
              />
              <InlineCanvasText
                value={state.promo.bannerSchedule}
                onCommit={(t) => onPromoPatch({ bannerSchedule: t })}
                className="mt-0.5 leading-none opacity-80"
                style={{
                  fontSize: `${0.7 * hf}em`,
                  color: th.textOnDark,
                }}
              />
            </>
          ) : (
            <>
              <p
                className="font-bold uppercase leading-none tracking-[0.1em]"
                style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
              >
                {state.promo.bannerLocation}
              </p>
              <p
                className="mt-0.5 leading-none opacity-80"
                style={{ fontSize: `${0.7 * hf}em`, color: th.textOnDark }}
              >
                {state.promo.bannerSchedule}
              </p>
            </>
          )}
        </div>
      </div>

      <div
        ref={heroBandRef}
        className="relative shrink-0 overflow-hidden"
        style={{ height: `${th.promoHeroHeightPct}%` }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            style={{
              opacity: th.heroPhotoOpacity,
              objectPosition: `${th.heroFocalXPct}% ${th.heroFocalYPct}%`,
              transform: `scale(${th.heroImageScale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#021033]/10 via-[#021033]/50 to-[#071B4D]/95"
          style={{ opacity: th.heroOverlayStrength }}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 px-4 pb-3",
            allowHeroDrag &&
              "cursor-grab rounded-md active:cursor-grabbing",
            allowHeroDrag &&
              "ring-1 ring-white/25 ring-offset-0 ring-offset-transparent",
          )}
          style={{
            transform: `translate(${th.heroTextNudgeXPct}%, ${th.heroTextNudgeYPct}%)`,
            touchAction: allowHeroDrag ? "none" : undefined,
          }}
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
          onPointerCancel={onTitlePointerUp}
        >
          {previewInteractive && onPromoPatch ? (
            <>
              <InlineCanvasText
                value={state.promo.conferenceTag}
                onCommit={(t) => onPromoPatch({ conferenceTag: t })}
                className="font-bold uppercase leading-none tracking-[0.15em]"
                style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
              />
              <InlineCanvasText
                value={state.promo.title}
                onCommit={(t) => onPromoPatch({ title: t })}
                className="font-black leading-none"
                style={{
                  fontSize: th.titleFontPx,
                  lineHeight: 1.05,
                  color: th.textOnDark,
                  textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                }}
              />
              <InlineCanvasText
                value={state.promo.subtitle}
                onCommit={(t) => onPromoPatch({ subtitle: t })}
                className="mt-0.5"
                style={{
                  fontSize: `${0.9 * hf}em`,
                  color: th.textOnDark,
                  opacity: 0.9,
                }}
              />
            </>
          ) : (
            <>
              <p
                className="font-bold uppercase leading-none tracking-[0.15em]"
                style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
              >
                {state.promo.conferenceTag}
              </p>
              <h2
                className="font-black leading-none"
                style={{
                  fontSize: th.titleFontPx,
                  lineHeight: 1.05,
                  color: th.textOnDark,
                  textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                }}
              >
                {state.promo.title}
              </h2>
              <p
                className="mt-0.5"
                style={{
                  fontSize: `${0.9 * hf}em`,
                  color: th.textOnDark,
                  opacity: 0.9,
                }}
              >
                {state.promo.subtitle}
              </p>
            </>
          )}
          {allowHeroDrag ? (
            <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-white/70">
              Drag to reposition
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0" style={{ height: "11px" }}>
        <div className="flex-1 bg-[#C8102E]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ backgroundColor: th.primaryBg }} />
      </div>

      <div
        className="shrink-0 px-4 py-1.5 text-center"
        style={{ backgroundColor: th.deepBand }}
      >
        {previewInteractive && onPromoPatch ? (
          <>
            <InlineCanvasText
              value={state.promo.title}
              onCommit={(t) => onPromoPatch({ title: t })}
              className="font-black uppercase leading-tight tracking-wide"
              style={{
                fontSize: `${1.1 * hf}em`,
                color: th.textOnDark,
              }}
            />
            <InlineCanvasText
              value={state.promo.subtitle}
              onCommit={(t) => onPromoPatch({ subtitle: t })}
              className="leading-snug italic"
              style={{
                fontSize: `${0.7 * hf}em`,
                color: th.accent,
              }}
            />
          </>
        ) : (
          <>
            <p
              className="font-black uppercase leading-tight tracking-wide"
              style={{ fontSize: `${1.1 * hf}em`, color: th.textOnDark }}
            >
              {state.promo.title}
            </p>
            <p
              className="leading-snug italic"
              style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
            >
              {state.promo.subtitle}
            </p>
          </>
        )}
      </div>

      <div
        className="flex flex-1 flex-col gap-1.5 overflow-hidden px-4 py-2.5"
        style={{ backgroundColor: th.contentBg }}
      >
        <p
          className="shrink-0 font-bold uppercase tracking-[0.14em]"
          style={{ fontSize: `${0.7 * hf}em`, color: th.textOnLight }}
        >
          Conference Highlights
        </p>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          {state.promo.highlights.slice(0, 5).map((item, i) => (
            <div
              key={`hl-${i}`}
              className="flex flex-1 items-center gap-2 rounded-lg border border-[#CCDAEF] bg-white px-2.5 shadow-sm"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8102E]" />
              {previewInteractive && onPromoPatch ? (
                <InlineCanvasText
                  value={item}
                  onCommit={(t) => {
                    const next = [...state.promo.highlights];
                    next[i] = t;
                    onPromoPatch({ highlights: next });
                  }}
                  className="font-semibold"
                  style={{
                    fontSize: `${1 * hf}em`,
                    color: th.textOnLight,
                  }}
                />
              ) : (
                <p
                  className="font-semibold"
                  style={{ fontSize: `${1 * hf}em`, color: th.textOnLight }}
                >
                  {item}
                </p>
              )}
            </div>
          ))}
        </div>
        {state.promo.cta && (
          <div className="shrink-0 rounded-lg bg-[#C8102E] px-3 py-2">
            {previewInteractive && onPromoPatch ? (
              <InlineCanvasText
                value={state.promo.cta}
                onCommit={(t) => onPromoPatch({ cta: t })}
                className="font-medium"
                style={{ fontSize: `${0.9 * hf}em`, color: "#fff" }}
              />
            ) : (
              <p
                className="font-medium"
                style={{ fontSize: `${0.9 * hf}em`, color: "#fff" }}
              >
                {state.promo.cta}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className="flex shrink-0 items-center justify-between px-4 py-2"
        style={{ backgroundColor: th.deepBand }}
      >
        {previewInteractive && onPromoPatch ? (
          <>
            <InlineCanvasText
              value={state.promo.website}
              onCommit={(t) => onPromoPatch({ website: t })}
              className="min-w-0 flex-1"
              style={{
                fontSize: `${0.7 * hf}em`,
                color: th.textOnDark,
                opacity: 0.65,
              }}
            />
            <InlineCanvasText
              value={state.promo.motto}
              onCommit={(t) => onPromoPatch({ motto: t })}
              className="max-w-[48%] shrink-0 text-right font-semibold italic"
              style={{
                fontSize: `${0.7 * hf}em`,
                color: th.accent,
              }}
            />
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: `${0.7 * hf}em`,
                color: th.textOnDark,
                opacity: 0.65,
              }}
            >
              {state.promo.website}
            </p>
            <p
              className="font-semibold italic"
              style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
            >
              {state.promo.motto}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Square Signup Flyer ───────────────────────────────────────────────────────

function SquareSignupFlyer({
  state,
  previewInteractive = false,
  onHeroTextNudgeChange,
}: {
  state: FlyerStudioState;
  previewInteractive?: boolean;
  onHeroTextNudgeChange?: (xPct: number, yPct: number) => void;
}) {
  const th = state.theme;
  const heroBandRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    cx: number;
    cy: number;
    sx: number;
    sy: number;
  } | null>(null);
  const heroSrc =
    th.customHeroImage ?? "/conf/assets/hotel/conference_hall.jpg";
  const hf = th.baseFontPx / 10;

  const onTitlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!previewInteractive || !onHeroTextNudgeChange) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      cx: e.clientX,
      cy: e.clientY,
      sx: th.heroTextNudgeXPct,
      sy: th.heroTextNudgeYPct,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onTitlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !heroBandRef.current || !onHeroTextNudgeChange) {
      return;
    }
    if ((e.buttons & 1) === 0) return;
    const rect = heroBandRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.cx) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.cy) / rect.height) * 100;
    const nx = Math.max(-22, Math.min(22, dragRef.current.sx + dx));
    const ny = Math.max(-18, Math.min(18, dragRef.current.sy + dy));
    onHeroTextNudgeChange(nx, ny);
  };
  const onTitlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: th.primaryBg, fontSize: th.baseFontPx }}
    >
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: th.primaryBg }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white"
            style={{ borderColor: th.accent }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/lsuic_logo.png"
              alt="LSUIC logo"
              className="h-full w-full object-contain p-0.5"
            />
          </div>
          <div>
            <p
              className="font-black uppercase leading-none tracking-wide"
              style={{ fontSize: `${0.85 * hf}em`, color: th.textOnDark }}
            >
              {state.signup.orgName}
            </p>
            <p
              className="mt-0.5 leading-none"
              style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
            >
              {state.signup.headerTagline}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="font-bold uppercase leading-none tracking-[0.1em]"
            style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
          >
            {state.signup.bannerLocation}
          </p>
          <p
            className="mt-0.5 leading-none opacity-80"
            style={{ fontSize: `${0.7 * hf}em`, color: th.textOnDark }}
          >
            {state.signup.bannerSchedule}
          </p>
        </div>
      </div>

      <div
        ref={heroBandRef}
        className="relative shrink-0 overflow-hidden"
        style={{ height: `${th.signupHeroHeightPct}%` }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            style={{
              opacity: th.heroPhotoOpacity,
              objectPosition: `${th.heroFocalXPct}% ${th.heroFocalYPct}%`,
              transform: `scale(${th.heroImageScale})`,
              transformOrigin: "center center",
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#021033]/10 via-[#021033]/50 to-[#071B4D]/95"
          style={{ opacity: th.heroOverlayStrength }}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 px-4 pb-3",
            previewInteractive &&
              onHeroTextNudgeChange &&
              "cursor-grab rounded-md active:cursor-grabbing",
            previewInteractive &&
              onHeroTextNudgeChange &&
              "ring-1 ring-white/25",
          )}
          style={{
            transform: `translate(${th.heroTextNudgeXPct}%, ${th.heroTextNudgeYPct}%)`,
            touchAction: previewInteractive ? "none" : undefined,
          }}
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
          onPointerCancel={onTitlePointerUp}
        >
          <p
            className="font-bold uppercase leading-none tracking-[0.15em]"
            style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
          >
            {state.signup.conferenceTag}
          </p>
          <h2
            className="font-black leading-none"
            style={{
              fontSize: Math.round(th.titleFontPx * 0.88),
              lineHeight: 1.05,
              color: th.textOnDark,
              textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            }}
          >
            {state.signup.title}
          </h2>
          <p
            className="mt-0.5"
            style={{
              fontSize: `${0.9 * hf}em`,
              color: th.textOnDark,
              opacity: 0.9,
            }}
          >
            {state.signup.subtitle}
          </p>
          {previewInteractive && onHeroTextNudgeChange ? (
            <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-white/70">
              Drag to reposition
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0" style={{ height: "11px" }}>
        <div className="flex-1 bg-[#C8102E]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ backgroundColor: th.primaryBg }} />
      </div>

      <div
        className="shrink-0 px-4 py-1.5 text-center"
        style={{ backgroundColor: th.deepBand }}
      >
        <p
          className="font-black uppercase leading-tight tracking-wide"
          style={{ fontSize: `${1 * hf}em`, color: th.textOnDark }}
        >
          {state.signup.title}
        </p>
        <p
          className="mt-0.5 leading-snug italic"
          style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
        >
          {state.signup.subtitle}
        </p>
      </div>

      <div
        className="flex flex-1 flex-col overflow-hidden px-4 py-2.5"
        style={{ backgroundColor: th.contentBg }}
      >
        <div className="grid flex-1 grid-cols-[1fr_120px] gap-3 overflow-hidden">
          <div className="flex flex-col gap-1.5 overflow-hidden">
            <p
              className="shrink-0 font-bold uppercase tracking-[0.14em]"
              style={{ fontSize: `${0.7 * hf}em`, color: th.textOnLight }}
            >
              How To Register
            </p>
            {state.signup.steps.slice(0, 4).map((step, i) => (
              <div
                key={`${step}-${i}`}
                className="flex items-start gap-2 rounded-lg border border-[#CCDAEF] bg-white px-2 py-1.5 shadow-sm"
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-black text-white"
                  style={{ backgroundColor: th.primaryBg }}
                >
                  {i + 1}
                </span>
                <p
                  className="font-medium"
                  style={{ fontSize: `${0.9 * hf}em`, color: th.textOnLight }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-[#CCDAEF] bg-white p-2">
            <p
              className="font-bold uppercase tracking-[0.1em]"
              style={{ fontSize: `${0.7 * hf}em`, color: th.textOnLight }}
            >
              Scan To Register
            </p>
            <div className="flex flex-1 flex-col gap-1.5">
              <div
                className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[#CCDAEF]"
                style={{ backgroundColor: th.contentBg }}
              >
                <p
                  className="font-semibold"
                  style={{ fontSize: `${0.7 * hf}em`, color: th.textOnLight }}
                >
                  Signup QR
                </p>
              </div>
              <div
                className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[#CCDAEF]"
                style={{ backgroundColor: th.contentBg }}
              >
                <p
                  className="font-semibold"
                  style={{ fontSize: `${0.7 * hf}em`, color: th.textOnLight }}
                >
                  Payment QR
                </p>
              </div>
            </div>
            {state.signup.footer && (
              <p
                className="text-center font-semibold leading-tight"
                style={{ fontSize: `${0.7 * hf}em`, color: "#C8102E" }}
              >
                {state.signup.footer}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 shrink-0 rounded-md border border-[#0B1E78]/20 bg-white px-2.5 py-1.5">
          <p
            className="truncate font-medium"
            style={{ fontSize: `${0.8 * hf}em`, color: "#0B4FD9" }}
          >
            {state.signup.signupLink}
          </p>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center justify-between px-4 py-2"
        style={{ backgroundColor: th.deepBand }}
      >
        <p
          style={{
            fontSize: `${0.7 * hf}em`,
            color: th.textOnDark,
            opacity: 0.65,
          }}
        >
          {state.signup.website}
        </p>
        <p
          className="font-semibold italic"
          style={{ fontSize: `${0.7 * hf}em`, color: th.accent }}
        >
          {state.signup.motto}
        </p>
      </div>
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function daysUntilConf(): number {
  return daysUntilDate(CONF_2026.startsAt, "Asia/Shanghai");
}
