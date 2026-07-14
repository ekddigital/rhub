"use client";

import { LogisticsDocCell } from "@/components/tools/conf/logistics-doc-cell";
import type { LogisticsTravelDocuments } from "@/lib/conf/logistics-name-list";

export function LogisticsTravelDocStrip({
  name,
  docs,
  nameClassName,
}: {
  name: string;
  docs: LogisticsTravelDocuments;
  nameClassName?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p
        className={
          nameClassName ??
          "text-xs font-medium leading-snug text-foreground"
        }
      >
        {name}
      </p>
      <div className="flex flex-wrap gap-2">
        <LogisticsDocCell
          kind="passport"
          previewUrl={docs.passportPhotoPath}
          proxyUrl={docs.passportDocUrl ?? docs.passportPhotoPath ?? ""}
          isPdf={docs.passportPhotoIsPdf}
          label="Passport"
          readOnly
        />
        <LogisticsDocCell
          kind="visa"
          previewUrl={docs.currentVisaPath}
          proxyUrl={docs.visaDocUrl ?? docs.currentVisaPath ?? ""}
          isPdf={docs.currentVisaIsPdf}
          label="Visa"
          readOnly
        />
        <LogisticsDocCell
          kind="entry-stamp"
          previewUrl={docs.lastEntryStampPath}
          proxyUrl={docs.entryStampDocUrl ?? docs.lastEntryStampPath ?? ""}
          isPdf={docs.lastEntryStampIsPdf}
          label="Entry stamp"
          readOnly
        />
      </div>
    </div>
  );
}
