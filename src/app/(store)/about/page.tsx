import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { getT } from "@/lib/texts/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("about.metaTitle") };
}

export default async function AboutPage() {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "about", type: "about", isVisible: true },
  });
  const c = section ? parseJson<Record<string, string>>(section.content, {}) : {};

  const eyebrow = c.eyebrow || "Our Story";
  const heading = c.heading || "About UrPiece";
  const paragraphs = (c.body || "UrPiece was born from a belief that every woman deserves pieces that reflect her inner radiance.\n\nEach piece in our collection is chosen with care — for quality, craftsmanship, and the feeling it gives when you wear it.\n\nWe're committed to making premium pieces accessible, with a personal shopping experience and careful attention to every order.").split(/\n\n+/);
  const quote = c.quote || "";

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        {eyebrow && (
          <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-3" style={{ color: c.eyebrowColor || undefined }}>{eyebrow}</p>
        )}
        {heading && (
          <h1 className="font-serif text-5xl font-light text-[#1C1711] mb-8" style={{ color: c.headingColor || undefined }}>{heading}</h1>
        )}
        <div className="space-y-6 text-sm text-[#5A5040] leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {quote && (
            <p className="font-serif text-2xl text-[#A8975E] italic">&ldquo;{quote}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  );
}
