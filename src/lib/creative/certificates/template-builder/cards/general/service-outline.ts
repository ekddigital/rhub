/**
 * Service Outline Template (General)
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS } from "../../card-templates";

export const serviceOutlineTemplate: CardTemplate = {
  id: "service-outline",
  name: "Church Service Outline",
  description:
    "Professional service outline card for church services with dynamic content",
  category: "blessing",
  settings: {
    width: 595,
    height: 750,
    backgroundColor: JICF_COLORS.white,
  },
  elements: [
    // Background gradient
    {
      id: "background-gradient",
      type: "decoration",
      content: `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${JICF_COLORS.blue} 0%, ${JICF_COLORS.red} 50%, ${JICF_COLORS.yellow} 100%); opacity: 0.1;"></div>`,
      position: { x: 0, y: 0, width: 595, height: 750 },
      style: {
        zIndex: 1,
      },
    },
    // Church Logo
    {
      id: "church-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 247, y: 20, width: 100, height: 50 },
      style: {
        zIndex: 10,
      },
    },
    // Title
    {
      id: "title",
      type: "text",
      content: "JINAN INTERNATIONAL CHRISTIAN FELLOWSHIP",
      position: { x: 50, y: 80, width: 495, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Event Name
    {
      id: "event-name",
      type: "text",
      content: "{{eventName}}",
      position: { x: 50, y: 120, width: 495, height: 40 },
      style: {
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Event Date
    {
      id: "event-date",
      type: "text",
      content: "{{eventDate}}",
      position: { x: 50, y: 170, width: 495, height: 25 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // MC Name
    {
      id: "mc-name",
      type: "text",
      content: "Master of Ceremony: {{mcName}}",
      position: { x: 50, y: 205, width: 495, height: 25 },
      style: {
        fontSize: 16,
        fontFamily: "Arial, sans-serif",
        color: JICF_COLORS.blue,
        textAlign: "center",
        fontWeight: "bold",
        zIndex: 10,
      },
    },
    // Service Outline Content
    {
      id: "service-outline",
      type: "text",
      content: "{{serviceOutline}}",
      position: { x: 50, y: 250, width: 495, height: 450 },
      style: {
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        color: JICF_COLORS.darkGray,
        lineHeight: 1.6,
        zIndex: 10,
      },
    },
    // Footer
    {
      id: "footer",
      type: "text",
      content: "Welcome to our service! May God bless you abundantly. 🙏",
      position: { x: 50, y: 720, width: 495, height: 20 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
  ],
};
