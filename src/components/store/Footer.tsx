import RichText from "@/components/RichText";
import { fieldSizeStyle } from "@/lib/rich";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { getT } from "@/lib/texts/server";
import { getLang } from "@/lib/lang-server";
import { cx } from "@/lib/localize";

import { Txt } from "@/components/store/TextsProvider";
async function getSiteSettings() {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "settings", isVisible: true },
  });
  return section ? parseJson<Record<string, string>>(section.content, {}) : {};
}

export default async function Footer() {
  const s = await getSiteSettings();
  const t = await getT();
  const lang = await getLang();

  const tagline = cx(s, "tagline", lang) || t("footer.tagline");
  const brandDescription = cx(s, "brandDescription", lang) || t("footer.brandDescription");
  const contactEmail = s.contactEmail || t("footer.contactEmail");
  const paymentNote = cx(s, "paymentNote", lang) || t("footer.paymentNote");
  const shippingNote = cx(s, "shippingNote", lang) || t("footer.shippingNote");
  const copyright = cx(s, "copyright", lang) || t("footer.copyright", { year: new Date().getFullYear() });

  return (
    <footer data-font-area="footer" className="bg-[#1C1711] text-[#EDE6D4] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <span className="font-serif text-2xl text-[#A8975E] tracking-[0.2em] uppercase"><Txt k="footer.brand" /></span>
            <p className="mt-3 text-sm text-[#8A7E6E] font-serif italic">{s.tagline ? <RichText text={cx(s, "tagline", lang)} style={fieldSizeStyle(s, "tagline")} /> : <Txt k="footer.tagline" />}</p>
            <p className="mt-4 text-xs text-[#8A7E6E] leading-relaxed">{s.brandDescription ? <RichText text={cx(s, "brandDescription", lang)} style={fieldSizeStyle(s, "brandDescription")} /> : <Txt k="footer.brandDescription" />}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#A8975E] mb-4"><Txt k="footer.navigate" /></h4>
            <ul className="space-y-3">
              {[["footer.link.shop", "/shop"], ["footer.link.about", "/about"], ["footer.link.contact", "/contact"], ["footer.link.orders", "/orders"]].map(
                ([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#8A7E6E] hover:text-[#C4B07A] transition-colors">
                      <Txt k={label} />
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#A8975E] mb-4"><Txt k="footer.contact" /></h4>
            <ul className="space-y-3 text-sm text-[#8A7E6E]">
              {paymentNote && <li>{s.paymentNote ? <RichText text={cx(s, "paymentNote", lang)} style={fieldSizeStyle(s, "paymentNote")} /> : <Txt k="footer.paymentNote" />}</li>}
              {shippingNote && <li>{s.shippingNote ? <RichText text={cx(s, "shippingNote", lang)} style={fieldSizeStyle(s, "shippingNote")} /> : <Txt k="footer.shippingNote" />}</li>}
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
          <p>{s.copyright ? <RichText text={cx(s, "copyright", lang)} style={fieldSizeStyle(s, "copyright")} /> : <Txt k="footer.copyright" vars={{ year: new Date().getFullYear() }} />}</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-[#8A7E6E] transition-colors"><Txt k="footer.link.about" /></Link>
            <Link href="/contact" className="hover:text-[#8A7E6E] transition-colors"><Txt k="footer.link.contact" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
