"use client";

import { Button } from "@/components/creative/ui/button";
import {
  Type,
  Image,
  Square,
  QrCode,
  Award,
  Crown,
  Calendar,
  User,
  Building2,
  Quote,
  Minus,
} from "lucide-react";

interface ElementToolbarProps {
  onAddElement: (
    type: "text" | "image" | "shape" | "qr",
    preset?: string
  ) => void;
}

export function ElementToolbar({ onAddElement }: ElementToolbarProps) {
  const elementCategories = [
    {
      title: "Certificate Structure",
      description: "Professional certificate elements",
      elements: [
        {
          type: "text" as const,
          preset: "certificate-title",
          icon: Crown,
          label: "Certificate Title",
          description:
            "Main certificate title (e.g., Certificate of Achievement)",
        },
        {
          type: "text" as const,
          preset: "recipient-name",
          icon: User,
          label: "Recipient Name",
          description: "Name of the certificate recipient",
        },
        {
          type: "text" as const,
          preset: "organization-name",
          icon: Building2,
          label: "Organization Name",
          description: "Name of the issuing organization",
        },
        {
          type: "text" as const,
          preset: "description",
          icon: Type,
          label: "Description Text",
          description: "Achievement or course description",
        },
      ],
    },
    {
      title: "Professional Elements",
      description: "Signatures, dates, and verification",
      elements: [
        {
          type: "text" as const,
          preset: "date",
          icon: Calendar,
          label: "Date",
          description: "Issue date or completion date",
        },
        {
          type: "text" as const,
          preset: "covenant-verse",
          icon: Quote,
          label: "Covenant Verse",
          description: "Inspirational quote or verse",
        },
        {
          type: "image" as const,
          preset: "signature",
          icon: Type,
          label: "Signature",
          description: "Authority signature image",
        },
        {
          type: "qr" as const,
          preset: "verification",
          icon: QrCode,
          label: "QR Code",
          description: "Certificate verification QR code",
        },
      ],
    },
    {
      title: "Design Elements",
      description: "Visual elements and decorations",
      elements: [
        {
          type: "image" as const,
          preset: "logo",
          icon: Image,
          label: "Logo",
          description: "Organization logo or emblem",
        },
        {
          type: "shape" as const,
          preset: "border",
          icon: Square,
          label: "Border/Frame",
          description: "Decorative borders and frames",
        },
        {
          type: "shape" as const,
          preset: "separator",
          icon: Minus,
          label: "Separator Line",
          description: "Decorative divider lines",
        },
        {
          type: "shape" as const,
          preset: "decoration",
          icon: Award,
          label: "Decoration",
          description: "Decorative shapes and accents",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Certificate Elements
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Click to add professional elements to your certificate
        </p>
      </div>

      {elementCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-3">
          <div className="border-b border-gray-100 pb-2">
            <h5 className="text-xs font-medium text-gray-800 uppercase tracking-wide">
              {category.title}
            </h5>
            <p className="text-xs text-gray-500 mt-1">{category.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {category.elements.map((element, elementIndex) => (
              <Button
                key={`${categoryIndex}-${elementIndex}`}
                variant="outline"
                className="w-full justify-start p-3 h-auto hover:bg-blue-50 border-gray-200 hover:border-blue-300 transition-colors"
                onClick={() => onAddElement(element.type, element.preset)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="bg-gradient-to-br from-blue-50 to-red-50 p-2 rounded-md">
                    <element.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {element.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {element.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
