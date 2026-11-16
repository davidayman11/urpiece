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
        <div>
          <p className="text-xs tracking-widest uppercase text-[#5A5040] mb-3"><Txt k="product.packaging.title" /></p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPackId("")}
              aria-pressed={packId === ""}
              className={`border text-start p-3 transition-colors ${packId === "" ? "border-[#1C1711] ring-1 ring-[#1C1711] bg-white" : "border-[#E0D6BD] bg-[#FBF8F0] hover:border-[#A8975E]"}`}
            >
              <span className="block text-sm text-[#1C1711]"><Txt k="product.packaging.none" /></span>
            </button>
            {packaging.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPackId(p.id)}
                aria-pressed={packId === p.id}
                className={`border text-start overflow-hidden transition-colors ${packId === p.id ? "border-[#1C1711] ring-1 ring-[#1C1711] bg-white" : "border-[#E0D6BD] bg-[#FBF8F0] hover:border-[#A8975E]"}`}
              >
                {p.image && (
                  <span className="relative block aspect-square bg-[#EDE6D4]">
                    <Image src={p.image} alt="" fill sizes="200px" className="object-cover" />
                  </span>
                )}
                <span className="block p-3">
                  <span className="block text-sm text-[#1C1711]">{L(lang, p.name, p.nameAr)}</span>
                  <span className="block text-xs text-[#8A7E6E] mt-0.5">
                    {p.price > 0 ? `+ ${formatPrice(p.price)}` : <Txt k="product.packaging.free" />}
                  </span>
                </span>
              </button>
            ))}
          </div>
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
