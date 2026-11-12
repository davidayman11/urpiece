export type SaleType = "PERCENT" | "FIXED";

/**
 * Price after a per-product sale. `value` is a percentage (0-100) when
 * type is PERCENT, or an amount in EGP taken off each unit when FIXED.
 * (Stored in the Product.salePercent column, which holds either.)
 */
export function salePrice(price: number, value: number | null | undefined, type: string | null | undefined = "PERCENT"): number {
  const v = Math.max(0, value || 0);
  if (!v) return price;
  if (type === "FIXED") return Math.max(0, Math.round((price - v) * 100) / 100);
  return Math.round(price * (100 - Math.min(100, v))) / 100;
}

/** Short badge text like "-20%" or "-50 EGP". Empty when there is no sale. */
export function saleLabel(value: number | null | undefined, type: string | null | undefined): string {
  const v = value || 0;
  if (v <= 0) return "";
  return type === "FIXED" ? `-${v} EGP` : `-${v}%`;
}
