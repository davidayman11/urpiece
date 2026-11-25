import { prisma } from "@/lib/prisma";
import { recoIsSeeded } from "@/lib/reco-seed";
import RecommendedForYou from "@/components/store/RecommendedForYou";

/**
 * The built-in "Recommended for you" row at the bottom of a page.
 * Once the admin adds a "Recommended for you" section to that page (even a hidden one) it takes over:
 * the admin decides where it goes, or hides it.
 */
export default async function DefaultRecommended({ page, currentProductId }: { page: string; currentProductId?: string }) {
  if (await recoIsSeeded()) return null; // it is a normal section now (Admin > Pages)
  const custom = await prisma.siteSection.count({ where: { pageSlug: page, type: "recommended" } });
  return custom > 0 ? null : <RecommendedForYou currentProductId={currentProductId} />;
}
