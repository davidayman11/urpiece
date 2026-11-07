import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import PromoCodesClient from "@/components/admin/PromoCodesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Promo Codes" };

export default async function PromoCodesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return <AdminLayout><PromoCodesClient codes={codes} /></AdminLayout>;
}
