import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { CredentialData } from "@/lib/creative/certificates/credential";

// Define styles for Diploma certificate
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
  },
  // Decorative border
  outerBorder: {
    border: "4pt solid #8B4513", // Brown border
    padding: 8,
    height: "100%",
  },
  innerBorder: {
    border: "1pt solid #DAA520", // Goldenrod inner border
    padding: 30,
    height: "100%",
    position: "relative",
  },
  // Header section
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  institutionName: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    color: "#8B4513",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  institutionDetails: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#555555",
    marginBottom: 2,
  },
  institutionCode: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#888888",
  },
  // Certificate title
  certificateTitle: {
    fontSize: 28,
    fontFamily: "Times-Bold",
    color: "#8B4513",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  certificationText: {
    fontSize: 13,
    fontFamily: "Times-Italic",
    textAlign: "center",
    color: "#333333",
    marginBottom: 30,
  },
  // Recipient section
  recipientSection: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  presentedTo: {
    fontSize: 11,
    fontFamily: "Times-Italic",
    color: "#555555",
    marginBottom: 8,
  },
  recipientName: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    color: "#000000",
    borderBottom: "2pt solid #DAA520",
    paddingBottom: 4,
    paddingHorizontal: 40,
    textAlign: "center",
    marginBottom: 20,
  },
  // Program details
  programSection: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  programText: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    textAlign: "center",
    color: "#333333",
    lineHeight: 1.6,
  },
  programName: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    color: "#8B4513",
    marginVertical: 6,
  },
  levelText: {
    fontSize: 12,
    fontFamily: "Times-Italic",
    color: "#555555",
  },
  // Signature section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 50,
    paddingHorizontal: 40,
  },
  signatureBlock: {
    alignItems: "center",
    width: 180,
  },
  signatureLine: {
    width: 160,
    borderTop: "1pt solid #333333",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#555555",
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#333333",
    marginTop: 2,
  },
  // Footer section
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "0.5pt solid #CCCCCC",
    paddingTop: 10,
  },
  footerLeft: {
    flex: 1,
  },
  qrSection: {
    alignItems: "center",
  },
  qrImage: {
    width: 70,
    height: 70,
  },
  footerText: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#666666",
    marginBottom: 2,
  },
  credentialId: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#333333",
  },
  verificationText: {
    fontSize: 6,
    fontFamily: "Times-Roman",
    color: "#888888",
    textAlign: "center",
    marginTop: 4,
  },
  // Seal placeholder
  sealSection: {
    position: "absolute",
    bottom: 120,
    left: 60,
    alignItems: "center",
  },
  sealPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    border: "2pt solid #8B4513",
    justifyContent: "center",
    alignItems: "center",
  },
  sealText: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#8B4513",
    textAlign: "center",
  },
});

interface DiplomaTemplateProps {
  data: CredentialData;
  qrCodeDataURL: string;
}

export const DiplomaTemplate: React.FC<DiplomaTemplateProps> = ({
  data,
  qrCodeDataURL,
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.institutionName}>
                {data.institution.name}
              </Text>
              <Text style={styles.institutionDetails}>
                {data.institution.county.name} County, Liberia
              </Text>
              <Text style={styles.institutionCode}>
                Institution Code: {data.institution.code}
              </Text>
            </View>

            {/* Certificate Title */}
            <Text style={styles.certificateTitle}>Diploma</Text>
            <Text style={styles.certificationText}>
              This is to certify that
            </Text>

            {/* Recipient */}
            <View style={styles.recipientSection}>
              <Text style={styles.recipientName}>{data.recipientName}</Text>
            </View>

            {/* Program Details */}
            <View style={styles.programSection}>
              <Text style={styles.programText}>
                has successfully completed the requirements for
              </Text>
              <Text style={styles.programName}>{data.program}</Text>
              <Text style={styles.levelText}>{data.level}</Text>
              <Text style={styles.programText}>
                during the Academic Year {data.academicYear}
              </Text>
            </View>

            {/* Signatures */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>President/Director</Text>
                <Text style={styles.signatureLabel}>
                  Chief Executive Officer
                </Text>
              </View>

              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Registrar</Text>
                <Text style={styles.signatureLabel}>Academic Records</Text>
              </View>
            </View>

            {/* Official Seal */}
            <View style={styles.sealSection}>
              <View style={styles.sealPlaceholder}>
                <Text style={styles.sealText}>OFFICIAL{"\n"}SEAL</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Text style={styles.credentialId}>
                  Credential ID: {data.code}
                </Text>
                <Text style={styles.footerText}>
                  Issue Date: {formatDate(data.issueDate)}
                </Text>
                <Text style={styles.footerText}>
                  Blockchain Hash: {data.blockchainHash || "Pending"}
                </Text>
              </View>

              <View style={styles.qrSection}>
                <Image src={qrCodeDataURL} style={styles.qrImage} />
                <Text style={styles.verificationText}>
                  Scan to verify authenticity
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default DiplomaTemplate;
