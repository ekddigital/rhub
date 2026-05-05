/**
 * General Certificate Templates
 */

import { CertificateTemplate } from "../types";

export const courseCompletionTemplate: CertificateTemplate = {
  id: "course-completion",
  name: "Course Completion Certificate",
  description: "Standard template for course completion certificates",
  organization: "general",
  category: "completion",
  pageSettings: {
    width: 800,
    height: 600,
    orientation: "landscape",
    backgroundColor: "#ffffff",
  },
  elements: [
    {
      id: "title",
      type: "text",
      content: "Certificate of Completion",
      position: { x: 50, y: 80, width: 700, height: 40 },
      style: {
        fontSize: 36,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "#2c3e50",
        textAlign: "center",
      },
    },
    {
      id: "subtitle",
      type: "text",
      content: "This is to certify that",
      position: { x: 50, y: 140, width: 700, height: 20 },
      style: {
        fontSize: 18,
        fontFamily: "serif",
        color: "#7f8c8d",
        textAlign: "center",
      },
    },
    {
      id: "recipient-name",
      type: "text",
      content: "{recipientName}",
      position: { x: 50, y: 200, width: 700, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "#27ae60",
        textAlign: "center",
      },
    },
    {
      id: "body-text",
      type: "text",
      content:
        "has successfully completed the requirements for {courseName} and has demonstrated proficiency in the subject matter.",
      position: { x: 50, y: 280, width: 700, height: 60 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: "#34495e",
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 700,
      },
    },
    {
      id: "signature",
      type: "text",
      content: "Authorized Signature",
      position: { x: 150, y: 450, width: 150, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: "#7f8c8d",
        textAlign: "center",
      },
    },
    {
      id: "date",
      type: "text",
      content: "{issueDate}",
      position: { x: 500, y: 450, width: 150, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: "#7f8c8d",
        textAlign: "center",
      },
    },
  ],
};

export const participationTemplate: CertificateTemplate = {
  id: "participation",
  name: "Participation Certificate",
  description: "Template for participation in events or programs",
  organization: "general",
  category: "participation",
  pageSettings: {
    width: 800,
    height: 600,
    orientation: "landscape",
    backgroundColor: "#ffffff",
  },
  elements: [
    {
      id: "title",
      type: "text",
      content: "Certificate of Participation",
      position: { x: 50, y: 80, width: 700, height: 40 },
      style: {
        fontSize: 34,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "#3498db",
        textAlign: "center",
      },
    },
    {
      id: "subtitle",
      type: "text",
      content: "This certifies that",
      position: { x: 50, y: 140, width: 700, height: 20 },
      style: {
        fontSize: 18,
        fontFamily: "serif",
        color: "#95a5a6",
        textAlign: "center",
      },
    },
    {
      id: "recipient-name",
      type: "text",
      content: "{recipientName}",
      position: { x: 50, y: 200, width: 700, height: 40 },
      style: {
        fontSize: 30,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "#2c3e50",
        textAlign: "center",
      },
    },
    {
      id: "body-text",
      type: "text",
      content:
        "has actively participated in {eventName} and contributed meaningfully to its success.",
      position: { x: 50, y: 280, width: 700, height: 60 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: "#34495e",
        textAlign: "center",
        lineHeight: 1.5,
        maxWidth: 700,
      },
    },
    {
      id: "signature",
      type: "text",
      content: "Event Coordinator",
      position: { x: 150, y: 450, width: 150, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: "#7f8c8d",
        textAlign: "center",
      },
    },
    {
      id: "date",
      type: "text",
      content: "{issueDate}",
      position: { x: 500, y: 450, width: 150, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "serif",
        color: "#7f8c8d",
        textAlign: "center",
      },
    },
  ],
};
