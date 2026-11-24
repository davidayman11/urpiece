import Image from "next/image";
import Link from "next/link";
import { L } from "@/lib/localize";
import { getLang } from "@/lib/lang-server";
import CustomLists from "@/components/store/sections/CustomLists";

interface Props {
  content: Record<string, string>;
}

function parseFields(raw?: string): string[] {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

export default async function CustomSection({ content }: Props) {
  const lists = await CustomLists({ content, fields: parseFields(content._fields), fg: content.textColor || "#1C1711" });
  const body = await CustomBody({ content });
  if (!lists) return body;
  return (
    <>
      {body}
      <section style={{ background: content.bgColor || "#F5EFE2" }} className="pb-20 md:pb-28 -mt-8 md:-mt-12">{lists}</section>
    </>
  );
}

async function CustomBody({ content }: Props) {
  const lang = await getLang();
  const fields = parseFields(content._fields);
  const layout = content._layout || "centered";
  const bg = content.bgColor || "#F5EFE2";
  const fg = content.textColor || "#1C1711";

  const hasImage = fields.includes("image") && content.image;
  const isSplit = layout === "image-right" || layout === "image-left";
  const isFullImage = layout === "full-image";

  const TextBlock = () => (
    <div className="space-y-5">
      {fields.includes("eyebrow") && content.eyebrow && (
        <p className="text-[10px] tracking-[0.4em] uppercase flex items-center gap-3" style={{ color: "#A8975E" }}>
          <span className="w-6 h-px bg-current" />
          {L(lang, content.eyebrow, content.eyebrow_ar)}
        </p>
      )}
      {fields.includes("heading") && content.heading && (
        <h2 className="font-serif text-3xl md:text-5xl font-light leading-tight" style={{ color: fg }}>
          {L(lang, content.heading, content.heading_ar)}
        </h2>
      )}
      {fields.includes("subheading") && content.subheading && (
        <p className="text-lg font-light" style={{ color: fg, opacity: 0.75 }}>
          {L(lang, content.subheading, content.subheading_ar)}
        </p>
      )}
      {fields.includes("body") && content.body && (
        <div className="space-y-4">
          {L(lang, content.body, content.body_ar)
            .split(/\n\n+/)
            .map((p, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: fg, opacity: 0.8 }}>
                {p}
              </p>
            ))}
        </div>
      )}
      {fields.includes("quote") && content.quote && (
        <blockquote className="border-l-2 pl-4 italic text-base" style={{ borderColor: "#A8975E", color: fg, opacity: 0.75 }}>
          {L(lang, content.quote, content.quote_ar)}
        </blockquote>
      )}
      {fields.includes("button") && content.buttonText && content.buttonUrl && (
        <Link
          href={content.buttonUrl}
          className="inline-flex items-center gap-3 text-xs tracking-widest uppercase px-8 py-4 bg-[#A8975E] text-[#F5EFE2] hover:bg-[#8A7A4A] transition-colors"
        >
          {L(lang, content.buttonText, content.buttonText_ar)}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );

  if (isFullImage && hasImage) {
    return (
      <section className="relative overflow-hidden" style={{ minHeight: 480 }}>
        <Image src={content.image} alt={content.heading || ""} fill className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,23,17,0.75) 0%, rgba(28,23,17,0.3) 100%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex items-center min-h-[480px]">
          <div style={{ color: "#F5EFE2" }} className="max-w-lg">
            <TextBlock />
          </div>
        </div>
      </section>
    );
  }

  if (isSplit) {
    const imgFirst = layout === "image-left";
    return (
      <section style={{ background: bg }} className="py-20 md:py-28">
        <div className={`max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center ${imgFirst ? "" : "md:grid-flow-dense"}`}>
          {hasImage && (
            <div className={`relative aspect-[4/5] overflow-hidden rounded-sm ${imgFirst ? "" : "md:col-start-2"}`}>
              <Image src={content.image} alt={content.heading || ""} fill className="object-cover" />
            </div>
          )}
          <div className={`space-y-6 ${imgFirst ? "" : "md:col-start-1"}`} style={{ color: fg }}>
            <TextBlock />
          </div>
        </div>
      </section>
    );
  }

  // Centered (default)
  return (
    <section style={{ background: bg }} className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-8" style={{ color: fg }}>
        {hasImage && (
          <div className="relative aspect-video max-w-xl mx-auto overflow-hidden rounded-sm">
            <Image src={content.image} alt={content.heading || ""} fill className="object-cover" />
          </div>
        )}
        <TextBlock />
      </div>
    </section>
  );
}
