import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

async function getSiteSettings() {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "settings", isVisible: true },
  });
  return section ? parseJson<Record<string, string>>(section.content, {}) : {};
}

export default async function Footer() {
  const s = await getSiteSettings();

  const tagline = s.tagline || "Your Glow, Your Piece";
  const brandDescription = s.brandDescription || "Premium jewelry and accessories curated for the woman who knows her worth.";
  const contactEmail = s.contactEmail || "hello@urpiece.com";
  const paymentNote = s.paymentNote || "Payment via InstaPay";
  const shippingNote = s.shippingNote || "Orders shipped within 2–5 business days";
  const copyright = s.copyright || `© ${new Date().getFullYear()} UrPiece. All rights reserved.`;

  return (
    <footer className="bg-[#1C1711] text-[#EDE6D4] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <span className="font-serif text-2xl text-[#A8975E] tracking-[0.2em] uppercase">UrPiece</span>
            <p className="mt-3 text-sm text-[#8A7E6E] font-serif italic">{tagline}</p>
            <p className="mt-4 text-xs text-[#8A7E6E] leading-relaxed">{brandDescription}</p>
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
              {paymentNote && <li>{paymentNote}</li>}
              {shippingNote && <li>{shippingNote}</li>}
              {contactEmail && (
                <li className="pt-2">
                  <a href={`mailto:${contactEmail}`} className="hover:text-[#C4B07A] transition-colors">
                    {contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2C2416] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5A5040]">
          <p>{copyright}</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-[#8A7E6E] transition-colors">About</Link>
            <Link href="/contact" className="hover:text-[#8A7E6E] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
