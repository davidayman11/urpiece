"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { salePrice, saleLabel, activeSaleValue } from "@/lib/pricing";
import { parseImgs } from "@/lib/product-images";
import { L } from "@/lib/localize";
import { Txt, useLang, useT } from "@/components/store/TextsProvider";
import { useCartStore } from "@/lib/store/cart";
import type { Product, Variant, Category } from "@prisma/client";

interface Props {
  product: Product & { variants: Variant[]; category: Category | null };
}

/** Simple product card: photo, name, price and a small "+" button to add it to the cart. */
export default function ProductCard({ product }: Props) {
  const lang = useLang();
  const t = useT();
  const general = parseImgs(product.images);
  // a product whose photos are all assigned to variants still needs a card picture
  const images = general.length > 0 ? general : [...new Set(product.variants.flatMap((v) => parseImgs(v.images)))];
  const firstImage = images[0];
  const secondImage = images[1];
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const sale = activeSaleValue(product);
  const inStock = product.variants.some((v) => v.inventory > 0);
  const name = L(lang, product.name, product.nameAr);

  const lo = salePrice(minPrice, sale, product.saleType);
  const hi = salePrice(maxPrice, sale, product.saleType);

  // quick add: one option adds straight away, several options show a small list to pick from
  const addItem = useCartStore((s) => s.addItem);
  const [picking, setPicking] = useState(false);
  const [added, setAdded] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const available = product.variants.filter((v) => v.isActive !== false && v.inventory > 0);

  useEffect(() => {
    if (!picking) return;
    const away = (e: MouseEvent | TouchEvent) => { if (box.current && !box.current.contains(e.target as Node)) setPicking(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPicking(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
      document.removeEventListener("keydown", esc);
    };
  }, [picking]);

  const addVariant = (v: Variant) => {
    addItem({
      productId: product.id,
      variantId: v.id,
      productName: product.name,
      variantName: v.name,
      productNameAr: product.nameAr || undefined,
      variantNameAr: v.nameAr || undefined,
      price: salePrice(v.price, sale, product.saleType),
      image: parseImgs(v.images)[0] || images[0] || "",
      quantity: 1,
    });
    setPicking(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const onAdd = () => {
    if (available.length === 1) addVariant(available[0]);
    else if (available.length > 1) setPicking((p) => !p);
  };

  return (
    <div className="group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE6D4]">
          {firstImage ? (
            <>
              <Image
                src={firstImage}
                alt={name}
                fill
                sizes="(min-width:1024px) 25vw, 50vw"
                className={`object-cover transition-all duration-700 ease-in-out ${
                  secondImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                }`}
              />
              {secondImage && (
                <Image
                  src={secondImage}
                  alt={name}
                  fill
                  sizes="(min-width:1024px) 25vw, 50vw"
                  className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EDE6D4] to-[#D6CEBC]">
              <svg width="44" height="44" viewBox="0 0 52 52" fill="none" className="text-[#C4B07A] opacity-40" aria-hidden="true">
                <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="1" />
                <circle cx="26" cy="26" r="3" fill="currentColor" />
              </svg>
            </div>
          )}

          {/* only two simple badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {sale > 0 && inStock && (
              <span className="bg-[#B23A3A] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
                {saleLabel(sale, product.saleType)}
              </span>
            )}
            {!inStock && (
              <span className="bg-[#1C1711] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
                <Txt k="card.outOfStock" />
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <Link href={`/product/${product.slug}`} className="min-w-0 flex-1">
          <h3 className="text-sm font-serif text-[#1C1711] leading-snug truncate group-hover:text-[#8A7A4A] transition-colors">{name}</h3>
          <p className="mt-1 text-sm text-[#5A5040] tabular-nums">
            {sale > 0 && (
              <span className="line-through text-[#9A8F7C] me-2 text-xs">{formatPrice(minPrice)}</span>
            )}
            {lo === hi ? formatPrice(lo) : `${formatPrice(lo)} – ${formatPrice(hi)}`}
          </p>
        </Link>

        {available.length > 0 && (
          <div ref={box} className="relative shrink-0">
            <button
              type="button"
              onClick={onAdd}
              aria-label={t("card.addToCart")}
              title={t("card.addToCart")}
              aria-expanded={picking}
              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${
                added
                  ? "bg-[#6B7A4A] border-[#6B7A4A] text-[#F5EFE2]"
                  : "border-[#A8975E] text-[#8A7A4A] hover:bg-[#A8975E] hover:text-[#F5EFE2]"
              }`}
            >
              {added ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>

            {picking && available.length > 1 && (
              <ul role="menu" className="absolute end-0 bottom-full mb-2 z-20 min-w-[9rem] bg-white shadow-lg ring-1 ring-[#E0D6BD] py-1">
                {available.map((v) => (
                  <li key={v.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => addVariant(v)}
                      className="w-full text-start px-3 py-2 text-xs text-[#3A3228] hover:bg-[#F5EFE2] whitespace-nowrap"
                    >
                      {L(lang, v.name, v.nameAr)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
