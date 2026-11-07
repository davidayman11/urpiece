"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: Date;
  items: { productName: string; quantity: number }[];
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

export default function OrdersAdminClient({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} total</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search order # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#A8975E] w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Order</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Customer</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Items</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Total</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Date</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No orders found</td></tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{order.orderNumber}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      order.paymentStatus === "UPLOADED" ? "bg-blue-100 text-blue-700" :
                      order.paymentStatus === "VERIFIED" ? "bg-green-100 text-green-700" :
                      order.paymentStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      Pay: {order.paymentStatus?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-700">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerEmail}</p>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {order.items.slice(0, 2).map((i) => `${i.productName}×${i.quantity}`).join(", ")}
                    {order.items.length > 2 && ` +${order.items.length - 2}`}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{format(new Date(order.createdAt), "d MMM yyyy")}</td>
                  <td className="p-4">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs text-[#A8975E] hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
