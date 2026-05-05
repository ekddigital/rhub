/**
 * Certificate ID Generator
 * Generates unique certificate IDs with organization-specific prefixes
 */

/**
 * Organization-specific certificate ID patterns
 */
export const CERTIFICATE_ID_PATTERNS = {
  JULS: {
    prefix: "JULS-",
    categories: {
      appreciation: "APP",
      completion: "COM",
      achievement: "ACH",
      award: "AWD",
      service: "SRV",
      participation: "PAR",
      excellence: "EXC",
      leadership: "LED",
      graduation: "GRD",
    },
  },
  FOM: {
    prefix: "FOM-",
    categories: {
      appreciation: "APP",
      completion: "COM",
      achievement: "ACH",
      award: "AWD",
      service: "SRV",
      participation: "PAR",
      excellence: "EXC",
      mission: "MIS",
      baptism: "BAP",
    },
  },
  JICF: {
    prefix: "JICF-",
    categories: {
      appreciation: "APP",
      completion: "COM",
      achievement: "ACH",
      award: "AWD",
      service: "SRV",
      participation: "PAR",
      excellence: "EXC",
      fellowship: "FEL",
      worship: "WOR",
    },
  },
  EKD: {
    prefix: "EKD-",
    categories: {
      appreciation: "APP",
      completion: "COM",
      achievement: "ACH",
      award: "AWD",
      service: "SRV",
      participation: "PAR",
      excellence: "EXC",
      technology: "TEC",
      training: "TRG",
    },
  },
  GENERAL: {
    prefix: "GEN-",
    categories: {
      appreciation: "APP",
      completion: "COM",
      achievement: "ACH",
      award: "AWD",
      service: "SRV",
      participation: "PAR",
      excellence: "EXC",
      general: "GEN",
    },
  },
} as const;

/**
 * Generate a unique certificate ID based on organization and category with auto-increment
 * Format: ORG-YYYY-TYPE-NNNN-XX
 * Example: JULS-2025-APP-0007-NE
 */
export function generateCertificateId(
  organization: keyof typeof CERTIFICATE_ID_PATTERNS,
  category: string,
  sequenceNumber?: number
): string {
  const orgPattern = CERTIFICATE_ID_PATTERNS[organization];
  if (!orgPattern) {
    throw new Error(`Invalid organization: ${organization}`);
  }

  const categoryCode =
    orgPattern.categories[category as keyof typeof orgPattern.categories] ||
    "GEN";
  const currentYear = new Date().getFullYear();

  // If no sequence number provided, generate a random one
  // In production, this should be replaced with DB auto-increment logic
  const seqNum = sequenceNumber || Math.floor(Math.random() * 9999) + 1;
  const seqString = seqNum.toString().padStart(4, "0");

  // Generate random 2-letter suffix (letters only for consistency)
  const randomSuffix = generateRandomLetters(2);

  return `${orgPattern.prefix}${currentYear}-${categoryCode}-${seqString}-${randomSuffix}`;
}

/**
 * Generate a random letter string (letters only)
 */
function generateRandomLetters(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate a certificate ID format
 */
export function validateCertificateId(certificateId: string): {
  isValid: boolean;
  organization?: keyof typeof CERTIFICATE_ID_PATTERNS;
  category?: string;
  timestamp?: string;
  suffix?: string;
} {
  // Check if ID matches any organization pattern
  for (const [org, pattern] of Object.entries(CERTIFICATE_ID_PATTERNS)) {
    if (certificateId.startsWith(pattern.prefix)) {
      const remainder = certificateId.slice(pattern.prefix.length);
      const parts = remainder.split("-");

      if (parts.length >= 3) {
        const [categoryCode, timestamp] = parts;

        // Find category by code
        const category = Object.entries(pattern.categories).find(
          ([, code]) => code === categoryCode
        )?.[0];

        return {
          isValid: true,
          organization: org as keyof typeof CERTIFICATE_ID_PATTERNS,
          category,
          timestamp,
          suffix: parts.slice(2).join("-"), // Join remaining parts as suffix
        };
      }
    }
  }

  return { isValid: false };
}

/**
 * Extract organization from certificate ID
 */
export function getOrganizationFromCertificateId(
  certificateId: string
): keyof typeof CERTIFICATE_ID_PATTERNS | null {
  const validation = validateCertificateId(certificateId);
  return validation.organization || null;
}

/**
 * Generate multiple unique certificate IDs
 */
export function generateBatchCertificateIds(
  organization: keyof typeof CERTIFICATE_ID_PATTERNS,
  category: string,
  count: number,
  startingSequence: number = 1
): string[] {
  const ids: string[] = [];

  for (let i = 0; i < count; i++) {
    const sequenceNumber = startingSequence + i;
    const id = generateCertificateId(organization, category, sequenceNumber);
    ids.push(id);
  }

  return ids;
}

/**
 * Quick ID generators for each organization
 */
export const certificateIdGenerators = {
  juls: (category: string) => generateCertificateId("JULS", category),
  fom: (category: string) => generateCertificateId("FOM", category),
  jicf: (category: string) => generateCertificateId("JICF", category),
  ekd: (category: string) => generateCertificateId("EKD", category),
  general: (category: string) => generateCertificateId("GENERAL", category),
};

/**
 * Format certificate ID for display (with hyphens for readability)
 */
export function formatCertificateIdForDisplay(certificateId: string): string {
  // Already formatted with hyphens
  return certificateId;
}

/**
 * Parse certificate ID into components
 */
export function parseCertificateId(certificateId: string) {
  const validation = validateCertificateId(certificateId);

  if (!validation.isValid) {
    throw new Error(`Invalid certificate ID format: ${certificateId}`);
  }

  return {
    organization: validation.organization!,
    category: validation.category || "unknown",
    timestamp: validation.timestamp || "",
    suffix: validation.suffix || "",
    fullId: certificateId,
  };
}
