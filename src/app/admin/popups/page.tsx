import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import PopupsAdminClient from "@/components/admin/PopupsAdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Popups" };

export default async function PopupsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const popups = await prisma.popup.findMany({ orderBy: { createdAt: "desc" } });
  return <AdminLayout><PopupsAdminClient popups={popups} /></AdminLayout>;
}
