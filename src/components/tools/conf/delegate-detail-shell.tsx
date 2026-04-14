"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileUp,
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
import { fetchDefaultConference } from "@/lib/conf/client";
import { fmtRmb } from "@/lib/conf/currency";

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
  feeAmount: number | null;
  feePaid: boolean;
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  partnerClaimNote: string | null;
  passportPhotoPath: string | null;
  bookletPhotoPath: string | null;
  flyerReady: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

type Props = {
  delegateId: string;
  canManage: boolean;
  canSelfEdit: boolean;
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
}: Props) {
  const [confId, setConfId] = useState("");
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<
    "booklet" | "passport" | null
  >(null);

  const loadDelegate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const conf = await fetchDefaultConference();
      setConfId(conf.id);

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
    kind: "booklet" | "passport",
    file: File | null,
  ) => {
    if (!confId || !file || !canSelfEdit || uploadingKind) return;

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

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || `Failed to update ${kind} document`);
      }

      setDelegate(payload as Delegate);
      setNotice(
        kind === "booklet"
          ? "Conference photo updated successfully."
          : "Passport document updated successfully.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingKind(null);
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
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    void handleUpload("booklet", file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

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
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void handleUpload("passport", file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Linked delegate accounts can update their conference photo from
              this page. Managers can also replace passport files.
            </p>
          </CardContent>
        </Card>

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
                <p className="mt-1">Passport: {asText(delegate.passportNo)}</p>
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
    </div>
  );
}
