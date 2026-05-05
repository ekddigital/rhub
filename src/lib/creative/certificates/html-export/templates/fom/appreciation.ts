/**
 * FOM Appreciation Certificate Template
 */

import { CertificateTemplate } from "../types";
import { FOM_COLORS, FOM_ORGANIZATION } from "./constants";

export const fomAppreciationTemplate: CertificateTemplate = {
  id: "fom-appreciation",
  name: "Certificate of Appreciation",
  description:
    "Professional certificate for recognizing dedicated service to the organization",
  organization: "fom",
  category: "appreciation",
  pageSettings: {
    width: 800,
    height: 600,
    orientation: "landscape",
    backgroundColor: "#ffffff",
  },
  elements: [
    // Background border
    {
      id: "outer-border",
      type: "shape",
      content: "",
      position: { x: 20, y: 20, width: 760, height: 560 },
      style: {
        border: `3px solid ${FOM_COLORS.primary}`,
        borderRadius: "8px",
      },
    },
    {
      id: "inner-border",
      type: "shape",
      content: "",
      position: { x: 40, y: 40, width: 720, height: 520 },
      style: {
        border: `1px solid ${FOM_COLORS.lightGray}`,
        borderRadius: "4px",
      },
    },

    // Header Section
    {
      id: "organization-name",
      type: "text",
      content: FOM_ORGANIZATION.name,
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
      content: FOM_ORGANIZATION.tagline,
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
        color: FOM_COLORS.primaryDeep || FOM_COLORS.primary,
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

    // Recipient name (placeholder)
    {
      id: "recipient-name",
      type: "text",
      content: "{recipientName}",
      position: { x: 80, y: 260, width: 640, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: "serif",
        fontWeight: "bold",
        color: FOM_COLORS.secondary,
        textAlign: "center",
      },
    },

    // Body text
    {
      id: "appreciation-text",
      type: "text",
      content:
        "in sincere appreciation for your valuable contributions and dedicated efforts in {contributionArea}. Your commitment and service have been instrumental to our mission of bringing Jesus to the world.",
      position: { x: 80, y: 320, width: 640, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: FOM_COLORS.text,
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 640,
      },
    },

    // Covenant verse
    {
      id: "covenant-verse",
      type: "text",
      content:
        '"Do not be afraid, for those who are with us are more than those who are with them" - 2 Kings 6:16',
      position: { x: 80, y: 420, width: 640, height: 30 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        fontStyle: "italic",
        color: FOM_COLORS.accent,
        textAlign: "center",
      },
    },

    // Signature section
    {
      id: "signature-line",
      type: "shape",
      content: "",
      position: { x: 150, y: 480, width: 150, height: 1 },
      style: {
        backgroundColor: FOM_COLORS.darkGray,
      },
    },
    {
      id: "signature-label",
      type: "text",
      content: "Executive Director",
      position: { x: 150, y: 490, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Date section
    {
      id: "date-line",
      type: "shape",
      content: "",
      position: { x: 500, y: 480, width: 150, height: 1 },
      style: {
        backgroundColor: FOM_COLORS.darkGray,
      },
    },
    {
      id: "date-label",
      type: "text",
      content: "Date",
      position: { x: 500, y: 490, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: FOM_COLORS.darkGray,
        textAlign: "center",
      },
    },
  ],
};
