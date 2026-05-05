/**
 * JICF Appreciation Certificate Template
 * A beautiful, formal certificate for recognizing appreciation and service
 */

import type { CertificateTemplate } from "../types";
import { JICF_COLORS, JICF_FONTS, JICF_ORG_INFO } from "./constants";

export const jicfAppreciationCertificate: CertificateTemplate = {
  id: "jicf-appreciation-formal",
  name: "JICF Appreciation Certificate",
  description: "Formal appreciation certificate for JICF ministry recognition",
  organization: "jicf",
  category: "appreciation",
  elements: [
    // Decorative border frame
    {
      id: "border-frame",
      type: "rectangle",
      content: "",
      position: { x: 30, y: 30, width: 1140, height: 778 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.gold,
        borderWidth: 4,
        borderStyle: "solid",
        borderRadius: 8,
      },
    },
    // Inner decorative border
    {
      id: "inner-border",
      type: "rectangle",
      content: "",
      position: { x: 50, y: 50, width: 1100, height: 738 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.primary,
        borderWidth: 2,
        borderStyle: "solid",
        borderRadius: 4,
      },
    },
    // Header logo/emblem area
    {
      id: "header-emblem",
      type: "image",
      content: "/images/jicf-logo.png",
      position: { x: 550, y: 80, width: 100, height: 100 },
      style: {
        objectFit: "contain",
      },
    },
    // Organization name
    {
      id: "organization-name",
      type: "text",
      content: JICF_ORG_INFO.name.toUpperCase(),
      position: { x: 100, y: 200, width: 1000, height: 40 },
      style: {
        fontSize: 28,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        letterSpacing: "3px",
      },
    },
    // Tagline
    {
      id: "tagline",
      type: "text",
      content: JICF_ORG_INFO.tagline,
      position: { x: 100, y: 240, width: 1000, height: 25 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        letterSpacing: "1px",
        fontStyle: "italic",
      },
    },
    // Certificate title
    {
      id: "certificate-title",
      type: "text",
      content: "CERTIFICATE OF APPRECIATION",
      position: { x: 100, y: 300, width: 1000, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.gold,
        textAlign: "center",
        letterSpacing: "2px",
      },
    },
    // Decorative line under title
    {
      id: "title-underline",
      type: "rectangle",
      content: "",
      position: { x: 400, y: 360, width: 400, height: 3 },
      style: {
        backgroundColor: JICF_COLORS.gold,
        borderRadius: 2,
      },
    },
    // Presented to label
    {
      id: "presented-to-label",
      type: "text",
      content: "This is to certify that",
      position: { x: 100, y: 400, width: 1000, height: 30 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
        fontStyle: "italic",
      },
    },
    // Recipient name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 200, y: 440, width: 800, height: 60 },
      style: {
        fontSize: 42,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        textDecoration: "underline",
        textDecorationColor: JICF_COLORS.gold,
        textDecorationThickness: "2px",
      },
    },
    // Achievement description
    {
      id: "achievement-description",
      type: "text",
      content:
        "has shown exceptional dedication and service in {{achievementDescription}}, demonstrating the love of Christ through faithful ministry and unwavering commitment to the Gospel message.",
      position: { x: 150, y: 520, width: 900, height: 80 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
        lineHeight: 1.5,
      },
    },
    // Biblical verse or inspiration
    {
      id: "biblical-verse",
      type: "text",
      content: '"Well done, good and faithful servant!" - Matthew 25:23',
      position: { x: 200, y: 620, width: 800, height: 40 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        fontStyle: "italic",
      },
    },
    // Certificate date
    {
      id: "certificate-date",
      type: "text",
      content: "Date: {{date}}",
      position: { x: 150, y: 680, width: 300, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "500",
        color: JICF_COLORS.black,
        textAlign: "left",
      },
    },
    // Certificate ID
    {
      id: "certificate-id",
      type: "text",
      content: "Certificate ID: {{certificateId}}",
      position: { x: 750, y: 680, width: 300, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "500",
        color: JICF_COLORS.black,
        textAlign: "right",
      },
    },
    // Signature line 1
    {
      id: "signature-line-1",
      type: "text",
      content: "{{signerName1}}",
      position: { x: 200, y: 720, width: 250, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderTop: `2px solid ${JICF_COLORS.black}`,
        paddingTop: "5px",
      },
    },
    // Signature title 1
    {
      id: "signature-title-1",
      type: "text",
      content: "{{signerTitle1}}",
      position: { x: 200, y: 750, width: 250, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Signature line 2
    {
      id: "signature-line-2",
      type: "text",
      content: "{{signerName2}}",
      position: { x: 750, y: 720, width: 250, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderTop: `2px solid ${JICF_COLORS.black}`,
        paddingTop: "5px",
      },
    },
    // Signature title 2
    {
      id: "signature-title-2",
      type: "text",
      content: "{{signerTitle2}}",
      position: { x: 750, y: 750, width: 250, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // QR Code for verification
    {
      id: "verification-qr",
      type: "qr",
      content: "{{qrCode}}",
      position: { x: 1050, y: 720, width: 60, height: 60 },
      style: {
        backgroundColor: JICF_COLORS.white,
        padding: "5px",
        borderRadius: 4,
      },
    },
    // Decorative corner elements
    {
      id: "corner-decoration-tl",
      type: "text",
      content: "✠",
      position: { x: 70, y: 70, width: 30, height: 30 },
      style: {
        fontSize: 24,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "corner-decoration-tr",
      type: "text",
      content: "✠",
      position: { x: 1100, y: 70, width: 30, height: 30 },
      style: {
        fontSize: 24,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "corner-decoration-bl",
      type: "text",
      content: "✠",
      position: { x: 70, y: 738, width: 30, height: 30 },
      style: {
        fontSize: 24,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "corner-decoration-br",
      type: "text",
      content: "✠",
      position: { x: 1100, y: 738, width: 30, height: 30 },
      style: {
        fontSize: 24,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
  ],
  pageSettings: {
    width: 1200,
    height: 838,
    orientation: "landscape",
    backgroundColor: JICF_COLORS.white,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: JICF_COLORS.white,
      // Optional: Add subtle background pattern
      // image: "/images/jicf-watermark.png",
      // opacity: 0.05,
    },
  },
  variables: {
    recipientName: {
      type: "text",
      label: "Recipient Name",
      required: true,
      placeholder: "John Doe",
    },
    achievementDescription: {
      type: "text",
      label: "Achievement Description",
      required: true,
      placeholder: "outstanding service in youth ministry",
    },
    date: {
      type: "date",
      label: "Certificate Date",
      required: true,
    },
    certificateId: {
      type: "text",
      label: "Certificate ID",
      required: false,
      placeholder: "JICF-2025-AP-0001-JC",
      defaultValue: "JICF-2025-AP-0001-JC",
    },
    signerName1: {
      type: "text",
      label: "First Signer Name",
      required: true,
      placeholder: "Pastor John Smith",
    },
    signerTitle1: {
      type: "text",
      label: "First Signer Title",
      required: true,
      placeholder: "Senior Pastor",
    },
    signerName2: {
      type: "text",
      label: "Second Signer Name",
      required: true,
      placeholder: "Minister Jane Doe",
    },
    signerTitle2: {
      type: "text",
      label: "Second Signer Title",
      required: true,
      placeholder: "Ministry Director",
    },
    qrCode: {
      type: "qr",
      label: "Verification QR Code",
      required: false,
    },
  },
};
