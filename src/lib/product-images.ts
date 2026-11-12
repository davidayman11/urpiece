/** Product photos: "general" ones (all variants) plus photos that belong to one variant. */

export function parseImgs(raw?: string | null): string[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x) : [];
  } catch {
    return [];
  }
}

/** Photos to show for the chosen variant: its own first, then the general ones. */
export function galleryImages(general: string[], variantImgs: string[], allVariantImgs: string[][] = []): string[] {
  const list = [...variantImgs, ...general.filter((g) => !variantImgs.includes(g))];
  if (list.length > 0) return list;
  // product has only variant photos and this variant has none: show everyone's so the page is never empty
  return [...new Set(allVariantImgs.flat())];
}

/** One image to represent a product on cards: general first, else the first variant photo. */
export function coverImage(productImages: string, variants: { images?: string }[] = []): string {
  const g = parseImgs(productImages)[0];
  if (g) return g;
  for (const v of variants) {
    const i = parseImgs(v.images)[0];
    if (i) return i;
  }
  return "";
}

/**
 * The admin form sends photos as { url, variantKey }. variantKey "" = shown for every variant,
 * otherwise it names the variant (existing variant id, or a temporary key for a new one).
 * Plain strings (older clients) count as general photos.
 */
export function splitPhotos(raw: unknown): { general: string[]; forVariant: (key: string) => string[] } {
  const list = (Array.isArray(raw) ? raw : [])
    .map((i) => (typeof i === "string" ? { url: i, variantKey: "" } : { url: String(i?.url || ""), variantKey: String(i?.variantKey || "") }))
    .filter((i) => i.url);
  return {
    general: list.filter((i) => !i.variantKey).map((i) => i.url),
    forVariant: (key) => list.filter((i) => i.variantKey === key).map((i) => i.url),
  };
}
