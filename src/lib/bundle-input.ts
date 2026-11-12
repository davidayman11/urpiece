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
  items: { productId: string; variantId: string | null }[];
}

export function parseBundle(b: Record<string, unknown>): { data?: BundleInput; error?: string } {
  const name = String(b.name || "").trim();
  if (!name) return { error: "Give the bundle a name" };
  const priceType = b.priceType === "PERCENT" ? "PERCENT" : "FIXED";
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
  if (items.length < 2) return { error: "A bundle needs at least 2 products" };
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
      items,
    },
  };
}
