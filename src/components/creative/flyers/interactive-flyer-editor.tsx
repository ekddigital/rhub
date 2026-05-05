"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlyerTemplateData } from "./flyer-preview";
import { Badge } from "@/components/creative/ui/badge";

import { Move, /* Lock, Unlock, */ Copy, Trash2 } from "lucide-react";
import { useContextMenu } from "./context-menu-provider";
import Image from "next/image";

interface InteractiveFlyerEditorProps {
  template: FlyerTemplateData;
  onUpdateTemplate: (path: string, value: unknown) => void;
  onElementSelect?: (elementId: string | null) => void;
}

type ElementType =
  | "headline"
  | "subheadline"
  | "body"
  | "callToAction"
  | "contactInfo"
  | "logo"
  | "companyName"
  | "qrCode";

type AdditionalTextBlock = NonNullable<
  FlyerTemplateData["content"]["additionalTextBlocks"]
>[number];
type SubheadlineContent = NonNullable<
  FlyerTemplateData["content"]["subheadline"]
>;
type CallToActionContent = NonNullable<
  FlyerTemplateData["content"]["callToAction"]
>;
type ContactInfoContent = NonNullable<
  FlyerTemplateData["content"]["contactInfo"]
>;
type QrCodeContent = NonNullable<
  NonNullable<FlyerTemplateData["graphics"]>["qrCode"]
>;
type LogoSnapshot = Pick<
  FlyerTemplateData["branding"],
  "logo" | "logoSize" | "logoPosition"
>;
type CompanySnapshot = Pick<
  FlyerTemplateData["branding"],
  "companyName" | "companyNamePosition" | "companyNameSize" | "companyNameColor"
>;
type ClipboardElementData =
  | FlyerTemplateData["content"]["headline"]
  | FlyerTemplateData["content"]["body"]
  | SubheadlineContent
  | CallToActionContent
  | ContactInfoContent
  | AdditionalTextBlock
  | QrCodeContent
  | LogoSnapshot
  | CompanySnapshot;

interface ClipboardEntry {
  element: ElementType;
  data: ClipboardElementData;
}

