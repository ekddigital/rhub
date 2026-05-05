/**
 * JICF Completion Certificate Template
 * For course completion, training programs, and educational achievements
 */

import type { CertificateTemplate } from "../types";
import { JICF_COLORS, JICF_FONTS, JICF_ORG_INFO } from "./constants";

export const jicfCompletionCertificate: CertificateTemplate = {
  id: "jicf-completion-training",
  name: "JICF Training Completion Certificate",
  description: "Certificate for completing JICF training programs and courses",
  organization: "jicf",
  category: "completion",
  elements: [
    // Clean border frame
    {
      id: "main-border",
      type: "rectangle",
      content: "",
      position: { x: 40, y: 40, width: 1120, height: 758 },
      style: {
        backgroundColor: "transparent",
        borderColor: JICF_COLORS.primary,
        borderWidth: 3,
        borderStyle: "solid",
        borderRadius: 6,
      },
    },
    // Header section background
    {
      id: "header-background",
      type: "rectangle",
      content: "",
      position: { x: 60, y: 60, width: 1080, height: 120 },
      style: {
        backgroundColor: JICF_COLORS.primary,
        borderRadius: 6,
        background: `linear-gradient(135deg, ${JICF_COLORS.primary} 0%, ${JICF_COLORS.blue} 100%)`,
      },
    },
    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/images/jicf-logo-white.png",
      position: { x: 80, y: 80, width: 80, height: 80 },
      style: {
        objectFit: "contain",
      },
    },
    // Organization info in header
    {
      id: "organization-header",
      type: "text",
      content: JICF_ORG_INFO.name,
      position: { x: 180, y: 85, width: 840, height: 35 },
      style: {
        fontSize: 28,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "left",
        letterSpacing: "1px",
      },
    },
    // Tagline in header
    {
      id: "organization-tagline",
      type: "text",
      content: JICF_ORG_INFO.tagline,
      position: { x: 180, y: 125, width: 840, height: 25 },
      style: {
        fontSize: 14,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.yellow,
        textAlign: "left",
        fontStyle: "italic",
      },
    },
    // Certificate title
    {
      id: "certificate-title",
      type: "text",
      content: "CERTIFICATE OF COMPLETION",
      position: { x: 100, y: 220, width: 1000, height: 50 },
      style: {
        fontSize: 36,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        letterSpacing: "2px",
      },
    },
    // Completion statement
    {
      id: "completion-statement",
      type: "text",
      content: "This is to certify that",
      position: { x: 100, y: 290, width: 1000, height: 30 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
      },
    },
    // Participant name
    {
      id: "participant-name",
      type: "text",
      content: "{{participantName}}",
      position: { x: 200, y: 330, width: 800, height: 55 },
      style: {
        fontSize: 40,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.secondary,
        textAlign: "center",
        borderBottom: `2px solid ${JICF_COLORS.gold}`,
        paddingBottom: "8px",
      },
    },
    // Has completed text
    {
      id: "has-completed",
      type: "text",
      content: "has successfully completed the",
      position: { x: 100, y: 410, width: 1000, height: 30 },
      style: {
        fontSize: 18,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
      },
    },
    // Course/program name
    {
      id: "course-name",
      type: "text",
      content: "{{courseName}}",
      position: { x: 150, y: 450, width: 900, height: 45 },
      style: {
        fontSize: 28,
        fontFamily: JICF_FONTS.elegant,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        textDecoration: "underline",
        textDecorationColor: JICF_COLORS.gold,
      },
    },
    // Course duration and requirements
    {
      id: "course-details",
      type: "text",
      content:
        "A {{courseDuration}} program consisting of {{courseHours}} hours of instruction, covering {{courseTopics}}. This comprehensive training has equipped the participant with essential knowledge and practical skills for effective ministry service.",
      position: { x: 120, y: 520, width: 960, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.primary,
        fontWeight: "400",
        color: JICF_COLORS.black,
        textAlign: "center",
        lineHeight: 1.5,
      },
    },
    // Achievement level/grade
    {
      id: "achievement-level",
      type: "text",
      content: "Grade Achieved: {{gradeAchieved}}",
      position: { x: 150, y: 620, width: 300, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "bold",
        color: JICF_COLORS.secondary,
        textAlign: "left",
      },
    },
    // Completion date
    {
      id: "completion-date",
      type: "text",
      content: "Completed on: {{completionDate}}",
      position: { x: 750, y: 620, width: 300, height: 30 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "bold",
        color: JICF_COLORS.secondary,
        textAlign: "right",
      },
    },
    // Instructor signature
    {
      id: "instructor-signature",
      type: "text",
      content: "{{instructorName}}",
      position: { x: 150, y: 680, width: 280, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderTop: `2px solid ${JICF_COLORS.black}`,
        paddingTop: "5px",
      },
    },
    // Instructor title
    {
      id: "instructor-title",
      type: "text",
      content: "{{instructorTitle}}",
      position: { x: 150, y: 710, width: 280, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Director signature
    {
      id: "director-signature",
      type: "text",
      content: "{{directorName}}",
      position: { x: 770, y: 680, width: 280, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: JICF_FONTS.script,
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
        borderTop: `2px solid ${JICF_COLORS.black}`,
        paddingTop: "5px",
      },
    },
    // Director title
    {
      id: "director-title",
      type: "text",
      content: "{{directorTitle}}",
      position: { x: 770, y: 710, width: 280, height: 20 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
      },
    },
    // Certificate ID
    {
      id: "certificate-id",
      type: "text",
      content: "Certificate ID: {{certificateId}}",
      position: { x: 150, y: 750, width: 400, height: 25 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "left",
      },
    },
    // Verification QR
    {
      id: "verification-qr",
      type: "qr",
      content: "{{qrCode}}",
      position: { x: 1070, y: 680, width: 60, height: 60 },
      style: {
        backgroundColor: JICF_COLORS.white,
        padding: "5px",
        borderRadius: 4,
      },
    },
    // Accreditation note
    {
      id: "accreditation-note",
      type: "text",
      content: "Accredited by JICF Training Institute",
      position: { x: 750, y: 750, width: 300, height: 25 },
      style: {
        fontSize: 12,
        fontFamily: JICF_FONTS.secondary,
        fontWeight: "400",
        color: JICF_COLORS.darkGray,
        textAlign: "right",
        fontStyle: "italic",
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
    participantName: {
      type: "text",
      label: "Participant Name",
      required: true,
      placeholder: "Mary Johnson",
    },
    courseName: {
      type: "text",
      label: "Course/Program Name",
      required: true,
      placeholder: "Biblical Leadership Training Program",
    },
    courseDuration: {
      type: "select",
      label: "Course Duration",
      required: true,
      options: ["1-week", "2-week", "1-month", "3-month", "6-month", "1-year"],
    },
    courseHours: {
      type: "number",
      label: "Total Course Hours",
      required: true,
      placeholder: "40",
    },
    courseTopics: {
      type: "textarea",
      label: "Course Topics Covered",
      required: true,
      placeholder:
        "Biblical studies, leadership principles, ministry practices, and evangelism techniques",
    },
    gradeAchieved: {
      type: "select",
      label: "Grade Achieved",
      required: true,
      options: [
        "A+",
        "A",
        "A-",
        "B+",
        "B",
        "B-",
        "C+",
        "C",
        "Pass",
        "Distinction",
        "High Distinction",
      ],
    },
    completionDate: {
      type: "date",
      label: "Completion Date",
      required: true,
    },
    instructorName: {
      type: "text",
      label: "Instructor Name",
      required: true,
      placeholder: "Dr. James Wilson",
    },
    instructorTitle: {
      type: "text",
      label: "Instructor Title",
      required: true,
      placeholder: "Lead Instructor",
    },
    directorName: {
      type: "text",
      label: "Training Director Name",
      required: true,
      placeholder: "Rev. Dr. Patricia Brown",
    },
    directorTitle: {
      type: "text",
      label: "Director Title",
      required: true,
      placeholder: "Training Director",
    },
    certificateId: {
      type: "text",
      label: "Certificate ID",
      required: false,
      placeholder: "JICF-TRN-2024-001",
    },
    qrCode: {
      type: "qr",
      label: "Verification QR Code",
      required: false,
    },
  },
};
