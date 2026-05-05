/**
 * Certificate Design System for Fishers of Men
 * Separates visual designs from certificate content types
 * Allows flexible mixing and matching of designs with any certificate type
 */

import type { TemplateData, TemplateElement } from "./certificate"; // Use 'import type'
export type { TemplateData, TemplateElement }; // Re-export TemplateData and TemplateElement
import { FOM_COLORS } from "./certificate-templates";

// Certificate Types (Content/Purpose)
export interface CertificateType {
  id: string;
  name: string;
  description: string;
  category: string;
  idPrefix: string; // For unique ID generation (APP, EXC, VOL, etc.)
  defaultContent: {
    title: string;
    subtitle?: string;
    bodyText: string;
    covenantVerse?: string;
    additionalText?: string;
  };
  customFields?: Array<{
    id: string;
    label: string;
    type: "text" | "textarea" | "date" | "select";
    required: boolean;
    options?: string[];
  }>;
}

// Visual Design Templates (UI/Layout)
export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  difficulty: "simple" | "standard" | "elegant" | "ornate";
  style: "modern" | "classic" | "traditional" | "artistic";
  layoutData: TemplateData;
}

// Certificate Types (Content Definitions)
export const CERTIFICATE_TYPES: CertificateType[] = [
  {
    id: "appreciation",
    name: "Certificate of Appreciation",
    description: "Recognition for dedicated service and contribution",
    category: "Recognition",
    idPrefix: "APP",
    defaultContent: {
      title: "Certificate of Appreciation",
      bodyText:
        "This certificate is proudly presented to {{recipientName}} in recognition of their outstanding dedication, exceptional service, and valuable contributions to our mission. Your commitment and hard work have made a meaningful impact on our community and the lives of those we serve.",
      covenantVerse:
        '"Do not be afraid, for those who are with us are more than those who are with them" - 2 Kings 6:16',
    },
  },
  {
    id: "achievement",
    name: "Certificate of Achievement",
    description: "Recognition for exceptional accomplishments and milestones",
    category: "Achievement",
    idPrefix: "ACH",
    defaultContent: {
      title: "Certificate of Achievement",
      bodyText:
        "This certificate is awarded to {{recipientName}} in recognition of their exceptional achievement and outstanding performance. Through dedication, perseverance, and excellence, they have reached significant milestones and demonstrated remarkable growth in their journey.",
      covenantVerse:
        '"I can do all things through Christ who strengthens me" - Philippians 4:13',
    },
  },
  {
    id: "volunteer",
    name: "Volunteer Service Certificate",
    description: "Recognition for volunteer service and community contribution",
    category: "Service",
    idPrefix: "VOL",
    defaultContent: {
      title: "Volunteer Service Certificate",
      bodyText:
        "This certificate is presented to {{recipientName}} in grateful recognition of their selfless volunteer service and dedication to our community. Their generous contribution of time, energy, and heart has made a lasting positive impact on the lives of others.",
      covenantVerse:
        '"Each of you should use whatever gift you have to serve others" - 1 Peter 4:10',
    },
  },
  {
    id: "excellence",
    name: "Certificate of Excellence",
    description: "Recognition for exceptional performance and leadership",
    category: "Excellence",
    idPrefix: "EXC",
    defaultContent: {
      title: "Certificate of Excellence",
      bodyText:
        "This certificate is awarded to {{recipientName}} for demonstrating exceptional excellence, outstanding leadership, and unwavering commitment to our shared values and mission. Their exemplary performance serves as an inspiration to others.",
      covenantVerse:
        '"Whatever you do, work at it with all your heart, as working for the Lord" - Colossians 3:23',
    },
  },
  {
    id: "completion",
    name: "Certificate of Completion",
    description: "Recognition for successful completion of programs or courses",
    category: "Education",
    idPrefix: "COM",
    defaultContent: {
      title: "Certificate of Completion",
      bodyText:
        "This certificate is awarded to {{recipientName}} for successfully completing the prescribed course of study and meeting all requirements. Their dedication to learning and growth demonstrates a commitment to personal and spiritual development.",
      covenantVerse:
        '"Study to show yourself approved unto God" - 2 Timothy 2:15',
    },
  },
  {
    id: "baptism",
    name: "Certificate of Baptism",
    description: "Sacred certificate commemorating baptism",
    category: "Sacrament",
    idPrefix: "BAP",
    defaultContent: {
      title: "Certificate of Baptism",
      bodyText:
        "This certificate commemorates the sacred baptism of {{recipientName}}, who has publicly declared their faith and commitment to following Jesus Christ. May this serve as a lasting reminder of this blessed occasion and the beginning of their journey in faith.",
      covenantVerse:
        '"Therefore, if anyone is in Christ, the new creation has come" - 2 Corinthians 5:17',
    },
    customFields: [
      {
        id: "baptismDate",
        label: "Date of Baptism",
        type: "date",
        required: true,
      },
      { id: "baptizedBy", label: "Baptized By", type: "text", required: true },
      {
        id: "witnessedBy",
        label: "Witnessed By",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "membership",
    name: "Certificate of Membership",
    description: "Official certificate of church or organization membership",
    category: "Membership",
    idPrefix: "MEM",
    defaultContent: {
      title: "Certificate of Membership",
      bodyText:
        "This certificate confirms that {{recipientName}} is a valued member of our community of faith. We welcome them into our fellowship and look forward to growing together in faith, service, and love.",
      covenantVerse:
        '"For where two or three gather in my name, there am I with them" - Matthew 18:20',
    },
    customFields: [
      {
        id: "membershipDate",
        label: "Membership Date",
        type: "date",
        required: true,
      },
      {
        id: "membershipType",
        label: "Membership Type",
        type: "select",
        required: true,
        options: ["Full Member", "Associate Member", "Youth Member"],
      },
    ],
  },
  {
    id: "ordination",
    name: "Certificate of Ordination",
    description: "Sacred certificate for ordination ceremonies",
    category: "Ordination",
    idPrefix: "ORD",
    defaultContent: {
      title: "Certificate of Ordination",
      bodyText:
        "This certificate confirms the ordination of {{recipientName}} to the ministry, having been called by God and affirmed by this community of faith. May they serve with wisdom, compassion, and faithfulness in their sacred calling.",
      covenantVerse:
        '"How beautiful are the feet of those who bring good news" - Romans 10:15',
    },
    customFields: [
      {
        id: "ordinationDate",
        label: "Date of Ordination",
        type: "date",
        required: true,
      },
      {
        id: "ordinationType",
        label: "Type of Ordination",
        type: "select",
        required: true,
        options: ["Deacon", "Elder", "Minister", "Pastor", "Missionary"],
      },
      {
        id: "ordinationCouncil",
        label: "Ordaining Council",
        type: "text",
        required: true,
      },
    ],
  },
];

// Visual Design Templates (UI Layouts)
export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: "classic-elegant",
    name: "Classic Elegant",
    description:
      "Traditional design with ornate borders and elegant typography",
    difficulty: "elegant",
    style: "classic",
    layoutData: {
      name: "Classic Elegant Design",
      description: "Traditional design with ornate borders",
      pageSettings: {
        width: 800,
        height: 600,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        background: { color: "#ffffff" },
      },
      fonts: [
        { family: "serif", variants: ["normal", "bold", "italic"] },
        { family: "sans-serif", variants: ["normal", "bold"] },
      ],
      elements: [
        // Outer decorative border
        {
          id: "outer-border",
          type: "shape",
          content: "",
          position: { x: 20, y: 20, width: 760, height: 560 },
          style: {
            color: FOM_COLORS.primary,
            borderWidth: "3px",
            borderRadius: "12px",
            borderStyle: "solid",
          },
        },
        // Inner frame
        {
          id: "inner-frame",
          type: "shape",
          content: "",
          position: { x: 40, y: 40, width: 720, height: 520 },
          style: {
            color: FOM_COLORS.gold,
            borderWidth: "1px",
            borderRadius: "8px",
            borderStyle: "solid",
          },
        },
        // Logo placeholder
        {
          id: "logo",
          type: "image",
          content: "/Logo.png",
          position: { x: 60, y: 60, width: 80, height: 80 },
          style: {},
        },
        // Organization name
        {
          id: "org-name",
          type: "text",
          content: "FISHERS OF MEN",
          position: { x: 160, y: 80, width: 500, height: 40 },
          style: {
            fontSize: 24,
            fontFamily: "serif",
            fontWeight: "bold",
            color: FOM_COLORS.primaryDeep,
            textAlign: "center",
            letterSpacing: "2px",
          },
        },
        // Certificate title (dynamic)
        {
          id: "certificate-title",
          type: "text",
          content: "{{certificateTitle}}",
          position: { x: 80, y: 160, width: 640, height: 50 },
          style: {
            fontSize: 32,
            fontFamily: "serif",
            fontWeight: "bold",
            color: FOM_COLORS.primary,
            textAlign: "center",
            letterSpacing: "1px",
          },
        },
        // Decorative separator
        {
          id: "separator",
          type: "shape",
          content: "",
          position: { x: 280, y: 220, width: 240, height: 3 },
          style: {
            color: FOM_COLORS.gold,
            borderRadius: "2px",
          },
        },
        // Main content text (dynamic)
        {
          id: "main-content",
          type: "text",
          content: "{{bodyText}}",
          position: { x: 80, y: 260, width: 640, height: 120 },
          style: {
            fontSize: 16,
            fontFamily: "serif",
            color: FOM_COLORS.darkGray,
            textAlign: "center",
            lineHeight: "1.6",
          },
        },
        // Covenant verse (dynamic)
        {
          id: "covenant-verse",
          type: "text",
          content: "{{covenantVerse}}",
          position: { x: 80, y: 400, width: 640, height: 30 },
          style: {
            fontSize: 14,
            fontFamily: "serif",
            fontStyle: "italic", // Corrected: was fontWeight
            color: FOM_COLORS.primaryDeep,
            textAlign: "center",
          },
        },
        // Certificate ID
        {
          id: "certificate-id",
          type: "text",
          content: "Certificate ID: {{certificateId}}",
          position: { x: 80, y: 450, width: 200, height: 20 },
          style: {
            fontSize: 10,
            fontFamily: "sans-serif",
            color: FOM_COLORS.mediumGray,
            textAlign: "left",
          },
        },
        // Issue date with consistent format
        {
          id: "issue-date",
          type: "text",
          content: "Date: {{issueDate}}",
          position: { x: 520, y: 450, width: 200, height: 20 },
          style: {
            fontSize: 10,
            fontFamily: "sans-serif",
            color: FOM_COLORS.mediumGray,
            textAlign: "right",
          },
        },
        // Signature line
        {
          id: "signature-line",
          type: "shape",
          content: "",
          position: { x: 500, y: 500, width: 150, height: 1 },
          style: {
            color: FOM_COLORS.darkGray,
          },
        },
        // Signature label with consistent format
        {
          id: "signature-label",
          type: "text",
          content: "Authorized by: {{issuerName}}",
          position: { x: 500, y: 510, width: 150, height: 40 },
          style: {
            fontSize: 10,
            fontFamily: "sans-serif",
            color: FOM_COLORS.darkGray,
            textAlign: "center",
          },
        },
      ],
    },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description:
      "Clean, modern design with minimal elements and bold typography",
    difficulty: "simple",
    style: "modern",
    layoutData: {
      name: "Modern Minimal Design",
      description: "Clean, modern design with minimal elements",
      pageSettings: {
        width: 800,
        height: 600,
        margin: { top: 30, right: 30, bottom: 30, left: 30 },
        background: { color: "#ffffff" },
      },
      fonts: [
        { family: "sans-serif", variants: ["normal", "bold", "light"] },
        { family: "monospace", variants: ["normal"] },
      ],
      elements: [
        // Simple border
        {
          id: "main-border",
          type: "shape",
          content: "",
          position: { x: 30, y: 30, width: 740, height: 540 },
          style: {
            color: FOM_COLORS.primary,
            borderWidth: "2px",
            borderRadius: "4px",
            borderStyle: "solid",
          },
        },
        // Logo
        {
          id: "logo",
          type: "image",
          content: "/Logo.png",
          position: { x: 70, y: 70, width: 60, height: 60 },
          style: {},
        },
        // Organization name
        {
          id: "org-name",
          type: "text",
          content: "FISHERS OF MEN",
          position: { x: 150, y: 85, width: 500, height: 30 },
          style: {
            fontSize: 18,
            fontFamily: "sans-serif",
            fontWeight: "600",
            color: FOM_COLORS.primary,
            textAlign: "left",
            letterSpacing: "1px",
          },
        },
        // Certificate title (dynamic)
        {
          id: "certificate-title",
          type: "text",
          content: "{{certificateTitle}}",
          position: { x: 70, y: 160, width: 660, height: 60 },
          style: {
            fontSize: 36,
            fontFamily: "sans-serif",
            fontWeight: "300",
            color: FOM_COLORS.primaryDeep,
            textAlign: "center",
          },
        },
        // Main content (dynamic)
        {
          id: "main-content",
          type: "text",
          content: "{{bodyText}}",
          position: { x: 100, y: 250, width: 600, height: 150 },
          style: {
            fontSize: 16,
            fontFamily: "sans-serif",
            color: FOM_COLORS.darkGray,
            textAlign: "center",
            lineHeight: "1.8",
          },
        },
        // Covenant verse (dynamic)
        {
          id: "covenant-verse",
          type: "text",
          content: "{{covenantVerse}}",
          position: { x: 100, y: 420, width: 600, height: 25 },
          style: {
            fontSize: 14,
            fontFamily: "sans-serif",
            fontWeight: "300",
            fontStyle: "italic",
            color: FOM_COLORS.accent,
            textAlign: "center",
          },
        },
        // Certificate ID
        {
          id: "certificate-id",
          type: "text",
          content: "{{certificateId}}",
          position: { x: 70, y: 480, width: 200, height: 20 },
          style: {
            fontSize: 9,
            fontFamily: "monospace",
            color: FOM_COLORS.lightGray,
            textAlign: "left",
          },
        },
        // Issue date with consistent format
        {
          id: "issue-date",
          type: "text",
          content: "Date: {{issueDate}}",
          position: { x: 530, y: 480, width: 200, height: 20 },
          style: {
            fontSize: 9,
            fontFamily: "monospace",
            color: FOM_COLORS.lightGray,
            textAlign: "right",
          },
        },
        // Signature with consistent format
        {
          id: "signature-label",
          type: "text",
          content: "Authorized by: {{issuerName}}",
          position: { x: 500, y: 520, width: 200, height: 20 },
          style: {
            fontSize: 12,
            fontFamily: "sans-serif",
            color: FOM_COLORS.darkGray,
            textAlign: "center",
          },
        },
      ],
    },
  },
  {
    id: "ornate-traditional",
    name: "Ornate Traditional",
    description:
      "Rich traditional design with decorative elements and classic styling",
    difficulty: "ornate",
    style: "traditional",
    layoutData: {
      name: "Ornate Traditional Design",
      description: "Rich traditional design with decorative elements",
      pageSettings: {
        width: 800,
        height: 600,
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
        background: { color: "#fefefe" },
      },
      fonts: [
        { family: "serif", variants: ["normal", "bold", "italic"] },
        { family: "sans-serif", variants: ["normal", "bold"] },
      ],
      elements: [
        // Multiple decorative borders
        {
          id: "outer-border",
          type: "shape",
          content: "",
          position: { x: 15, y: 15, width: 770, height: 570 },
          style: {
            color: FOM_COLORS.primaryDeep,
            borderWidth: "4px",
            borderRadius: "15px",
            borderStyle: "double",
          },
        },
        {
          id: "middle-border",
          type: "shape",
          content: "",
          position: { x: 30, y: 30, width: 740, height: 540 },
          style: {
            color: FOM_COLORS.gold,
            borderWidth: "2px",
            borderRadius: "10px",
            borderStyle: "solid",
          },
        },
        {
          id: "inner-border",
          type: "shape",
          content: "",
          position: { x: 45, y: 45, width: 710, height: 510 },
          style: {
            color: FOM_COLORS.primary,
            borderWidth: "1px",
            borderRadius: "8px",
            borderStyle: "solid",
          },
        },
        // Corner decorations
        {
          id: "corner-decoration-tl",
          type: "shape",
          content: "",
          position: { x: 60, y: 60, width: 40, height: 40 },
          style: {
            color: FOM_COLORS.gold,
            borderRadius: "50%",
            opacity: 0.3,
          },
        },
        {
          id: "corner-decoration-tr",
          type: "shape",
          content: "",
          position: { x: 700, y: 60, width: 40, height: 40 },
          style: {
            color: FOM_COLORS.gold,
            borderRadius: "50%",
            opacity: 0.3,
          },
        },
        // Logo with enhanced positioning
        {
          id: "logo",
          type: "image",
          content: "/Logo.png",
          position: { x: 360, y: 70, width: 80, height: 80 },
          style: {},
        },
        // Organization name with elegant styling
        {
          id: "org-name",
          type: "text",
          content: "FISHERS OF MEN",
          position: { x: 100, y: 160, width: 600, height: 35 },
          style: {
            fontSize: 28,
            fontFamily: "serif",
            fontWeight: "bold",
            color: FOM_COLORS.primaryDeep,
            textAlign: "center",
            letterSpacing: "3px",
          },
        },
        // Certificate title with ornate styling
        {
          id: "certificate-title",
          type: "text",
          content: "{{certificateTitle}}",
          position: { x: 80, y: 210, width: 640, height: 50 },
          style: {
            fontSize: 34,
            fontFamily: "serif",
            fontWeight: "bold",
            color: FOM_COLORS.primary,
            textAlign: "center",
            letterSpacing: "1px",
          },
        },
        // Decorative separators
        {
          id: "separator-top",
          type: "shape",
          content: "",
          position: { x: 200, y: 270, width: 400, height: 2 },
          style: {
            color: FOM_COLORS.gold,
            borderRadius: "1px",
          },
        },
        // Main content with elegant spacing
        {
          id: "main-content",
          type: "text",
          content: "{{bodyText}}",
          position: { x: 80, y: 290, width: 640, height: 110 },
          style: {
            fontSize: 16,
            fontFamily: "serif",
            color: FOM_COLORS.darkGray,
            textAlign: "center",
            lineHeight: "1.7",
          },
        },
        // Decorative separator bottom
        {
          id: "separator-bottom",
          type: "shape",
          content: "",
          position: { x: 200, y: 410, width: 400, height: 2 },
          style: {
            color: FOM_COLORS.gold,
            borderRadius: "1px",
          },
        },
        // Covenant verse with special styling
        {
          id: "covenant-verse",
          type: "text",
          content: "{{covenantVerse}}",
          position: { x: 80, y: 430, width: 640, height: 30 },
          style: {
            fontSize: 14,
            fontFamily: "serif",
            fontWeight: "italic",
            color: FOM_COLORS.primaryDeep,
            textAlign: "center",
          },
        },
        // Certificate ID with traditional styling
        {
          id: "certificate-id",
          type: "text",
          content: "Certificate No: {{certificateId}}",
          position: { x: 80, y: 480, width: 250, height: 20 },
          style: {
            fontSize: 10,
            fontFamily: "serif",
            color: FOM_COLORS.mediumGray,
            textAlign: "left",
          },
        },
        // Issue date with consistent format
        {
          id: "issue-date",
          type: "text",
          content: "Date: {{issueDate}}",
          position: { x: 470, y: 480, width: 250, height: 20 },
          style: {
            fontSize: 10,
            fontFamily: "serif",
            color: FOM_COLORS.mediumGray,
            textAlign: "right",
          },
        },
        // Ornate signature area
        {
          id: "signature-line",
          type: "shape",
          content: "",
          position: { x: 500, y: 520, width: 180, height: 1 },
          style: {
            color: FOM_COLORS.darkGray,
          },
        },
        {
          id: "signature-label",
          type: "text",
          content: "Authorized by: {{issuerName}}",
          position: { x: 500, y: 525, width: 180, height: 25 },
          style: {
            fontSize: 10,
            fontFamily: "serif",
            color: FOM_COLORS.darkGray,
            textAlign: "center",
          },
        },
      ],
    },
  },
];

