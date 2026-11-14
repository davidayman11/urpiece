"use client";

import { useState } from "react";
import Image from "next/image";
import { useVariantSelection } from "@/components/store/VariantSelection";
import { galleryImages, parseImgs } from "@/lib/product-images";
import { useLang } from "@/components/store/TextsProvider";
import { L } from "@/lib/localize";

const COLOR_MAP: Record<string, string> = {
  gold: "#C9A227", golden: "#C9A227", ذهبي: "#C9A227",
  silver: "#A8A9AD", فضي: "#A8A9AD",
  "rose gold": "#B76E79", rosegold: "#B76E79", "روز جولد": "#B76E79", rose: "#B76E79",
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
  bronze: "#cd7f32", navy: "#1e3a5f",
  cream: "#f5f0e8", yellow: "#f1c40f", أصفر: "#f1c40f",
  orange: "#e67e22", برتقالي: "#e67e22",
  turquoise: "#1abc9c", فيروزي: "#1abc9c",
  champagne: "#f7e7ce", platinum: "#e5e4e2",
  maroon: "#800000", gray: "#808080", grey: "#808080", رمادي: "#808080",
};

function getColor(name: string): string | null {
  const lower = (name || "").toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

interface VariantRow {
  id: string;
  name: string;
  nameAr?: string | null;
  images: string;
  inventory: number;
}

interface Props {
  images: string[];
  variantImages?: Record<string, string[]>;
  name: string;
  variants?: VariantRow[];
}

export default function ProductGallery({ images: general, variantImages = {}, name, variants = [] }: Props) {
  const lang = useLang();
  const sel = useVariantSelection();
  const variantId = sel?.variantId ?? "";
  const setVariantId = sel?.setVariantId;

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

  const showVariants = variants.length > 1;

  return (
    <div>
      {/* Main image */}
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

      {/* Variant circles — replaces thumbnails */}
      {showVariants && (
        <div className="flex gap-3 mt-4 flex-wrap">
          {variants.map((v) => {
            const isSelected = v.id === variantId;
            const isOOS = v.inventory === 0;
            const variantImg = parseImgs(v.images)[0] || general[0] || "";
            const color = getColor(v.name) || getColor(v.nameAr || "");
            const label = L(lang, v.name, v.nameAr);

            return (
              <div key={v.id} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => { if (!isOOS && setVariantId) setVariantId(v.id); }}
                  disabled={isOOS}
                  title={label}
                  className={`relative w-14 h-14 rounded-full overflow-hidden transition-all border-2 ${
                    isSelected
                      ? "border-[#A8975E] scale-110 shadow-md"
                      : isOOS
                      ? "border-transparent opacity-40 cursor-not-allowed"
                      : "border-transparent hover:border-[#A8975E]/60 hover:scale-105"
                  }`}
                  style={
                    variantImg
                      ? { backgroundImage: `url(${variantImg})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : color
                      ? { backgroundColor: color }
                      : { backgroundColor: "#EDE6D4" }
                  }
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <svg width="14" height="11" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  {isOOS && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[1px] h-full bg-white/70 rotate-45 absolute" />
                    </span>
                  )}
                </button>
                <span className="text-[9px] text-[#8A7E6E] text-center leading-tight max-w-14 truncate">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
