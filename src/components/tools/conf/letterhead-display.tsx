"use client";

import { LETTERHEAD_CONFIG } from "@/lib/conf/letterhead-config";

export interface LetterheadDisplayProps {
  confName?: string;
  showDivider?: boolean;
  className?: string;
  printOnly?: boolean;
  hideOnPrint?: boolean;
}

/**
 * Reusable Letterhead Component
 * Displays the LSUIC letterhead with logo, organization name, and conference info
 * Used in budget forms, payment forms, and other document-based views
 */
export function LetterheadDisplay({
  confName,
  showDivider = true,
  className = "",
  printOnly = false,
  hideOnPrint = true,
}: LetterheadDisplayProps) {
  const visibilityClass = printOnly
    ? "hidden print:block"
    : hideOnPrint
      ? "print:hidden"
      : "";

  return (
    <div
      className={`${visibilityClass} bg-white border-b-2 border-[#C8A061] px-6 py-4 ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header with logos */}
        <div className="flex items-center gap-4 mb-3">
          {/* LSUIC Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/lsuic_logo.png"
            alt="LSUIC"
            className="h-14 w-14 shrink-0 object-contain"
          />

          {/* Organization and Conference Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#002868]">
              {LETTERHEAD_CONFIG.organizationName}
            </div>
            <div className="text-xs text-[#C8A061] font-semibold">
              {confName || LETTERHEAD_CONFIG.defaultConferenceName}
            </div>
            <div className="text-xs text-gray-500">
              {LETTERHEAD_CONFIG.defaultCity}, People&apos;s Republic of China ·
              Est. 2006
            </div>
          </div>

          {/* Liberia Seal */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/liberia-seal.svg"
            alt="Seal"
            className="h-14 w-14 shrink-0 object-contain"
          />
        </div>

        {/* Optional divider */}
        {showDivider && (
          <div className="h-px bg-linear-to-r from-transparent via-[#C8A061] to-transparent"></div>
        )}
      </div>
    </div>
  );
}
