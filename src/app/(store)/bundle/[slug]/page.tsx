import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { coverImage } from "@/lib/product-images";
import BundleBuyBox, { type BuyItem } from "@/components/store/BundleBuyBox";
import { bundleInclude } from "@/lib/bundle-include";
import { getT } from "@/lib/texts/server";
import type { Metadata } from "next";

import { Txt } from "@/components/store/TextsProvider";
export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getT();
  const b = await prisma.bundle.findUnique({ where: { slug }, select: { name: true } });
  return { title: b?.name || t("bundle.page.metaFallback") };
}

export default async function BundlePage({ params }: Props) {
  const { slug } = await params;
  const t = await getT();
  const bundle = await prisma.bundle.findUnique({ where: { slug }, include: bundleInclude });
  if (!bundle || !bundle.isActive || bundle.items.length === 0) notFound();

  const items: BuyItem[] = bundle.items.map((it) => ({
    id: it.id,
    productName: it.product.name,
    slug: it.product.slug,
    image: coverImage(it.product.images, it.product.variants),
    fixedVariantId: it.variantId,
    variants: it.product.variants.filter((v) => v.isActive),
  }));
  const cover = bundle.image || items[0]?.image || "";

  return (
    <div data-font-area="bundles" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 lg:gap-16">
        <div className="relative aspect-[4/5] bg-[#EDE6D4] overflow-hidden">
          {cover && <Image src={cover} alt={bundle.name} fill className="object-cover" priority />}
          <span className="absolute top-4 left-4 bg-[#1C1711] text-[#F5EFE2] text-[10px] tracking-[0.25em] uppercase px-3 py-1.5"><Txt k="bundle.page.badge" /></span>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3"><Txt k="bundle.page.pieces" vars={{ count: bundle.items.length }} /></p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-[#1C1711] leading-tight">{bundle.name}</h1>
          {bundle.description && <p className="mt-5 text-sm text-[#5A5040] leading-relaxed whitespace-pre-line">{bundle.description}</p>}
          <div className="mt-8">
            <BundleBuyBox bundle={{ id: bundle.id, name: bundle.name, image: cover, priceType: bundle.priceType, priceValue: bundle.priceValue, items }} />
          </div>
        </div>
      </div>
    </div>
  );
}
