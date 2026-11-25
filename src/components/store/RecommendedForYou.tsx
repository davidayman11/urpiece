"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/store/ProductCard";
import ScrollRow from "@/components/store/sections/ScrollRow";
import { Txt } from "@/components/store/TextsProvider";
import { useCartStore } from "@/lib/store/cart";
import { getViewed } from "@/lib/recently-viewed";
import type { Product, Variant, Category } from "@prisma/client";

type P = Product & { variants: Variant[]; category: Category | null };

/** "Recommended for you": products like the ones the visitor viewed or put in the cart. */
export default function RecommendedForYou({ currentProductId, dark = false }: { currentProductId?: string; dark?: boolean }) {
  const items = useCartStore((s) => s.items);
  const [products, setProducts] = useState<P[]>([]);

  const cartKey = [...new Set(items.map((i) => i.productId))].sort().join(",");
  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewed: getViewed(), cart: cartKey ? cartKey.split(",") : [], exclude: currentProductId ? [currentProductId] : [] }),
      signal: ctl.signal,
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => {});
    return () => ctl.abort();
  }, [cartKey, currentProductId]);

  if (products.length === 0) return null;
  return (
    <section className={`py-16 ${dark ? "" : "border-t border-[#E0D8C4]"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#A8975E] mb-2 flex items-center gap-3"><span className="w-6 h-px bg-[#A8975E]" /><Txt k="reco.subtitle" /></p>
        <h2 className="font-serif text-2xl md:text-3xl text-[#1C1711] mb-8"><Txt k="reco.title" /></h2>
        <ScrollRow>
          {products.map((p) => (
            <div key={p.id} className="shrink-0 w-[44%] sm:w-[30%] lg:w-[23%] snap-start"><ProductCard product={p} /></div>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}
