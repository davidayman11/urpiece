import Link from "next/link";
import { getLang } from "@/lib/lang-server";
import { cx } from "@/lib/localize";
import BundleCard from "@/components/store/BundleCard";
import type { BundleView } from "@/lib/bundles";

export default async function BundlesSection({ bundles, content = {} }: { bundles: BundleView[]; content?: Record<string, string> }) {
  if (bundles.length === 0) return null;
  const lang = await getLang();
  const pick = (f: string, d: string) => (content[f] === undefined ? d : cx(content, f, lang));
  const eyebrow = pick("eyebrow", "Better together");
  const heading = pick("heading", "Bundles");
  const linkText = pick("linkText", "All bundles");
  return (
    <section data-font-area="bundles" className="bg-[#F5EFE2] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            {eyebrow && (
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-2 flex items-center gap-3" style={{ color: content.eyebrowColor || undefined }}>
                <span className="w-6 h-px bg-[#A8975E]" style={{ backgroundColor: content.eyebrowColor || undefined }} /> {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="font-serif text-4xl md:text-5xl font-light text-[#1C1711]" style={{ color: content.headingColor || undefined }}>
                {heading}
              </h2>
            )}
          </div>
          {linkText && (
            <Link href="/bundles" className="hidden md:flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#5A5040] hover:text-[#A8975E] transition-colors border-b border-[#5A5040]/30 pb-0.5 hover:border-[#A8975E]">
              {linkText}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {bundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
        </div>
      </div>
    </section>
  );
}
