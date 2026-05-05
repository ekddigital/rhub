/**
 * JULS Award Certificate Templates
 */

import { CertificateTemplate } from "../types";
import { JULS_COLORS } from "./constants";

export const julsOutstandingAward: CertificateTemplate = {
  id: "juls-outstanding-award",
  name: "JULS Outstanding Contribution Award",
  description:
    "Premium certificate for recognizing members who have made outstanding contributions to work in Jinan city and beyond, demonstrating exceptional leadership and service.",
  organization: "juls",
  category: "award",
  elements: [
    // Gradient background header
    {
      id: "header-ribbon",
      type: "shape",
      content: "",
      position: { x: 0, y: 0, width: 800, height: 140 },
      style: {
        color: JULS_COLORS.blue,
      },
    },
    {
      id: "header-accent",
      type: "shape",
      content: "",
      position: { x: 0, y: 120, width: 800, height: 20 },
      style: {
        color: JULS_COLORS.red,
      },
    },

    // Logos in header
    {
      id: "juls-logo-bg-award",
      type: "shape",
      content: "",
      position: { x: 45, y: 25, width: 90, height: 90 },
      style: {
        color: JULS_COLORS.white,
        borderRadius: "50%",
      },
    },
    {
      id: "juls-logo-award",
      type: "image",
      content: "/JULS_LOGO.png",
      position: { x: 55, y: 38, width: 70, height: 70 },
      style: {},
    },
    {
      id: "lsuic-logo-award",
      type: "image",
      content: "/LSUIC_LOGO.png",
      position: { x: 670, y: 30, width: 80, height: 80 },
      style: {},
    },

    // Header text
    {
      id: "organization-name-award",
      type: "text",
      content: "JINAN UNION OF LIBERIAN STUDENT",
      position: { x: 150, y: 40, width: 500, height: 28 },
      style: {
        fontSize: 24,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.white,
        textAlign: "center",
      },
    },
    {
      id: "parent-org-award",
      type: "text",
      content: "Liberian Student Union In China (LSUIC)",
      position: { x: 150, y: 72, width: 500, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: JULS_COLORS.white,
        textAlign: "center",
      },
    },
    {
      id: "excellence-motto",
      type: "text",
      content: "Excellence Through Unity & Service",
      position: { x: 150, y: 95, width: 500, height: 18 },
      style: {
        fontSize: 13,
        fontFamily: "serif",
        fontStyle: "italic",
        color: JULS_COLORS.white,
        textAlign: "center",
      },
    },

    // Main certificate content
    {
      id: "award-title",
      type: "text",
      content: "OUTSTANDING CONTRIBUTION AWARD",
      position: { x: 50, y: 170, width: 700, height: 45 },
      style: {
        fontSize: 32,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.blue,
        textAlign: "center",
      },
    },

    // Presentation text
    {
      id: "award-presentation",
      type: "text",
      content: "This award is presented to",
      position: { x: 100, y: 240, width: 600, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Recipient name
    {
      id: "recipient-name-award",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 100, y: 280, width: 600, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.red,
        textAlign: "center",
      },
    },

    // Achievement description with updated content
    {
      id: "achievement-description",
      type: "text",
      content:
        "In recognition of your exceptional leadership, outstanding contributions to work in Jinan city and beyond, and unwavering commitment to advancing the welfare of Liberian students. Your exemplary service, dedication to community development, and remarkable achievements have significantly impacted both our local union and the broader student community.",
      position: { x: 80, y: 350, width: 640, height: 70 },
      style: {
        fontSize: 13,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: "1.4",
      },
    },

    // QR Code positioned above the quote, similar to appreciation certificate
    {
      id: "verification-qr",
      type: "image",
      content: "{{qrCode}}",
      position: { x: 650, y: 250, width: 70, height: 70 },
      style: {
        borderRadius: "0px",
      },
    },
    {
      id: "qr-label",
      type: "text",
      content: "Scan to verify",
      position: { x: 660, y: 325, width: 50, height: 10 },
      style: {
        fontSize: 7,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Inspirational quote with extended blue background
    {
      id: "quote-background",
      type: "shape",
      content: "",
      position: { x: 150, y: 435, width: 500, height: 60 },
      style: {
        color: JULS_COLORS.blue,
        borderRadius: "4px",
      },
    },
    {
      id: "inspirational-quote",
      type: "text",
      content:
        '"The best way to find yourself is to lose yourself in the service of others"',
      position: { x: 170, y: 445, width: 460, height: 15 },
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
      content: "— Mahatma Gandhi",
      position: { x: 170, y: 465, width: 460, height: 12 },
      style: {
        fontSize: 11,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JULS_COLORS.white,
        textAlign: "center",
      },
    },

    // Footer section with date issued moved down and dual signatures
    {
      id: "award-date",
      type: "text",
      content: "Date Awarded: {{issueDate}}",
      position: { x: 80, y: 515, width: 640, height: 15 },
      style: {
        fontSize: 11,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // President signature area
    {
      id: "president-signature",
      type: "image",
      content: "/juls-signagure-president.png",
      position: { x: 120, y: 515, width: 120, height: 35 },
      style: {},
    },
    {
      id: "president-line",
      type: "shape",
      content: "",
      position: { x: 120, y: 555, width: 120, height: 1 },
      style: {
        color: JULS_COLORS.darkBlue,
      },
    },
    {
      id: "president-name",
      type: "text",
      content: "Ruphine M. Harmon",
      position: { x: 120, y: 565, width: 120, height: 12 },
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
      position: { x: 100, y: 575, width: 160, height: 15 },
      style: {
        fontSize: 6,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: "1.2",
      },
    },

    // Secretary signature area
    {
      id: "secretary-signature",
      type: "image",
      content: "/juls-signagure-secretary.png",
      position: { x: 560, y: 515, width: 120, height: 35 },
      style: {},
    },
    {
      id: "secretary-line",
      type: "shape",
      content: "",
      position: { x: 560, y: 555, width: 120, height: 1 },
      style: {
        color: JULS_COLORS.darkBlue,
      },
    },
    {
      id: "secretary-name",
      type: "text",
      content: "Lawrina N. Varney",
      position: { x: 560, y: 565, width: 120, height: 12 },
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
      position: { x: 540, y: 575, width: 160, height: 15 },
      style: {
        fontSize: 6,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: "1.2",
      },
    },

    // Certificate ID aligned with signature lines
    {
      id: "certificate-id-award",
      type: "text",
      content: "ID: {{certificateId}}",
      position: { x: 300, y: 555, width: 200, height: 12 },
      style: {
        fontSize: 9,
        fontFamily: "serif",
        color: JULS_COLORS.darkBlue,
        textAlign: "center",
      },
    },

    // Decorative elements
    {
      id: "award-star-left",
      type: "shape",
      content: "",
      position: { x: 50, y: 320, width: 20, height: 20 },
      style: {
        color: JULS_COLORS.gold,
        borderRadius: "50%",
      },
    },
    {
      id: "award-star-right",
      type: "shape",
      content: "",
      position: { x: 730, y: 320, width: 20, height: 20 },
      style: {
        color: JULS_COLORS.gold,
        borderRadius: "50%",
      },
    },

    // Security watermark
    {
      id: "security-watermark",
      type: "text",
      content: "JULS AWARD",
      position: { x: 250, y: 320, width: 300, height: 60 },
      style: {
        fontSize: 36,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "rgba(16, 12, 102, 0.08)",
        textAlign: "center",
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
