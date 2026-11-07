"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";

const NAV_LINKS = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["My Orders", "/orders"],
] as const;

export default function Navbar({ tagline = "" }: { tagline?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.reduce((a, i) => a + i.quantity, 0));

  // Dark hero pages → white logo until scrolled
  const isHeroPage = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solidNav = scrolled || !isHeroPage;
  const textColor = solidNav ? "text-[#1C1711]" : "text-[#F5EFE2]";
  const logoColor = solidNav ? "text-[#A8975E]" : "text-[#C4B07A]";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          solidNav
            ? "bg-[#F5EFE2]/96 backdrop-blur-md border-b border-[#EDE6D4]/60 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 h-[60px] flex items-center justify-between">
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`p-2 -ml-2 ${textColor} transition-colors`}
            aria-label="Open menu"
          >
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
              <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.4" />
              <line x1="4" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.4" />
              <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>

          {/* Logo — centered */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span className={`font-serif text-[22px] font-light tracking-[0.25em] uppercase transition-colors duration-500 ${logoColor}`}>
              UrPiece
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <Link
              href="/shop"
              className={`hidden md:block text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 ${
                solidNav ? "text-[#5A5040] hover:text-[#A8975E]" : "text-[#F5EFE2]/80 hover:text-[#C4B07A]"
              }`}
            >
              Shop
            </Link>
            <Link
              href="/cart"
              className={`relative p-1.5 -mr-1.5 transition-colors duration-300 ${textColor}`}
              aria-label="Cart"
            >
              <svg width="21" height="19" viewBox="0 0 21 19" fill="none">
                <path d="M1 1h3.2l2.3 9.5h8.5l2.3-6.5H5.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="16.5" r="1.5" fill="currentColor" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#A8975E] text-[#F5EFE2] text-[9px] flex items-center justify-center rounded-full px-0.5 font-semibold leading-none">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-[#1C1711] transition-opacity duration-300 ${
            menuOpen ? "opacity-50" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer */}
        <nav
          className={`absolute top-0 left-0 bottom-0 w-[280px] bg-[#F5EFE2] flex flex-col transition-transform duration-400 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDE6D4]">
            <span className="font-serif text-lg tracking-[0.2em] text-[#A8975E] uppercase">UrPiece</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1 text-[#5A5040] hover:text-[#1C1711] transition-colors"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2 2 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-col px-6 py-8 gap-5">
            {NAV_LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm tracking-[0.18em] uppercase transition-colors ${
                  pathname === href ? "text-[#A8975E]" : "text-[#5A5040] hover:text-[#A8975E]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Category quick-links */}
          <div className="px-6 py-5 border-t border-[#EDE6D4]">
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#A8975E] mb-4">Collections</p>
            {["Necklaces", "Earrings", "Rings", "Bracelets"].map((cat) => (
              <Link
                key={cat}
                href={`/shop?category=${cat.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="block text-xs text-[#8A7E6E] hover:text-[#A8975E] transition-colors py-1.5 tracking-wide"
              >
                {cat}
              </Link>
            ))}
          </div>

          {tagline && (
            <div className="mt-auto px-6 pb-8">
              <p className="text-xs text-[#8A7E6E]/60 tracking-wider italic font-serif">{tagline}</p>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
