"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, parseJson } from "@/lib/utils";
import { salePrice, saleLabel, activeSaleValue } from "@/lib/pricing";
import { parseImgs } from "@/lib/product-images";
import { L } from "@/lib/localize";
import { Txt, useLang } from "@/components/store/TextsProvider";
import { useCartStore } from "@/lib/store/cart";
import type { Product, Variant, Category } from "@prisma/client";

interface Props {
  product: Product & { variants: Variant[]; category: Category | null };
}

export default function ProductCard({ product }: Props) {
  const lang = useLang();
  const general = parseImgs(product.images);
  // a product whose photos are all assigned to variants still needs a card picture
  const images = general.length > 0 ? general : [...new Set(product.variants.flatMap((v) => parseImgs(v.images)))];
  const firstImage = images[0];
  const secondImage = images[1];
  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : 0;
  const maxPrice = product.variants.length > 0
    ? Math.max(...product.variants.map((v) => v.price))
    : 0;
  const sale = activeSaleValue(product);
  const totalInventory = product.variants.reduce((s, v) => s + v.inventory, 0);
  const inStock = totalInventory > 0;
  const isLowStock = inStock && totalInventory <= 5;

  // quick add: one option adds straight away, several options ask which one first
  const addItem = useCartStore((s) => s.addItem);
  const [picking, setPicking] = useState(false);
  const [added, setAdded] = useState(false);
  const available = product.variants.filter((v) => v.isActive !== false && v.inventory > 0);
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
    setTimeout(() => setAdded(false), 2000);
  };
  const onAdd = () => {
    if (available.length === 1) addVariant(available[0]);
    else if (available.length > 1) setPicking((p) => !p);
  };

  return (
    <div className="group block">
      <Link href={`/product/${product.slug}`} className="block">
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE6D4]">
        {firstImage ? (
          <>
            <Image
              src={firstImage}
              alt={L(lang, product.name, product.nameAr)}
              fill
              className={`object-cover transition-all duration-700 ease-in-out ${
                secondImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
              }`}
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt={L(lang, product.name, product.nameAr)}
                fill
                className="object-cover absolute inset-0 opacity-0 scale-105 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 ease-in-out"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EDE6D4] to-[#D6CEBC]">
            <div className="text-[#C4B07A] opacity-40">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="1" />
                <circle cx="26" cy="26" r="3" fill="currentColor" />
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i * 45 * Math.PI) / 180;
                  return (
                    <line key={i}
                      x1={26 + Math.cos(a) * 19} y1={26 + Math.sin(a) * 19}
                      x2={26 + Math.cos(a) * 24} y2={26 + Math.sin(a) * 24}
                      stroke="currentColor" strokeWidth="1" />
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Quick-shop overlay */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-[#1C1711]/80 backdrop-blur-sm flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#C4B07A]"><Txt k="card.viewPiece" /></span>
        </div>

        {/* Views badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#1C1711]/60 backdrop-blur-sm px-2 py-1 group-hover:opacity-0 transition-opacity duration-300">
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <ellipse cx="5.5" cy="4" rx="5" ry="3.5" stroke="#C4B07A" strokeWidth="1"/>
            <circle cx="5.5" cy="4" r="1.5" fill="#C4B07A"/>
          </svg>
          <span className="text-[9px] text-[#C4B07A] tabular-nums leading-none">{product.views}</span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {sale > 0 && (
            <span className="bg-[#B23A3A] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
              {saleLabel(sale, product.saleType)}
            </span>
          )}
          {!inStock && (
            <span className="bg-[#1C1711] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
              <Txt k="card.outOfStock" />
            </span>
          )}
          {isLowStock && (
            <span className="bg-[#C4834A] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
              <Txt k="card.lowStock" />
            </span>
          )}
          {product.isFeatured && inStock && !isLowStock && (
            <span className="bg-[#A8975E] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
              <Txt k="card.featured" />
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-3.5 pb-1">
        {product.category && (
          <p className="text-[9px] tracking-[0.25em] uppercase text-[#A8975E] mb-1">
            {L(lang, product.category.name, product.category.nameAr)}
          </p>
        )}
        <h3 className="text-sm font-serif text-[#1C1711] group-hover:text-[#8A7A4A] transition-colors duration-200 leading-snug">
          {L(lang, product.name, product.nameAr)}
        </h3>
        <p className="mt-1.5 text-sm text-[#5A5040] tabular-nums">
          {sale > 0 && (
            <span className="line-through text-[#8A7E6E] mr-2">
              {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
            </span>
          )}
          {(() => {
            const lo = salePrice(minPrice, sale, product.saleType);
            const hi = salePrice(maxPrice, sale, product.saleType);
            return lo === hi ? formatPrice(lo) : `${formatPrice(lo)} – ${formatPrice(hi)}`;
          })()}
        </p>
      </div>
      </Link>

      {/* Add to cart */}
      <div className="mt-3">
        {picking && available.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {available.map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => addVariant(v)}
                className="px-2.5 py-1 text-[11px] bg-white text-[#5A5040] ring-1 ring-[#E0D6BD] hover:ring-[#A8975E] hover:text-[#1C1711] transition-colors"
              >
                {L(lang, v.name, v.nameAr)}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onAdd}
          disabled={available.length === 0}
          className={`w-full py-2.5 text-[10px] tracking-[0.2em] uppercase transition-colors ${
            available.length === 0
              ? "bg-[#EDE6D4] text-[#8A7E6E] cursor-not-allowed"
              : added
              ? "bg-[#8A7A4A] text-[#F5EFE2]"
              : "border border-[#A8975E] text-[#8A7A4A] hover:bg-[#A8975E] hover:text-[#F5EFE2]"
          }`}
        >
          {available.length === 0 ? <Txt k="card.soldOut" /> : added ? <Txt k="card.added" /> : picking ? <Txt k="card.chooseOption" /> : <Txt k="card.addToCart" />}
        </button>
      </div>
    </div>
  );
}
