import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import HeroSection from "@/components/store/sections/HeroSection";
import FeaturedProducts from "@/components/store/sections/FeaturedProducts";
import CategoryGrid from "@/components/store/sections/CategoryGrid";
import BannerSection from "@/components/store/sections/BannerSection";
import MarqueeStrip from "@/components/store/sections/MarqueeStrip";
import EditorialSection from "@/components/store/sections/EditorialSection";
import type { Product, Category, Variant, SiteSection } from "@prisma/client";

export const dynamic = "force-dynamic";

const parseIds = (raw?: string): string[] => {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
};

async function getHomeData() {
  const [sections, allCategories] = await Promise.all([
    prisma.siteSection.findMany({
      where: { pageSlug: "home", isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // "Shop by Category": the categories picked in the admin (none picked = all of them), in the order picked
  const catSection = sections.find((s: SiteSection) => s.type === "categories");
  const pickedCats = parseIds(catSection ? parseJson<Record<string, string>>(catSection.content, {}).categoryIds : "");
  const categories = pickedCats.length
    ? pickedCats.map((id) => allCategories.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c)
    : allCategories;

  // "Featured Products": featured only (default) / all products / the products picked in the admin
  const featSection = sections.find((s: SiteSection) => s.type === "featured");
  const fc = featSection ? parseJson<Record<string, string>>(featSection.content, {}) : {};
  const mode = fc.productMode || "featured";
  const limit = Math.min(48, Math.max(1, parseInt(fc.productLimit) || 8));
  const include = { variants: { where: { isActive: true } }, category: true } as const;

  let featured;
  if (mode === "selected") {
    const ids = parseIds(fc.productIds);
    const found = ids.length
      ? await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include })
      : [];
    featured = ids.map((id) => found.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  } else if (mode === "all") {
    featured = await prisma.product.findMany({ where: { isActive: true }, include, orderBy: { createdAt: "desc" }, take: limit });
  } else {
    featured = await prisma.product.findMany({ where: { isActive: true, isFeatured: true }, include, take: limit });
  }
  return { sections, featured, categories };
}

export default async function HomePage() {
  const { sections, featured, categories } = await getHomeData();

  const heroSection = sections.find((s: SiteSection) => s.type === "hero");
  const categoriesSection = sections.find((s: SiteSection) => s.type === "categories");
  const featuredSection = sections.find((s: SiteSection) => s.type === "featured");
  const editorialSection = sections.find((s: SiteSection) => s.type === "editorial");
  const bannerSection = sections.find((s: SiteSection) => s.type === "banner");

  // Scrolling strips can be placed under the hero (default), categories, featured, or at the bottom
  const strips = (pos: string) =>
    sections
      .filter((s: SiteSection) => s.type === "marquee")
      .map((s: SiteSection) => ({ id: s.id, c: parseJson<Record<string, string>>(s.content, {}) }))
      .filter((s) => (s.c.position || "hero") === pos)
      .map((s) => <MarqueeStrip key={s.id} content={s.c} />);

  const heroContent = heroSection
    ? parseJson<Record<string, string>>(heroSection.content, {})
    : {};

  return (
    <div className="bg-[#F5EFE2]">
      <HeroSection content={heroContent} />
      {strips("hero")}

      {categoriesSection && categories.length > 0 && (
        <CategoryGrid
          categories={categories as Category[]}
          content={parseJson<Record<string, string>>(categoriesSection.content, {})}
        />
      )}

      {strips("categories")}

      {featuredSection && featured.length > 0 && (
        <FeaturedProducts
          products={featured as (Product & { variants: Variant[]; category: Category | null })[]}
          content={parseJson<Record<string, string>>(featuredSection.content, {})}
        />
      )}

      {strips("featured")}

      {editorialSection && (
        <EditorialSection content={parseJson<Record<string, string>>(editorialSection.content, {})} />
      )}

      {bannerSection && (
        <BannerSection content={parseJson<Record<string, string>>(bannerSection.content, {})} />
      )}

      {strips("bottom")}
    </div>
  );
}
