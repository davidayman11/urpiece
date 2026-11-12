/** Price after a per-product percentage sale (0 = no sale). */
export function salePrice(price: number, salePercent: number | null | undefined): number {
  const pct = Math.min(100, Math.max(0, salePercent || 0));
  if (!pct) return price;
  return Math.round(price * (100 - pct)) / 100;
}
