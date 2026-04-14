"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Download,
  Megaphone,
  QrCode,
  RefreshCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type FlyerMode = "promo" | "signup";

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

const LOCAL_STORAGE_KEY = "conf-flyer-studio-v1";

const DELEGATE_FLYER_REFERENCE =
  "Delegate card generator palette (red/white/blue): C8102E, 0B1E78, 0B4FD9";

const UNION_NAME = "Liberian Student Union in China";

const DEFAULT_STATE: FlyerStudioState = {
  mode: "promo",
  promo: {
    conferenceTag: "LSUIC 2026 Conference | Jinan",
    title: "What To Expect",
    subtitle: "20th Anniversary Experience | Target: 170 Delegates",
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
    conferenceTag: "LSUIC 2026 Delegate Registration",
    title: "Signup Is Open",
    subtitle: "Last year fee baseline: RMB 275 | Current target: 170 delegates",
    steps: [
      "Complete delegate signup form",
      "Pay conference fee using Financial Secretary channel",
      "Wait for payment verification approval",
    ],
    signupLink: "https://rhub.ekddigital.com/tools/conf/delegates/register",
    paymentInstruction: "Scan payment QR provided by Financial Secretary",
    verificationNote:
      "Only delegates with verified payment are marked complete in the system.",
    footer: "LSUIC 2026 | Register early and secure your place",
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
    mode: raw.mode === "signup" ? "signup" : "promo",
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

export function FlyerStudioShell() {
  const [state, setState] = useState<FlyerStudioState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
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
            Edit conference promo and signup flyers directly in the system.
          </p>
          <p className="text-xs text-muted-foreground">
            Visual reference: {DELEGATE_FLYER_REFERENCE}
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
            <CardTitle className="text-base">Flyer Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={state.mode === "promo" ? "default" : "outline"}
                  onClick={() => setMode("promo")}
                >
                  <Megaphone className="size-4" />
                  Promo Flyer
                </Button>
                <Button
                  type="button"
                  variant={state.mode === "signup" ? "default" : "outline"}
                  onClick={() => setMode("signup")}
                >
                  <QrCode className="size-4" />
                  Signup Flyer
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-[#0B1E78]/25 bg-[#0B4FD9]/5 p-3">
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
                Keep all conference flyer designs within Liberia red, white, and
                blue for consistency.
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
                        promo: { ...prev.promo, conferenceTag: e.target.value },
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
                        signup: { ...prev.signup, subtitle: e.target.value },
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
                        signup: { ...prev.signup, signupLink: e.target.value },
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
                Export JSON
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
                onChange={(e) => void importConfig(e.target.files?.[0] || null)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Flyer Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <div className="h-[560px] animate-pulse rounded-xl bg-muted" />
            ) : state.mode === "promo" ? (
              <div className="rounded-[30px] bg-linear-to-b from-[#071B4D] via-[#0B4FD9] to-[#0B1E78] p-3 shadow-xl">
                <div className="rounded-[26px] bg-white p-3">
                  <div className="overflow-hidden rounded-2xl border border-[#C4D4EE]">
                    <div className="flex items-center justify-between bg-[#0B1E78] px-3 py-2.5 text-white">
                      <p className="text-base font-bold leading-none">
                        {UNION_NAME}
                      </p>
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#C8A061] bg-white">
                        <Image
                          src="/conf/lsuic_logo.png"
                          alt="LSUIC logo"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </div>

                    <div className="relative h-40 sm:h-44">
                      <Image
                        src="/conf/assets/jinan_city/day_view_landscape.png"
                        alt="Jinan city backdrop"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-b from-[#021033]/35 via-[#021033]/58 to-[#021033]/78" />
                      <div className="relative flex h-full flex-col justify-end p-3 text-white">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/85">
                          {state.promo.conferenceTag}
                        </p>
                        <h2 className="text-[43px] leading-none font-extrabold tracking-tight">
                          {state.promo.title}
                        </h2>
                        <p className="mt-1 text-xs text-white/90">
                          {state.promo.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 overflow-hidden rounded-sm border border-[#D6DFF0]/70">
                    <div className="h-2 bg-[#C8102E]" />
                    <div className="h-1.5 bg-[#FFFFFF]" />
                    <div className="h-2 bg-[#0B1E78]" />
                  </div>

                  <div className="mt-3 rounded-2xl border border-[#C5D5EE] bg-[#F3F7FF] p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                      <div className="relative space-y-2.5 pl-4">
                        <div className="absolute top-0 left-0 h-full w-1.5 rounded-full bg-[#C8102E]" />
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0E2A76]">
                          Conference Highlights
                        </p>
                        {state.promo.highlights.map((item, index) => (
                          <div
                            key={`${item}-${index}`}
                            className="rounded-lg border border-[#CFDAEF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0E2A76]"
                          >
                            {item}
                          </div>
                        ))}
                        <div className="rounded-lg border border-[#C8102E]/30 bg-[#C8102E] px-2.5 py-2 text-xs text-white">
                          {state.promo.cta}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#CAD8EF] bg-[#EAF1FF] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#103580]">
                          Event Snapshot
                        </p>
                        <p className="mt-2 text-sm font-bold leading-tight text-[#0B1E78]">
                          {state.promo.footer}
                        </p>
                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#103580]">
                          City / Year
                        </p>
                        <p className="text-xl font-extrabold text-[#C8102E]">
                          JINAN 2026
                        </p>
                        <p className="text-[10px] font-semibold uppercase text-[#0B1E78]">
                          LSUIC National Conference
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-md border border-[#CBD7EE]">
                    <div className="bg-[#C8102E] px-2 py-1 text-center text-[10px] font-medium text-white">
                      Website: {state.promo.website}
                    </div>
                    <div className="bg-[#0B1E78] px-2 py-1 text-center text-[10px] font-semibold text-[#D7E4FF]">
                      Motto: {state.promo.motto}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[30px] bg-linear-to-b from-[#071B4D] via-[#0B4FD9] to-[#0B1E78] p-3 shadow-xl">
                <div className="rounded-[26px] bg-white p-3">
                  <div className="overflow-hidden rounded-2xl border border-[#C4D4EE]">
                    <div className="flex items-center justify-between bg-[#0B1E78] px-3 py-2.5 text-white">
                      <p className="text-base font-bold leading-none">
                        {UNION_NAME}
                      </p>
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#C8A061] bg-white">
                        <Image
                          src="/conf/lsuic_logo.png"
                          alt="LSUIC logo"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </div>

                    <div className="relative h-40 sm:h-44">
                      <Image
                        src="/conf/assets/hotel/conference_hall.jpg"
                        alt="Conference hall backdrop"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-b from-[#021033]/35 via-[#021033]/58 to-[#021033]/78" />
                      <div className="relative flex h-full flex-col justify-end p-3 text-white">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/85">
                          {state.signup.conferenceTag}
                        </p>
                        <h2 className="text-[42px] leading-none font-extrabold tracking-tight">
                          {state.signup.title}
                        </h2>
                        <p className="mt-1 text-xs text-white/90">
                          {state.signup.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 overflow-hidden rounded-sm border border-[#D6DFF0]/70">
                    <div className="h-2 bg-[#C8102E]" />
                    <div className="h-1.5 bg-[#FFFFFF]" />
                    <div className="h-2 bg-[#0B1E78]" />
                  </div>

                  <div className="mt-3 rounded-2xl border border-[#C5D5EE] bg-[#F3F7FF] p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_210px]">
                      <div className="relative space-y-2.5 pl-4">
                        <div className="absolute top-0 left-0 h-full w-1.5 rounded-full bg-[#C8102E]" />
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0E2A76]">
                          Registration Flow
                        </p>
                        {state.signup.steps.map((item, index) => (
                          <p
                            key={`${item}-${index}`}
                            className="text-xs font-medium text-[#0E2A76]"
                          >
                            {`${index + 1}. ${item}`}
                          </p>
                        ))}

                        <p className="rounded-md border border-[#0B1E78]/20 bg-white px-2 py-1.5 text-[11px] text-[#0B1E78]">
                          {state.signup.signupLink}
                        </p>
                        <p className="text-xs font-semibold text-[#0B1E78]">
                          {state.signup.paymentInstruction}
                        </p>
                        <p className="rounded-lg border border-[#C8102E]/30 bg-[#C8102E] px-2.5 py-2 text-xs text-white">
                          {state.signup.verificationNote}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#CAD8EF] bg-[#EAF1FF] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#103580]">
                          Scan To Complete
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="rounded-lg border border-[#0B1E78]/25 bg-white p-2 text-center text-[10px] font-semibold text-[#0B1E78]">
                            Signup QR Placeholder
                          </div>
                          <div className="rounded-lg border border-[#0B1E78]/25 bg-white p-2 text-center text-[10px] font-semibold text-[#0B1E78]">
                            Payment QR Placeholder
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-[#C8102E]">
                          {state.signup.footer}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-md border border-[#CBD7EE]">
                    <div className="bg-[#C8102E] px-2 py-1 text-center text-[10px] font-medium text-white">
                      Website: {state.signup.website}
                    </div>
                    <div className="bg-[#0B1E78] px-2 py-1 text-center text-[10px] font-semibold text-[#D7E4FF]">
                      Motto: {state.signup.motto}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
