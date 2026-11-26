"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { bundlePrice } from "@/lib/bundles";
import { L } from "@/lib/localize";
import { useT, useLang, Txt } from "@/components/store/TextsProvider";

export interface BuyItem {
  id: string;
  productName: string;
  productNameAr?: string | null;
  slug: string;
  image: string;
  fixedVariantId: string | null;
  variants: { id: string; name: string; nameAr?: string | null; price: number; inventory: number }[];
}

export default function BundleBuyBox({
  bundle,
}: { bundle: { id: string; name: string; nameAr?: string | null; image: string; priceType: string; priceValue: number; mode?: string; pickMin?: number; pickMax?: number; items: BuyItem[] } }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // default each choice to the first option that is in stock
  const [choice, setChoice] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      bundle.items.map((it) => [it.id, it.fixedVariantId || it.variants.find((v) => v.inventory > 0)?.id || it.variants[0]?.id || ""])
    )
  );

  // build-your-own bundle: the customer ticks up to pickMax of the listed products
  const isPick = bundle.mode === "PICK";
  const pickMax = bundle.pickMax || 0;
  const pickMin = Math.max(1, bundle.pickMin || 1);
  const [chosen, setChosen] = useState<string[]>([]);
  const inStock = (it: BuyItem) => it.variants.some((v) => v.inventory > 0 && (!it.fixedVariantId || v.id === it.fixedVariantId));
  const toggle = (id: string) =>
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= pickMax ? c : [...c, id]));

  const picked = (isPick ? bundle.items.filter((it) => chosen.includes(it.id)) : bundle.items).map((it) => ({ it, v: it.variants.find((x) => x.id === choice[it.id]) }));
  const listTotal = picked.reduce((s, p) => s + (p.v?.price ?? 0), 0);
  const price = isPick && picked.length === 0 ? bundle.priceValue : bundlePrice(bundle.priceType, bundle.priceValue, listTotal);
  const tooFew = isPick && picked.length < pickMin;
  const unavailable = picked.some((p) => !p.v || p.v.inventory <= 0);
  // same variant used twice in a bundle needs enough stock for both
  const need = new Map<string, number>();
  picked.forEach((p) => p.v && need.set(p.v.id, (need.get(p.v.id) || 0) + qty));
  const notEnough = picked.some((p) => p.v && (need.get(p.v.id) || 0) > p.v.inventory);

  const add = () => {
    if (unavailable || notEnough || tooFew) return;
    const selections: Record<string, string> = {};
    if (isPick) picked.forEach((p) => { selections[p.it.id] = choice[p.it.id]; });
    else bundle.items.forEach((it) => { if (!it.fixedVariantId) selections[it.id] = choice[it.id]; });
    const key = Object.entries(selections).sort().map(([k, v]) => `${k}:${v}`).join(",");
    addItem({
      productId: "bundle",
      variantId: `${bundle.id}|${key}`,
      productName: bundle.name,
      productNameAr: bundle.nameAr || undefined,
      variantName: picked.map((p) => `${p.it.productName}${p.v?.name && p.it.variants.length > 1 ? ` (${p.v.name})` : ""}`).join(" + "),
      variantNameAr: picked.map((p) => `${L("ar", p.it.productName, p.it.productNameAr)}${p.v?.name && p.it.variants.length > 1 ? ` (${L("ar", p.v.name, p.v.nameAr)})` : ""}`).join(" + "),
      price,
      image: bundle.image,
      quantity: qty,
      bundleId: bundle.id,
      selections,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="space-y-6">
      {isPick && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-serif text-[#1C1711]"><Txt k="bundle.pick.heading" vars={{ max: pickMax }} /></p>
          <p className="text-xs text-[#A8975E] tracking-wide"><Txt k="bundle.pick.counter" vars={{ n: chosen.length, max: pickMax }} /></p>
        </div>
      )}
      <div className="space-y-4">
        {bundle.items.map((it) => {
          const v = it.variants.find((x) => x.id === choice[it.id]);
          const on = !isPick || chosen.includes(it.id);
          const canPick = isPick && inStock(it) && (on || chosen.length < pickMax);
          return (
            <div key={it.id} className={`flex gap-4 border p-3 transition-colors ${on ? "bg-[#FBF8F0] border-[#E0D6BD]" : "bg-transparent border-[#E8E0CB] opacity-70"} ${isPick && chosen.includes(it.id) ? "!border-[#A8975E] ring-1 ring-[#A8975E]" : ""}`}>
              <div className="relative w-16 h-20 shrink-0 bg-[#EDE6D4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image && <img src={it.image} alt={L(lang, it.productName, it.productNameAr)} className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${it.slug}`} className="font-serif text-base text-[#1C1711] hover:text-[#8A7A4A]">{L(lang, it.productName, it.productNameAr)}</Link>
                {it.fixedVariantId || it.variants.length <= 1 ? (
                  <p className="text-xs text-[#8A7E6E] mt-1">{v ? L(lang, v.name, v.nameAr) : ""}</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {it.variants.map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        disabled={x.inventory <= 0}
                        onClick={() => setChoice((c) => ({ ...c, [it.id]: x.id }))}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          x.id === choice[it.id]
                            ? "border-[#A8975E] bg-[#A8975E] text-[#F5EFE2]"
                            : x.inventory <= 0
                            ? "border-[#E3DAC3] text-[#B5AA92] line-through cursor-not-allowed"
                            : "border-[#CFC4A6] bg-white/60 text-[#5A5040] hover:border-[#A8975E]"
                        }`}
                      >
                        {L(lang, x.name, x.nameAr)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isPick ? (
                <button
                  type="button"
                  onClick={() => toggle(it.id)}
                  disabled={!canPick}
                  className={`shrink-0 self-center px-3 py-2 text-[10px] tracking-widest uppercase border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    chosen.includes(it.id) ? "border-[#A8975E] bg-[#A8975E] text-[#F5EFE2]" : "border-[#A8975E] text-[#8A7A4A] hover:bg-[#A8975E] hover:text-[#F5EFE2]"
                  }`}
                >
                  {!inStock(it) ? <Txt k="bundle.buy.outOfStock" /> : chosen.includes(it.id) ? <Txt k="bundle.pick.selected" /> : <Txt k="bundle.pick.select" />}
                </button>
              ) : (
                <span className="text-xs text-[#8A7E6E] shrink-0">{v ? formatPrice(v.price) : ""}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-serif text-[#1C1711]">{formatPrice(price)}</span>
        {isPick && <span className="text-xs text-[#8A7E6E]"><Txt k="bundle.pick.onePrice" /></span>}
        {!isPick && listTotal > price && (
          <>
            <span className="text-[#8A7E6E] line-through">{formatPrice(listTotal)}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase bg-[#B23A3A] text-[#F5EFE2] px-2 py-1">
              <Txt k="bundle.buy.save" vars={{ amount: formatPrice(listTotal - price) }} />
            </span>
          </>
        )}
      </div>

      {tooFew && <p className="text-xs text-[#8A7E6E]"><Txt k="bundle.pick.needMin" vars={{ min: pickMin }} /></p>}
      {unavailable && <p className="text-xs text-[#8A7E6E]"><Txt k="bundle.buy.itemOutOfStock" /></p>}
      {!unavailable && notEnough && <p className="text-xs text-[#C4834A]"><Txt k="bundle.buy.notEnough" /></p>}

      <div className="flex gap-3">
        <div className="flex items-center border border-[#CFC4A6] bg-white">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-12 text-[#5A5040]" aria-label={t("bundle.buy.less")}>−</button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="w-10 h-12 text-[#5A5040]" aria-label={t("bundle.buy.more")}>+</button>
        </div>
        <button
          onClick={add}
          disabled={unavailable || notEnough || tooFew}
          className="flex-1 bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {added ? <Txt k="bundle.buy.added" /> : unavailable ? <Txt k="bundle.buy.outOfStock" /> : <Txt k="bundle.buy.add" />}
        </button>
      </div>
      {added && (
        <button onClick={() => router.push("/cart")} className="text-xs tracking-widest uppercase text-[#A8975E] underline underline-offset-4">
          <Txt k="bundle.buy.viewCart" />
        </button>
      )}
    </div>
  );
}
