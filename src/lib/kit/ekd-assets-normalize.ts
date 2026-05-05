/**
 * Normalize heterogeneous EKD Digital Assets API list payloads to `{ items, total }`.
 */
export function normalizeEkdAssetsList(payload: unknown): {
  items: unknown[];
  total: number;
} {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const nested = o.data ?? o.items ?? o.assets ?? o.results ?? o.records;
    if (Array.isArray(nested)) {
      const total =
        typeof o.total === "number"
          ? o.total
          : typeof o.count === "number"
            ? o.count
            : nested.length;
      return { items: nested, total };
    }
  }
  return { items: [], total: 0 };
}
