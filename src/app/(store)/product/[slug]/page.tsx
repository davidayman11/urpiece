import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";
import ProductGallery from "@/components/store/ProductGallery";
import AddToCartButton from "@/components/store/AddToCartButton";
import { VariantSelectionProvider } from "@/components/store/VariantSelection";
import { parseImgs } from "@/lib/product-images";
import { L } from "@/lib/localize";
import { getLang } from "@/lib/lang-server";
import { getT, getTexts } from "@/lib/texts/server";
import { parseSections } from "@/lib/texts";
import type { Metadata } from "next";

import { Txt } from "@/components/store/TextsProvider";
import RichText from "@/components/RichText";
interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Not Found" };
  return { title: L(await getLang(), product.name, product.nameAr) };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const t = await getT();
  const lang = await getLang();
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      variants: { where: { isActive: true } },
      category: true,
    },
  });

  if (!product) notFound();

  // Increment view count
  await prisma.product.update({
    where: { id: product.id },
    data: { views: { increment: 1 } },
  });

  const images = parseImgs(product.images);
  const variantImages = Object.fromEntries(product.variants.map((v) => [v.id, parseImgs(v.images)]));
  const totalInventory = product.variants.reduce((s, v) => s + v.inventory, 0);
  const isOutOfStock = totalInventory === 0;
  const isLowStock = !isOutOfStock && totalInventory <= 5;
  const viewCount = product.views + 1;

  // Boxes under the buy button: the two built-in ones, then any the admin added in Site Text
  // (tk / bk = the text names of the two built-in boxes, so their font / bold / underline from Site Text apply)
  const sections: { title: string; body: string; tk?: string; bk?: string }[] = [
    { title: t("product.shipping.title"), body: t("product.shipping.body"), tk: "product.shipping.title", bk: "product.shipping.body" },
    { title: t("product.care.title"), body: t("product.care.body"), tk: "product.care.title", bk: "product.care.body" },
    ...parseSections((await getTexts())["product.extraSections"]),
  ].filter((x) => x.title || x.body);

  return (
    <div data-font-area="product" className="pt-20 pb-24 bg-[#F5EFE2]">
      <div className="max-w-7xl mx-auto px-6">
        <VariantSelectionProvider initialVariantId={product.variants[0]?.id || ""}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery */}
          <ProductGallery images={images} variantImages={variantImages} name={L(lang, product.name, product.nameAr)} variants={product.variants} />

          {/* Info */}
          <div className="md:pt-8">
            {product.category && (
              <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-3">
                {L(lang, product.category.name, product.category.nameAr)}
              </p>
            )}
            <h1 className="font-serif text-4xl md:text-5xl font-light text-[#1C1711] leading-tight">
              {L(lang, product.name, product.nameAr)}
            </h1>

            {/* Stock & views row */}
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 bg-[#1C1711] text-[#F5EFE2] text-[10px] tracking-[0.2em] uppercase px-3 py-1">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <circle cx="4" cy="4" r="3" fill="#8A7E6E"/>
                  </svg>
                  <Txt k="product.outOfStock" />
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 bg-[#8A5C2E]/10 border border-[#8A5C2E]/30 text-[#8A5C2E] text-[10px] tracking-[0.2em] uppercase px-3 py-1">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <circle cx="4" cy="4" r="3" fill="#C4834A"/>
                  </svg>
                  <Txt k="product.lowStock" vars={{ count: totalInventory }} />
                </span>
              ) : null}
              <span className="text-[11px] text-[#A8975E] flex items-center gap-1.5">
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                  <ellipse cx="6.5" cy="5" rx="6" ry="4" stroke="currentColor" strokeWidth="1.1"/>
                  <circle cx="6.5" cy="5" r="1.8" fill="currentColor"/>
                </svg>
                {viewCount.toLocaleString()} {viewCount === 1 ? <Txt k="product.viewSingular" /> : <Txt k="product.viewPlural" />}
              </span>
            </div>

            {(product.description || product.descriptionAr) && (
              <p className="mt-6 text-sm text-[#5A5040] leading-relaxed">{L(lang, product.description, product.descriptionAr)}</p>
            )}

            <AddToCartButton product={product as Parameters<typeof AddToCartButton>[0]["product"]} />

            {/* Details */}
            <div className="mt-8 pt-8 border-t border-[#EDE6D4] space-y-4">
              {sections.map((sec, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-xs tracking-widest uppercase text-[#5A5040] py-2">
                    <span>{sec.tk ? <Txt k={sec.tk} /> : <RichText text={sec.title} />}</span>
                    <svg className="group-open:rotate-180 transition-transform" width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-[#8A7E6E] leading-relaxed whitespace-pre-line">{sec.bk ? <Txt k={sec.bk} /> : <RichText text={sec.body} />}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
        </VariantSelectionProvider>
      </div>
    </div>
  );
}
