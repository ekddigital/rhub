"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Check, FileText, ImageOff, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatFeeRmb,
  getConferenceFeeAccommodationMode,
  getConferenceFeePackageById,
  getConferenceFeePackageByPrice,
  getConferenceOptionalAddOnPackages,
  getConferenceRequiredFeePackages,
  CONFERENCE_JERSEY_PACKAGE_ID,
  MAX_CONFERENCE_JERSEY_SETS,
  countConferenceJerseySets,
  normalizeConferenceOptionalAddOnPackageIds,
  sumConferenceOptionalAddOns,
} from "@/lib/conf/fees";
import {
  validateDelegateUploadFile,
  delegateDocumentAcceptAttribute,
  DELEGATE_TRAVEL_UPLOAD_RULE_TEXT,
  DELEGATE_BOOKLET_UPLOAD_RULE_TEXT,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/file-upload-client";

export type DelegateRegistrationPayload = {
  name: string;
  province: string;
  passportNo: string;
  university: string;
  city: string;
  phone: string;
  wechat: string;
  email: string;
  gender: "MALE" | "FEMALE";
  attendanceIntent: "YES" | "NO" | "OTHER";
  travelAssistanceNeeded: "YES" | "NO" | "OTHER";
  schoolCommunicationNeeded: "YES" | "NO" | "OTHER";
  schoolCommunicationDetails: string;
  studyYear:
    | "BACHELOR_1"
    | "BACHELOR_2"
    | "BACHELOR_3"
    | "BACHELOR_4"
    | "GRADUATE_1"
    | "GRADUATE_2"
    | "GRADUATE_3"
    | "GRADUATE_4"
    | "OTHER";
  bringingForeignGuest: "YES" | "NO" | "OTHER";
  guestNationality: string;
  accommodationNeeded: "YES" | "NO" | "OTHER";
  dietaryNeeds: "YES" | "NO" | "OTHER";
  dietaryDetails: string;
  additionalComments: string;
  feePaid: boolean;
  feeAmount: number | null;
  feePackageId: string;
  addOnPackageIds: string[];
  amountPaid: number;
  roomPref: "PAIR" | "SINGLE";
  partnerClaimNote: string;
  passportPhoto: File | null;
  lastEntryStampPhoto: File | null;
  currentVisaPhoto: File | null;
  bookletPhoto: File | null;
  conferencePosition: string;
};

export type DelegatePhotoField =
  | "passportPhoto"
  | "lastEntryStampPhoto"
  | "currentVisaPhoto"
  | "bookletPhoto";

export type UploadFeedback = {
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  message?: string;
};

export type UploadedPhotoMeta = {
  fileName: string;
  /**
   * Preferred URL for opening the current file (e.g. authenticated
   * `/api/.../secure-document` route).
   */
  filePath: string;
  /**
   * Optional URL used only to infer raster vs PDF and to render a thumbnail
   * (typically the resolved CDN/asset URL returned by the delegate API).
   */
  previewSrc?: string | null;
};

function stripUrlHashQuery(url: string) {
  return url.split(/[#?]/)[0].toLowerCase();
}

function pathLooksPdf(url: string) {
  return stripUrlHashQuery(url).endsWith(".pdf");
}

function pathLooksRasterImage(url: string) {
  return /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(stripUrlHashQuery(url));
}

function isNavigableFileHref(href: string) {
  return href.startsWith("/") || /^https?:\/\//i.test(href);
}

function ExistingUploadedFileCallout({ meta }: { meta: UploadedPhotoMeta }) {
  const [imgFailed, setImgFailed] = useState(false);

  const isPdf =
    Boolean(meta.previewSrc && pathLooksPdf(meta.previewSrc)) ||
    pathLooksPdf(meta.filePath);

  const rasterUrl = (() => {
    if (isPdf) return undefined;
    for (const u of [meta.previewSrc, meta.filePath]) {
      if (typeof u === "string" && u.length > 0 && pathLooksRasterImage(u)) {
        return u;
      }
    }
    return undefined;
  })();

  const showRaster = Boolean(rasterUrl && !imgFailed);
  const showViewLink = isNavigableFileHref(meta.filePath);
  const placeholderIcon =
    imgFailed && rasterUrl ? (
      <ImageOff
        className="size-8 text-muted-foreground"
        aria-hidden
        strokeWidth={1.75}
      />
    ) : (
      <FileText
        className="size-8 text-muted-foreground"
        aria-hidden
        strokeWidth={1.75}
      />
    );

  return (
    <div
      className="mt-2 flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30"
      role="status"
    >
      <div className="flex h-20 w-22 shrink-0 items-center justify-center overflow-hidden rounded-md border border-emerald-200/80 bg-background/70 dark:border-emerald-800/80 dark:bg-background/40">
        {showRaster ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic CDN / asset URLs; onError fallback below
          <img
            src={rasterUrl}
            alt=""
            width={112}
            height={80}
            className="max-h-20 w-auto max-w-22 object-contain"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          placeholderIcon
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <Check className="size-3.5 shrink-0" aria-hidden strokeWidth={2.5} />
          File already on file
        </p>
        <p className="truncate text-xs text-foreground" title={meta.fileName}>
          {meta.fileName}
        </p>
        {showViewLink ? (
          <p>
            <a
              href={meta.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              View current file
            </a>
            <span className="sr-only"> (opens in a new tab)</span>
          </p>
        ) : null}
        <p className="text-[11px] leading-snug text-muted-foreground">
          Uploading a new file replaces this one.
        </p>
      </div>
    </div>
  );
}

export type DelegateRegistrationSnapshot = Omit<
  DelegateRegistrationPayload,
  "passportPhoto" | "lastEntryStampPhoto" | "currentVisaPhoto" | "bookletPhoto"
>;

/** Pre-populated field values for edit mode (files are not pre-populated). */
export type InitialFormValues = Partial<
  Omit<
    DelegateRegistrationPayload,
    | "passportPhoto"
    | "lastEntryStampPhoto"
    | "currentVisaPhoto"
    | "bookletPhoto"
  >
>;

const CUSTOM_CONFERENCE_ROLE = "__CUSTOM__";

const KNOWN_CONFERENCE_ROLES = [
  "Conference Chair",
  "Conference Vice-Chair",
  "Conference Secretary",
  "Media & Publicity Chair",
  "Cooking Committee Chair",
  "Sports Committee Chair",
  "Logistics Committee Chair",
  "Decoration Committee Chair",
  "Fundraising Committee Chair",
  "Member",
  "National President",
  "National Vice President",
  "National Secretary General",
  "National Deputy Secretary General",
  "National Financial Secretary",
  "National Treasurer",
  "National Chaplain General",
  "Senior Coordinator",
  "Province Coordinator",
  "City President",
  "Senior Adjudicator",
  "Adjudicator",
  "PPC Chair",
  "PPC Member",
  "PPA Chair",
  "PPA Member",
  "AEC Chair",
  "AEC Member",
  "WMF Chair",
  "WMF Member",
  "Guest Speaker",
  "Other",
] as const;

function isKnownConferenceRole(value: string): boolean {
  return KNOWN_CONFERENCE_ROLES.includes(
    value as (typeof KNOWN_CONFERENCE_ROLES)[number],
  );
}

function normalizeConferenceRole(value: string): string {
  if (value === "General Chairman") return "Conference Chair";
  if (value === "General Co-Chair" || value === "Conference Co-Chair") {
    return "Conference Vice-Chair";
  }
  if (value === "General Secretary") return "Conference Secretary";
  if (value === "PRO & Media" || value === "PRO and Media") {
    return "Media & Publicity Chair";
  }
  if (value === "Cooking Team Chair") return "Cooking Committee Chair";
  if (value === "Chair on Sports") return "Sports Committee Chair";
  if (value === "Chair on Logistics") return "Logistics Committee Chair";
  if (value === "Chair on Decoration") return "Decoration Committee Chair";
  if (value === "Fundraising Committee Chair") {
    return "Fundraising Committee Chair";
  }
  if (value === "Member, Cooking Team") return "Member";
  if (value === "Secretary General") return "National Secretary General";
  if (value === "Deputy Secretary General") {
    return "National Deputy Secretary General";
  }
  if (value === "Financial Secretary") return "National Financial Secretary";
  if (value === "Chaplain General") return "National Chaplain General";
  return value;
}

type Props = {
  submitting: boolean;
  submitLabel?: string;
  defaultFeeAmount?: number;
  /**
   * Pre-populate fields for edit mode. When provided, file uploads become
   * optional (the server keeps the existing files if none are supplied).
   */
  initialValues?: InitialFormValues;
  /**
   * When false, hides manager-only fields (feePaid).
   * Defaults to true to preserve existing behavior.
   */
  isManagerMode?: boolean;
  /**
   * Unique key for localStorage draft. Use delegateId for edit mode,
   * or a stable string like "new" for new registrations.
   */
  draftKey?: string;
  /**
   * Public registration: merge hub/committee hints into fields that are still empty
   * (runs after local draft restore; won't overwrite typed values).
   */
  accountPrefill?: Partial<
    Pick<
      DelegateRegistrationPayload,
      "name" | "email" | "phone" | "city" | "province"
    >
  > | null;
  /** When true, skips applying `accountPrefill` (e.g. registering on behalf of someone else). */
  skipAccountPrefill?: boolean;
  onSnapshotChange?: (snapshot: DelegateRegistrationSnapshot) => void;
  uploadedPhotoMeta?: Partial<Record<DelegatePhotoField, UploadedPhotoMeta>>;
  photoFieldErrors?: Partial<Record<DelegatePhotoField, string>>;
  photoUploadFeedback?: Partial<Record<DelegatePhotoField, UploadFeedback>>;
  onPhotoFileChange?: (field: DelegatePhotoField, file: File | null) => void;
  onCancel?: () => void;
  onSubmit: (payload: DelegateRegistrationPayload) => Promise<boolean>;
};

type FeeOption = {
  id: string;
  category: string;
  label: string;
  packageSummary: string;
  price: number;
};

function resolveInitialFeePackageId(
  feeOptions: FeeOption[],
  initialValues: InitialFormValues | undefined,
  defaultFeeAmount: number,
) {
  const byId =
    initialValues?.feePackageId != null
      ? feeOptions.find((option) => option.id === initialValues.feePackageId)
      : null;
  if (byId) return byId.id;

  const byAmount =
    initialValues?.feeAmount != null
      ? getConferenceFeePackageByPrice(initialValues.feeAmount)
      : null;
  if (byAmount && feeOptions.some((option) => option.id === byAmount.id)) {
    return byAmount.id;
  }

  const byDefault = getConferenceFeePackageByPrice(defaultFeeAmount);
  return byDefault?.id ?? feeOptions[0]?.id ?? "";
}

export function DelegateRegistrationForm({
  submitting,
  submitLabel = "Submit Registration",
  defaultFeeAmount = 250,
  initialValues,
  isManagerMode = true,
  draftKey,
  accountPrefill,
  skipAccountPrefill = false,
  onSnapshotChange,
  uploadedPhotoMeta,
  photoFieldErrors,
  photoUploadFeedback,
  onPhotoFileChange,
  onCancel,
  onSubmit,
}: Props) {
  const STORAGE_KEY = `conf-delegate-draft:${draftKey ?? "new"}`;
  const isEditMode = Boolean(initialValues);
  const initialConferencePosition = normalizeConferenceRole(
    initialValues?.conferencePosition ?? "",
  );

  const [name, setName] = useState(initialValues?.name ?? "");
  const [province, setProvince] = useState(initialValues?.province ?? "");
  const [passportNo, setPassportNo] = useState(initialValues?.passportNo ?? "");
  const [university, setUniversity] = useState(initialValues?.university ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [wechat, setWechat] = useState(initialValues?.wechat ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [gender, setGender] = useState<"MALE" | "FEMALE">(
    initialValues?.gender ?? "MALE",
  );
  const [attendanceIntent, setAttendanceIntent] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.attendanceIntent ?? "YES");
  const [travelAssistanceNeeded, setTravelAssistanceNeeded] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.travelAssistanceNeeded ?? "NO");
  const [schoolCommunicationNeeded, setSchoolCommunicationNeeded] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.schoolCommunicationNeeded ?? "NO");
  const [schoolCommunicationDetails, setSchoolCommunicationDetails] = useState(
    initialValues?.schoolCommunicationDetails ?? "",
  );
  const [studyYear, setStudyYear] = useState<
    | "BACHELOR_1"
    | "BACHELOR_2"
    | "BACHELOR_3"
    | "BACHELOR_4"
    | "GRADUATE_1"
    | "GRADUATE_2"
    | "GRADUATE_3"
    | "GRADUATE_4"
    | "OTHER"
  >(initialValues?.studyYear ?? "BACHELOR_1");
  const [bringingForeignGuest, setBringingForeignGuest] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.bringingForeignGuest ?? "NO");
  const [guestNationality, setGuestNationality] = useState(
    initialValues?.guestNationality ?? "",
  );
  const [accommodationNeeded, setAccommodationNeeded] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.accommodationNeeded ?? "NO");
  const [dietaryNeeds, setDietaryNeeds] = useState<"YES" | "NO" | "OTHER">(
    initialValues?.dietaryNeeds ?? "NO",
  );
  const [dietaryDetails, setDietaryDetails] = useState(
    initialValues?.dietaryDetails ?? "",
  );
  const [additionalComments, setAdditionalComments] = useState(
    initialValues?.additionalComments ?? "",
  );
  const feeOptions = useMemo(
    () => getConferenceRequiredFeePackages() as FeeOption[],
    [],
  );
  const addOnOptions = useMemo(
    () => getConferenceOptionalAddOnPackages() as FeeOption[],
    [],
  );
  const [selectedFeePackage, setSelectedFeePackage] = useState(
    resolveInitialFeePackageId(feeOptions, initialValues, defaultFeeAmount),
  );
  const [selectedAddOnPackageIds, setSelectedAddOnPackageIds] = useState<
    string[]
  >(
    normalizeConferenceOptionalAddOnPackageIds(
      initialValues?.addOnPackageIds ?? [],
    ),
  );
  const [feePaid, setFeePaid] = useState(initialValues?.feePaid ?? false);
  const [feeAmount, setFeeAmount] = useState(
    String(
      getConferenceFeePackageById(
        resolveInitialFeePackageId(feeOptions, initialValues, defaultFeeAmount),
      )?.price ??
        initialValues?.feeAmount ??
        defaultFeeAmount,
    ),
  );
  const [amountPaid, setAmountPaid] = useState(
    initialValues?.amountPaid != null ? String(initialValues.amountPaid) : "0",
  );
  const [roomPref, setRoomPref] = useState<"PAIR" | "SINGLE">(
    initialValues?.roomPref ?? "PAIR",
  );
  const [partnerClaimNote, setPartnerClaimNote] = useState(
    initialValues?.partnerClaimNote ?? "",
  );
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [lastEntryStampPhoto, setLastEntryStampPhoto] = useState<File | null>(
    null,
  );
  const [currentVisaPhoto, setCurrentVisaPhoto] = useState<File | null>(null);
  const [bookletPhoto, setBookletPhoto] = useState<File | null>(null);
  const [conferencePosition, setConferencePosition] = useState(
    initialConferencePosition,
  );
  const [conferencePositionSelect, setConferencePositionSelect] = useState(
    initialConferencePosition
      ? isKnownConferenceRole(initialConferencePosition)
        ? initialConferencePosition
        : CUSTOM_CONFERENCE_ROLE
      : "",
  );
  const [customConferenceRoles, setCustomConferenceRoles] = useState(
    initialConferencePosition &&
      !isKnownConferenceRole(initialConferencePosition)
      ? initialConferencePosition
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCredentialFileChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement>,
      fieldKey:
        | "passportPhoto"
        | "lastEntryStampPhoto"
        | "currentVisaPhoto"
        | "bookletPhoto",
      kind: "passport" | "entry-stamp" | "visa" | "booklet",
      setFile: (f: File | null) => void,
    ) => {
      const input = e.target;
      const next = input.files?.[0] ?? null;
      if (!next) {
        setFile(null);
        setFieldErrors((p) => ({ ...p, [fieldKey]: "" }));
        onPhotoFileChange?.(fieldKey, null);
        return;
      }
      const validation = validateDelegateUploadFile(next, kind);
      if (!validation.ok) {
        setFieldErrors((p) => ({ ...p, [fieldKey]: validation.error }));
        setFile(null);
        onPhotoFileChange?.(fieldKey, null);
        input.value = "";
        return;
      }
      setFieldErrors((p) => ({ ...p, [fieldKey]: "" }));
      setFile(next);
      onPhotoFileChange?.(fieldKey, next);
    },
    [onPhotoFileChange],
  );

  const registrationSnapshot = useMemo<DelegateRegistrationSnapshot>(
    () => ({
      name,
      province,
      passportNo,
      university,
      city,
      phone,
      wechat,
      email,
      gender,
      attendanceIntent,
      travelAssistanceNeeded,
      schoolCommunicationNeeded,
      schoolCommunicationDetails: schoolCommunicationDetails.trim(),
      studyYear,
      bringingForeignGuest,
      guestNationality: guestNationality.trim(),
      accommodationNeeded,
      dietaryNeeds,
      dietaryDetails: dietaryDetails.trim(),
      additionalComments: additionalComments.trim(),
      feePaid,
      feeAmount: Number(feeAmount) || 0,
      feePackageId: selectedFeePackage,
      addOnPackageIds: selectedAddOnPackageIds,
      amountPaid: amountPaid.trim() ? Number(amountPaid) : 0,
      roomPref,
      partnerClaimNote,
      conferencePosition: conferencePosition.trim(),
    }),
    [
      name,
      province,
      passportNo,
      university,
      city,
      phone,
      wechat,
      email,
      gender,
      attendanceIntent,
      travelAssistanceNeeded,
      schoolCommunicationNeeded,
      schoolCommunicationDetails,
      studyYear,
      bringingForeignGuest,
      guestNationality,
      accommodationNeeded,
      dietaryNeeds,
      dietaryDetails,
      additionalComments,
      feePaid,
      feeAmount,
      selectedFeePackage,
      selectedAddOnPackageIds,
      amountPaid,
      roomPref,
      partnerClaimNote,
      conferencePosition,
    ],
  );

  const resolvePhotoError = (field: DelegatePhotoField) =>
    fieldErrors[field] || photoFieldErrors?.[field] || "";

  const renderUploadedPreview = (field: DelegatePhotoField) => {
    const meta = uploadedPhotoMeta?.[field];
    if (!meta) return null;
    return (
      <ExistingUploadedFileCallout
        key={`${meta.filePath}\u0000${meta.previewSrc ?? ""}`}
        meta={meta}
      />
    );
  };

  const renderUploadFeedback = (field: DelegatePhotoField) => {
    const feedback = photoUploadFeedback?.[field];
    if (!feedback || feedback.status === "idle") return null;
    if (feedback.status === "uploading") {
      return (
        <div className="space-y-1">
          <p className="text-xs text-[#002868]">
            Uploading...{" "}
            {Math.max(0, Math.min(100, Math.round(feedback.progress)))}%
          </p>
          <div className="h-1.5 w-full rounded bg-[#002868]/15">
            <div
              className="h-full rounded bg-[#002868] transition-[width] duration-200"
              style={{
                width: `${Math.max(2, Math.min(100, Math.round(feedback.progress)))}%`,
              }}
            />
          </div>
        </div>
      );
    }
    if (feedback.status === "done") {
      return (
        <p className="text-xs text-emerald-700">
          {feedback.message || "Uploaded successfully."}
        </p>
      );
    }
    if (feedback.status === "error") {
      return (
        <p className="text-xs text-red-600">
          {feedback.message || "Upload failed for this file."}
        </p>
      );
    }
    return null;
  };

  const groupedRequiredFeeOptions = feeOptions.reduce<
    Record<string, FeeOption[]>
  >((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});
  const groupedAddOnOptions = addOnOptions.reduce<Record<string, FeeOption[]>>(
    (acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    },
    {},
  );

  const computeSelectedTotal = (corePackageId: string, addOnIds: string[]) => {
    const corePackage = feeOptions.find(
      (option) => option.id === corePackageId,
    );
    const corePrice = corePackage?.price ?? 0;
    return corePrice + sumConferenceOptionalAddOns(addOnIds);
  };

  const jerseyQuantity = useMemo(
    () => countConferenceJerseySets(selectedAddOnPackageIds),
    [selectedAddOnPackageIds],
  );

  const adjustJerseyQuantity = (delta: number) => {
    const nonJersey = selectedAddOnPackageIds.filter(
      (id) => id !== CONFERENCE_JERSEY_PACKAGE_ID,
    );
    const nextQty = Math.max(
      0,
      Math.min(MAX_CONFERENCE_JERSEY_SETS, jerseyQuantity + delta),
    );
    const next = normalizeConferenceOptionalAddOnPackageIds([
      ...nonJersey,
      ...Array.from({ length: nextQty }, () => CONFERENCE_JERSEY_PACKAGE_ID),
    ]);
    setSelectedAddOnPackageIds(next);
    setFeeAmount(String(computeSelectedTotal(selectedFeePackage, next)));
  };

  const applyPackageAccommodationMode = useCallback((packageId: string) => {
    const accommodationMode = getConferenceFeeAccommodationMode(packageId);
    if (accommodationMode === "SINGLE") {
      setRoomPref("SINGLE");
      setAccommodationNeeded("YES");
    } else if (accommodationMode === "PAIR") {
      setRoomPref("PAIR");
      setAccommodationNeeded("YES");
    } else if (accommodationMode === "NONE") {
      setRoomPref("SINGLE");
      setAccommodationNeeded("NO");
    }
  }, []);

  // Restore draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (typeof d.name === "string") setName(d.name);
      if (typeof d.province === "string") setProvince(d.province);
      if (typeof d.passportNo === "string") setPassportNo(d.passportNo);
      if (typeof d.university === "string") setUniversity(d.university);
      if (typeof d.city === "string") setCity(d.city);
      if (typeof d.phone === "string") setPhone(d.phone);
      if (typeof d.wechat === "string") setWechat(d.wechat);
      if (typeof d.email === "string") setEmail(d.email);
      if (d.gender === "MALE" || d.gender === "FEMALE") setGender(d.gender);
      if (
        d.attendanceIntent === "YES" ||
        d.attendanceIntent === "NO" ||
        d.attendanceIntent === "OTHER"
      )
        setAttendanceIntent(d.attendanceIntent);
      if (
        d.travelAssistanceNeeded === "YES" ||
        d.travelAssistanceNeeded === "NO" ||
        d.travelAssistanceNeeded === "OTHER"
      )
        setTravelAssistanceNeeded(d.travelAssistanceNeeded);
      if (
        d.schoolCommunicationNeeded === "YES" ||
        d.schoolCommunicationNeeded === "NO" ||
        d.schoolCommunicationNeeded === "OTHER"
      )
        setSchoolCommunicationNeeded(d.schoolCommunicationNeeded);
      if (typeof d.schoolCommunicationDetails === "string")
        setSchoolCommunicationDetails(d.schoolCommunicationDetails);
      if (
        [
          "BACHELOR_1",
          "BACHELOR_2",
          "BACHELOR_3",
          "BACHELOR_4",
          "GRADUATE_1",
          "GRADUATE_2",
          "GRADUATE_3",
          "GRADUATE_4",
          "OTHER",
        ].includes(d.studyYear as string)
      )
        setStudyYear(d.studyYear as typeof studyYear);
      if (
        d.bringingForeignGuest === "YES" ||
        d.bringingForeignGuest === "NO" ||
        d.bringingForeignGuest === "OTHER"
      )
        setBringingForeignGuest(d.bringingForeignGuest);
      if (typeof d.guestNationality === "string")
        setGuestNationality(d.guestNationality);
      if (
        d.accommodationNeeded === "YES" ||
        d.accommodationNeeded === "NO" ||
        d.accommodationNeeded === "OTHER"
      )
        setAccommodationNeeded(d.accommodationNeeded);
      if (
        d.dietaryNeeds === "YES" ||
        d.dietaryNeeds === "NO" ||
        d.dietaryNeeds === "OTHER"
      )
        setDietaryNeeds(d.dietaryNeeds);
      if (typeof d.dietaryDetails === "string")
        setDietaryDetails(d.dietaryDetails);
      if (typeof d.additionalComments === "string")
        setAdditionalComments(d.additionalComments);
      if (typeof d.feePaid === "boolean") setFeePaid(d.feePaid);
      if (
        typeof d.amountPaid === "string" ||
        typeof d.amountPaid === "number"
      ) {
        setAmountPaid(String(d.amountPaid));
      }
      if (typeof d.feePackageId === "string" && d.feePackageId.trim()) {
        const nextCorePackage = feeOptions.find(
          (item) => item.id === d.feePackageId,
        )
          ? d.feePackageId
          : (feeOptions[0]?.id ?? "");
        setSelectedFeePackage(nextCorePackage);
        applyPackageAccommodationMode(nextCorePackage);
      } else if (typeof d.feeAmount === "string") {
        const restoredPackage = getConferenceFeePackageByPrice(
          Number(d.feeAmount),
        );
        if (
          restoredPackage &&
          feeOptions.some((option) => option.id === restoredPackage.id)
        ) {
          setSelectedFeePackage(restoredPackage.id);
          applyPackageAccommodationMode(restoredPackage.id);
        }
      }
      if (Array.isArray(d.addOnPackageIds)) {
        setSelectedAddOnPackageIds(
          normalizeConferenceOptionalAddOnPackageIds(d.addOnPackageIds),
        );
      }
      if (typeof d.feeAmount === "string") setFeeAmount(d.feeAmount);
      if (d.roomPref === "PAIR" || d.roomPref === "SINGLE")
        setRoomPref(d.roomPref);
      if (typeof d.partnerClaimNote === "string")
        setPartnerClaimNote(d.partnerClaimNote);
      if (typeof d.conferencePosition === "string") {
        const restoredConferencePosition = normalizeConferenceRole(
          d.conferencePosition,
        );
        setConferencePosition(restoredConferencePosition);
        if (restoredConferencePosition.trim().length === 0) {
          setConferencePositionSelect("");
          setCustomConferenceRoles("");
        } else if (isKnownConferenceRole(restoredConferencePosition)) {
          setConferencePositionSelect(restoredConferencePosition);
          setCustomConferenceRoles("");
        } else {
          setConferencePositionSelect(CUSTOM_CONFERENCE_ROLE);
          setCustomConferenceRoles(restoredConferencePosition);
        }
      }
      if (typeof d.conferencePositionSelect === "string") {
        const restoredConferencePositionSelect = normalizeConferenceRole(
          d.conferencePositionSelect,
        );
        if (
          restoredConferencePositionSelect === "" ||
          restoredConferencePositionSelect === CUSTOM_CONFERENCE_ROLE ||
          isKnownConferenceRole(restoredConferencePositionSelect)
        ) {
          setConferencePositionSelect(restoredConferencePositionSelect);
        }
      }
      if (typeof d.customConferenceRoles === "string") {
        setCustomConferenceRoles(d.customConferenceRoles);
      }
      setDraftRestored(true);
    } catch {
      // ignore corrupt drafts
    }
  }, [STORAGE_KEY, applyPackageAccommodationMode, feeOptions]);

  useEffect(() => {
    if (isEditMode) return;
    if (skipAccountPrefill) return;
    const p = accountPrefill;
    if (!p) return;
    const merge = (prev: string, hint: string | undefined): string => {
      const t = hint?.trim();
      if (!t) return prev;
      return prev.trim() ? prev : t;
    };
    setName((prev) => merge(prev, p.name));
    setEmail((prev) => merge(prev, p.email));
    setPhone((prev) => merge(prev, p.phone));
    setCity((prev) => merge(prev, p.city));
    setProvince((prev) => merge(prev, p.province));
  }, [accountPrefill, skipAccountPrefill, isEditMode]);

  // Auto-save to localStorage (debounced 1.5 s)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        const draft = {
          name,
          province,
          passportNo,
          university,
          city,
          phone,
          wechat,
          email,
          gender,
          attendanceIntent,
          travelAssistanceNeeded,
          schoolCommunicationNeeded,
          schoolCommunicationDetails,
          studyYear,
          bringingForeignGuest,
          guestNationality,
          accommodationNeeded,
          dietaryNeeds,
          dietaryDetails,
          additionalComments,
          feePaid,
          feePackageId: selectedFeePackage,
          addOnPackageIds: selectedAddOnPackageIds,
          feeAmount,
          amountPaid,
          roomPref,
          partnerClaimNote,
          conferencePosition,
          conferencePositionSelect,
          customConferenceRoles,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        /* quota / SSR */
      }
    }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [
    STORAGE_KEY,
    name,
    province,
    passportNo,
    university,
    city,
    phone,
    wechat,
    email,
    gender,
    attendanceIntent,
    travelAssistanceNeeded,
    schoolCommunicationNeeded,
    schoolCommunicationDetails,
    studyYear,
    bringingForeignGuest,
    guestNationality,
    accommodationNeeded,
    dietaryNeeds,
    dietaryDetails,
    additionalComments,
    feePaid,
    selectedFeePackage,
    selectedAddOnPackageIds,
    amountPaid,
    feeAmount,
    roomPref,
    partnerClaimNote,
    conferencePosition,
    conferencePositionSelect,
    customConferenceRoles,
  ]);

  useEffect(() => {
    onSnapshotChange?.(registrationSnapshot);
  }, [onSnapshotChange, registrationSnapshot]);

  const resetForm = () => {
    setName(initialValues?.name ?? "");
    setProvince(initialValues?.province ?? "");
    setPassportNo(initialValues?.passportNo ?? "");
    setUniversity(initialValues?.university ?? "");
    setCity(initialValues?.city ?? "");
    setPhone(initialValues?.phone ?? "");
    setWechat(initialValues?.wechat ?? "");
    setEmail(initialValues?.email ?? "");
    setGender(initialValues?.gender ?? "MALE");
    setAttendanceIntent(initialValues?.attendanceIntent ?? "YES");
    setTravelAssistanceNeeded(initialValues?.travelAssistanceNeeded ?? "NO");
    setSchoolCommunicationNeeded(
      initialValues?.schoolCommunicationNeeded ?? "NO",
    );
    setSchoolCommunicationDetails(
      initialValues?.schoolCommunicationDetails ?? "",
    );
    setStudyYear(initialValues?.studyYear ?? "BACHELOR_1");
    setBringingForeignGuest(initialValues?.bringingForeignGuest ?? "NO");
    setGuestNationality(initialValues?.guestNationality ?? "");
    setAccommodationNeeded(initialValues?.accommodationNeeded ?? "NO");
    setDietaryNeeds(initialValues?.dietaryNeeds ?? "NO");
    setDietaryDetails(initialValues?.dietaryDetails ?? "");
    setAdditionalComments(initialValues?.additionalComments ?? "");
    setFeePaid(initialValues?.feePaid ?? false);
    const resetFeePackageId = resolveInitialFeePackageId(
      feeOptions,
      initialValues,
      defaultFeeAmount,
    );
    setSelectedFeePackage(resetFeePackageId);
    applyPackageAccommodationMode(resetFeePackageId);
    setSelectedAddOnPackageIds(
      normalizeConferenceOptionalAddOnPackageIds(
        initialValues?.addOnPackageIds ?? [],
      ),
    );
    setFeeAmount(
      String(
        initialValues?.feeAmount ??
          computeSelectedTotal(
            resetFeePackageId,
            normalizeConferenceOptionalAddOnPackageIds(
              initialValues?.addOnPackageIds ?? [],
            ),
          ) ??
          defaultFeeAmount,
      ),
    );
    setAmountPaid(
      initialValues?.amountPaid != null
        ? String(initialValues.amountPaid)
        : "0",
    );
    setRoomPref(initialValues?.roomPref ?? "PAIR");
    setPartnerClaimNote(initialValues?.partnerClaimNote ?? "");
    setPassportPhoto(null);
    setLastEntryStampPhoto(null);
    setCurrentVisaPhoto(null);
    setBookletPhoto(null);
    const resetConferencePosition = normalizeConferenceRole(
      initialValues?.conferencePosition ?? "",
    );
    setConferencePosition(resetConferencePosition);
    if (!resetConferencePosition.trim()) {
      setConferencePositionSelect("");
      setCustomConferenceRoles("");
    } else if (isKnownConferenceRole(resetConferencePosition)) {
      setConferencePositionSelect(resetConferencePosition);
      setCustomConferenceRoles("");
    } else {
      setConferencePositionSelect(CUSTOM_CONFERENCE_ROLE);
      setCustomConferenceRoles(resetConferencePosition);
    }
    setError(null);
    setFieldErrors({});
    setDraftRestored(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const selectedFee =
    feeOptions.find((option) => option.id === selectedFeePackage) ?? null;
  const selectedAddOnsTotal = sumConferenceOptionalAddOns(
    selectedAddOnPackageIds,
  );
  const totalSelectedFee = (selectedFee?.price ?? 0) + selectedAddOnsTotal;

  const handleSubmit = async () => {
    // In edit mode, photos are optional (existing files are kept server-side)
    const requirePhotos = !isEditMode;
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Full name is required.";
    if (!province.trim()) errs.province = "Province is required.";
    if (!city.trim()) errs.city = "City is required.";
    if (!phone.trim()) errs.phone = "Phone number is required.";
    if (!wechat.trim()) errs.wechat = "WeChat ID is required.";
    if (!email.trim()) errs.email = "Email address is required.";
    if (!passportNo.trim()) errs.passportNo = "Passport number is required.";
    if (!university.trim()) errs.university = "University is required.";
    if (requirePhotos && !passportPhoto)
      errs.passportPhoto = "Passport photo page is required.";
    if (requirePhotos && !lastEntryStampPhoto)
      errs.lastEntryStampPhoto = "Last entry stamp page is required.";
    if (requirePhotos && !currentVisaPhoto)
      errs.currentVisaPhoto = "Current visa page is required.";
    if (requirePhotos && !bookletPhoto)
      errs.bookletPhoto = "Conference booklet photo is required.";
    if (bringingForeignGuest === "YES" && !guestNationality.trim())
      errs.guestNationality =
        "Guest nationality is required when bringing a foreign guest.";
    if (
      schoolCommunicationNeeded === "YES" &&
      !schoolCommunicationDetails.trim()
    )
      errs.schoolCommunicationDetails =
        "Please provide details for school/supervisor communication.";
    if (dietaryNeeds === "YES" && !dietaryDetails.trim())
      errs.dietaryDetails = "Please describe your dietary requirements.";
    if (
      conferencePositionSelect === CUSTOM_CONFERENCE_ROLE &&
      !customConferenceRoles.trim()
    ) {
      errs.conferencePosition =
        "Enter at least one custom committee role, or choose a listed role.";
    }

    const validateSelectedFile = (
      field:
        | "passportPhoto"
        | "lastEntryStampPhoto"
        | "currentVisaPhoto"
        | "bookletPhoto",
      kind: "passport" | "entry-stamp" | "visa" | "booklet",
      file: File | null,
    ) => {
      if (!file) return;
      const validation = validateDelegateUploadFile(file, kind);
      if (!validation.ok) {
        errs[field] = validation.error;
      }
    };

    validateSelectedFile("passportPhoto", "passport", passportPhoto);
    validateSelectedFile(
      "lastEntryStampPhoto",
      "entry-stamp",
      lastEntryStampPhoto,
    );
    validateSelectedFile("currentVisaPhoto", "visa", currentVisaPhoto);
    validateSelectedFile("bookletPhoto", "booklet", bookletPhoto);

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(
        `Please fix ${Object.keys(errs).length} field${Object.keys(errs).length > 1 ? "s" : ""} below.`,
      );
      return;
    }

    setFieldErrors({});
    setError(null);

    const selectedFee = feeOptions.find(
      (option) => option.id === selectedFeePackage,
    );

    if (!selectedFee) {
      setError("Please select a conference fee package.");
      return;
    }

    const finalFeeAmount =
      selectedFee.price + sumConferenceOptionalAddOns(selectedAddOnPackageIds);
    const parsedAmountPaid = amountPaid.trim() ? Number(amountPaid) : 0;

    if (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid < 0) {
      setError("Amount already paid must be a valid number.");
      return;
    }

    if (parsedAmountPaid > finalFeeAmount) {
      setError("Amount already paid cannot exceed the selected package fee.");
      return;
    }

    setFeeAmount(String(finalFeeAmount));
    setAmountPaid(String(parsedAmountPaid));

    try {
      const submitted = await onSubmit({
        name,
        province,
        passportNo,
        university,
        city,
        phone,
        wechat,
        email,
        gender,
        attendanceIntent,
        travelAssistanceNeeded,
        schoolCommunicationNeeded,
        schoolCommunicationDetails: schoolCommunicationDetails.trim(),
        studyYear,
        bringingForeignGuest,
        guestNationality: guestNationality.trim(),
        accommodationNeeded,
        dietaryNeeds,
        dietaryDetails: dietaryDetails.trim(),
        additionalComments: additionalComments.trim(),
        feePaid,
        feePackageId: selectedFee.id,
        addOnPackageIds: selectedAddOnPackageIds,
        feeAmount: finalFeeAmount,
        amountPaid: parsedAmountPaid,
        roomPref,
        partnerClaimNote,
        passportPhoto,
        lastEntryStampPhoto,
        currentVisaPhoto,
        bookletPhoto,
        conferencePosition: conferencePosition.trim(),
      });

      // In edit mode the parent handles closing the form; only reset on fresh creation.
      if (submitted) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setDraftRestored(false);
      }
      if (submitted && !isEditMode) {
        resetForm();
      }
    } catch {
      setError("Submission failed. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {draftRestored && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          <span>
            Draft restored on this device (not on the server). Your in-progress
            answers have been recovered.
          </span>
          <button
            type="button"
            className="ml-4 shrink-0 text-xs underline opacity-70 hover:opacity-100"
            onClick={() => {
              resetForm();
            }}
          >
            Discard draft
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>1. Full Name (as in passport) *</Label>
          <Input
            placeholder="Enter full legal name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldErrors((p) => ({ ...p, name: "" }));
            }}
            className={fieldErrors.name ? "border-red-500" : ""}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>2. Gender *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={gender}
            onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>3. WeChat ID *</Label>
          <Input
            placeholder="WeChat ID"
            value={wechat}
            onChange={(e) => {
              setWechat(e.target.value);
              setFieldErrors((p) => ({ ...p, wechat: "" }));
            }}
            className={fieldErrors.wechat ? "border-red-500" : ""}
          />
          {fieldErrors.wechat && (
            <p className="text-xs text-red-600">{fieldErrors.wechat}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>4. Phone Number *</Label>
          <Input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setFieldErrors((p) => ({ ...p, phone: "" }));
            }}
            className={fieldErrors.phone ? "border-red-500" : ""}
          />
          {fieldErrors.phone && (
            <p className="text-xs text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>5. Province *</Label>
          <Input
            placeholder="Current province"
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setFieldErrors((p) => ({ ...p, province: "" }));
            }}
            className={fieldErrors.province ? "border-red-500" : ""}
          />
          {fieldErrors.province && (
            <p className="text-xs text-red-600">{fieldErrors.province}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>6. City *</Label>
          <Input
            placeholder="Current city"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setFieldErrors((p) => ({ ...p, city: "" }));
            }}
            className={fieldErrors.city ? "border-red-500" : ""}
          />
          {fieldErrors.city && (
            <p className="text-xs text-red-600">{fieldErrors.city}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>7. Are you planning to attend the conference? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={attendanceIntent}
            onChange={(e) =>
              setAttendanceIntent(e.target.value as "YES" | "NO" | "OTHER")
            }
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>8. Do you need assistance with travel arrangements? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={travelAssistanceNeeded}
            onChange={(e) =>
              setTravelAssistanceNeeded(
                e.target.value as "YES" | "NO" | "OTHER",
              )
            }
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>
            9. Would you need union communication with your school/supervisor? *
          </Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={schoolCommunicationNeeded}
            onChange={(e) =>
              setSchoolCommunicationNeeded(
                e.target.value as "YES" | "NO" | "OTHER",
              )
            }
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>10. Current Year of Study *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={studyYear}
            onChange={(e) =>
              setStudyYear(
                e.target.value as
                  | "BACHELOR_1"
                  | "BACHELOR_2"
                  | "BACHELOR_3"
                  | "BACHELOR_4"
                  | "GRADUATE_1"
                  | "GRADUATE_2"
                  | "GRADUATE_3"
                  | "GRADUATE_4"
                  | "OTHER",
              )
            }
          >
            <option value="BACHELOR_1">Bachelor 1st Year</option>
            <option value="BACHELOR_2">Bachelor 2nd Year</option>
            <option value="BACHELOR_3">Bachelor 3rd Year</option>
            <option value="BACHELOR_4">Bachelor 4th Year</option>
            <option value="GRADUATE_1">Graduate 1st Year</option>
            <option value="GRADUATE_2">Graduate 2nd Year</option>
            <option value="GRADUATE_3">Graduate 3rd Year</option>
            <option value="GRADUATE_4">Graduate 4th Year</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>11. Do you hold any official LSUIC position? (optional)</Label>
          <p className="text-xs text-muted-foreground">
            If you hold a leadership or committee role, selecting it helps place
            you in the correct section of the conference booklet.
          </p>
          <select
            className={`flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs ${
              fieldErrors.conferencePosition ? "border-red-500" : ""
            }`}
            value={conferencePositionSelect}
            onChange={(e) => {
              const value = e.target.value;
              setConferencePositionSelect(value);
              if (value === CUSTOM_CONFERENCE_ROLE) {
                setConferencePosition(customConferenceRoles.trim());
              } else {
                setConferencePosition(value);
              }
              if (fieldErrors.conferencePosition) {
                setFieldErrors((p) => ({ ...p, conferencePosition: "" }));
              }
            }}
          >
            <option value="">None — Regular Delegate</option>
            <optgroup label="Conference Committee">
              <option value="Conference Chair">Conference Chair</option>
              <option value="Conference Vice-Chair">
                Conference Vice-Chair
              </option>
              <option value="Conference Secretary">Conference Secretary</option>
              <option value="Media &amp; Publicity Chair">
                Media &amp; Publicity Chair
              </option>
              <option value="Cooking Committee Chair">
                Cooking Committee Chair
              </option>
              <option value="Sports Committee Chair">
                Sports Committee Chair
              </option>
              <option value="Logistics Committee Chair">
                Logistics Committee Chair
              </option>
              <option value="Decoration Committee Chair">
                Decoration Committee Chair
              </option>
              <option value="Fundraising Committee Chair">
                Fundraising Committee Chair
              </option>
              <option value="Member">Member</option>
            </optgroup>
            <optgroup label="LSUIC Membership">
              <option value="Member">Member (LSUIC)</option>
            </optgroup>
            <optgroup label="NEC Executive">
              <option value="National President">National President</option>
              <option value="National Vice President">
                National Vice President
              </option>
              <option value="National Secretary General">
                National Secretary General
              </option>
              <option value="National Deputy Secretary General">
                National Deputy Secretary General
              </option>
              <option value="National Financial Secretary">
                National Financial Secretary
              </option>
              <option value="National Treasurer">National Treasurer</option>
              <option value="National Chaplain General">
                National Chaplain General
              </option>
            </optgroup>
            <optgroup label="Council of Coordinators">
              <option value="Senior Coordinator">Senior Coordinator</option>
              <option value="Province Coordinator">Province Coordinator</option>
            </optgroup>
            <optgroup label="City Leadership">
              <option value="City President">City President</option>
            </optgroup>
            <optgroup label="Judicial Board">
              <option value="Senior Adjudicator">Senior Adjudicator</option>
              <option value="Adjudicator">Adjudicator</option>
            </optgroup>
            <optgroup label="Planning &amp; Program Committee (PPC)">
              <option value="PPC Chair">PPC Chair</option>
              <option value="PPC Member">PPC Member</option>
            </optgroup>
            <optgroup label="Press &amp; Public Affairs (PPA)">
              <option value="PPA Chair">PPA Chair</option>
              <option value="PPA Member">PPA Member</option>
            </optgroup>
            <optgroup label="Academic Excellence Committee (AEC)">
              <option value="AEC Chair">AEC Chair</option>
              <option value="AEC Member">AEC Member</option>
            </optgroup>
            <optgroup label="Ways, Means &amp; Finance Committee (WMF)">
              <option value="WMF Chair">WMF Chair</option>
              <option value="WMF Member">WMF Member</option>
            </optgroup>
            <optgroup label="Special">
              <option value="Guest Speaker">
                Guest Speaker / Special Invitee
              </option>
              <option value="Other">Other (describe in comments)</option>
            </optgroup>
            <optgroup label="Manual Entry">
              <option value={CUSTOM_CONFERENCE_ROLE}>
                Custom role(s) — type manually below
              </option>
            </optgroup>
          </select>
          {fieldErrors.conferencePosition && (
            <p className="text-xs text-red-600">
              {fieldErrors.conferencePosition}
            </p>
          )}
          {conferencePositionSelect === CUSTOM_CONFERENCE_ROLE && (
            <div className="space-y-2 rounded-md border border-border/70 p-3">
              <Label>Custom Role(s)</Label>
              <Input
                placeholder="e.g. Conference Chair, Conference Secretary"
                value={customConferenceRoles}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomConferenceRoles(value);
                  setConferencePosition(value);
                  if (fieldErrors.conferencePosition) {
                    setFieldErrors((p) => ({ ...p, conferencePosition: "" }));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                For participants serving in multiple roles, separate roles with
                commas.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>12. Will you bring someone from another country? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={bringingForeignGuest}
            onChange={(e) => {
              const v = e.target.value as "YES" | "NO" | "OTHER";
              setBringingForeignGuest(v);
              if (v === "NO") {
                setGuestNationality("");
              }
            }}
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>13. Do you need accommodation during the conference? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={accommodationNeeded}
            onChange={(e) =>
              setAccommodationNeeded(e.target.value as "YES" | "NO" | "OTHER")
            }
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>
            14. Do you have special dietary requirements or food allergies? *
          </Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={dietaryNeeds}
            onChange={(e) =>
              setDietaryNeeds(e.target.value as "YES" | "NO" | "OTHER")
            }
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((p) => ({ ...p, email: "" }));
            }}
            className={fieldErrors.email ? "border-red-500" : ""}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Passport Number *</Label>
          <Input
            placeholder="Passport number"
            value={passportNo}
            onChange={(e) => {
              setPassportNo(e.target.value.toUpperCase());
              setFieldErrors((p) => ({ ...p, passportNo: "" }));
            }}
            className={fieldErrors.passportNo ? "border-red-500" : ""}
          />
          {fieldErrors.passportNo && (
            <p className="text-xs text-red-600">{fieldErrors.passportNo}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>University *</Label>
          <Input
            placeholder="Current university"
            value={university}
            onChange={(e) => {
              setUniversity(e.target.value);
              setFieldErrors((p) => ({ ...p, university: "" }));
            }}
            className={fieldErrors.university ? "border-red-500" : ""}
          />
          {fieldErrors.university && (
            <p className="text-xs text-red-600">{fieldErrors.university}</p>
          )}
        </div>

        {bringingForeignGuest !== "NO" && (
        <div className="space-y-2">
          <Label>
            Guest nationality
            {bringingForeignGuest === "YES" ? " (required)" : " (optional)"}
          </Label>
          <p className="text-xs text-muted-foreground">
            Only if you answered &quot;Yes&quot; or &quot;Other&quot; to bringing someone from
            another country (question 12).
          </p>
          <Input
            placeholder="e.g. Ghanaian, Chinese, etc."
            value={guestNationality}
            onChange={(e) => {
              setGuestNationality(e.target.value);
              setFieldErrors((p) => ({ ...p, guestNationality: "" }));
            }}
            className={fieldErrors.guestNationality ? "border-red-500" : ""}
          />
          {fieldErrors.guestNationality && (
            <p className="text-xs text-red-600">
              {fieldErrors.guestNationality}
            </p>
          )}
        </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label>Conference Registration Package (Required) *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={selectedFeePackage}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedFeePackage(value);
              const selected = feeOptions.find((option) => option.id === value);
              if (selected) {
                setFeeAmount(
                  String(computeSelectedTotal(value, selectedAddOnPackageIds)),
                );
                applyPackageAccommodationMode(value);
              }
            }}
          >
            <option value="">Select a package</option>
            {Object.entries(groupedRequiredFeeOptions).map(
              ([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} - {formatFeeRmb(item.price)}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
          {selectedFeePackage && (
            <p className="text-xs text-muted-foreground">
              Required package total: {formatFeeRmb(selectedFee?.price ?? 0)}
            </p>
          )}
          {(() => {
            const mode = getConferenceFeeAccommodationMode(selectedFeePackage);
            if (mode === "SINGLE") {
              return (
                <p className="text-xs text-muted-foreground">
                  This package enforces single-room accommodation.
                </p>
              );
            }
            if (mode === "PAIR") {
              return (
                <p className="text-xs text-muted-foreground">
                  This package uses shared-room pairing.
                </p>
              );
            }
            if (mode === "NONE") {
              return (
                <p className="text-xs text-muted-foreground">
                  This package does not include accommodation.
                </p>
              );
            }
            return null;
          })()}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Optional Add-ons (Conference Jersey and below)</Label>
          <p className="text-xs text-muted-foreground">
            Add achievers dinner tables and as many{" "}
            <strong className="font-medium text-foreground">jersey sets</strong>{" "}
            as you need — each set is male + female. Use + / − to include extras
            for family or friends.
          </p>
          <div className="space-y-2 rounded-md border border-border/70 p-3">
            {Object.entries(groupedAddOnOptions).map(([category, items]) => (
              <div key={category} className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {category}
                </p>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    if (item.id === CONFERENCE_JERSEY_PACKAGE_ID) {
                      const lineTotal = item.price * jerseyQuantity;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-md border border-border/60 px-2 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-muted-foreground leading-snug">
                              {formatFeeRmb(item.price)} per set. Quantity =
                              number of male+female sets ordered (max{" "}
                              {MAX_CONFERENCE_JERSEY_SETS}).
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="shrink-0"
                              aria-label="Decrease jersey sets"
                              disabled={jerseyQuantity <= 0 || submitting}
                              onClick={() => adjustJerseyQuantity(-1)}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                              {jerseyQuantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="shrink-0"
                              aria-label="Increase jersey sets"
                              disabled={
                                jerseyQuantity >= MAX_CONFERENCE_JERSEY_SETS ||
                                submitting
                              }
                              onClick={() => adjustJerseyQuantity(1)}
                            >
                              <Plus className="size-4" />
                            </Button>
                            <span className="ml-1 tabular-nums text-muted-foreground">
                              {jerseyQuantity > 0
                                ? formatFeeRmb(lineTotal)
                                : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const checked = selectedAddOnPackageIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-start gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selectedAddOnPackageIds.filter(
                                  (id) => id !== item.id,
                                )
                              : [...selectedAddOnPackageIds, item.id];
                            const normalized =
                              normalizeConferenceOptionalAddOnPackageIds(next);
                            setSelectedAddOnPackageIds(normalized);
                            setFeeAmount(
                              String(
                                computeSelectedTotal(
                                  selectedFeePackage,
                                  normalized,
                                ),
                              ),
                            );
                          }}
                          className="mt-0.5"
                          disabled={submitting}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{item.label}</span>
                          <span className="ml-1 text-muted-foreground">
                            ({formatFeeRmb(item.price)})
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Optional add-ons total: {formatFeeRmb(selectedAddOnsTotal)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Amount Already Paid (RMB)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Enter amount already paid"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Remaining Balance</Label>
          <div className="flex h-9 items-center rounded-md border border-border bg-muted/30 px-3 text-sm font-medium">
            {selectedFeePackage
              ? formatFeeRmb(
                  Math.max(
                    totalSelectedFee -
                      (amountPaid.trim() ? Number(amountPaid) : 0),
                    0,
                  ),
                )
              : "Select a package first"}
          </div>
        </div>

        {isManagerMode && (
          <div className="space-y-2">
            <Label>Completed Conference Payment? *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
              value={feePaid ? "YES" : "NO"}
              onChange={(e) => setFeePaid(e.target.value === "YES")}
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Room Preference</Label>
          {(() => {
            const mode = getConferenceFeeAccommodationMode(selectedFeePackage);
            if (mode === "SINGLE") {
              return (
                <p className="text-xs text-muted-foreground">
                  Locked by package: Single room.
                </p>
              );
            }
            if (mode === "PAIR") {
              return (
                <p className="text-xs text-muted-foreground">
                  Locked by package: Shared room.
                </p>
              );
            }
            if (mode === "NONE") {
              return (
                <p className="text-xs text-muted-foreground">
                  No room selection needed for this package.
                </p>
              );
            }
            return null;
          })()}
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-xs"
            value={roomPref}
            onChange={(e) => setRoomPref(e.target.value as "PAIR" | "SINGLE")}
            disabled={Boolean(
              getConferenceFeeAccommodationMode(selectedFeePackage),
            )}
          >
            <option value="PAIR">Pair room (2 people)</option>
            <option value="SINGLE">Single room request</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>9 Details (required if question 9 is Yes)</Label>
          <Textarea
            placeholder="Explain the communication support you need from the union"
            value={schoolCommunicationDetails}
            onChange={(e) => {
              setSchoolCommunicationDetails(e.target.value);
              setFieldErrors((p) => ({ ...p, schoolCommunicationDetails: "" }));
            }}
            rows={2}
            className={
              fieldErrors.schoolCommunicationDetails ? "border-red-500" : ""
            }
          />
          {fieldErrors.schoolCommunicationDetails && (
            <p className="text-xs text-red-600">
              {fieldErrors.schoolCommunicationDetails}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>14 Details (required if question 14 is Yes)</Label>
          <Textarea
            placeholder="Describe any dietary requirements or allergies"
            value={dietaryDetails}
            onChange={(e) => {
              setDietaryDetails(e.target.value);
              setFieldErrors((p) => ({ ...p, dietaryDetails: "" }));
            }}
            rows={2}
            className={fieldErrors.dietaryDetails ? "border-red-500" : ""}
          />
          {fieldErrors.dietaryDetails && (
            <p className="text-xs text-red-600">{fieldErrors.dietaryDetails}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>14. Suggestions or comments for the organizers</Label>
          <Textarea
            placeholder="Share your recommendations or feedback"
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>
            Pairing / Partner Note (for legal partner or special room requests)
          </Label>
          <Textarea
            placeholder="Optional note: preferred pairing partner, legal partner request details, or single-room request reason"
            value={partnerClaimNote}
            onChange={(e) => setPartnerClaimNote(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <p className="text-xs text-muted-foreground">
            If your last entry stamp and current visa are on the same passport
            page, you can upload the same file for both fields.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2 rounded-md border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-xs font-semibold text-foreground">
            Credential uploads — accepted formats only
          </p>
          <ul className="list-disc space-y-1.5 pl-4 text-xs text-muted-foreground leading-snug">
            <li>{DELEGATE_TRAVEL_UPLOAD_RULE_TEXT}</li>
            <li>{DELEGATE_BOOKLET_UPLOAD_RULE_TEXT}</li>
          </ul>
          <p className="text-xs text-muted-foreground leading-snug">
            {DELEGATE_UPLOAD_CONVERSION_TIP}
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            Other formats cannot be uploaded until you convert them. Your device
            may still show disallowed files in the picker; choosing one will
            show an error and clear the selection.
          </p>
        </div>

        <div className="space-y-2">
          <Label>
            15. Upload Passport Photo Page{" "}
            {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept={delegateDocumentAcceptAttribute("passport")}
            onChange={(e) =>
              handleCredentialFileChange(
                e,
                "passportPhoto",
                "passport",
                setPassportPhoto,
              )
            }
            className={
              resolvePhotoError("passportPhoto") ? "border-red-500" : ""
            }
          />
          {resolvePhotoError("passportPhoto") && (
            <p className="text-xs text-red-600">
              {resolvePhotoError("passportPhoto")}
            </p>
          )}
          {renderUploadFeedback("passportPhoto")}
          {passportPhoto && (
            <p className="text-xs text-muted-foreground">
              {passportPhoto.name}
            </p>
          )}
          {!passportPhoto && renderUploadedPreview("passportPhoto")}
        </div>

        <div className="space-y-2">
          <Label>
            16. Upload Last Entry Stamp Page{" "}
            {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept={delegateDocumentAcceptAttribute("entry-stamp")}
            onChange={(e) =>
              handleCredentialFileChange(
                e,
                "lastEntryStampPhoto",
                "entry-stamp",
                setLastEntryStampPhoto,
              )
            }
            className={
              resolvePhotoError("lastEntryStampPhoto") ? "border-red-500" : ""
            }
          />
          {resolvePhotoError("lastEntryStampPhoto") && (
            <p className="text-xs text-red-600">
              {resolvePhotoError("lastEntryStampPhoto")}
            </p>
          )}
          {renderUploadFeedback("lastEntryStampPhoto")}
          {lastEntryStampPhoto && (
            <p className="text-xs text-muted-foreground">
              {lastEntryStampPhoto.name}
            </p>
          )}
          {!lastEntryStampPhoto && renderUploadedPreview("lastEntryStampPhoto")}
        </div>

        <div className="space-y-2">
          <Label>
            17. Upload Current Visa Page{" "}
            {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept={delegateDocumentAcceptAttribute("visa")}
            onChange={(e) =>
              handleCredentialFileChange(
                e,
                "currentVisaPhoto",
                "visa",
                setCurrentVisaPhoto,
              )
            }
            className={
              resolvePhotoError("currentVisaPhoto") ? "border-red-500" : ""
            }
          />
          {resolvePhotoError("currentVisaPhoto") && (
            <p className="text-xs text-red-600">
              {resolvePhotoError("currentVisaPhoto")}
            </p>
          )}
          {renderUploadFeedback("currentVisaPhoto")}
          {currentVisaPhoto && (
            <p className="text-xs text-muted-foreground">
              {currentVisaPhoto.name}
            </p>
          )}
          {!currentVisaPhoto && renderUploadedPreview("currentVisaPhoto")}
        </div>

        <div className="space-y-2">
          <Label>
            18. Upload Photo for Conference Booklet{" "}
            {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept={delegateDocumentAcceptAttribute("booklet")}
            onChange={(e) =>
              handleCredentialFileChange(
                e,
                "bookletPhoto",
                "booklet",
                setBookletPhoto,
              )
            }
            className={
              resolvePhotoError("bookletPhoto") ? "border-red-500" : ""
            }
          />
          {resolvePhotoError("bookletPhoto") && (
            <p className="text-xs text-red-600">
              {resolvePhotoError("bookletPhoto")}
            </p>
          )}
          {renderUploadFeedback("bookletPhoto")}
          {bookletPhoto && (
            <p className="text-xs text-muted-foreground">{bookletPhoto.name}</p>
          )}
          {!bookletPhoto && renderUploadedPreview("bookletPhoto")}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
