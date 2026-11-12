"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useT, Txt } from "@/components/store/TextsProvider";
import type { Category } from "@prisma/client";

interface Props {
  categories: Category[];
  selected?: string;
  sort?: string;
}

export default function ShopFilters({ categories, selected, sort }: Props) {
  const t = useT();
  const SORT_OPTIONS = [
    { value: "newest", label: t("shop.filters.sortNewest") },
    { value: "price-asc", label: t("shop.filters.sortPriceAsc") },
    { value: "price-desc", label: t("shop.filters.sortPriceDesc") },
  ];
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="mb-8">
      {/* Category pills */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => navigate({ category: undefined })}
          className={`px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase transition-all duration-200 border ${
            !selected
              ? "bg-[#1C1711] text-[#F5EFE2] border-[#1C1711]"
              : "bg-transparent text-[#5A5040] border-[#C4B07A]/50 hover:border-[#A8975E] hover:text-[#1C1711]"
          }`}
        >
          <Txt k="shop.filters.all" />
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate({ category: cat.slug })}
            className={`px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase transition-all duration-200 border ${
              selected === cat.slug
                ? "bg-[#A8975E] text-[#F5EFE2] border-[#A8975E]"
                : "bg-transparent text-[#5A5040] border-[#C4B07A]/50 hover:border-[#A8975E] hover:text-[#1C1711]"
            }`}
          >
            {cat.name}
          </button>
        ))}

        {/* Divider */}
        <span className="hidden md:block w-px h-5 bg-[#C4B07A]/30 mx-1" />

        {/* Sort dropdown */}
        <div className="relative ml-auto md:ml-0">
          <select
            value={sort || "newest"}
            onChange={(e) => navigate({ sort: e.target.value })}
            className="appearance-none pl-3 pr-8 py-1.5 text-[11px] tracking-[0.15em] uppercase text-[#5A5040] bg-white/60 border border-[#CFC4A6] hover:border-[#A8975E] transition-colors cursor-pointer focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8975E]"
            width="10" height="6" viewBox="0 0 10 6" fill="none"
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Thin gold rule */}
      <div className="h-px bg-gradient-to-r from-[#A8975E]/40 via-[#C4B07A]/20 to-transparent" />
    </div>
  );
}
