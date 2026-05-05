import { renderToBuffer } from "@react-pdf/renderer";
import { UniversityDegreeTemplate } from "@/components/creative/certificates/react-pdf-templates/UniversityDegreeTemplate";
import { DiplomaTemplate } from "@/components/creative/certificates/react-pdf-templates/DiplomaTemplate";
import { HighSchoolTemplate } from "@/components/creative/certificates/react-pdf-templates/HighSchoolTemplate";
import { generateQRCode, generateVerificationURL } from "./credential-qr";
import type { CredentialData } from "./credential";

/**
 * Generate a PDF certificate for a credential
 * @param credential - The credential data
 * @returns Promise resolving to PDF buffer
 */
export async function generateCertificatePDF(
  credential: CredentialData
): Promise<Uint8Array> {
  try {
    // Generate QR code
    const qrCodeDataURL = await generateQRCode(credential.code);
    const verificationURL = generateVerificationURL(credential.code);

    // Get the appropriate template and generate document
    let documentElement;

    switch (credential.type) {
      case "DIPLOMA":
        documentElement = DiplomaTemplate({
          data: credential,
          qrCodeDataURL,
        });
        break;
      case "CERTIFICATE":
        documentElement = HighSchoolTemplate({
          data: credential,
          qrCodeDataURL,
        });
        break;
      case "DEGREE":
      default:
        documentElement = UniversityDegreeTemplate({
          credential,
          qrCodeDataURL,
          verificationURL,
        });
        break;
    }

    // Render PDF to buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(documentElement as any);

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    throw new Error("Failed to generate certificate PDF");
  }
}

/**
 * Generate certificate PDF and return as base64 string
 * @param credential - The credential data
 * @returns Promise resolving to base64 string
 */
export async function generateCertificatePDFBase64(
  credential: CredentialData
): Promise<string> {
  const buffer = await generateCertificatePDF(credential);
  return Buffer.from(buffer).toString("base64");
}

/**
 * Generate certificate PDF and save to file (server-side)
 * @param credential - The credential data
 * @param filePath - Path where to save the PDF
 * @returns Promise resolving to file path
 */
export async function generateAndSaveCertificatePDF(
  credential: CredentialData,
  filePath: string
): Promise<string> {
  const fs = await import("fs/promises");
  const buffer = await generateCertificatePDF(credential);

  await fs.writeFile(filePath, buffer);

  return filePath;
}

/**
 * Get the appropriate template component based on credential type
 * @param type - Credential type
 * @returns Template component
 */
export function getTemplateForCredentialType(type: string) {
  switch (type) {
    case "DEGREE":
      return UniversityDegreeTemplate;
    case "DIPLOMA":
      return DiplomaTemplate;
    case "CERTIFICATE":
      return HighSchoolTemplate; // Using high school template for general certificates
    case "TRANSCRIPT":
      // TODO: Implement TranscriptTemplate
      return UniversityDegreeTemplate; // Fallback for now
    case "BADGE":
      // TODO: Implement BadgeTemplate
      return UniversityDegreeTemplate; // Fallback for now
    default:
      return UniversityDegreeTemplate;
  }
}
