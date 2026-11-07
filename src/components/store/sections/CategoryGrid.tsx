import Link from "next/link";
import Image from "next/image";
import type { Category } from "@prisma/client";

interface Props {
  categories: Category[];
  content?: Record<string, string>;
}

export default function CategoryGrid({ categories, content = {} }: Props) {
  if (categories.length === 0) return null;

  const eyebrow = content.eyebrow || "Collections";
  const heading = content.heading || "Shop by Category";
  const linkText = content.linkText || "All Pieces";

  return (
    <section className="bg-[#F5EFE2] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            {eyebrow && (
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-2 flex items-center gap-3">
                <span className="w-6 h-px bg-[#A8975E]" /> {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="font-serif text-4xl md:text-5xl font-light text-[#1C1711]">
                {heading}
              </h2>
            )}
          </div>
          {linkText && (
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#5A5040] hover:text-[#A8975E] transition-colors border-b border-[#5A5040]/30 pb-0.5 hover:border-[#A8975E]"
            >
              {linkText}
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden bg-[#EDE6D4]"
              style={{ aspectRatio: idx === 0 ? "2/3" : "3/4" }}
            >
              {/* Image */}
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#EDE6D4] to-[#C4B07A]/30" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1711]/80 via-[#1C1711]/20 to-transparent" />

              {/* Gold border on hover */}
              <div className="absolute inset-0 ring-1 ring-inset ring-[#A8975E]/0 group-hover:ring-[#A8975E]/60 transition-all duration-500" />

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="font-serif text-xl md:text-2xl font-light text-[#F5EFE2] group-hover:text-[#C4B07A] transition-colors duration-300">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-[10px] text-[#C4B07A]/70 mt-1 tracking-wide line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {cat.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-1 group-hover:translate-y-0">
                  <span className="text-[9px] tracking-[0.25em] uppercase text-[#A8975E]">Shop Now</span>
                  <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                    <path d="M1 3.5h8M6 1l3 2.5L6 6" stroke="#A8975E" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
