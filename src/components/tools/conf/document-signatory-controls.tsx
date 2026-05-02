"use client";

import { Plus, Minus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SignatoryMode = "NONE" | "STANDARD" | "FUNDRAISING" | "CUSTOM";

export type SignatorySlot = {
  name: string;
  title: string;
  label: string;
  sig: string;
  sigScale: number;
};

export type SignatoryDraft = {
  signatoryMode: SignatoryMode;
  signatory1: SignatorySlot;
  signatory2: SignatorySlot;
  signatory3: SignatorySlot;
};

export type SignatoryMember = {
  id?: string;
  name: string;
  role?: string | null;
  title?: string | null;
  committeeScope?: string | null;
  city?: string | null;
  phone?: string | null;
};

export function createDefaultSignatoryDraft(): SignatoryDraft {
  return {
    signatoryMode: "NONE",
    signatory1: { name: "", title: "", label: "Signed", sig: "", sigScale: 1 },
    signatory2: {
      name: "",
      title: "",
      label: "Approved",
      sig: "",
      sigScale: 1,
    },
    signatory3: {
      name: "",
      title: "",
      label: "Attested",
      sig: "",
      sigScale: 1,
    },
  };
}

/**
 * Returns true when a SignatoryDraft has at least one populated signatory slot.
 * Use this instead of repeating the same check inline in every document shell.
 */
export function hasSignatories(draft: SignatoryDraft): boolean {
  return (
    draft.signatoryMode !== "NONE" &&
    [draft.signatory1, draft.signatory2, draft.signatory3].some(
      (s) => s.name.trim() || s.title.trim(),
    )
  );
}

function findByRole(members: SignatoryMember[], role: string) {
  return members.find((member) => (member.role || "").toUpperCase() === role);
}

function roleTitle(member: SignatoryMember | undefined, fallback: string) {
  return member?.title?.trim() || fallback;
}

function applyPreset(
  mode: SignatoryMode,
  members: SignatoryMember[],
  nationalPresidentName?: string,
): SignatoryDraft {
  if (mode === "NONE") {
    return createDefaultSignatoryDraft();
  }

  const chair = findByRole(members, "CHAIR");
  const viceChair = findByRole(members, "VICE_CHAIR");
  const secretary = findByRole(members, "SECRETARY");
  const base = createDefaultSignatoryDraft();
  base.signatoryMode = mode;

  if (mode === "STANDARD") {
    base.signatory1.name = secretary?.name ?? "";
    base.signatory1.title = roleTitle(secretary, "Conference Secretary");
    base.signatory2.name = viceChair?.name ?? "";
    base.signatory2.title = roleTitle(viceChair, "Conference Vice-Chair");
    base.signatory3.name = chair?.name ?? "";
    base.signatory3.title = roleTitle(chair, "Conference Chair");
    return base;
  }

  if (mode === "FUNDRAISING") {
    base.signatory1.name = secretary?.name ?? "";
    base.signatory1.title = roleTitle(secretary, "Conference Secretary");
    base.signatory2.name = chair?.name ?? "";
    base.signatory2.title = roleTitle(chair, "Conference Chair");
    base.signatory3.name = nationalPresidentName ?? "";
    base.signatory3.title = nationalPresidentName
      ? "National President (LSUIC)"
      : "";
    return base;
  }

  return {
    ...base,
    signatoryMode: "CUSTOM",
  };
}

type Props = {
  value: SignatoryDraft;
  onChange: (next: SignatoryDraft) => void;
  members?: SignatoryMember[];
  nationalPresidentName?: string;
};

export function DocumentSignatoryControls({
  value,
  onChange,
  members = [],
  nationalPresidentName,
}: Props) {
  const updateSlot = (
    key: "signatory1" | "signatory2" | "signatory3",
    patch: Partial<SignatorySlot>,
  ) => {
    onChange({
      ...value,
      [key]: { ...value[key], ...patch },
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Signatory Preset</Label>
        <div className="flex gap-1.5 flex-wrap">
          {(["NONE", "STANDARD", "FUNDRAISING", "CUSTOM"] as const).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  onChange(applyPreset(mode, members, nationalPresidentName))
                }
                className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                  value.signatoryMode === mode
                    ? "bg-[#002868] text-white border-[#002868]"
                    : "bg-background border-border hover:bg-muted/60"
                }`}
              >
                {mode === "NONE"
                  ? "None"
                  : mode === "STANDARD"
                    ? "Standard"
                    : mode === "FUNDRAISING"
                      ? "Fundraising"
                      : "Custom"}
              </button>
            ),
          )}
        </div>
      </div>

      {value.signatoryMode !== "NONE" && (
        <div className="space-y-3 pt-1">
          {(
            [
              { key: "signatory1", badge: "1" },
              { key: "signatory2", badge: "2" },
              { key: "signatory3", badge: "3" },
            ] as const
          ).map(({ key, badge }) => {
            const slot = value[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded-full bg-[#002868] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {badge}
                  </span>
                  <Input
                    placeholder="e.g. Signed / Approved / Attested"
                    className="h-7 text-xs font-semibold flex-1"
                    value={slot.label}
                    onChange={(e) => updateSlot(key, { label: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Full name"
                  className="h-7 text-sm"
                  value={slot.name}
                  onChange={(e) => updateSlot(key, { name: e.target.value })}
                />
                <Input
                  placeholder="Title / Role"
                  className="h-7 text-sm"
                  value={slot.title}
                  onChange={(e) => updateSlot(key, { title: e.target.value })}
                />
                <div className="space-y-1.5">
                  {slot.sig ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 rounded border border-border bg-white flex items-center justify-center py-1 px-2"
                        style={{ minHeight: 40 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.sig}
                          alt="sig preview"
                          style={{
                            height: Math.round(32 * (slot.sigScale ?? 1)),
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          className="size-6 rounded border border-border hover:bg-muted/60 flex items-center justify-center text-xs"
                          title="Increase signature size"
                          onClick={() =>
                            updateSlot(key, {
                              sigScale: Math.min(
                                3,
                                Math.round(
                                  ((slot.sigScale ?? 1) + 0.25) * 100,
                                ) / 100,
                              ),
                            })
                          }
                        >
                          <Plus className="size-3" />
                        </button>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {((slot.sigScale ?? 1) * 100).toFixed(0)}%
                        </span>
                        <button
                          type="button"
                          className="size-6 rounded border border-border hover:bg-muted/60 flex items-center justify-center text-xs"
                          title="Decrease signature size"
                          onClick={() =>
                            updateSlot(key, {
                              sigScale: Math.max(
                                0.25,
                                Math.round(
                                  ((slot.sigScale ?? 1) - 0.25) * 100,
                                ) / 100,
                              ),
                            })
                          }
                        >
                          <Minus className="size-3" />
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Remove signature"
                        onClick={() => updateSlot(key, { sig: "" })}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Upload className="size-3.5" />
                      Upload signature image
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            updateSlot(key, { sig: result });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
