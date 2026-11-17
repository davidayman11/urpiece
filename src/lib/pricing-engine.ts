import { prisma } from "@/lib/prisma";
import { productSalePrice } from "@/lib/pricing";
import { loadShipping, findFee } from "@/lib/shipping";
import { bundlePrice, allocateBundle } from "@/lib/bundles";
import type { PromoCode } from "@prisma/client";
import type { Lang } from "@/lib/lang";
import { L } from "@/lib/localize";
import { priceChosenPackaging } from "@/lib/packaging-price";
import { TEXT_DEFAULTS, formatText, type TFunction } from "@/lib/texts";

/** A product offers a packaging option when its list is empty (= all) or contains it */
function packagingOffered(raw: unknown, id: string): boolean {
  try {
    const v = JSON.parse(String(raw || "[]"));
    return !Array.isArray(v) || v.length === 0 || v.includes(id);
  } catch { return true; }
}

export class QuoteError extends Error {}

/** A normal product line (variantId) or a bundle (bundleId + the variant chosen for each bundle item). */
export interface QuoteItemInput {
  variantId?: string;
  quantity: number;
  bundleId?: string;
  selections?: Record<string, string>;
  /** optional gift boxes / wrapping for a normal product line (one or more) */
  packagingIds?: string[];
  /** older carts stored a single choice */
  packagingId?: string;
}

export interface QuoteInput {
  items: QuoteItemInput[];
  promoCode?: string | null;
  city?: string | null;
  governorate?: string | null;
  /** Orders: throw on a bad promo code / unknown city instead of returning a message */
  strict?: boolean;
  /** is a customer signed in? (promo codes can require it) */
  signedIn?: boolean;
  /** language for names shown to the customer (defaults to English) */
  lang?: Lang;
}

export interface QuoteLine {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  listPrice: number;
  unitPrice: number;
  costPrice: number;
  inventory: number;
  /** set when this line comes from a bundle */
  bundleName?: string;
  /** chosen packaging: each with the price that applies to this item (0 when its free-above rule is met) */
  packaging: { id: string; name: string; price: number; free: boolean }[];
  /** names joined for the customer / in English for the order, and the total per unit */
  packagingName?: string;
  packagingNameEn?: string;
  packagingPrice: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  /** packaging for all lines (not discounted, added to the total) */
  packagingTotal: number;
  saleSavings: number;
  bundleSavings: number;
  ruleName: string | null;
  ruleDiscount: number;
  promoCode: string | null;
  promoId: string | null;
  promoDiscount: number;
  promoMessage: string | null;
  /** the entered code only works for signed-in customers */
  promoNeedsLogin: boolean;
  /** ruleDiscount + promoDiscount (stored on the order) */
  discount: number;
  shippingFee: number;
  freeShippingApplied: boolean;
  shippingPending: boolean;
  total: number;
  mode: "STACK" | "ONE";
  deposit: {
    /** a deposit rule applies to this order */
    enabled: boolean;
    /** amount to transfer now when paying the deposit */
    amount: number;
    /** left to pay on delivery */
    balance: number;
    /** customer may choose to pay everything now instead */
    allowFull: boolean;
    addShipping: boolean;
  };
  /** Human labels of the discounts that ended up applied */
  applied: string[];
}

interface Opts { sale: boolean; rule: boolean; promo: boolean; freeShip: boolean }

const round = (n: number) => Math.round(n * 100) / 100;

