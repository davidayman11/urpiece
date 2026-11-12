import Image from "next/image";
import Link from "next/link";

interface Props {
  content: Record<string, string>;
}

export default function EditorialSection({ content }: Props) {
  const imageRight = content.imagePosition !== "left";

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch ${imageRight ? "" : "md:[direction:rtl]"}`}>
        {/* Image */}
        <div className="relative aspect-[4/5] md:aspect-auto min-h-[500px] overflow-hidden" style={imageRight ? {} : { direction: "ltr" }}>
          {content.image ? (
            <Image
              src={content.image}
              alt={content.heading || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[#EDE6D4]" />
          )}
        </div>

        {/* Text */}
        <div
          className="bg-[#1C1711] flex flex-col justify-center px-10 md:px-16 py-16 md:py-24"
          style={imageRight ? {} : { direction: "ltr" }}
        >
          {content.eyebrow && (
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-5" style={{ color: content.eyebrowColor || undefined }}>
              {content.eyebrow}
            </p>
          )}
          <h2 className="font-serif text-3xl md:text-5xl font-light text-[#F5EFE2] leading-tight mb-6" style={{ color: content.headingColor || undefined }}>
            {(content.heading || "").split("\n").map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h2>
          {content.body && (
            <p className="text-sm text-[#8A7E6E] leading-relaxed mb-8 max-w-sm">
              {content.body}
            </p>
          )}
          {content.buttonText && content.buttonUrl && (
            <Link
              href={content.buttonUrl}
              className="self-start inline-flex items-center gap-3 border border-[#A8975E] text-[#A8975E] px-7 py-3 text-xs tracking-widest uppercase hover:bg-[#A8975E] hover:text-[#1C1711] transition-all duration-300"
            >
              {content.buttonText}
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
