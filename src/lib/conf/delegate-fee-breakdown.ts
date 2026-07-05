import {
  CONFERENCE_JERSEY_PACKAGE_ID,
  calcAdditionalGuestFee,
  conferencePackageIncludesGuest,
  countConferenceJerseySets,
  getConferenceFeePackageById,
  sumConferenceOptionalAddOns,
} from "@/lib/conf/fees";
import { additionalGuestFeeLineLabel } from "@/lib/conf/delegate-guests";

/**
 * Required-package title aligned with registration / admin notifications:
 * "{category} - {label}" (e.g. "Member in Good Standing - Single Room").
 */
export function formatConferenceRequiredPackageLabel(
  feePackageId: string | null | undefined,
): string | null {
  if (feePackageId == null || !String(feePackageId).trim()) return null;
  const id = String(feePackageId).trim();
  const pkg = getConferenceFeePackageById(id);
  if (!pkg) return id;
  return `${pkg.category} - ${pkg.label}`;
}

export type ConferenceOptionalAddOnLine = {
  packageId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ConferenceDelegateFeeBreakdown = {
  requiredPackageLabel: string | null;
  /** Base conference package subtotal (excludes optional add-ons and guest fees). */
  corePackageSubtotal: number;
  /** ¥600 × (guestCount − 1) when guestCount > 1 on a +guest package. */
  additionalGuestFee: number;
  additionalGuestCount: number;
  additionalGuestFeeLabel: string | null;
  jersey: ConferenceOptionalAddOnLine | null;
  /** Non-jersey optional add-ons (e.g. achievers tables). */
  otherOptionalLines: ConferenceOptionalAddOnLine[];
  optionalAddOnsSubtotal: number;
  /** corePackageSubtotal + optionalAddOnsSubtotal + additionalGuestFee */
  computedDueTotal: number;
  /** True when stored feeAmount matches the package model within one fen. */
  reconcilesWithPackageModel: boolean;
};

/**
 * Derives display lines for finance / admin views using the same fee catalog
 * and add-on rules as registration (see `sumConferenceOptionalAddOns`, jersey
 * quantity via repeated `conference-jersey` ids).
 */
export function buildConferenceDelegateFeeBreakdown(args: {
  feePackageId: string | null | undefined;
  addOnPackageIds?: string[] | null;
  guestCount?: number | null;
  feeAmount: number | null | undefined;
}): ConferenceDelegateFeeBreakdown {
  const addOns = args.addOnPackageIds ?? [];
  const feePackageId = args.feePackageId?.trim() ?? null;
  const guestCount = Math.max(0, Math.floor(args.guestCount ?? 0));
  const storedRaw =
    typeof args.feeAmount === "number"
      ? args.feeAmount
      : Number(args.feeAmount ?? NaN);
  const stored = Number.isFinite(storedRaw) ? storedRaw : 0;

  const corePkg = feePackageId ? getConferenceFeePackageById(feePackageId) : null;
  const corePackageSubtotal =
    corePkg && !corePkg.isOptionalAddOn ? corePkg.price : 0;

  const requiredPackageLabel = formatConferenceRequiredPackageLabel(feePackageId);

  const jerseyPkg = getConferenceFeePackageById(CONFERENCE_JERSEY_PACKAGE_ID);
  const jerseyQty = countConferenceJerseySets(addOns);
  const jerseyUnit = jerseyPkg?.price ?? 0;
  const jerseySubtotal = jerseyQty * jerseyUnit;
  const jersey: ConferenceOptionalAddOnLine | null =
    jerseyQty > 0
      ? {
          packageId: CONFERENCE_JERSEY_PACKAGE_ID,
          label: jerseyPkg?.label ?? "Conference Jersey",
          quantity: jerseyQty,
          unitPrice: jerseyUnit,
          subtotal: jerseySubtotal,
        }
      : null;

  const nonJerseyUnique = [
    ...new Set(addOns.filter((id) => id !== CONFERENCE_JERSEY_PACKAGE_ID)),
  ];
  const otherOptionalLines: ConferenceOptionalAddOnLine[] = nonJerseyUnique.map(
    (id) => {
      const pkg = getConferenceFeePackageById(id);
      const unit = pkg?.price ?? 0;
      return {
        packageId: id,
        label: pkg?.label ?? id,
        quantity: 1,
        unitPrice: unit,
        subtotal: unit,
      };
    },
  );

  const optionalAddOnsSubtotal = sumConferenceOptionalAddOns(addOns);
  const additionalGuestFee =
    feePackageId && conferencePackageIncludesGuest(feePackageId)
      ? calcAdditionalGuestFee(guestCount)
      : 0;
  const computedDueTotal =
    corePackageSubtotal + optionalAddOnsSubtotal + additionalGuestFee;
  const reconcilesWithPackageModel =
    Math.abs(stored - computedDueTotal) < 0.015;

  return {
    requiredPackageLabel,
    corePackageSubtotal,
    additionalGuestFee,
    additionalGuestCount: guestCount,
    additionalGuestFeeLabel:
      additionalGuestFee > 0 ? additionalGuestFeeLineLabel(guestCount) : null,
    jersey,
    otherOptionalLines,
    optionalAddOnsSubtotal,
    computedDueTotal,
    reconcilesWithPackageModel,
  };
}
