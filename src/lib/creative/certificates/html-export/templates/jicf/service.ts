/**
 * JICF Service Recognition Certificate Template
 * For recognizing years of faithful service and ministry dedication
 */

import type { CertificateTemplate } from "../types";
import { JICF_COLORS, JICF_FONTS, JICF_ORG_INFO } from "./constants";

export const jicfServiceCertificate: CertificateTemplate = {
  id: "jicf-service-recognition",
  name: "JICF Service Recognition Certificate",
  description:
    "Certificate recognizing faithful years of service in JICF ministry",
  organization: "jicf",
  category: "service",
  elements: [
    // Elegant double border
    {
      id: "outer-border",
      type: "rectangle",
      content: "",
      position: { x: 30, y: 30, width: 1140, height: 778 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.secondary,
        borderWidth: 4,
        borderStyle: "solid",
        borderRadius: 10,
      },
    },
    {
      id: "inner-border",
      type: "rectangle",
      content: "",
      position: { x: 50, y: 50, width: 1100, height: 738 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.gold,
        borderWidth: 2,
        borderStyle: "solid",
        borderRadius: 6,
      },
    },
    // Service badge/emblem
    {
      id: "service-emblem",
      type: "image",
      content: "/images/jicf-service-badge.png",
      position: { x: 100, y: 80, width: 100, height: 100 },
      style: {
        objectFit: "contain",
      },
    },
    // Years of service badge - right side
    {
      id: "years-badge",
      type: "rectangle",
      content: "",
      position: { x: 1000, y: 80, width: 100, height: 100 },
      style: {
        backgroundColor: JICF_COLORS.secondary,
        borderRadius: 50,
        border: `4px solid ${JICF_COLORS.gold}`,
      },
    },
    // Years number
    {
      id: "years-number",
      type: "text",
      content: "{{yearsOfService}}",
      position: { x: 1000, y: 110, width: 100, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
      },
    },
    // Years label
    {
      id: "years-label",
      type: "text",
      content: "YEARS",
      position: { x: 1000, y: 185, width: 100, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "bold",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        letterSpacing: "1px",
      },
    },
    // Organization name
    {
      id: "organization-name",
      type: "text",
      content: JICF_ORG_INFO.name,
      position: { x: 250, y: 90, width: 700, height: 40 },
      style: {
        fontSize: 30,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        letterSpacing: "2px",
      },
    },
    // Mission statement
    {
      id: "mission-statement",
      type: "text",
      content: JICF_ORG_INFO.mission,
      position: { x: 250, y: 130, width: 700, height: 25 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        fontStyle: "italic",
      },
    },
    // Certificate title
    {
      id: "certificate-title",
      type: "text",
      content: "SERVICE RECOGNITION CERTIFICATE",
      position: { x: 100, y: 230, width: 1000, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        letterSpacing: "2px",
      },
    },
    // Decorative line
    {
      id: "decorative-line",
      type: "rectangle",
      content: "",
      position: { x: 350, y: 290, width: 500, height: 3 },
      style: {
        backgroundColor: JICF_COLORS.gold,
        borderRadius: 2,
      },
    },
    // Recognition statement
    {
      id: "recognition-statement",
      type: "text",
      content:
        "In grateful recognition of faithful and dedicated service, this certificate is presented to",
      position: { x: 100, y: 330, width: 1000, height: 35 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
      },
    },
    // Recipient name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 200, y: 375, width: 800, height: 60 },
      style: {
        fontSize: 42,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderBottom: `3px solid ${JICF_COLORS.gold}`,
        paddingBottom: "8px",
      },
    },
    // Service description
    {
      id: "service-description",
      type: "text",
      content:
        "for {{yearsOfService}} years of exceptional service as {{serviceRole}} in {{serviceArea}}. Your unwavering commitment, faithful dedication, and servant heart have been a tremendous blessing to our ministry and community. Through your faithful service, you have demonstrated the love of Christ and advanced the Kingdom of God.",
      position: { x: 120, y: 460, width: 960, height: 100 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
        lineHeight: 1.6,
      },
    },
    // Scripture verse
    {
      id: "scripture-verse",
      type: "text",
      content:
        '"Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain." - 1 Corinthians 15:58',
      position: { x: 150, y: 580, width: 900, height: 60 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        fontStyle: "italic",
        borderLeft: `4px solid ${JICF_COLORS.gold}`,
        borderRight: `4px solid ${JICF_COLORS.gold}`,
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "15px",
        paddingBottom: "15px",
      },
    },
    // Recognition date
    {
      id: "recognition-date",
      type: "text",
      content: "Presented on {{presentationDate}}",
      position: { x: 150, y: 670, width: 350, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "500",
        color: JICF_COLORS.black,
        textAlign: "left",
      },
    },
    // Service period
    {
      id: "service-period",
      type: "text",
      content: "Service Period: {{serviceStartDate}} - {{serviceEndDate}}",
      position: { x: 700, y: 670, width: 350, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "500",
        color: JICF_COLORS.black,
        textAlign: "right",
      },
    },
    // Leadership signature
    {
      id: "leadership-signature",
      type: "text",
      content: "{{leadershipName}}",
      position: { x: 200, y: 720, width: 300, height: 25 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderTop: `2px solid ${JICF_COLORS.black}`,
        paddingTop: "5px",
      },
    },
    // Leadership title
    {
      id: "leadership-title",
      type: "text",
      content: "{{leadershipTitle}}",
      position: { x: 200, y: 750, width: 300, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Executive signature
    {
      id: "executive-signature",
      type: "text",
      content: "{{executiveName}}",
      position: { x: 700, y: 720, width: 300, height: 25 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderTop: `2px solid ${JICF_COLORS.black}`,
        paddingTop: "5px",
      },
    },
    // Executive title
    {
      id: "executive-title",
      type: "text",
      content: "{{executiveTitle}}",
      position: { x: 700, y: 750, width: 300, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // QR code
    {
      id: "verification-qr",
      type: "qr",
      content: "{{qrCode}}",
      position: { x: 1080, y: 720, width: 60, height: 60 },
      style: {
        backgroundColor: JICF_COLORS.white,
        padding: "5px",
        borderRadius: 4,
      },
    },
    // Decorative flourishes
    {
      id: "flourish-left",
      type: "text",
      content: "❦",
      position: { x: 80, y: 400, width: 30, height: 30 },
      style: {
        fontSize: 24,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "flourish-right",
      type: "text",
      content: "❦",
      position: { x: 1090, y: 400, width: 30, height: 30 },
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
    },
  },
  variables: {
    recipientName: {
      type: "text",
      label: "Recipient Name",
      required: true,
      placeholder: "Elder Robert Thompson",
    },
    yearsOfService: {
      type: "number",
      label: "Years of Service",
      required: true,
      placeholder: "25",
    },
    serviceRole: {
      type: "text",
      label: "Service Role/Position",
      required: true,
      placeholder: "Youth Pastor",
    },
    serviceArea: {
      type: "select",
      label: "Service Area",
      required: true,
      options: [
        "Youth Ministry",
        "Music Ministry",
        "Children's Ministry",
        "Evangelism",
        "Administration",
        "Teaching Ministry",
        "Community Outreach",
        "Pastoral Care",
        "Missions",
        "Prayer Ministry",
      ],
    },
    presentationDate: {
      type: "date",
      label: "Presentation Date",
      required: true,
    },
    serviceStartDate: {
      type: "date",
      label: "Service Start Date",
      required: true,
    },
    serviceEndDate: {
      type: "date",
      label: "Service End Date (if applicable)",
      required: false,
    },
    leadershipName: {
      type: "text",
      label: "Church Leadership Name",
      required: true,
      placeholder: "Pastor David Miller",
    },
    leadershipTitle: {
      type: "text",
      label: "Leadership Title",
      required: true,
      placeholder: "Senior Pastor",
    },
    executiveName: {
      type: "text",
      label: "Executive Name",
      required: true,
      placeholder: "Dr. Susan Anderson",
    },
    executiveTitle: {
      type: "text",
      label: "Executive Title",
      required: true,
      placeholder: "Executive Director",
    },
    qrCode: {
      type: "qr",
      label: "Verification QR Code",
      required: false,
    },
  },
};
