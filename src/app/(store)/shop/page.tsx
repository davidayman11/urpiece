import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/ProductCard";

export const dynamic = "force-dynamic";
import ShopFilters from "@/components/store/ShopFilters";
import type { Product, Variant, Category } from "@prisma/client";

interface Props {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}

export const metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const { category, q, sort } = params;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const selectedCategory = category
    ? categories.find((c: Category) => c.slug === category)
    : null;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { variants: { where: { isActive: true } }, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-[#F5EFE2] min-h-screen">
      {/* Page banner */}
      <div className="bg-[#1C1711] pt-32 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#A8975E] mb-3 flex items-center gap-3">
            <span className="w-6 h-px bg-[#A8975E]" />
            {selectedCategory ? selectedCategory.name : "All Collections"}
          </p>
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-[#F5EFE2]">
              {q ? `"${q}"` : selectedCategory ? selectedCategory.name : "Shop"}
            </h1>
            <p className="hidden md:block text-sm text-[#8A7E6E] mb-1">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-24">
        {/* Filters (horizontal pill row) */}
        <ShopFilters categories={categories as Category[]} selected={category} sort={sort} />

        {/* Mobile count */}
        <p className="md:hidden text-xs text-[#8A7E6E] mb-6">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-[#1C1711] mb-3">No pieces found</p>
            <p className="text-sm text-[#8A7E6E]">Try a different filter or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as Product & { variants: Variant[]; category: Category | null }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
