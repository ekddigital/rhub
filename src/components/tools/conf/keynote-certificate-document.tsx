import { CONF_2026 } from "@/lib/conf/config";
import type { KeynoteCertificateSignatory } from "@/lib/conf/keynote-certificate-data";

export type KeynoteCertificateSignatureSlot = KeynoteCertificateSignatory & {
  sig?: string;
  sigScale?: number;
};

export type KeynoteCertificateDocumentProps = {
  speakerName: string;
  companyName: string;
  speakerTitle: string;
  citationText: string;
  displayDate: string;
  certificateId: string;
  signatories: readonly KeynoteCertificateSignatureSlot[];
  className?: string;
};

/** Shared keynote certificate layout — used by /tools/conf/certificates and conference report. */
export function KeynoteCertificateDocument({
  speakerName,
  companyName,
  speakerTitle,
  citationText,
  displayDate,
  certificateId,
  signatories,
  className = "",
}: KeynoteCertificateDocumentProps) {
  return (
    <article
      className={`conf-cert-page relative mx-auto w-full max-w-6xl overflow-hidden border-4 border-[#002868] bg-[#F4F1EA] p-8 shadow-lg sm:p-12 ${className}`.trim()}
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
            <span className="font-semibold text-[#002868]">Program Date:</span>{" "}
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
            <span className="font-semibold text-[#002868]">Certificate ID:</span>{" "}
            {certificateId}
          </p>
        </div>
      </div>

      <footer className="mt-10 border-t-2 border-[#BF0A30]/45 pt-8 text-sm text-slate-700">
        <div className="grid gap-6 sm:grid-cols-3">
          {signatories.map((slot, index) => (
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
              <p className="font-semibold text-[#002868]">{slot.name || "Name"}</p>
              <p className="text-xs text-slate-600">{slot.title || "Title"}</p>
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
  );
}

/** Design width of KeynoteCertificateDocument before embed scaling. */
export const KEYNOTE_CERTIFICATE_DESIGN_WIDTH = 1100;
