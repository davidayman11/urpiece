import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import BundlesClient from "@/components/admin/BundlesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bundles" };

export default async function BundlesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const [bundles, products] = await Promise.all([
    prisma.bundle.findMany({ include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true, variants: { select: { id: true, name: true, price: true, isActive: true }, orderBy: { price: "asc" } } },
    }),
  ]);
  return (
    <AdminLayout>
      <BundlesClient bundles={bundles} products={products} />
    </AdminLayout>
  );
}
