/**
 * JICF Elegant Roses Template
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS, FLORAL_DECORATIONS } from "../../card-templates";

export const elegantRosesTemplate: CardTemplate = {
  id: "elegant-roses",
  name: "Elegant Roses Card",
  description: "Sophisticated card with elegant rose design",
  category: "appreciation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightYellow,
  },
  elements: [
    // Background decoration
    {
      id: "bg-decoration-1",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 0, y: 0, width: 150, height: 150 },
      style: {
        opacity: 0.6,
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
      content: "APPRECIATION",
      position: { x: 50, y: 100, width: 400, height: 40 },
      style: {
        fontSize: 30,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
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
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Appreciation Text
    {
      id: "appreciation-text",
      type: "text",
      content: `We extend our heartfelt appreciation for your dedicated service and unwavering commitment to our fellowship.

Your contributions have made a lasting impact on our community, and we are grateful for the way you have shared your gifts and talents with us.

May God continue to bless you abundantly as you serve Him with excellence.`,
      position: { x: 70, y: 250, width: 360, height: 300 },
      style: {
        fontSize: 18,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        lineHeight: 1.6,
        zIndex: 10,
      },
    },
    // Custom Message
    {
      id: "custom-message",
      type: "text",
      content: "{{customMessage}}",
      position: { x: 70, y: 480, width: 360, height: 80 },
      style: {
        fontSize: 16,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        color: JICF_COLORS.purple,
        textAlign: "center",
        lineHeight: 1.5,
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
    // Corner decoration
    {
      id: "bg-decoration-2",
      type: "decoration",
      content: FLORAL_DECORATIONS.roseCorner,
      position: { x: 350, y: 550, width: 150, height: 150 },
      style: {
        opacity: 0.6,
        transform: "rotate(180deg)",
        zIndex: 1,
      },
    },
  ],
};
