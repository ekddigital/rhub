import { toast } from "sonner";
import type { FlyerTemplateData, FlyerTextBlock } from "../flyer-templates";

type ContentElementId =
  | "headline"
  | "subheadline"
  | "body"
  | "callToAction"
  | "contactInfo";

const contentElementIds: ReadonlyArray<ContentElementId> = [
  "headline",
  "subheadline",
  "body",
  "callToAction",
  "contactInfo",
];

const allowedLogoKeys = new Set(["logo", "logoSize", "logoPosition"]);
const allowedCompanyKeys = new Set([
  "companyName",
  "companyNameColor",
  "companyNameSize",
  "companyNamePosition",
]);

const offsetPosition = (
  position: { x: number; y: number } | undefined,
  defaultY: number,
) => ({
  x: (position?.x ?? 50) + 30,
  y: (position?.y ?? defaultY) + 30,
});

export function useFlyerElementActions(
  template: FlyerTemplateData,
  updateTemplate: (path: string, value: unknown) => void,
) {
  // Handle updating specific element properties
  const handleUpdateElement = (
    elementId: string,
    updates: Record<string, unknown>,
  ) => {
    // Check if it's an original element in content
    if (contentElementIds.includes(elementId as ContentElementId)) {
      Object.keys(updates).forEach((key) => {
        updateTemplate(`content.${elementId}.${key}`, updates[key]);
      });
    } else if (elementId === "logo") {
      Object.keys(updates).forEach((key) => {
        if (allowedLogoKeys.has(key)) {
          updateTemplate(`branding.${key}`, updates[key]);
        }
      });
    } else if (elementId === "companyName") {
      Object.keys(updates).forEach((key) => {
        if (key === "text") {
          updateTemplate("branding.companyName", updates[key]);
        } else if (allowedCompanyKeys.has(key)) {
          updateTemplate(`branding.${key}`, updates[key]);
        }
      });
    } else if (elementId === "qrCode") {
      Object.keys(updates).forEach((key) => {
        updateTemplate(`graphics.qrCode.${key}`, updates[key]);
      });
    } else {
      // It's a duplicate in additionalTextBlocks
      const blocks = template.content.additionalTextBlocks || [];
      const index = blocks.findIndex((b) => b.id === elementId);
      if (index >= 0) {
        const updatedBlocks = [...blocks];
        updatedBlocks[index] = { ...updatedBlocks[index], ...updates };
        updateTemplate("content.additionalTextBlocks", updatedBlocks);
      }
    }
  };

  // Handle duplicating selected element
  const handleDuplicateElement = (elementId: string) => {
    const blocks = template.content.additionalTextBlocks || [];
    let newBlock: FlyerTextBlock | null = null;

    // Create duplicate based on element type
    if (elementId === "headline") {
      newBlock = {
        id: `headline-${Date.now()}`,
        type: "headline",
        text: template.content.headline.text + " (Copy)",
        fontSize: template.content.headline.fontSize,
        fontFamily: template.content.headline.fontFamily,
        color: template.content.headline.color,
        position: {
          x: (template.content.headline.position?.x ?? 50) + 30,
          y: (template.content.headline.position?.y ?? 100) + 30,
        },
        align: template.content.headline.align,
        visible: true,
      };
    } else if (elementId === "subheadline" && template.content.subheadline) {
      const source = template.content.subheadline;
      newBlock = {
        id: `subheadline-${Date.now()}`,
        type: "subheadline",
        text: `${source.text} (Copy)`,
        fontSize: source.fontSize,
        fontFamily: source.fontFamily,
        color: source.color,
        position: offsetPosition(source.position, 200),
        align: source.align,
        visible: true,
      };
    } else if (elementId === "body") {
      const source = template.content.body;
      newBlock = {
        id: `body-${Date.now()}`,
        type: "body",
        text: `${source.text} (Copy)`,
        fontSize: source.fontSize,
        fontFamily: source.fontFamily,
        color: source.color,
        position: offsetPosition(source.position, 200),
        align: source.align,
        visible: true,
      };
    } else if (elementId === "callToAction" && template.content.callToAction) {
      const source = template.content.callToAction;
      newBlock = {
        id: `callToAction-${Date.now()}`,
        type: "callToAction",
        text: `${source.text} (Copy)`,
        fontSize: source.fontSize,
        fontFamily: source.fontFamily,
        color: source.color,
        position: offsetPosition(source.position, 200),
        backgroundColor: source.backgroundColor,
        width: source.width,
        height: source.height,
        visible: true,
      };
    } else {
      // Duplicate an existing duplicate
      const originalBlock = blocks.find((b) => b.id === elementId);
      if (originalBlock) {
        newBlock = {
          ...originalBlock,
          id: `${originalBlock.type}-${Date.now()}`,
          text: originalBlock.text + " (Copy)",
          position: {
            x: originalBlock.position.x + 30,
            y: originalBlock.position.y + 30,
          },
        };
      }
    }

    if (newBlock) {
      updateTemplate("content.additionalTextBlocks", [...blocks, newBlock]);
      toast.success("The element has been copied with an offset position.");
      return newBlock.id;
    }
    return null;
  };

  // Handle deleting an element
  const handleDeleteElement = (elementId: string) => {
    // Only allow deleting duplicates, not original elements
    const blocks = template.content.additionalTextBlocks || [];
    const updatedBlocks = blocks.filter((b) => b.id !== elementId);
    updateTemplate("content.additionalTextBlocks", updatedBlocks);
    toast.success("The duplicate element has been removed.");
  };

  return {
    handleUpdateElement,
    handleDuplicateElement,
    handleDeleteElement,
  };
}
