"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { statusInfo } from "@/lib/order-status";
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

export default function OrdersPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async () => {
    const q = query.trim();
    if (!q) return;
    setError("");
    // An order number (UP-XXXX-XXXX) goes straight to the order page
    if (!q.includes("@")) {
      if (/^UP-/i.test(q)) router.push(`/orders/${q.toUpperCase()}`);
      else setError("Enter the email you used at checkout, or your order number (starts with UP-).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/track?email=${encodeURIComponent(q)}`);
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
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-3">Your orders</p>
          <h1 className="font-serif text-4xl font-light text-[#1C1711] mb-3">Track Your Order</h1>
          <p className="text-sm text-[#8A7E6E]">Enter the email you used at checkout, or your order number.</p>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="you@example.com  or  UP-XXXX-XXXX"
            className="flex-1 border border-[#EDE6D4] bg-[#FBF8F0] px-4 py-3 text-sm text-[#1C1711] placeholder:text-[#C4B8A0] outline-none focus:border-[#A8975E] transition-colors"
          />
          <button
            onClick={lookup}
            disabled={loading}
            className="px-6 py-3 bg-[#A8975E] text-[#F5EFE2] text-xs tracking-widest uppercase hover:bg-[#8A7A4A] transition-colors disabled:opacity-60"
          >
            {loading ? "…" : "Find"}
          </button>
        </div>

        {error && <p className="text-xs text-red-600 mb-6">{error}</p>}

        {orders !== null && (
          <div className="mt-8">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-[#FBF8F0] border border-[#EDE6D4]">
                <p className="text-sm text-[#5A5040]">No orders found for this email.</p>
                <p className="text-xs text-[#8A7E6E] mt-1">Check the spelling, or try your order number instead.</p>
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
        )}
      </div>
    </div>
  );
}
