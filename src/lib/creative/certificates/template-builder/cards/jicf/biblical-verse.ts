/**
 * JICF Biblical Verse Card Template
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS, FLORAL_DECORATIONS } from "../../card-templates";

export const biblicalVerseTemplate: CardTemplate = {
  id: "biblical-verse-upside",
  name: "Biblical Verse Card (Upside Down)",
  description:
    "Beautiful card with upside down biblical text and floral design",
  category: "graduation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightRed,
  },
  elements: [
    // Background decoration
    {
      id: "bg-decoration-1",
      type: "decoration",
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 50, y: 50, width: 400, height: 50 },
      style: {
        opacity: 0.4,
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
      content: "GOD'S BLESSING",
      position: { x: 50, y: 120, width: 400, height: 40 },
      style: {
        fontSize: 26,
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
        fontSize: 22,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Biblical Verse (Upside Down)
    {
      id: "biblical-verse-upside",
      type: "text",
      content: `"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."

- Jeremiah 29:11`,
      position: { x: 60, y: 250, width: 380, height: 200 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.darkBlue,
        textAlign: "center",
        lineHeight: 1.5,
        transform: "rotate(180deg)",
        zIndex: 10,
      },
    },
    // Custom Message
    {
      id: "custom-message",
      type: "text",
      content: "{{customMessage}}",
      position: { x: 60, y: 480, width: 380, height: 120 },
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
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 50, y: 600, width: 400, height: 50 },
      style: {
        opacity: 0.4,
        transform: "rotate(180deg)",
        zIndex: 1,
      },
    },
  ],
};
