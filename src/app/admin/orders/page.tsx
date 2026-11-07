import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import OrdersAdminClient from "@/components/admin/OrdersAdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const orders = await prisma.order.findMany({
    include: { items: { select: { productName: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminLayout>
      <OrdersAdminClient orders={orders as Parameters<typeof OrdersAdminClient>[0]["orders"]} />
    </AdminLayout>
  );
}
