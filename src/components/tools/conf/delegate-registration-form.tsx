"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  roomPref: "PAIR" | "SINGLE";
  partnerClaimNote: string;
  passportPhoto: File | null;
  bookletPhoto: File | null;
  conferencePosition: string;
};

/** Pre-populated field values for edit mode (files are not pre-populated). */
export type InitialFormValues = Partial<
  Omit<DelegateRegistrationPayload, "passportPhoto" | "bookletPhoto">
>;

const CUSTOM_CONFERENCE_ROLE = "__CUSTOM__";

const KNOWN_CONFERENCE_ROLES = [
  "Conference Chair",
  "General Chairman",
  "General Co-Chair",
  "General Secretary",
  "PRO & Media",
  "Cooking Team Chair",
  "Chair on Sports",
  "Chair on Logistics",
  "Member",
  "National President",
  "National Vice President",
  "Secretary General",
  "Deputy Secretary General",
  "Financial Secretary",
  "National Treasurer",
  "Chaplain General",
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
  return KNOWN_CONFERENCE_ROLES.includes(value as (typeof KNOWN_CONFERENCE_ROLES)[number]);
}

function normalizeConferenceRole(value: string): string {
  if (value === "Member, Cooking Team") return "Member";
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
   * When false, hides manager-only fields (feePaid, feeAmount).
   * Defaults to true to preserve existing behavior.
   */
  isManagerMode?: boolean;
  /**
   * Unique key for localStorage draft. Use delegateId for edit mode,
   * or a stable string like "new" for new registrations.
   */
  draftKey?: string;
  onCancel?: () => void;
  onSubmit: (payload: DelegateRegistrationPayload) => Promise<boolean>;
};

