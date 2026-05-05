/**
 * JICF Certificate Templates
 * (Placeholder - to be filled with JICF-specific templates)
 */

import { CertificateTemplate } from "../types";
import { JICF_COLORS } from "./constants";

// Placeholder template - to be implemented
export const jicfSampleCert: CertificateTemplate = {
  id: "jicf-sample-cert",
  name: "JICF Sample Certificate",
  description: "Sample certificate for JICF",
  organization: "jicf",
  category: "appreciation",
  elements: [
    {
      id: "placeholder-title",
      type: "text",
      content: "JICF Certificate Template",
      position: { x: 50, y: 100, width: 700, height: 50 },
      style: {
        fontSize: 24,
        fontFamily: "serif",
        fontWeight: "bold",
        color: JICF_COLORS.primary,
        textAlign: "center",
      },
    },
    {
      id: "placeholder-content",
      type: "text",
      content:
        "This is a placeholder template for JICF certificates. Replace with actual certificate design.",
      position: { x: 100, y: 200, width: 600, height: 100 },
      style: {
        fontSize: 16,
        fontFamily: "serif",
        color: JICF_COLORS.black,
        textAlign: "center",
      },
    },
  ],
  pageSettings: {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    background: {
      color: JICF_COLORS.white,
    },
  },
  fonts: [
    {
      family: "serif",
      variants: ["normal", "bold", "italic"],
    },
  ],
};
