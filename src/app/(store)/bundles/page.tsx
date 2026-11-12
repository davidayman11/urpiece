import { prisma } from "@/lib/prisma";
import BundleCard from "@/components/store/BundleCard";
import { bundleInclude } from "@/lib/bundle-include";
import type { BundleView } from "@/lib/bundles";
import { getT } from "@/lib/texts/server";

import { Txt } from "@/components/store/TextsProvider";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("bundle.list.metaTitle") };
}

export default async function BundlesPage() {
  const t = await getT();
  const bundles = (await prisma.bundle.findMany({
    where: { isActive: true },
    include: bundleInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })) as unknown as BundleView[];

  return (
    <div data-font-area="bundles" className="pt-28 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3"><Txt k="bundle.list.eyebrow" /></p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-[#1C1711]"><Txt k="bundle.list.title" /></h1>
          <p className="text-sm text-[#8A7E6E] mt-3"><Txt k="bundle.list.subtitle" /></p>
        </div>
        {bundles.length === 0 ? (
          <p className="text-center text-sm text-[#8A7E6E] py-16"><Txt k="bundle.list.empty" /></p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
