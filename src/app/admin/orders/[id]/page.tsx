import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderDetailAdmin from "@/components/admin/OrderDetailAdmin";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export default async function AdminOrderDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      notes: { orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  return (
    <AdminLayout>
      <OrderDetailAdmin order={order as Parameters<typeof OrderDetailAdmin>[0]["order"]} />
    </AdminLayout>
  );
}
