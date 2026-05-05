/**
 * Certificate Data Processing Utilities
 * Handles data validation, processing, and formatting for certificates
 */

import type {
  CertificateTemplate,
  CertificateElement,
} from "./templates/types";
import {
  CERTIFICATE_ID_PATTERNS,
  generateCertificateId,
} from "./certificate-id-generator";
import { generateCertificateQRCode } from "./qr-code-generator";

type TemplateVariableDefinition = NonNullable<
  CertificateTemplate["variables"]
>[string];
type CertificateVariableValidation = TemplateVariableDefinition["validation"];

type PrimitiveVariableValue = string | number | boolean | Date;

export type CertificateVariableValue =
  | PrimitiveVariableValue
  | PrimitiveVariableValue[]
  | Record<string, PrimitiveVariableValue | null | undefined>
  | null
  | undefined;

export type CertificateVariableMap = Record<string, CertificateVariableValue>;

export type CertificateInputData = CertificateVariableMap & {
  certificateId?: string;
  recipientName?: string;
  recipientEmail?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  verificationUrl?: string;
  qrCodeData?: string;
};

export interface CertificateGenerationOptions {
  generateId?: boolean;
  generateQR?: boolean;
  baseUrl?: string;
}

type CertificateOrganization = keyof typeof CERTIFICATE_ID_PATTERNS;

export interface CertificateData {
  id: string;
  templateId: string;
  recipientName: string;
  recipientEmail?: string;
  issueDate: Date;
  expiryDate?: Date;
  organizationName: string;
  category: string;
  customData: CertificateVariableMap;
  verificationUrl?: string;
  qrCodeData?: string;
}

export interface ProcessedCertificateData extends CertificateData {
  processedElements: ProcessedElement[];
  pageSettings?: CertificateTemplate["pageSettings"];
}

export interface ProcessedElement extends CertificateElement {
  processedContent?: string;
}

/**
 * Process certificate template variables with actual data
 */
export function processCertificateVariables(
  template: CertificateTemplate,
  data: CertificateVariableMap
): CertificateVariableMap {
  const processed: CertificateVariableMap = {};

  const variableEntries = getTemplateVariableEntries(template);
  if (!variableEntries.length) {
    return processed;
  }

  for (const [key, variable] of variableEntries) {
    let value = data[key];

    // Apply default value if no data provided
    if (value === undefined || value === null || value === "") {
      value = variable.defaultValue ?? "";
    }

    // Type-specific processing
    switch (variable.type) {
      case "date":
        if (value instanceof Date) {
          value = formatDate(value);
        } else if (typeof value === "string") {
          const parsed = new Date(value);
          value = isNaN(parsed.getTime()) ? value : formatDate(parsed);
        }
        break;

      case "number":
        if (typeof value === "string" && !isNaN(Number(value))) {
          value = Number(value);
        }
        break;

      case "text":
      case "textarea":
        value = String(value || "");
        break;
    }

    // Apply validation if specified
    if (variable.validation) {
      value = validateAndFormatValue(value, variable.validation);
    }

    processed[key] = value;
  }

  return processed;
}

/**
 * Validate and format value based on validation rules
 */
function validateAndFormatValue(
  value: CertificateVariableValue,
  validation?: CertificateVariableValidation
): CertificateVariableValue {
  if (!validation) {
    return value;
  }

  let processedValue = value;
  if (typeof value === "string") {
    // Apply length constraints
    if (validation.maxLength && value.length > validation.maxLength) {
      processedValue = value.substring(0, validation.maxLength) + "...";
    }

    // Apply pattern validation (basic)
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        console.warn(
          `Value "${value}" does not match pattern ${validation.pattern}`
        );
      }
    }
  }

  return processedValue;
}

/**
 * Process certificate elements with variable substitution
 */
export function processCertificateElements(
  template: CertificateTemplate,
  variables: CertificateVariableMap
): ProcessedElement[] {
  return template.elements.map((element) => {
    const processed: ProcessedElement = {
      ...element,
      processedContent: element.content,
    };

    // Variable substitution in content
    if (typeof element.content === "string") {
      processed.processedContent = substituteVariables(
        element.content,
        variables
      );
    }

    // Special handling for QR codes
    if (element.type === "qr-code" || element.type === "qr") {
      const qrValue = variables.qrCodeData;
      if (typeof qrValue === "string") {
        processed.processedContent = qrValue;
      } else if (qrValue !== undefined && qrValue !== null) {
        processed.processedContent = String(qrValue);
      } else {
        processed.processedContent = element.content;
      }
    }

    return processed;
  });
}

/**
 * Substitute variables in text content using {{variable}} syntax
 */
