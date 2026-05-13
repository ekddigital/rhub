"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Download,
  FileImage,
  FileUp,
  Film,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  DelegateRegistrationForm,
  type DelegateRegistrationSnapshot,
  type DelegatePhotoField,
  type DelegateRegistrationPayload,
  type UploadedPhotoMeta,
  type UploadFeedback,
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
import { useUser } from "@/contexts/user-context";

type SuccessState = {
  delegateId: string;
  delegateCode: string | null;
  flyerReady: boolean;
  confId: string;
  updatedExisting?: boolean;
};

type DelegatePhotoSample = {
  id: string;
  imageUrl: string;
};

const LIBERIA_INDEPENDENCE_YEAR = 1847;

function getLiberiaIndependenceAnniversary(year: number): number {
  return Math.max(0, year - LIBERIA_INDEPENDENCE_YEAR);
}

function formatOrdinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

const FEATURED_PHOTOS = [
  "/conf/assets/hotel/main_entrance_view.png",
  "/conf/assets/hotel/conference_hall.jpg",
  "/conf/assets/hotel/swimming_pool_at_night.png",
  "/conf/assets/hotel/dinner_hall2.jpg",
  "/conf/assets/hotel/receptionist_desk.png",
  "/conf/assets/jinan_city/day_view_landscape.png",
  "/conf/assets/jinan_city/evening_view_portrait.png",
  "/conf/assets/jinan_city/morning_view_landscape.png",
] as const;

const FEATURED_VIDEOS = [
  {
    src: "/conf/assets/hotel/full_tour.mp4",
    title: "Arcadia Hotel Full Tour",
    poster: "/conf/assets/hotel/conference_hall.jpg",
  },
  {
    src: "/conf/assets/hotel/conference_hall_portrait_vid.mp4",
    title: "Conference Hall Atmosphere",
    poster: "/conf/assets/hotel/dinning_hall.jpg",
  },
] as const;

/** sessionStorage: "self" | "other" — persists registering-for-another-person across refresh */
const REGISTER_TARGET_SESSION_KEY = "rhub-delegate-register-target";

function publicDelegateDraftStorageKeys(confId: string) {
  return {
    self: `conf-delegate-draft:${confId}-public-self`,
    other: `conf-delegate-draft:${confId}-public-other`,
  } as const;
}

