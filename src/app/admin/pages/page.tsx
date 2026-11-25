import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import PagesClient from "@/components/admin/PagesClient";
import { seedRecoSections } from "@/lib/reco-seed";
import { applyOrder, getSavedOrder } from "@/lib/section-order";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pages & Sections" };

export default async function PagesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  await seedRecoSections();
  const all = await prisma.siteSection.findMany({
    orderBy: [{ pageSlug: "asc" }, { sortOrder: "asc" }],
  });
  // Every page shows its sections in the saved order (or the usual order until you move one)
  const slugs = [...new Set(all.map((s) => s.pageSlug))];
  const sections: typeof all = [];
  const orderedPages: string[] = [];
  for (const slug of slugs) {
    const rows = all.filter((s) => s.pageSlug === slug);
    const saved = await getSavedOrder(slug);
    if (saved) orderedPages.push(slug);
    sections.push(...(slug === "home" ? applyOrder(rows, saved) : applyOrder(rows, saved, false)));
  }
  const [categories, products, bundleOpts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, isActive: true } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, isActive: true, isFeatured: true } }),
    prisma.bundle.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, isActive: true } }),
  ]);
  return <AdminLayout><PagesClient orderedPages={orderedPages} sections={sections} categories={categories} products={products} bundleOpts={bundleOpts} /></AdminLayout>;
}
