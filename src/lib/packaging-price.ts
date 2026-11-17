/**
 * Price of the packages chosen for ONE item (per unit). Used by the server (the real price)
 * and by the product page / cart (what the customer sees), so both always agree.
 *
 * Rules, in order:
 *  1. A package is free when the item costs at least its "free above" amount (the price the customer pays).
 *  2. When "one free" is on and the customer chose 2 or more packages, ONE of them is free: the one the
 *     customer picked (freeId), otherwise the most expensive one. The rest keep their price.
 *     If one of the chosen packages is ALREADY free (its price is 0, or rule 1 made it free), that is the free one:
 *     nothing else becomes free.
 */
export interface PackChoice { id: string; price: number; freeAbove: number | null }
export interface PackPriced { id: string; price: number; free: boolean }

const round = (n: number) => Math.round(n * 100) / 100;

export function priceChosenPackaging(
  chosen: PackChoice[],
  unitPrice: number,
  oneFree: boolean,
  freeId?: string | null,
): { items: PackPriced[]; total: number; pickedId?: string } {
  const items: PackPriced[] = chosen.map((p) => {
    const free = !!p.freeAbove && p.freeAbove > 0 && unitPrice >= p.freeAbove;
    return { id: p.id, price: free ? 0 : p.price, free };
  });
  let pickedId: string | undefined;
  if (oneFree && chosen.length >= 2 && !items.some((x) => x.price === 0)) {
    const paying = items.filter((x) => x.price > 0);
    const pick = paying.find((x) => x.id === freeId) ?? [...paying].sort((a, b) => b.price - a.price)[0];
    if (pick) {
      pick.price = 0;
      pick.free = true;
      pickedId = pick.id;
    }
  }
  return { items, total: round(items.reduce((s, x) => s + x.price, 0)), pickedId };
}
