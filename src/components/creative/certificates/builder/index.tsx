"use client";

import { useState, useEffect } from "react";
import { useCertificates } from "@/lib/creative/certificates/hooks/use-certificates";
import { getDefaultTemplateData } from "@/lib/creative/certificates/template-builder/certificate";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import { Textarea } from "@/components/creative/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/creative/ui/tabs";
import { useToast } from "@/lib/creative/certificates/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TemplateData,
  TemplateElement,
  CERTIFICATE_CATEGORIES,
  getCategoryInfo,
} from "@/lib/creative/certificates/template-builder/certificate";
import {
  CERTIFICATE_TYPES,
  DESIGN_TEMPLATES,
  createCertificateFromDesignAndType,
  getCertificateTypeById,
  getDesignTemplateById,
} from "@/lib/creative/certificates/template-builder/certificate-design-system";
import { Save, ArrowLeft, Undo, Redo, EyeIcon } from "lucide-react";
import { DesignCanvas } from "./design-canvas";
import { ElementPropertiesPanel } from "./element-properties-panel";
import { PreviewModal } from "./preview-modal";
import { ElementToolbar } from "./element-toolbar";
import { TemplatePropertiesPanel } from "./template-properties-panel";

export default function CertificateTemplateBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const templateId = searchParams.get("id");
  const templateName = searchParams.get("template"); // Support template by name
  const isPreviewMode = searchParams.get("preview") === "true";
  const recipientName = searchParams.get("recipientName") || "Sample Recipient";
  const { getTemplateById, createTemplate, updateTemplate, loading } =
    useCertificates();

  // Template metadata
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("course");
  const [isActive, setIsActive] = useState(true);

  // New design system state
  const [selectedCertificateType, setSelectedCertificateType] =
    useState<string>("appreciation");
  const [selectedDesign, setSelectedDesign] =
    useState<string>("classic-elegant");
  const [showPreview, setShowPreview] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Template design state
  const [templateData, setTemplateData] = useState<TemplateData>(
    getDefaultTemplateData()
  );
  const [selectedElement, setSelectedElement] =
    useState<TemplateElement | null>(null);
  const [history, setHistory] = useState<TemplateData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Fetch template data if editing, or show template starter for new templates
  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId) {
        // Load by ID (editing existing template)
        const template = await getTemplateById(templateId);
        if (template) {
          setName(template.name);
          setDescription(template.description);
          setCategory(template.category);
          setIsActive(template.isActive);
          setTemplateData(template.templateData);

          // Initialize history with the loaded template
          setHistory([template.templateData]);
          setHistoryIndex(0);
          setHasInitialized(true);
        }
      } else if (templateName) {
        // Load by name (preview mode or template selection)
        try {
          const response = await fetch("/api/certificates/template-options");
          if (response.ok) {
            const templates = await response.json();
            const template = templates.find(
              (t: { id: string; name: string }) =>
                t.id === templateName ||
                t.name.toLowerCase().replace(/\s+/g, "-") === templateName
            );

            if (template) {
              setName(template.name);
              setDescription(template.description);
              setCategory(template.category);
              setIsActive(template.isActive);
              setTemplateData(template.templateData);

              // Initialize history with the loaded template
              setHistory([template.templateData]);
              setHistoryIndex(0);
              setHasInitialized(true);
            }
          }
        } catch (error) {
          console.error("Error loading template by name:", error);
        }
      } else if (!hasInitialized) {
        // For new templates, initialize with default template
        setHasInitialized(true);
      }
    };

    loadTemplate();
  }, [templateId, templateName, getTemplateById, hasInitialized]);

  // Add template changes to history for undo/redo
  const addToHistory = (newTemplateData: TemplateData) => {
    // If we're not at the end of history, trim the future states
    const newHistory =
      historyIndex < history.length - 1
        ? history.slice(0, historyIndex + 1)
        : [...history];

    // Add the new state and update the pointer
    setHistory([...newHistory, newTemplateData]);
    setHistoryIndex(newHistory.length);
  };

  // Update the template with new data and add to history
  const updateTemplateData = (newData: TemplateData) => {
    setTemplateData(newData);
    addToHistory(newData);
  };

  // Add a new element to the template
  const addElement = (
    type: "text" | "image" | "shape" | "qr",
    preset?: string
  ) => {
    const id = `element-${Date.now()}`;

    // Get preset-specific defaults
    const getPresetDefaults = (elementType: string, presetType?: string) => {
      const defaults = {
        text: {
          content: "Double click to edit",
          position: { x: 100, y: 100, width: 300, height: 40 },
          style: {
            fontSize: 16,
            fontFamily: "serif",
            color: "#000000",
            fontWeight: "normal",
            textAlign: "center" as const,
          },
        },
        image: {
          content: "",
          position: { x: 100, y: 100, width: 100, height: 100 },
          style: {},
        },
        shape: {
          content: "",
          position: { x: 100, y: 100, width: 100, height: 100 },
          style: {
            color: "#0c436a",
            borderRadius: "0px",
          },
        },
        qr: {
          content: "",
          position: { x: 100, y: 100, width: 80, height: 80 },
          style: {},
        },
      };

      const baseDefaults = defaults[elementType as keyof typeof defaults];

      // Apply preset-specific customizations
      if (presetType) {
        switch (presetType) {
          case "certificate-title":
            return {
              content: "CERTIFICATE OF ACHIEVEMENT",
              position: { x: 80, y: 160, width: 640, height: 40 },
              style: {
                fontSize: 28,
                fontFamily: "serif",
                fontWeight: "bold",
                color: "#172554",
                textAlign: "center" as const,
              },
            };
          case "recipient-name":
            return {
              content: "{{recipientName}}",
              position: { x: 80, y: 275, width: 640, height: 40 },
              style: {
                fontSize: 32,
                fontFamily: "serif",
                fontWeight: "bold",
                color: "#0c436a",
                textAlign: "center" as const,
              },
            };
          case "organization-name":
            return {
              content: "FISHERS OF MEN",
              position: { x: 160, y: 70, width: 480, height: 30 },
              style: {
                fontSize: 24,
                fontFamily: "serif",
                fontWeight: "bold",
                color: "#0c436a",
                textAlign: "center" as const,
              },
            };
          case "description":
            return {
              content:
                "In recognition of your outstanding achievement and dedication to excellence",
              position: { x: 100, y: 330, width: 600, height: 60 },
              style: {
                fontSize: 14,
                fontFamily: "serif",
                color: "#505050",
                textAlign: "center" as const,
              },
            };
          case "date":
            return {
              content: "Date: {{issueDate}}",
              position: { x: 100, y: 500, width: 200, height: 25 },
              style: {
                fontSize: 12,
                fontFamily: "serif",
                color: "#505050",
                textAlign: "left" as const,
              },
            };
          case "covenant-verse":
            return {
              content:
                '"Do not be afraid, for those who are with us are more than those who are with them"',
              position: { x: 80, y: 415, width: 640, height: 25 },
              style: {
                fontSize: 14,
                fontFamily: "serif",
                fontWeight: "italic",
                color: "#172554",
                textAlign: "center" as const,
              },
            };
          case "logo":
            return {
              content: "/Logo.png",
              position: { x: 60, y: 60, width: 80, height: 80 },
              style: {},
            };
          case "signature":
            return {
              content: "",
              position: { x: 500, y: 480, width: 150, height: 50 },
              style: {},
            };
          case "border":
            return {
              content: "",
              position: { x: 20, y: 20, width: 760, height: 560 },
              style: {
                color: "#0c436a",
                borderRadius: "8px",
              },
            };
          case "separator":
            return {
              content: "",
              position: { x: 280, y: 205, width: 240, height: 3 },
              style: {
                color: "#d4af37",
                borderRadius: "2px",
              },
            };
          case "decoration":
            return {
              content: "",
              position: { x: 50, y: 50, width: 60, height: 60 },
              style: {
                color: "#e5e5e5",
                borderRadius: "50%",
              },
            };
          default:
            return baseDefaults;
        }
      }

      return baseDefaults;
    };

    const presetDefaults = getPresetDefaults(type, preset);

    // Create the new element with preset defaults
    const newElement: TemplateElement = {
      id,
      type,
      content: presetDefaults.content,
      position: presetDefaults.position,
      style: presetDefaults.style,
    };

    const newTemplateData = {
      ...templateData,
      elements: [...templateData.elements, newElement],
    };

    updateTemplateData(newTemplateData);
    setSelectedElement(newElement);
  };

  // Update an element's properties
  const updateElement = (updatedElement: TemplateElement) => {
    const newElements = templateData.elements.map((element) =>
      element.id === updatedElement.id ? updatedElement : element
    );

    updateTemplateData({
      ...templateData,
      elements: newElements,
    });

    setSelectedElement(updatedElement);
  };

  // Delete an element
  const deleteElement = (elementId: string) => {
    const newElements = templateData.elements.filter(
      (element) => element.id !== elementId
    );

    updateTemplateData({
      ...templateData,
      elements: newElements,
    });

    setSelectedElement(null);
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTemplateData(history[newIndex]);
      setSelectedElement(null);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTemplateData(history[newIndex]);
      setSelectedElement(null);
    }
  };

  // Save the template
  const handleSave = async () => {
    if (!name) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const templateInfo = {
        name,
        description,
        category,
        isActive,
        templateData,
      };

      if (templateId) {
        await updateTemplate(templateId, templateInfo);
        toast({ title: "Template updated successfully" });
      } else {
        await createTemplate({
          ...templateInfo,
          createdBy: "current-user-id", // This should come from auth context
        });
        toast({ title: "Template created successfully" });
        router.push("/admin/certificates");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive",
      });
    }
  };

  // Generate template from design system
  const generateTemplateFromDesignSystem = () => {
    const generatedTemplate = createCertificateFromDesignAndType(
      selectedDesign,
      selectedCertificateType,
      {
        recipientName: recipientName,
        issuerName: "System Administrator",
        customFields: {},
      }
    );

    if (generatedTemplate) {
      updateTemplateData(generatedTemplate);
      const certType = getCertificateTypeById(selectedCertificateType);
      const design = getDesignTemplateById(selectedDesign);

      if (certType && design) {
        setName(`${certType.name} - ${design.name}`);
        setDescription(`${certType.description} using ${design.description}`);
        setCategory(certType.category);
      }
    }
  };

  // Handle certificate type change
  const handleCertificateTypeChange = (typeId: string) => {
    setSelectedCertificateType(typeId);
    // Auto-regenerate template with new type but same design
    const generatedTemplate = createCertificateFromDesignAndType(
      selectedDesign,
      typeId,
      {
        recipientName: recipientName,
        issuerName: "System Administrator",
        customFields: {},
      }
    );

    if (generatedTemplate) {
      updateTemplateData(generatedTemplate);
      const certType = getCertificateTypeById(typeId);
      const design = getDesignTemplateById(selectedDesign);

      if (certType && design) {
        setName(`${certType.name} - ${design.name}`);
        setDescription(`${certType.description} using ${design.description}`);
        setCategory(certType.category);
      }
    }
  };

  // Handle design change
  const handleDesignChange = (designId: string) => {
    setSelectedDesign(designId);
    // Auto-regenerate template with new design but same type
    const generatedTemplate = createCertificateFromDesignAndType(
      designId,
      selectedCertificateType,
      {
        recipientName: recipientName,
        issuerName: "System Administrator",
        customFields: {},
      }
    );

    if (generatedTemplate) {
      updateTemplateData(generatedTemplate);
      const certType = getCertificateTypeById(selectedCertificateType);
      const design = getDesignTemplateById(designId);

      if (certType && design) {
        setName(`${certType.name} - ${design.name}`);
        setDescription(`${certType.description} using ${design.description}`);
        setCategory(certType.category);
      }
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 w-full flex-shrink-0">
        <div className="flex justify-between items-center max-w-full">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/certificates")}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Certificates
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {templateId
                  ? "Edit Certificate Template"
                  : "Create Certificate Template"}
              </h1>
              <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                Design and customize your certificate template
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {!isPreviewMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Template"}
                </Button>
              </>
            )}
            {isPreviewMode && (
              <Button
                variant="outline"
                onClick={() => window.close()}
                className="flex items-center gap-2"
              >
                Close Preview
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Template Info Form - Hide in preview mode */}
      {!isPreviewMode && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Template Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="category"
                className="text-sm font-medium text-gray-700"
              >
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 bg-white border-gray-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {Object.keys(CERTIFICATE_CATEGORIES).map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">
                        {getCategoryInfo(key).label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="status"
                className="text-sm font-medium text-gray-700"
              >
                Status
              </Label>
              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(value) => setIsActive(value === "active")}
              >
                <SelectTrigger className="mt-1 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem
                    value="active"
                    className="hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                  >
                    <span className="text-gray-900">Active</span>
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                  >
                    <span className="text-gray-900">Inactive</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-1 md:col-span-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter template description"
                rows={1}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Builder Interface */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Left Tools Panel - Hide in preview mode */}
        {!isPreviewMode && (
          <div className="w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-red-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Design Tools
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Build professional certificates with structured elements
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="elements" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mx-4 mt-4">
                  <TabsTrigger value="elements" className="text-xs">
                    Elements
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs">
                    Templates
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs">
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="elements" className="p-4 space-y-4">
                  <ElementToolbar onAddElement={addElement} />
                </TabsContent>

                <TabsContent value="templates" className="p-4 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Design System
                      </h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Choose certificate type and visual design separately
                      </p>
                    </div>

                    {/* Certificate Type Selection */}
                    <div className="space-y-3">
                      <div>
                        <Label
                          htmlFor="certificate-type"
                          className="text-sm font-medium"
                        >
                          Certificate Type
                        </Label>
                        <Select
                          value={selectedCertificateType}
                          onValueChange={handleCertificateTypeChange}
                        >
                          <SelectTrigger className="w-full mt-1 bg-white border-gray-300">
                            <SelectValue placeholder="Select certificate type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                            {CERTIFICATE_TYPES.map((type) => (
                              <SelectItem
                                key={type.id}
                                value={type.id}
                                className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                              >
                                <div className="flex flex-col items-start py-1">
                                  <span className="font-medium text-gray-900">
                                    {type.name}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {type.category}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Design Template Selection */}
                      <div>
                        <Label
                          htmlFor="design-template"
                          className="text-sm font-medium"
                        >
                          Visual Design
                        </Label>
                        <Select
                          value={selectedDesign}
                          onValueChange={handleDesignChange}
                        >
                          <SelectTrigger className="w-full mt-1 bg-white border-gray-300">
                            <SelectValue placeholder="Select visual design" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                            {DESIGN_TEMPLATES.map((design) => (
                              <SelectItem
                                key={design.id}
                                value={design.id}
                                className="hover:bg-purple-50 focus:bg-purple-50 cursor-pointer"
                              >
                                <div className="flex flex-col items-start py-1">
                                  <span className="font-medium text-gray-900">
                                    {design.name}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {design.style} • {design.difficulty}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={generateTemplateFromDesignSystem}
                        className="w-full"
                        variant="outline"
                      >
                        Generate Template
                      </Button>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">
                        DESIGN FLEXIBILITY
                      </h5>
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full mt-2"></div>
                          <span>
                            Mix any certificate type with any visual design
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full mt-2"></div>
                          <span>Content and IDs adapt to certificate type</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full mt-2"></div>
                          <span>
                            Visual layout follows selected design template
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="p-4 space-y-4">
                  <TemplatePropertiesPanel
                    templateData={templateData}
                    updateTemplateData={updateTemplateData}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col">
          {/* Canvas Header */}
          <div className="px-4 py-3 text-center bg-white/50 backdrop-blur-sm border-b border-gray-200/50 flex-shrink-0">
            <h4 className="text-lg font-semibold text-gray-800 mb-1">
              {isPreviewMode
                ? `Certificate Preview - ${recipientName}`
                : "Certificate Design Canvas"}
            </h4>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Header</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Title</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Content</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Covenant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Signatures</span>
              </div>
            </div>
          </div>

          {/* Certificate Canvas - Full size container */}
          <div className="flex-1 min-h-0 bg-gray-100">
            <DesignCanvas
              templateData={templateData}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              updateElement={updateElement}
              isPreviewMode={isPreviewMode}
              recipientName={recipientName}
            />
          </div>

          {/* Canvas Footer */}
          <div className="px-4 py-2 text-center bg-white/50 backdrop-blur-sm border-t border-gray-200/50 flex-shrink-0">
            <p className="text-xs text-gray-500">
              {isPreviewMode
                ? "This is a preview of how the certificate will look when issued"
                : "Double-click elements to edit • Drag to move • Use handles to resize • Follow the section guides for professional layout"}
            </p>
          </div>
        </div>

        {/* Right Properties Panel - Hide in preview mode */}
        {!isPreviewMode && (
          <div className="w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Properties</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedElement ? (
                <ElementPropertiesPanel
                  element={selectedElement}
                  updateElement={updateElement}
                  deleteElement={deleteElement}
                  templateData={templateData}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <EyeIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      No Element Selected
                    </h4>
                    <p className="text-xs text-gray-500">
                      Click on an element in the canvas to edit its properties
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        templateData={templateData}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