// Utility functions for the design system
export function getCertificateTypeById(
  typeId: string
): CertificateType | undefined {
  return CERTIFICATE_TYPES.find((type) => type.id === typeId);
}

export function getDesignTemplateById(
  designId: string
): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find((design) => design.id === designId);
}

export function createCertificateFromDesignAndType(
  designTemplateId: string,
  certificateTypeId: string,
  data: {
    recipientName: string;
    issuerName: string;
    certificateId?: string;
    issueDate?: string;
    customFields?: Record<string, unknown>; // Allow unknown for flexibility from form
  }
): TemplateData | null {
  const designTemplate = getDesignTemplateById(designTemplateId);
  const certificateType = getCertificateTypeById(certificateTypeId);

  if (!designTemplate || !certificateType) {
    console.error("Invalid design template or certificate type ID");
    return null;
  }

  // Start with a deep copy of the design template's layoutData
  const finalLayout: TemplateData = JSON.parse(
    JSON.stringify(designTemplate.layoutData)
  );

  // Replace placeholders in elements
  finalLayout.elements = finalLayout.elements.map(
    (element: TemplateElement) => {
      let newContent = element.content;

      // Replace standard placeholders
      if (typeof newContent === "string") {
        newContent = newContent.replace(
          /\{\{recipientName\}\}/g,
          data.recipientName || ""
        );
        newContent = newContent.replace(
          /\{\{issuerName\}\}/g,
          data.issuerName || "System"
        );
        newContent = newContent.replace(
          /\{\{certificateTitle\}\}/g,
          certificateType.defaultContent.title || "Certificate"
        );
        newContent = newContent.replace(
          /\{\{bodyText\}\}/g,
          certificateType.defaultContent.bodyText || ""
        );
        newContent = newContent.replace(
          /\{\{covenantVerse\}\}/g,
          certificateType.defaultContent.covenantVerse || ""
        );
        newContent = newContent.replace(
          /\{\{certificateId\}\}/g,
          data.certificateId || "{{certificateId}}" // Keep placeholder if ID not provided
        );
        newContent = newContent.replace(
          /\{\{issueDate\}\}/g,
          data.issueDate || new Date().toLocaleDateString()
        );

        // Replace custom field placeholders (e.g., {{custom.baptismDate}})
        if (data.customFields) {
          for (const key in data.customFields) {
            const placeholder = new RegExp(`\\{\\{custom.${key}\\}\\}`, "g");
            newContent = newContent.replace(
              placeholder,
              String(data.customFields[key] || "")
            );
          }
        }
      }

      return { ...element, content: newContent };
    }
  );

  return finalLayout;
}

export function getAvailableDesigns(): DesignTemplate[] {
  return DESIGN_TEMPLATES;
}

export function getAvailableCertificateTypes(): CertificateType[] {
  return CERTIFICATE_TYPES;
}
