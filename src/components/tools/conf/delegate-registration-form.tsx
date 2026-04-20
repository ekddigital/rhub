"use client";

import { useState } from "react";
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
  onCancel?: () => void;
  onSubmit: (payload: DelegateRegistrationPayload) => Promise<boolean>;
};

export function DelegateRegistrationForm({
  submitting,
  submitLabel = "Submit Registration",
  defaultFeeAmount = 250,
  initialValues,
  isManagerMode = true,
  onCancel,
  onSubmit,
}: Props) {
  const isEditMode = Boolean(initialValues);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [province, setProvince] = useState(initialValues?.province ?? "");
  const [passportNo, setPassportNo] = useState(initialValues?.passportNo ?? "");
  const [university, setUniversity] = useState(initialValues?.university ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [wechat, setWechat] = useState(initialValues?.wechat ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [gender, setGender] = useState<"MALE" | "FEMALE">(initialValues?.gender ?? "MALE");
  const [attendanceIntent, setAttendanceIntent] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.attendanceIntent ?? "YES");
  const [travelAssistanceNeeded, setTravelAssistanceNeeded] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.travelAssistanceNeeded ?? "NO");
  const [schoolCommunicationNeeded, setSchoolCommunicationNeeded] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.schoolCommunicationNeeded ?? "NO");
  const [schoolCommunicationDetails, setSchoolCommunicationDetails] =
    useState(initialValues?.schoolCommunicationDetails ?? "");
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
  const [guestNationality, setGuestNationality] = useState(initialValues?.guestNationality ?? "");
  const [accommodationNeeded, setAccommodationNeeded] = useState<
    "YES" | "NO" | "OTHER"
  >(initialValues?.accommodationNeeded ?? "NO");
  const [dietaryNeeds, setDietaryNeeds] = useState<"YES" | "NO" | "OTHER">(
    initialValues?.dietaryNeeds ?? "NO",
  );
  const [dietaryDetails, setDietaryDetails] = useState(initialValues?.dietaryDetails ?? "");
  const [additionalComments, setAdditionalComments] = useState(initialValues?.additionalComments ?? "");
  const [feePaid, setFeePaid] = useState(initialValues?.feePaid ?? false);
  const [feeAmount, setFeeAmount] = useState(
    initialValues?.feeAmount != null
      ? String(initialValues.feeAmount)
      : String(defaultFeeAmount),
  );
  const [roomPref, setRoomPref] = useState<"PAIR" | "SINGLE">(initialValues?.roomPref ?? "PAIR");
  const [partnerClaimNote, setPartnerClaimNote] = useState(initialValues?.partnerClaimNote ?? "");
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [bookletPhoto, setBookletPhoto] = useState<File | null>(null);
  const [conferencePosition, setConferencePosition] = useState(initialValues?.conferencePosition ?? "");
  const [error, setError] = useState<string | null>(null);

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
    setSchoolCommunicationNeeded(initialValues?.schoolCommunicationNeeded ?? "NO");
    setSchoolCommunicationDetails(initialValues?.schoolCommunicationDetails ?? "");
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
    setConferencePosition(initialValues?.conferencePosition ?? "");
    setError(null);
  };

  const handleSubmit = async () => {
    // In edit mode, photos are optional (existing files are kept server-side)
    const requirePhotos = !isEditMode;

    if (
      !name ||
      !province ||
      !passportNo ||
      !university ||
      !city ||
      !phone ||
      !wechat ||
      !email ||
      (requirePhotos && (!passportPhoto || !bookletPhoto))
    ) {
      setError(
        requirePhotos
          ? "Please complete all required fields and uploads."
          : "Please complete all required fields.",
      );
      return;
    }

    if (bringingForeignGuest === "YES" && !guestNationality.trim()) {
      setError("Please provide the guest nationality.");
      return;
    }

    if (
      schoolCommunicationNeeded === "YES" &&
      !schoolCommunicationDetails.trim()
    ) {
      setError("Please provide details for school/supervisor communication.");
      return;
    }

    if (dietaryNeeds === "YES" && !dietaryDetails.trim()) {
      setError("Please provide your dietary requirement details.");
      return;
    }

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
        conferencePosition,
      });

      // In edit mode the parent handles closing the form; only reset on fresh creation.
      if (submitted && !isEditMode) {
        resetForm();
      }
    } catch {
      setError("Submission failed. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
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
            onChange={(e) => setName(e.target.value)}
          />
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
            onChange={(e) => setWechat(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>4. Phone Number *</Label>
          <Input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>5. Province *</Label>
          <Input
            placeholder="Current province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>6. City *</Label>
          <Input
            placeholder="Current city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={conferencePosition}
            onChange={(e) => setConferencePosition(e.target.value)}
          >
            <option value="">None — Regular Delegate</option>
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
          </select>
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
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Passport Number *</Label>
          <Input
            placeholder="Passport number"
            value={passportNo}
            onChange={(e) => setPassportNo(e.target.value.toUpperCase())}
          />
        </div>

        <div className="space-y-2">
          <Label>University *</Label>
          <Input
            placeholder="Current university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Guest Nationality (required if question 11 is Yes)</Label>
          <Input
            placeholder="e.g. Ghanaian, Chinese, etc."
            value={guestNationality}
            onChange={(e) => setGuestNationality(e.target.value)}
          />
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
            onChange={(e) => setSchoolCommunicationDetails(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>14 Details (required if question 14 is Yes)</Label>
          <Textarea
            placeholder="Describe any dietary requirements or allergies"
            value={dietaryDetails}
            onChange={(e) => setDietaryDetails(e.target.value)}
            rows={2}
          />
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
            15. Upload Passport Photo Page {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => setPassportPhoto(e.target.files?.[0] || null)}
          />
          {passportPhoto && (
            <p className="text-xs text-muted-foreground">
              {passportPhoto.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            16. Upload Photo for Conference Booklet {isEditMode ? "(optional — replaces current)" : "*"}
          </Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setBookletPhoto(e.target.files?.[0] || null)}
          />
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
