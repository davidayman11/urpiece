"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useT } from "@/components/store/TextsProvider";

interface Props {
  content: Record<string, string>;
}

export default function HeroSection({ content }: Props) {
  const t = useT();
  const textRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(40px)";
    const t = setTimeout(() => {
      el.style.transition = "opacity 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const heading = content.heading || "";
  const lines = heading.split("\n");
  const tagline = content.tagline || "";
  const subheading = content.subheading || "";
  const buttonText = content.buttonText || "";
  const buttonUrl = content.buttonUrl || "/shop";
  const secondaryText = content.secondaryText || "";
  const secondaryUrl = content.secondaryUrl || "/about";

  // Banner height is chosen in the admin (Pages & Sections > Hero). A shorter banner lets the next
  // section peek in at the bottom, which shows visitors there is more to scroll to.
  const HEIGHTS: Record<string, string> = {
    full: "min-h-[100svh]",
    tall: "min-h-[85svh]",
    medium: "min-h-[72svh]",
    compact: "min-h-[58svh]",
  };
  const heightClass = HEIGHTS[content.height] || HEIGHTS.medium;
  const cueTone = content.image ? "text-[#F5EFE2]" : "text-[#5A5040]";
  const scrollDown = () => sectionRef.current?.nextElementSibling?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section data-font-area="hero" ref={sectionRef} className={`relative ${heightClass} flex items-center overflow-hidden`}>
      {/* Background */}
      {content.image ? (
        <>
          <Image src={content.image} alt={t("home.hero.imageAlt")} fill className="object-cover" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C1711]/80 via-[#1C1711]/40 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#EDE6D4] via-[#F5EFE2] to-[#DDD0A6]/40" />
      )}

      {/* Radial ornament */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.06] pointer-events-none">
        <svg viewBox="0 0 600 600" fill="none" className="w-full h-full">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            return (
              <line key={i} x1="300" y1="300"
                x2={300 + Math.cos(a) * 290} y2={300 + Math.sin(a) * 290}
                stroke="#A8975E" strokeWidth="0.8" />
            );
          })}
          <circle cx="300" cy="300" r="140" stroke="#A8975E" strokeWidth="0.8" fill="none" />
          <circle cx="300" cy="300" r="200" stroke="#A8975E" strokeWidth="0.5" fill="none" />
          <circle cx="300" cy="300" r="280" stroke="#A8975E" strokeWidth="0.4" fill="none" />
        </svg>
      </div>

      {/* Content */}
      <div ref={textRef} className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-24">
        <div className="max-w-xl">
          {tagline && (
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#A8975E] mb-7 flex items-center gap-3" style={{ color: content.taglineColor || undefined }}>
              <span className="w-8 h-px bg-[#A8975E]" style={{ backgroundColor: content.taglineColor || undefined }} />
              {tagline}
            </p>
          )}
          {heading && (
            <h1 className="font-serif leading-[1.03] text-[#F5EFE2]"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)", fontWeight: 300, color: content.headingColor || undefined }}>
              {lines.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
          )}
          {subheading && (
            <p className="mt-7 text-[#C4B07A]/90 leading-relaxed max-w-sm font-light"
              style={{ fontSize: "clamp(0.875rem, 1.5vw, 1rem)" }}>
              {subheading}
            </p>
          )}
          {(buttonText || secondaryText) && (
            <div className="mt-10 flex flex-wrap items-center gap-5">
              {buttonText && (
                <Link
                  href={buttonUrl}
                  className="group inline-flex items-center gap-3 bg-[#A8975E] text-[#F5EFE2] px-8 py-3.5 text-[11px] tracking-[0.2em] uppercase hover:bg-[#C4B07A] transition-all duration-300"
                >
                  {buttonText}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"
                    className="transition-transform group-hover:translate-x-1 duration-300">
                    <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
              {secondaryText && (
                <Link
                  href={secondaryUrl}
                  className="inline-flex items-center gap-2 text-[#F5EFE2]/70 text-[11px] tracking-[0.2em] uppercase hover:text-[#A8975E] transition-colors duration-300"
                >
                  {secondaryText}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scroll cue — clickable, clearly visible */}
      <button
        type="button"
        onClick={scrollDown}
        aria-label={t("home.hero.scroll")}
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 ${cueTone} opacity-90 hover:opacity-100 transition-opacity`}
      >
        <span className="text-[9px] tracking-[0.35em] uppercase">{t("home.hero.scroll")}</span>
        <svg className="animate-bounce" width="18" height="11" viewBox="0 0 18 11" fill="none" aria-hidden>
          <path d="M1 1.5l8 8 8-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
