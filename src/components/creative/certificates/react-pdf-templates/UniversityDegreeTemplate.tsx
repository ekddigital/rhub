import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import type { CredentialData } from "@/lib/creative/certificates/credential";

interface UniversityDegreeProps {
  credential: CredentialData;
  qrCodeDataURL: string;
  verificationURL: string;
}

// Register fonts for better typography
// Note: You'll need to add font files to your public folder
// Font.register({
//   family: 'Times New Roman',
//   src: '/fonts/TimesNewRoman.ttf',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#FFFFFF",
    fontFamily: "Times-Roman",
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: "3pt double #D4AF37",
  },
  innerBorder: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    border: "1pt solid #D4AF37",
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 50,
    paddingRight: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  institutionName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F4C81",
    marginBottom: 5,
    textAlign: "center",
  },
  institutionDetails: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 3,
  },
  divider: {
    width: "60%",
    height: 2,
    backgroundColor: "#D4AF37",
    marginTop: 15,
    marginBottom: 15,
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F4C81",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  bodySection: {
    marginTop: 30,
    marginBottom: 30,
    paddingLeft: 20,
    paddingRight: 20,
  },
  certificationText: {
    fontSize: 14,
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 1.8,
    marginBottom: 25,
  },
  recipientName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F4C81",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 15,
    textDecoration: "none",
    borderBottom: "2pt solid #D4AF37",
    paddingBottom: 5,
  },
  programText: {
    fontSize: 14,
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 1.8,
    marginTop: 20,
  },
  programName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F4C81",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 5,
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 50,
    marginBottom: 20,
  },
  signatureBlock: {
    width: "35%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#1F2937",
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qrSection: {
    alignItems: "center",
    width: 100,
  },
  qrCode: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  qrText: {
    fontSize: 8,
    color: "#6B7280",
    textAlign: "center",
  },
  credentialInfo: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
  },
  credentialId: {
    fontSize: 9,
    color: "#1F2937",
    marginBottom: 3,
  },
  issueDate: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 3,
  },
  blockchainHash: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 5,
  },
  verificationURL: {
    fontSize: 8,
    color: "#0F4C81",
    marginTop: 8,
  },
  sealPlaceholder: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  sealCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    border: "2pt solid #D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  sealText: {
    fontSize: 8,
    color: "#D4AF37",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export const UniversityDegreeTemplate: React.FC<UniversityDegreeProps> = ({
  credential,
  qrCodeDataURL,
  verificationURL,
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
        {/* Decorative borders */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.institutionName}>
              {credential.institution.name}
            </Text>
            <Text style={styles.institutionDetails}>
              {credential.institution.county.name}, Republic of Liberia
            </Text>
            <Text style={styles.institutionDetails}>
              Institution Code: {credential.institution.code}
            </Text>
            <View style={styles.divider} />
          </View>

          {/* Certificate Title */}
          <Text style={styles.certificateTitle}>
            {credential.level === "BSc" || credential.level === "BA"
              ? "Bachelor Degree"
              : credential.level === "MSc" || credential.level === "MA"
              ? "Master Degree"
              : credential.level === "PhD"
              ? "Doctoral Degree"
              : "Certificate of Achievement"}
          </Text>

          {/* Body */}
          <View style={styles.bodySection}>
            <Text style={styles.certificationText}>
              This is to certify that
            </Text>

            <Text style={styles.recipientName}>{credential.recipientName}</Text>

            <Text style={styles.programText}>
              has successfully completed the academic requirements for the
            </Text>

            <Text style={styles.programName}>{credential.program}</Text>

            <Text style={styles.levelText}>
              {credential.level} • Class of {credential.academicYear}
            </Text>

            <Text style={styles.programText}>
              and is hereby awarded this credential on{" "}
              {formatDate(credential.issueDate)}
            </Text>
          </View>

          {/* Signatures */}
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>President/Chancellor</Text>
            </View>

            <View style={styles.sealPlaceholder}>
              <View style={styles.sealCircle}>
                <Text style={styles.sealText}>OFFICIAL{"\n"}SEAL</Text>
              </View>
            </View>

            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Registrar</Text>
            </View>
          </View>
        </View>

        {/* Footer with QR and Credential Info */}
        <View style={styles.footer}>
          <View style={styles.qrSection}>
            <Image src={qrCodeDataURL} style={styles.qrCode} />
            <Text style={styles.qrText}>Scan to verify</Text>
          </View>

          <View style={styles.credentialInfo}>
            <Text style={styles.credentialId}>
              Credential ID: {credential.code}
            </Text>
            <Text style={styles.issueDate}>
              Issue Date: {formatDate(credential.issueDate)}
            </Text>
            <Text style={styles.issueDate}>
              Academic Year: {credential.academicYear}
            </Text>
            {credential.blockchainHash && (
              <Text style={styles.blockchainHash}>
                Blockchain: {credential.blockchainHash.substring(0, 32)}...
              </Text>
            )}
            <Text style={styles.verificationURL}>
              Verify at: {verificationURL}
            </Text>
          </View>

          <View style={styles.sealPlaceholder} />
        </View>
      </Page>
    </Document>
  );
};
