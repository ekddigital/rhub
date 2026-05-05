/**
 * Certificate rendering utilities for generating PDF and image certificates
 */

import { TemplateData, TemplateElement } from "@/lib/creative/certificates/html-export";

type CustomFieldValue = string | number | boolean | Date;
type CustomFieldMap = Record<string, CustomFieldValue>;
type TemplateValidationInput = Partial<TemplateData> | null | undefined;
type LooseTemplateElement = Partial<TemplateElement> & Record<string, unknown>;

export interface CertificateRenderOptions {
  recipientName: string;
  templateData: TemplateData;
  organizationName?: string;
  issueDate: Date;
  certificateId: string;
  qrCodeUrl?: string;
  customFields?: CustomFieldMap;
}

/**
 * Process template elements and replace placeholders with actual values
 */
export function processTemplateElements(
  elements: TemplateElement[],
  data: {
    recipientName: string;
    organizationName?: string;
    issueDate: Date;
    certificateId: string;
    customFields?: CustomFieldMap;
  }
): TemplateElement[] {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return elements.map((element) => {
    let content = element.content;

    // Replace standard placeholders
    content = content.replace(/\{\{recipientName\}\}/g, data.recipientName);
    content = content.replace(
      /\{\{organizationName\}\}/g,
      data.organizationName || ""
    );
    content = content.replace(/\{\{issueDate\}\}/g, formatDate(data.issueDate));
    content = content.replace(/\{\{certificateId\}\}/g, data.certificateId);
    content = content.replace(
      /\{\{currentYear\}\}/g,
      data.issueDate.getFullYear().toString()
    );

    // Replace custom field placeholders
    if (data.customFields) {
      Object.entries(data.customFields).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        content = content.replace(placeholder, String(value));
      });
    }

    return {
      ...element,
      content,
    };
  });
}

/**
 * Generate HTML string from template data
 */
export function generateCertificateHTML(
  options: CertificateRenderOptions
): string {
  const {
    templateData,
    recipientName,
    organizationName,
    issueDate,
    certificateId,
    qrCodeUrl,
    customFields,
  } = options;

  const processedElements = processTemplateElements(templateData.elements, {
    recipientName,
    organizationName,
    issueDate,
    certificateId,
    customFields,
  });

  // Convert template elements to HTML
  const elementsHTML = processedElements
    .map((element) => {
      const style = {
        position: "absolute",
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.position.width}px`,
        height: `${element.position.height}px`,
        ...element.style,
      };

      const styleEntries = Object.entries(
        style as Record<string, string | number | boolean | undefined>
      ).filter(([, value]) => value !== undefined && value !== null);

      const styleString = styleEntries
        .map(([key, value]) => `${kebabCase(key)}: ${value}`)
        .join("; ");

      switch (element.type) {
        case "text":
          return `<div style="${styleString}">${element.content}</div>`;

        case "image":
          return `<img src="${element.content}" style="${styleString}" alt="" />`;

        case "qr":
          return qrCodeUrl
            ? `<img src="${qrCodeUrl}" style="${styleString}" alt="QR Code" />`
            : "";

        case "shape":
          return `<div style="${styleString}"></div>`;

        default:
          return "";
      }
    })
    .join("\n");

  // Generate complete HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificate</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        .certificate-container {
          position: relative;
          width: ${templateData.pageSettings.width}px;
          height: ${templateData.pageSettings.height}px;
          background-color: ${
            templateData.pageSettings.backgroundColor || "#ffffff"
          };
          ${
            templateData.pageSettings.backgroundImage
              ? `background-image: url(${templateData.pageSettings.backgroundImage});`
              : ""
          }
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          overflow: hidden;
        }
        ${
          templateData.fonts
            ?.map(
              (font) => `
          @import url('https://fonts.googleapis.com/css2?family=${font.family.replace(
            /\s+/g,
            "+"
          )}:wght@100;200;300;400;500;600;700;800;900&display=swap');
        `
            )
            .join("") || ""
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        ${elementsHTML}
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Validate template data structure
 */
export function validateTemplateData(templateData: TemplateValidationInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!templateData) {
    errors.push("Template data is required");
    return { isValid: false, errors };
  }

  if (!templateData.elements || !Array.isArray(templateData.elements)) {
    errors.push("Template must have elements array");
  }

  if (!templateData.pageSettings) {
    errors.push("Template must have page settings");
  } else {
    if (
      typeof templateData.pageSettings.width !== "number" ||
      typeof templateData.pageSettings.height !== "number"
    ) {
      errors.push("Page settings must include width and height");
    }
  }

  // Validate elements
  if (templateData.elements) {
    const elements = templateData.elements as LooseTemplateElement[];
    elements.forEach((element, index) => {
      if (!element?.id) {
        errors.push(`Element ${index} must have an id`);
      }
      if (!element?.type) {
        errors.push(`Element ${index} must have a type`);
      }
      if (!element?.position) {
        errors.push(`Element ${index} must have position`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
