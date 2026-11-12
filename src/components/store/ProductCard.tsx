"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, parseJson } from "@/lib/utils";
import { salePrice, saleLabel, activeSaleValue } from "@/lib/pricing";
import type { Product, Variant, Category } from "@prisma/client";

interface Props {
  product: Product & { variants: Variant[]; category: Category | null };
}

export default function ProductCard({ product }: Props) {
  const images = parseJson<string[]>(product.images, []);
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

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE6D4]">
        {firstImage ? (
          <>
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-700 ease-in-out ${
                secondImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
              }`}
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt={product.name}
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
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#C4B07A]">View Piece</span>
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
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="bg-[#C4834A] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
              Low Stock
            </span>
          )}
          {product.isFeatured && inStock && !isLowStock && (
            <span className="bg-[#A8975E] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-3.5 pb-1">
        {product.category && (
          <p className="text-[9px] tracking-[0.25em] uppercase text-[#A8975E] mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-serif text-[#1C1711] group-hover:text-[#8A7A4A] transition-colors duration-200 leading-snug">
          {product.name}
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
  );
}
