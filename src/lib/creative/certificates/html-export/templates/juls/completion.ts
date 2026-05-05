/**
 * JULS Course Completion Certificate Template
 * A formal certificate for program and course completion
 */

import type { CertificateTemplate } from "../types";
import { JULS_COLORS, JULS_FONTS, JULS_ORG_INFO } from "./constants";

export const julsCompletionCertificate: CertificateTemplate = {
  id: "juls-completion-course",
  name: "JULS Course Completion Certificate",
  description:
    "Official certificate for successful completion of JULS leadership programs and courses",
  organization: "juls",
  category: "completion",
  elements: [
    // Background accent
    {
      id: "background-accent",
      type: "rectangle",
      content: "",
      position: { x: 0, y: 0, width: 1200, height: 200 },
      style: {
        backgroundColor: JULS_COLORS.primary,
        opacity: 0.05,
      },
    },
    // Main border
    {
      id: "main-border",
      type: "rectangle",
      content: "",
      position: { x: 30, y: 30, width: 1140, height: 778 },
      style: {
        backgroundColor: "transparent",
        borderColor: JULS_COLORS.primary,
        borderWidth: 4,
        borderStyle: "solid",
        borderRadius: 8,
      },
    },
    // Header background
    {
      id: "header-bg",
      type: "rectangle",
      content: "",
      position: { x: 50, y: 50, width: 1100, height: 120 },
      style: {
        backgroundColor: JULS_COLORS.primary,
        borderRadius: 8,
      },
    },
    // Organization logo
    {
      id: "org-logo",
      type: "image",
      content: "/images/juls-logo-white.png",
      position: { x: 80, y: 80, width: 60, height: 60 },
      style: {
        objectFit: "contain",
      },
    },
    // Organization name in header
    {
      id: "header-org-name",
      type: "text",
      content: JULS_ORG_INFO.name,
      position: { x: 160, y: 80, width: 880, height: 35 },
      style: {
        fontSize: 28,
        fontFamily: JULS_FONTS.heading,
        fontWeight: "bold",
        color: JULS_COLORS.white,
        textAlign: "left",
        letterSpacing: "1px",
      },
    },
    // Header tagline
    {
      id: "header-tagline",
      type: "text",
      content: JULS_ORG_INFO.description,
      position: { x: 160, y: 120, width: 880, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.white,
        textAlign: "left",
        opacity: 0.9,
      },
    },
    // Certificate title
    {
      id: "certificate-title",
      type: "text",
      content: "CERTIFICATE OF COMPLETION",
      position: { x: 100, y: 220, width: 1000, height: 60 },
      style: {
        fontSize: 42,
        fontFamily: JULS_FONTS.heading,
        fontWeight: "bold",
        color: JULS_COLORS.gold,
        textAlign: "center",
        letterSpacing: "3px",
      },
    },
    // Certification statement
    {
      id: "certification-statement",
      type: "text",
      content: "This is to certify that",
      position: { x: 200, y: 310, width: 800, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
      },
    },
    // Participant name
    {
      id: "participant-name",
      type: "text",
      content: "{{participantName}}",
      position: { x: 150, y: 350, width: 900, height: 70 },
      style: {
        fontSize: 48,
        fontFamily: JULS_FONTS.elegant,
        fontWeight: "bold",
        color: JULS_COLORS.primary,
        textAlign: "center",
        borderBottom: `3px solid ${JULS_COLORS.gold}`,
        paddingBottom: "10px",
        letterSpacing: "2px",
      },
    },
    // Completion statement
    {
      id: "completion-statement",
      type: "text",
      content: "has successfully completed the",
      position: { x: 200, y: 450, width: 800, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
      },
    },
    // Course name
    {
      id: "course-name",
      type: "text",
      content: "{{courseName}}",
      position: { x: 200, y: 490, width: 800, height: 50 },
      style: {
        fontSize: 32,
        fontFamily: JULS_FONTS.heading,
        fontWeight: "600",
        color: JULS_COLORS.secondary,
        textAlign: "center",
        letterSpacing: "1px",
      },
    },
    // Program details
    {
      id: "program-details",
      type: "text",
      content:
        "A comprehensive {{duration}} leadership development program focusing on {{programFocus}}",
      position: { x: 200, y: 560, width: 800, height: 50 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
        lineHeight: 1.5,
      },
    },
    // Completion date
    {
      id: "completion-date",
      type: "text",
      content: "Completed on {{completionDate}}",
      position: { x: 200, y: 630, width: 350, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
      },
    },
    // Date underline
    {
      id: "date-underline",
      type: "rectangle",
      content: "",
      position: { x: 200, y: 665, width: 350, height: 2 },
      style: {
        backgroundColor: JULS_COLORS.lightGray,
      },
    },
    // Hours completed
    {
      id: "hours-completed",
      type: "text",
      content: "Total Hours: {{totalHours}}",
      position: { x: 650, y: 630, width: 350, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.text,
        textAlign: "center",
      },
    },
    // Hours underline
    {
      id: "hours-underline",
      type: "rectangle",
      content: "",
      position: { x: 650, y: 665, width: 350, height: 2 },
      style: {
        backgroundColor: JULS_COLORS.lightGray,
      },
    },
    // Instructor signature
    {
      id: "instructor-signature",
      type: "text",
      content: "{{instructorName}}",
      position: { x: 200, y: 720, width: 250, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.elegant,
        fontWeight: "600",
        color: JULS_COLORS.text,
        textAlign: "center",
        borderBottom: `2px solid ${JULS_COLORS.lightGray}`,
      },
    },
    // Instructor title
    {
      id: "instructor-title",
      type: "text",
      content: "Lead Instructor",
      position: { x: 200, y: 755, width: 250, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Director signature
    {
      id: "director-signature",
      type: "text",
      content: JULS_ORG_INFO.leadership.director,
      position: { x: 750, y: 720, width: 250, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JULS_FONTS.elegant,
        fontWeight: "600",
        color: JULS_COLORS.text,
        textAlign: "center",
        borderBottom: `2px solid ${JULS_COLORS.lightGray}`,
      },
    },
    // Director title
    {
      id: "director-title",
      type: "text",
      content: "Program Director",
      position: { x: 750, y: 755, width: 250, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Verification QR code
    {
      id: "verification-qr",
      type: "qr-code",
      content: "{{qrCodeData}}",
      position: { x: 1050, y: 700, width: 70, height: 70 },
      style: {
        backgroundColor: "transparent",
      },
    },
    // Certificate ID
    {
      id: "certificate-id",
      type: "text",
      content: "ID: {{certificateId}}",
      position: { x: 1030, y: 780, width: 120, height: 15 },
      style: {
        fontSize: 10,
        fontFamily: JULS_FONTS.primary,
        color: JULS_COLORS.darkGray,
        textAlign: "center",
      },
    },
  ],
  pageSettings: {
    width: 1200,
    height: 838,
    orientation: "landscape",
    backgroundColor: JULS_COLORS.white,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: JULS_COLORS.white,
    },
  },
  variables: {
    participantName: {
      type: "text",
      label: "Participant Name",
      required: true,
      placeholder: "Alex Rivera",
    },
    courseName: {
      type: "text",
      label: "Course Name",
      required: true,
      placeholder: "Advanced Leadership Development Program",
    },
    duration: {
      type: "select",
      label: "Program Duration",
      required: true,
      options: [
        "2-week",
        "4-week",
        "6-week",
        "8-week",
        "12-week",
        "semester-long",
      ],
      defaultValue: "6-week",
    },
    programFocus: {
      type: "textarea",
      label: "Program Focus",
      required: true,
      placeholder:
        "strategic thinking, team management, and effective communication",
    },
    completionDate: {
      type: "date",
      label: "Completion Date",
      required: true,
      defaultValue: new Date().toLocaleDateString(),
    },
    totalHours: {
      type: "number",
      label: "Total Hours Completed",
      required: true,
      defaultValue: 40,
    },
    instructorName: {
      type: "text",
      label: "Lead Instructor Name",
      required: true,
      placeholder: "Dr. Maria Rodriguez",
    },
    certificateId: {
      type: "text",
      label: "Certificate ID",
      required: false,
      placeholder: "JULS-2025-CC-0001-XY",
      defaultValue: "JULS-2025-CC-0001-XY",
    },
    qrCodeData: {
      type: "qr",
      label: "QR Code Data",
      required: false,
    },
  },
};
