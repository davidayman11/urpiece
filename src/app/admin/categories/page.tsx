import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import CategoriesClient from "@/components/admin/CategoriesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <AdminLayout>
      <CategoriesClient categories={categories as Parameters<typeof CategoriesClient>[0]["categories"]} />
    </AdminLayout>
  );
}
