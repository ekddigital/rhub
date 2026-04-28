"use client";

import { useEffect, useState } from "react";
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
  type DelegateRegistrationPayload,
} from "@/components/tools/conf/delegate-registration-form";

type SuccessState = {
  delegateId: string;
  delegateCode: string | null;
  flyerReady: boolean;
  confId: string;
};

type DelegatePhotoSample = {
  id: string;
  imageUrl: string;
};

type UploadErrorPayload = {
  error?: string;
  requestId?: string;
  details?: {
    supportedMimeTypes?: string[];
    receivedMime?: string | null;
    inferredMime?: string | null;
  };
};

function formatUploadError(
  payload: UploadErrorPayload,
  fallback: string,
): string {
  const base = payload.error || fallback;
  const requestRef = payload.requestId ? ` (Ref: ${payload.requestId})` : "";
  const receivedMime = payload.details?.receivedMime || payload.details?.inferredMime;
  const accepted = payload.details?.supportedMimeTypes?.join(", ");

  if (accepted) {
    return `${base}${requestRef}. Accepted formats: ${accepted}${
      receivedMime ? `. Detected file type: ${receivedMime}` : ""
    }`;
  }
  return `${base}${requestRef}`;
}

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

export function DelegatePublicRegister() {
  const [confId, setConfId] = useState("");
  const [confYear, setConfYear] = useState(new Date().getFullYear());
  const [defaultFeeAmount, setDefaultFeeAmount] = useState(250);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [samplePhotos, setSamplePhotos] = useState<DelegatePhotoSample[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [correctionBusy, setCorrectionBusy] = useState<
    "passport" | "booklet" | "entry-stamp" | "visa" | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const liberiaAnniversary = getLiberiaIndependenceAnniversary(confYear);
  const liberiaAnniversaryLabel = formatOrdinal(liberiaAnniversary);
  const independenceDateLabel = `July 26, ${confYear}`;

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
    setSuccess(null);
    setSuccessMessage(null);

    try {
      const createRes = await fetch(`/api/conf/${confId}/delegates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          feePackageId: payload.feePackageId,
          feeAmount: payload.feeAmount,
          amountPaid: payload.amountPaid,
          feePaid: payload.feePaid,
          roomPref: payload.roomPref,
          wantsSingleRoom: payload.roomPref === "SINGLE",
          partnerClaimNote: payload.partnerClaimNote,
          conferencePosition: payload.conferencePosition || null,
        }),
      });

      const createdPayload = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(
          createdPayload.error || "Failed to submit registration",
        );
      }

      const delegateId = createdPayload.id as string;
      let flyerReady = Boolean(createdPayload.flyerReady);

      const uploadDocument = async (
        kind: "passport" | "booklet" | "entry-stamp" | "visa",
        file: File | null,
      ) => {
        if (!file) return;
        const fd = new FormData();
        fd.append("kind", kind);
        fd.append("file", file);

        const res = await fetch(
          `/api/conf/${confId}/delegates/${delegateId}/documents`,
          {
            method: "POST",
            body: fd,
          },
        );

        const responsePayload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            formatUploadError(
              responsePayload as UploadErrorPayload,
              `Failed to upload ${kind} document`,
            ),
          );
        }

        flyerReady = flyerReady || Boolean(responsePayload.flyerReady);
      };

      await uploadDocument("passport", payload.passportPhoto);
      await uploadDocument("entry-stamp", payload.lastEntryStampPhoto);
      await uploadDocument("visa", payload.currentVisaPhoto);
      await uploadDocument("booklet", payload.bookletPhoto);

      setSuccess({
        confId,
        delegateId,
        delegateCode: (createdPayload.delegateCode as string | null) || null,
        flyerReady,
      });

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
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

    const passportTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    const bookletTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    const allowed = kind === "booklet" ? bookletTypes : passportTypes;

    if (!allowed.includes(file.type)) {
      setError(
        kind === "booklet"
          ? "Booklet photo must be PNG, JPEG, or WebP"
          : "Document file must be PNG, JPEG, WebP, or PDF",
      );
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

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          formatUploadError(
            payload as UploadErrorPayload,
            `Failed to replace ${kind} file`,
          ),
        );
      }

      setSuccess((prev) =>
        prev
          ? {
              ...prev,
              flyerReady: prev.flyerReady || Boolean(payload.flyerReady),
            }
          : prev,
      );

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
                Registration Submitted Successfully
              </CardTitle>
              <CardDescription>
                You are registered. Save your conference ID and review your next
                steps below.
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
                        accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,image/png,image/jpeg,image/webp,image/gif,application/pdf"
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
                        accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,image/png,image/jpeg,image/webp,image/gif,application/pdf"
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
                        accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,image/png,image/jpeg,image/webp,image/gif,application/pdf"
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
                        accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
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
                Please complete all required fields exactly as requested.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DelegateRegistrationForm
                submitting={submitting}
                defaultFeeAmount={defaultFeeAmount}
                submitLabel="Complete Registration"
                draftKey="public-new"
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
                  {Array.from({ length: 8 }).map((_, idx) => (
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
