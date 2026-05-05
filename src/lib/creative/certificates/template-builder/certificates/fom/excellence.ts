/**
 * FOM Excellence Certificate Templates
 */

import { CertificateTemplate } from "../types";
import { FOM_COLORS } from "./constants";

export const fomExcellenceCert: CertificateTemplate = {
  id: "fom-excellence",
  name: "Certificate of Excellence",
  description:
    "Premium design for recognizing outstanding achievements and contributions.",
  organization: "fom",
  category: "excellence",
  elements: [
    // Gradient background
    {
      id: "background",
      type: "shape",
      content: "",
      position: { x: 0, y: 0, width: 800, height: 600 },
      style: {
        color: FOM_COLORS.veryLightGray,
      },
    },

    // Header with logo and ribbon design
    {
      id: "header-ribbon",
      type: "shape",
      content: "",
      position: { x: 0, y: 0, width: 800, height: 120 },
      style: {
        color: FOM_COLORS.primary,
      },
    },
    {
      id: "logo-excellence",
      type: "image",
      content: "/Logo.png",
      position: { x: 50, y: 20, width: 80, height: 80 },
      style: {},
    },
    {
      id: "ministry-name-excellence",
      type: "text",
      content: "FISHERS OF MEN",
      position: { x: 150, y: 30, width: 500, height: 30 },
      style: {
        fontSize: 26,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.white,
        textAlign: "center",
      },
    },
    {
      id: "ministry-verse-excellence",
      type: "text",
      content: "Matthew 4:19 - Follow me, and I will make you fishers of men",
      position: { x: 150, y: 65, width: 500, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: FOM_COLORS.veryLightGray,
        textAlign: "center",
      },
    },

    // Certificate content
    {
      id: "excellence-title",
      type: "text",
      content: "CERTIFICATE OF EXCELLENCE",
      position: { x: 50, y: 160, width: 700, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.primaryDeep,
        textAlign: "center",
      },
    },

    // Presentation text
    {
      id: "presented-to-excellence",
      type: "text",
      content: "This certificate is proudly presented to",
      position: { x: 100, y: 240, width: 600, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Recipient name
    {
      id: "recipient-name-excellence",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 100, y: 280, width: 600, height: 60 },
      style: {
        fontSize: 38,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.primary,
        textAlign: "center",
      },
    },

    // Achievement description
    {
      id: "achievement-description",
      type: "text",
      content:
        "for demonstrating exceptional excellence, outstanding performance, and unwavering commitment to the mission and values of Fishers of Men. Your remarkable contributions have significantly impacted our organization and the communities we serve.",
      position: { x: 80, y: 360, width: 640, height: 70 },
      style: {
        fontSize: 15,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
        lineHeight: "1.4",
      },
    },

    // Date and signatures
    {
      id: "issue-date-excellence",
      type: "text",
      content: "Issued on: {{issueDate}}",
      position: { x: 100, y: 480, width: 200, height: 25 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "left",
      },
    },

    {
      id: "certificate-id-excellence",
      type: "text",
      content: "Certificate ID: {{certificateId}}",
      position: { x: 300, y: 480, width: 200, height: 25 },
      style: {
        fontSize: 11,
        fontFamily: "serif",
        color: FOM_COLORS.mediumGray,
        textAlign: "center",
      },
    },

    {
      id: "authorized-by-excellence",
      type: "text",
      content: "Authorized by: {{issuerName}}",
      position: { x: 500, y: 480, width: 200, height: 25 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "right",
      },
    },

    // QR Code
    {
      id: "qr-code-excellence",
      type: "image",
      content: "{{qrCode}}",
      position: { x: 650, y: 140, width: 100, height: 100 },
      style: {},
    },

    // Security watermark
    {
      id: "watermark-excellence",
      type: "text",
      content: "EXCELLENCE",
      position: { x: 250, y: 320, width: 300, height: 80 },
      style: {
        fontSize: 42,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "rgba(12, 67, 106, 0.06)",
        textAlign: "center",
      },
    },

    // Decorative elements
    {
      id: "gold-seal-left",
      type: "shape",
      content: "",
      position: { x: 80, y: 320, width: 20, height: 20 },
      style: {
        color: FOM_COLORS.gold,
        borderRadius: "50%",
      },
    },
    {
      id: "gold-seal-right",
      type: "shape",
      content: "",
      position: { x: 700, y: 320, width: 20, height: 20 },
      style: {
        color: FOM_COLORS.gold,
        borderRadius: "50%",
      },
    },
  ],
  pageSettings: {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: FOM_COLORS.white,
    },
  },
  fonts: [
    {
      family: "serif",
      variants: ["normal", "bold", "italic"],
    },
  ],
};
