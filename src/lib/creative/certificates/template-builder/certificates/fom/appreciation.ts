/**
 * FOM Appreciation Certificate Templates
 */

import { CertificateTemplate } from "../types";
import { FOM_COLORS } from "./constants";

export const fomAppreciationCert: CertificateTemplate = {
  id: "fom-appreciation",
  name: "Certificate of Appreciation",
  description:
    "Professional certificate for recognizing dedicated service to the organization.",
  organization: "fom",
  category: "appreciation",
  elements: [
    // Background border and frame
    {
      id: "outer-border",
      type: "shape",
      content: "",
      position: { x: 20, y: 20, width: 760, height: 560 },
      style: {
        color: FOM_COLORS.primary,
        borderRadius: "8px",
      },
    },
    {
      id: "inner-border",
      type: "shape",
      content: "",
      position: { x: 40, y: 40, width: 720, height: 520 },
      style: {
        color: FOM_COLORS.lightGray,
        borderRadius: "4px",
      },
    },

    // Header Section
    {
      id: "organization-name",
      type: "text",
      content: "FISHERS OF MEN",
      position: { x: 80, y: 80, width: 640, height: 30 },
      style: {
        fontSize: 24,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.primary,
        textAlign: "center",
        letterSpacing: "2px",
      },
    },
    {
      id: "tagline",
      type: "text",
      content: "Touching Lives, Building Futures",
      position: { x: 80, y: 115, width: 640, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        fontStyle: "italic",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Certificate Title
    {
      id: "certificate-title",
      type: "text",
      content: "CERTIFICATE OF APPRECIATION",
      position: { x: 80, y: 160, width: 640, height: 40 },
      style: {
        fontSize: 28,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.primaryDeep,
        textAlign: "center",
        letterSpacing: "1px",
      },
    },

    // Presentation line
    {
      id: "presented-to",
      type: "text",
      content: "is hereby presented to",
      position: { x: 80, y: 220, width: 640, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Recipient name (highlighted)
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 100, y: 250, width: 600, height: 50 },
      style: {
        fontSize: 32,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.primary,
        textAlign: "center",
      },
    },

    // Description text
    {
      id: "description",
      type: "text",
      content:
        "In recognition of your unwavering dedication, faithful service, and remarkable commitment to the Fishers of Men organization. Your selfless efforts in touching lives, strengthening our faith community, and advancing God's kingdom have been an inspiration to all.",
      position: { x: 100, y: 330, width: 600, height: 60 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Covenant verse section
    {
      id: "covenant-verse",
      type: "text",
      content:
        '"Do not be afraid, for those who are with us are more than those who are with them"',
      position: { x: 80, y: 415, width: 640, height: 25 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        fontStyle: "italic",
        color: FOM_COLORS.primaryDeep,
        textAlign: "center",
      },
    },
    {
      id: "verse-reference",
      type: "text",
      content: "- 2 Kings 6:16",
      position: { x: 80, y: 440, width: 640, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Signature and date section
    {
      id: "date-combined",
      type: "text",
      content: "Date: {{issueDate}}",
      position: { x: 80, y: 500, width: 160, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "left",
      },
    },
    {
      id: "certificate-id",
      type: "text",
      content: "Certificate ID: {{certificateId}}",
      position: { x: 275, y: 500, width: 250, height: 20 },
      style: {
        fontSize: 10,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },
    {
      id: "signature-combined",
      type: "text",
      content: "Authorized by: {{issuerName}}",
      position: { x: 540, y: 500, width: 160, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "right",
      },
    },

    // Security Features Section
    {
      id: "qr-code",
      type: "image",
      content: "{{qrCode}}",
      position: { x: 620, y: 40, width: 110, height: 110 },
      style: {
        borderRadius: "0px",
      },
    },
    {
      id: "qr-label",
      type: "text",
      content: "Scan to verify",
      position: { x: 620, y: 155, width: 110, height: 12 },
      style: {
        fontSize: 8,
        fontFamily: "serif",
        color: FOM_COLORS.mediumGray,
        textAlign: "center",
      },
    },

    // Security watermark
    {
      id: "security-watermark",
      type: "text",
      content: "AUTHENTIC",
      position: { x: 300, y: 300, width: 200, height: 80 },
      style: {
        fontSize: 48,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "rgba(12, 67, 106, 0.08)",
        textAlign: "center",
      },
    },

    // Digital signature indicator
    {
      id: "digital-signature",
      type: "text",
      content: "Digitally Signed & Verified",
      position: { x: 275, y: 525, width: 250, height: 12 },
      style: {
        fontSize: 8,
        fontFamily: "serif",
        color: FOM_COLORS.mediumGray,
        textAlign: "center",
      },
    },

    // Decorative elements
    {
      id: "left-decoration",
      type: "shape",
      content: "",
      position: { x: 60, y: 280, width: 15, height: 15 },
      style: {
        color: FOM_COLORS.gold,
        borderRadius: "50%",
      },
    },
    {
      id: "right-decoration",
      type: "shape",
      content: "",
      position: { x: 725, y: 280, width: 15, height: 15 },
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
