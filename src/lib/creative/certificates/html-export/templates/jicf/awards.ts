/**
 * JICF Awards Certificate Template
 * A prestigious awards certificate for recognizing exceptional achievement
 */

import type { CertificateTemplate } from "../types";
import { JICF_COLORS, JICF_FONTS, JICF_ORG_INFO } from "./constants";

export const jicfAwardsCertificate: CertificateTemplate = {
  id: "jicf-awards-excellence",
  name: "JICF Excellence Award Certificate",
  description:
    "Prestigious award certificate for exceptional achievement in JICF ministry",
  organization: "jicf",
  category: "achievement",
  elements: [
    // Background gradient effect
    {
      id: "background-gradient",
      type: "rectangle",
      content: "",
      position: { x: 0, y: 0, width: 1200, height: 838 },
      style: {
        backgroundColor: "#F8F9FA",
        background: `linear-gradient(135deg, ${JICF_COLORS.white} 0%, #F8F9FA 50%, ${JICF_COLORS.white} 100%)`,
      },
    },
    // Main decorative border with gold accent
    {
      id: "main-border",
      type: "rectangle",
      content: "",
      position: { x: 25, y: 25, width: 1150, height: 788 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.gold,
        borderWidth: 6,
        borderStyle: "solid",
        borderRadius: 12,
      },
    },
    // Inner elegant border
    {
      id: "inner-border",
      type: "rectangle",
      content: "",
      position: { x: 45, y: 45, width: 1110, height: 748 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.primary,
        borderWidth: 3,
        borderStyle: "double",
        borderRadius: 8,
      },
    },
    // Top ribbon banner
    {
      id: "top-ribbon",
      type: "rectangle",
      content: "",
      position: { x: 200, y: 65, width: 800, height: 60 },
      style: {
        backgroundColor: JICF_COLORS.primary,
        borderRadius: 30,
        background: `linear-gradient(135deg, ${JICF_COLORS.primary} 0%, ${JICF_COLORS.blue} 100%)`,
      },
    },
    // Award emblem/seal
    {
      id: "award-seal",
      type: "image",
      content: "/images/jicf-award-seal.png",
      position: { x: 75, y: 75, width: 120, height: 120 },
      style: {
        objectFit: "contain",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
      },
    },
    // Organization name in ribbon
    {
      id: "organization-banner",
      type: "text",
      content: JICF_ORG_INFO.abbreviation,
      position: { x: 200, y: 80, width: 800, height: 50 },
      style: {
        fontSize: 32,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
        letterSpacing: "4px",
        textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
      },
    },
    // Award title - large and prominent
    {
      id: "award-title",
      type: "text",
      content: "CERTIFICATE OF EXCELLENCE",
      position: { x: 100, y: 180, width: 1000, height: 70 },
      style: {
        fontSize: 48,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.gold,
        textAlign: "center",
        letterSpacing: "3px",
        textShadow: `2px 2px 4px rgba(196, 30, 58, 0.3)`,
      },
    },
    // Decorative flourish under title
    {
      id: "title-flourish",
      type: "text",
      content: "❦ ❦ ❦",
      position: { x: 100, y: 250, width: 1000, height: 30 },
      style: {
        fontSize: 24,
        color: JICF_COLORS.gold,
        textAlign: "center",
        letterSpacing: "20px",
      },
    },
    // Presented to section
    {
      id: "presented-to",
      type: "text",
      content: "This certificate is proudly presented to",
      position: { x: 100, y: 300, width: 1000, height: 35 },
      style: {
        fontSize: 20,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
        fontStyle: "italic",
      },
    },
    // Recipient name - very prominent
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 150, y: 345, width: 900, height: 70 },
      style: {
        fontSize: 48,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        textDecoration: "none",
        borderBottom: `3px solid ${JICF_COLORS.gold}`,
        paddingBottom: "10px",
        textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
      },
    },
    // Achievement description with more space
    {
      id: "achievement-description",
      type: "text",
      content:
        "for {{awardCategory}} in recognition of {{achievementDetails}}. This outstanding accomplishment demonstrates exceptional dedication, leadership, and commitment to advancing the Kingdom of God through faithful service and ministry excellence.",
      position: { x: 120, y: 440, width: 960, height: 120 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
        lineHeight: 1.6,
        padding: "20px",
      },
    },
    // Inspirational quote/verse
    {
      id: "inspirational-quote",
      type: "text",
      content:
        '"Let your light shine before others, that they may see your good deeds and glorify your Father in heaven." - Matthew 5:16',
      position: { x: 150, y: 580, width: 900, height: 50 },
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
    // Award level/grade
    {
      id: "award-level",
      type: "text",
      content: "{{awardLevel}}",
      position: { x: 100, y: 650, width: 200, height: 40 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "bold",
        color: JICF_COLORS.gold,
        textAlign: "center",
        backgroundColor: JICF_COLORS.primary,
        borderRadius: 20,
        padding: "10px",
      },
    },
    // Date of award
    {
      id: "award-date",
      type: "text",
      content: "Awarded on {{date}}",
      position: { x: 150, y: 710, width: 300, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "500",
        color: JICF_COLORS.black,
        textAlign: "left",
      },
    },
    // Certificate number
    {
      id: "certificate-number",
      type: "text",
      content: "Certificate No: {{certificateNumber}}",
      position: { x: 750, y: 710, width: 300, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "500",
        color: JICF_COLORS.black,
        textAlign: "right",
      },
    },
    // President signature
    {
      id: "president-signature",
      type: "text",
      content: "{{presidentName}}",
      position: { x: 150, y: 750, width: 280, height: 25 },
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
    // President title
    {
      id: "president-title",
      type: "text",
      content: "{{presidentTitle}}",
      position: { x: 150, y: 775, width: 280, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Secretary signature
    {
      id: "secretary-signature",
      type: "text",
      content: "{{secretaryName}}",
      position: { x: 770, y: 750, width: 280, height: 25 },
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
    // Secretary title
    {
      id: "secretary-title",
      type: "text",
      content: "{{secretaryTitle}}",
      position: { x: 770, y: 775, width: 280, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Official seal/stamp area
    {
      id: "official-seal",
      type: "image",
      content: "/images/jicf-official-seal.png",
      position: { x: 520, y: 725, width: 80, height: 80 },
      style: {
        objectFit: "contain",
        opacity: 0.8,
      },
    },
    // QR code for digital verification
    {
      id: "verification-qr",
      type: "qr",
      content: "{{qrCode}}",
      position: { x: 1100, y: 730, width: 70, height: 70 },
      style: {
        backgroundColor: JICF_COLORS.white,
        padding: "8px",
        borderRadius: 8,
        border: `2px solid ${JICF_COLORS.gold}`,
      },
    },
    // Decorative corner stars
    {
      id: "star-decoration-1",
      type: "text",
      content: "★",
      position: { x: 65, y: 65, width: 20, height: 20 },
      style: {
        fontSize: 20,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "star-decoration-2",
      type: "text",
      content: "★",
      position: { x: 1115, y: 65, width: 20, height: 20 },
      style: {
        fontSize: 20,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "star-decoration-3",
      type: "text",
      content: "★",
      position: { x: 65, y: 753, width: 20, height: 20 },
      style: {
        fontSize: 20,
        color: JICF_COLORS.gold,
        textAlign: "center",
      },
    },
    {
      id: "star-decoration-4",
      type: "text",
      content: "★",
      position: { x: 1115, y: 753, width: 20, height: 20 },
      style: {
        fontSize: 20,
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
    margin: { top: 15, right: 15, bottom: 15, left: 15 },
    background: {
      color: JICF_COLORS.white,
      // Add subtle pattern or watermark if desired
      // image: "/images/jicf-pattern.png",
      // opacity: 0.03,
    },
  },
  variables: {
    recipientName: {
      type: "text",
      label: "Recipient Name",
      required: true,
      placeholder: "Dr. Sarah Johnson",
    },
    awardCategory: {
      type: "select",
      label: "Award Category",
      required: true,
      options: [
        "Outstanding Ministry Leadership",
        "Excellence in Evangelism",
        "Distinguished Service",
        "Youth Ministry Excellence",
        "Community Impact",
        "Missionary Service",
        "Biblical Teaching",
        "Worship & Music Ministry",
      ],
    },
    achievementDetails: {
      type: "textarea",
      label: "Achievement Details",
      required: true,
      placeholder:
        "10 years of faithful youth ministry, leading over 200 young people to Christ",
    },
    awardLevel: {
      type: "select",
      label: "Award Level",
      required: true,
      options: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"],
    },
    date: {
      type: "date",
      label: "Award Date",
      required: true,
    },
    certificateNumber: {
      type: "text",
      label: "Certificate Number",
      required: false,
      placeholder: "JICF-AWD-2024-001",
    },
    presidentName: {
      type: "text",
      label: "President Name",
      required: true,
      placeholder: "Rev. Dr. Michael Thompson",
    },
    presidentTitle: {
      type: "text",
      label: "President Title",
      required: true,
      placeholder: "President, JICF International",
    },
    secretaryName: {
      type: "text",
      label: "Secretary Name",
      required: true,
      placeholder: "Dr. Rebecca Martinez",
    },
    secretaryTitle: {
      type: "text",
      label: "Secretary Title",
      required: true,
      placeholder: "Executive Secretary",
    },
    qrCode: {
      type: "qr",
      label: "Verification QR Code",
      required: false,
    },
  },
};
