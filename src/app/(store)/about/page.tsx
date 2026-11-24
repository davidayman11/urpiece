import RichText from "@/components/RichText";
import { fieldSizeStyle } from "@/lib/rich";
import { parseJson } from "@/lib/utils";
import { getT } from "@/lib/texts/server";
import { getLang } from "@/lib/lang-server";
import { cx } from "@/lib/localize";
import { loadMainSection } from "@/lib/section-merge";
import PageSections from "@/components/store/sections/PageSections";
import SectionLists from "@/components/store/sections/SectionLists";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("about.metaTitle") };
}

export default async function AboutPage() {
  const section = await loadMainSection("about", "about");
  const lang = await getLang();
  const c = section ? parseJson<Record<string, string>>(section.content, {}) : {};

  const eyebrow = cx(c, "eyebrow", lang) || "Our Story";
  const heading = cx(c, "heading", lang) || "About UrPiece";
  const paragraphs = (cx(c, "body", lang) || "UrPiece was born from a belief that every woman deserves pieces that reflect her inner radiance.\n\nEach piece in our collection is chosen with care — for quality, craftsmanship, and the feeling it gives when you wear it.\n\nWe're committed to making premium pieces accessible, with a personal shopping experience and careful attention to every order.").split(/\n\n+/);
  const quote = cx(c, "quote", lang) || "";

  return (
    <div data-font-area="about" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        {eyebrow && (
          <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-3" style={{ color: c.eyebrowColor || undefined }}><RichText text={eyebrow} style={fieldSizeStyle(c, "eyebrow")} /></p>
        )}
        {heading && (
          <h1 className="font-serif text-5xl font-light text-[#1C1711] mb-8" style={{ color: c.headingColor || undefined }}><RichText text={heading} style={fieldSizeStyle(c, "heading")} /></h1>
        )}
        <div className="space-y-6 text-sm text-[#5A5040] leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}><RichText text={p} style={fieldSizeStyle(c, "body")} /></p>
          ))}
          {quote && (
            <p className="font-serif text-2xl text-[#A8975E] italic">&ldquo;<RichText text={quote} style={fieldSizeStyle(c, "quote")} />&rdquo;</p>
          )}
        </div>
      </div>
      <SectionLists section={section} />
      <PageSections page="about" />
    </div>
  );
}
