/**
 * Price of the packages chosen for ONE item (per unit). Used by the server (the real price)
 * and by the product page / cart (what the customer sees), so both always agree.
 *
 * A package is free when the item costs at least its "free above" amount (the price the customer pays).
 */
export interface PackChoice { id: string; price: number; freeAbove: number | null }
export interface PackPriced { id: string; price: number; free: boolean }

const round = (n: number) => Math.round(n * 100) / 100;

export function priceChosenPackaging(chosen: PackChoice[], unitPrice: number): { items: PackPriced[]; total: number } {
  const items: PackPriced[] = chosen.map((p) => {
    const free = !!p.freeAbove && p.freeAbove > 0 && unitPrice >= p.freeAbove;
    return { id: p.id, price: free ? 0 : p.price, free };
  });
  return { items, total: round(items.reduce((s, x) => s + x.price, 0)) };
}
