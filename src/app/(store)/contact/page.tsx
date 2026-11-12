import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { getT } from "@/lib/texts/server";
import { getLang } from "@/lib/lang-server";
import { cx } from "@/lib/localize";

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
  const c = section ? parseJson<Record<string, string>>(section.content, {}) : {};

  const eyebrow = cx(c, "eyebrow", lang) || "Get in Touch";
  const heading = cx(c, "heading", lang) || "Contact Us";
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
    </div>
  );
}
