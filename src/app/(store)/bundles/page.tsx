import { prisma } from "@/lib/prisma";
import BundleCard from "@/components/store/BundleCard";
import { bundleInclude } from "@/lib/bundle-include";
import type { BundleView } from "@/lib/bundles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bundles" };

export default async function BundlesPage() {
  const bundles = (await prisma.bundle.findMany({
    where: { isActive: true },
    include: bundleInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })) as unknown as BundleView[];

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3">Better together</p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-[#1C1711]">Bundles</h1>
          <p className="text-sm text-[#8A7E6E] mt-3">Curated sets at a special price.</p>
        </div>
        {bundles.length === 0 ? (
          <p className="text-center text-sm text-[#8A7E6E] py-16">No bundles right now — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
