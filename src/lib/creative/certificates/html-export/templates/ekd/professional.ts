/**
 * EKD Digital Certificate Templates
 */

import { CertificateTemplate } from "../types";

const EKD_COLORS = {
  primary: "#1e40af",
  secondary: "#3b82f6",
  accent: "#60a5fa",
  text: "#1f2937",
  lightGray: "#f3f4f6",
  darkGray: "#6b7280",
  white: "#ffffff",
};

export const ekdTechCertTemplate: CertificateTemplate = {
  id: "ekd-tech-completion",
  name: "Technology Completion Certificate",
  description: "Professional certificate for technology course completion",
  organization: "ekd-digital",
  category: "completion",
  pageSettings: {
    width: 800,
    height: 600,
    orientation: "landscape",
    backgroundColor: "#ffffff",
  },
  elements: [
    // Modern header with gradient effect
    {
      id: "header-bg",
      type: "shape",
      content: "",
      position: { x: 0, y: 0, width: 800, height: 100 },
      style: {
        backgroundColor: EKD_COLORS.primary,
      },
    },

    // Company logo placeholder
    {
      id: "ekd-logo",
      type: "image",
      content: "/logo.png",
      position: { x: 50, y: 20, width: 60, height: 60 },
      style: {},
    },

    // Company name
    {
      id: "company-name",
      type: "text",
      content: "EKD DIGITAL",
      position: { x: 130, y: 25, width: 300, height: 25 },
      style: {
        fontSize: 22,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        color: EKD_COLORS.white,
      },
    },

    // Tagline
    {
      id: "company-tagline",
      type: "text",
      content: "Digital Solutions & Technology Excellence",
      position: { x: 130, y: 55, width: 400, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "sans-serif",
        color: EKD_COLORS.lightGray,
      },
    },

    // Certificate title
    {
      id: "cert-title",
      type: "text",
      content: "CERTIFICATE OF COMPLETION",
      position: { x: 50, y: 140, width: 700, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        color: EKD_COLORS.primary,
        textAlign: "center",
      },
    },

    // Subtitle
    {
      id: "cert-subtitle",
      type: "text",
      content: "This is to certify that",
      position: { x: 50, y: 190, width: 700, height: 20 },
      style: {
        fontSize: 16,
        fontFamily: "sans-serif",
        color: EKD_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Recipient name
    {
      id: "recipient-name-tech",
      type: "text",
      content: "{recipientName}",
      position: { x: 50, y: 230, width: 700, height: 40 },
      style: {
        fontSize: 28,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        color: EKD_COLORS.secondary,
        textAlign: "center",
      },
    },

    // Achievement text
    {
      id: "achievement-tech",
      type: "text",
      content:
        "has successfully completed the {courseName} program and demonstrated proficiency in modern technology solutions and digital innovation.",
      position: { x: 80, y: 300, width: 640, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "sans-serif",
        color: EKD_COLORS.text,
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 640,
      },
    },

    // Skills badge
    {
      id: "skills-badge",
      type: "text",
      content: "Skills Acquired: {skillsAcquired}",
      position: { x: 80, y: 400, width: 640, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        color: EKD_COLORS.accent,
        textAlign: "center",
      },
    },

    // Signature section
    {
      id: "instructor-signature",
      type: "text",
      content: "Lead Instructor",
      position: { x: 150, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "sans-serif",
        color: EKD_COLORS.darkGray,
        textAlign: "center",
      },
    },

    {
      id: "certification-date",
      type: "text",
      content: "{issueDate}",
      position: { x: 500, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "sans-serif",
        color: EKD_COLORS.darkGray,
        textAlign: "center",
      },
    },
  ],
};

export const ekdProfessionalTemplate: CertificateTemplate = {
  id: "ekd-professional-excellence",
  name: "Professional Excellence Award",
  description: "Recognition for outstanding professional performance",
  organization: "ekd-digital",
  category: "excellence",
  pageSettings: {
    width: 800,
    height: 600,
    orientation: "landscape",
    backgroundColor: "#f8fafc",
  },
  elements: [
    // Professional border
    {
      id: "professional-border",
      type: "shape",
      content: "",
      position: { x: 30, y: 30, width: 740, height: 540 },
      style: {
        border: `2px solid ${EKD_COLORS.primary}`,
        borderRadius: "4px",
      },
    },

    // Title
    {
      id: "excellence-title",
      type: "text",
      content: "PROFESSIONAL EXCELLENCE AWARD",
      position: { x: 50, y: 80, width: 700, height: 40 },
      style: {
        fontSize: 30,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        color: EKD_COLORS.primary,
        textAlign: "center",
      },
    },

    // Presented to
    {
      id: "presented-to-prof",
      type: "text",
      content: "Presented to",
      position: { x: 50, y: 140, width: 700, height: 20 },
      style: {
        fontSize: 18,
        fontFamily: "sans-serif",
        color: EKD_COLORS.darkGray,
        textAlign: "center",
      },
    },

    // Recipient name
    {
      id: "recipient-name-prof",
      type: "text",
      content: "{recipientName}",
      position: { x: 50, y: 180, width: 700, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: "sans-serif",
        fontWeight: "bold",
        color: EKD_COLORS.secondary,
        textAlign: "center",
      },
    },

    // Recognition text
    {
      id: "recognition-text",
      type: "text",
      content:
        "in recognition of outstanding professional excellence and exceptional performance in {professionalField}. Your dedication to innovation and quality exemplifies the highest standards of our industry.",
      position: { x: 80, y: 260, width: 640, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "sans-serif",
        color: EKD_COLORS.text,
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 640,
      },
    },

    // Company branding
    {
      id: "company-brand",
      type: "text",
      content: "EKD Digital - Empowering Digital Transformation",
      position: { x: 50, y: 380, width: 700, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "sans-serif",
        fontStyle: "italic",
        color: EKD_COLORS.accent,
        textAlign: "center",
      },
    },

    // Signature sections
    {
      id: "ceo-signature",
      type: "text",
      content: "Chief Executive Officer",
      position: { x: 150, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "sans-serif",
        color: EKD_COLORS.darkGray,
        textAlign: "center",
      },
    },

    {
      id: "award-date",
      type: "text",
      content: "{issueDate}",
      position: { x: 500, y: 480, width: 150, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: "sans-serif",
        color: EKD_COLORS.darkGray,
        textAlign: "center",
      },
    },
  ],
};
