export function formatPersonName(input: string): string {
  const normalized = input.trim().replace(/\s+/g, " ");
  if (!normalized) return normalized;

  const formatSegment = (segment: string): string => {
    if (!segment) return segment;
    if (segment.length <= 2) return segment;
    return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
  };

  const formatToken = (token: string): string => {
    if (token.length <= 2) return token;
    return token
      .split("-")
      .map((part) =>
        part
          .split("'")
          .map((segment) => formatSegment(segment))
          .join("'"),
      )
      .join("-");
  };

  return normalized
    .split(" ")
    .map((token) => formatToken(token))
    .join(" ");
}
