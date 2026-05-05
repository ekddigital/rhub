/**
 * JICF Service and List Card Templates
 */

import { CardTemplate } from "../types";
import { JICF_COLORS } from "./constants";

// Service Outline Template
export const serviceOutline: CardTemplate = {
  id: "jicf-service-outline",
  name: "JICF Graduates Service Outline",
  description:
    "Complete service outline for the JICF Graduates Celebration Service",
  category: "graduation",
  settings: {
    width: 595,
    height: 750,
    backgroundColor: JICF_COLORS.white,
  },
  elements: [
    // Background gradient
    {
      id: "service-background",
      type: "decoration",
      content: `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, ${JICF_COLORS.blue} 0%, ${JICF_COLORS.red} 100%); border-radius: 15px;"></div>`,
      position: { x: 0, y: 0, width: 595, height: 750 },
      style: { zIndex: 1 },
    },

    // Background pattern
    {
      id: "background-pattern",
      type: "decoration",
      content: `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>`,
      position: { x: 0, y: 0, width: 595, height: 750 },
      style: { zIndex: 2 },
    },

    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 247.5, y: 20, width: 100, height: 50 },
      style: {
        zIndex: 4,
        opacity: 0.95,
      },
    },

    // Main Header - Dynamic Event Name or Default
    {
      id: "service-title",
      type: "text",
      content: "{{eventName}}",
      position: { x: 50, y: 80, width: 495, height: 70 },
      style: {
        fontSize: 32,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.yellow,
        textAlign: "center",
        lineHeight: 1.2,
        zIndex: 4,
      },
    },

    // Event Date
    {
      id: "event-date",
      type: "text",
      content: "{{eventDate}}",
      position: { x: 50, y: 160, width: 495, height: 25 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.white,
        textAlign: "center",
        opacity: 0.8,
        zIndex: 4,
      },
    },

    // Decorative separator line
    {
      id: "header-separator",
      type: "decoration",
      content: `<div style="background: linear-gradient(90deg, transparent 0%, ${JICF_COLORS.yellow} 30%, ${JICF_COLORS.white} 50%, ${JICF_COLORS.yellow} 70%, transparent 100%); height: 2px; border-radius: 1px;"></div>`,
      position: { x: 100, y: 195, width: 395, height: 2 },
      style: { zIndex: 3 },
    },

    // Service Items Container
    {
      id: "service-items-container",
      type: "text",
      content: "{{serviceOutlineItems}}",
      position: { x: 40, y: 210, width: 515, height: 410 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontWeight: "500",
        color: JICF_COLORS.white,
        textAlign: "left",
        lineHeight: 1.3,
        zIndex: 4,
      },
    },

    // Footer
    {
      id: "service-footer",
      type: "text",
      content: "Jinan International Christian Fellowship (JICF)",
      position: { x: 50, y: 680, width: 495, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.white,
        textAlign: "center",
        opacity: 0.7,
        zIndex: 4,
      },
    },

    // MC Name at bottom
    {
      id: "mc-name-bottom",
      type: "text",
      content: "MC: {{mcName}}",
      position: { x: 50, y: 650, width: 495, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.white,
        textAlign: "center",
        opacity: 0.9,
        zIndex: 4,
      },
    },
  ],
};

// Graduates Name List Template
export const graduatesNameList: CardTemplate = {
  id: "jicf-graduates-list",
  name: "JICF Graduates Name List",
  description:
    "Comprehensive graduates list card showing names, countries, universities, and academic majors",
  category: "graduation",
  settings: {
    width: 595,
    height: 750,
    backgroundColor: JICF_COLORS.white,
  },
  elements: [
    // Background gradient - same as service outline
    {
      id: "service-background",
      type: "decoration",
      content: `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, ${JICF_COLORS.blue} 0%, ${JICF_COLORS.red} 100%); border-radius: 15px;"></div>`,
      position: { x: 0, y: 0, width: 595, height: 750 },
      style: { zIndex: 1 },
    },

    // Background pattern - same as service outline
    {
      id: "background-pattern",
      type: "decoration",
      content: `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>`,
      position: { x: 0, y: 0, width: 595, height: 750 },
      style: { zIndex: 2 },
    },

    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 247.5, y: 20, width: 100, height: 50 },
      style: {
        zIndex: 4,
        opacity: 0.95,
      },
    },

    // Main Title
    {
      id: "main-title",
      type: "text",
      content: "GRADUATES NAME LIST",
      position: { x: 50, y: 80, width: 495, height: 50 },
      style: {
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.yellow,
        textAlign: "center",
        letterSpacing: "1px",
        zIndex: 4,
      },
    },

    // Event Name
    {
      id: "event-name",
      type: "text",
      content: "{{eventName}}",
      position: { x: 50, y: 140, width: 495, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: "Georgia, serif",
        fontWeight: "600",
        color: JICF_COLORS.white,
        textAlign: "center",
        opacity: 0.95,
        zIndex: 4,
      },
    },

    // Event Date
    {
      id: "event-date",
      type: "text",
      content: "{{eventDate}}",
      position: { x: 50, y: 175, width: 495, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.white,
        textAlign: "center",
        opacity: 0.9,
        zIndex: 4,
      },
    },

    // Decorative separator line
    {
      id: "header-separator",
      type: "decoration",
      content: `<div style="background: linear-gradient(90deg, transparent 0%, ${JICF_COLORS.yellow} 30%, ${JICF_COLORS.white} 50%, ${JICF_COLORS.yellow} 70%, transparent 100%); height: 2px; border-radius: 1px;"></div>`,
      position: { x: 100, y: 210, width: 395, height: 2 },
      style: { zIndex: 3 },
    },

    // Graduates List Content Area
    {
      id: "graduates-list",
      type: "text",
      content: "{{graduatesList}}",
      position: { x: 40, y: 225, width: 515, height: 450 },
      style: {
        fontSize: 12,
        fontFamily: "Arial, sans-serif",
        fontWeight: "400",
        color: JICF_COLORS.white,
        textAlign: "left",
        lineHeight: 1.4,
        opacity: 0.95,
        zIndex: 4,
      },
    },

    // Footer
    {
      id: "service-footer",
      type: "text",
      content: "Jinan International Christian Fellowship (JICF)",
      position: { x: 50, y: 690, width: 495, height: 20 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.white,
        textAlign: "center",
        opacity: 0.7,
        zIndex: 4,
      },
    },
  ],
};

// Meet Our Graduates Template
export const meetOurGraduates: CardTemplate = {
  id: "jicf-meet-graduates",
  name: "Meet Our Graduates",
  description:
    "Comprehensive multi-page A4 document featuring individual graduate profiles with photos, church information, and graduation blessing",
  category: "graduation",
  settings: {
    width: 595, // A4 width in pixels (210mm)
    height: 842, // A4 height in pixels (297mm)
    backgroundColor: JICF_COLORS.white,
  },
  elements: [
    // This template will be dynamically generated based on graduate data
    {
      id: "multi-page-content",
      type: "text",
      content: "{{meetOurGraduatesContent}}",
      position: { x: 0, y: 0, width: 595, height: 842 },
      style: {
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        color: JICF_COLORS.darkGray,
        zIndex: 1,
      },
    },
  ],
};
