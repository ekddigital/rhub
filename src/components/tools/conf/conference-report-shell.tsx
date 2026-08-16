"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConferenceReportPreview } from "@/components/tools/conf/conference-report/ConferenceReportPreview";
import { REPORT_META } from "@/components/tools/conf/conference-report/content-data";
import {
  createDefaultReportSignatoryDraft,
} from "@/components/tools/conf/conference-report/report-signatories";
import {
  DocumentSignatoryControls,
  SIGNATORY_SLOT_UI,
  type SignatoryDraft,
  type SignatoryMember,
} from "@/components/tools/conf/document-signatory-controls";
import { fetchDefaultConference } from "@/lib/conf/client";
import { filterMembersForConferenceLetterRoster } from "@/lib/conf/conference-letter-roster";
import { normalizeSignatureProfileKey } from "@/lib/conf/signature-profiles";
import type { ReportRuntimeContext } from "@/lib/conf/conference-report/report-runtime";

type SignatureProfile = {
  key: string;
  name: string;
  title?: string;
  signatureDataUrl: string;
};

export function ConferenceReportShell({
  runtime,
}: {
  runtime: ReportRuntimeContext;
}) {
  const [confId, setConfId] = useState("");
  const [members, setMembers] = useState<SignatoryMember[]>([]);
  const [necPresidentName, setNecPresidentName] = useState("");
  const [signatureLibrary, setSignatureLibrary] = useState<
    Record<string, SignatureProfile>
  >({});
  const [signatoryDraft, setSignatoryDraft] = useState<SignatoryDraft>(
    createDefaultReportSignatoryDraft(),
  );

  const resolveSignatureForName = useCallback(
    (name: string) => {
      const key = normalizeSignatureProfileKey(name);
      return signatureLibrary[key]?.signatureDataUrl ?? "";
    },
    [signatureLibrary],
  );

  const hydrateSignatoryDraftSignatures = useCallback(
    (draft: SignatoryDraft): SignatoryDraft => {
      const next = { ...draft };
      for (const { key } of SIGNATORY_SLOT_UI) {
        const slot = next[key];
        if (!slot.sig.trim() && slot.name.trim()) {
          const matched = resolveSignatureForName(slot.name);
          if (matched) {
            next[key] = { ...slot, sig: matched };
          }
        }
      }
      return next;
    },
    [resolveSignatureForName],
  );

  const saveSignatureProfile = useCallback(
    async (name: string, title: string, signatureDataUrl: string) => {
      const normalizedName = name.trim();
      if (!confId || !normalizedName || !signatureDataUrl) return;

      const key = normalizeSignatureProfileKey(normalizedName);
      const profile: SignatureProfile = {
        key,
        name: normalizedName,
        title: title.trim(),
        signatureDataUrl,
      };

      setSignatureLibrary((prev) => ({ ...prev, [key]: profile }));
      setSignatoryDraft((draft) => hydrateSignatoryDraftSignatures(draft));

      try {
        await fetch(`/api/conf/${confId}/letters/signatures`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
      } catch (err) {
        console.warn("Failed to persist signature profile", err);
      }
    },
    [confId, hydrateSignatoryDraftSignatures],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);

        const [membersRes, bookletRes, signaturesRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/members`),
          fetch(`/api/conf/${conf.id}/booklet/data`, { cache: "no-store" }).catch(
            () => null,
          ),
          fetch(`/api/conf/${conf.id}/letters/signatures`, {
            cache: "no-store",
          }).catch(() => null),
        ]);

        if (membersRes.ok) {
          const mems = (await membersRes.json()) as SignatoryMember[];
          setMembers(
            filterMembersForConferenceLetterRoster(
              mems.map((member) => ({
                ...member,
                role: member.role ?? "COMMITTEE",
              })),
            ) as SignatoryMember[],
          );
        }

        if (bookletRes?.ok) {
          const booklet = await bookletRes.json();
          const nec = Array.isArray(booklet?.necMembers)
            ? booklet.necMembers
            : [];
          const necPresident = nec.find(
            (n: { title?: string; name?: string }) =>
              (n.title || "").toLowerCase().includes("national president"),
          );
          if (necPresident?.name) {
            setNecPresidentName(String(necPresident.name));
          }
        }

        if (signaturesRes?.ok) {
          const signatureData = (await signaturesRes.json()) as {
            profiles?: SignatureProfile[];
          };
          const mapped = (signatureData.profiles ?? []).reduce<
            Record<string, SignatureProfile>
          >((acc, profile) => {
            if (!profile?.key || !profile?.signatureDataUrl) return acc;
            acc[profile.key] = profile;
            return acc;
          }, {});
          setSignatureLibrary(mapped);
        }
      } catch {
        // Preview still works with static certification defaults.
      }
    };

    void init();
  }, []);

  useEffect(() => {
    if (Object.keys(signatureLibrary).length === 0) return;
    setSignatoryDraft((current) => hydrateSignatoryDraftSignatures(current));
  }, [hydrateSignatoryDraftSignatures, signatureLibrary]);

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {REPORT_META.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Official post-conference report — {REPORT_META.bookletTitle}
          </p>
        </div>
      </div>

      <Card className="border-blue-200/50 bg-gradient-to-r from-blue-50/30 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <FileBarChart className="size-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                {REPORT_META.bookletTitle}
              </CardTitle>
              <CardDescription className="mt-1">
                {REPORT_META.venueEn} · {REPORT_META.dates}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Jinan, Shandong Province · Report certified {REPORT_META.reportDate}
          </p>
        </CardContent>
      </Card>

      <Card className="conference-report-no-print border-[#C8A061]/30">
        <CardHeader>
          <CardTitle className="text-base">Certification Signatories</CardTitle>
          <CardDescription>
            Section 22 — choose saved signatures or upload custom images (same
            workflow as Letter Composer).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentSignatoryControls
            value={signatoryDraft}
            onChange={setSignatoryDraft}
            members={members}
            nationalPresidentName={necPresidentName}
            resolveSignatureForName={resolveSignatureForName}
            onSaveSignatureProfile={saveSignatureProfile}
            allowSlotCountAdjust={false}
          />
        </CardContent>
      </Card>

      <ConferenceReportPreview runtime={runtime} signatoryDraft={signatoryDraft} />
    </div>
  );
}
