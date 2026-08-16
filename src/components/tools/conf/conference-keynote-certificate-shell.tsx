"use client";

import { useMemo, useRef, useState } from "react";
import { Award, Download, Printer } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDefaultSignatoryDraft,
  DocumentSignatoryControls,
  type SignatoryDraft,
} from "@/components/tools/conf/document-signatory-controls";
import { CONF_2026 } from "@/lib/conf/config";
import {
  KEYNOTE_CERTIFICATE_DEFAULTS,
  KEYNOTE_CERTIFICATE_DEFAULT_SIGNATORIES,
  buildKeynoteCertificateId,
  formatKeynoteCertificateDisplayDate,
} from "@/lib/conf/keynote-certificate-data";

function createDefaultKeynoteSignatoryDraft(): SignatoryDraft {
  const [s1, s2, s3] = KEYNOTE_CERTIFICATE_DEFAULT_SIGNATORIES;
  return {
    ...createDefaultSignatoryDraft(),
    signatoryMode: "CUSTOM",
    signatory1: { ...s1, sig: "", sigScale: 1 },
    signatory2: { ...s2, sig: "", sigScale: 1 },
    signatory3: { ...s3, sig: "", sigScale: 1 },
  };
}

export function ConferenceKeynoteCertificateShell() {
  const [speakerName, setSpeakerName] = useState<string>(
    KEYNOTE_CERTIFICATE_DEFAULTS.speakerName,
  );
  const [companyName, setCompanyName] = useState<string>(
    KEYNOTE_CERTIFICATE_DEFAULTS.companyName,
  );
  const [speakerTitle, setSpeakerTitle] = useState<string>(
    KEYNOTE_CERTIFICATE_DEFAULTS.speakerTitle,
  );
  const [citationText, setCitationText] = useState<string>(
    KEYNOTE_CERTIFICATE_DEFAULTS.citationText,
  );
  const [issueDate, setIssueDate] = useState<string>(
    KEYNOTE_CERTIFICATE_DEFAULTS.issueDate,
  );
  const [signatureDraft, setSignatureDraft] = useState<SignatoryDraft>(
    createDefaultKeynoteSignatoryDraft,
  );

  const displayDate = useMemo(
    () => formatKeynoteCertificateDisplayDate(issueDate),
    [issueDate],
  );
  const certificateId = useMemo(
    () => buildKeynoteCertificateId(issueDate),
    [issueDate],
  );
  const signatureSlots = useMemo(
    () => [
      signatureDraft.signatory1,
      signatureDraft.signatory2,
      signatureDraft.signatory3,
    ],
    [signatureDraft],
  );
  const certificateRef = useRef<HTMLElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const safeFileBase = useMemo(() => {
    const nameSlug = speakerName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return nameSlug
      ? `lsuic-keynote-certificate-${nameSlug}`
      : "lsuic-keynote-certificate";
  }, [speakerName]);

  const captureCertificateDataUrl = async (): Promise<string> => {
    if (!certificateRef.current) {
      throw new Error("Certificate element not ready");
    }

    const source = certificateRef.current;
    const bounds = source.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.overflow = "hidden";
    wrapper.style.opacity = "0";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "2147483647";
    wrapper.style.background = "#F4F1EA";

    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.margin = "0";
    clone.style.width = `${width}px`;
    clone.style.maxWidth = `${width}px`;
    clone.style.height = `${height}px`;
    clone.style.transform = "none";
    clone.style.left = "0";
    clone.style.top = "0";

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      const images = clone.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if ((img as HTMLImageElement).complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      );

      return await toPng(clone, {
        backgroundColor: "#F4F1EA",
        pixelRatio: 2,
        cacheBust: true,
        width,
        height,
        canvasWidth: width,
        canvasHeight: height,
        skipFonts: true,
      });
    } finally {
      wrapper.remove();
    }
  };

  const downloadAsPng = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await captureCertificateDataUrl();
      const link = document.createElement("a");
      link.download = `${safeFileBase}.png`;
      link.href = dataUrl;
      document.body.append(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download PNG certificate", error);
      window.alert("Unable to download PNG right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAsPdf = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await captureCertificateDataUrl();
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const image = pdf.getImageProperties(dataUrl);
      const scale = Math.min(
        pageWidth / image.width,
        pageHeight / image.height,
      );
      const renderWidth = image.width * scale;
      const renderHeight = image.height * scale;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(dataUrl, "PNG", offsetX, offsetY, renderWidth, renderHeight);
      pdf.save(`${safeFileBase}.pdf`);
    } catch (error) {
      console.error("Failed to download PDF certificate", error);
      window.alert("Unable to download PDF right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          .conf-cert-no-print {
            display: none !important;
          }

          .conf-cert-print-area {
            margin: 0 !important;
            padding: 0 !important;
          }

          .conf-cert-page {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>

      <Card className="conf-cert-no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#C8A061]" />
            Keynote Certificate Composer
          </CardTitle>
          <CardDescription>
            Fill the keynote details, then print the certificate for
            presentation during today&apos;s fundraising session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="speaker-name">Keynote Speaker Name</Label>
              <Input
                id="speaker-name"
                value={speakerName}
                onChange={(event) => setSpeakerName(event.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker-title">Title / Honorific</Label>
              <Input
                id="speaker-title"
                value={speakerTitle}
                onChange={(event) => setSpeakerTitle(event.target.value)}
                placeholder="Distinguished Guest Speaker"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Company / Organization</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-date">Issue Date</Label>
              <Input
                id="issue-date"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="citation-text">Citation Text</Label>
              <textarea
                id="citation-text"
                value={citationText}
                onChange={(event) => setCitationText(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#C8A061]/55 bg-[#FCFBF8] p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-[#002868]">
                Certificate Signatures
              </p>
              <p className="text-xs text-slate-600">
                Uses the same three signatories from your letter flow: label,
                name, title, and optional uploaded signature image.
              </p>
            </div>
            <DocumentSignatoryControls
              value={signatureDraft}
              onChange={(next) =>
                setSignatureDraft({
                  ...next,
                  signatoryMode: "CUSTOM",
                })
              }
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => window.print()}
              className="bg-[#002868] text-white hover:bg-[#002868]/90 border-[#002868]"
              disabled={isExporting}
            >
              <Printer className="h-4 w-4" />
              Print Certificate
            </Button>
            <Button
              variant="outline"
              onClick={downloadAsPng}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Preparing..." : "Download PNG"}
            </Button>
            <Button
              variant="outline"
              onClick={downloadAsPdf}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Preparing..." : "Download PDF"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Certificate ID:{" "}
              <span className="font-medium text-foreground">
                {certificateId}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="conf-cert-print-area">
        <article
          ref={certificateRef}
          className="conf-cert-page relative mx-auto w-full max-w-6xl overflow-hidden border-4 border-[#002868] bg-[#F4F1EA] p-8 shadow-lg sm:p-12"
        >
          <div className="pointer-events-none absolute inset-[8px] border-4 border-[#BF0A30]/85" />
          <div className="pointer-events-none absolute inset-[18px] border-[6px] border-[#F4F1EA]" />
          <div className="pointer-events-none absolute inset-[30px] border-[3px] border-[#002868]/60" />

          <header className="relative mb-8 border-b-2 border-[#002868]/45 pb-5">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conf/lsuic_logo.png"
                alt="LSUIC Logo"
                className="h-24 w-24 object-contain sm:h-28 sm:w-28"
              />

              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#002868] sm:text-[12px]">
                  LIBERIAN STUDENT UNION IN CHINA
                </p>
                <p className="text-sm font-semibold text-[#C8A061] sm:text-base">
                  20th Anniversary Conference Committee
                </p>
                <p className="text-xs text-slate-600 sm:text-sm">
                  Jinan, Shandong, P.R. China
                </p>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/conf/liberia-seal.svg"
                alt="Liberia Seal"
                className="h-24 w-24 object-contain sm:h-28 sm:w-28"
              />
            </div>
          </header>

          <div className="relative space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#002868]">
              Certificate of Appreciation
            </p>
            <h1 className="text-4xl font-semibold tracking-wide text-[#1A1A1A] sm:text-5xl">
              Presented To
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#BF0A30]">
              Fundraising Session Recognition
            </p>

            <div className="mx-auto max-w-4xl border-y-[3px] border-[#C8A061]/75 bg-[#F7F4EC]/95 py-5">
              <p className="text-3xl font-semibold uppercase tracking-[0.12em] text-[#002868] sm:text-4xl">
                {speakerName || "Keynote Speaker"}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-slate-600">
                {speakerTitle || "Distinguished Keynote Speaker"}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#BF0A30]">
                {companyName || "Organization"}
              </p>
            </div>

            <p className="mx-auto max-w-4xl text-base leading-8 text-slate-700 sm:text-lg">
              {citationText}
            </p>

            <div className="mx-auto grid w-full max-w-4xl gap-5 rounded-md border border-[#D5C9AA]/80 bg-linear-to-r from-[#EEE8DA] via-[#F6F2E8] to-[#F0E8DB] px-5 py-4 text-left text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-[#002868]">
                  Program Date:
                </span>{" "}
                {displayDate}
              </p>
              <p>
                <span className="font-semibold text-[#002868]">Theme:</span>{" "}
                {CONF_2026.theme}
              </p>
              <p>
                <span className="font-semibold text-[#002868]">Company:</span>{" "}
                {companyName || "Organization"}
              </p>
              <p>
                <span className="font-semibold text-[#002868]">
                  Certificate ID:
                </span>{" "}
                {certificateId}
              </p>
            </div>
          </div>

          <footer className="mt-10 border-t-2 border-[#BF0A30]/45 pt-8 text-sm text-slate-700">
            <div className="grid gap-6 sm:grid-cols-3">
              {signatureSlots.map((slot, index) => (
                <div key={`${slot.name}-${index}`} className="text-center">
                  {slot.sig ? (
                    <div className="mb-1 flex min-h-10.5 items-end justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slot.sig}
                        alt="signature"
                        style={{
                          height: Math.round(36 * (slot.sigScale || 1)),
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mb-1 min-h-10.5" />
                  )}
                  <p className="mx-auto mb-2 w-full border-b-2 border-[#002868]/45" />
                  <p className="text-[11px] italic text-slate-500">
                    {slot.label || "Signed"}
                  </p>
                  <p className="font-semibold text-[#002868]">
                    {slot.name || "Name"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {slot.title || "Title"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-right">
              <p className="text-xs uppercase tracking-[0.15em] text-[#BF0A30]">
                Date of Issue
              </p>
              <p className="font-semibold text-[#002868]">{displayDate}</p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
