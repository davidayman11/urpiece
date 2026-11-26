import { slugify } from "@/lib/utils";

export interface BundleInput {
  name: string;
  nameAr: string | null;
  descriptionAr: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  priceType: "FIXED" | "PERCENT";
  priceValue: number;
  mode: "FIXED" | "PICK";
  pickMin: number;
  pickMax: number;
  items: { productId: string; variantId: string | null }[];
}

export function parseBundle(b: Record<string, unknown>): { data?: BundleInput; error?: string } {
  const name = String(b.name || "").trim();
  if (!name) return { error: "Give the bundle a name" };
  const mode = b.mode === "PICK" ? "PICK" : "FIXED";
  // a build-your-own bundle always has one fixed price
  const priceType = mode === "PICK" ? "FIXED" : b.priceType === "PERCENT" ? "PERCENT" : "FIXED";
  const priceValue = Number(b.priceValue);
  if (!Number.isFinite(priceValue) || priceValue <= 0) {
    return { error: priceType === "PERCENT" ? "Enter the discount percentage" : "Enter the bundle price" };
  }
  if (priceType === "PERCENT" && priceValue >= 100) return { error: "The discount must be under 100%" };
  const items = (Array.isArray(b.items) ? b.items : [])
    .map((i: { productId?: string; variantId?: string | null }) => ({
      productId: String(i?.productId || ""),
      variantId: i?.variantId ? String(i.variantId) : null,
    }))
    .filter((i) => i.productId);
  const pickMax = Math.floor(Number(b.pickMax)) || 0;
  const pickMin = Math.floor(Number(b.pickMin)) || 1;
  if (mode === "PICK") {
    if (pickMax < 1) return { error: "Enter the maximum number of products the customer can choose" };
    if (pickMin < 1 || pickMin > pickMax) return { error: "The minimum must be between 1 and the maximum" };
    if (items.length < pickMax) return { error: `List at least ${pickMax} products for the customer to choose from` };
    if (new Set(items.map((i) => i.productId)).size !== items.length) return { error: "Each product can be listed only once in a build-your-own bundle" };
  } else if (items.length < 2) return { error: "A bundle needs at least 2 products" };
  return {
    data: {
      name,
      nameAr: String(b.nameAr || "").trim() || null,
      descriptionAr: String(b.descriptionAr || "").trim() || null,
      slug: slugify(String(b.slug || "") || name) || "bundle",
      description: String(b.description || "").trim() || null,
      image: String(b.image || "").trim() || null,
      isActive: b.isActive !== false,
      priceType,
      priceValue,
      mode,
      pickMin: mode === "PICK" ? pickMin : 1,
      pickMax: mode === "PICK" ? pickMax : 0,
      items,
    },
  };
}