export function DelegateRegistrationForm({
  submitting,
  submitLabel = "Submit Registration",
  defaultFeeAmount = 250,
  initialValues,
  isManagerMode = true,
  draftKey,
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
  const [feePaid, setFeePaid] = useState(initialValues?.feePaid ?? false);
  const [feeAmount, setFeeAmount] = useState(
    initialValues?.feeAmount != null
      ? String(initialValues.feeAmount)
      : String(defaultFeeAmount),
  );
  const [roomPref, setRoomPref] = useState<"PAIR" | "SINGLE">(
    initialValues?.roomPref ?? "PAIR",
  );
  const [partnerClaimNote, setPartnerClaimNote] = useState(
    initialValues?.partnerClaimNote ?? "",
  );
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [bookletPhoto, setBookletPhoto] = useState<File | null>(null);
  const [conferencePosition, setConferencePosition] = useState(initialConferencePosition);
  const [conferencePositionSelect, setConferencePositionSelect] = useState(
    initialConferencePosition
      ? isKnownConferenceRole(initialConferencePosition)
        ? initialConferencePosition
        : CUSTOM_CONFERENCE_ROLE
      : "",
  );
  const [customConferenceRoles, setCustomConferenceRoles] = useState(
    initialConferencePosition && !isKnownConferenceRole(initialConferencePosition)
      ? initialConferencePosition
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (
        typeof d.conferencePositionSelect === "string"
      ) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

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
          feeAmount,
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
    feeAmount,
    roomPref,
    partnerClaimNote,
    conferencePosition,
    conferencePositionSelect,
    customConferenceRoles,
  ]);

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
    setFeeAmount(
      initialValues?.feeAmount != null
        ? String(initialValues.feeAmount)
        : String(defaultFeeAmount),
    );
    setRoomPref(initialValues?.roomPref ?? "PAIR");
    setPartnerClaimNote(initialValues?.partnerClaimNote ?? "");
    setPassportPhoto(null);
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

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(
        `Please fix ${Object.keys(errs).length} field${Object.keys(errs).length > 1 ? "s" : ""} below.`,
      );
      return;
    }

    setFieldErrors({});
    setError(null);

    const parsedFeeAmount = feeAmount.trim()
      ? Number(feeAmount)
      : defaultFeeAmount;

    if (!Number.isFinite(parsedFeeAmount) || parsedFeeAmount < 0) {
      setError("Conference fee amount must be a valid number.");
      return;
    }

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
        feeAmount: parsedFeeAmount,
        roomPref,
        partnerClaimNote,
        passportPhoto,
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
            Draft restored from auto-save. Your unsaved changes have been
            recovered.
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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
            className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs ${
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
              <option value="General Chairman">General Chairman</option>
              <option value="General Co-Chair">General Co-Chair</option>
              <option value="General Secretary">General Secretary</option>
              <option value="PRO &amp; Media">PRO &amp; Media</option>
              <option value="Cooking Team Chair">Cooking Team Chair</option>
              <option value="Chair on Sports">Chair on Sports</option>
              <option value="Chair on Logistics">Chair on Logistics</option>
              <option value="Member">Member</option>
            </optgroup>
            <optgroup label="NEC Executive">
              <option value="National President">National President</option>
              <option value="National Vice President">
                National Vice President
              </option>
              <option value="Secretary General">Secretary General</option>
              <option value="Deputy Secretary General">
                Deputy Secretary General
              </option>
              <option value="Financial Secretary">Financial Secretary</option>
              <option value="National Treasurer">National Treasurer</option>
              <option value="Chaplain General">Chaplain General</option>
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
            <p className="text-xs text-red-600">{fieldErrors.conferencePosition}</p>
          )}
          {conferencePositionSelect === CUSTOM_CONFERENCE_ROLE && (
            <div className="space-y-2 rounded-md border border-border/70 p-3">
              <Label>Custom Role(s)</Label>
              <Input
                placeholder="e.g. Conference Chair, Chair on Logistics"
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
                For participants serving in multiple roles, separate roles with commas.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>12. Will you bring someone from another country? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={bringingForeignGuest}
            onChange={(e) =>
              setBringingForeignGuest(e.target.value as "YES" | "NO" | "OTHER")
            }
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>13. Do you need accommodation during the conference? *</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
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

        <div className="space-y-2">
          <Label>Guest Nationality (required if question 11 is Yes)</Label>
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

        {isManagerMode && (
          <div className="space-y-2">
            <Label>Completed Conference Payment? *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={feePaid ? "YES" : "NO"}
              onChange={(e) => setFeePaid(e.target.value === "YES")}
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
        )}

        {isManagerMode && (
          <div className="space-y-2">
            <Label>Conference Fee Amount (optional)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Amount in RMB"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Default conference fee is {defaultFeeAmount} RMB.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Room Preference</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={roomPref}
            onChange={(e) => setRoomPref(e.target.value as "PAIR" | "SINGLE")}
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

        <div className="space-y-2">
          <Label>
            15. Upload Passport Photo Page{" "}
            {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => {
              setPassportPhoto(e.target.files?.[0] || null);
              setFieldErrors((p) => ({ ...p, passportPhoto: "" }));
            }}
            className={fieldErrors.passportPhoto ? "border-red-500" : ""}
          />
          {fieldErrors.passportPhoto && (
            <p className="text-xs text-red-600">{fieldErrors.passportPhoto}</p>
          )}
          {passportPhoto && (
            <p className="text-xs text-muted-foreground">
              {passportPhoto.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            16. Upload Photo for Conference Booklet{" "}
            {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setBookletPhoto(e.target.files?.[0] || null);
              setFieldErrors((p) => ({ ...p, bookletPhoto: "" }));
            }}
            className={fieldErrors.bookletPhoto ? "border-red-500" : ""}
          />
          {fieldErrors.bookletPhoto && (
            <p className="text-xs text-red-600">{fieldErrors.bookletPhoto}</p>
          )}
          {bookletPhoto && (
            <p className="text-xs text-muted-foreground">{bookletPhoto.name}</p>
          )}
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
