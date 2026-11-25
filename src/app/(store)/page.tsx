import RecommendedForYou from "@/components/store/RecommendedForYou";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import HeroSection from "@/components/store/sections/HeroSection";
import FeaturedProducts from "@/components/store/sections/FeaturedProducts";
import CategoryGrid from "@/components/store/sections/CategoryGrid";
import BannerSection from "@/components/store/sections/BannerSection";
import BundlesSection from "@/components/store/sections/BundlesSection";
import { bundleInclude } from "@/lib/bundle-include";
import type { BundleView } from "@/lib/bundles";
import MarqueeStrip from "@/components/store/sections/MarqueeStrip";
import EditorialSection from "@/components/store/sections/EditorialSection";
import ReviewsSection from "@/components/store/sections/ReviewsSection";
import CustomSection from "@/components/store/sections/CustomSection";
import FontScope from "@/components/store/sections/FontScope";
import SectionLists from "@/components/store/sections/SectionLists";
import { Fragment } from "react";
import { applyOrder, getSavedOrder } from "@/lib/section-order";
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
  // "Bundles": all active bundles, or only the ones picked in the admin
  const bundleSection = sections.find((s: SiteSection) => s.type === "bundles");
  const bc = bundleSection ? parseJson<Record<string, string>>(bundleSection.content, {}) : {};
  let bundles: BundleView[] = [];
  if (bundleSection) {
    const picked = parseIds(bc.bundleIds);
    const found = (await prisma.bundle.findMany({
      where: { isActive: true, ...(bc.bundleMode === "selected" ? { id: { in: picked } } : {}) },
      include: bundleInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    })) as unknown as BundleView[];
    bundles = bc.bundleMode === "selected"
      ? picked.map((id) => found.find((b) => b.id === id)).filter((b): b is BundleView => !!b)
      : found.slice(0, Math.min(12, Math.max(1, parseInt(bc.bundleLimit) || 4)));
  }
  return { sections, featured, categories, bundles, bundleSection };
}

export default async function HomePage() {
  const { sections, featured, categories, bundles, bundleSection } = await getHomeData();

  const heroSection = sections.find((s: SiteSection) => s.type === "hero");
  const categoriesSection = sections.find((s: SiteSection) => s.type === "categories");
  const featuredSection = sections.find((s: SiteSection) => s.type === "featured");
  const editorialSection = sections.find((s: SiteSection) => s.type === "editorial");
  const bannerSection = sections.find((s: SiteSection) => s.type === "banner");

  // a section can have its own font (Admin > Pages > Font)
  const F = (sec: SiteSection | undefined, el: React.ReactNode) =>
    sec ? <FontScope key={sec.id} content={parseJson<Record<string, string>>(sec.content, {})}>{el}</FontScope> : el;

  // Scrolling strips can be placed under the hero (default), categories, featured, or at the bottom
  const strips = (pos: string) =>
    sections
      .filter((s: SiteSection) => s.type === "marquee")
      .map((s: SiteSection) => ({ id: s.id, c: parseJson<Record<string, string>>(s.content, {}) }))
      .filter((s) => (s.c.position || "hero") === pos)
      .map((s) => <Fragment key={s.id}><MarqueeStrip content={s.c} /><SectionLists section={sections.find((x: SiteSection) => x.id === s.id)} /></Fragment>);

  const heroContent = heroSection
    ? parseJson<Record<string, string>>(heroSection.content, {})
    : {};

  // When the sections were ordered in Admin > Pages, show them exactly in that order
  const saved = await getSavedOrder("home");
  if (saved) {
    const renderOne = (s: SiteSection) => {
      const c = parseJson<Record<string, string>>(s.content, {});
      switch (s.type) {
        case "hero": return s.id === heroSection?.id ? <HeroSection key={s.id} content={c} /> : null;
        case "marquee": return <MarqueeStrip key={s.id} content={c} />;
        case "categories":
          return s.id === categoriesSection?.id && categories.length > 0
            ? <CategoryGrid key={s.id} categories={categories as Category[]} content={c} /> : null;
        case "featured":
          return s.id === featuredSection?.id && featured.length > 0
            ? <FeaturedProducts key={s.id} products={featured as (Product & { variants: Variant[]; category: Category | null })[]} content={c} /> : null;
        case "bundles": return s.id === bundleSection?.id ? <BundlesSection key={s.id} bundles={bundles} content={c} /> : null;
        case "editorial": return <EditorialSection key={s.id} content={c} />;
        case "banner": return <BannerSection key={s.id} content={c} />;
        case "custom": return <CustomSection key={s.id} content={c} />;
        case "reviews": return <ReviewsSection key={s.id} content={c} />;
        default: return null;
      }
    };
    const render = (s: SiteSection) => {
      const el = renderOne(s);
      return el ? <Fragment key={s.id}><FontScope content={parseJson<Record<string, string>>(s.content, {})}>{el}</FontScope><SectionLists section={s} /></Fragment> : null;
    };
    return <div className="bg-[#F5EFE2]">{applyOrder(sections, saved).map(render)}</div>;
  }

  return (
    <div className="bg-[#F5EFE2]">
      {F(heroSection, <HeroSection content={heroContent} />)}
      <SectionLists section={heroSection} />
      {strips("hero")}

      {categoriesSection && categories.length > 0 && F(categoriesSection,
        <CategoryGrid
          categories={categories as Category[]}
          content={parseJson<Record<string, string>>(categoriesSection.content, {})}
        />
      )}
      <SectionLists section={categoriesSection} />

      {strips("categories")}

      {featuredSection && featured.length > 0 && F(featuredSection,
        <FeaturedProducts
          products={featured as (Product & { variants: Variant[]; category: Category | null })[]}
          content={parseJson<Record<string, string>>(featuredSection.content, {})}
        />
      )}
      <SectionLists section={featuredSection} />

      {bundleSection && F(bundleSection,
        <BundlesSection bundles={bundles} content={parseJson<Record<string, string>>(bundleSection.content, {})} />
      )}
      <SectionLists section={bundleSection} />

      {strips("featured")}

      {editorialSection && F(editorialSection,
        <EditorialSection content={parseJson<Record<string, string>>(editorialSection.content, {})} />
      )}
      <SectionLists section={editorialSection} />

      {bannerSection && F(bannerSection,
        <BannerSection content={parseJson<Record<string, string>>(bannerSection.content, {})} />
      )}
      <SectionLists section={bannerSection} />

      {sections
        .filter((s: SiteSection) => s.type === "custom")
        .map((s: SiteSection) => (
          <CustomSection key={s.id} content={JSON.parse(s.content || "{}")} />
        ))}

      {sections
        .filter((s: SiteSection) => s.type === "reviews")
        .map((s: SiteSection) => (
          <Fragment key={s.id}>
            <ReviewsSection content={parseJson<Record<string, string>>(s.content, {})} />
            <SectionLists section={s} />
          </Fragment>
        ))}

      <RecommendedForYou />

      {strips("bottom")}
    </div>
  );
}
