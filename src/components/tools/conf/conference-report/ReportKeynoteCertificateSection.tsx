import type { KeynoteCertificateData } from "@/lib/conf/keynote-certificate-data";
import {
  KEYNOTE_CERTIFICATE_DESIGN_HEIGHT,
  KEYNOTE_CERTIFICATE_DESIGN_WIDTH,
  KeynoteCertificateDocument,
} from "@/components/tools/conf/keynote-certificate-document";
import { C } from "../booklet/constants";
import {
  estimateBodyParagraphHeight,
  REPORT_CONTENT_WIDTH,
  REPORT_LAYOUT_SAFETY_MARGIN,
  reportUsableHeight,
} from "./report-layout";
import { REPORT_BODY } from "./report-typography";

const CERTIFICATE_INTRO =
  "During the pre-conference fundraising program, the Conference Committee presented the certificate below to the keynote speaker in recognition of leadership and support for LSUIC mobilization. This is the same certificate composed in the rhub Keynote Certificate tool.";

function keynoteCertificateEmbedMetrics() {
  const introHeight =
    estimateBodyParagraphHeight(CERTIFICATE_INTRO) + 12;
  const availableForCert =
    reportUsableHeight("sectionTitle") -
    introHeight -
    REPORT_LAYOUT_SAFETY_MARGIN / 2;
  const scaleByWidth = REPORT_CONTENT_WIDTH / KEYNOTE_CERTIFICATE_DESIGN_WIDTH;
  const scaleByHeight = availableForCert / KEYNOTE_CERTIFICATE_DESIGN_HEIGHT;
  const embedScale = Math.min(scaleByWidth, scaleByHeight);
  return {
    embedScale,
    scaledHeight: Math.ceil(KEYNOTE_CERTIFICATE_DESIGN_HEIGHT * embedScale),
  };
}

export function ReportKeynoteCertificateSection({
  certificate,
}: {
  certificate: KeynoteCertificateData;
}) {
  const { embedScale, scaledHeight } = keynoteCertificateEmbedMetrics();

  return (
    <>
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
          height: `${scaledHeight}px`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${KEYNOTE_CERTIFICATE_DESIGN_WIDTH}px`,
            transform: `scale(${embedScale})`,
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
