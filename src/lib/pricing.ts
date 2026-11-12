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

export interface SaleInfo {
  salePercent: number;
  saleType: string;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
}

/** "ACTIVE" inside the window, "SCHEDULED" before it, "ENDED" after it, "NONE" without a sale. */
export function saleStatus(p: SaleInfo, now: Date = new Date()): "NONE" | "SCHEDULED" | "ACTIVE" | "ENDED" {
  if (!p.salePercent || p.salePercent <= 0) return "NONE";
  if (p.saleStartsAt && now < new Date(p.saleStartsAt)) return "SCHEDULED";
  if (p.saleEndsAt && now > new Date(p.saleEndsAt)) return "ENDED";
  return "ACTIVE";
}

/** Sale value that applies right now (0 when none/scheduled/ended). */
export function activeSaleValue(p: SaleInfo, now?: Date): number {
  return saleStatus(p, now) === "ACTIVE" ? p.salePercent : 0;
}

export function productSalePrice(price: number, p: SaleInfo, now?: Date): number {
  return salePrice(price, activeSaleValue(p, now), p.saleType);
}
