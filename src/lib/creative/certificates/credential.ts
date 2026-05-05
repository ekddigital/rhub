/** Credential kinds for templates — vendor-local; rhub Prisma has no CredType enum. */
export type CredType =
  | "DEGREE"
  | "DIPLOMA"
  | "CERTIFICATE"
  | "TRANSCRIPT"
  | "BADGE";

export interface CertificateTemplate {
  id: string;
  name: string;
  type: CredType;
  layout: "portrait" | "landscape";
  pageSize: "A4" | "LETTER" | "CUSTOM";
  institutionId?: string;
  isPublic: boolean;
  styling: TemplateStyling;
  components: TemplateComponent[];
  thumbnail?: string;
}

export interface TemplateStyling {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: {
    title: number;
    heading: number;
    body: number;
    small: number;
  };
  borders?: {
    style: "solid" | "double" | "decorative" | "none";
    width: number;
    color: string;
  };
  background?: {
    type: "solid" | "gradient" | "image" | "watermark";
    value: string;
  };
}

export interface TemplateComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: Record<string, unknown>;
  editable: boolean;
  required: boolean; // Cannot be removed
  styling?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: "left" | "center" | "right";
  };
}

export type ComponentType =
  | "header"
  | "logo"
  | "title"
  | "body"
  | "recipient"
  | "program"
  | "dates"
  | "qrcode"
  | "signature"
  | "seal"
  | "blockchain"
  | "footer"
  | "border"
  | "watermark";

export interface CredentialData {
  id: string;
  code: string;
  type: CredType;
  recipientName: string;
  program: string;
  level: string;
  issueDate: Date;
  academicYear: number;
  blockchainHash?: string;
  institution: {
    name: string;
    code: string;
    logo?: string;
    type: { name: string };
    county: { name: string };
  };
}

// Default template styling for different credential types
export const defaultStyling: Record<CredType, TemplateStyling> = {
  DEGREE: {
    primaryColor: "#0F4C81",
    secondaryColor: "#D4AF37",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    fontFamily: "Times New Roman",
    fontSize: {
      title: 24,
      heading: 18,
      body: 14,
      small: 10,
    },
    borders: {
      style: "double",
      width: 3,
      color: "#D4AF37",
    },
  },
  DIPLOMA: {
    primaryColor: "#0F4C81",
    secondaryColor: "#059669",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    fontFamily: "Times New Roman",
    fontSize: {
      title: 22,
      heading: 16,
      body: 13,
      small: 9,
    },
    borders: {
      style: "solid",
      width: 2,
      color: "#059669",
    },
  },
  CERTIFICATE: {
    primaryColor: "#0F4C81",
    secondaryColor: "#F59E0B",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    fontFamily: "Arial",
    fontSize: {
      title: 20,
      heading: 15,
      body: 12,
      small: 9,
    },
    borders: {
      style: "solid",
      width: 1,
      color: "#F59E0B",
    },
  },
  TRANSCRIPT: {
    primaryColor: "#0F4C81",
    secondaryColor: "#6B7280",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    fontFamily: "Arial",
    fontSize: {
      title: 18,
      heading: 14,
      body: 11,
      small: 9,
    },
    borders: {
      style: "solid",
      width: 1,
      color: "#6B7280",
    },
  },
  BADGE: {
    primaryColor: "#0F4C81",
    secondaryColor: "#D4AF37",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    fontFamily: "Arial",
    fontSize: {
      title: 16,
      heading: 13,
      body: 10,
      small: 8,
    },
    borders: {
      style: "decorative",
      width: 2,
      color: "#D4AF37",
    },
  },
};
