import RichText from "@/components/RichText";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/lang-server";
import { L } from "@/lib/localize";
import { bundleInclude } from "@/lib/bundle-include";
import type { BundleView } from "@/lib/bundles";
import ProductCard from "@/components/store/ProductCard";
import BundleCard from "@/components/store/BundleCard";
import ScrollRow from "@/components/store/sections/ScrollRow";
import { Txt } from "@/components/store/TextsProvider";
import type { Product, Variant, Category } from "@prisma/client";

const ids = (raw?: string): string[] => {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
};
const inOrder = <T extends { id: string }>(picked: string[], found: T[]) =>
  picked.map((id) => found.find((x) => x.id === id)).filter((x): x is T => !!x);

/** Wraps cards: a normal grid, or a swipeable / auto-scrolling row (chosen in the admin) */
function Cards({ layout, children, count }: { layout: string; children: React.ReactNode[]; count: number }) {
  if (layout === "scroll" || layout === "auto") {
    return (
      <ScrollRow auto={layout === "auto"} seconds={4}>
        {children.map((c, i) => (
          <div key={i} className="snap-start shrink-0 w-[62%] sm:w-[40%] md:w-[calc(25%-12px)]">{c}</div>
        ))}
      </ScrollRow>
    );
  }
  return <div className={`grid grid-cols-2 ${count <= 3 ? "md:grid-cols-3" : "md:grid-cols-4"} gap-4 md:gap-6`}>{children}</div>;
}

/** The product / bundle / category lists a Custom Section can contain (picked in Admin > Pages) */
export default async function CustomLists({ content, fields, fg }: { content: Record<string, string>; fields: string[]; fg: string }) {
  const lang = await getLang();
  const blocks: React.ReactNode[] = [];

  const title = (key: string) => L(lang, content[key], content[`${key}_ar`]);
  const heading = (key: string) => {
    const t = title(key);
    return t ? <h3 className="font-serif text-2xl md:text-3xl font-light mb-6" style={{ color: fg }}><RichText text={t} /></h3> : null;
  };

  if (fields.includes("listProducts")) {
    const picked = ids(content.listProducts);
    const found = picked.length
      ? await prisma.product.findMany({ where: { id: { in: picked }, isActive: true }, include: { variants: { where: { isActive: true } }, category: true } })
      : [];
    const products = inOrder(picked, found) as (Product & { variants: Variant[]; category: Category | null })[];
    if (products.length) {
      blocks.push(
        <div key="p">
          {heading("listProductsTitle")}
          <Cards layout={content.listProductsLayout || "grid"} count={products.length}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </Cards>
        </div>
      );
    }
  }

  if (fields.includes("listBundles")) {
    const picked = ids(content.listBundles);
    const found = picked.length
      ? ((await prisma.bundle.findMany({ where: { id: { in: picked }, isActive: true }, include: bundleInclude })) as unknown as BundleView[])
      : [];
    const bundles = inOrder(picked, found);
    if (bundles.length) {
      blocks.push(
        <div key="b">
          {heading("listBundlesTitle")}
          <Cards layout={content.listBundlesLayout || "grid"} count={bundles.length}>
            {bundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
          </Cards>
        </div>
      );
    }
  }

  if (fields.includes("listCategories")) {
    const picked = ids(content.listCategories);
    const found = picked.length ? await prisma.category.findMany({ where: { id: { in: picked }, isActive: true } }) : [];
    const cats = inOrder(picked, found);
    if (cats.length) {
      blocks.push(
        <div key="c">
          {heading("listCategoriesTitle")}
          <Cards layout={content.listCategoriesLayout || "grid"} count={cats.length}>
            {cats.map((cat) => (
              <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="group relative block overflow-hidden bg-[#EDE6D4]" style={{ aspectRatio: "3/4" }}>
                {cat.image ? (
                  <Image src={cat.image} alt={L(lang, cat.name, cat.nameAr)} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#EDE6D4] to-[#C4B07A]/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1711]/80 via-[#1C1711]/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <p className="font-serif text-xl md:text-2xl font-light text-[#F5EFE2]">{L(lang, cat.name, cat.nameAr)}</p>
                  <p className="mt-1 text-[9px] tracking-[0.25em] uppercase text-[#A8975E] opacity-0 group-hover:opacity-100 transition-opacity"><Txt k="home.categories.shopNow" /></p>
                </div>
              </Link>
            ))}
          </Cards>
        </div>
      );
    }
  }

  if (blocks.length === 0) return null;
  return <div className="max-w-7xl mx-auto px-6 space-y-14">{blocks}</div>;
}
