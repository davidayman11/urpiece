import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import DiscountsClient from "@/components/admin/DiscountsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const [settings, rules, activePromos, salesCount] = await Promise.all([
    prisma.paymentSettings.findFirst(),
    prisma.discountRule.findMany({ orderBy: { minAmount: "asc" } }),
    prisma.promoCode.count({ where: { isActive: true } }),
    prisma.product.count({ where: { salePercent: { gt: 0 } } }),
  ]);
  return (
    <AdminLayout>
      <DiscountsClient
        settings={{
          discountMode: settings?.discountMode === "ONE" ? "ONE" : "STACK",
          salesEnabled: settings?.salesEnabled !== false,
          promosEnabled: settings?.promosEnabled !== false,
          freeShippingMin: settings?.freeShippingMin ?? null,
        }}
        rules={rules}
        activePromos={activePromos}
        salesCount={salesCount}
      />
    </AdminLayout>
  );
}