export function InteractiveFlyerEditor({
  template,
  onUpdateTemplate,
  onElementSelect,
}: InteractiveFlyerEditorProps) {
  const { showContextMenu } = useContextMenu();
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clipboard, setClipboard] = useState<ClipboardEntry | null>(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const [selectedCustomImage, setSelectedCustomImage] = useState<number | null>(
    null
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { layout, content, branding, graphics } = template;

  // Helper to update selected element and notify parent
  const updateSelectedElement = (elementId: string | null) => {
    setSelectedElement(elementId as ElementType | null);
    onElementSelect?.(elementId);
  };

  const getLogoPositionAsCoordinates = useCallback((): {
    x: number;
    y: number;
  } => {
    if (
      typeof branding.logoPosition === "object" &&
      branding.logoPosition &&
      "x" in branding.logoPosition
    ) {
      return branding.logoPosition as { x: number; y: number };
    }

    const positionMap: Record<string, { x: number; y: number }> = {
      "top-left": { x: 30, y: 30 },
      "top-center": {
        x: layout.width / 2 - branding.logoSize / 2,
        y: 30,
      },
      "top-right": {
        x: layout.width - branding.logoSize - 30,
        y: 30,
      },
      "bottom-left": {
        x: 30,
        y: layout.height - branding.logoSize - 30,
      },
      "bottom-center": {
        x: layout.width / 2 - branding.logoSize / 2,
        y: layout.height - branding.logoSize - 30,
      },
      "bottom-right": {
        x: layout.width - branding.logoSize - 30,
        y: layout.height - branding.logoSize - 30,
      },
    };

    return positionMap[branding.logoPosition as string] || { x: 30, y: 30 };
  }, [branding.logoPosition, branding.logoSize, layout.height, layout.width]);

  const moveElement = useCallback(
    (element: ElementType, dx: number, dy: number) => {
      if (element.includes("-") && content.additionalTextBlocks) {
        const blockIndex = content.additionalTextBlocks.findIndex(
          (block) => block.id === element
        );
        if (blockIndex !== -1) {
          const currentBlocks = [...content.additionalTextBlocks];
          currentBlocks[blockIndex] = {
            ...currentBlocks[blockIndex],
            position: {
              x: Math.max(0, currentBlocks[blockIndex].position.x + dx),
              y: Math.max(0, currentBlocks[blockIndex].position.y + dy),
            },
          };
          onUpdateTemplate("content.additionalTextBlocks", currentBlocks);
          return;
        }
      }

      switch (element) {
        case "headline":
          onUpdateTemplate("content.headline.position", {
            x: Math.max(0, content.headline.position.x + dx),
            y: Math.max(0, content.headline.position.y + dy),
          });
          break;
        case "subheadline":
          if (content.subheadline) {
            onUpdateTemplate("content.subheadline.position", {
              x: Math.max(0, content.subheadline.position.x + dx),
              y: Math.max(0, content.subheadline.position.y + dy),
            });
          }
          break;
        case "body":
          onUpdateTemplate("content.body.position", {
            x: Math.max(0, content.body.position.x + dx),
            y: Math.max(0, content.body.position.y + dy),
          });
          break;
        case "callToAction":
          if (content.callToAction) {
            onUpdateTemplate("content.callToAction.position", {
              x: Math.max(0, content.callToAction.position.x + dx),
              y: Math.max(0, content.callToAction.position.y + dy),
            });
          }
          break;
        case "contactInfo":
          if (content.contactInfo) {
            onUpdateTemplate("content.contactInfo.position", {
              x: Math.max(0, content.contactInfo.position.x + dx),
              y: Math.max(0, content.contactInfo.position.y + dy),
            });
          }
          break;
        case "qrCode":
          if (graphics?.qrCode) {
            onUpdateTemplate("graphics.qrCode.position", {
              x: Math.max(0, graphics.qrCode.position.x + dx),
              y: Math.max(0, graphics.qrCode.position.y + dy),
            });
          }
          break;
        case "logo":
          const currentLogoPos = getLogoPositionAsCoordinates();
          onUpdateTemplate("branding.logoPosition", {
            x: Math.max(
              0,
              Math.min(currentLogoPos.x + dx, layout.width - branding.logoSize)
            ),
            y: Math.max(
              0,
              Math.min(currentLogoPos.y + dy, layout.height - branding.logoSize)
            ),
          });
          break;
        case "companyName":
          if (branding.companyNamePosition) {
            onUpdateTemplate("branding.companyNamePosition", {
              x: Math.max(0, branding.companyNamePosition.x + dx),
              y: Math.max(0, branding.companyNamePosition.y + dy),
            });
          } else {
            const defaultPos = {
              x: layout.width / 2,
              y: branding.logo ? branding.logoSize + 45 : 100,
            };
            onUpdateTemplate("branding.companyNamePosition", {
              x: Math.max(0, defaultPos.x + dx),
              y: Math.max(0, defaultPos.y + dy),
            });
          }
          break;
      }
    },
    [
      branding,
      content,
      getLogoPositionAsCoordinates,
      graphics,
      layout.height,
      layout.width,
      onUpdateTemplate,
    ]
  );

  const copyToClipboard = useCallback(
    (element: ElementType) => {
      let data: ClipboardElementData | null = null;
      let elementType: ElementType = element;

      if (element.includes("-") && content.additionalTextBlocks) {
        const block = content.additionalTextBlocks.find(
          (blockItem) => blockItem.id === element
        );
        if (block) {
          elementType = block.type as ElementType;
          data = { ...block } as AdditionalTextBlock;
        }
      }

      if (!data) {
        switch (element) {
          case "headline":
            data = { ...content.headline };
            break;
          case "subheadline":
            if (content.subheadline) {
              data = { ...content.subheadline } as SubheadlineContent;
            }
            break;
          case "body":
            data = { ...content.body };
            break;
          case "callToAction":
            if (content.callToAction) {
              data = { ...content.callToAction } as CallToActionContent;
            }
            break;
          case "contactInfo":
            if (content.contactInfo) {
              data = { ...content.contactInfo } as ContactInfoContent;
            }
            break;
          case "logo":
            data = {
              logo: branding.logo,
              logoSize: branding.logoSize,
              logoPosition: branding.logoPosition,
            } as LogoSnapshot;
            break;
          case "companyName":
            data = {
              companyName: branding.companyName,
              companyNamePosition: branding.companyNamePosition,
              companyNameSize: branding.companyNameSize,
              companyNameColor: branding.companyNameColor,
            } as CompanySnapshot;
            break;
          case "qrCode":
            if (graphics?.qrCode) {
              data = { ...graphics.qrCode } as QrCodeContent;
            }
            break;
        }
      }

      if (data) {
        setClipboard({ element: elementType, data });
      }
    },
    [branding, content, graphics]
  );

  const pasteFromClipboard = useCallback(() => {
    if (!clipboard) {
      console.log("No clipboard data");
      return;
    }

    const { element, data } = clipboard;
    const newId = `${element}-${Date.now()}`;
    const currentBlocks = content.additionalTextBlocks || [];

    switch (element) {
      case "headline": {
        const source = data as FlyerTemplateData["content"]["headline"];
        const newHeadlineBlock = {
          id: newId,
          type: "headline" as const,
          text: `${source.text} (Copy)`,
          fontSize: source.fontSize,
          fontFamily: source.fontFamily,
          color: source.color,
          position: {
            x: Math.max(
              0,
              Math.min(source.position.x + 30, layout.width - 100)
            ),
            y: Math.max(
              0,
              Math.min(source.position.y + 30, layout.height - 100)
            ),
          },
          align: source.align,
          visible: true,
        };
        onUpdateTemplate("content.additionalTextBlocks", [
          ...currentBlocks,
          newHeadlineBlock,
        ]);
        break;
      }
      case "subheadline": {
        const source = data as SubheadlineContent;
        const newSubheadlineBlock = {
          id: newId,
          type: "subheadline" as const,
          text: `${source.text || ""} (Copy)`,
          fontSize: source.fontSize,
          fontFamily: source.fontFamily,
          color: source.color,
          position: {
            x: Math.max(
              0,
              Math.min(source.position.x + 30, layout.width - 100)
            ),
            y: Math.max(
              0,
              Math.min(source.position.y + 30, layout.height - 100)
            ),
          },
          align: source.align,
          visible: true,
        };
        onUpdateTemplate("content.additionalTextBlocks", [
          ...currentBlocks,
          newSubheadlineBlock,
        ]);
        break;
      }
      case "body": {
        const source = data as FlyerTemplateData["content"]["body"];
        const newBodyBlock = {
          id: newId,
          type: "body" as const,
          text: `${source.text}\n(Copy)`,
          fontSize: source.fontSize,
          fontFamily: source.fontFamily,
          color: source.color,
          position: {
            x: Math.max(
              0,
              Math.min(source.position.x + 30, layout.width - 100)
            ),
            y: Math.max(
              0,
              Math.min(source.position.y + 30, layout.height - 100)
            ),
          },
          align: source.align,
          visible: true,
        };
        onUpdateTemplate("content.additionalTextBlocks", [
          ...currentBlocks,
          newBodyBlock,
        ]);
        break;
      }
      case "callToAction": {
        const source = data as CallToActionContent;
        const newCTABlock = {
          id: newId,
          type: "callToAction" as const,
          text: `${source.text || ""} (Copy)`,
          fontSize: source.fontSize,
          fontFamily: source.fontFamily,
          color: source.color,
          backgroundColor: source.backgroundColor,
          position: {
            x: Math.max(
              0,
              Math.min(source.position.x + 30, layout.width - 100)
            ),
            y: Math.max(
              0,
              Math.min(source.position.y + 30, layout.height - 100)
            ),
          },
          width: source.width,
          height: source.height,
          visible: true,
        };
        onUpdateTemplate("content.additionalTextBlocks", [
          ...currentBlocks,
          newCTABlock,
        ]);
        break;
      }
      case "contactInfo": {
        const source = data as ContactInfoContent;
        const newContactBlock = {
          id: newId,
          type: "contactInfo" as const,
          text: `${source.email ? `📧 ${source.email}\n` : ""}${
            source.phone ? `📱 ${source.phone}\n` : ""
          }${source.website ? `🌐 ${source.website}` : ""}`,
          fontSize: source.fontSize,
          fontFamily: "Arial, sans-serif",
          color: source.color,
          position: {
            x: Math.max(
              0,
              Math.min(source.position.x + 30, layout.width - 100)
            ),
            y: Math.max(
              0,
              Math.min(source.position.y + 30, layout.height - 100)
            ),
          },
          visible: true,
        };
        onUpdateTemplate("content.additionalTextBlocks", [
          ...currentBlocks,
          newContactBlock,
        ]);
        break;
      }
      case "qrCode": {
        const source = data as QrCodeContent;
        onUpdateTemplate("graphics.qrCode", {
          ...source,
          position: {
            x: Math.max(
              0,
              Math.min(source.position.x + 30, layout.width - 100)
            ),
            y: Math.max(
              0,
              Math.min(source.position.y + 30, layout.height - 100)
            ),
          },
        });
        break;
      }
      case "logo":
      case "companyName":
        console.log("Cannot paste unique elements (logo/companyName)");
        break;
    }
  }, [
    clipboard,
    content.additionalTextBlocks,
    layout.height,
    layout.width,
    onUpdateTemplate,
  ]);

  const deleteElement = useCallback(
    (element: ElementType) => {
      if (element.includes("-") && content.additionalTextBlocks) {
        const filteredBlocks = content.additionalTextBlocks.filter(
          (block) => block.id !== element
        );
        onUpdateTemplate("content.additionalTextBlocks", filteredBlocks);
        setSelectedElement(null);
        return;
      }

      switch (element) {
        case "headline":
          onUpdateTemplate("visibility.headline", false);
          break;
        case "subheadline":
          onUpdateTemplate("visibility.subheadline", false);
          break;
        case "body":
          onUpdateTemplate("visibility.body", false);
          break;
        case "callToAction":
          onUpdateTemplate("visibility.callToAction", false);
          break;
        case "contactInfo":
          onUpdateTemplate("visibility.contactInfo", false);
          break;
        case "logo":
          onUpdateTemplate("visibility.logo", false);
          break;
        case "companyName":
          onUpdateTemplate("visibility.companyName", false);
          break;
        case "qrCode":
          onUpdateTemplate("visibility.qrCode", false);
          break;
      }

      setSelectedElement(null);
    },
    [content.additionalTextBlocks, onUpdateTemplate]
  );

  // Handle keyboard shortcuts for positioning, copy, paste, delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement) return;

      // Check if user is typing in an input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.getAttribute("contenteditable") === "true";

      // If user is typing, don't intercept their keyboard input
      if (isTyping) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Copy (Cmd+C or Ctrl+C)
      if (isCtrlOrCmd && e.key === "c") {
        e.preventDefault();
        copyToClipboard(selectedElement);
        return;
      }

      // Paste (Cmd+V or Ctrl+V)
      if (isCtrlOrCmd && e.key === "v") {
        e.preventDefault();
        pasteFromClipboard();
        return;
      }

      // Delete (Delete or Backspace) - only when NOT typing
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteElement(selectedElement);
        return;
      }

      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 10 : 1; // Shift key for bigger steps

      switch (e.key) {
        case "ArrowUp":
          dy = -step;
          e.preventDefault();
          break;
        case "ArrowDown":
          dy = step;
          e.preventDefault();
          break;
        case "ArrowLeft":
          dx = -step;
          e.preventDefault();
          break;
        case "ArrowRight":
          dx = step;
          e.preventDefault();
          break;
        default:
          return;
      }

      moveElement(selectedElement, dx, dy);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElement,
    copyToClipboard,
    deleteElement,
    moveElement,
    pasteFromClipboard,
  ]);

  const handleMouseDown = (
    e: React.MouseEvent,
    element: ElementType,
    currentPos: { x: number; y: number }
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    updateSelectedElement(element);
    setIsDragging(true);

    const rect = containerRef.current.getBoundingClientRect();

    // Calculate offset from element position to mouse position
    setDragStart({
      x: e.clientX - rect.left - currentPos.x,
      y: e.clientY - rect.top - currentPos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle custom image resize
    if (isResizing) {
      handleResizeMove(e);
      return;
    }

    // Handle custom image drag
    if (isDragging && selectedCustomImage !== null) {
      handleCustomImageMove(e);
      return;
    }

    // Handle regular element drag
    if (!isDragging || !selectedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Calculate new position relative to container
    const newX = Math.max(
      0,
      Math.min(e.clientX - rect.left - dragStart.x, layout.width - 50)
    );
    const newY = Math.max(
      0,
      Math.min(e.clientY - rect.top - dragStart.y, layout.height - 50)
    );

    const currentPos = getCurrentPosition(selectedElement);
    const dx = newX - currentPos.x;
    const dy = newY - currentPos.y;

    moveElement(selectedElement, dx, dy);
  };

  const handleMouseUp = () => {
    handleMouseUpGlobal();
  };

  // Drag and Drop handlers for images from Asset Library
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropZoneActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropZoneActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropZoneActive(false);

    // Get the image URL from the drag data
    const imageUrl = e.dataTransfer.getData("text/plain");
    if (!imageUrl || !containerRef.current) return;

    // Calculate drop position relative to canvas
    const rect = containerRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;

    // Create a new image element at the drop position
    // For now, we'll add it as an additional graphic element
    const newImageElement = {
      url: imageUrl,
      position: { x: dropX - 50, y: dropY - 50 }, // Center on drop point
      size: { width: 100, height: 100 },
    };

    // Add to graphics.customImages array
    const currentImages = template.graphics?.customImages || [];
    onUpdateTemplate("graphics.customImages", [
      ...currentImages,
      newImageElement,
    ]);

    // Select the newly added image
    const newIndex = currentImages.length;
    setSelectedCustomImage(newIndex);
    updateSelectedElement(`custom-image-${newIndex}` as ElementType);
  };

  // Custom Image Handlers
  const handleCustomImageMouseDown = (
    e: React.MouseEvent,
    index: number,
    currentPos: { x: number; y: number }
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    setSelectedCustomImage(index);
    updateSelectedElement(`custom-image-${index}` as ElementType);
    setIsDragging(true);

    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - currentPos.x,
      y: e.clientY - rect.top - currentPos.y,
    });
  };

  const handleCustomImageMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedCustomImage === null || !containerRef.current)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    const customImages = graphics?.customImages || [];
    const image = customImages[selectedCustomImage];

    if (!image) return;

    const newX = Math.max(
      0,
      Math.min(
        e.clientX - rect.left - dragStart.x,
        layout.width - image.size.width
      )
    );
    const newY = Math.max(
      0,
      Math.min(
        e.clientY - rect.top - dragStart.y,
        layout.height - image.size.height
      )
    );

    const updatedImages = [...customImages];
    updatedImages[selectedCustomImage] = {
      ...image,
      position: { x: newX, y: newY },
    };

    onUpdateTemplate("graphics.customImages", updatedImages);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    index: number,
    handle: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedCustomImage(index);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing || !containerRef.current || !resizeHandle) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Handle custom image resize
    if (
      selectedCustomImage !== null &&
      (resizeHandle === "nw" ||
        resizeHandle === "ne" ||
        resizeHandle === "sw" ||
        resizeHandle === "se")
    ) {
      const customImages = graphics?.customImages || [];
      const image = customImages[selectedCustomImage];

      if (!image) return;

      let newWidth = image.size.width;
      let newHeight = image.size.height;
      let newX = image.position.x;
      let newY = image.position.y;

      // Calculate new size based on handle
      switch (resizeHandle) {
        case "se": // Bottom-right corner
          newWidth = Math.max(50, mouseX - image.position.x);
          newHeight = Math.max(50, mouseY - image.position.y);
          break;
        case "sw": // Bottom-left corner
          newWidth = Math.max(50, image.position.x + image.size.width - mouseX);
          newHeight = Math.max(50, mouseY - image.position.y);
          newX = Math.min(mouseX, image.position.x + image.size.width - 50);
          break;
        case "ne": // Top-right corner
          newWidth = Math.max(50, mouseX - image.position.x);
          newHeight = Math.max(
            50,
            image.position.y + image.size.height - mouseY
          );
          newY = Math.min(mouseY, image.position.y + image.size.height - 50);
          break;
        case "nw": // Top-left corner
          newWidth = Math.max(50, image.position.x + image.size.width - mouseX);
          newHeight = Math.max(
            50,
            image.position.y + image.size.height - mouseY
          );
          newX = Math.min(mouseX, image.position.x + image.size.width - 50);
          newY = Math.min(mouseY, image.position.y + image.size.height - 50);
          break;
      }

      const updatedImages = [...customImages];
      updatedImages[selectedCustomImage] = {
        ...image,
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
      };

      onUpdateTemplate("graphics.customImages", updatedImages);
      return;
    }

    // Handle logo resize
    if (resizeHandle.startsWith("logo-")) {
      const logoPos = getLogoPositionAsCoordinates();
      const currentSize = branding.logoSize;

      let newSize = currentSize;
      let newX = logoPos.x;
      let newY = logoPos.y;

      const handleType = resizeHandle.split("-")[1];
      switch (handleType) {
        case "se": // Bottom-right corner
          newSize = Math.max(
            30,
            Math.min(mouseX - logoPos.x, mouseY - logoPos.y)
          );
          break;
        case "sw": // Bottom-left corner
          newSize = Math.max(
            30,
            Math.min(logoPos.x + currentSize - mouseX, mouseY - logoPos.y)
          );
          newX = logoPos.x + currentSize - newSize;
          break;
        case "ne": // Top-right corner
          newSize = Math.max(
            30,
            Math.min(mouseX - logoPos.x, logoPos.y + currentSize - mouseY)
          );
          newY = logoPos.y + currentSize - newSize;
          break;
        case "nw": // Top-left corner
          newSize = Math.max(
            30,
            Math.min(
              logoPos.x + currentSize - mouseX,
              logoPos.y + currentSize - mouseY
            )
          );
          newX = logoPos.x + currentSize - newSize;
          newY = logoPos.y + currentSize - newSize;
          break;
      }

      onUpdateTemplate("branding.logoSize", newSize);
      onUpdateTemplate("branding.logoPosition", { x: newX, y: newY });
      return;
    }

    // Handle QR code resize
    if (resizeHandle.startsWith("qrCode-") && graphics?.qrCode) {
      const qrPos = graphics.qrCode.position;
      const currentWidth = graphics.qrCode.size.width;
      const currentHeight = graphics.qrCode.size.height;

      let newWidth = currentWidth;
      let newHeight = currentHeight;
      let newX = qrPos.x;
      let newY = qrPos.y;

      const handleType = resizeHandle.split("-")[1];
      switch (handleType) {
        case "se": // Bottom-right corner
          newWidth = Math.max(50, mouseX - qrPos.x);
          newHeight = Math.max(50, mouseY - qrPos.y);
          break;
        case "sw": // Bottom-left corner
          newWidth = Math.max(50, qrPos.x + currentWidth - mouseX);
          newHeight = Math.max(50, mouseY - qrPos.y);
          newX = qrPos.x + currentWidth - newWidth;
          break;
        case "ne": // Top-right corner
          newWidth = Math.max(50, mouseX - qrPos.x);
          newHeight = Math.max(50, qrPos.y + currentHeight - mouseY);
          newY = qrPos.y + currentHeight - newHeight;
          break;
        case "nw": // Top-left corner
          newWidth = Math.max(50, qrPos.x + currentWidth - mouseX);
          newHeight = Math.max(50, qrPos.y + currentHeight - mouseY);
          newX = qrPos.x + currentWidth - newWidth;
          newY = qrPos.y + currentHeight - newHeight;
          break;
      }

      onUpdateTemplate("graphics.qrCode.size", {
        width: newWidth,
        height: newHeight,
      });
      onUpdateTemplate("graphics.qrCode.position", { x: newX, y: newY });
      return;
    }
  };

  const handleMouseUpGlobal = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const deleteCustomImage = (index: number) => {
    const customImages = graphics?.customImages || [];
    const updatedImages = customImages.filter((_, i) => i !== index);
    onUpdateTemplate("graphics.customImages", updatedImages);
    setSelectedCustomImage(null);
    updateSelectedElement(null);
  };

  const getCurrentPosition = (
    element: ElementType
  ): { x: number; y: number } => {
    // Check if it's a duplicate element (additional text block)
    if (element.includes("-") && content.additionalTextBlocks) {
      const block = content.additionalTextBlocks.find(
        (block) => block.id === element
      );
      if (block) {
        return block.position;
      }
    }

    switch (element) {
      case "headline":
        return content.headline.position;
      case "subheadline":
        return content.subheadline?.position || { x: 0, y: 0 };
      case "body":
        return content.body.position;
      case "callToAction":
        return content.callToAction?.position || { x: 0, y: 0 };
      case "contactInfo":
        return content.contactInfo?.position || { x: 0, y: 0 };
      case "qrCode":
        return graphics?.qrCode?.position || { x: 0, y: 0 };
      case "logo":
        return getLogoPositionAsCoordinates();
      case "companyName":
        return (
          branding.companyNamePosition || {
            x: layout.width / 2,
            y: branding.logo ? branding.logoSize + 45 : 100,
          }
        );
      default:
        return { x: 0, y: 0 };
    }
  };

  const DraggableElement = ({
    element,
    position,
    children,
    className = "",
  }: {
    element: ElementType;
    position: { x: number; y: number };
    children: React.ReactNode;
    className?: string;
  }) => {
    const isSelected = selectedElement === element;

    return (
      <div
        className={`absolute cursor-move group ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: isSelected ? 50 : 20,
        }}
        onMouseDown={(e) => handleMouseDown(e, element, position)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateSelectedElement(element);
          showContextMenu(
            { x: e.clientX, y: e.clientY },
            {
              elementId: element,
              elementType: element,
            }
          );
        }}
      >
        {isSelected && (
          <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50 flex items-center gap-2">
            <Move className="w-3 h-3 inline" />
            {element} - x: {position.x}, y: {position.y}
            <span className="text-xs opacity-75">
              (Right-click for options)
            </span>
          </div>
        )}
        <div
          className={`${
            isSelected
              ? "ring-2 ring-blue-500 ring-offset-2"
              : "group-hover:ring-2 group-hover:ring-blue-300"
          } transition-all`}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          🎯 Interactive Editing Mode
          {clipboard && (
            <Badge variant="secondary" className="text-xs">
              Clipboard: {clipboard.element}
            </Badge>
          )}
          {isDropZoneActive && (
            <Badge variant="default" className="text-xs bg-green-600">
              Drop Image Here!
            </Badge>
          )}
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Drag images</strong> from Asset Library onto canvas to add
            them
          </li>
          <li>• Click any element to select it</li>
          <li>• Drag elements to reposition them</li>
          <li>• Use arrow keys ← ↑ → ↓ for precise positioning</li>
          <li>• Hold Shift + arrows for bigger steps (10px)</li>
          <li>
            • <strong>Cmd/Ctrl+C</strong>: Copy selected element to clipboard
          </li>
          <li>
            • <strong>Cmd/Ctrl+V</strong>: Paste - moves element to new position
            with &ldquo;(Copy)&rdquo; text
          </li>
          <li>
            • <strong>Delete/Backspace</strong>: Hide selected element
          </li>
          <li>
            • Click <Copy className="w-3 h-3 inline" /> to copy element to
            clipboard
          </li>
          <li>
            • Click <Trash2 className="w-3 h-3 inline" /> to hide element
          </li>
          <li>
            • Selected: <Badge variant="default">Blue highlight</Badge>
          </li>
        </ul>
      </div>

      {/* Interactive Flyer Canvas */}
      <div
        id="live-flyer-preview"
        ref={containerRef}
        className={`relative border-4 shadow-2xl overflow-hidden mx-auto transition-all ${
          isDropZoneActive
            ? "border-green-500 bg-green-50/30"
            : "border-blue-300"
        }`}
        style={{
          width: `${layout.width}px`,
          height: `${layout.height}px`,
          backgroundColor: layout.backgroundColor,
          cursor: isDragging ? "grabbing" : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => updateSelectedElement(null)}
      >
        {/* Background Image with Overlay */}
        {layout.backgroundImage && (
          <>
            <Image
              src={layout.backgroundImage}
              alt="Background"
              fill
              className="absolute inset-0 object-cover pointer-events-none"
              style={{ zIndex: 0 }}
              crossOrigin="anonymous"
              sizes={`${layout.width}px`}
              unoptimized
            />
            {layout.overlayColor && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: layout.overlayColor,
                  opacity: layout.overlayOpacity || 0.5,
                  zIndex: 1,
                }}
              />
            )}
          </>
        )}

        {/* Shapes (non-draggable for now) */}
        {graphics?.shapes?.map((shape, index) => (
          <div
            key={`shape-${index}`}
            className="absolute pointer-events-none"
            style={{
              left: `${shape.position.x}px`,
              top: `${shape.position.y}px`,
              width: `${shape.size.width}px`,
              height: `${shape.size.height}px`,
              backgroundColor: shape.color,
              borderRadius: shape.type === "circle" ? "50%" : "0",
              zIndex: 2,
            }}
          />
        ))}

        {/* Draggable Logo with Resize Handles */}
        {template.visibility?.logo !== false && branding.logo && (
          <div
            className={`absolute ${
              selectedElement === "logo"
                ? "ring-2 ring-blue-500 cursor-grab active:cursor-grabbing"
                : "hover:ring-2 hover:ring-blue-400 cursor-pointer"
            }`}
            style={{
              left: `${getLogoPositionAsCoordinates().x}px`,
              top: `${getLogoPositionAsCoordinates().y}px`,
              width: `${branding.logoSize}px`,
              height: `${branding.logoSize}px`,
              zIndex: selectedElement === "logo" ? 100 : 10,
            }}
            onMouseDown={(e) => {
              if (e.button === 0 && !isResizing) {
                const rect = containerRef.current!.getBoundingClientRect();
                const logoPos = getLogoPositionAsCoordinates();
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - rect.left - logoPos.x,
                  y: e.clientY - rect.top - logoPos.y,
                });
                updateSelectedElement("logo");
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              updateSelectedElement("logo");
            }}
          >
            <Image
              src={branding.logo}
              alt="Logo"
              width={branding.logoSize}
              height={branding.logoSize}
              className="w-full h-full object-contain pointer-events-none"
              crossOrigin="anonymous"
              draggable={false}
              unoptimized
            />

            {selectedElement === "logo" && (
              <>
                {/* Label with delete button */}
                <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-2 whitespace-nowrap">
                  <span>Logo</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTemplate("branding.logo", "");
                      updateSelectedElement(null);
                    }}
                    className="hover:bg-blue-600 rounded px-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Resize Handles */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("logo-nw");
                    updateSelectedElement("logo");
                  }}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("logo-ne");
                    updateSelectedElement("logo");
                  }}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("logo-sw");
                    updateSelectedElement("logo");
                  }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("logo-se");
                    updateSelectedElement("logo");
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Draggable Company Name */}
        {template.visibility?.companyName !== false && branding.companyName && (
          <DraggableElement
            element="companyName"
            position={getCurrentPosition("companyName")}
          >
            <div
              className="text-center"
              style={{
                fontSize: `${branding.companyNameSize}px`,
                color: branding.companyNameColor,
                fontWeight: "bold",
                transform: "translateX(-50%)",
              }}
            >
              {branding.companyName}
            </div>
          </DraggableElement>
        )}

        {/* Draggable Headline */}
        {template.visibility?.headline !== false && (
          <DraggableElement
            element="headline"
            position={content.headline.position}
          >
            <div
              style={{
                fontSize: `${content.headline.fontSize}px`,
                fontFamily: content.headline.fontFamily,
                color: content.headline.color,
                textAlign: content.headline.align,
                width: `${layout.width - content.headline.position.x * 2}px`,
                textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
                fontWeight: "bold",
              }}
            >
              {content.headline.text}
            </div>
          </DraggableElement>
        )}

        {/* Draggable Subheadline */}
        {template.visibility?.subheadline !== false && content.subheadline && (
          <DraggableElement
            element="subheadline"
            position={content.subheadline.position}
          >
            <div
              style={{
                fontSize: `${content.subheadline.fontSize}px`,
                fontFamily: content.subheadline.fontFamily,
                color: content.subheadline.color,
                textAlign: content.subheadline.align,
                width: `${layout.width - content.subheadline.position.x * 2}px`,
                whiteSpace: "pre-wrap",
              }}
            >
              {content.subheadline.text}
            </div>
          </DraggableElement>
        )}

        {/* Draggable Body Text */}
        {template.visibility?.body !== false && (
          <DraggableElement element="body" position={content.body.position}>
            <div
              style={{
                fontSize: `${content.body.fontSize}px`,
                fontFamily: content.body.fontFamily,
                color: content.body.color,
                textAlign: content.body.align,
                width: `${layout.width - content.body.position.x * 2}px`,
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {content.body.text}
            </div>
          </DraggableElement>
        )}

        {/* Draggable Call to Action */}
        {template.visibility?.callToAction !== false &&
          content.callToAction && (
            <DraggableElement
              element="callToAction"
              position={content.callToAction.position}
            >
              <div
                className="flex items-center justify-center font-bold rounded-lg shadow-lg"
                style={{
                  width: `${content.callToAction.width}px`,
                  height: `${content.callToAction.height}px`,
                  backgroundColor: content.callToAction.backgroundColor,
                  color: content.callToAction.color,
                  fontSize: `${content.callToAction.fontSize}px`,
                  fontFamily: content.callToAction.fontFamily,
                }}
              >
                {content.callToAction.text}
              </div>
            </DraggableElement>
          )}

        {/* Draggable Contact Info */}
        {template.visibility?.contactInfo !== false && content.contactInfo && (
          <DraggableElement
            element="contactInfo"
            position={content.contactInfo.position}
          >
            <div
              style={{
                fontSize: `${content.contactInfo.fontSize}px`,
                color: content.contactInfo.color,
                lineHeight: "1.8",
                whiteSpace: "pre-wrap",
              }}
            >
              {content.contactInfo.email && (
                <div>📧 {content.contactInfo.email}</div>
              )}
              {content.contactInfo.phone && (
                <div>📱 {content.contactInfo.phone}</div>
              )}
              {content.contactInfo.website && (
                <div>🌐 {content.contactInfo.website}</div>
              )}
              {content.contactInfo.address && (
                <div>📍 {content.contactInfo.address}</div>
              )}
            </div>
          </DraggableElement>
        )}

        {/* Draggable QR Code with Resize Handles */}
        {template.visibility?.qrCode !== false && graphics?.qrCode && (
          <div
            className={`absolute ${
              selectedElement === "qrCode"
                ? "ring-2 ring-blue-500 cursor-grab active:cursor-grabbing"
                : "hover:ring-2 hover:ring-blue-400 cursor-pointer"
            }`}
            style={{
              left: `${graphics.qrCode.position.x}px`,
              top: `${graphics.qrCode.position.y}px`,
              width: `${graphics.qrCode.size.width}px`,
              height: `${graphics.qrCode.size.height}px`,
              zIndex: selectedElement === "qrCode" ? 100 : 10,
            }}
            onMouseDown={(e) => {
              if (e.button === 0 && !isResizing && graphics?.qrCode) {
                const rect = containerRef.current!.getBoundingClientRect();
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - rect.left - graphics.qrCode.position.x,
                  y: e.clientY - rect.top - graphics.qrCode.position.y,
                });
                updateSelectedElement("qrCode");
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              updateSelectedElement("qrCode");
            }}
          >
            <div className="bg-white border-2 border-gray-300 rounded flex flex-col items-center justify-center p-2 w-full h-full">
              {graphics.qrCode.url ? (
                <Image
                  src={graphics.qrCode.url}
                  alt="QR Code"
                  width={graphics.qrCode.size.width}
                  height={graphics.qrCode.size.height}
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  draggable={false}
                  unoptimized
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-xs font-bold">
                    {graphics.qrCode.label || "SCAN HERE"}
                  </div>
                </div>
              )}
            </div>

            {selectedElement === "qrCode" && (
              <>
                {/* Label with delete button */}
                <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-2 whitespace-nowrap">
                  <span>QR Code</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTemplate("graphics.qrCode", null);
                      updateSelectedElement(null);
                    }}
                    className="hover:bg-blue-600 rounded px-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Resize Handles */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("qrCode-nw");
                    updateSelectedElement("qrCode");
                  }}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("qrCode-ne");
                    updateSelectedElement("qrCode");
                  }}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("qrCode-sw");
                    updateSelectedElement("qrCode");
                  }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle("qrCode-se");
                    updateSelectedElement("qrCode");
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Custom Draggable Images (Dropped from Asset Library) */}
        {graphics?.customImages?.map((image, index) => {
          const isSelected = selectedCustomImage === index;

          // Check visibility
          if (image.visible === false) {
            return null;
          }

          return (
            <div
              key={`custom-image-${index}`}
              className={`absolute group transition-all ${
                isSelected
                  ? "ring-2 ring-blue-500"
                  : "hover:ring-2 hover:ring-blue-400"
              }`}
              style={{
                left: `${image.position.x}px`,
                top: `${image.position.y}px`,
                width: `${image.size.width}px`,
                height: `${image.size.height}px`,
                zIndex:
                  image.zIndex !== undefined
                    ? image.zIndex
                    : isSelected
                    ? 100
                    : 10,
                cursor:
                  isDragging && selectedCustomImage === index
                    ? "grabbing"
                    : "grab",
              }}
              onMouseDown={(e) =>
                handleCustomImageMouseDown(e, index, image.position)
              }
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomImage(index);
                updateSelectedElement(`custom-image-${index}` as ElementType);
              }}
            >
              <Image
                src={image.url}
                alt={`Custom image ${index + 1}`}
                width={image.size.width}
                height={image.size.height}
                className="w-full h-full object-cover rounded pointer-events-none select-none"
                crossOrigin="anonymous"
                draggable={false}
                unoptimized
              />

              {/* Selection Border & Label */}
              {isSelected && (
                <>
                  <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
                  <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-t whitespace-nowrap flex items-center gap-2">
                    <span>Custom Image {index + 1}</span>
                    <button
                      className="hover:bg-blue-600 px-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomImage(index);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Resize Handles */}
                  {/* Top-left */}
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, index, "nw")}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Top-right */}
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, index, "ne")}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Bottom-left */}
                  <div
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, index, "sw")}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Bottom-right */}
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, index, "se")}
                    onClick={(e) => e.stopPropagation()}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Additional Text Blocks (Duplicated Elements) */}
        {content.additionalTextBlocks?.map((block) => {
          if (block.visible === false) return null;

          return (
            <DraggableElement
              key={block.id}
              element={block.id as ElementType}
              position={block.position}
            >
              {block.type === "callToAction" ? (
                <div
                  className="flex items-center justify-center font-bold rounded-lg shadow-lg"
                  style={{
                    width: `${block.width}px`,
                    height: `${block.height}px`,
                    backgroundColor: block.backgroundColor,
                    color: block.color,
                    fontSize: `${block.fontSize}px`,
                    fontFamily: block.fontFamily,
                  }}
                >
                  {block.text}
                </div>
              ) : (
                <div
                  className={block.type === "headline" ? "font-bold" : ""}
                  style={{
                    fontSize: `${block.fontSize}px`,
                    fontFamily: block.fontFamily,
                    color: block.color,
                    textAlign: block.align || "left",
                    width: `${layout.width - block.position.x * 2}px`,
                    whiteSpace: "pre-wrap",
                    lineHeight: block.type === "body" ? "1.6" : "1.2",
                    textShadow:
                      block.type === "headline"
                        ? "2px 2px 4px rgba(0,0,0,0.1)"
                        : undefined,
                  }}
                >
                  {block.text}
                </div>
              )}
            </DraggableElement>
          );
        })}
      </div>
    </div>
  );
}
