import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import PagesClient from "@/components/admin/PagesClient";
import { applyOrder, getSavedOrder } from "@/lib/section-order";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pages & Sections" };

export default async function PagesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const all = await prisma.siteSection.findMany({
    orderBy: [{ pageSlug: "asc" }, { sortOrder: "asc" }],
  });
  // The home page shows its sections in the saved order (or the default layout until you order them)
  const savedHome = await getSavedOrder("home");
  const homeOrdered = applyOrder(all.filter((s) => s.pageSlug === "home"), savedHome);
  const sections = [...homeOrdered, ...all.filter((s) => s.pageSlug !== "home")];
  const [categories, products, bundleOpts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, isActive: true } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, isActive: true, isFeatured: true } }),
    prisma.bundle.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, isActive: true } }),
  ]);
  return <AdminLayout><PagesClient homeOrdered={!!savedHome} sections={sections} categories={categories} products={products} bundleOpts={bundleOpts} /></AdminLayout>;
}
