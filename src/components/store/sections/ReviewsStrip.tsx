"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT, useLang } from "@/components/store/TextsProvider";

export interface ReviewPhoto { url: string; caption: string }

const Arrow = ({ dir }: { dir: "prev" | "next" }) => (
  <svg className="flip-rtl" width="14" height="10" viewBox="0 0 12 8" fill="none" aria-hidden="true">
    {dir === "next"
      ? <path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      : <path d="M11 4H1M5 1L2 4l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
  </svg>
);

export default function ReviewsStrip({ photos, alt }: { photos: ReviewPhoto[]; alt: string }) {
  const t = useT();
  const rtl = useLang() === "ar";
  const row = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const scroll = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? 240) + 16;
    // scrollLeft is negative-going in RTL, so "next" means scrolling left there
    el.scrollBy({ left: dir * step * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const btn = "hidden md:flex w-10 h-10 items-center justify-center border border-[#A8975E] text-[#A8975E] hover:bg-[#A8975E] hover:text-[#1C1711] transition-colors";

  return (
    <div className="max-w-7xl mx-auto">
      <div
        ref={row}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {photos.map((p, i) => (
          <figure key={i} data-card className="snap-start shrink-0 w-[220px] md:w-[260px]">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="relative block w-full aspect-[3/4] overflow-hidden bg-[#EDE6D4] cursor-zoom-in"
            >
              <Image src={p.url} alt={p.caption || alt} fill unoptimized sizes="260px" className="object-cover" />
            </button>
            {p.caption && (
              <figcaption dir="auto" className="mt-3 text-xs tracking-wide text-[#5A5040] text-center">{p.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="hidden md:flex justify-center gap-3 mt-6">
          <button type="button" onClick={() => scroll(-1)} aria-label={t("reviews.prev")} className={btn}><Arrow dir="prev" /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={t("reviews.next")} className={btn}><Arrow dir="next" /></button>
        </div>
      )}

      {open !== null && photos[open] && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4 cursor-zoom-out"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={t("reviews.close")}
            className="absolute top-4 end-4 w-10 h-10 text-white text-3xl leading-none"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open].url} alt={photos[open].caption || alt} className="max-h-[85vh] max-w-full object-contain" />
          {photos[open].caption && <p dir="auto" className="mt-3 text-sm text-white/80">{photos[open].caption}</p>}
        </div>
      )}
    </div>
  );
}
