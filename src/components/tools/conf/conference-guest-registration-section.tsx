"use client";

import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADDITIONAL_GUEST_FEE_RMB,
  calcAdditionalGuestFee,
  formatFeeRmb,
} from "@/lib/conf/fees";
import {
  additionalGuestFeeLineLabel,
  emptyConferenceGuestDetail,
  MAX_CONFERENCE_GUESTS,
  resizeConferenceGuestRegistrationPayload,
  type ConferenceGuestRegistrationPayload,
} from "@/lib/conf/delegate-guests";
import {
  delegateDocumentAcceptAttribute,
  DELEGATE_TRAVEL_UPLOAD_RULE_TEXT,
  validateDelegateUploadFile,
} from "@/lib/conf/file-upload-client";

export type GuestPhotoField =
  | "passportPhoto"
  | "lastEntryStampPhoto"
  | "currentVisaPhoto";

export type GuestFieldErrors = Record<string, string>;

type Props = {
  guestCount: number;
  guests: ConferenceGuestRegistrationPayload[];
  submitting?: boolean;
  fieldErrors?: GuestFieldErrors;
  onGuestCountChange: (count: number) => void;
  onGuestsChange: (guests: ConferenceGuestRegistrationPayload[]) => void;
  onFieldErrorsChange?: (errors: GuestFieldErrors) => void;
};