export function DelegatePublicRegister() {
  const { user: authUser } = useUser();
  const [registeringForOther, setRegisteringForOther] = useState(false);
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [accountPrefill, setAccountPrefill] = useState<{
    name: string;
    email: string;
    phone: string;
    city: string;
    province: string;
  } | null>(null);

  const [confId, setConfId] = useState("");
  const [confYear, setConfYear] = useState(new Date().getFullYear());
  const [defaultFeeAmount, setDefaultFeeAmount] = useState(250);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [samplePhotos, setSamplePhotos] = useState<DelegatePhotoSample[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPhotoMeta, setUploadedPhotoMeta] = useState<
    Partial<Record<DelegatePhotoField, UploadedPhotoMeta>>
  >({});
  const [photoFieldErrors, setPhotoFieldErrors] = useState<
    Partial<Record<DelegatePhotoField, string>>
  >({});
  const [photoUploadFeedback, setPhotoUploadFeedback] = useState<
    Partial<Record<DelegatePhotoField, UploadFeedback>>
  >({});
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [correctionBusy, setCorrectionBusy] = useState<
    "passport" | "booklet" | "entry-stamp" | "visa" | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const liberiaAnniversary = getLiberiaIndependenceAnniversary(confYear);
  const liberiaAnniversaryLabel = formatOrdinal(liberiaAnniversary);
  const independenceDateLabel = `July 26, ${confYear}`;

  const clearSiblingPublicDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      if (confId) {
        const keys = publicDelegateDraftStorageKeys(confId);
        localStorage.removeItem(keys.self);
        localStorage.removeItem(keys.other);
      }
      localStorage.removeItem("conf-delegate-draft:public-new");
    } catch {
      /* ignore */
    }
  }, [confId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(REGISTER_TARGET_SESSION_KEY) === "other") {
        setRegisteringForOther(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/conf/default/delegate-register-prefill", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          authenticated?: boolean;
          name?: string;
          email?: string;
          phone?: string;
          city?: string;
          province?: string;
        };
        if (cancelled || !data.authenticated) return;
        setAccountPrefill({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          province: data.province ?? "",
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const beginRegisterForSomeoneElse = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(REGISTER_TARGET_SESSION_KEY, "other");
      } catch {
        /* ignore */
      }
      clearSiblingPublicDraft();
    }
    setRegisteringForOther(true);
    setFormInstanceKey((k) => k + 1);
    setUploadedPhotoMeta({});
    setPhotoFieldErrors({});
    setPhotoUploadFeedback({});
  }, [clearSiblingPublicDraft]);

  const beginRegisterForSelf = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(REGISTER_TARGET_SESSION_KEY, "self");
      } catch {
        /* ignore */
      }
      clearSiblingPublicDraft();
    }
    setRegisteringForOther(false);
    setFormInstanceKey((k) => k + 1);
    setUploadedPhotoMeta({});
    setPhotoFieldErrors({});
    setPhotoUploadFeedback({});
  }, [clearSiblingPublicDraft]);

  const FILE_KIND_META = useMemo<
    Record<
      DelegatePhotoField,
      { kind: "passport" | "booklet" | "entry-stamp" | "visa"; label: string }
    >
  >(
    () => ({
      passportPhoto: { kind: "passport", label: "Passport Photo Page" },
      lastEntryStampPhoto: {
        kind: "entry-stamp",
        label: "Last Entry Stamp Page",
      },
      currentVisaPhoto: { kind: "visa", label: "Current Visa Page" },
      bookletPhoto: { kind: "booklet", label: "Conference Booklet Photo" },
    }),
    [],
  );

  const buildRegistrationBody = useCallback(
    (snapshot: DelegateRegistrationSnapshot) => ({
      name: snapshot.name,
      province: snapshot.province,
      passportNo: snapshot.passportNo,
      university: snapshot.university,
      city: snapshot.city,
      phone: snapshot.phone,
      wechat: snapshot.wechat,
      email: snapshot.email,
      gender: snapshot.gender,
      attendanceIntent: snapshot.attendanceIntent,
      travelAssistanceNeeded: snapshot.travelAssistanceNeeded,
      schoolCommunicationNeeded: snapshot.schoolCommunicationNeeded,
      schoolCommunicationDetails: snapshot.schoolCommunicationDetails,
      studyYear: snapshot.studyYear,
      bringingForeignGuest: snapshot.bringingForeignGuest,
      guestNationality: snapshot.guestNationality,
      accommodationNeeded: snapshot.accommodationNeeded,
      dietaryNeeds: snapshot.dietaryNeeds,
      dietaryDetails: snapshot.dietaryDetails,
      additionalComments: snapshot.additionalComments,
      feePackageId: snapshot.feePackageId,
      addOnPackageIds: snapshot.addOnPackageIds,
      feeAmount: snapshot.feeAmount,
      amountPaid: snapshot.amountPaid,
      feePaid: snapshot.feePaid,
      roomPref: snapshot.roomPref,
      wantsSingleRoom: snapshot.roomPref === "SINGLE",
      partnerClaimNote: snapshot.partnerClaimNote,
      conferencePosition: snapshot.conferencePosition || null,
    }),
    [],
  );

  const uploadFieldFile = useCallback(
    async (
      delegateId: string,
      field: DelegatePhotoField,
      file: File,
      snapshot: DelegateRegistrationSnapshot,
      onFlyerReady?: (ready: boolean) => void,
    ) => {
      const meta = FILE_KIND_META[field];
      const validation = validateDelegateUploadFile(file, meta.kind);
      if (!validation.ok) {
        const message = `${meta.label}: ${validation.error}`;
        setPhotoFieldErrors((prev) => ({ ...prev, [field]: message }));
        setPhotoUploadFeedback((prev) => ({
          ...prev,
          [field]: { status: "error", progress: 0, message },
        }));
        throw new Error(message);
      }

      setPhotoFieldErrors((prev) => ({ ...prev, [field]: "" }));
      setPhotoUploadFeedback((prev) => ({
        ...prev,
        [field]: { status: "uploading", progress: 0, message: `Uploading ${meta.label}...` },
      }));

      await new Promise<void>((resolve, reject) => {
        const fd = new FormData();
        fd.append("kind", meta.kind);
        fd.append("file", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/conf/${confId}/delegates/${delegateId}/documents`);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          setPhotoUploadFeedback((prev) => ({
            ...prev,
            [field]: {
              status: "uploading",
              progress,
              message: `Uploading ${meta.label}...`,
            },
          }));
        };
        xhr.onerror = () => {
          const message = `${meta.label}: Upload failed due to a network error.`;
          setPhotoFieldErrors((prev) => ({ ...prev, [field]: message }));
          setPhotoUploadFeedback((prev) => ({
            ...prev,
            [field]: { status: "error", progress: 0, message },
          }));
          reject(new Error(message));
        };
        xhr.onload = async () => {
          const status = xhr.status || 0;
          const raw = xhr.responseText || "";
          if (status < 200 || status >= 300) {
            const payloadForError = await parseUploadErrorPayload(
              new Response(raw, { status }),
            );
            const detail = formatUploadError(
              payloadForError,
              `Failed to upload ${meta.label}`,
              status,
            );
            const message = `${meta.label}: ${detail}`;
            setPhotoFieldErrors((prev) => ({ ...prev, [field]: message }));
            setPhotoUploadFeedback((prev) => ({
              ...prev,
              [field]: { status: "error", progress: 0, message },
            }));
            reject(new Error(message));
            return;
          }
          let payload: { flyerReady?: boolean; filePath?: string } = {};
          try {
            payload = raw
              ? (JSON.parse(raw) as { flyerReady?: boolean; filePath?: string })
              : {};
          } catch {
            payload = {};
          }
          const filePath = payload.filePath || "";
          if (filePath) {
            setUploadedPhotoMeta((prev) => ({
              ...prev,
              [field]: {
                fileName: file.name,
                filePath,
              },
            }));
          }
          if (typeof payload.flyerReady === "boolean") {
            onFlyerReady?.(payload.flyerReady);
          }
          setPhotoUploadFeedback((prev) => ({
            ...prev,
            [field]: {
              status: "done",
              progress: 100,
              message: `${meta.label} uploaded successfully.`,
            },
          }));
          resolve();
        };
        xhr.send(fd);
      });
    },
    [FILE_KIND_META, confId],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        setConfYear(conf.year);
        setDefaultFeeAmount(conf.delegateFee || 250);

        setSamplesLoading(true);
        const sampleRes = await fetch(
          `/api/conf/${conf.id}/photo-samples?limit=8`,
          {
            cache: "no-store",
          },
        );

        if (sampleRes.ok) {
          const samplePayload = (await sampleRes.json()) as {
            items?: DelegatePhotoSample[];
          };
          setSamplePhotos(samplePayload.items || []);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to initialize registration",
        );
      } finally {
        setSamplesLoading(false);
        setLoading(false);
      }
    };

    void init();
  }, []);

  const handleSubmit = async (
    payload: DelegateRegistrationPayload,
  ): Promise<boolean> => {
    if (!confId || submitting) return false;

    setSubmitting(true);
    setError(null);
    setPhotoFieldErrors({});
    setPhotoUploadFeedback({});
    setSuccess(null);
    setSuccessMessage(null);

    try {
      const createRes = await fetch(`/api/conf/${confId}/delegates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegistrationBody(payload)),
      });

      const createdPayload = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(
          createdPayload.error || "Failed to submit registration",
        );
      }

      const delegateId = createdPayload.id as string;
      let flyerReady = Boolean(createdPayload.flyerReady);

      if (payload.passportPhoto) {
        await uploadFieldFile(
          delegateId,
          "passportPhoto",
          payload.passportPhoto,
          payload,
          (ready) => {
            flyerReady = flyerReady || ready;
          },
        );
      }
      if (payload.lastEntryStampPhoto) {
        await uploadFieldFile(
          delegateId,
          "lastEntryStampPhoto",
          payload.lastEntryStampPhoto,
          payload,
          (ready) => {
            flyerReady = flyerReady || ready;
          },
        );
      }
      if (payload.currentVisaPhoto) {
        await uploadFieldFile(
          delegateId,
          "currentVisaPhoto",
          payload.currentVisaPhoto,
          payload,
          (ready) => {
            flyerReady = flyerReady || ready;
          },
        );
      }
      if (payload.bookletPhoto) {
        await uploadFieldFile(
          delegateId,
          "bookletPhoto",
          payload.bookletPhoto,
          payload,
          (ready) => {
            flyerReady = flyerReady || ready;
          },
        );
      }

      setSuccess({
        confId,
        delegateId,
        delegateCode: (createdPayload.delegateCode as string | null) || null,
        flyerReady,
        updatedExisting: Boolean(createdPayload.updatedExisting),
      });
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(REGISTER_TARGET_SESSION_KEY, "self");
        } catch {
          /* ignore */
        }
      }
      setRegisteringForOther(false);
      setUploadedPhotoMeta({});

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} Please check the highlighted upload field and retry.`
          : "Registration failed. Please check the highlighted upload field and retry.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectionUpload = async (
    kind: "passport" | "booklet" | "entry-stamp" | "visa",
    file: File | null,
  ) => {
    if (!file || !success || correctionBusy) return;

    const validation = validateDelegateUploadFile(file, kind);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setCorrectionBusy(kind);
    setError(null);
    setSuccessMessage(null);

    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);

      const res = await fetch(
        `/api/conf/${success.confId}/delegates/${success.delegateId}/documents`,
        {
          method: "POST",
          body: fd,
        },
      );

      const payload = await parseUploadErrorPayload(res);
      if (!res.ok) {
        throw new Error(
          formatUploadError(
            payload,
            `Failed to replace ${kind} file`,
            res.status,
          ),
        );
      }

      setSuccess((prev) =>
        prev
          ? {
              ...prev,
              flyerReady:
                prev.flyerReady ||
                Boolean((payload as { flyerReady?: boolean }).flyerReady),
            }
          : prev,
      );

      const parsedPayload = (payload || {}) as {
        flyerReady?: boolean;
        filePath?: string;
      };
      const fieldByKind: Record<
        "passport" | "entry-stamp" | "visa" | "booklet",
        DelegatePhotoField
      > = {
        passport: "passportPhoto",
        "entry-stamp": "lastEntryStampPhoto",
        visa: "currentVisaPhoto",
        booklet: "bookletPhoto",
      };
      if (parsedPayload.filePath && success) {
        const mappedField = fieldByKind[kind];
        setUploadedPhotoMeta((prev) => ({
          ...prev,
          [mappedField]: {
            fileName: file.name,
            filePath: parsedPayload.filePath as string,
          },
        }));
      }

      setSuccessMessage(
        kind === "passport"
          ? "Passport file updated successfully."
          : kind === "entry-stamp"
            ? "Last entry stamp updated successfully."
            : kind === "visa"
              ? "Current visa updated successfully."
              : "Booklet photo updated successfully.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "File replacement failed");
    } finally {
      setCorrectionBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="mx-auto h-16 w-80 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/tools/conf/delegates">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <Image
          src="/conf/lsuic_logo.png"
          alt="LSUIC"
          width={56}
          height={56}
          className="h-14 w-14 rounded-full border border-[#C8A061]/40 bg-white p-2 shadow-sm"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Conference Delegate Registration
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit your details, documents, and booklet photo for LSUIC 2026.
          </p>
        </div>
      </div>

      {!loading && !success && (authUser || registeringForOther) && (
        <div className="flex flex-col gap-3 rounded-lg border border-[#C8A061]/35 bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {registeringForOther ? (
              <>
                <span className="font-medium text-foreground">
                  Registering someone else
                </span>
                {" — "}
                Use this form only for that delegate&apos;s details. Your login is
                just for access; nothing here updates your own hub profile until you
                submit their registration.
              </>
            ) : (
              <>
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {authUser?.name}
                </span>
                . We&apos;ll fill{" "}
                <strong className="font-medium text-foreground">
                  name, email
                </strong>
                , and when available{" "}
                <strong className="font-medium text-foreground">
                  phone &amp; city
                </strong>{" "}
                from your account / committee roster — only where a field is still
                empty (including after draft restore).
              </>
            )}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {!registeringForOther ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#C8A061]/50"
                onClick={beginRegisterForSomeoneElse}
              >
                <UserPlus className="mr-1.5 size-4" />
                Register for someone else
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-[#0B4FD9] text-white hover:bg-[#0B4FD9]/90"
                onClick={beginRegisterForSelf}
              >
                I&apos;m registering myself
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {success ? (
        <>
          <Card className="border-emerald-500/30 bg-linear-to-br from-emerald-500/10 via-background to-[#0B4FD9]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="size-5" />
                {success.updatedExisting
                  ? "Registration Updated Successfully"
                  : "Registration Submitted Successfully"}
              </CardTitle>
              <CardDescription>
                {success.updatedExisting
                  ? "Your existing registration has been updated with your latest submission."
                  : "You are registered. Save your conference ID and review your next steps below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      Conference ID (20th Edition)
                    </Badge>
                    <span className="font-semibold">
                      {success.delegateCode || "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: {`LS20-${liberiaAnniversary}-YY-####`} (20th
                    conference + Liberia {liberiaAnniversaryLabel} independence
                    anniversary + year + sequence)
                  </p>
                  <p className="text-xs font-medium text-[#8E0E00]">
                    {`Conference celebration includes Liberia Independence Day on ${independenceDateLabel}`}
                  </p>

                  {success.flyerReady ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-emerald-700">
                        Delegate card ready
                      </Badge>
                      <Link
                        href={`/api/conf/${success.confId}/delegates/${success.delegateId}/flyer`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-[#0B4FD9]/10 px-2 py-1 text-xs font-medium text-[#0B4FD9]"
                      >
                        <FileImage className="size-3" />
                        Preview Delegate Card
                      </Link>
                      <Link
                        href={`/api/conf/${success.confId}/delegates/${success.delegateId}/flyer?format=png&download=1`}
                        className="inline-flex items-center gap-1 rounded-md bg-[#C8102E]/10 px-2 py-1 text-xs font-medium text-[#C8102E]"
                        download
                      >
                        <Download className="size-3" />
                        Download PNG
                      </Link>
                      <Link
                        href={`/api/conf/${success.confId}/delegates/${success.delegateId}/flyer?download=1`}
                        className="inline-flex items-center gap-1 rounded-md bg-[#0B1E78]/10 px-2 py-1 text-xs font-medium text-[#0B1E78]"
                        download
                      >
                        <Download className="size-3" />
                        Download SVG
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Your delegate card will be available once payment is
                      confirmed.
                    </p>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-border/60 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">
                    Need to adjust uploaded files? You can replace them right
                    now.
                  </p>

                  <p className="text-xs text-muted-foreground">
                    If your visa and last entry stamp are on the same page, you
                    can upload the same image or PDF for both.
                  </p>

                  <div className="rounded-md border border-amber-200/70 bg-amber-50/80 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground dark:border-amber-900/45 dark:bg-amber-950/25">
                    <p className="mb-1 font-medium text-foreground">
                      Accepted formats only
                    </p>
                    <p className="mb-1">{DELEGATE_TRAVEL_UPLOAD_RULE_TEXT}</p>
                    <p className="mb-1">{DELEGATE_BOOKLET_UPLOAD_RULE_TEXT}</p>
                    <p className="border-t border-amber-200/60 pt-1.5 dark:border-amber-900/40">
                      {DELEGATE_UPLOAD_CONVERSION_TIP}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                        correctionBusy ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <FileUp className="size-3.5" />
                      {correctionBusy === "passport"
                        ? "Uploading..."
                        : "Replace Passport File"}
                      <input
                        type="file"
                        className="hidden"
                        accept={delegateDocumentAcceptAttribute("passport")}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          void handleCorrectionUpload("passport", file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>

                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                        correctionBusy ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <FileUp className="size-3.5" />
                      {correctionBusy === "entry-stamp"
                        ? "Uploading..."
                        : "Replace Last Entry Stamp"}
                      <input
                        type="file"
                        className="hidden"
                        accept={delegateDocumentAcceptAttribute("entry-stamp")}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          void handleCorrectionUpload("entry-stamp", file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>

                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                        correctionBusy ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <FileUp className="size-3.5" />
                      {correctionBusy === "visa"
                        ? "Uploading..."
                        : "Replace Current Visa"}
                      <input
                        type="file"
                        className="hidden"
                        accept={delegateDocumentAcceptAttribute("visa")}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          void handleCorrectionUpload("visa", file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>

                    <label
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
                        correctionBusy ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <Camera className="size-3.5" />
                      {correctionBusy === "booklet"
                        ? "Uploading..."
                        : "Replace Booklet Photo"}
                      <input
                        type="file"
                        className="hidden"
                        accept={delegateDocumentAcceptAttribute("booklet")}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          void handleCorrectionUpload("booklet", file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {successMessage && (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-700">
                      {successMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSuccess(null);
                    setSuccessMessage(null);
                    setError(null);
                    setPhotoFieldErrors({});
                    setPhotoUploadFeedback({});
                    setUploadedPhotoMeta({});
                    clearSiblingPublicDraft();
                  }}
                >
                  Register Another Delegate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-[#C8A061]/35 bg-linear-to-br from-[#0B4FD9]/10 via-background to-[#8E0E00]/15">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="size-5 text-[#0B4FD9]" />
                Welcome To Jinan 2026
              </CardTitle>
              <CardDescription>
                Brochure-style venue and city media layering for a more
                immersive conference experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black/70">
                <Image
                  src={FEATURED_PHOTOS[7]}
                  alt="Jinan city panoramic view"
                  width={1600}
                  height={900}
                  className="h-56 w-full object-cover sm:h-64"
                />
                <div className="absolute inset-0 bg-linear-to-b from-[#061338]/35 via-[#061338]/58 to-[#061338]/95" />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-white/80">
                    {`LSUIC 20th Conference | Liberia ${liberiaAnniversaryLabel} Independence | July 26 Celebration`}
                  </p>
                  <h3
                    className="text-2xl font-bold sm:text-3xl"
                    style={{
                      textShadow:
                        "0 2px 8px rgba(0, 0, 0, 0.75), 0 0 24px rgba(0, 0, 0, 0.45)",
                    }}
                  >
                    Beautiful city, meaningful conference, unforgettable
                    memories
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="group relative overflow-hidden rounded-xl border border-white/20 bg-black/80 shadow-md lg:col-span-2">
                  <Image
                    src={FEATURED_PHOTOS[0]}
                    alt="Conference venue entrance"
                    width={1400}
                    height={900}
                    className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-medium text-white/90">
                    Arcadia main entrance - official host venue
                  </div>
                </div>

                <div className="grid gap-3">
                  {FEATURED_PHOTOS.slice(5, 8).map((src, index) => (
                    <div
                      key={src}
                      className="group relative overflow-hidden rounded-xl border border-white/20 bg-black/80"
                    >
                      <Image
                        src={src}
                        alt="Jinan city view"
                        width={700}
                        height={420}
                        className="h-20 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-black/45 to-transparent" />
                      <div className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium text-white/90">
                        {index === 0
                          ? "City skyline"
                          : index === 1
                            ? "Evening lights"
                            : "Morning panorama"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {FEATURED_VIDEOS.map((clip) => (
                  <div
                    key={clip.src}
                    className="overflow-hidden rounded-xl border border-white/20 bg-black/90 shadow-md"
                  >
                    <video
                      className="h-56 w-full object-cover"
                      controls
                      preload="metadata"
                      poster={clip.poster}
                    >
                      <source src={clip.src} type="video/mp4" />
                    </video>
                    <div className="border-t border-white/10 px-3 py-2 text-xs text-white/85">
                      {clip.title}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {FEATURED_PHOTOS.slice(1, 6).map((src) => (
                  <div
                    key={src}
                    className="group overflow-hidden rounded-xl border border-white/20 bg-black/80"
                  >
                    <Image
                      src={src}
                      alt="Conference photo"
                      width={600}
                      height={420}
                      className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="border-[#C8A061]/40">
            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
              <CardDescription>
                Please complete all required fields exactly as requested. Your
                answers are saved only on this device until you submit; files are
                sent after you complete registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DelegateRegistrationForm
                key={`public-register-${formInstanceKey}-${registeringForOther ? "other" : "self"}`}
                submitting={submitting}
                defaultFeeAmount={defaultFeeAmount}
                submitLabel="Complete Registration"
                draftKey={
                  confId
                    ? `${confId}-public-${registeringForOther ? "other" : "self"}`
                    : "pending-public"
                }
                accountPrefill={registeringForOther ? null : accountPrefill}
                skipAccountPrefill={registeringForOther}
                uploadedPhotoMeta={uploadedPhotoMeta}
                photoFieldErrors={photoFieldErrors}
                photoUploadFeedback={photoUploadFeedback}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-[#C8A061]/35 bg-linear-to-br from-[#0B4FD9]/5 via-background to-[#8E0E00]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="size-5 text-[#0B4FD9]" />
                Past Delegate Photo Samples
              </CardTitle>
              <CardDescription>
                Random samples from previously uploaded conference booklet
                photos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {samplesLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-40 animate-pulse rounded-xl border border-border bg-muted"
                    />
                  ))}
                </div>
              ) : samplePhotos.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {samplePhotos.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      {/* Use <img> instead of <Image> — asset server photos require direct URL */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt="Delegate sample photo"
                        className="h-44 w-full object-contain object-top"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sample photos available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
