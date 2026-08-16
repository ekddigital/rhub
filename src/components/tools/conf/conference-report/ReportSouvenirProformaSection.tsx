import { C } from "../booklet/constants";
import { REPORT_CONTENT_WIDTH } from "./report-layout";
import {
  REPORT_BODY,
  REPORT_PHOTO,
  REPORT_SUBSECTION,
} from "./report-typography";

export const CONFERENCE_SOUVENIR_PROFORMA_INVOICE_PATH =
  "/conf/assets/before-after-conf/lsuic-conference-souvenir-proforma-invoice-2026.png";

export const CONFERENCE_SOUVENIR_BUDGET_ANCHOR = "budget-conference-souvenir";

/** Portrait proforma invoice — 1202×1712 px source. */
const INVOICE_ASPECT = 1712 / 1202;

export function ReportSouvenirProformaSection() {
  const imageHeight = Math.round(REPORT_CONTENT_WIDTH * INVOICE_ASPECT);

  return (
    <>
      <div
        style={{
          fontSize: `${REPORT_SUBSECTION.fontSize}px`,
          fontWeight: REPORT_SUBSECTION.fontWeight,
          color: REPORT_SUBSECTION.color,
          marginBottom: "8px",
        }}
      >
        Conference Souvenir Purchase List — Proforma Invoice
      </div>
      <p
        style={{
          fontSize: `${REPORT_BODY.fontSize}px`,
          lineHeight: REPORT_BODY.lineHeight,
          color: REPORT_BODY.color,
          marginBottom: "10px",
          textAlign: "justify",
        }}
      >
        The proforma invoice below records the conference souvenir procurement
        from JAPIX ARC — flag pins, delegate tags, wristbands, pens, keychains,
        notepads, tote bags, and banner — totaling ¥2,645.00, matching the{" "}
        <a
          href={`#${CONFERENCE_SOUVENIR_BUDGET_ANCHOR}`}
          style={{ color: C.blue, fontWeight: 600 }}
        >
          Conference souvenir
        </a>{" "}
        budget line in the table above.
      </p>

      <div
        style={{
          width: `${REPORT_CONTENT_WIDTH}px`,
          maxWidth: "100%",
          borderRadius: "4px",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          background: "#F8FAFC",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CONFERENCE_SOUVENIR_PROFORMA_INVOICE_PATH}
          alt="JAPIX ARC proforma invoice for LSUIC Jinan 2026 conference souvenirs"
          style={{
            width: "100%",
            height: `${imageHeight}px`,
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          fontSize: `${REPORT_PHOTO.caption.fontSize}px`,
          color: REPORT_PHOTO.caption.color,
          marginTop: "8px",
          lineHeight: REPORT_PHOTO.caption.lineHeight,
          textAlign: "center",
        }}
      >
        <strong>Conference Souvenir Purchase List — Proforma Invoice</strong>
        <br />
        Vendor: JAPIX ARC · Invoice No. 960392 · Date: 5 July 2026 · Total:
        ¥2,645.00
      </div>
    </>
  );
}
