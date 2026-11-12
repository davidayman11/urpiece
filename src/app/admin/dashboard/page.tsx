import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardClient from "@/components/admin/DashboardClient";
import { formatPrice } from "@/lib/utils";
import LowStockCard from "@/components/admin/LowStockCard";
import { getLowStock } from "@/lib/low-stock";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    paymentReview,
    revenueResult,
    monthRevenueResult,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.count({ where: { paymentStatus: "UPLOADED" } }),
    prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { items: { select: { productName: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Calculate COGS (cost of goods sold) for completed orders
  const cogResult = await prisma.orderItem.aggregate({
    where: {
      order: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"] } },
    },
    _sum: { costPrice: true, quantity: true },
  });

  const totalRevenue = revenueResult._sum.total || 0;
  const totalCOGS = (cogResult._sum.costPrice || 0);
  const grossProfit = totalRevenue - totalCOGS;

  return {
    stats: {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      paymentReview,
      totalRevenue,
      monthRevenue: monthRevenueResult._sum.total || 0,
      grossProfit,
    },
    recentOrders,
    topProducts,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [data, lowStock] = await Promise.all([getDashboardData(), getLowStock()]);

  return (
    <AdminLayout>
      <DashboardClient data={data} />
      <LowStockCard items={lowStock.items} threshold={lowStock.threshold} />
    </AdminLayout>
  );
}
