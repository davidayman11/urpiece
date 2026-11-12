import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", desc: "Your order has been received." },
  AWAITING_PAYMENT: { label: "Awaiting Payment", color: "bg-orange-100 text-orange-800", desc: "Please complete your InstaPay transfer and upload the screenshot." },
  PAYMENT_UPLOADED: { label: "Payment Under Review", color: "bg-blue-100 text-blue-800", desc: "We're verifying your payment. This usually takes a few hours." },
  PAYMENT_REJECTED: { label: "Payment Rejected", color: "bg-red-100 text-red-800", desc: "Your payment could not be verified. Please contact us." },
  CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-800", desc: "Your payment has been confirmed and your order is being prepared." },
  PROCESSING: { label: "Processing", color: "bg-purple-100 text-purple-800", desc: "Your order is being packed." },
  SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", desc: "Your order is on its way!" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-800", desc: "Your order has been delivered." },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800", desc: "This order has been cancelled." },
};

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const st = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800", desc: "" };
  const shipping = parseJson<Record<string, string>>(order.shippingAddress, {});

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-[#A8975E] mb-2">Order</p>
          <h1 className="font-serif text-3xl font-light text-[#1C1711]">{order.orderNumber}</h1>
          <p className="text-sm text-[#8A7E6E] mt-1">
            Placed {format(new Date(order.createdAt), "d MMMM yyyy")}
          </p>
        </div>

        {/* Status */}
        <div className={`p-5 rounded-sm mb-8 ${st.color}`}>
          <div className="flex items-center gap-2 font-medium mb-1">{st.label}</div>
          <p className="text-sm">{st.desc}</p>
          {order.rejectionReason && (
            <p className="mt-2 text-sm italic">Reason: {order.rejectionReason}</p>
          )}
        </div>

        {/* Items */}
        <div className="mb-8">
          <h2 className="text-xs tracking-widest uppercase text-[#5A5040] mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-3 border-b border-[#EDE6D4]">
                <div>
                  <p className="text-[#1C1711]">{item.productName}</p>
                  {item.variantName && <p className="text-xs text-[#8A7E6E]">{item.variantName}</p>}
                  <p className="text-xs text-[#8A7E6E]">×{item.quantity}</p>
                </div>
                <span className="text-[#1C1711]">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8A7E6E]">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            )}
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-[#8A7E6E]">Shipping</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-[#EDE6D4]">
              <span>Total</span>
              <span className="text-[#A8975E]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="mb-8">
          <h2 className="text-xs tracking-widest uppercase text-[#5A5040] mb-3">Shipping To</h2>
          <div className="text-sm text-[#5A5040] space-y-1">
            <p>{order.customerName}</p>
            {(shipping.address || shipping.city) && (
              <p>{[shipping.address, shipping.city].filter(Boolean).join(", ")}</p>
            )}
            {order.customerPhone && <p>{order.customerPhone}</p>}
            {Object.entries(parseJson<Record<string, string>>(order.customData, {})).map(([k, v]) => (
              <p key={k}><span className="text-[#8A7E6E]">{k}:</span> {v}</p>
            ))}
          </div>
        </div>

        {/* History */}
        {order.statusHistory.length > 0 && (
          <div>
            <h2 className="text-xs tracking-widest uppercase text-[#5A5040] mb-4">Order History</h2>
            <div className="space-y-3">
              {order.statusHistory.map((h) => {
                const s = STATUS_LABELS[h.status];
                return (
                  <div key={h.id} className="flex gap-4 text-sm">
                    <div className="text-[#8A7E6E] shrink-0 w-32">
                      {format(new Date(h.createdAt), "d MMM, HH:mm")}
                    </div>
                    <div>
                      <span className="text-[#1C1711]">{s?.label || h.status}</span>
                      {h.note && <p className="text-xs text-[#8A7E6E] mt-0.5">{h.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
