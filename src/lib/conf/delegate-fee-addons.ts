import { normalizeConferenceOptionalAddOnPackageIds } from "@/lib/conf/fees";

const ADD_ONS_MARKER = "[CONF_ADDONS]:";

export function parseDelegateCommentsWithAddOns(
  rawComments: string | null | undefined,
): { additionalComments: string | null; addOnPackageIds: string[] } {
  const input = String(rawComments || "");
  const lines = input.split(/\r?\n/);
  let parsedAddOnIds: string[] = [];
  const retained: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith(ADD_ONS_MARKER)) {
      const rawIds = trimmed.slice(ADD_ONS_MARKER.length).split(",");
      parsedAddOnIds = normalizeConferenceOptionalAddOnPackageIds(rawIds);
      continue;
    }
    retained.push(line);
  }

  const cleaned = retained.join("\n").trim();
  return {
    additionalComments: cleaned.length ? cleaned : null,
    addOnPackageIds: parsedAddOnIds,
  };
}

export function composeDelegateCommentsWithAddOns(
  additionalComments: string | null | undefined,
  addOnPackageIds: string[],
): string | null {
  const cleanedComments = String(additionalComments || "").trim();
  const normalizedAddOns = normalizeConferenceOptionalAddOnPackageIds(addOnPackageIds);
  if (!normalizedAddOns.length) {
    return cleanedComments.length ? cleanedComments : null;
  }
  const marker = `${ADD_ONS_MARKER}${normalizedAddOns.join(",")}`;
  if (!cleanedComments.length) {
    return marker;
  }
  return `${cleanedComments}\n\n${marker}`;
}
