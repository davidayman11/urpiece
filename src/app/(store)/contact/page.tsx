import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { getT } from "@/lib/texts/server";
import { getLang } from "@/lib/lang-server";
import { cx } from "@/lib/localize";
import ReviewsSection from "@/components/store/sections/ReviewsSection";
import { parseContactLinks, linkHref, typeInfo } from "@/lib/contact-links";
import { L } from "@/lib/localize";

import { Txt } from "@/components/store/TextsProvider";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("contact.metaTitle") };
}

export default async function ContactPage() {
  const t = await getT();
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "contact", type: "contact", isVisible: true },
  });
  const lang = await getLang();
  const reviews = await prisma.siteSection.findMany({
    where: { pageSlug: "contact", type: "reviews", isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  const c = section ? parseJson<Record<string, string>>(section.content, {}) : {};

  const eyebrow = cx(c, "eyebrow", lang) || "Get in Touch";
  const heading = cx(c, "heading", lang) || "Contact Us";
  // links the admin added: Instagram, WhatsApp, phone, email, any social
  const links = parseContactLinks(c.contactLinks)
    .map((l) => ({ ...l, href: linkHref(l.type, l.value), info: typeInfo(l.type) }))
    .filter((l) => l.href);
  const supportEmail = c.supportEmail || "hello@urpiece.com";
  const paymentNote = cx(c, "paymentNote", lang) || "We accept payment via InstaPay. After placing your order, you'll receive instructions to complete your transfer.";
  const shippingNote = cx(c, "shippingNote", lang) || "Orders are shipped within 2–5 business days. Delivery times vary by location.";

  return (
    <div data-font-area="contact" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-lg mx-auto px-6">
        {eyebrow && (
          <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-3" style={{ color: c.eyebrowColor || undefined }}>{eyebrow}</p>
        )}
        {heading && (
          <h1 className="font-serif text-5xl font-light text-[#1C1711] mb-10" style={{ color: c.headingColor || undefined }}>{heading}</h1>
        )}
        {links.length > 0 && (
          <div className="mb-8">
            <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-4"><Txt k="contact.links.title" /></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {links.map((l, i) => {
                const external = l.href.startsWith("http");
                return (
                  <a
                    key={i}
                    href={l.href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center gap-3 bg-[#EDE6D4] hover:bg-[#A8975E] px-5 py-4 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[#A8975E] group-hover:text-[#F5EFE2] shrink-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: l.info.icon }} />
                    <span className="min-w-0">
                      <span className="block text-sm text-[#1C1711] group-hover:text-[#F5EFE2] truncate">{L(lang, l.label, l.label_ar) || l.info.name}</span>
                      <span dir="auto" className="block text-xs text-[#8A7E6E] group-hover:text-[#F5EFE2]/80 truncate">{l.type === "whatsapp" || l.type === "phone" || l.type === "email" || l.label ? l.value : l.value.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
        <div className="space-y-6 text-sm text-[#5A5040]">
          {supportEmail && (
            <div className="bg-[#EDE6D4] p-6">
              <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-3"><Txt k="contact.support.title" /></p>
              <p className="leading-relaxed"><Txt k="contact.support.body" /></p>
              <a href={`mailto:${supportEmail}`} className="text-[#A8975E] hover:underline font-medium mt-2 block">
                {supportEmail}
              </a>
            </div>
          )}
          {paymentNote && (
            <div className="bg-[#EDE6D4] p-6">
              <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-3"><Txt k="contact.payment.title" /></p>
              <p className="leading-relaxed">{paymentNote}</p>
            </div>
          )}
          {shippingNote && (
            <div className="bg-[#EDE6D4] p-6">
              <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-3"><Txt k="contact.shipping.title" /></p>
              <p className="leading-relaxed">{shippingNote}</p>
            </div>
          )}
        </div>
      </div>
      {reviews.map((r) => (
        <ReviewsSection key={r.id} content={parseJson<Record<string, string>>(r.content, {})} />
      ))}
    </div>
  );
}
