import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductsClient from "@/components/admin/ProductsClient";
import { getLowStock } from "@/lib/low-stock";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ stock?: string }> }) {
  const { stock } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [products, categories, lowStock, rawPresets] = await Promise.all([
    prisma.product.findMany({
      include: { variants: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getLowStock(),
    prisma.variantPreset.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const presets = rawPresets.map((p) => ({
    id: p.id,
    name: p.name,
    values: (() => { try { return JSON.parse(p.values) as string[]; } catch { return [] as string[]; } })(),
  }));

  return (
    <AdminLayout>
      <ProductsClient products={products as Parameters<typeof ProductsClient>[0]["products"]} categories={categories} lowStockThreshold={lowStock.threshold} lowStockCount={lowStock.count} initialLow={stock === "low"} presets={presets} />
    </AdminLayout>
  );
}
