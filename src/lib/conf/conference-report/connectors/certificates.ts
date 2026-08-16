import {
  buildKeynoteCertificateData,
  REPORT_KEYNOTE_CERTIFICATE,
  type KeynoteCertificateData,
} from "@/lib/conf/keynote-certificate-data";
import type { ReportDataSource } from "./types";

export {
  KeynoteCertificateDocument,
  KEYNOTE_CERTIFICATE_DESIGN_WIDTH,
} from "@/components/tools/conf/keynote-certificate-document";

/** Certificates tool uses in-memory defaults — shared static source for report embed. */
export function loadReportKeynoteCertificate(): {
  certificate: KeynoteCertificateData;
  source: ReportDataSource;
} {
  return {
    certificate: buildKeynoteCertificateData(),
    source: "static",
  };
}

export { REPORT_KEYNOTE_CERTIFICATE };
