/**
 * JICF Meet Our Graduates Multi-page Template
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS } from "../../card-templates";

export const meetOurGraduatesTemplate: CardTemplate = {
  id: "meet-our-graduates",
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
      id: "dynamic-content",
      type: "text",
      content: "{{meetOurGraduatesContent}}",
      position: { x: 0, y: 0, width: 595, height: 842 },
      style: {
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        color: "#000000",
        zIndex: 10,
      },
    },
  ],
};
