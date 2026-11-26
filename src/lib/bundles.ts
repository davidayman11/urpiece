/** Pure bundle maths, shared by the server (real prices) and the browser (live preview). */

export type BundlePriceType = "FIXED" | "PERCENT";

const round = (n: number) => Math.round(n * 100) / 100;

/** Bundle price for a given sum of regular prices. Never more than the regular total. */
export function bundlePrice(type: string, value: number, listTotal: number): number {
  const raw = type === "PERCENT" ? listTotal * (1 - Math.min(100, Math.max(0, value)) / 100) : value;
  return round(Math.max(0, Math.min(listTotal, raw)));
}

/**
 * Split a bundle price across its items in proportion to their regular prices.
 * The rounding remainder goes on the first item so the parts add up exactly.
 */
export function allocateBundle(listPrices: number[], bundleTotal: number): number[] {
  const sum = listPrices.reduce((a, b) => a + b, 0);
  if (listPrices.length === 0) return [];
  if (sum <= 0) {
    const even = round(bundleTotal / listPrices.length);
    const out = listPrices.map(() => even);
    out[0] = round(out[0] + (bundleTotal - even * listPrices.length));
    return out;
  }
  const out = listPrices.map((p) => round((p * bundleTotal) / sum));
  const diff = round(bundleTotal - out.reduce((a, b) => a + b, 0));
  out[0] = round(out[0] + diff);
  return out;
}

export interface BundleViewItem {
  id: string;
  productId: string;
  variantId: string | null;
  product: { name: string; nameAr?: string | null; images: string; slug: string; isActive: boolean; variants: { id: string; name: string; nameAr?: string | null; price: number; inventory: number; isActive: boolean; images?: string }[] };
}
export interface BundleView {
  id: string; name: string; nameAr?: string | null; descriptionAr?: string | null; slug: string; description: string | null; image: string | null;
  priceType: string; priceValue: number; items: BundleViewItem[];
  mode?: string; pickMin?: number; pickMax?: number;
}

/** Card-level numbers: cheapest regular total, bundle price, and whether it can be bought right now. */
export function summarizeBundle(b: BundleView) {
  if (b.mode === "PICK") {
    // build-your-own: one fixed price; buyable while enough listed products are in stock
    const ok = b.items.filter((it) => {
      const vs = it.product.variants.filter((v) => v.isActive && v.inventory > 0 && (!it.variantId || v.id === it.variantId));
      return it.product.isActive && vs.length > 0;
    }).length;
    return { listTotal: 0, price: round(b.priceValue), savings: 0, hasChoice: true, inStock: ok >= Math.max(1, b.pickMin ?? 1) };
  }
  let listTotal = 0;
  let hasChoice = false;
  let inStock = true;
  for (const it of b.items) {
    const vs = it.product.variants.filter((v) => v.isActive);
    const pool = it.variantId ? vs.filter((v) => v.id === it.variantId) : vs;
    if (!it.variantId) hasChoice = true;
    const available = pool.filter((v) => v.inventory > 0);
    if (!it.product.isActive || available.length === 0) { inStock = false; }
    const prices = (available.length ? available : pool).map((v) => v.price);
    listTotal += prices.length ? Math.min(...prices) : 0;
  }
  const price = bundlePrice(b.priceType, b.priceValue, listTotal);
  return { listTotal: round(listTotal), price, savings: round(listTotal - price), hasChoice, inStock };
}
