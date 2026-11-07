import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import HeroSection from "@/components/store/sections/HeroSection";
import FeaturedProducts from "@/components/store/sections/FeaturedProducts";
import CategoryGrid from "@/components/store/sections/CategoryGrid";
import BannerSection from "@/components/store/sections/BannerSection";
import EditorialSection from "@/components/store/sections/EditorialSection";
import type { Product, Category, Variant, SiteSection } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [sections, featured, categories] = await Promise.all([
    prisma.siteSection.findMany({
      where: { pageSlug: "home", isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { variants: { where: { isActive: true } }, category: true },
      take: 8,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return { sections, featured, categories };
}

export default async function HomePage() {
  const { sections, featured, categories } = await getHomeData();

  const heroSection = sections.find((s: SiteSection) => s.type === "hero");
  const categoriesSection = sections.find((s: SiteSection) => s.type === "categories");
  const featuredSection = sections.find((s: SiteSection) => s.type === "featured");
  const editorialSection = sections.find((s: SiteSection) => s.type === "editorial");
  const bannerSection = sections.find((s: SiteSection) => s.type === "banner");

  const heroContent = heroSection
    ? parseJson<Record<string, string>>(heroSection.content, {})
    : {};

  return (
    <div className="bg-[#F5EFE2]">
      <HeroSection content={heroContent} />

      {categories.length > 0 && (
        <CategoryGrid
          categories={categories as Category[]}
          content={categoriesSection ? parseJson<Record<string, string>>(categoriesSection.content, {}) : undefined}
        />
      )}

      {featured.length > 0 && (
        <FeaturedProducts
          products={featured as (Product & { variants: Variant[]; category: Category | null })[]}
          content={featuredSection ? parseJson<Record<string, string>>(featuredSection.content, {}) : undefined}
        />
      )}

      {editorialSection && (
        <EditorialSection content={parseJson<Record<string, string>>(editorialSection.content, {})} />
      )}

      {bannerSection && (
        <BannerSection content={parseJson<Record<string, string>>(bannerSection.content, {})} />
      )}
    </div>
  );
}
