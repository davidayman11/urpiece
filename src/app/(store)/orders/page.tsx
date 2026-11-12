import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { formatPrice } from "@/lib/utils";
import { statusInfo } from "@/lib/order-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "My orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const { placed } = await searchParams;
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?next=/orders");

  // Orders from before the account was created (old guest orders) are not shown
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id, ...(customer.registeredAt ? { createdAt: { gte: customer.registeredAt } } : {}) },
    include: { items: { select: { productName: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Only celebrate an order number that really belongs to this account
  const justPlaced = placed ? orders.find((o) => o.orderNumber === placed) : undefined;

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-6">
        {justPlaced && (
          <div role="status" className="mb-8 flex items-start gap-3 bg-[#A8975E]/10 border border-[#A8975E]/40 p-4">
            <span className="mt-0.5 w-6 h-6 rounded-full bg-[#A8975E] flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F5EFE2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <div className="text-sm">
              <p className="text-[#1C1711] font-medium">Thank you! Your order was placed.</p>
              <p className="text-[#5A5040] mt-0.5">
                We&apos;ll review your payment shortly.{" "}
                <Link href={`/orders/${justPlaced.orderNumber}`} className="text-[#A8975E] underline underline-offset-4">
                  View order {justPlaced.orderNumber}
                </Link>
              </p>
            </div>
          </div>
        )}
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3">My account</p>
          <h1 className="font-serif text-4xl font-light text-[#1C1711]">My orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-14 bg-[#FBF8F0] border border-[#EDE6D4]">
            <p className="text-sm text-[#5A5040]">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="inline-block mt-5 bg-[#A8975E] text-[#F5EFE2] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = statusInfo(order.status);
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.orderNumber}`}
                  className="block bg-[#FBF8F0] border border-[#EDE6D4] p-5 hover:border-[#A8975E] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] tracking-[0.2em] uppercase text-[#A8975E] break-all">{order.orderNumber}</p>
                      <p className="mt-1.5 text-sm text-[#1C1711]">
                        {order.items.slice(0, 2).map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </p>
                      <p className="mt-1 text-xs text-[#8A7E6E]">{format(new Date(order.createdAt), "d MMM yyyy")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full ${st.tone}`}>{st.label}</span>
                      <p className="mt-2 text-sm font-medium text-[#1C1711]">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
