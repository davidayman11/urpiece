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
    // only offered on items that cost at least this much (empty / 0 = every item)
    minItemPrice: (() => { const f = Number(d.minItemPrice); return d.minItemPrice !== "" && d.minItemPrice != null && Number.isFinite(f) && f > 0 ? Math.round(f * 100) / 100 : null; })(),
    // free when the item costs at least this much (empty / 0 = never free)
    freeAbove: (() => { const f = Number(d.freeAbove); return d.freeAbove !== "" && d.freeAbove != null && Number.isFinite(f) && f > 0 ? Math.round(f * 100) / 100 : null; })(),
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
