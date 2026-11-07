import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductsClient from "@/components/admin/ProductsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { variants: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <AdminLayout>
      <ProductsClient products={products as Parameters<typeof ProductsClient>[0]["products"]} categories={categories} />
    </AdminLayout>
  );
}
