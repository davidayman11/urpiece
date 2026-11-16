import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import PackagingClient from "@/components/admin/PackagingClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Packaging" };

export default async function PackagingAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const [options, enabledCount] = await Promise.all([
    prisma.packagingOption.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.product.count({ where: { packagingEnabled: true } }),
  ]);
  return <AdminLayout><PackagingClient options={options} enabledCount={enabledCount} /></AdminLayout>;
}
