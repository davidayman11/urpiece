import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";
import type { Product, Variant, Category } from "@prisma/client";

interface Props {
  products: (Product & { variants: Variant[]; category: Category | null })[];
  content?: Record<string, string>;
}

export default function FeaturedProducts({ products, content = {} }: Props) {
  const eyebrow = content.eyebrow || "Curated For You";
  const heading = content.heading || "Featured Pieces";
  const linkText = content.linkText || "View All";

  return (
    <section className="bg-[#F5EFE2] py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
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

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {linkText && (
          <div className="mt-10 text-center md:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#A8975E] border-b border-[#A8975E]/40 pb-0.5"
            >
              {linkText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