function substituteVariables(
  content: string,
  variables: CertificateVariableMap
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = variables[variableName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Format date for certificate display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate complete certificate data with all processing
 */
export async function generateCertificateData(
  template: CertificateTemplate,
  inputData: CertificateInputData,
  options: CertificateGenerationOptions = {}
): Promise<ProcessedCertificateData> {
  const { generateId = true, generateQR = true, baseUrl } = options;

  // Generate certificate ID if needed
  const certificateId = resolveCertificateId(
    template,
    inputData.certificateId,
    generateId
  );

  // Generate verification URL and QR code
  let verificationUrl = inputData.verificationUrl;
  let qrCodeData = inputData.qrCodeData;

  if (generateQR && certificateId) {
    verificationUrl = `${
      baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://ekddigital.com"
    }/verify/${certificateId}`;
    qrCodeData = await generateCertificateQRCode(verificationUrl);
  }

  const issueDate = normalizeToDate(inputData.issueDate) ?? new Date();
  const expiryDate = normalizeToDate(inputData.expiryDate);

  // Process variables
  const processedVariables = processCertificateVariables(template, {
    ...inputData,
    certificateId,
    verificationUrl,
    qrCodeData,
    issueDate,
    expiryDate,
  });

  // Process elements
  const processedElements = processCertificateElements(
    template,
    processedVariables
  );

  const recipientNameValue = processedVariables.recipientName;
  const recipientName =
    typeof recipientNameValue === "string"
      ? recipientNameValue
      : inputData.recipientName || "";

  const certificateData: ProcessedCertificateData = {
    id: certificateId,
    templateId: template.id,
    recipientName,
    recipientEmail: inputData.recipientEmail,
    issueDate,
    expiryDate,
    organizationName: template.organization,
    category: template.category,
    customData: processedVariables,
    verificationUrl,
    qrCodeData,
    processedElements,
    pageSettings: template.pageSettings,
  };

  return certificateData;
}

/**
 * Validate certificate input data against template requirements
 */
export function validateCertificateData(
  template: CertificateTemplate,
  inputData: CertificateVariableMap
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const variableEntries = getTemplateVariableEntries(template);
  if (!variableEntries.length) {
    return { isValid: true, errors, warnings };
  }

  // Check required variables
  for (const [key, variable] of variableEntries) {
    if (variable.required) {
      const value = inputData[key];
      if (value === undefined || value === null || value === "") {
        errors.push(`Required field "${variable.label}" is missing`);
      }
    }
  }

  // Check data types and constraints
  for (const [key, variable] of variableEntries) {
    const value = inputData[key];
    if (value !== undefined && value !== null && value !== "") {
      // Type checking
      switch (variable.type) {
        case "number":
          if (
            typeof value !== "number" &&
            !(typeof value === "string" && !Number.isNaN(Number(value)))
          ) {
            errors.push(`Field "${variable.label}" must be a number`);
          }
          break;

        case "date": {
          const parsedDate =
            value instanceof Date
              ? value
              : typeof value === "string"
              ? normalizeToDate(value)
              : undefined;
          if (!parsedDate) {
            errors.push(`Field "${variable.label}" must be a valid date`);
          }
          break;
        }
      }

      // Validation rules
      if (variable.validation) {
        if (typeof value === "string") {
          if (
            variable.validation.minLength &&
            value.length < variable.validation.minLength
          ) {
            errors.push(
              `Field "${variable.label}" must be at least ${variable.validation.minLength} characters`
            );
          }
          if (
            variable.validation.maxLength &&
            value.length > variable.validation.maxLength
          ) {
            warnings.push(
              `Field "${variable.label}" will be truncated to ${variable.validation.maxLength} characters`
            );
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get default data for a certificate template
 */
export function getTemplateDefaultData(
  template: CertificateTemplate
): CertificateVariableMap {
  const defaultData: CertificateVariableMap = {};

  const variableEntries = getTemplateVariableEntries(template);
  for (const [key, variable] of variableEntries) {
    if (variable.defaultValue !== undefined) {
      defaultData[key] = variable.defaultValue;
    } else {
      // Provide sensible defaults based on type
      switch (variable.type) {
        case "text":
        case "textarea":
          defaultData[key] = variable.placeholder || "";
          break;
        case "number":
          defaultData[key] = 0;
          break;
        case "date":
          defaultData[key] = new Date();
          break;
        default:
          defaultData[key] = "";
      }
    }
  }

  return defaultData;
}

function resolveCertificateId(
  template: CertificateTemplate,
  providedId: string | undefined,
  generateId: boolean
): string {
  if (providedId) {
    return providedId;
  }

  if (!generateId) {
    throw new Error("certificateId is required when generateId is disabled.");
  }

  return generateCertificateId(
    resolveOrganizationKey(template.organization),
    template.category
  );
}

function getTemplateVariableEntries(
  template: CertificateTemplate
): [string, TemplateVariableDefinition][] {
  if (!template.variables) {
    return [];
  }

  return Object.entries(template.variables) as [
    string,
    TemplateVariableDefinition
  ][];
}

function resolveOrganizationKey(organization: string): CertificateOrganization {
  const upper = organization.toUpperCase();
  if (upper in CERTIFICATE_ID_PATTERNS) {
    return upper as CertificateOrganization;
  }
  return "GENERAL";
}

function normalizeToDate(value?: Date | string): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