export async function quoteOrder(input: QuoteInput, t?: TFunction): Promise<Quote> {
  const tr: TFunction = t ?? ((k, v) => formatText(TEXT_DEFAULTS[k] ?? k, v));
  const now = new Date();
  const [settings, rules, shipping, depositRules] = await Promise.all([
    prisma.paymentSettings.findFirst(),
    prisma.discountRule.findMany({ where: { isActive: true } }),
    loadShipping(),
    prisma.depositRule.findMany({ where: { isActive: true } }),
  ]);
  const mode: "STACK" | "ONE" = settings?.discountMode === "ONE" ? "ONE" : "STACK";
  const salesEnabled = settings?.salesEnabled !== false;
  const promosEnabled = settings?.promosEnabled !== false;
  const freeMin = settings?.freeShippingMin || 0;

  // ---- items
  if (!input.items.length) throw new QuoteError(tr("checkout.msg.cartEmpty"));
  const plainIds = input.items.filter((i) => !i.bundleId).map((i) => i.variantId || "");
  const bundleIds = [...new Set(input.items.filter((i) => i.bundleId).map((i) => i.bundleId as string))];
  const bundles = bundleIds.length
    ? await prisma.bundle.findMany({ where: { id: { in: bundleIds }, isActive: true }, include: { items: { orderBy: { sortOrder: "asc" } } } })
    : [];
  const bundleVariantIds = input.items.flatMap((i) =>
    i.bundleId
      ? Object.values(i.selections || {}).concat(bundles.find((b) => b.id === i.bundleId)?.items.map((bi) => bi.variantId || "") || [])
      : []
  );
  const variants = await prisma.variant.findMany({
    where: { id: { in: [...plainIds, ...bundleVariantIds].filter(Boolean) } },
    include: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  type Pack = { id: string; name: string; nameEn: string; price: number; freeAbove: number | null };
  type BaseLine = { v: (typeof variants)[number]; quantity: number; fixedUnit?: number; bundleName?: string; packs: Pack[] };
  const idsOf = (i: QuoteItemInput) => [...new Set((i.packagingIds ?? (i.packagingId ? [i.packagingId] : [])).filter((x) => typeof x === "string" && x))];
  const packIds = [...new Set(input.items.filter((i) => !i.bundleId).flatMap(idsOf))];
  const packs = packIds.length ? await prisma.packagingOption.findMany({ where: { id: { in: packIds }, isActive: true } }) : [];
  const baseLines: BaseLine[] = [];
  for (const i of input.items) {
    const quantity = Math.max(1, Math.floor(Number(i.quantity) || 1));
    if (!i.bundleId) {
      const v = byId.get(i.variantId || "");
      if (!v) throw new QuoteError(tr("checkout.msg.itemUnavailable"));
      // the price the customer sees on the product page (used for the "only on items that cost at least" rule)
      const shownPrice = salesEnabled ? productSalePrice(v.price, v.product) : v.price;
      const chosen: Pack[] = [];
      for (const pid of idsOf(i)) {
        const po = packs.find((x) => x.id === pid);
        if (po && v.product.packagingEnabled && packagingOffered(v.product.packagingIds, po.id) && (!po.minItemPrice || shownPrice >= po.minItemPrice)) {
          chosen.push({ id: po.id, name: L(input.lang ?? "en", po.name, po.nameAr), nameEn: po.name, price: po.price, freeAbove: po.freeAbove ?? null });
        } else if (input.strict) throw new QuoteError(tr("checkout.msg.packagingUnavailable"));
      }
      baseLines.push({ v, quantity, packs: chosen });
      continue;
    }
    const bundle = bundles.find((b) => b.id === i.bundleId);
    if (!bundle || bundle.items.length === 0) throw new QuoteError(tr("checkout.msg.bundleUnavailable"));
    const parts = bundle.items.map((bi) => {
      const v = byId.get(bi.variantId || (i.selections || {})[bi.id] || "");
      if (!v || v.productId !== bi.productId || !v.isActive) {
        throw new QuoteError(tr("checkout.msg.bundleChooseOption", { name: bundle.name }));
      }
      return v;
    });
    const listTotal = parts.reduce((s2, v) => s2 + v.price, 0);
    const total = bundlePrice(bundle.priceType, bundle.priceValue, listTotal);
    const alloc = allocateBundle(parts.map((v) => v.price), total);
    parts.forEach((v, idx) => baseLines.push({ v, quantity, fixedUnit: alloc[idx], bundleName: bundle.name, packs: [] }));
  }

  // ---- shipping city
  let cityFee = 0;
  let shippingPending = false;
  if (shipping.hasZones) {
    const fee = findFee(shipping, input.governorate, input.city);
    if (fee !== null) cityFee = fee;
    else {
      shippingPending = true;
      if (input.strict) throw new QuoteError(shipping.adminDriven ? tr("checkout.msg.invalidGovCity") : tr("checkout.msg.invalidCity"));
    }
  }

  // ---- promo code (validity independent of the scenario)
  let promo: PromoCode | null = null;
  let promoMessage: string | null = null;
  let promoInvalid = false;
  let promoNeedsLogin = false;
  const code = (input.promoCode || "").trim().toUpperCase();
  if (code) {
    if (!promosEnabled) { promoMessage = tr("checkout.msg.promoUnavailable"); promoInvalid = true; }
    else {
      const rec = await prisma.promoCode.findUnique({ where: { code } });
      if (!rec) { promoMessage = tr("checkout.msg.promoInvalid"); promoInvalid = true; }
      else if (!rec.isActive) { promoMessage = tr("checkout.msg.promoInactive"); promoInvalid = true; }
      else if (rec.startsAt && rec.startsAt > now) { promoMessage = tr("checkout.msg.promoNotYet"); promoInvalid = true; }
      else if (rec.expiresAt && rec.expiresAt < now) { promoMessage = tr("checkout.msg.promoExpired"); promoInvalid = true; }
      else if (rec.usageLimit && rec.usedCount >= rec.usageLimit) { promoMessage = tr("checkout.msg.promoLimit"); promoInvalid = true; }
      else if (rec.requiresLogin && !input.signedIn) { promoMessage = tr("checkout.msg.promoLoginRequired"); promoInvalid = true; promoNeedsLogin = true; }
      else promo = rec;
    }
  }

  const activeRules = rules.filter(
    (r) => (!r.startsAt || r.startsAt <= now) && (!r.endsAt || r.endsAt >= now)
  );

  const build = (o: Opts) => {
    const lines: QuoteLine[] = baseLines.map(({ v, quantity, fixedUnit, bundleName, packs: chosenPacks }) => {
      const unitPrice = fixedUnit !== undefined ? fixedUnit : o.sale ? productSalePrice(v.price, v.product) : v.price;
      // free-above rule (same function the product page uses)
      const priced = priceChosenPackaging(chosenPacks, unitPrice);
      const packaging = chosenPacks.map((pk) => {
        const pr = priced.items.find((x) => x.id === pk.id)!;
        return { id: pk.id, name: pk.name, nameEn: pk.nameEn, price: pr.price, free: pr.free };
      });
      return {
      variantId: v.id,
      productId: v.productId,
      productName: v.product.name,
      variantName: v.name,
      quantity,
      listPrice: v.price,
      unitPrice,
      costPrice: v.costPrice,
      inventory: v.inventory,
      bundleName,
      packaging: packaging.map((x) => ({ id: x.id, name: x.name, price: x.price, free: x.free })),
      packagingName: packaging.length ? packaging.map((x) => x.name).join(", ") : undefined,
      packagingNameEn: packaging.length ? packaging.map((x) => (x.free ? `${x.nameEn} (free)` : x.nameEn)).join(", ") : undefined,
      packagingPrice: priced.total,
      };
    });
    const packagingTotal = round(lines.reduce((s, l) => s + l.packagingPrice * l.quantity, 0));
    const subtotal = round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
    const listSubtotal = round(lines.reduce((s, l) => s + l.listPrice * l.quantity, 0));

    let ruleDiscount = 0;
    let ruleName: string | null = null;
    let ruleNameEn: string | null = null;
    if (o.rule) {
      for (const r of activeRules) {
        if (subtotal < r.minAmount) continue;
        const d = Math.min(subtotal, r.type === "FIXED" ? r.value : (subtotal * r.value) / 100);
        if (d > ruleDiscount) { ruleDiscount = round(d); ruleName = L(input.lang ?? "en", r.name, r.nameAr); ruleNameEn = r.name; }
      }
    }

    let promoDiscount = 0;
    let promoNote: string | null = null;
    if (o.promo && promo) {
      const base = subtotal - ruleDiscount;
      if (promo.minOrderAmount && base < promo.minOrderAmount) {
        promoNote = tr("checkout.msg.promoMinOrder", { amount: promo.minOrderAmount });
      } else {
        let d = promo.discountType === "PERCENTAGE" ? (base * promo.discountValue) / 100 : promo.discountValue;
        if (promo.discountType === "PERCENTAGE" && promo.maxDiscount) d = Math.min(d, promo.maxDiscount);
        promoDiscount = round(Math.min(base, d));
      }
    }

    const after = round(subtotal - ruleDiscount - promoDiscount);
    const freeShippingApplied = o.freeShip && freeMin > 0 && after >= freeMin && cityFee > 0;
    const shippingFee = freeShippingApplied ? 0 : cityFee;
    const total = round(after + shippingFee + packagingTotal);
    const savings = round(listSubtotal + cityFee - total);
    return { lines, subtotal, packagingTotal, listSubtotal, ruleDiscount, ruleName, ruleNameEn, promoDiscount, promoNote, shippingFee, freeShippingApplied, total, savings };
  };

  let opts: Opts;
  let notChosenPromo = false;
  if (mode === "STACK") {
    opts = { sale: salesEnabled, rule: true, promo: !!promo, freeShip: true };
  } else {
    // Customer gets only the single best discount
    const candidates: { key: string; o: Opts }[] = [
      { key: "sale", o: { sale: salesEnabled, rule: false, promo: false, freeShip: false } },
      { key: "rule", o: { sale: false, rule: true, promo: false, freeShip: false } },
      { key: "promo", o: { sale: false, rule: false, promo: !!promo, freeShip: false } },
      { key: "ship", o: { sale: false, rule: false, promo: false, freeShip: true } },
    ];
    let best = { key: "none", o: { sale: false, rule: false, promo: false, freeShip: false } as Opts };
    let bestSavings = -1;
    for (const c of candidates) {
      const s = build(c.o).savings;
      if (s > bestSavings) { bestSavings = s; best = c; }
    }
    opts = best.o;
    if (promo && !opts.promo) notChosenPromo = true;
  }

  const r = build(opts);
  if (promo && opts.promo && r.promoDiscount === 0) {
    promoMessage = r.promoNote;
    if (input.strict && promoMessage) throw new QuoteError(promoMessage);
  }
  if (notChosenPromo) promoMessage = tr("checkout.msg.promoBetterDiscount");
  if (promoInvalid && input.strict) throw new QuoteError(promoMessage || tr("checkout.msg.promoInvalid"));

  const applied: string[] = [];
  const saved = (pred: (l: QuoteLine) => boolean) =>
    round(r.lines.filter(pred).reduce((s, l) => s + (l.listPrice - l.unitPrice) * l.quantity, 0));
  const saleSavings = opts.sale ? saved((l) => !l.bundleName) : 0;
  const bundleSavings = saved((l) => !!l.bundleName);
  if (bundleSavings > 0) applied.push("Bundle savings");
  if (saleSavings > 0) applied.push("Sale prices");
  if (r.ruleDiscount > 0 && r.ruleName) applied.push(r.ruleNameEn || r.ruleName);
  if (r.promoDiscount > 0 && promo) applied.push(`Promo ${promo.code}`);
  if (r.freeShippingApplied) applied.push("Free shipping");

  // ---- deposit: matched on the order amount WITHOUT shipping (after discounts)
  const orderAmount = round(r.subtotal - r.ruleDiscount - r.promoDiscount);
  const addShipping = !!settings?.depositAddShipping;
  let deposit = { enabled: false, amount: r.total, balance: 0, allowFull: settings?.depositAllowFull !== false, addShipping };
  if (settings?.depositEnabled) {
    const match = depositRules
      .filter((d) => orderAmount >= d.minAmount && (d.maxAmount == null || orderAmount < d.maxAmount))
      .sort((a, b) => b.minAmount - a.minAmount || (a.maxAmount ?? Infinity) - (b.maxAmount ?? Infinity))[0];
    if (match) {
      const base = match.type === "PERCENT" ? (orderAmount * match.value) / 100 : match.value;
      const amount = round(Math.min(r.total, base + (addShipping ? r.shippingFee : 0)));
      if (amount > 0 && amount < r.total) {
        deposit = { enabled: true, amount, balance: round(r.total - amount), allowFull: deposit.allowFull, addShipping };
      }
    }
  }

  return {
    lines: r.lines,
    subtotal: r.subtotal,
    packagingTotal: r.packagingTotal,
    saleSavings,
    bundleSavings,
    ruleName: r.ruleDiscount > 0 ? r.ruleName : null,
    ruleDiscount: r.ruleDiscount,
    promoCode: r.promoDiscount > 0 && promo ? promo.code : null,
    promoId: r.promoDiscount > 0 && promo ? promo.id : null,
    promoDiscount: r.promoDiscount,
    promoMessage,
    promoNeedsLogin,
    discount: round(r.ruleDiscount + r.promoDiscount),
    shippingFee: r.shippingFee,
    freeShippingApplied: r.freeShippingApplied,
    shippingPending,
    total: r.total,
    mode,
    deposit,
    applied,
  };
}
