"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Badge } from "@/components/creative/ui/badge";
import { Alert, AlertDescription } from "@/components/creative/ui/alert";
import {
  ArrowLeft,
  Award,
  Download,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { CertificateTemplatePreview } from "./certificate-template-preview";

interface CertificateTemplate {
  id: string;
  name: string;
  type: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  organizationId: string;
  certificateCount: number;
  createdAt: string;
  updatedAt: string;
  templateData: {
    elements: Record<
      string,
      {
        type: string;
        style: React.CSSProperties;
        content: string;
        position: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
      }
    >;
    pageSettings: {
      width: number;
      height: number;
      orientation: string;
      backgroundColor: string;
    };
  };
  organization?: {
    id: string;
    name: string;
    slug?: string;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface IssueCertificateRequest {
  recipientName: string;
  recipientEmail: string;
  templateId: string;
  organizationId?: string;
  customFields?: Record<string, unknown>;
  expiryDate?: string;
}

interface IssuedCertificate {
  id: string;
  certificateId: string;
  verificationId: string;
  recipientName: string;
  recipientEmail: string;
  pdfUrl?: string;
  imageUrl?: string;
  downloadUrl?: string;
}

export function CertificateIssuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId");

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [_organizations, setOrganizations] = useState<Organization[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedTemplate, setSelectedTemplate] =
    useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCertificate, setIssuedCertificate] =
    useState<IssuedCertificate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<IssueCertificateRequest>({
    recipientName: "",
    recipientEmail: "",
    templateId: templateId || "",
    organizationId: "",
    customFields: {},
    expiryDate: "",
  });

  // Organization color mapping
  const getOrganizationColors = (template: CertificateTemplate) => {
    if (!template.organization?.name) return getDefaultColors();

    const name = template.organization.name.toLowerCase();

    if (name.includes("fishers of men")) {
      return {
        bg: "bg-teal-50 dark:bg-teal-950",
        border: "border-teal-200 dark:border-teal-800",
        badge: "bg-teal-600 text-white border-teal-700",
        button: "bg-teal-600 hover:bg-teal-700 text-white",
      };
    }

    if (name.includes("jinan international christian fellowship")) {
      return {
        bg: "bg-purple-50 dark:bg-purple-950",
        border: "border-purple-200 dark:border-purple-800",
        badge: "bg-purple-600 text-white border-purple-700",
        button: "bg-purple-600 hover:bg-purple-700 text-white",
      };
    }

    if (name.includes("jinan union of liberian students")) {
      return {
        bg: "bg-blue-50 dark:bg-blue-950",
        border: "border-blue-200 dark:border-blue-800",
        badge: "bg-blue-600 text-white border-blue-700",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
      };
    }

    if (name.includes("ekd digital")) {
      return {
        bg: "bg-green-50 dark:bg-green-950",
        border: "border-green-200 dark:border-green-800",
        badge: "bg-green-600 text-white border-green-700",
        button: "bg-green-600 hover:bg-green-700 text-white",
      };
    }

    return getDefaultColors();
  };

  const getDefaultColors = () => ({
    bg: "bg-gray-50 dark:bg-gray-950",
    border: "border-gray-200 dark:border-gray-800",
    badge: "bg-gray-600 text-white border-gray-700",
    button: "bg-gray-600 hover:bg-gray-700 text-white",
  });

  const getOrganizationAbbreviation = (template: CertificateTemplate) => {
    if (!template.organization?.name) return "GENERAL";

    const name = template.organization.name.toLowerCase();

    if (name.includes("fishers of men")) return "FOM";
    if (name.includes("ekd digital")) return "EKD";
    if (name.includes("jinan international christian fellowship"))
      return "JICF";
    if (name.includes("jinan union of liberian students")) return "JULS";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setFormData((prev) => ({
          ...prev,
          templateId: template.id,
          organizationId: template.organizationId,
        }));
      }
    }
  }, [templateId, templates]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch templates
      const templatesResponse = await fetch("/api/certificates/templates");
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      // Fetch organizations
      const orgsResponse = await fetch("/api/organizations");
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.organizations || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);
    setFormData((prev) => ({
      ...prev,
      templateId,
      organizationId: template?.organizationId || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      setIssuing(true);
      setError(null);

      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to issue certificate");
      }

      const result = await response.json();
      setIssuedCertificate(result.certificate);
      setSuccess(true);
    } catch (error) {
      console.error("Error issuing certificate:", error);
      setError(
        error instanceof Error ? error.message : "Failed to issue certificate"
      );
    } finally {
      setIssuing(false);
    }
  };

  const handleDownload = () => {
    if (issuedCertificate?.downloadUrl) {
      window.open(issuedCertificate.downloadUrl, "_blank");
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError(null);
    setIssuedCertificate(null);
    setFormData({
      recipientName: "",
      recipientEmail: "",
      templateId: selectedTemplate?.id || "",
      organizationId: selectedTemplate?.organizationId || "",
      customFields: {},
      expiryDate: "",
    });
  };

  const colors = selectedTemplate
    ? getOrganizationColors(selectedTemplate)
    : getDefaultColors();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Issue Certificate</h1>
            <p className="text-muted-foreground">
              Create and issue a new certificate to a recipient
            </p>
          </div>
        </div>

        {success ? (
          // Success State
          <Card className={`${colors.bg} ${colors.border}`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                Certificate Issued Successfully!
              </CardTitle>
              <CardDescription>
                The certificate has been generated and is ready for download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {issuedCertificate && (
                <div className="bg-background/50 p-4 rounded-lg space-y-2">
                  <p>
                    <strong>Certificate ID:</strong>{" "}
                    {issuedCertificate.certificateId}
                  </p>
                  <p>
                    <strong>Verification ID:</strong>{" "}
                    {issuedCertificate.verificationId}
                  </p>
                  <p>
                    <strong>Recipient:</strong>{" "}
                    {issuedCertificate.recipientName}
                  </p>
                  <p>
                    <strong>Email:</strong> {issuedCertificate.recipientEmail}
                  </p>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <Button onClick={handleDownload} className={colors.button}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Issue Another
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/certificates")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Form State
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificate Details
                  </CardTitle>
                  <CardDescription>
                    Fill in the details to issue a new certificate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="template">Certificate Template</Label>
                      <Select
                        value={formData.templateId}
                        onValueChange={handleTemplateChange}
                        disabled={!!templateId} // Disable if template is pre-selected
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getOrganizationAbbreviation(template)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Recipient Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipientName">Recipient Name *</Label>
                        <Input
                          id="recipientName"
                          value={formData.recipientName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              recipientName: e.target.value,
                            }))
                          }
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input
                          id="recipientEmail"
                          type="email"
                          value={formData.recipientEmail}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              recipientEmail: e.target.value,
                            }))
                          }
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expiryDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={
                        !formData.recipientName ||
                        !formData.templateId ||
                        issuing
                      }
                      className={`w-full ${colors.button}`}
                    >
                      {issuing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Issuing Certificate...
                        </>
                      ) : (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Issue Certificate
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Template Preview */}
            <div className="lg:col-span-1">
              {selectedTemplate && (
                <Card className={`${colors.bg} ${colors.border}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {selectedTemplate.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedTemplate.type}
                        </CardDescription>
                      </div>
                      <Badge className={colors.badge}>
                        {getOrganizationAbbreviation(selectedTemplate)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p>
                          <strong>Organization:</strong>{" "}
                          {selectedTemplate.organization?.name || "N/A"}
                        </p>
                        <p>
                          <strong>Certificates Issued:</strong>{" "}
                          {selectedTemplate.certificateCount}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? "Hide" : "Show"} Preview
                      </Button>
                      {showPreview && (
                        <div className="border rounded-lg p-2 bg-background">
                          <CertificateTemplatePreview
                            templateData={selectedTemplate.templateData}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
