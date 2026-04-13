"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileImage } from "lucide-react";
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

export function DelegatePublicRegister() {
  const [confId, setConfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to initialize registration",
        );
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const handleSubmit = async (payload: DelegateRegistrationPayload) => {
    if (!confId || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const createRes = await fetch(`/api/conf/${confId}/delegates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          passportNo: payload.passportNo,
          university: payload.university,
          city: payload.city,
          phone: payload.phone,
          wechat: payload.wechat,
          email: payload.email,
          gender: payload.gender,
          feeAmount: payload.feeAmount,
          feePaid: payload.feePaid,
          roomPref: payload.roomPref,
          wantsSingleRoom: payload.roomPref === "SINGLE",
          partnerClaimNote: payload.partnerClaimNote,
        }),
      });

      const createdPayload = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(createdPayload.error || "Failed to submit registration");
      }

      const delegateId = createdPayload.id as string;

      const uploadDocument = async (
        kind: "passport" | "booklet",
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
            responsePayload.error || `Failed to upload ${kind} document`,
          );
        }
      };

      await uploadDocument("passport", payload.passportPhoto);
      await uploadDocument("booklet", payload.bookletPhoto);

      if (payload.feePaid) {
        await fetch(`/api/conf/${confId}/delegates/${delegateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feePaid: true, status: "CONFIRMED" }),
        });
      }

      const finalRes = await fetch(`/api/conf/${confId}/delegates/${delegateId}`, {
        cache: "no-store",
      });
      const finalPayload = await finalRes.json();

      setSuccess({
        confId,
        delegateId,
        delegateCode: finalPayload.delegateCode || null,
        flyerReady: Boolean(finalPayload.flyerReady),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setSubmitting(false);
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
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/tools/conf/delegates">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
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

      {success && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-5" />
              Registration Submitted
            </CardTitle>
            <CardDescription>
              Your information has been recorded successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Conference ID</Badge>
              <span className="font-semibold">{success.delegateCode || "Pending"}</span>
            </div>
            {success.flyerReady ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-emerald-700">
                  Personal flyer ready
                </Badge>
                <Link
                  href={`/api/conf/${success.confId}/delegates/${success.delegateId}/flyer`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-[#0B4FD9]/10 px-2 py-1 text-xs font-medium text-[#0B4FD9]"
                >
                  <FileImage className="size-3" />
                  Open Personal Flyer
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Your flyer will be available once payment is confirmed.
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
            submitLabel="Complete Registration"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
