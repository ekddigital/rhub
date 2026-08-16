import {
  buildKeynoteCertificateData,
  REPORT_KEYNOTE_CERTIFICATE,
  type KeynoteCertificateData,
} from "@/lib/conf/keynote-certificate-data";
import type { ReportDataSource } from "./types";

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
