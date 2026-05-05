/**
 * JICF Celebration Invitation Template
 */

import { CardTemplate } from "../../card-templates";
import { JICF_COLORS, FLORAL_DECORATIONS } from "../../card-templates";

export const celebrationInvitationTemplate: CardTemplate = {
  id: "celebration-invitation",
  name: "Celebration Invitation",
  description: "Festive invitation card for special celebrations",
  category: "invitation",
  settings: {
    width: 500,
    height: 700,
    backgroundColor: JICF_COLORS.lightBlue,
  },
  elements: [
    // Background border
    {
      id: "bg-border",
      type: "decoration",
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 25, y: 25, width: 450, height: 50 },
      style: {
        opacity: 0.7,
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
      content: "YOU'RE INVITED!",
      position: { x: 50, y: 100, width: 400, height: 40 },
      style: {
        fontSize: 32,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.red,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Event Name
    {
      id: "event-name",
      type: "text",
      content: "{{eventName}}",
      position: { x: 50, y: 170, width: 400, height: 40 },
      style: {
        fontSize: 26,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: JICF_COLORS.blue,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Event Date
    {
      id: "event-date",
      type: "text",
      content: "{{eventDate}}",
      position: { x: 50, y: 230, width: 400, height: 30 },
      style: {
        fontSize: 20,
        fontFamily: "Georgia, serif",
        color: JICF_COLORS.darkGray,
        textAlign: "center",
        zIndex: 10,
      },
    },
    // Invitation Text
    {
      id: "invitation-text",
      type: "text",
      content: `Join us for a special time of fellowship, celebration, and worship as we come together in God's presence.

Your presence would make this occasion even more meaningful and joyous.

Come and be part of this blessed gathering!`,
      position: { x: 70, y: 300, width: 360, height: 200 },
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
      position: { x: 70, y: 520, width: 360, height: 80 },
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
    // Bottom border
    {
      id: "bg-border-bottom",
      type: "decoration",
      content: FLORAL_DECORATIONS.floralBorder,
      position: { x: 25, y: 625, width: 450, height: 50 },
      style: {
        opacity: 0.7,
        transform: "rotate(180deg)",
        zIndex: 1,
      },
    },
  ],
};
