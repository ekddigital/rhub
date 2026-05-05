"use client";

/** Minimal stub; extend props so vendor editor call sites typecheck. Wire to real AssetBrowser when uploads exist. */
export type AssetItem = {
  id: string;
  url: string;
  name?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  fileType?: string;
};

export function AssetBrowser(_props: {
  onSelect?: (item: AssetItem) => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  allowedTypes?: string[];
  title?: string;
  apiEndpoint?: string;
}) {
  return null;
}
