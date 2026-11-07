"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1C1711] text-[#EDE6D4] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <span className="font-serif text-2xl text-[#A8975E] tracking-[0.2em] uppercase">UrPiece</span>
            <p className="mt-3 text-sm text-[#8A7E6E] font-serif italic">Your Glow, Your Piece</p>
            <p className="mt-4 text-xs text-[#8A7E6E] leading-relaxed">
              Premium jewelry and accessories curated for the woman who knows her worth.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#A8975E] mb-4">Navigate</h4>
            <ul className="space-y-3">
              {[["Shop", "/shop"], ["About", "/about"], ["Contact", "/contact"], ["My Orders", "/orders"]].map(
                ([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#8A7E6E] hover:text-[#C4B07A] transition-colors">
                      {label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#A8975E] mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-[#8A7E6E]">
              <li>Payment via InstaPay</li>
              <li>Orders shipped within 2–5 business days</li>
              <li className="pt-2">
                <a href="mailto:hello@urpiece.com" className="hover:text-[#C4B07A] transition-colors">
                  hello@urpiece.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2C2416] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5A5040]">
          <p>© 2026 UrPiece. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-[#8A7E6E] transition-colors">About</Link>
            <Link href="/contact" className="hover:text-[#8A7E6E] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
