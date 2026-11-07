import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import PagesClient from "@/components/admin/PagesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pages & Sections" };

export default async function PagesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const sections = await prisma.siteSection.findMany({
    where: { pageSlug: "home" },
    orderBy: { sortOrder: "asc" },
  });
  return <AdminLayout><PagesClient sections={sections} /></AdminLayout>;
}
