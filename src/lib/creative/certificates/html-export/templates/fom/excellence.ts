/**
 * FOM Excellence Certificate Template
 */

import { CertificateTemplate } from "../types";
import { FOM_COLORS, FOM_ORGANIZATION } from "./constants";

export const fomExcellenceTemplate: CertificateTemplate = {
  id: "fom-excellence",
  name: "Certificate of Excellence",
  description:
    "Premium design for recognizing outstanding achievements and contributions",
  organization: "fom",
  category: "excellence",
  pageSettings: {
    width: 800,
    height: 600,
    orientation: "landscape",
    backgroundColor: FOM_COLORS.veryLightGray,
  },
  elements: [
    // Header ribbon background
    {
      id: "header-ribbon",
      type: "shape",
      content: "",
      position: { x: 0, y: 0, width: 800, height: 120 },
      style: {
        backgroundColor: FOM_COLORS.primary,
      },
    },

    // Logo placeholder
    {
      id: "logo-placeholder",
      type: "image",
      content: FOM_ORGANIZATION.logo,
      position: { x: 50, y: 20, width: 80, height: 80 },
      style: {},
    },

    // Organization name in header
    {
      id: "header-org-name",
      type: "text",
      content: FOM_ORGANIZATION.name,
      position: { x: 150, y: 30, width: 500, height: 30 },
      style: {
        fontSize: 26,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.white,
        textAlign: "center",
      },
    },

    // Bible verse in header
    {
      id: "header-verse",
      type: "text",
      content: FOM_ORGANIZATION.verse,
      position: { x: 150, y: 65, width: 500, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: FOM_COLORS.veryLightGray,
        textAlign: "center",
      },
    },

    // Main certificate content
    {
      id: "excellence-title",
      type: "text",
      content: "CERTIFICATE OF EXCELLENCE",
      position: { x: 50, y: 160, width: 700, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.primaryDeep || FOM_COLORS.primary,
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
      content: "{recipientName}",
      position: { x: 50, y: 280, width: 700, height: 45 },
      style: {
        fontSize: 34,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.secondary,
        textAlign: "center",
      },
    },

    // Achievement text
    {
      id: "achievement-text",
      type: "text",
      content:
        "for demonstrating exceptional excellence and outstanding achievement in {fieldOfExcellence}. Your dedication and commitment to excellence serve as an inspiration to all members of our ministry.",
      position: { x: 80, y: 350, width: 640, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: FOM_COLORS.text,
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 640,
      },
    },

    // Leadership signatures
    {
      id: "executive-signature",
      type: "text",
      content: "Executive Director",
      position: { x: 120, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    {
      id: "chairperson-signature",
      type: "text",
      content: "Chairperson",
      position: { x: 320, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    {
      id: "date-excellence",
      type: "text",
      content: "{issueDate}",
      position: { x: 520, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Decorative elements
    {
      id: "decorative-line-left",
      type: "shape",
      content: "",
      position: { x: 100, y: 520, width: 200, height: 2 },
      style: {
        backgroundColor: FOM_COLORS.accent,
      },
    },

    {
      id: "decorative-line-right",
      type: "shape",
      content: "",
      position: { x: 500, y: 520, width: 200, height: 2 },
      style: {
        backgroundColor: FOM_COLORS.accent,
      },
    },
  ],
};
