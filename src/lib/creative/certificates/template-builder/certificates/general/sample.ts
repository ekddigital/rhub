/**
 * General Certificate Templates
 * Organization-agnostic certificate designs
 */

import { CertificateTemplate } from "../types";

// Placeholder template - to be implemented
export const generalSampleCert: CertificateTemplate = {
  id: "general-sample-cert",
  name: "General Certificate Template",
  description: "General purpose certificate template",
  organization: "general",
  category: "appreciation",
  elements: [
    {
      id: "placeholder-title",
      type: "text",
      content: "General Certificate Template",
      position: { x: 50, y: 100, width: 700, height: 50 },
      style: {
        fontSize: 24,
        fontFamily: "serif",
        fontWeight: "bold",
        color: "#000000",
        textAlign: "center",
      },
    },
    {
      id: "placeholder-content",
      type: "text",
      content:
        "This is a placeholder template for general certificates. Replace with actual certificate design.",
      position: { x: 100, y: 200, width: 600, height: 100 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: "#000000",
        textAlign: "center",
      },
    },
  ],
  pageSettings: {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: "#ffffff",
    },
  },
  fonts: [
    {
      family: "serif",
      variants: ["normal", "bold", "italic"],
    },
  ],
};
