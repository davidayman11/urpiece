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

  const intro = t("contact.intro");

  // small round icons for the info boxes
  const icon = (paths: string) => (
    <span className="w-10 h-10 rounded-full bg-[#A8975E]/12 text-[#A8975E] flex items-center justify-center shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />
    </span>
  );
  const box = "bg-[#FBF8F0] border border-[#E0D6BD] p-6";

  return (
    <div data-font-area="contact" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          {eyebrow && (
            <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-4 flex items-center gap-3" style={{ color: c.eyebrowColor || undefined }}>
              <span className="w-8 h-px bg-current" />{eyebrow}
            </p>
          )}
          {heading && (
            <h1 className="font-serif text-5xl md:text-6xl font-light text-[#1C1711] leading-tight" style={{ color: c.headingColor || undefined }}>{heading}</h1>
          )}
          {intro && <p className="mt-5 text-base text-[#5A5040] leading-relaxed">{intro}</p>}
        </div>

        <div className={`grid gap-8 items-start ${links.length > 0 ? "lg:grid-cols-5" : "max-w-2xl"}`}>
          {/* Contact buttons */}
          {links.length > 0 && (
            <div className="lg:col-span-3">
              <p className="text-xs tracking-widest uppercase text-[#A8975E] mb-4"><Txt k="contact.links.title" /></p>
              <div className="bg-[#FBF8F0] border border-[#E0D6BD] divide-y divide-[#E8DFC8]">
                {links.map((l, i) => {
                  const external = l.href.startsWith("http");
                  const shown = l.type === "whatsapp" || l.type === "phone" || l.type === "email" || l.label ? l.value : l.value.replace(/^https?:\/\/(www\.)?/, "");
                  return (
                    <a
                      key={i}
                      href={l.href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-[#F3ECD9] transition-colors"
                    >
                      <span className="w-11 h-11 rounded-full ring-1 ring-[#A8975E]/50 text-[#A8975E] group-hover:bg-[#A8975E] group-hover:text-[#F5EFE2] group-hover:ring-[#A8975E] flex items-center justify-center shrink-0 transition-colors">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: l.info.icon }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] text-[#1C1711]">{L(lang, l.label, l.label_ar) || l.info.name}</span>
                        <span dir="auto" className="block text-xs text-[#8A7E6E] truncate mt-0.5">{shown}</span>
                      </span>
                      <svg className="flip-rtl text-[#A8975E] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 rtl:translate-x-1 rtl:group-hover:translate-x-0 transition-all shrink-0" width="14" height="10" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                        <path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info boxes */}
          <div className={`space-y-4 text-sm text-[#5A5040] ${links.length > 0 ? "lg:col-span-2" : ""}`}>
            {supportEmail && (
              <div className={box}>
                <div className="flex items-center gap-3 mb-3">
                  {icon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>')}
                  <p className="text-xs tracking-widest uppercase text-[#A8975E]"><Txt k="contact.support.title" /></p>
                </div>
                <p className="leading-relaxed"><Txt k="contact.support.body" /></p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-4 inline-flex items-center gap-2 bg-[#A8975E] text-[#F5EFE2] px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-[#8A7A4A] transition-colors"
                >
                  <Txt k="contact.support.button" />
                </a>
                <p dir="ltr" className="mt-3 text-xs text-[#8A7E6E] break-all">{supportEmail}</p>
              </div>
            )}
            {paymentNote && (
              <div className={box}>
                <div className="flex items-center gap-3 mb-3">
                  {icon('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>')}
                  <p className="text-xs tracking-widest uppercase text-[#A8975E]"><Txt k="contact.payment.title" /></p>
                </div>
                <p className="leading-relaxed">{paymentNote}</p>
              </div>
            )}
            {shippingNote && (
              <div className={box}>
                <div className="flex items-center gap-3 mb-3">
                  {icon('<path d="M1 6h14v10H1z"/><path d="M15 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>')}
                  <p className="text-xs tracking-widest uppercase text-[#A8975E]"><Txt k="contact.shipping.title" /></p>
                </div>
                <p className="leading-relaxed">{shippingNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {reviews.map((r) => (
        <ReviewsSection key={r.id} content={parseJson<Record<string, string>>(r.content, {})} />
      ))}
    </div>
  );
}
