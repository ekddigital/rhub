"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import { Textarea } from "@/components/creative/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/creative/ui/table";
import { Badge } from "@/components/creative/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/creative/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/creative/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/creative/ui/alert";
import { Checkbox } from "@/components/creative/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Trash,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CertificateBuilder,
  CertificateTemplateData,
} from "./certificate-preview";
import { CertificateTemplatePreview } from "./certificate-template-preview";
import { CertificateInitializer } from "./certificate-initializer";

interface Certificate {
  id: string;
  certificateId: string;
  verificationId: string;
  recipientName: string;
  recipientEmail: string;
  template: {
    id: string;
    name: string;
    type: string;
  };
  organization: {
    id: string;
    name: string;
  };
  status: "ACTIVE" | "REVOKED" | "EXPIRED" | "DRAFT";
  issueDate: string;
  expiryDate?: string;
  pdfUrl?: string;
  imageUrl?: string;
  downloadCount: number;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
}

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

interface DashboardStats {
  totalCertificates: number;
  activeCertificates: number;
  totalVerifications: number;
  totalDownloads: number;
  recentCertificates: Certificate[];
  popularTemplates: CertificateTemplate[];
}

type DashboardTab = "overview" | "certificates" | "templates" | "settings";

const DASHBOARD_TABS: Array<{
  id: DashboardTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "templates", label: "Templates", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export function CertificateDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<DashboardTab>("overview");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [, setEditingTemplate] = useState<CertificateTemplateData | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<CertificateTemplate | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Certificate action states
  const [viewingCertificate, setViewingCertificate] =
    useState<Certificate | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] =
    useState<Certificate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingCertificate, setDeletingCertificate] =
    useState<Certificate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [revokingCertificate, setRevokingCertificate] =
    useState<Certificate | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination and bulk operations state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Certificate>("issueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Organization-specific styling function
  const getOrganizationBadgeStyle = (orgName: string) => {
    const name = orgName?.toLowerCase() || "general";

    // Use organization brand colors
    const orgStyles = {
      "jinan union of liberian students":
        "bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:border-blue-400 dark:text-white",
      juls: "bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:border-blue-400 dark:text-white",
      "jinan international christian fellowship":
        "bg-purple-600 text-white border-purple-700 dark:bg-purple-500 dark:border-purple-400 dark:text-white",
      jicf: "bg-purple-600 text-white border-purple-700 dark:bg-purple-500 dark:border-purple-400 dark:text-white",
      "fishers of men":
        "bg-teal-600 text-white border-teal-700 dark:bg-teal-500 dark:border-teal-400 dark:text-white",
      fom: "bg-teal-600 text-white border-teal-700 dark:bg-teal-500 dark:border-teal-400 dark:text-white",
      "ekd digital":
        "bg-green-600 text-white border-green-700 dark:bg-green-500 dark:border-green-400 dark:text-white",
      "ekd-digital":
        "bg-green-600 text-white border-green-700 dark:bg-green-500 dark:border-green-400 dark:text-white",
      general:
        "bg-gray-600 text-white border-gray-700 dark:bg-gray-500 dark:border-gray-400 dark:text-white",
    };

    // Try exact match first
    if (orgStyles[name as keyof typeof orgStyles]) {
      return orgStyles[name as keyof typeof orgStyles];
    }

    // Try partial matches for organization names
    for (const [orgKey, style] of Object.entries(orgStyles)) {
      if (name.includes(orgKey) || orgKey.includes(name)) {
        return style;
      }
    }

    return orgStyles.general;
  };

  // Function to get organization abbreviation from organization data
  const getOrganizationAbbreviation = (template: CertificateTemplate) => {
    // First try to get from organization name if available
    if (template.organization?.name) {
      const name = template.organization.name.toLowerCase();

      // Map organization names to their abbreviations
      if (name.includes("fishers of men")) return "FOM";
      if (name.includes("ekd digital")) return "EKD";
      if (name.includes("tech academy")) return "TECH";
      if (name.includes("jinan international christian fellowship"))
        return "JICF";
      if (name.includes("jinan union of liberian students")) return "JULS";

      // Return first letters of each word as fallback
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    }

    // Fallback to slug if name is not available
    if (template.organization?.slug) {
      const slug = template.organization.slug.toLowerCase();

      // Map organization slugs to their abbreviations
      const orgAbbreviations: Record<string, string> = {
        fom: "FOM",
        "ekd-digital": "EKD",
        "tech-academy": "TECH",
        jicf: "JICF",
        juls: "JULS",
      };

      return orgAbbreviations[slug] || slug.toUpperCase();
    }

    return "GENERAL";
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Pagination and bulk operations functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredCertificates.map((cert) => cert.id);
      setSelectedCertificates(new Set(allIds));
    } else {
      setSelectedCertificates(new Set());
    }
    setSelectAll(checked);
  };

  const handleSelectCertificate = (certificateId: string, checked: boolean) => {
    const newSelected = new Set(selectedCertificates);
    if (checked) {
      newSelected.add(certificateId);
    } else {
      newSelected.delete(certificateId);
      setSelectAll(false);
    }
    setSelectedCertificates(newSelected);
  };

  const handleBulkDownload = async () => {
    if (selectedCertificates.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedCerts = certificates.filter((cert) =>
        selectedCertificates.has(cert.id)
      );

      for (const cert of selectedCerts) {
        await handleDownloadCertificate(cert);
        // Add a small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Error in bulk download:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedCertificates.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedCerts = certificates.filter(
        (cert) => selectedCertificates.has(cert.id) && cert.status !== "REVOKED"
      );

      for (const cert of selectedCerts) {
        await fetch(`/api/certificates/${cert.id}/revoke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Bulk revocation" }),
        });
      }

      fetchDashboardData();
      setSelectedCertificates(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Error in bulk revoke:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCertificates.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedCerts = certificates.filter((cert) =>
        selectedCertificates.has(cert.id)
      );

      for (const cert of selectedCerts) {
        await fetch(`/api/certificates/${cert.id}`, {
          method: "DELETE",
        });
      }

      fetchDashboardData();
      setSelectedCertificates(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Error in bulk delete:", error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const exportToCSV = () => {
    const selectedCerts = certificates.filter((cert) =>
      selectedCertificates.has(cert.id)
    );
    const csvData = selectedCerts.map((cert) => ({
      "Certificate ID": cert.certificateId,
      "Verification ID": cert.verificationId,
      "Recipient Name": cert.recipientName,
      "Recipient Email": cert.recipientEmail || "",
      Template: cert.template.name,
      Organization: cert.organization.name,
      Status: cert.status,
      "Issue Date": new Date(cert.issueDate).toLocaleDateString(),
      "Expiry Date": cert.expiryDate
        ? new Date(cert.expiryDate).toLocaleDateString()
        : "",
      Downloads: cert.downloadCount,
      Verifications: cert.verificationCount,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => `"${row[header as keyof typeof row]}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificates_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/certificates/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch certificates
      const certificatesResponse = await fetch("/api/certificates");
      if (certificatesResponse.ok) {
        const certificatesData = await certificatesResponse.json();
        setCertificates(certificatesData.certificates || []);
      }

      // Fetch templates
      const templatesResponse = await fetch("/api/certificates/templates");
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (template: CertificateTemplateData) => {
    try {
      const response = await fetch("/api/certificates/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        fetchDashboardData();
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      if (certificate.pdfUrl) {
        // Track download
        await fetch(`/api/certificates/${certificate.id}/download`, {
          method: "POST",
        });

        // Open PDF in new tab
        window.open(certificate.pdfUrl, "_blank");
      } else {
        // Generate and download PDF
        const response = await fetch(`/api/certificates/${certificate.id}/pdf`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${certificate.certificateId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
    }
  };

  const handleViewCertificate = (certificate: Certificate) => {
    setViewingCertificate(certificate);
    setIsViewDialogOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setIsEditDialogOpen(true);
  };

  const saveEditCertificate = async (formData: FormData) => {
    if (!editingCertificate) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/certificates/${editingCertificate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientName: formData.get("recipientName"),
            recipientEmail: formData.get("recipientEmail"),
            expiryDate: formData.get("expiryDate"),
          }),
        }
      );

      if (response.ok) {
        fetchDashboardData();
        setIsEditDialogOpen(false);
        setEditingCertificate(null);
      }
    } catch (error) {
      console.error("Error updating certificate:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCertificate = (certificate: Certificate) => {
    setDeletingCertificate(certificate);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCertificate = async () => {
    if (!deletingCertificate) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/certificates/${deletingCertificate.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchDashboardData();
        setIsDeleteDialogOpen(false);
        setDeletingCertificate(null);
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAction = (certificate: Certificate) => {
    setRevokingCertificate(certificate);
    setIsRevokeDialogOpen(true);
  };

  const confirmRevokeCertificate = async (reason?: string) => {
    if (!revokingCertificate) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/certificates/${revokingCertificate.id}/revoke`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        fetchDashboardData();
        setIsRevokeDialogOpen(false);
        setRevokingCertificate(null);
      }
    } catch (error) {
      console.error("Error revoking certificate:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewTemplate = (template: CertificateTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleEditTemplate = (template: CertificateTemplate) => {
    // For now, just show an alert - full edit functionality to be implemented
    alert(`Edit functionality for "${template.name}" will be available soon!`);
  };

  const handleIssueCertificate = (template: CertificateTemplate) => {
    // Navigate to certificate issuance page with template pre-selected
    router.push(`/admin/certificates/issue?templateId=${template.id}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "default",
      DRAFT: "secondary",
      REVOKED: "destructive",
      EXPIRED: "outline",
    } as const;

    const customClasses = {
      ACTIVE:
        "bg-green-500 text-white border-2 border-green-600 dark:bg-green-600 dark:border-green-400",
      DRAFT:
        "bg-yellow-500 text-white border-2 border-yellow-600 dark:bg-yellow-600 dark:border-yellow-400",
      REVOKED:
        "bg-red-500 text-white border-2 border-red-600 dark:bg-red-600 dark:border-red-400",
      EXPIRED:
        "bg-gray-500 text-white border-2 border-gray-600 dark:bg-gray-600 dark:border-gray-400",
    } as const;

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || "secondary"}
        className={
          customClasses[status as keyof typeof customClasses] ||
          "bg-gray-500 text-white border-2 border-gray-600"
        }
      >
        {status}
      </Badge>
    );
  };

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase())
  ); // Sort certificates
  const sortedCertificates = [...filteredCertificates].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return sortDirection === "asc" ? -1 : 1;
    if (bValue === undefined) return sortDirection === "asc" ? 1 : -1;

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate certificates
  const totalPages = Math.ceil(sortedCertificates.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCertificates = sortedCertificates.slice(
    startIndex,
    startIndex + pageSize
  );

  // Update selected all state based on current page
  useEffect(() => {
    const currentPageIds = paginatedCertificates.map((cert) => cert.id);
    const allCurrentPageSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedCertificates.has(id));
    setSelectAll(allCurrentPageSelected);
  }, [paginatedCertificates, selectedCertificates]);

  const handleSort = (field: keyof Certificate) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="text-muted-foreground">
            Manage your certificates, templates, and verification system
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground dark:border-gray-300 flex items-center gap-2 transition-all duration-200 shadow-md">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Certificate Template</DialogTitle>
                <DialogDescription>
                  Design a new certificate template for your organization
                </DialogDescription>
              </DialogHeader>
              <CertificateBuilder
                onSave={handleCreateTemplate}
                onPreview={(template) => setEditingTemplate(template)}
              />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-2 border-gray-500 text-gray-900 bg-white hover:bg-gray-100 hover:text-black hover:border-gray-700 dark:border-border dark:text-muted-foreground dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground dark:hover:border-primary/50 transition-all duration-200 shadow-sm"
              >
                <Database className="h-4 w-4" />
                DB Initialize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Certificate System Initialization</DialogTitle>
                <DialogDescription>
                  Initialize your database with all available certificate
                  templates
                </DialogDescription>
              </DialogHeader>
              <CertificateInitializer />
            </DialogContent>
          </Dialog>

          {/* Preview Dialog */}
          <Dialog
            open={isPreviewDialogOpen}
            onOpenChange={setIsPreviewDialogOpen}
          >
            <DialogContent className="max-w-4xl w-full bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Template Preview
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {previewTemplate?.name} - {previewTemplate?.type}
                </DialogDescription>
              </DialogHeader>
              {previewTemplate && (
                <div className="mt-4">
                  <CertificateTemplatePreview
                    templateData={previewTemplate.templateData}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* View Certificate Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl w-full bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Certificate Details
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Details of the certificate issued to{" "}
                  <span className="font-medium">
                    {viewingCertificate?.recipientName}
                  </span>
                </DialogDescription>
              </DialogHeader>
              {viewingCertificate && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recipient</p>
                      <p className="text-lg font-medium">
                        {viewingCertificate.recipientName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-lg font-medium">
                        {viewingCertificate.recipientEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Certificate ID
                      </p>
                      <p className="text-lg font-medium">
                        {viewingCertificate.certificateId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Issue Date
                      </p>
                      <p className="text-lg font-medium">
                        {new Date(
                          viewingCertificate.issueDate
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Expiry Date
                      </p>
                      <p className="text-lg font-medium">
                        {viewingCertificate.expiryDate
                          ? new Date(
                              viewingCertificate.expiryDate
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(viewingCertificate.status)}
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Template Details
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {viewingCertificate.template.name}
                          </span>
                          <Badge variant="outline">
                            {viewingCertificate.template.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() =>
                        handleDownloadCertificate(viewingCertificate)
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => {
                        setEditingCertificate(viewingCertificate);
                        setIsEditDialogOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Certificate
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => {
                        setDeletingCertificate(viewingCertificate);
                        setIsDeleteDialogOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Certificate
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Certificate Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl w-full bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Edit Certificate
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Update the details of the certificate issued to{" "}
                  <span className="font-medium">
                    {editingCertificate?.recipientName}
                  </span>
                </DialogDescription>
              </DialogHeader>
              {editingCertificate && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recipient</p>
                      <Input
                        value={editingCertificate.recipientName}
                        onChange={(e) =>
                          setEditingCertificate({
                            ...editingCertificate,
                            recipientName: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <Input
                        value={editingCertificate.recipientEmail}
                        onChange={(e) =>
                          setEditingCertificate({
                            ...editingCertificate,
                            recipientEmail: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Certificate ID
                      </p>
                      <Input
                        value={editingCertificate.certificateId}
                        onChange={(e) =>
                          setEditingCertificate({
                            ...editingCertificate,
                            certificateId: e.target.value,
                          })
                        }
                        className="mt-1"
                        disabled
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Issue Date
                      </p>
                      <Input
                        type="datetime-local"
                        value={new Date(editingCertificate.issueDate)
                          .toISOString()
                          .slice(0, 16)}
                        onChange={(e) =>
                          setEditingCertificate({
                            ...editingCertificate,
                            issueDate: new Date(e.target.value).toISOString(),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Expiry Date
                      </p>
                      <Input
                        type="datetime-local"
                        value={
                          editingCertificate.expiryDate
                            ? new Date(editingCertificate.expiryDate)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setEditingCertificate({
                            ...editingCertificate,
                            expiryDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Template Details
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {editingCertificate.template.name}
                          </span>
                          <Badge variant="outline">
                            {editingCertificate.template.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          const response = await fetch(
                            `/api/certificates/${editingCertificate.id}`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify(editingCertificate),
                            }
                          );

                          if (response.ok) {
                            fetchDashboardData();
                            setIsEditDialogOpen(false);
                          }
                        } catch (error) {
                          console.error("Error updating certificate:", error);
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      {actionLoading ? (
                        <span className="animate-spin h-4 w-4 mr-2"></span>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Certificate Confirmation Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent className="max-w-md w-full bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  Confirm Deletion
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Are you sure you want to delete the certificate issued to{" "}
                  <span className="font-medium">
                    {deletingCertificate?.recipientName}
                  </span>
                  ? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="hover:bg-red-600 transition-colors duration-200"
                  onClick={async () => {
                    if (deletingCertificate) {
                      setActionLoading(true);
                      try {
                        const response = await fetch(
                          `/api/certificates/${deletingCertificate.id}`,
                          {
                            method: "DELETE",
                          }
                        );

                        if (response.ok) {
                          fetchDashboardData();
                          setIsDeleteDialogOpen(false);
                        }
                      } catch (error) {
                        console.error("Error deleting certificate:", error);
                      } finally {
                        setActionLoading(false);
                      }
                    }
                  }}
                >
                  {actionLoading ? (
                    <span className="animate-spin h-4 w-4 mr-2"></span>
                  ) : (
                    "Delete Certificate"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all duration-200 ${
              selectedTab === tab.id
                ? "border-primary bg-primary text-white shadow-md dark:text-primary-foreground"
                : "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-primary/50 hover:bg-gray-100 dark:border-border dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-accent"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Certificates
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalCertificates}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCertificates} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verifications
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalVerifications}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total verifications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                <p className="text-xs text-muted-foreground">Total downloads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  {templates.filter((t) => t.status === "ACTIVE").length} active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Certificates</CardTitle>
              <CardDescription>
                Latest certificates issued by your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Award className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{cert.recipientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.template.name} •{" "}
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(cert.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                        onClick={() => handleDownloadCertificate(cert)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certificates Tab */}
      {selectedTab === "certificates" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={pageSize.toString()}
              onValueChange={(value: string) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedCertificates.size > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedCertificates.size} certificate(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDownload}
                      disabled={bulkActionLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCSV}
                      disabled={bulkActionLoading}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkRevoke}
                      disabled={bulkActionLoading}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Revoke All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkActionLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCertificates(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </Card>
          )}

          {/* Certificates Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all certificates"
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("recipientName")}
                    >
                      <div className="flex items-center gap-2">
                        Recipient
                        {sortField === "recipientName" && (
                          <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("issueDate")}
                    >
                      <div className="flex items-center gap-2">
                        Issue Date
                        {sortField === "issueDate" && (
                          <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortField === "status" && (
                          <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Verifications</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCertificates.has(cert.id)}
                          onCheckedChange={(checked: boolean | "indeterminate") =>
                            handleSelectCertificate(cert.id, !!checked)
                          }
                          aria-label={`Select certificate ${cert.certificateId}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.recipientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {cert.recipientEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.template.name}</p>
                          <Badge variant="outline">{cert.template.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell>{cert.downloadCount}</TableCell>
                      <TableCell>{cert.verificationCount}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-background border-border"
                          >
                            <DropdownMenuLabel className="text-foreground">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleDownloadCertificate(cert)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewCertificate(cert)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditCertificate(cert)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Certificate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRevokeAction(cert)}
                              className="text-orange-600"
                              disabled={cert.status === "REVOKED"}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Revoke
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCertificate(cert)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + pageSize, sortedCertificates.length)} of{" "}
              {sortedCertificates.length} certificates
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {selectedTab === "templates" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.type}</CardDescription>
                      {/* Organization Badge */}
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${getOrganizationBadgeStyle(
                            template.organization?.name || "general"
                          )}`}
                        >
                          {getOrganizationAbbreviation(template)}
                        </Badge>
                      </div>
                    </div>
                    {getStatusBadge(template.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {template.certificateCount} certificates issued
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created{" "}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleIssueCertificate(template)}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Issue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === "settings" && (
        <div className="space-y-6">
          <CertificateInitializer />
        </div>
      )}

      {/* Certificate Action Dialogs */}

      {/* View Certificate Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
            <DialogDescription>
              View certificate information and verification details
            </DialogDescription>
          </DialogHeader>
          {viewingCertificate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Certificate ID</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.certificateId}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Verification ID</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.verificationId}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recipient Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.recipientName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recipient Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.recipientEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Template</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.template.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Organization</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.organization.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Issue Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      viewingCertificate.issueDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(viewingCertificate.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Downloads</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.downloadCount}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Verifications</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingCertificate.verificationCount}
                  </p>
                </div>
              </div>
              {viewingCertificate.expiryDate && (
                <div>
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      viewingCertificate.expiryDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            {viewingCertificate && (
              <Button
                onClick={() => handleDownloadCertificate(viewingCertificate)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Certificate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Certificate</DialogTitle>
            <DialogDescription>
              Update certificate recipient information
            </DialogDescription>
          </DialogHeader>
          {editingCertificate && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveEditCertificate(formData);
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Recipient Name</Label>
                  <Input
                    id="edit-name"
                    name="recipientName"
                    defaultValue={editingCertificate.recipientName}
                    placeholder="Enter recipient name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Recipient Email</Label>
                  <Input
                    id="edit-email"
                    name="recipientEmail"
                    type="email"
                    defaultValue={editingCertificate.recipientEmail || ""}
                    placeholder="Enter recipient email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expiry">Expiry Date</Label>
                  <Input
                    id="edit-expiry"
                    name="expiryDate"
                    type="date"
                    defaultValue={
                      editingCertificate.expiryDate
                        ? new Date(editingCertificate.expiryDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Certificate Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Certificate</DialogTitle>
            <DialogDescription>
              This action will revoke the certificate. It can be undone later.
            </DialogDescription>
          </DialogHeader>
          {revokingCertificate && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reason = formData.get("reason") as string;
                confirmRevokeCertificate(reason);
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Certificate</Label>
                  <p className="text-sm text-muted-foreground">
                    {revokingCertificate.certificateId} -{" "}
                    {revokingCertificate.recipientName}
                  </p>
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Revocation</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Enter reason for revoking this certificate..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRevokeDialogOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Revoking..." : "Revoke Certificate"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Certificate Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Certificate</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              certificate and all associated data.
            </DialogDescription>
          </DialogHeader>
          {deletingCertificate && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This action is permanent and cannot
                  be undone.
                </AlertDescription>
              </Alert>
              <div>
                <Label className="text-sm font-medium">
                  Certificate to Delete
                </Label>
                <p className="text-sm text-muted-foreground">
                  {deletingCertificate.certificateId} -{" "}
                  {deletingCertificate.recipientName}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCertificate}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
