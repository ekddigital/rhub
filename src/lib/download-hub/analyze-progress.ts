/**
 * Client-safe analyze UX constants (timeouts, status copy).
 */

/** Must stay below server FB info timeout (90s) and info route maxDuration (120s). */
export const ANALYZE_CLIENT_TIMEOUT_MS = 85_000;
export const ANALYZE_MESSAGE_INTERVAL_MS = 2_500;
export const ANALYZE_SLOW_WARN_MS = [30_000, 60_000] as const;

export type AnalyzePhase =
  | "validate"
  | "connect"
  | "resolve"
  | "metadata"
  | "formats"
  | "session"
  | "slow"
  | "timeout";

export type AnalyzeStatusMessage = {
  phase: AnalyzePhase;
  text: string;
};

/** Default messages when platform is unknown */
export const GENERIC_ANALYZE_MESSAGES: AnalyzeStatusMessage[] = [
  { phase: "validate", text: "Checking link format…" },
  { phase: "connect", text: "Connecting to download service…" },
  { phase: "metadata", text: "Fetching video metadata with yt-dlp…" },
  { phase: "formats", text: "Building format list…" },
  { phase: "session", text: "Preparing your download page…" },
];

const PLATFORM_MESSAGES: Record<
  string,
  Partial<Record<AnalyzePhase, string>>
> = {
  fb: {
    validate: "Validating Facebook link…",
    resolve: "Resolving Facebook share redirect…",
    metadata: "Fetching Facebook video metadata…",
    formats: "Listing available qualities…",
  },
  yt: {
    validate: "Validating YouTube link…",
    metadata: "Fetching YouTube metadata with yt-dlp…",
    formats: "Building quality and format list…",
  },
  ig: {
    validate: "Validating Instagram link…",
    metadata: "Fetching Instagram media metadata…",
  },
  tk: {
    validate: "Validating TikTok link…",
    metadata: "Fetching TikTok video metadata…",
  },
  tw: {
    validate: "Validating X (Twitter) link…",
    metadata: "Fetching post media metadata…",
  },
  vm: {
    validate: "Validating Vimeo link…",
    metadata: "Fetching Vimeo video metadata…",
  },
};

const SLOW_MESSAGES: AnalyzeStatusMessage[] = [
  {
    phase: "slow",
    text: "Still working — some Facebook and share links take longer…",
  },
  {
    phase: "slow",
    text: "Almost there — resolving redirects and source formats…",
  },
  {
    phase: "slow",
    text: "If this keeps failing, try the watch/reel URL from the share page.",
  },
];

export function buildAnalyzeMessages(
  platformId?: string | null,
): AnalyzeStatusMessage[] {
  const overrides = platformId ? PLATFORM_MESSAGES[platformId] : undefined;
  const base = GENERIC_ANALYZE_MESSAGES.map((msg) => ({
    ...msg,
    text: overrides?.[msg.phase] ?? msg.text,
  }));

  const resolveMsg = overrides?.resolve;
  if (resolveMsg) {
    const connectIdx = base.findIndex((m) => m.phase === "connect");
    const insertAt = connectIdx >= 0 ? connectIdx + 1 : 1;
    base.splice(insertAt, 0, { phase: "resolve", text: resolveMsg });
  }

  return [...base, ...SLOW_MESSAGES];
}

export const ANALYZE_TIMEOUT_ERROR =
  "Analysis took too long. Facebook share links can be slow — try opening the video on Facebook, copy the watch/reel URL, and paste that here.";

export const ANALYZE_ABORT_ERROR = "Analysis was cancelled.";

/** Four-step UI pipeline shown during analyze / session load */
export const ANALYZE_UI_PHASES = [
  { id: "validate", label: "Validate" },
  { id: "resolve", label: "Resolve" },
  { id: "fetch", label: "Fetch" },
  { id: "formats", label: "Formats" },
] as const;

export type AnalyzeUiPhaseId = (typeof ANALYZE_UI_PHASES)[number]["id"];

const PHASE_TO_UI_STEP: Partial<Record<AnalyzePhase, AnalyzeUiPhaseId>> = {
  validate: "validate",
  connect: "resolve",
  resolve: "resolve",
  metadata: "fetch",
  slow: "fetch",
  formats: "formats",
  session: "formats",
};

export function resolveAnalyzeUiPhase(
  phase: AnalyzePhase | undefined,
): AnalyzeUiPhaseId {
  if (!phase) return "validate";
  return PHASE_TO_UI_STEP[phase] ?? "validate";
}

export function analyzeUiPhaseIndex(phase: AnalyzeUiPhaseId): number {
  return ANALYZE_UI_PHASES.findIndex((step) => step.id === phase);
}

/** Stepped progress target (0–100) for the active UI phase */
export function analyzeProgressPercent(
  phase: AnalyzeUiPhaseId,
  elapsedMs = 0,
): number {
  const index = analyzeUiPhaseIndex(phase);
  const base = [12, 38, 64, 88][index] ?? 12;
  const cap = [35, 58, 82, 97][index] ?? 35;
  const withinStep = Math.min((elapsedMs % 4_000) / 4_000, 1) * (cap - base);
  return Math.round(base + withinStep);
}

export const SESSION_LOAD_MESSAGE = "Loading your download page…";
