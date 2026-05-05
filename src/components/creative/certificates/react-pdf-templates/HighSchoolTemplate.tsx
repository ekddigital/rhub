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

// Define styles for High School Certificate
const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: "#ffffff",
  },
  // Decorative border with school theme
  outerBorder: {
    border: "3pt solid #1E3A8A", // Navy blue border
    padding: 6,
    height: "100%",
  },
  innerBorder: {
    border: "1pt solid #60A5FA", // Light blue inner border
    padding: 25,
    height: "100%",
    position: "relative",
  },
  // Corner decorations
  cornerDecoration: {
    fontSize: 24,
    color: "#1E3A8A",
    position: "absolute",
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  topRight: {
    top: 10,
    right: 10,
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
  },
  // Header section
  header: {
    textAlign: "center",
    marginBottom: 15,
  },
  institutionName: {
    fontSize: 20,
    fontFamily: "Times-Bold",
    color: "#1E3A8A",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  institutionMotto: {
    fontSize: 10,
    fontFamily: "Times-Italic",
    color: "#4B5563",
    marginBottom: 8,
  },
  institutionDetails: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#6B7280",
    marginBottom: 2,
  },
  // Certificate title
  certificateTitle: {
    fontSize: 26,
    fontFamily: "Times-Bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: "Times-Italic",
    textAlign: "center",
    color: "#374151",
    marginBottom: 25,
  },
  // Recipient section
  recipientSection: {
    marginTop: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  presentedTo: {
    fontSize: 10,
    fontFamily: "Times-Italic",
    color: "#6B7280",
    marginBottom: 10,
  },
  recipientName: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    color: "#000000",
    borderBottom: "2pt solid #60A5FA",
    paddingBottom: 4,
    paddingHorizontal: 50,
    textAlign: "center",
    marginBottom: 20,
  },
  // Achievement text
  achievementSection: {
    marginTop: 15,
    marginBottom: 25,
    paddingHorizontal: 60,
  },
  achievementText: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    textAlign: "center",
    color: "#374151",
    lineHeight: 1.6,
  },
  programName: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    color: "#1E3A8A",
    marginVertical: 8,
    textAlign: "center",
  },
  // Graduation info
  graduationInfo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginTop: 15,
    marginBottom: 35,
  },
  infoBox: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#1E3A8A",
  },
  // Signature section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 40,
    paddingHorizontal: 50,
  },
  signatureBlock: {
    alignItems: "center",
    width: 160,
  },
  signatureLine: {
    width: 140,
    borderTop: "1pt solid #374151",
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    color: "#374151",
    marginTop: 2,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#6B7280",
  },
  // Footer section
  footer: {
    position: "absolute",
    bottom: 25,
    left: 25,
    right: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "0.5pt solid #D1D5DB",
    paddingTop: 8,
  },
  footerLeft: {
    flex: 1,
  },
  qrSection: {
    alignItems: "center",
  },
  qrImage: {
    width: 65,
    height: 65,
  },
  footerText: {
    fontSize: 7,
    fontFamily: "Times-Roman",
    color: "#6B7280",
    marginBottom: 2,
  },
  credentialId: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#374151",
  },
  verificationText: {
    fontSize: 6,
    fontFamily: "Times-Roman",
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 3,
  },
  // Seal
  sealSection: {
    position: "absolute",
    bottom: 100,
    left: 50,
    alignItems: "center",
  },
  sealPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    border: "2pt solid #1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  sealText: {
    fontSize: 7,
    fontFamily: "Times-Bold",
    color: "#1E3A8A",
    textAlign: "center",
  },
});

interface HighSchoolTemplateProps {
  data: CredentialData;
  qrCodeDataURL: string;
}

export const HighSchoolTemplate: React.FC<HighSchoolTemplateProps> = ({
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
            {/* Corner decorations */}
            <Text style={[styles.cornerDecoration, styles.topLeft]}>✦</Text>
            <Text style={[styles.cornerDecoration, styles.topRight]}>✦</Text>
            <Text style={[styles.cornerDecoration, styles.bottomLeft]}>✦</Text>
            <Text style={[styles.cornerDecoration, styles.bottomRight]}>✦</Text>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.institutionName}>
                {data.institution.name}
              </Text>
              <Text style={styles.institutionMotto}>
                Excellence in Education
              </Text>
              <Text style={styles.institutionDetails}>
                {data.institution.county.name} County, Liberia
              </Text>
              <Text style={styles.institutionDetails}>
                Institution Code: {data.institution.code}
              </Text>
            </View>

            {/* Certificate Title */}
            <Text style={styles.certificateTitle}>High School Certificate</Text>
            <Text style={styles.subtitleText}>of Academic Achievement</Text>

            {/* Recipient */}
            <View style={styles.recipientSection}>
              <Text style={styles.presentedTo}>This certifies that</Text>
              <Text style={styles.recipientName}>{data.recipientName}</Text>
            </View>

            {/* Achievement */}
            <View style={styles.achievementSection}>
              <Text style={styles.achievementText}>
                has successfully completed all required courses and examinations
              </Text>
              <Text style={styles.programName}>{data.program}</Text>
              <Text style={styles.achievementText}>
                and is hereby awarded this certificate in recognition of their
                academic achievement and dedication
              </Text>
            </View>

            {/* Graduation Info */}
            <View style={styles.graduationInfo}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>ACADEMIC YEAR</Text>
                <Text style={styles.infoValue}>{data.academicYear}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>LEVEL</Text>
                <Text style={styles.infoValue}>{data.level}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>DATE OF ISSUE</Text>
                <Text style={styles.infoValue}>
                  {formatDate(data.issueDate)}
                </Text>
              </View>
            </View>

            {/* Signatures */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Principal</Text>
                <Text style={styles.signatureLabel}>Chief Administrator</Text>
              </View>

              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Registrar</Text>
                <Text style={styles.signatureLabel}>Student Records</Text>
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
                  Blockchain Hash: {data.blockchainHash || "Pending"}
                </Text>
                <Text style={styles.footerText}>
                  Verify at: https://credialr.com/verify
                </Text>
              </View>

              <View style={styles.qrSection}>
                <Image src={qrCodeDataURL} style={styles.qrImage} />
                <Text style={styles.verificationText}>Scan to verify</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default HighSchoolTemplate;
