import type { Lang } from "@/lib/lang";

/**
 * Pick the English or Arabic version of something the admin typed.
 * In Arabic, an empty Arabic field falls back to the English one (so nothing is ever blank).
 */
export function L(lang: Lang, en: string | null | undefined, ar?: string | null): string {
  return lang === "ar" && ar && ar.trim() ? ar : en ?? "";
}

/** Section content (Pages & Sections) stores the Arabic text next to the English one as "<field>_ar". */
export function cx(content: Record<string, string> | undefined, field: string, lang: Lang): string {
  const c = content ?? {};
  return L(lang, c[field], c[`${field}_ar`]);
}

/** Names of an item in the cart (saved when it was added, in both languages). */
export interface NamedItem { productName: string; productNameAr?: string; variantName: string; variantNameAr?: string }
export const itemNames = (i: NamedItem, lang: Lang) => ({
  product: L(lang, i.productName, i.productNameAr),
  variant: L(lang, i.variantName, i.variantNameAr),
});
