/** Cleans the packaging form sent by the admin. Returns null when the name is missing. */
export function packagingData(d: Record<string, unknown>) {
  const name = String(d.name || "").trim();
  if (!name) return null;
  const price = Number(d.price);
  return {
    name,
    nameAr: String(d.nameAr || "").trim() || null,
    image: String(d.image || "").trim() || null,
    price: Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : 0,
    isActive: d.isActive !== false,
    sortOrder: Math.floor(Number(d.sortOrder)) || 0,
  };
}

/** The packaging ids a product offers, from its stored JSON ([] = all active options). */
export function parsePackagingIds(raw: unknown): string[] {
  try {
    const v = JSON.parse(String(raw || "[]"));
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

export const cleanPackagingIds = (v: unknown): string => JSON.stringify(Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
