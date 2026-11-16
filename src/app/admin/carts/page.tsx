import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import AutoRefresh from "@/components/admin/AutoRefresh";
import CartsClient, { type CartRow } from "@/components/admin/CartsClient";
import { parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Carts" };

export default async function CartsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const carts = await prisma.customerCart.findMany({
    orderBy: { updatedAt: "desc" },
    include: { customer: { include: { _count: { select: { orders: true } } } } },
  });

  const rows: CartRow[] = carts
    .map((c) => {
      const items = parseJson<unknown[]>(c.items, []);
      return {
        id: c.id,
        name: c.customer.name,
        email: c.customer.email,
        phone: c.customer.phone,
        orders: c.customer._count.orders,
        updatedAt: c.updatedAt.toISOString(),
        items: (Array.isArray(items) ? items : []).map((i) => {
          const o = (i && typeof i === "object" ? i : {}) as Record<string, unknown>;
          return {
            name: String(o.productName ?? ""),
            variant: String(o.variantName ?? ""),
            image: String(o.image ?? ""),
            price: Number(o.price) || 0,
            quantity: Number(o.quantity) || 1,
            packagingName: o.packagingName ? String(o.packagingName) : "",
            packagingPrice: Number(o.packagingPrice) || 0,
          };
        }),
      };
    })
    .filter((r) => r.items.length > 0);

  return (
    <AdminLayout>
      <AutoRefresh intervalMs={60000} />
      <CartsClient rows={rows} now={new Date().getTime()} />
    </AdminLayout>
  );
}
