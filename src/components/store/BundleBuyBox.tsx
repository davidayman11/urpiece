"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { bundlePrice } from "@/lib/bundles";

export interface BuyItem {
  id: string;
  productName: string;
  slug: string;
  image: string;
  fixedVariantId: string | null;
  variants: { id: string; name: string; price: number; inventory: number }[];
}

export default function BundleBuyBox({
  bundle,
}: { bundle: { id: string; name: string; image: string; priceType: string; priceValue: number; items: BuyItem[] } }) {
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

  const picked = bundle.items.map((it) => ({ it, v: it.variants.find((x) => x.id === choice[it.id]) }));
  const listTotal = picked.reduce((s, p) => s + (p.v?.price ?? 0), 0);
  const price = bundlePrice(bundle.priceType, bundle.priceValue, listTotal);
  const unavailable = picked.some((p) => !p.v || p.v.inventory <= 0);
  // same variant used twice in a bundle needs enough stock for both
  const need = new Map<string, number>();
  picked.forEach((p) => p.v && need.set(p.v.id, (need.get(p.v.id) || 0) + qty));
  const notEnough = picked.some((p) => p.v && (need.get(p.v.id) || 0) > p.v.inventory);

  const add = () => {
    if (unavailable || notEnough) return;
    const selections: Record<string, string> = {};
    bundle.items.forEach((it) => { if (!it.fixedVariantId) selections[it.id] = choice[it.id]; });
    const key = Object.entries(selections).sort().map(([k, v]) => `${k}:${v}`).join(",");
    addItem({
      productId: "bundle",
      variantId: `${bundle.id}|${key}`,
      productName: bundle.name,
      variantName: picked.map((p) => `${p.it.productName}${p.v?.name && p.it.variants.length > 1 ? ` (${p.v.name})` : ""}`).join(" + "),
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
      <div className="space-y-4">
        {bundle.items.map((it) => {
          const v = it.variants.find((x) => x.id === choice[it.id]);
          return (
            <div key={it.id} className="flex gap-4 bg-[#FBF8F0] border border-[#E0D6BD] p-3">
              <div className="relative w-16 h-20 shrink-0 bg-[#EDE6D4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.image && <img src={it.image} alt={it.productName} className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${it.slug}`} className="font-serif text-base text-[#1C1711] hover:text-[#8A7A4A]">{it.productName}</Link>
                {it.fixedVariantId || it.variants.length <= 1 ? (
                  <p className="text-xs text-[#8A7E6E] mt-1">{v?.name}</p>
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
                        {x.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-[#8A7E6E] shrink-0">{v ? formatPrice(v.price) : ""}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-serif text-[#1C1711]">{formatPrice(price)}</span>
        {listTotal > price && (
          <>
            <span className="text-[#8A7E6E] line-through">{formatPrice(listTotal)}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase bg-[#B23A3A] text-[#F5EFE2] px-2 py-1">
              Save {formatPrice(listTotal - price)}
            </span>
          </>
        )}
      </div>

      {unavailable && <p className="text-xs text-[#8A7E6E]">One of the chosen items is out of stock.</p>}
      {!unavailable && notEnough && <p className="text-xs text-[#C4834A]">Not enough stock for that quantity.</p>}

      <div className="flex gap-3">
        <div className="flex items-center border border-[#CFC4A6] bg-white">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-12 text-[#5A5040]" aria-label="Less">−</button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="w-10 h-12 text-[#5A5040]" aria-label="More">+</button>
        </div>
        <button
          onClick={add}
          disabled={unavailable || notEnough}
          className="flex-1 bg-[#A8975E] text-[#F5EFE2] py-3.5 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {added ? "Added to cart ✓" : unavailable ? "Out of stock" : "Add bundle to cart"}
        </button>
      </div>
      {added && (
        <button onClick={() => router.push("/cart")} className="text-xs tracking-widest uppercase text-[#A8975E] underline underline-offset-4">
          View cart →
        </button>
      )}
    </div>
  );
}
