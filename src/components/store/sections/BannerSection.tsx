import Image from "next/image";
import Link from "next/link";

interface Props {
  content: Record<string, string>;
}

export default function BannerSection({ content }: Props) {
  return (
    <section className="relative overflow-hidden py-32 my-10">
      {content.image && (
        <Image
          src={content.image}
          alt={content.heading || ""}
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-[#1C1711]/65" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {content.eyebrow && (
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#C4B07A] mb-5" style={{ color: content.eyebrowColor || undefined }}>
            {content.eyebrow}
          </p>
        )}
        <h2 className="font-serif text-4xl md:text-6xl font-light text-[#F5EFE2] leading-tight mb-6" style={{ color: content.headingColor || undefined }}>
          {(content.heading || "").split("\n").map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h2>
        {content.body && (
          <p className="text-sm text-[#C4B07A]/80 max-w-md mx-auto mb-10 leading-relaxed">
            {content.body}
          </p>
        )}
        {content.buttonText && content.buttonUrl && (
          <Link
            href={content.buttonUrl}
            className="inline-flex items-center gap-3 bg-[#A8975E] text-[#F5EFE2] px-10 py-4 text-xs tracking-widest uppercase hover:bg-[#C4B07A] transition-colors"
          >
            {content.buttonText}
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </Link>
        )}
      </div>
    </section>
  );
}
