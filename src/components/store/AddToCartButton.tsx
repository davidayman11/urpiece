"use client";

import { useState } from "react";
import { useVariantSelection } from "@/components/store/VariantSelection";
import { parseImgs } from "@/lib/product-images";

// Map common color names (lowercase) → CSS color
const COLOR_MAP: Record<string, string> = {
  gold: "#C9A227", golden: "#C9A227", ذهبي: "#C9A227",
  silver: "#A8A9AD", فضي: "#A8A9AD",
  "rose gold": "#B76E79", rosegold: "#B76E79", "روز جولد": "#B76E79",
  rose: "#B76E79",
  black: "#1a1a1a", أسود: "#1a1a1a",
  white: "#f0ede6", أبيض: "#f0ede6",
  red: "#c0392b", أحمر: "#c0392b",
  blue: "#2980b9", أزرق: "#2980b9",
  green: "#27ae60", أخضر: "#27ae60",
  pink: "#e91e8c", وردي: "#e91e8c",
  purple: "#8e44ad", بنفسجي: "#8e44ad",
  brown: "#7f5539", بني: "#7f5539",
  beige: "#c8a882", بيج: "#c8a882",
  copper: "#b87333", نحاسي: "#b87333",
  bronze: "#cd7f32",
  navy: "#1e3a5f",
  cream: "#f5f0e8",
  yellow: "#f1c40f", أصفر: "#f1c40f",
  orange: "#e67e22", برتقالي: "#e67e22",
  turquoise: "#1abc9c", فيروزي: "#1abc9c",
  champagne: "#f7e7ce",
  platinum: "#e5e4e2",
  maroon: "#800000",
  gray: "#808080", grey: "#808080", رمادي: "#808080",
};

function getColor(name: string): string | null {
  const lower = (name || "").toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}
import { useCartStore } from "@/lib/store/cart";
import { formatPrice, parseJson } from "@/lib/utils";
import { salePrice, saleLabel, activeSaleValue } from "@/lib/pricing";
import { L } from "@/lib/localize";
import { Txt, useLang } from "@/components/store/TextsProvider";
import type { Product, Variant } from "@prisma/client";

interface Props {
  product: Product & { variants: Variant[] };
}

export default function AddToCartButton({ product }: Props) {
  const lang = useLang();
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
      {product.variants.length > 1 && (() => {
        const displayName = selectedVariant ? L(lang, selectedVariant.name, selectedVariant.nameAr) : "";
        // Check if any variant is a color — if so, show circles for all
        const anyColor = product.variants.some((v) => getColor(v.name) || getColor(v.nameAr || ""));
        return (
          <div>
            <p className="text-xs tracking-widest uppercase text-[#5A5040] mb-3">
              {displayName}
            </p>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((v) => {
                const opts = parseJson<Record<string, string>>(v.options, {});
                const label = (lang === "ar" && v.nameAr?.trim() ? v.nameAr : Object.values(opts).join(" / ")) || v.name;
                const color = anyColor ? (getColor(v.name) || getColor(v.nameAr || "")) : null;
                const isSelected = v.id === selectedVariantId;
                const isOOS = v.inventory === 0;

                if (color) {
                  // Color circle swatch
                  return (
                    <div key={v.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setSelectedVariantId(v.id)}
                        disabled={isOOS}
                        title={label}
                        className={`relative w-9 h-9 rounded-full transition-all border-2 ${
                          isSelected
                            ? "border-[#A8975E] scale-110 shadow-md"
                            : isOOS
                            ? "border-transparent opacity-40 cursor-not-allowed"
                            : "border-transparent hover:border-[#A8975E]/50 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4l3.5 3.5L11 1" stroke={color === "#f0ede6" || color === "#f5f0e8" || color === "#f7e7ce" || color === "#e5e4e2" ? "#1C1711" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                        {isOOS && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[1px] h-full bg-[#8A7E6E]/60 rotate-45 absolute" />
                          </span>
                        )}
                      </button>
                      <span className="text-[9px] text-[#8A7E6E] text-center leading-tight max-w-10 truncate">{label}</span>
                    </div>
                  );
                }

                // Text pill for non-color variants
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={isOOS}
                    className={`px-4 py-2 text-xs border transition-all ${
                      isSelected
                        ? "border-[#A8975E] bg-[#A8975E] text-[#F5EFE2]"
                        : isOOS
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
        );
      })()}

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
