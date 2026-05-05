/**
 * JULS Appreciation Certificate Templates
 */

import { CertificateTemplate } from "../types";
import { JULS_COLORS } from "./constants";

export const julsAppreciationCert: CertificateTemplate = {
  id: "juls-appreciation",
  name: "JULS Certificate of Appreciation",
  description:
    "Professional certificate for appreciating scholars for their wonderful contributions to the Jinan Union of Liberian Student and active involvement in student community activities.",
  organization: "juls",
  category: "appreciation",
  elements: [
    // Background and borders
    {
      id: "outer-border",
      type: "shape",
      content: "",
      position: { x: 20, y: 20, width: 760, height: 560 },
      style: {
        color: JULS_COLORS.blue,
        borderRadius: "8px",
      },
    },
    {
      id: "inner-border",
      type: "shape",
      content: "",
      position: { x: 40, y: 40, width: 720, height: 520 },
      style: {
        color: JULS_COLORS.white,
        borderRadius: "4px",
      },
    },

    // Header section with both logos
    {
      id: "juls-logo",
      type: "image",
      content: "/JULS_LOGO.png",
      position: { x: 60, y: 60, width: 80, height: 80 },
      style: {},
    },
    {
      id: "lsuic-logo",
      type: "image",
      content: "/LSUIC_LOGO.png",
      position: { x: 660, y: 60, width: 80, height: 80 },
      style: {},
    },
    {
      id: "organization-name",
      type: "text",
      content: "JINAN UNION OF LIBERIAN STUDENT",
      position: { x: 160, y: 65, width: 480, height: 30 },
      style: {
        fontSize: 22,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.blue,
        textAlign: "center",
      },
    },
    {
      id: "parent-organization",
      type: "text",
      content: "Liberian Student Union In China (LSUIC)",
      position: { x: 160, y: 95, width: 480, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        color: JULS_COLORS.red,
        textAlign: "center",
      },
    },
    {
      id: "location-tag",
      type: "text",
      content: "Jinan City, China",
      position: { x: 160, y: 115, width: 480, height: 20 },
      style: {
        fontSize: 11,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Certificate title
    {
      id: "certificate-title",
      type: "text",
      content: "CERTIFICATE OF APPRECIATION",
      position: { x: 80, y: 170, width: 640, height: 40 },
      style: {
        fontSize: 28,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.red,
        textAlign: "center",
      },
    },

    // Presentation text
    {
      id: "presented-to",
      type: "text",
      content: "This certificate is proudly presented to",
      position: { x: 80, y: 230, width: 640, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Recipient name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 100, y: 270, width: 600, height: 50 },
      style: {
        fontSize: 34,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.blue,
        textAlign: "center",
      },
    },

    // QR Code positioned above description text
    {
      id: "qr-verification",
      type: "image",
      content: "{{qrCode}}",
      position: { x: 650, y: 240, width: 70, height: 70 },
      style: {
        borderRadius: "0px",
      },
    },
    {
      id: "qr-label",
      type: "text",
      content: "Scan to verify",
      position: { x: 660, y: 315, width: 50, height: 10 },
      style: {
        fontSize: 7,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Description with updated content
    {
      id: "description",
      type: "text",
      content:
        "In recognition of your outstanding contribution to the Jinan Union of Liberian Student community activities. Your involvement has contributed meaningfully to our shared goals of unity, academic growth, and cultural enrichment.",
      position: { x: 100, y: 340, width: 600, height: 60 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: "1.4",
      },
    },

    // Inspirational quote with background
    {
      id: "quote-background",
      type: "shape",
      content: "",
      position: { x: 150, y: 415, width: 500, height: 50 },
      style: {
        color: JULS_COLORS.blue,
        borderRadius: "4px",
      },
    },
    {
      id: "inspirational-quote",
      type: "text",
      content:
        '"Education is the most powerful weapon which you can use to change the world"',
      position: { x: 170, y: 425, width: 460, height: 15 },
      style: {
        fontSize: 12,
        fontFamily: "serif",
        fontWeight: "italic",
        color: JULS_COLORS.white,
        textAlign: "center",
      },
    },
    {
      id: "quote-author",
      type: "text",
      content: "— Nelson Mandela",
      position: { x: 170, y: 445, width: 460, height: 12 },
      style: {
        fontSize: 11,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.white,
        textAlign: "center",
      },
    },

    // Footer section
    {
      id: "date-issued",
      type: "text",
      content: "Date Issued: {{issueDate}}",
      position: { x: 60, y: 475, width: 680, height: 15 },
      style: {
        fontSize: 11,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // President signature area (moved up by 5px)
    {
      id: "president-signature",
      type: "image",
      content: "/juls-signagure-president.png",
      position: { x: 120, y: 490, width: 120, height: 35 },
      style: {},
    },
    {
      id: "president-line",
      type: "shape",
      content: "",
      position: { x: 120, y: 530, width: 120, height: 1 },
      style: {
        color: JULS_COLORS.darkBlue,
      },
    },
    {
      id: "president-name",
      type: "text",
      content: "Ruphine M. Harmon",
      position: { x: 120, y: 535, width: 120, height: 12 },
      style: {
        fontSize: 9,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },
    {
      id: "president-title",
      type: "text",
      content: "City President, LSUIC Jinan Chapter",
      position: { x: 100, y: 545, width: 160, height: 15 },
      style: {
        fontSize: 6,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: "1.2",
      },
    },

    // Secretary signature area (moved up by 5px)
    {
      id: "secretary-signature",
      type: "image",
      content: "/juls-signagure-secretary.png",
      position: { x: 560, y: 490, width: 120, height: 35 },
      style: {},
    },
    {
      id: "secretary-line",
      type: "shape",
      content: "",
      position: { x: 560, y: 530, width: 120, height: 1 },
      style: {
        color: JULS_COLORS.darkBlue,
      },
    },
    {
      id: "secretary-name",
      type: "text",
      content: "Lawrina N. Varney",
      position: { x: 560, y: 535, width: 120, height: 12 },
      style: {
        fontSize: 9,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },
    {
      id: "secretary-title",
      type: "text",
      content: "City Secretary, LSUIC Jinan Chapter",
      position: { x: 540, y: 545, width: 160, height: 15 },
      style: {
        fontSize: 6,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: "1.2",
      },
    },

    // Certificate ID aligned with signatures (moved up by 5px)
    {
      id: "certificate-id",
      type: "text",
      content: "ID: {{certificateId}}",
      position: { x: 300, y: 530, width: 200, height: 12 },
      style: {
        fontSize: 9,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Decorative elements
    {
      id: "left-accent",
      type: "shape",
      content: "",
      position: { x: 60, y: 300, width: 15, height: 15 },
      style: {
        color: JULS_COLORS.red,
        borderRadius: "50%",
      },
    },
    {
      id: "right-accent",
      type: "shape",
      content: "",
      position: { x: 725, y: 300, width: 15, height: 15 },
      style: {
        color: JULS_COLORS.red,
        borderRadius: "50%",
      },
    },
  ],
  pageSettings: {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: JULS_COLORS.white,
    },
  },
  fonts: [
    {
      family: "serif",
      variants: ["normal", "bold", "italic"],
    },
  ],
};
