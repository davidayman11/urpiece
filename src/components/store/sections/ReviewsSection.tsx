import { getLang } from "@/lib/lang-server";
import { L, cx } from "@/lib/localize";
import ReviewsStrip, { type ReviewPhoto } from "./ReviewsStrip";

interface Props {
  content: Record<string, string>;
}

export default async function ReviewsSection({ content }: Props) {
  const lang = await getLang();
  let raw: unknown = [];
  try { raw = JSON.parse(content.photos || "[]"); } catch { raw = []; }
  const photos: ReviewPhoto[] = (Array.isArray(raw) ? raw : [])
    .filter((p): p is Record<string, string> => !!p && typeof p === "object" && typeof (p as Record<string, unknown>).url === "string" && !!(p as Record<string, unknown>).url)
    .map((p) => ({ url: p.url, caption: L(lang, p.caption, p.caption_ar) }));
  if (photos.length === 0) return null;

  const eyebrow = cx(content, "eyebrow", lang);
  const heading = cx(content, "heading", lang);

  return (
    <section
      data-font-area="reviews"
      className="py-16 md:py-20"
      style={{ backgroundColor: content.bgColor || "#F5EFE2" }}
    >
      {(eyebrow || heading) && (
        <div className="max-w-7xl mx-auto px-6 mb-8 md:mb-10">
          {eyebrow && (
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3" style={{ color: content.eyebrowColor || undefined }}>
              {eyebrow}
            </p>
          )}
          {heading && (
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1C1711]" style={{ color: content.headingColor || undefined }}>
              {heading}
            </h2>
          )}
        </div>
      )}
      <ReviewsStrip photos={photos} alt={heading} />
    </section>
  );
}