export function ConferenceGuestRegistrationSection({
  guestCount,
  guests,
  submitting = false,
  fieldErrors = {},
  onGuestCountChange,
  onGuestsChange,
  onFieldErrorsChange,
}: Props) {
  const additionalGuestFee = useMemo(
    () => calcAdditionalGuestFee(guestCount),
    [guestCount],
  );

  const updateGuest = (
    index: number,
    patch: Partial<ConferenceGuestRegistrationPayload>,
  ) => {
    const next = guests.map((guest, i) =>
      i === index ? { ...guest, ...patch } : guest,
    );
    onGuestsChange(next);
  };

  const clearFieldError = (key: string) => {
    if (!fieldErrors[key] || !onFieldErrorsChange) return;
    const next = { ...fieldErrors };
    delete next[key];
    onFieldErrorsChange(next);
  };

  const handleCountDelta = (delta: number) => {
    const nextCount = Math.min(
      MAX_CONFERENCE_GUESTS,
      Math.max(1, guestCount + delta),
    );
    onGuestCountChange(nextCount);
    onGuestsChange(resizeConferenceGuestRegistrationPayload(guests, nextCount));
  };

  return (
    <div className="space-y-4 rounded-md border border-border/70 bg-muted/20 p-4 sm:col-span-2">
      <div className="space-y-1">
        <Label>Guest count</Label>
        <p className="text-xs text-muted-foreground">
          Your package includes one guest at no extra charge. Each additional
          guest requires an extra room at {formatFeeRmb(ADDITIONAL_GUEST_FEE_RMB)}{" "}
          per guest.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleCountDelta(-1)}
          disabled={submitting || guestCount <= 1}
          aria-label="Remove guest"
        >
          <Minus className="size-4" />
        </Button>
        <span className="min-w-[2rem] text-center text-sm font-semibold">
          {guestCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleCountDelta(1)}
          disabled={submitting || guestCount >= MAX_CONFERENCE_GUESTS}
          aria-label="Add guest"
        >
          <Plus className="size-4" />
        </Button>
        {additionalGuestFee > 0 ? (
          <span className="text-xs text-muted-foreground">
            {additionalGuestFeeLineLabel(guestCount)}:{" "}
            <strong className="font-medium text-foreground">
              {formatFeeRmb(additionalGuestFee)}
            </strong>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            First guest included in package price.
          </span>
        )}
      </div>

      {guests.map((guest, index) => (
        <div
          key={`guest-${index}`}
          className="space-y-3 rounded-md border border-border/60 bg-background p-3"
        >
          <p className="text-sm font-semibold">Guest {index + 1}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Full name *</Label>
              <Input
                value={guest.name}
                onChange={(e) => {
                  updateGuest(index, { name: e.target.value });
                  clearFieldError(`guests.${index}.name`);
                }}
                className={fieldErrors[`guests.${index}.name`] ? "border-red-500" : ""}
                disabled={submitting}
              />
              {fieldErrors[`guests.${index}.name`] && (
                <p className="text-xs text-red-600">
                  {fieldErrors[`guests.${index}.name`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Passport number *</Label>
              <Input
                value={guest.passportNo}
                onChange={(e) => {
                  updateGuest(index, {
                    passportNo: e.target.value.toUpperCase(),
                  });
                  clearFieldError(`guests.${index}.passportNo`);
                }}
                className={
                  fieldErrors[`guests.${index}.passportNo`] ? "border-red-500" : ""
                }
                disabled={submitting}
              />
              {fieldErrors[`guests.${index}.passportNo`] && (
                <p className="text-xs text-red-600">
                  {fieldErrors[`guests.${index}.passportNo`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nationality *</Label>
              <Input
                value={guest.nationality}
                onChange={(e) => {
                  updateGuest(index, { nationality: e.target.value });
                  clearFieldError(`guests.${index}.nationality`);
                }}
                className={
                  fieldErrors[`guests.${index}.nationality`] ? "border-red-500" : ""
                }
                disabled={submitting}
              />
              {fieldErrors[`guests.${index}.nationality`] && (
                <p className="text-xs text-red-600">
                  {fieldErrors[`guests.${index}.nationality`]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Passport expiry (optional)</Label>
              <Input
                type="date"
                value={guest.passportExpiry}
                onChange={(e) => {
                  updateGuest(index, { passportExpiry: e.target.value });
                  clearFieldError(`guests.${index}.passportExpiry`);
                }}
                className={
                  fieldErrors[`guests.${index}.passportExpiry`]
                    ? "border-red-500"
                    : ""
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["passportPhoto", "passport", "Passport photo page"],
                ["lastEntryStampPhoto", "entry-stamp", "Entry stamp (if applicable)"],
                ["currentVisaPhoto", "visa", "Visa (if applicable)"],
              ] as const
            ).map(([field, kind, label]) => (
              <div key={field} className="space-y-2">
                <Label>
                  {label}
                  {field === "passportPhoto" ? " *" : ""}
                </Label>
                <Input
                  type="file"
                  accept={delegateDocumentAcceptAttribute(kind)}
                  disabled={submitting}
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    updateGuest(index, { [field]: file });
                    clearFieldError(`guests.${index}.${field}`);
                    if (file) {
                      const validation = await validateDelegateUploadFile(file, kind);
                      if (!validation.ok) {
                        onFieldErrorsChange?.({
                          ...fieldErrors,
                          [`guests.${index}.${field}`]: validation.error,
                        });
                      }
                    }
                  }}
                  className={
                    fieldErrors[`guests.${index}.${field}`] ? "border-red-500" : ""
                  }
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {DELEGATE_TRAVEL_UPLOAD_RULE_TEXT}
                </p>
                {fieldErrors[`guests.${index}.${field}`] && (
                  <p className="text-xs text-red-600">
                    {fieldErrors[`guests.${index}.${field}`]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function createInitialGuestRows(
  count: number,
): ConferenceGuestRegistrationPayload[] {
  return resizeConferenceGuestRegistrationPayload([], count);
}

type CreatedGuestRow = { id: string; sortOrder: number };

export async function uploadConferenceGuestDocuments(args: {
  confId: string;
  delegateId: string;
  guestRows: CreatedGuestRow[];
  guests: ConferenceGuestRegistrationPayload[];
}): Promise<void> {
  const { confId, delegateId, guestRows, guests } = args;
  for (let i = 0; i < guests.length; i++) {
    const guestId = guestRows[i]?.id;
    if (!guestId) continue;
    const guest = guests[i];
    const uploads: Array<{
      kind: "passport" | "entry-stamp" | "visa";
      file: File | null;
      label: string;
    }> = [
      { kind: "passport", file: guest.passportPhoto, label: "passport photo" },
      {
        kind: "entry-stamp",
        file: guest.lastEntryStampPhoto,
        label: "entry stamp",
      },
      { kind: "visa", file: guest.currentVisaPhoto, label: "visa" },
    ];
    for (const upload of uploads) {
      if (!upload.file) continue;
      const validation = await validateDelegateUploadFile(
        upload.file,
        upload.kind,
      );
      if (!validation.ok) {
        throw new Error(
          `Guest ${i + 1} ${upload.label}: ${validation.error} (File: ${upload.file.name})`,
        );
      }
      const fd = new FormData();
      fd.append("kind", upload.kind);
      fd.append("file", upload.file);
      const res = await fetch(
        `/api/conf/${confId}/delegates/${delegateId}/guests/${guestId}/documents`,
        { method: "POST", body: fd },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          payload.error ??
            `Failed to upload guest ${i + 1} ${upload.label} document`,
        );
      }
    }
  }
}

export { emptyConferenceGuestDetail };
