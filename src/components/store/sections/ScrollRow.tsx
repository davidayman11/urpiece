"use client";

import { useEffect, useRef, useState } from "react";
import { useT, useLang } from "@/components/store/TextsProvider";

/**
 * A horizontally scrolling row (swipe on a phone, arrows on a computer).
 * With `auto` it also moves by itself every `seconds` and loops back to the start.
 * It pauses while you hover, touch it, or the browser tab is in the background.
 */
export default function ScrollRow({ children, auto = false, seconds = 4 }: { children: React.ReactNode; auto?: boolean; seconds?: number }) {
  const t = useT();
  const rtl = useLang() === "ar";
  const row = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [edge, setEdge] = useState({ start: true, end: false });

  const step = () => {
    const el = row.current;
    const card = el?.firstElementChild as HTMLElement | null;
    return (card?.offsetWidth ?? 240) + 16;
  };
  const scroll = (dir: 1 | -1) => {
    // scrollLeft runs the other way in right-to-left pages
    row.current?.scrollBy({ left: dir * step() * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const measure = () => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdge({ start: pos < 4, end: max - pos < 4 });
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = row.current;
      if (!el || paused.current || document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 4) return;
      const pos = Math.abs(el.scrollLeft);
      // back to the start once the last card is reached
      if (max - pos < step() * 0.6) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: step() * (rtl ? -1 : 1), behavior: "smooth" });
    }, Math.max(1, seconds) * 1000);
    return () => clearInterval(id);
  }, [auto, seconds, rtl]);

  const arrow = "hidden md:flex w-10 h-10 items-center justify-center border border-[#A8975E] text-[#A8975E] hover:bg-[#A8975E] hover:text-[#1C1711] transition-colors disabled:opacity-30 disabled:pointer-events-none";

  return (
    <div>
      <div
        ref={row}
        onScroll={measure}
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
        onTouchStart={() => { paused.current = true; }}
        onTouchEnd={() => { setTimeout(() => { paused.current = false; }, 4000); }}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="hidden md:flex justify-center gap-3 mt-6">
        <button type="button" onClick={() => scroll(-1)} disabled={edge.start} aria-label={t("reviews.prev")} className={arrow}>
          <svg className="flip-rtl" width="14" height="10" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M11 4H1M5 1L2 4l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </button>
        <button type="button" onClick={() => scroll(1)} disabled={edge.end} aria-label={t("reviews.next")} className={arrow}>
          <svg className="flip-rtl" width="14" height="10" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}
