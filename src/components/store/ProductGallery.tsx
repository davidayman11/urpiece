"use client";

import { useState } from "react";
import Image from "next/image";
import { useVariantSelection } from "@/components/store/VariantSelection";
import { galleryImages } from "@/lib/product-images";

interface Props {
  images: string[];
  variantImages?: Record<string, string[]>;
  name: string;
}

export default function ProductGallery({ images: general, variantImages = {}, name }: Props) {
  const sel = useVariantSelection();
  const variantId = sel?.variantId ?? "";
  // Only show this variant's photos + general photos — never bleed other variants' photos in
  const images = galleryImages(general, variantImages[variantId] || []);

  const [pos, setPos] = useState({ v: variantId, i: 0 });
  const current = pos.v === variantId ? Math.min(pos.i, Math.max(0, images.length - 1)) : 0;
  const setCurrent = (next: number | ((p: number) => number)) =>
    setPos({ v: variantId, i: typeof next === "function" ? next(current) : next });

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-[#EDE6D4] flex items-center justify-center rounded-sm">
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
      {/* Main image — reduced to 4/5 ratio */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#EDE6D4] rounded-sm">
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
        {/* Dot indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-[#A8975E] w-4" : "bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Square thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-16 overflow-hidden transition-all rounded-sm ${
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
