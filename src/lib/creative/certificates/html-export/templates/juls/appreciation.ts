/**
 * JULS Appreciation Certificate Template
 * A professional certificate for recognizing outstanding leadership and contribution
 */

import type { CertificateTemplate } from "../types";
import { JULS_COLORS, JULS_FONTS, JULS_ORG_INFO } from "./constants";

export const julsAppreciationCertificate: CertificateTemplate = {
  id: "juls-appreciation-leadership",
  name: "JULS Leadership Appreciation Certificate",
  description:
    "Professional appreciation certificate for exceptional leadership and contribution to JULS programs",
  organization: "juls",
  category: "appreciation",
  elements: [
    // Decorative border frame
    {
      id: "border-frame",
      type: "rectangle",
      content: "",
      position: { x: 40, y: 40, width: 1120, height: 758 },
      style: {
        backgroundColor: "transparent",
        borderColor: JULS_COLORS.primary,
        borderWidth: 3,
        borderStyle: "solid",
        borderRadius: 12,
      },
    },
    // Inner accent border
    {
      id: "inner-border",
      type: "rectangle",
      content: "",
      position: { x: 60, y: 60, width: 1080, height: 718 },
      style: {
        backgroundColor: "transparent",
        borderColor: JULS_COLORS.gold,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 8,
      },
    },
    // Header logo area
    {
      id: "header-logo",
      type: "image",
      content: "/images/juls-logo.png",
      position: { x: 550, y: 90, width: 100, height: 100 },
      style: {
        objectFit: "contain",
      },
    },
    // Organization name
    {
      id: "org-name",
      type: "text",
      content: JULS_ORG_INFO.name,
      position: { x: 100, y: 210, width: 1000, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: JULS_FONTS.heading,
        fontWeight: "bold",
        color: JULS_COLORS.primary,
        textAlign: "center",
        letterSpacing: "2px",
      },
    },
    // Tagline
    {
      id: "tagline",
      type: "text",
      content: JULS_ORG_INFO.description,
      position: { x: 100, y: 260, width: 1000, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.primary,
        fontStyle: "italic",
        color: JULS_COLORS.text,
        textAlign: "center",
        letterSpacing: "1px",
      },
    },
    // Certificate title
    {
      id: "certificate-title",
      type: "text",
      content: "CERTIFICATE OF APPRECIATION",
      position: { x: 100, y: 320, width: 1000, height: 60 },
      style: {
        fontSize: 42,
        fontFamily: JULS_FONTS.heading,
        fontWeight: "bold",
        color: JULS_COLORS.gold,
        textAlign: "center",
        letterSpacing: "3px",
        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    },
    // Presented to text
    {
      id: "presented-to",
      type: "text",
      content: "This certificate is proudly presented to",
      position: { x: 200, y: 400, width: 800, height: 30 },
      style: {
        fontSize: 18,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
      },
    },
    // Recipient name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 150, y: 440, width: 900, height: 70 },
      style: {
        fontSize: 48,
        fontFamily: JULS_FONTS.elegant,
        fontWeight: "bold",
        color: JULS_COLORS.primary,
        textAlign: "center",
        borderBottom: `3px solid ${JULS_COLORS.gold}`,
        paddingBottom: "10px",
        letterSpacing: "2px",
      },
    },
    // Recognition text
    {
      id: "recognition-text",
      type: "text",
      content:
        "in recognition of outstanding {{achievementType}} and exceptional dedication to leadership development within the Jinan Union of Liberian Students program",
      position: { x: 150, y: 540, width: 900, height: 80 },
      style: {
        fontSize: 20,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
        lineHeight: 1.6,
      },
    },
    // Date label
    {
      id: "date-label",
      type: "text",
      content: "Awarded on",
      position: { x: 200, y: 650, width: 200, height: 25 },
      style: {
        fontSize: 14,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Issue date
    {
      id: "issue-date",
      type: "text",
      content: "{{issueDate}}",
      position: { x: 200, y: 675, width: 200, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.primary,
        fontWeight: "600",
        color: JULS_COLORS.text,
        textAlign: "center",
        borderBottom: `2px solid ${JULS_COLORS.lightGray}`,
      },
    },
    // Director signature line
    {
      id: "director-signature",
      type: "text",
      content: JULS_ORG_INFO.leadership.director,
      position: { x: 800, y: 675, width: 200, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.elegant,
        fontWeight: "600",
        color: JULS_COLORS.text,
        textAlign: "center",
        borderBottom: `2px solid ${JULS_COLORS.lightGray}`,
      },
    },
    // Director title
    {
      id: "director-title",
      type: "text",
      content: "Program Director",
      position: { x: 800, y: 710, width: 200, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Verification QR code
    {
      id: "verification-qr",
      type: "qr-code",
      content: "{{qrCodeData}}",
      position: { x: 1020, y: 640, width: 80, height: 80 },
      style: {
        backgroundColor: "transparent",
      },
    },
    // Certificate ID
    {
      id: "certificate-id",
      type: "text",
      content: "Certificate ID: {{certificateId}}",
      position: { x: 900, y: 730, width: 250, height: 20 },
      style: {
        fontSize: 10,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Decorative elements
    {
      id: "left-ornament",
      type: "text",
      content: "◆ ◆ ◆",
      position: { x: 100, y: 620, width: 100, height: 20 },
      style: {
        fontSize: 16,
        color: JULS_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "right-ornament",
      type: "text",
      content: "◆ ◆ ◆",
      position: { x: 1000, y: 620, width: 100, height: 20 },
      style: {
        fontSize: 16,
        color: JULS_COLORS.gold,
        textAlign: "center",
      },
    },
  ],
  pageSettings: {
    width: 1200,
    height: 838,
    orientation: "landscape",
    backgroundColor: JULS_COLORS.white,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: JULS_COLORS.white,
    },
  },
  variables: {
    recipientName: {
      type: "text",
      label: "Recipient Name",
      required: true,
      placeholder: "Dr. Sarah Johnson",
    },
    achievementType: {
      type: "select",
      label: "Achievement Type",
      required: true,
      options: [
        "Leadership Excellence",
        "Outstanding Contribution",
        "Program Innovation",
        "Community Service",
        "Academic Achievement",
        "Mentorship Excellence",
      ],
      defaultValue: "Leadership Excellence",
    },
    issueDate: {
      type: "date",
      label: "Issue Date",
      required: true,
      defaultValue: new Date().toLocaleDateString(),
    },
    certificateId: {
      type: "text",
      label: "Certificate ID",
      required: false,
      placeholder: "JULS-2025-AP-0001-AE",
      defaultValue: "JULS-2025-AP-0001-AE",
    },
    qrCodeData: {
      type: "qr",
      label: "QR Code Data",
      required: false,
    },
  },
};
