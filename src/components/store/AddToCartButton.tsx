"use client";

import { useState } from "react";
import { useVariantSelection } from "@/components/store/VariantSelection";
import { parseImgs } from "@/lib/product-images";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice, parseJson } from "@/lib/utils";
import { salePrice, saleLabel, activeSaleValue } from "@/lib/pricing";
import { useT } from "@/components/store/TextsProvider";
import type { Product, Variant } from "@prisma/client";

interface Props {
  product: Product & { variants: Variant[] };
}

export default function AddToCartButton({ product }: Props) {
  const t = useT();
  const addItem = useCartStore((s) => s.addItem);
  // The chosen variant is shared with the photo gallery (so the right photos show)
  const shared = useVariantSelection();
  const [localVariantId, setLocalVariantId] = useState<string>(product.variants[0]?.id || "");
  const selectedVariantId = shared?.variantId || localVariantId;
  const setSelectedVariantId = (id: string) => { setLocalVariantId(id); shared?.setVariantId(id); };
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const sale = activeSaleValue(product);
  const images = parseJson<string[]>(product.images, []);

  if (product.variants.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-sm text-[#8A7E6E]">{t("buy.noVariants")}</p>
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
      price: salePrice(selectedVariant.price, sale, product.saleType),
      image: parseImgs(selectedVariant.images)[0] || images[0] || "",
      quantity: qty,
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

      {/* Variant selection */}
      {product.variants.length > 1 && (
        <div>
          <p className="text-xs tracking-widest uppercase text-[#5A5040] mb-3">
            {selectedVariant?.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const opts = parseJson<Record<string, string>>(v.options, {});
              const label = Object.values(opts).join(" / ") || v.name;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={v.inventory === 0}
                  className={`px-4 py-2 text-xs border transition-all ${
                    v.id === selectedVariantId
                      ? "border-[#A8975E] bg-[#A8975E] text-[#F5EFE2]"
                      : v.inventory === 0
                      ? "border-[#E3DAC3] text-[#B5AA92] line-through cursor-not-allowed"
                      : "border-[#CFC4A6] bg-white/60 text-[#5A5040] hover:border-[#A8975E]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status */}
      {!inStock && (
        <p className="flex items-center gap-2 text-[11px] text-[#8A7E6E] tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#8A7E6E] inline-block" />
          {t("buy.variantOutOfStock")}
        </p>
      )}
      {isLowStock && (
        <p className="flex items-center gap-2 text-[11px] text-[#C4834A] tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#C4834A] inline-block" />
          {t("buy.lowStock", { count: inventory })}
        </p>
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
          {!inStock ? t("buy.soldOut") : added ? t("buy.added") : t("buy.addToCart")}
        </button>
      </div>
    </div>
  );
}
