"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-700 bg-yellow-50" },
  AWAITING_PAYMENT: { label: "Awaiting Payment", color: "text-orange-700 bg-orange-50" },
  PAYMENT_UPLOADED: { label: "Payment Uploaded", color: "text-blue-700 bg-blue-50" },
  PAYMENT_REJECTED: { label: "Payment Rejected", color: "text-red-700 bg-red-50" },
  CONFIRMED: { label: "Confirmed", color: "text-green-700 bg-green-50" },
  PROCESSING: { label: "Processing", color: "text-purple-700 bg-purple-50" },
  SHIPPED: { label: "Shipped", color: "text-indigo-700 bg-indigo-50" },
  COMPLETED: { label: "Completed", color: "text-emerald-700 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", color: "text-gray-700 bg-gray-50" },
};

export default function OrdersPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/track?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-light text-[#1C1711] mb-3">Track Your Order</h1>
        <p className="text-sm text-[#8A7E6E] mb-10">Enter the email you used at checkout to view your orders.</p>

        <div className="flex gap-3 mb-10">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="your@email.com"
            className="flex-1 border border-[#EDE6D4] bg-transparent px-4 py-3 text-sm"
          />
          <button
            onClick={lookup}
            disabled={loading}
            className="px-6 py-3 bg-[#A8975E] text-[#F5EFE2] text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
          >
            {loading ? "..." : "Find"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

        {orders !== null && (
          <div>
            {orders.length === 0 ? (
              <p className="text-sm text-[#8A7E6E] text-center py-10">No orders found for this email.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const st = STATUS_LABELS[order.status] || { label: order.status, color: "text-gray-700 bg-gray-50" };
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.orderNumber}`}
                      className="block border border-[#EDE6D4] p-5 hover:border-[#A8975E] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs tracking-widest uppercase text-[#A8975E]">{order.orderNumber}</p>
                          <p className="mt-1 text-sm text-[#5A5040]">
                            {order.items.slice(0, 2).map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </p>
                          <p className="mt-1 text-xs text-[#8A7E6E]">
                            {format(new Date(order.createdAt), "d MMM yyyy")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                          <p className="mt-2 text-sm font-medium text-[#1C1711]">{formatPrice(order.total)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
