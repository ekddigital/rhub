/**
 * JICF Graduation Blessing Card Template
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS, FLORAL_DECORATIONS } from "../../card-templates";

export const graduationBlessingTemplate: CardTemplate = {
  id: "graduation-blessing",
  name: "Graduation Blessing Card",
  description: "Beautiful graduation blessing with floral design",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightBlue,
  },
  elements: [
    // Background decoration
    {
      id: "bg-decoration-1",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 0, y: 0, width: 100, height: 100 },
      style: {
        opacity: 0.3,
        zIndex: 1,
      },
    },
    // JICF Logo
    {
      id: "jicf-logo",
      type: "image",
      content: "/JICF_LOGO1.png",
      position: { x: 200, y: 30, width: 100, height: 50 },
      style: {
        zIndex: 10,
      },
    },
    // Title
    {
      id: "title",
      type: "text",
      content: "GRADUATION BLESSING",
      position: { x: 50, y: 100, width: 400, height: 40 },
      style: {
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Recipient Name
    {
      id: "recipient-name",
      type: "text",
      content: "{{recipientName}}",
      position: { x: 50, y: 180, width: 400, height: 30 },
      style: {
        fontSize: 24,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Blessing Text
    {
      id: "blessing-text",
      type: "text",
      content: `May the Lord guide your every step as you enter this exciting new season.

May your gifts make room for you, your heart remain tender toward truth, and your mind stay curious and bold.

Wherever you go, may you carry Christ's love, peace, and wisdom.

This graduation is not your finish line—it is your launching point. Go forward in faith.

We are proud of you. We are praying for you.

Congratulations, Graduate!`,
      position: { x: 60, y: 250, width: 380, height: 350 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.6,
        zIndex: 10,
      },
    },
    // Signature
    {
      id: "signature",
      type: "text",
      content: "JINAN INTERNATIONAL CHRISTIAN FELLOWSHIP",
      position: { x: 50, y: 620, width: 400, height: 30 },
      style: {
        fontSize: 14,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Bottom decoration
    {
      id: "bg-decoration-2",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 400, y: 600, width: 100, height: 100 },
      style: {
        opacity: 0.3,
        transform: "rotate(180deg)",
        zIndex: 1,
      },
    },
  ],
};
