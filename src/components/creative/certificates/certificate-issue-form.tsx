"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import { Badge } from "@/components/creative/ui/badge";
import { Alert, AlertDescription } from "@/components/creative/ui/alert";
import {
  Award,
  Send,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface CertificateTemplate {
  id: string;
  name: string;
  type: string;
  status: string;
  organizationId: string;
  preview?: string;
  organization?: {
    id: string;
    name: string;
    slug?: string;
  };
}

interface CertificateIssueFormProps {
  template?: CertificateTemplate;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface CertificateIssueForm {
  recipientName: string;
  recipientEmail: string;
  templateId: string;
  organizationId: string;
  issueDate: string;
  expiryDate?: string;
  customFields?: Record<string, unknown>;
}

interface IssuedCertificate {
  id: string;
  certificateId: string;
  verificationId: string;
  recipientName: string;
  recipientEmail: string;
  pdfUrl?: string;
  imageUrl?: string;
  qrCodeUrl?: string;
}

export function CertificateIssueForm({
  template,
  onSuccess,
  onCancel,
}: CertificateIssueFormProps = {}) {
  const [form, setForm] = useState<CertificateIssueForm>({
    recipientName: "",
    recipientEmail: "",
    templateId: template?.id || "",
    organizationId: template?.organizationId || "",
    issueDate: new Date().toISOString().split("T")[0],
  });

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<IssuedCertificate | null>(null);

  useEffect(() => {
    fetchTemplatesAndOrganizations();
  }, []);

  const fetchTemplatesAndOrganizations = async () => {
    try {
      const [templatesResponse, organizationsResponse] = await Promise.all([
        fetch("/api/certificates/templates?status=ACTIVE"),
        fetch("/api/organizations"),
      ]);

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      if (organizationsResponse.ok) {
        const organizationsData = await organizationsResponse.json();
        setOrganizations(organizationsData.organizations || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!form.recipientName.trim()) {
        throw new Error("Recipient name is required");
      }
      if (!form.recipientEmail.trim()) {
        throw new Error("Recipient email is required");
      }
      if (!template && !form.templateId) {
        throw new Error("Please select a certificate template");
      }
      if (!template && !form.organizationId) {
        throw new Error("Please select an organization");
      }

      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to issue certificate");
      }

      const data = await response.json();
      setSuccess(data.certificate);

      // Call success callback if provided (for modal usage)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000); // Give user time to see success message
      }

      // Reset form only if not in modal mode
      if (!template) {
        setForm({
          recipientName: "",
          recipientEmail: "",
          templateId: "",
          organizationId: "",
          issueDate: new Date().toISOString().split("T")[0],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-green-800">
                Certificate issued successfully!
              </p>
              <div className="text-sm text-green-700">
                <p>Certificate ID: {success.certificateId}</p>
                <p>Verification ID: {success.verificationId}</p>
                <p>Recipient: {success.recipientName}</p>
              </div>
              <div className="flex gap-2 mt-3">
                {success.pdfUrl && (
                  <Button
                    size="sm"
                    onClick={() => handleDownload(success.pdfUrl!)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
                {success.imageUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(success.imageUrl!)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Issue Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Issue New Certificate
          </CardTitle>
          <CardDescription>
            Fill out the form below to issue a new digital certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recipient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name *</Label>
                  <Input
                    id="recipientName"
                    value={form.recipientName}
                    onChange={(e) =>
                      setForm({ ...form, recipientName: e.target.value })
                    }
                    placeholder="Enter recipient's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) =>
                      setForm({ ...form, recipientEmail: e.target.value })
                    }
                    placeholder="Enter recipient's email"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Certificate Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Certificate Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Selection - only show if no template is pre-selected */}
                {!template && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="templateId">Certificate Template *</Label>
                      <Select
                        value={form.templateId}
                        onValueChange={(value) =>
                          setForm({ ...form, templateId: value })
                        }
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
                                  {template.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationId">
                        Issuing Organization *
                      </Label>
                      <Select
                        value={form.organizationId}
                        onValueChange={(value) =>
                          setForm({ ...form, organizationId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Template Info Display - show when template is pre-selected */}
                {template && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Selected Template:</span>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.name}
                    </p>
                    {template.organization && (
                      <p className="text-xs text-muted-foreground">
                        Organization: {template.organization.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) =>
                      setForm({ ...form, issueDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={form.expiryDate || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expiryDate: e.target.value || undefined,
                      })
                    }
                    min={form.issueDate}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Issuing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
