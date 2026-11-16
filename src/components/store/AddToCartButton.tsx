"use client";

import { useState } from "react";
import { useVariantSelection } from "@/components/store/VariantSelection";
import { parseImgs } from "@/lib/product-images";

import { useCartStore } from "@/lib/store/cart";
import { formatPrice, parseJson } from "@/lib/utils";
import { salePrice, saleLabel, activeSaleValue } from "@/lib/pricing";
import { L } from "@/lib/localize";
import { Txt, useLang } from "@/components/store/TextsProvider";
import Image from "next/image";
import type { Product, Variant } from "@prisma/client";

export interface PackagingChoice { id: string; name: string; nameAr: string | null; image: string | null; price: number }

interface Props {
  product: Product & { variants: Variant[] };
  packaging?: PackagingChoice[];
}

export default function AddToCartButton({ product, packaging = [] }: Props) {
  const lang = useLang();
  const addItem = useCartStore((s) => s.addItem);
  // The chosen variant is shared with the photo gallery (so the right photos show)
  const shared = useVariantSelection();
  const [localVariantId, setLocalVariantId] = useState<string>(product.variants[0]?.id || "");
  const selectedVariantId = shared?.variantId || localVariantId;
  const setSelectedVariantId = (id: string) => { setLocalVariantId(id); shared?.setVariantId(id); };
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // "" = no packaging
  const [packId, setPackId] = useState("");
  const pack = packaging.find((p) => p.id === packId);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const sale = activeSaleValue(product);
  const images = parseJson<string[]>(product.images, []);

  if (product.variants.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-sm text-[#8A7E6E]"><Txt k="buy.noVariants" /></p>
      </div>
    );
  }

  const inventory = selectedVariant?.inventory ?? 0;
  const inStock = inventory > 0;
  const isLowStock = inStock && inventory <= 5;

  const handleAdd = () => {
    if (!selectedVariant || !inStock) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      productNameAr: product.nameAr || undefined,
      variantNameAr: selectedVariant.nameAr || undefined,
      price: salePrice(selectedVariant.price, sale, product.saleType),
      image: parseImgs(selectedVariant.images)[0] || images[0] || "",
      quantity: qty,
      ...(pack ? { packagingId: pack.id, packagingName: pack.name, packagingNameAr: pack.nameAr || undefined, packagingPrice: pack.price } : {}),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="mt-8 space-y-5">
      {/* Price */}
      <div className="text-2xl font-serif text-[#1C1711]">
        {selectedVariant ? (
          sale > 0 ? (
            <span className="flex items-baseline gap-3">
              <span>{formatPrice(salePrice(selectedVariant.price, sale, product.saleType))}</span>
              <span className="text-base text-[#8A7E6E] line-through">{formatPrice(selectedVariant.price)}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase bg-[#B23A3A] text-[#F5EFE2] px-2 py-1">{saleLabel(sale, product.saleType)}</span>
            </span>
          ) : formatPrice(selectedVariant.price)
        ) : "—"}
      </div>

      {/* Selected variant label */}
      {product.variants.length > 1 && selectedVariant && (
        <p className="text-xs tracking-widest uppercase text-[#5A5040]">
          {L(lang, selectedVariant.name, selectedVariant.nameAr)}
        </p>
      )}

      {/* Stock status */}
      {!inStock && (
        <p className="flex items-center gap-2 text-[11px] text-[#8A7E6E] tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#8A7E6E] inline-block" />
          <Txt k="buy.variantOutOfStock" />
        </p>
      )}
      {isLowStock && (
        <p className="flex items-center gap-2 text-[11px] text-[#C4834A] tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#C4834A] inline-block" />
          <Txt k="buy.lowStock" vars={{ count: inventory }} />
        </p>
      )}

      {/* Packaging (optional, set per product in the admin) */}
      {packaging.length > 0 && (
        <div className="border border-[#E0D6BD] bg-[#FBF8F0] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#1C1711]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8975E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h18v4H3zM5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1-4-2.5S9 3 10.5 4 12 8 12 8zm0 0c2.5 0 4-1 4-2.5S15 3 13.5 4 12 8 12 8z" />
              </svg>
              <Txt k="product.packaging.title" />
            </p>
            {pack && (
              <span className="text-xs text-[#A8975E]">
                {pack.price > 0 ? `+ ${formatPrice(pack.price)}` : <Txt k="product.packaging.free" />}
              </span>
            )}
          </div>
          <div role="radiogroup" className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
            {[{ id: "", name: "", nameAr: null, image: null, price: 0 } as PackagingChoice, ...packaging].map((p) => {
              const on = packId === p.id;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  key={p.id || "none"}
                  onClick={() => setPackId(p.id)}
                  className={`group relative text-start overflow-hidden bg-white transition-all duration-200 ${
                    on ? "ring-2 ring-[#A8975E] shadow-md" : "ring-1 ring-[#E0D6BD] hover:ring-[#A8975E]/60 hover:shadow-sm"
                  }`}
                >
                  <span className="relative block aspect-square bg-[#F1EBDB] overflow-hidden">
                    {p.id === "" ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[#B8AC8C]">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 8h18v4H3zM5 12v8h14v-8M12 8v12" />
                          <path d="M3 3l18 18" />
                        </svg>
                      </span>
                    ) : p.image ? (
                      <Image src={p.image} alt="" fill sizes="(min-width:640px) 160px, 45vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[#A8975E] text-3xl" aria-hidden="true">🎁</span>
                    )}
                    {on && (
                      <span className="absolute top-2 end-2 w-6 h-6 rounded-full bg-[#A8975E] flex items-center justify-center shadow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5EFE2" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      </span>
                    )}
                  </span>
                  <span className="block px-3 py-2.5">
                    <span className="block text-[13px] leading-snug text-[#1C1711]">
                      {p.id === "" ? <Txt k="product.packaging.none" /> : L(lang, p.name, p.nameAr)}
                    </span>
                    {p.id !== "" && (
                      <span className={`inline-block mt-1 text-[11px] tracking-wide ${p.price > 0 ? "text-[#8A7A4A]" : "text-green-700"}`}>
                        {p.price > 0 ? `+ ${formatPrice(p.price)}` : <Txt k="product.packaging.free" />}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {pack && pack.price > 0 && selectedVariant && (
            <p className="mt-4 pt-3 border-t border-[#E0D6BD] flex items-center justify-between text-sm">
              <span className="text-[#5A5040]"><Txt k="product.packaging.totalWith" /></span>
              <span className="font-serif text-lg text-[#1C1711]">
                {formatPrice((salePrice(selectedVariant.price, sale, product.saleType) + pack.price) * qty)}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-[#CFC4A6] bg-white">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-[#5A5040] hover:text-[#1C1711] transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-10 flex items-center justify-center text-[#5A5040] hover:text-[#1C1711] transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={!inStock}
          className={`flex-1 py-3.5 text-xs tracking-widest uppercase transition-all ${
            !inStock
              ? "bg-[#EDE6D4] text-[#8A7E6E] cursor-not-allowed"
              : added
              ? "bg-[#8A7A4A] text-[#F5EFE2]"
              : "bg-[#A8975E] text-[#F5EFE2] hover:bg-[#8A7A4A]"
          }`}
        >
          {!inStock ? <Txt k="buy.soldOut" /> : added ? <Txt k="buy.added" /> : <Txt k="buy.addToCart" />}
        </button>
      </div>
    </div>
  );
}
