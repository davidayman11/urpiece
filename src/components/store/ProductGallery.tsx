"use client";

import { useState } from "react";
import Image from "next/image";
import { useVariantSelection } from "@/components/store/VariantSelection";
import { galleryImages } from "@/lib/product-images";

interface Props {
  /** photos shown for every variant */
  images: string[];
  /** photos that belong to one variant, by variant id */
  variantImages?: Record<string, string[]>;
  name: string;
}

export default function ProductGallery({ images: general, variantImages = {}, name }: Props) {
  const sel = useVariantSelection();
  const variantId = sel?.variantId ?? "";
  const images = galleryImages(general, variantImages[variantId] || [], Object.values(variantImages));

  // Picking a different variant starts again from its first photo
  const [pos, setPos] = useState({ v: variantId, i: 0 });
  const current = pos.v === variantId ? Math.min(pos.i, Math.max(0, images.length - 1)) : 0;
  const setCurrent = (next: number | ((p: number) => number)) =>
    setPos({ v: variantId, i: typeof next === "function" ? next(current) : next });

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-[#EDE6D4] flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-[#C4B07A]">
          <circle cx="40" cy="40" r="22" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="40" cy="40" r="4" fill="currentColor"/>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            return (
              <line key={i}
                x1={40 + Math.cos(a) * 26} y1={40 + Math.sin(a) * 26}
                x2={40 + Math.cos(a) * 34} y2={40 + Math.sin(a) * 34}
                stroke="currentColor" strokeWidth="1.5"/>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE6D4]">
        <Image
          src={images[current]}
          alt={`${name} ${current + 1}`}
          fill
          className="object-cover"
          priority
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-[#F5EFE2]/80 hover:bg-[#F5EFE2] transition-colors"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M8 2L2 8l6 6" stroke="#1C1711" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setCurrent((p) => (p + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#F5EFE2]/80 hover:bg-[#F5EFE2] transition-colors"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M2 2l6 6-6 6" stroke="#1C1711" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative w-16 h-20 overflow-hidden transition-all ${
                i === current ? "ring-1 ring-[#A8975E]" : "opacity-50 hover:opacity-80"
              }`}
            >
              <Image src={img} alt={`${name} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
