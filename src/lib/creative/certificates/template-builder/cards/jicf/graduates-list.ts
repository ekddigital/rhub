/**
 * JICF Graduates Name List Template
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS } from "../../card-templates";

export const graduatesNameListTemplate: CardTemplate = {
  id: "graduates-name-list",
  name: "JICF Graduates Name List",
  description:
    "Comprehensive graduates list card showing names, countries, universities, and academic majors",
  category: "graduation",
  settings: {
    width: 595,
    height: 750, // Same as service outline for consistency
    backgroundColor: JICF_COLORS.white,
  },
  elements: [
    // Background gradient - same as service outline
    {
      id: "background-gradient",
      type: "decoration",
      content: `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, ${JICF_COLORS.blue} 0%, ${JICF_COLORS.red} 50%, ${JICF_COLORS.yellow} 100%); opacity: 0.1;"></div>`,
      position: { x: 0, y: 0, width: 595, height: 750 },
      style: {
        zIndex: 1,
      },
    },
    // JICF Logo
    {
      id: "jicf-logo",
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
    // Subtitle
    {
      id: "subtitle",
      type: "text",
      content: "GRADUATES NAME LIST",
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
    // Dynamic graduates list content
    {
      id: "graduates-list",
      type: "text",
      content: "{{graduatesList}}",
      position: { x: 50, y: 180, width: 495, height: 520 },
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
      content: "Congratulations to all our graduates! 🎓",
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
