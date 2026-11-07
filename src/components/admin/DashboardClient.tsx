"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    paymentReview: number;
    totalRevenue: number;
    monthRevenue: number;
    grossProfit: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: Date;
    items: { productName: string }[];
  }>;
  topProducts: Array<{ productName: string; _sum: { quantity: number | null } }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
  PAYMENT_UPLOADED: "bg-blue-100 text-blue-800",
  PAYMENT_REJECTED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { stats, recentOrders, topProducts } = data;

  const statCards = [
    { label: "Total Revenue", value: formatPrice(stats.totalRevenue), sub: `${formatPrice(stats.monthRevenue)} this month`, color: "text-[#A8975E]" },
    { label: "Gross Profit", value: formatPrice(stats.grossProfit), sub: "Revenue − Cost of goods", color: "text-emerald-600" },
    { label: "Total Orders", value: stats.totalOrders, sub: `${stats.pendingOrders} pending`, color: "text-[#1C1711]" },
    { label: "Completed", value: stats.completedOrders, sub: `${stats.cancelledOrders} cancelled`, color: "text-green-600" },
    { label: "Awaiting Review", value: stats.paymentReview, sub: "Payment screenshots", color: "text-blue-600", link: "/admin/orders?status=PAYMENT_UPLOADED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-50">
            {card.link ? (
              <Link href={card.link}>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </Link>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h2 className="font-medium text-gray-700">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#A8975E] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{order.orderNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {order.customerName} · {order.items[0]?.productName}
                      {order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-medium text-gray-800">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400">{format(new Date(order.createdAt), "d MMM")}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <h2 className="font-medium text-gray-700">Top Products</h2>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.productName} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{p.productName}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {p._sum.quantity} sold
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-50">
            <Link href="/admin/reports" className="text-xs text-[#A8975E] hover:underline">
              Full Reports →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
