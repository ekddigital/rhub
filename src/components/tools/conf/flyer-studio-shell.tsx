"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  Megaphone,
  QrCode,
  RefreshCcw,
  Save,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchDefaultConference } from "@/lib/conf/client";
import { CONF_2026 } from "@/lib/conf/config";

type FlyerMode = "promo" | "signup" | "countdown";

type PromoFlyer = {
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

type FlyerStudioState = {
  mode: FlyerMode;
  promo: PromoFlyer;
  signup: SignupFlyer;
};

type ExportFormat = "png" | "svg";

const LOCAL_STORAGE_KEY = "conf-flyer-studio-v2";

const DELEGATE_FLYER_REFERENCE =
  "Delegate card generator palette (red/white/blue): C8102E, 0B1E78, 0B4FD9";

const UNION_NAME = "Liberian Student Union in China";

const DEFAULT_STATE: FlyerStudioState = {
  mode: "promo",
  promo: {
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
    promo: {
      ...DEFAULT_STATE.promo,
      ...rawPromo,
      highlights: promoHighlights,
      website: rawPromo.website || DEFAULT_STATE.promo.website,
      motto: rawPromo.motto || DEFAULT_STATE.promo.motto,
    },
    signup: {
      ...DEFAULT_STATE.signup,
      ...rawSignup,
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

export function FlyerStudioShell() {
  const [state, setState] = useState<FlyerStudioState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null,
  );
  const [confId, setConfId] = useState("");
  const [downloadingCountdown, setDownloadingCountdown] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void fetchDefaultConference()
      .then((c) => setConfId(c.id))
      .catch(() => {});
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        setState(coerceState(parsed));
      }
    } catch {
      // Ignore malformed local storage payload and fall back to defaults.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
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
  };

  const resetDefaults = () => {
    setState(DEFAULT_STATE);
    setSaveNotice("Template reset to default values.");
  };

  const saveNow = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    setSaveNotice("Saved in this browser for future edits.");
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
      setSaveNotice("Configuration imported successfully.");
    } catch {
      setSaveNotice("Could not import file. Use a valid flyer JSON export.");
    }
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

  return (
    <div className="space-y-6 py-6">
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

      {saveNotice && (
        <div className="rounded-lg border border-[#0B1E78]/35 bg-[#0B4FD9]/10 px-3 py-2 text-sm text-foreground">
          {saveNotice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <Card>
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
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-[#0B1E78]">
                    Delegate Flyer Color System
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: "#C8102E" }}
                    />
                    <span
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: "#FFFFFF" }}
                    />
                    <span
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: "#0B1E78" }}
                    />
                    <span
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: "#0B4FD9" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep all conference flyer designs within Liberia red, white,
                    and blue for consistency.
                  </p>
                </div>

                {state.mode === "promo" ? (
                  <div className="space-y-3">
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
                  <input
                    ref={importRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) =>
                      void importConfig(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Live Preview —{" "}
              {state.mode === "countdown" ? "Countdown" : "1080×1080 Square"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <div
                className="mx-auto w-full max-w-[540px] animate-pulse rounded-2xl bg-muted"
                style={{ aspectRatio: "1/1" }}
              />
            ) : state.mode === "countdown" ? (
              /* ── Countdown live preview from API ── */
              <div className="mx-auto w-full max-w-[540px] space-y-2">
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
                className="mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl shadow-xl"
                style={{ aspectRatio: "1/1" }}
              >
                <SquarePromoFlyer state={state} />
              </div>
            ) : (
              /* ── Square signup flyer ── */
              <div
                ref={previewRef}
                className="mx-auto w-full max-w-[540px] overflow-hidden rounded-2xl shadow-xl"
                style={{ aspectRatio: "1/1" }}
              >
                <SquareSignupFlyer state={state} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Square Promo Flyer ────────────────────────────────────────────────────────

function SquarePromoFlyer({ state }: { state: FlyerStudioState }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0B1E78]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-[#0B1E78] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-[#C8A061] bg-white flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/lsuic_logo.png"
              alt="LSUIC logo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div>
            <p className="text-[8.5px] font-black uppercase tracking-wide text-white leading-none">
              {UNION_NAME}
            </p>
            <p className="text-[7px] text-[#C8A061] leading-none mt-0.5">
              LSUIC · 2026
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#C8A061]">
            {`${CONF_2026.city.toUpperCase()}, ${CONF_2026.province.toUpperCase()}`}
          </p>
          <p className="text-[7px] text-white/75 leading-none mt-0.5">
            {`JULY ${new Date(CONF_2026.startsAt).getUTCDate()}–${new Date(CONF_2026.endsAt).getUTCDate()}, ${new Date(CONF_2026.endsAt).getUTCFullYear()}`}
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative shrink-0" style={{ height: "26%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/conf/assets/jinan_city/day_view_landscape.png"
          alt="Jinan city"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#021033]/10 via-[#021033]/50 to-[#071B4D]/95" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <p className="text-[7px] font-bold uppercase tracking-[0.15em] text-[#C8A061]">
            {state.promo.conferenceTag}
          </p>
          <h2
            className="text-[32px] font-black leading-none text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
          >
            {state.promo.title}
          </h2>
          <p className="mt-0.5 text-[9px] text-white/85">
            {state.promo.subtitle}
          </p>
        </div>
      </div>

      {/* Liberia flag stripe */}
      <div className="flex shrink-0" style={{ height: "11px" }}>
        <div className="flex-1 bg-[#C8102E]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#0B1E78]" />
      </div>

      {/* Theme banner */}
      <div className="shrink-0 bg-[#071B4D] px-4 py-1.5 text-center">
        <p className="text-[11px] font-black uppercase tracking-wide text-white leading-tight">
          {CONF_2026.theme}
        </p>
        <p className="text-[7px] italic text-[#C8A061] leading-snug">
          {CONF_2026.subTheme}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden bg-[#F0F5FF] px-4 py-2.5">
        <p className="shrink-0 text-[7px] font-bold uppercase tracking-[0.14em] text-[#0B1E78]">
          Conference Highlights
        </p>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          {state.promo.highlights.slice(0, 5).map((item, i) => (
            <div
              key={`${item}-${i}`}
              className="flex flex-1 items-center gap-2 rounded-lg border border-[#CCDAEF] bg-white px-2.5 shadow-sm"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8102E]" />
              <p className="text-[10px] font-semibold text-[#0B1E78]">{item}</p>
            </div>
          ))}
        </div>
        {state.promo.cta && (
          <div className="shrink-0 rounded-lg bg-[#C8102E] px-3 py-2">
            <p className="text-[9px] font-medium text-white">
              {state.promo.cta}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between bg-[#071B4D] px-4 py-2">
        <p className="text-[7px] text-white/55">{state.promo.website}</p>
        <p className="text-[7px] font-semibold italic text-[#C8A061]">
          {state.promo.motto}
        </p>
      </div>
    </div>
  );
}

// ── Square Signup Flyer ───────────────────────────────────────────────────────

function SquareSignupFlyer({ state }: { state: FlyerStudioState }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0B1E78]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-[#0B1E78] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-[#C8A061] bg-white flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/lsuic_logo.png"
              alt="LSUIC logo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div>
            <p className="text-[8.5px] font-black uppercase tracking-wide text-white leading-none">
              {UNION_NAME}
            </p>
            <p className="text-[7px] text-[#C8A061] leading-none mt-0.5">
              2026 National Conference
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#C8A061]">
            DELEGATE REGISTRATION
          </p>
          <p className="text-[7px] text-white/75 leading-none mt-0.5">
            {`${CONF_2026.city.toUpperCase()} · ${new Date(CONF_2026.startsAt).toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase()} ${new Date(CONF_2026.endsAt).getUTCFullYear()}`}
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="relative shrink-0" style={{ height: "20%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/conf/assets/hotel/conference_hall.jpg"
          alt="Conference hall"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#021033]/10 via-[#021033]/50 to-[#071B4D]/95" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <p className="text-[7px] font-bold uppercase tracking-[0.15em] text-[#C8A061]">
            {state.signup.conferenceTag}
          </p>
          <h2
            className="text-[28px] font-black leading-none text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
          >
            {state.signup.title}
          </h2>
          <p className="mt-0.5 text-[9px] text-white/85">
            {state.signup.subtitle}
          </p>
        </div>
      </div>

      {/* Flag stripe */}
      <div className="flex shrink-0" style={{ height: "11px" }}>
        <div className="flex-1 bg-[#C8102E]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#0B1E78]" />
      </div>

      {/* Theme banner */}
      <div className="shrink-0 bg-[#071B4D] px-4 py-1.5 text-center">
        <p className="text-[10px] font-black uppercase tracking-wide text-white leading-tight">
          {CONF_2026.theme}
        </p>
        <p className="mt-0.5 text-[7px] italic text-[#C8A061] leading-snug">
          {CONF_2026.subTheme}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#F0F5FF] px-4 py-2.5">
        <div className="grid flex-1 grid-cols-[1fr_120px] gap-3 overflow-hidden">
          <div className="flex flex-col gap-1.5 overflow-hidden">
            <p className="shrink-0 text-[7px] font-bold uppercase tracking-[0.14em] text-[#0B1E78]">
              How To Register
            </p>
            {state.signup.steps.slice(0, 4).map((step, i) => (
              <div
                key={`${step}-${i}`}
                className="flex items-start gap-2 rounded-lg border border-[#CCDAEF] bg-white px-2 py-1.5 shadow-sm"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0B1E78] text-[7px] font-black text-white">
                  {i + 1}
                </span>
                <p className="text-[9px] font-medium text-[#0B1E78]">{step}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-[#CCDAEF] bg-white p-2">
            <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#0B1E78]">
              Scan To Register
            </p>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[#CCDAEF] bg-[#F0F5FF]">
                <p className="text-[7px] font-semibold text-[#0B1E78]">
                  Signup QR
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[#CCDAEF] bg-[#F0F5FF]">
                <p className="text-[7px] font-semibold text-[#0B1E78]">
                  Payment QR
                </p>
              </div>
            </div>
            {state.signup.footer && (
              <p className="text-center text-[7px] font-semibold leading-tight text-[#C8102E]">
                {state.signup.footer}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 shrink-0 rounded-md border border-[#0B1E78]/20 bg-white px-2.5 py-1.5">
          <p className="truncate text-[8px] font-medium text-[#0B4FD9]">
            {state.signup.signupLink}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between bg-[#071B4D] px-4 py-2">
        <p className="text-[7px] text-white/55">{state.signup.website}</p>
        <p className="text-[7px] font-semibold italic text-[#C8A061]">
          {state.signup.motto}
        </p>
      </div>
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function daysUntilConf(): number {
  const target = new Date(CONF_2026.startsAt);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.round((target.getTime() - now.getTime()) / 86_400_000),
  );
}
