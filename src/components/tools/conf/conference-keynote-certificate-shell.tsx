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
import { KeynoteCertificateDocument } from "@/components/tools/conf/keynote-certificate-document";
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
  const certificateRef = useRef<HTMLDivElement | null>(null);
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
        <div ref={certificateRef}>
          <KeynoteCertificateDocument
            speakerName={speakerName}
            companyName={companyName}
            speakerTitle={speakerTitle}
            citationText={citationText}
            displayDate={displayDate}
            certificateId={certificateId}
            signatories={signatureSlots}
          />
        </div>
      </div>
    </div>
  );
}
