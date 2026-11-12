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
 * The admin form sends photos as { url, variantKeys: string[] }. An empty list = shown for every variant,
 * otherwise the photo belongs to the named variants (existing variant id, or a temporary key for a new one).
 * Older shapes ({ url, variantKey } or plain strings) are still understood.
 */
export function splitPhotos(raw: unknown): { general: string[]; forVariant: (key: string) => string[] } {
  const list = (Array.isArray(raw) ? raw : [])
    .map((i) => {
      if (typeof i === "string") return { url: i, keys: [] as string[] };
      const keys = Array.isArray(i?.variantKeys) ? i.variantKeys : i?.variantKey ? [i.variantKey] : [];
      return { url: String(i?.url || ""), keys: keys.map(String).filter(Boolean) };
    })
    .filter((i) => i.url);
  return {
    general: list.filter((i) => i.keys.length === 0).map((i) => i.url),
    forVariant: (key) => list.filter((i) => i.keys.includes(key)).map((i) => i.url),
  };
}

export interface PhotoForm { url: string; variantKeys: string[] }

/** Same photo used by several variants becomes one photo with several keys; general photos stay general. */
export function mergePhotos(general: PhotoForm[], perVariant: PhotoForm[]): PhotoForm[] {
  const out = general.map((g) => ({ ...g, variantKeys: [...g.variantKeys] }));
  for (const p of perVariant) {
    const hit = out.find((o) => o.url === p.url);
    if (hit && hit.variantKeys.length > 0) hit.variantKeys = [...new Set([...hit.variantKeys, ...p.variantKeys])];
    else if (!hit) out.push({ url: p.url, variantKeys: [...p.variantKeys] });
  }
  return out;
}
