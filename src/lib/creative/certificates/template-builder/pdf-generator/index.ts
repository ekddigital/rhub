/**
 * PDF and image generation utilities for certificates
 */
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { TemplateData } from "@/lib/creative/certificates/template-builder/certificate";
import { generateCertificateQRCode } from "@/lib/creative/certificates/html-export/qr-code-generator";

// Function to generate a PDF certificate
// In a real implementation, you'd use a library like PDFKit, jsPDF, or html-pdf
// For now, we'll simulate file generation and return a path
export async function generateCertificatePDF(): Promise<string> {
  // In a production environment, this would use PDFKit or similar to actually generate a PDF
  // For this implementation, we'll just simulate file creation

  try {
    // Ensure the directory exists
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "certificates"
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate a unique filename
    const filename = `certificate-${nanoid()}.pdf`;
    const filePath = path.join("uploads", "certificates", filename);

    // In a real implementation, we would generate the actual PDF here
    // For now, we're just simulating the process and returning the path

    // For demo purposes, you could create a placeholder file
    // await fs.writeFile(path.join(process.cwd(), "public", filePath), "Certificate PDF Placeholder");

    // Return the relative path that can be used in URLs
    return filePath;
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    throw new Error("Failed to generate certificate PDF");
  }
}

// Function to generate a PNG version of the certificate
export async function generateCertificatePNG(): Promise<string> {
  try {
    // Ensure the directory exists
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "certificates"
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate a unique filename
    const filename = `certificate-${nanoid()}.png`;
    const filePath = path.join("uploads", "certificates", filename);

    // In a real implementation, we would generate the actual PNG here
    // For now, we're just simulating the process and returning the path

    // Return the relative path that can be used in URLs
    return filePath;
  } catch (error) {
    console.error("Error generating certificate PNG:", error);
    throw new Error("Failed to generate certificate PNG");
  }
}

// Function to generate a QR code for certificate verification using centralized logic
export async function generateQRCode(verificationUrl: string): Promise<string> {
  try {
    // Ensure the directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "qrcodes");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate a unique filename
    const filename = `qrcode-${nanoid()}.png`;
    const relativePath = path.join("uploads", "qrcodes", filename);
    const filePath = path.join(process.cwd(), "public", relativePath);

    // Generate QR code using our centralized ultra-scannable generator
    const qrCodeDataURL = await generateCertificateQRCode(verificationUrl);

    // Convert base64 to buffer and save as file
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    await fs.writeFile(filePath, buffer);

    return relativePath;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

// Helper function to combine template and certificate data for rendering
export function prepareCertificateData(
  templateData: TemplateData,
  certificateData: Record<string, string>
): TemplateData {
  // Create a deep copy of the template data
  const preparedTemplate = JSON.parse(
    JSON.stringify(templateData)
  ) as TemplateData;

  // Replace placeholders in text elements with actual certificate data
  preparedTemplate.elements = preparedTemplate.elements.map((element) => {
    if (element.type === "text") {
      // Replace placeholders like {{recipientName}} with actual data
      Object.keys(certificateData).forEach((key) => {
        element.content = element.content.replace(
          new RegExp(`{{${key}}}`, "g"),
          certificateData[key]
        );
      });
    }
    return element;
  });

  return preparedTemplate;
}
