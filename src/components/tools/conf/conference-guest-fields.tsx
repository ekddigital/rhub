"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADDITIONAL_GUEST_FEE_RMB,
  DEFAULT_GUEST_COUNT_FOR_GUEST_PACKAGE,
  MAX_CONFERENCE_GUESTS,
  additionalGuestFeeLineLabel,
  type ConferenceGuestRegistrationPayload,
} from "@/lib/conf/delegate-guests";
import { formatFeeRmb } from "@/lib/conf/fees";
import {
  delegateDocumentAcceptAttribute,
  DELEGATE_TRAVEL_UPLOAD_RULE_TEXT,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/file-upload-client";

type Props = {
  guestCount: number;
  guests: ConferenceGuestRegistrationPayload[];
  submitting?: boolean;
  fieldErrors?: Record<string, string>;
  onGuestCountChange: (count: number) => void;
  onGuestChange: (
    index: number,
    patch: Partial<ConferenceGuestRegistrationPayload>,
  ) => void;
  onFieldErrorClear?: (key: string) => void;
};

export function ConferenceGuestFields({
  guestCount,
  guests,
  submitting = false,
  fieldErrors = {},
  onGuestCountChange,
  onGuestChange,
  onFieldErrorClear,
}: Props) {
  const additionalFee = Math.max(0, guestCount - 1) * ADDITIONAL_GUEST_FEE_RMB;

  return (
    <div className="space-y-4 sm:col-span-2 rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="space-y-1">
        <Label>Conference Guests</Label>
        <p className="text-xs text-muted-foreground">
          Your package includes one guest at no extra charge. Each additional
          guest beyond the first adds {formatFeeRmb(ADDITIONAL_GUEST_FEE_RMB)}{" "}
          for an extra room. Enter passport details and upload travel documents
          for each guest you are bringing.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label className="shrink-0">Number of guests</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={
              submitting || guestCount <= DEFAULT_GUEST_COUNT_FOR_GUEST_PACKAGE
            }
            onClick={() =>
              onGuestCountChange(
                Math.max(DEFAULT_GUEST_COUNT_FOR_GUEST_PACKAGE, guestCount - 1),
              )
            }
            aria-label="Remove guest"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">
            {guestCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={submitting || guestCount >= MAX_CONFERENCE_GUESTS}
            onClick={() =>
              onGuestCountChange(Math.min(MAX_CONFERENCE_GUESTS, guestCount + 1))
            }
            aria-label="Add guest"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {additionalFee > 0 ? (
          <p className="text-xs font-medium text-foreground">
            {additionalGuestFeeLineLabel(guestCount)}:{" "}
            {formatFeeRmb(additionalFee)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            First guest included in your package price.
          </p>
        )}
      </div>

      {fieldErrors.guestCount && (
        <p className="text-xs text-red-600">{fieldErrors.guestCount}</p>
      )}

      <div className="space-y-6">
        {guests.map((guest, index) => (
          <div
            key={index}
            className="space-y-3 rounded-md border border-border/60 bg-background p-3"
          >
            <p className="text-sm font-semibold">Guest {index + 1}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Full name *</Label>
                <Input
                  value={guest.name}
                  onChange={(e) => {
                    onGuestChange(index, { name: e.target.value });
                    onFieldErrorClear?.(`guests.${index}.name`);
                  }}
                  placeholder="Guest full name (as on passport)"
                  disabled={submitting}
                  className={
                    fieldErrors[`guests.${index}.name`] ? "border-red-500" : ""
                  }
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
                    onGuestChange(index, {
                      passportNo: e.target.value.toUpperCase(),
                    });
                    onFieldErrorClear?.(`guests.${index}.passportNo`);
                  }}
                  disabled={submitting}
                  className={
                    fieldErrors[`guests.${index}.passportNo`]
                      ? "border-red-500"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Input
                  value={guest.nationality}
                  onChange={(e) => {
                    onGuestChange(index, { nationality: e.target.value });
                    onFieldErrorClear?.(`guests.${index}.nationality`);
                  }}
                  placeholder="e.g. Ghanaian, Chinese"
                  disabled={submitting}
                  className={
                    fieldErrors[`guests.${index}.nationality`]
                      ? "border-red-500"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Passport expiry (optional)</Label>
                <Input
                  type="date"
                  value={guest.passportExpiry}
                  onChange={(e) =>
                    onGuestChange(index, { passportExpiry: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["passportPhoto", "passport", "Passport photo page *"],
                  ["lastEntryStampPhoto", "entry-stamp", "Entry stamp (if applicable)"],
                  ["currentVisaPhoto", "visa", "Visa (if applicable)"],
                ] as const
              ).map(([field, kind, label]) => (
                <div key={field} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    type="file"
                    accept={delegateDocumentAcceptAttribute(kind)}
                    disabled={submitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      onGuestChange(index, { [field]: file });
                      onFieldErrorClear?.(`guests.${index}.${field}`);
                    }}
                    className={
                      fieldErrors[`guests.${index}.${field}`]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  <p className="text-[11px] text-muted-foreground leading-snug">
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

      <p className="text-[11px] text-muted-foreground">{DELEGATE_UPLOAD_CONVERSION_TIP}</p>
    </div>
  );
}
