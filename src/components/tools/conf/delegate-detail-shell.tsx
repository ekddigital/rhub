"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FileUp,
  Lock,
  MapPin,
  Mail,
  MessageSquare,
  Phone,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdaptivePhotoFrame } from "@/components/tools/conf/adaptive-photo-frame";
import { PassportViewerModal } from "@/components/tools/conf/passport-viewer-modal";
import { fetchDefaultConference } from "@/lib/conf/client";
import { fmtRmb } from "@/lib/conf/currency";
import {
  DelegateRegistrationForm,
  type DelegateRegistrationPayload,
  type UploadedPhotoMeta,
} from "@/components/tools/conf/delegate-registration-form";
import {
  validateDelegateUploadFile,
  delegateDocumentAcceptAttribute,
  DELEGATE_TRAVEL_UPLOAD_RULE_TEXT,
  DELEGATE_BOOKLET_UPLOAD_RULE_TEXT,
  DELEGATE_UPLOAD_CONVERSION_TIP,
} from "@/lib/conf/file-upload-client";
import {
  formatUploadError,
  parseUploadErrorPayload,
} from "@/lib/conf/upload-feedback-client";

type Delegate = {
  id: string;
  confId: string;
  userId: string | null;
  name: string;
  passportNo: string | null;
  gender: "MALE" | "FEMALE" | null;
  delegateCode: string | null;
  email: string | null;
  university: string | null;
  province: string | null;
  city: string;
  phone: string | null;
  wechat: string | null;
  attendanceIntent: "YES" | "NO" | "OTHER" | null;
  travelAssistanceNeeded: "YES" | "NO" | "OTHER" | null;
  schoolCommunicationNeeded: "YES" | "NO" | "OTHER" | null;
  schoolCommunicationDetails: string | null;
  studyYear:
    | "BACHELOR_1"
    | "BACHELOR_2"
    | "BACHELOR_3"
    | "BACHELOR_4"
    | "GRADUATE_1"
    | "GRADUATE_2"
    | "GRADUATE_3"
    | "GRADUATE_4"
    | "OTHER"
    | null;
  bringingForeignGuest: "YES" | "NO" | "OTHER" | null;
  guestNationality: string | null;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  dietaryNeeds: "YES" | "NO" | "OTHER" | null;
  dietaryDetails: string | null;
  additionalComments: string | null;
  addOnPackageIds?: string[];
  feePackageId: string | null;
  feeAmount: number | null;
  amountPaid: number | null;
  feePaid: boolean;
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  partnerClaimNote: string | null;
  passportPhotoPath: string | null;
  passportPhotoIsPdf?: boolean;
  lastEntryStampPath: string | null;
  lastEntryStampIsPdf?: boolean;
  currentVisaPath: string | null;
  currentVisaIsPdf?: boolean;
  bookletPhotoPath: string | null;
  flyerReady: boolean;
  conferencePosition: string | null;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

function uploadKindLabel(
  kind: "booklet" | "passport" | "entry-stamp" | "visa",
) {
  if (kind === "booklet") return "conference photo";
  if (kind === "entry-stamp") return "last entry stamp";
  if (kind === "visa") return "current visa";
  return "passport document";
}

type Props = {
  delegateId: string;
  canManage: boolean;
  canSelfEdit: boolean;
  /** When true the edit form opens immediately instead of view mode */
  startInEditMode?: boolean;
};

const STATUS_CONFIG = {
  REGISTERED: { label: "Registered", variant: "outline" as const, icon: Clock },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  ATTENDED: {
    label: "Attended",
    variant: "secondary" as const,
    icon: UserCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const RESPONSE_LABEL: Record<"YES" | "NO" | "OTHER", string> = {
  YES: "Yes",
  NO: "No",
  OTHER: "Other",
};

const STUDY_YEAR_LABEL: Record<NonNullable<Delegate["studyYear"]>, string> = {
  BACHELOR_1: "Bachelor Year 1",
  BACHELOR_2: "Bachelor Year 2",
  BACHELOR_3: "Bachelor Year 3",
  BACHELOR_4: "Bachelor Year 4",
  GRADUATE_1: "Graduate Year 1",
  GRADUATE_2: "Graduate Year 2",
  GRADUATE_3: "Graduate Year 3",
  GRADUATE_4: "Graduate Year 4",
  OTHER: "Other",
};

function asText(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return String(value);
  const trimmed = value.trim();
  return trimmed.length ? trimmed : "-";
}

function asChoice(value: Delegate["attendanceIntent"]) {
  if (!value) return "-";
  return RESPONSE_LABEL[value];
}

function formatDate(value: string) {
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "-";
  return time.toLocaleString();
}

export function DelegateDetailShell({
  delegateId,
  canManage,
  canSelfEdit,
  startInEditMode = false,
}: Props) {
  const [confId, setConfId] = useState("");
  const [defaultFee, setDefaultFee] = useState(250);
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<
    "booklet" | "passport" | "entry-stamp" | "visa" | null
  >(null);

  const loadDelegate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const conf = await fetchDefaultConference();
      setConfId(conf.id);
      setDefaultFee(conf.delegateFee ?? 250);

      const res = await fetch(`/api/conf/${conf.id}/delegates/${delegateId}`, {
        cache: "no-store",
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load delegate details");
      }

      setDelegate(payload as Delegate);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load delegate details",
      );
    } finally {
      setLoading(false);
    }
  }, [delegateId]);

  useEffect(() => {
    void loadDelegate();
  }, [loadDelegate]);

  const handleUpload = async (
    kind: "booklet" | "passport" | "entry-stamp" | "visa",
    file: File | null,
  ) => {
    if (!confId || !file || !canSelfEdit || uploadingKind) return;

    const fileValidation = validateDelegateUploadFile(file, kind);
    if (!fileValidation.ok) {
      setError(fileValidation.error);
      return;
    }

    setUploadingKind(kind);
    setError(null);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);

      const res = await fetch(
        `/api/conf/${confId}/delegates/${delegateId}/self-documents`,
        {
          method: "POST",
          body: formData,
        },
      );

      const payload = await parseUploadErrorPayload(res);
      if (!res.ok) {
        throw new Error(
          formatUploadError(
            payload,
            `Failed to update ${uploadKindLabel(kind)}`,
            res.status,
          ),
        );
      }

      setDelegate(payload as unknown as Delegate);
      setNotice(
        kind === "booklet"
          ? "Conference photo updated successfully."
          : kind === "entry-stamp"
            ? "Last entry stamp updated successfully."
            : kind === "visa"
              ? "Current visa updated successfully."
              : "Passport document updated successfully.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleEditSubmit = async (
    payload: DelegateRegistrationPayload,
  ): Promise<boolean> => {
    if (!confId || editSubmitting) return false;
    setEditSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        province: payload.province,
        passportNo: payload.passportNo,
        university: payload.university,
        city: payload.city,
        phone: payload.phone,
        wechat: payload.wechat,
        email: payload.email,
        gender: payload.gender,
        attendanceIntent: payload.attendanceIntent,
        travelAssistanceNeeded: payload.travelAssistanceNeeded,
        schoolCommunicationNeeded: payload.schoolCommunicationNeeded,
        schoolCommunicationDetails: payload.schoolCommunicationDetails,
        studyYear: payload.studyYear,
        bringingForeignGuest: payload.bringingForeignGuest,
        guestNationality: payload.guestNationality,
        accommodationNeeded: payload.accommodationNeeded,
        dietaryNeeds: payload.dietaryNeeds,
        dietaryDetails: payload.dietaryDetails,
        additionalComments: payload.additionalComments,
        roomPref: payload.roomPref,
        partnerClaimNote: payload.partnerClaimNote,
        conferencePosition: payload.conferencePosition,
        feePackageId: payload.feePackageId,
        addOnPackageIds: payload.addOnPackageIds,
        feeAmount: payload.feeAmount,
        amountPaid: payload.amountPaid,
        feePaid: payload.feePaid,
      };

      const res = await fetch(`/api/conf/${confId}/delegates/${delegateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          (updated as { error?: string }).error ||
            "Failed to update registration",
        );

      if (payload.passportPhoto) {
        await handleUpload("passport", payload.passportPhoto);
      }
      if (payload.lastEntryStampPhoto) {
        await handleUpload("entry-stamp", payload.lastEntryStampPhoto);
      }
      if (payload.currentVisaPhoto) {
        await handleUpload("visa", payload.currentVisaPhoto);
      }
      if (payload.bookletPhoto) {
        await handleUpload("booklet", payload.bookletPhoto);
      }

      setDelegate(updated as Delegate);
      setNotice("Registration updated successfully.");
      setIsEditing(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      return false;
    } finally {
      setEditSubmitting(false);
    }
  };

  const initials = useMemo(() => {
    if (!delegate?.name) return "DL";
    return delegate.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [delegate?.name]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        <Card>
          <CardContent className="pt-6">
            <div className="h-60 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!delegate) {
    return (
      <div className="space-y-4">
        <Link href="/tools/conf/delegates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
            Back to Delegates
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">
            {error || "Delegate record was not found."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = STATUS_CONFIG[delegate.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/tools/conf/delegates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
            Back to Delegates
          </Button>
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {delegate.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {delegate.delegateCode || "Pending conference ID"}
          </p>
        </div>

        <Badge variant={canManage ? "default" : "secondary"}>
          {canManage ? "Manager View" : "Self-Service View"}
        </Badge>

        {canSelfEdit && !isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="size-4" />
            Edit Registration
          </Button>
        )}
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conference Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {delegate.bookletPhotoPath ? (
                <AdaptivePhotoFrame
                  src={delegate.bookletPhotoPath}
                  alt={delegate.name}
                  containerClassName="h-72 w-full rounded-xl border border-border"
                />
              ) : (
                <div className="flex h-72 items-center justify-center rounded-xl bg-muted text-3xl font-semibold text-muted-foreground">
                  {initials || "DL"}
                </div>
              )}

              <div className="space-y-2">
                <label
                  className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                    uploadingKind ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <Camera className="size-4" />
                  {uploadingKind === "booklet"
                    ? "Uploading..."
                    : "Change Conference Photo"}
                  <input
                    type="file"
                    className="hidden"
                    accept={delegateDocumentAcceptAttribute("booklet")}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void handleUpload("booklet", file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {canSelfEdit && (
                  <label
                    className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      uploadingKind ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <FileUp className="size-4" />
                    {uploadingKind === "entry-stamp"
                      ? "Uploading..."
                      : "Replace Last Entry Stamp"}
                    <input
                      type="file"
                      className="hidden"
                      accept={delegateDocumentAcceptAttribute("entry-stamp")}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleUpload("entry-stamp", file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}

                {canSelfEdit && (
                  <label
                    className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      uploadingKind ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <FileUp className="size-4" />
                    {uploadingKind === "visa"
                      ? "Uploading..."
                      : "Replace Current Visa"}
                    <input
                      type="file"
                      className="hidden"
                      accept={delegateDocumentAcceptAttribute("visa")}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleUpload("visa", file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}

                {canManage && (
                  <label
                    className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      uploadingKind ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <FileUp className="size-4" />
                    {uploadingKind === "passport"
                      ? "Uploading..."
                      : "Replace Passport File"}
                    <input
                      type="file"
                      className="hidden"
                      accept={delegateDocumentAcceptAttribute("passport")}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleUpload("passport", file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2 rounded-md border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-muted-foreground dark:border-amber-900/45 dark:bg-amber-950/25">
                <p className="font-medium text-foreground">
                  Accepted file types
                </p>
                <p className="leading-snug">
                  {DELEGATE_TRAVEL_UPLOAD_RULE_TEXT}
                </p>
                <p className="leading-snug">
                  {DELEGATE_BOOKLET_UPLOAD_RULE_TEXT}
                </p>
                <p className="leading-snug border-t border-amber-200/60 pt-2 mt-2 dark:border-amber-900/40">
                  {DELEGATE_UPLOAD_CONVERSION_TIP}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Linked delegate accounts can update their conference photo from
                this page. Managers can replace passport files, and linked
                delegates can upload their last entry stamp and current visa.
              </p>
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Passport Document
                  <Lock className="size-3.5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {delegate.passportPhotoPath ? (
                  <>
                    <AdaptivePhotoFrame
                      src={delegate.passportPhotoPath}
                      alt={`${delegate.name} passport`}
                      containerClassName="h-52 w-full rounded-xl border border-border"
                    />
                    <PassportViewerModal
                      proxyUrl={delegate.passportPhotoPath}
                      isPdf={delegate.passportPhotoIsPdf ?? false}
                      label="Full View"
                      title="Passport Document"
                    />
                  </>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                    No passport document uploaded
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <Lock className="inline size-3 mr-1" />
                  Visible to conference managers only.
                </p>
              </CardContent>
            </Card>
          )}

          {(canManage || canSelfEdit) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Last Entry Stamp
                  <Lock className="size-3.5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {delegate.lastEntryStampPath ? (
                  <>
                    <AdaptivePhotoFrame
                      src={delegate.lastEntryStampPath}
                      alt={`${delegate.name} last entry stamp`}
                      containerClassName="h-52 w-full rounded-xl border border-border"
                    />
                    <PassportViewerModal
                      proxyUrl={delegate.lastEntryStampPath}
                      isPdf={delegate.lastEntryStampIsPdf ?? false}
                      label="Open File"
                      title="Last Entry Stamp"
                    />
                  </>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                    No last entry stamp uploaded
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <Lock className="inline size-3 mr-1" />
                  Visible to conference managers and the linked delegate
                  account.
                </p>
              </CardContent>
            </Card>
          )}

          {(canManage || canSelfEdit) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Current Visa
                  <Lock className="size-3.5 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {delegate.currentVisaPath ? (
                  <>
                    <AdaptivePhotoFrame
                      src={delegate.currentVisaPath}
                      alt={`${delegate.name} current visa`}
                      containerClassName="h-52 w-full rounded-xl border border-border"
                    />
                    <PassportViewerModal
                      proxyUrl={delegate.currentVisaPath}
                      isPdf={delegate.currentVisaIsPdf ?? false}
                      label="Open File"
                      title="Current Visa"
                    />
                  </>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                    No current visa uploaded
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <Lock className="inline size-3 mr-1" />
                  Visible to conference managers and the linked delegate
                  account.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delegate Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>
                <StatusIcon className="mr-1 size-3" />
                {status.label}
              </Badge>
              <Badge variant={delegate.feePaid ? "default" : "outline"}>
                {delegate.feePaid ? "Fee Paid" : "Fee Pending"}
              </Badge>
              <Badge variant={delegate.flyerReady ? "secondary" : "outline"}>
                {delegate.flyerReady ? "Flyer Ready" : "Flyer Pending"}
              </Badge>
            </div>

            {delegate.flyerReady && confId && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/api/conf/${confId}/delegates/${delegate.id}/flyer`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-[#0B4FD9]/10 px-2.5 py-1.5 text-xs font-medium text-[#0B4FD9]"
                >
                  <Eye className="size-3.5" />
                  View Card
                </Link>
                <Link
                  href={`/api/conf/${confId}/delegates/${delegate.id}/flyer?format=png&download=1`}
                  className="inline-flex items-center gap-1 rounded-md bg-[#C8102E]/10 px-2.5 py-1.5 text-xs font-medium text-[#C8102E]"
                  download
                >
                  <Download className="size-3.5" />
                  Download PNG
                </Link>
                <Link
                  href={`/api/conf/${confId}/delegates/${delegate.id}/flyer?download=1`}
                  className="inline-flex items-center gap-1 rounded-md bg-[#0B1E78]/10 px-2.5 py-1.5 text-xs font-medium text-[#0B1E78]"
                  download
                >
                  <Download className="size-3.5" />
                  Download SVG
                </Link>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Contact
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  {asText(delegate.email)}
                </p>
                <p className="mt-1 flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  {asText(delegate.phone)}
                </p>
                <p className="mt-1 flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  {asText(delegate.wechat)}
                </p>
              </div>

              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Location & School
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  {delegate.city}, {asText(delegate.province)}
                </p>
                <p className="mt-1">
                  University: {asText(delegate.university)}
                </p>
                {canManage && (
                  <p className="mt-1 flex items-center gap-1">
                    <Lock className="size-3 text-muted-foreground" />
                    Passport: {asText(delegate.passportNo)}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Conference Profile
                </p>
                <p className="mt-2">Gender: {asText(delegate.gender)}</p>
                <p className="mt-1">
                  Study year:{" "}
                  {delegate.studyYear
                    ? STUDY_YEAR_LABEL[delegate.studyYear]
                    : "-"}
                </p>
                <p className="mt-1">
                  Attendance intent: {asChoice(delegate.attendanceIntent)}
                </p>
                <p className="mt-1">
                  Travel assistance: {asChoice(delegate.travelAssistanceNeeded)}
                </p>
              </div>

              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Logistics
                </p>
                <p className="mt-2">Room preference: {delegate.roomPref}</p>
                <p className="mt-1">
                  Single room: {delegate.wantsSingleRoom ? "Yes" : "No"}
                </p>
                <p className="mt-1">
                  Accommodation needed: {asChoice(delegate.accommodationNeeded)}
                </p>
                <p className="mt-1">
                  Dietary needs: {asChoice(delegate.dietaryNeeds)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fees & Status
                </p>
                <p className="mt-2">
                  Fee amount:{" "}
                  {delegate.feeAmount ? fmtRmb(delegate.feeAmount) : "-"}
                </p>
                <p className="mt-1">
                  Fee paid: {delegate.feePaid ? "Yes" : "No"}
                </p>
                {!delegate.feePaid && (
                  <p className="mt-1 font-semibold text-amber-600">
                    Outstanding: {fmtRmb(delegate.feeAmount ?? defaultFee)}
                  </p>
                )}
                <p className="mt-1">Current status: {status.label}</p>
                <p className="mt-1">
                  Flyer ready: {delegate.flyerReady ? "Yes" : "No"}
                </p>
              </div>

              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Timeline
                </p>
                <p className="mt-2">
                  Registered: {formatDate(delegate.createdAt)}
                </p>
                <p className="mt-1">
                  Updated: {formatDate(delegate.updatedAt)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Additional Notes
              </p>
              <p className="mt-2">
                School communication:{" "}
                {asChoice(delegate.schoolCommunicationNeeded)}
              </p>
              <p className="mt-1">
                Details: {asText(delegate.schoolCommunicationDetails)}
              </p>
              <p className="mt-1">
                Foreign guest: {asChoice(delegate.bringingForeignGuest)}
              </p>
              <p className="mt-1">
                Guest nationality: {asText(delegate.guestNationality)}
              </p>
              <p className="mt-1">
                Dietary details: {asText(delegate.dietaryDetails)}
              </p>
              <p className="mt-1">
                Pairing note: {asText(delegate.partnerClaimNote)}
              </p>
              <p className="mt-1">
                Comments: {asText(delegate.additionalComments)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing && delegate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <DelegateRegistrationForm
              key={`edit-${delegate.id}`}
              submitting={editSubmitting}
              submitLabel="Save Changes"
              draftKey={`edit-${delegate.id}`}
              uploadedPhotoMeta={(() => {
                const base = `/api/conf/${confId}/delegates/${delegate.id}/secure-document`;
                const meta: Partial<
                  Record<
                    | "passportPhoto"
                    | "lastEntryStampPhoto"
                    | "currentVisaPhoto"
                    | "bookletPhoto",
                    UploadedPhotoMeta
                  >
                > = {};
                // Passport proxy is manager-only; for owners show text-only indicator
                if (delegate.passportPhotoPath) {
                  if (canManage) {
                    meta.passportPhoto = {
                      fileName: "Passport (on file)",
                      filePath: `${base}?kind=passport`,
                      previewSrc: delegate.passportPhotoPath,
                    };
                  } else {
                    meta.passportPhoto = {
                      fileName: "Passport (on file)",
                      filePath: "existing.pdf",
                    };
                  }
                }
                if (delegate.lastEntryStampPath)
                  meta.lastEntryStampPhoto = {
                    fileName: "Entry stamp (on file)",
                    filePath: `${base}?kind=entry-stamp`,
                    previewSrc: delegate.lastEntryStampPath,
                  };
                if (delegate.currentVisaPath)
                  meta.currentVisaPhoto = {
                    fileName: "Visa (on file)",
                    filePath: `${base}?kind=visa`,
                    previewSrc: delegate.currentVisaPath,
                  };
                if (delegate.bookletPhotoPath)
                  meta.bookletPhoto = {
                    fileName: "Conference photo (on file)",
                    filePath: delegate.bookletPhotoPath,
                  };
                return meta;
              })()}
              initialValues={{
                name: delegate.name,
                province: delegate.province ?? "",
                passportNo: delegate.passportNo ?? "",
                university: delegate.university ?? "",
                city: delegate.city,
                phone: delegate.phone ?? "",
                wechat: delegate.wechat ?? "",
                email: delegate.email ?? "",
                gender: delegate.gender ?? "MALE",
                attendanceIntent: delegate.attendanceIntent ?? "YES",
                travelAssistanceNeeded: delegate.travelAssistanceNeeded ?? "NO",
                schoolCommunicationNeeded:
                  delegate.schoolCommunicationNeeded ?? "NO",
                schoolCommunicationDetails:
                  delegate.schoolCommunicationDetails ?? "",
                studyYear: delegate.studyYear ?? "BACHELOR_1",
                bringingForeignGuest: delegate.bringingForeignGuest ?? "NO",
                guestNationality: delegate.guestNationality ?? "",
                accommodationNeeded: delegate.accommodationNeeded ?? "NO",
                dietaryNeeds: delegate.dietaryNeeds ?? "NO",
                dietaryDetails: delegate.dietaryDetails ?? "",
                additionalComments: delegate.additionalComments ?? "",
                feePackageId: delegate.feePackageId ?? "",
                addOnPackageIds: delegate.addOnPackageIds ?? [],
                feePaid: delegate.feePaid,
                feeAmount: delegate.feeAmount,
                amountPaid: delegate.amountPaid ?? undefined,
                roomPref: delegate.roomPref,
                partnerClaimNote: delegate.partnerClaimNote ?? "",
                conferencePosition: delegate.conferencePosition ?? "",
              }}
              defaultFeeAmount={defaultFee}
              isManagerMode={canManage}
              onCancel={() => setIsEditing(false)}
              onSubmit={handleEditSubmit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
