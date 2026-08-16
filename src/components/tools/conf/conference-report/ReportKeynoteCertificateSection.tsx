import type { KeynoteCertificateData } from "@/lib/conf/keynote-certificate-data";
import {
  KEYNOTE_CERTIFICATE_DESIGN_WIDTH,
  KeynoteCertificateDocument,
} from "@/components/tools/conf/keynote-certificate-document";
import { C } from "../booklet/constants";
import { REPORT_CONTENT_WIDTH } from "./report-layout";
import {
  REPORT_BODY,
  REPORT_SECTION_TITLE,
} from "./report-typography";

const CERTIFICATE_EMBED_SCALE = REPORT_CONTENT_WIDTH / KEYNOTE_CERTIFICATE_DESIGN_WIDTH;

export function ReportKeynoteCertificateSection({
  certificate,
}: {
  certificate: KeynoteCertificateData;
}) {
  const scaledHeightEstimate = Math.round(780 * CERTIFICATE_EMBED_SCALE);

  return (
    <>
      <div
        style={{
          fontSize: `${REPORT_SECTION_TITLE.fontSize - 2}px`,
          fontWeight: REPORT_SECTION_TITLE.fontWeight,
          color: REPORT_SECTION_TITLE.color,
          marginBottom: "10px",
        }}
      >
        Keynote Certificate of Appreciation — Fundraising Session
      </div>
      <p
        style={{
          fontSize: `${REPORT_BODY.fontSize}px`,
          lineHeight: REPORT_BODY.lineHeight,
          color: REPORT_BODY.color,
          marginBottom: "12px",
          textAlign: "justify",
        }}
      >
        During the pre-conference fundraising program, the Conference Committee
        presented the certificate below to the keynote speaker in recognition of
        leadership and support for LSUIC mobilization. This is the same
        certificate composed in the{" "}
        <a
          href="https://rhub.ekddigital.com/tools/conf/certificates"
          style={{ color: C.blue, fontWeight: 600 }}
        >
          rhub Keynote Certificate tool
        </a>
        .
      </p>

      <div
        style={{
          width: `${REPORT_CONTENT_WIDTH}px`,
          height: `${scaledHeightEstimate}px`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${KEYNOTE_CERTIFICATE_DESIGN_WIDTH}px`,
            transform: `scale(${CERTIFICATE_EMBED_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <KeynoteCertificateDocument
            speakerName={certificate.speakerName}
            companyName={certificate.companyName}
            speakerTitle={certificate.speakerTitle}
            citationText={certificate.citationText}
            displayDate={certificate.displayDate}
            certificateId={certificate.certificateId}
            signatories={certificate.signatories}
            className="shadow-none"
          />
        </div>
      </div>
    </>
  );
}
