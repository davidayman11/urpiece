"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatPrice, parseJson } from "@/lib/utils";
import { formatAddress } from "@/lib/checkout-fields";
import { format } from "date-fns";
import Link from "next/link";

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string;
  price: number;
  costPrice: number;
  quantity: number;
}

interface OrderNote {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface StatusHistory {
  id: string;
  status: string;
  note?: string;
  createdAt: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  status: string;
  paymentStatus: string;
  paymentScreenshot?: string;
  rejectionReason?: string;
  adminNotes?: string;
  customData?: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  paymentType?: string;
  amountDue?: number;
  balanceDue?: number;
  total: number;
  promoCodeUsed?: string;
  createdAt: Date;
  items: OrderItem[];
  notes: OrderNote[];
  statusHistory: StatusHistory[];
}

const STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAYMENT_UPLOADED", "PAYMENT_REJECTED", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

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

export default function OrderDetailAdmin({ order: initial }: { order: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [note, setNote] = useState("");
  const [adminNotes, setAdminNotes] = useState(initial.adminNotes || "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState(initial.status);
  const [loading, setLoading] = useState<string | null>(null);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setLoading(action);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Action failed"); }
  };

  const shipping = parseJson<Record<string, string>>(order.shippingAddress, {});
  const totalCOGS = order.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const grossProfit = order.total - totalCOGS;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="text-sm text-gray-400 hover:text-gray-600">← Orders</Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mt-1">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a href={`/admin/orders/${order.id}/print?type=invoice`} target="_blank" rel="noopener"
            className="text-xs border border-gray-200 bg-white px-3 py-1.5 rounded hover:bg-gray-50">🧾 Print invoice</a>
          <a href={`/admin/orders/${order.id}/print?type=label`} target="_blank" rel="noopener"
            className="text-xs border border-gray-200 bg-white px-3 py-1.5 rounded hover:bg-gray-50">🏷 Shipping label</a>
          <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {order.paymentType === "DEPOSIT" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-amber-900">Deposit order</p>
              <p className="text-amber-800 mt-1">
                Customer should have transferred <strong>{formatPrice(order.amountDue ?? 0)}</strong> now.
                Collect <strong>{formatPrice(order.balanceDue ?? 0)}</strong> on delivery.
              </p>
            </div>
          )}

          {/* Payment Screenshot */}
          {order.paymentScreenshot && (
            <div className="bg-white rounded-lg p-5 border border-gray-100">
              <h2 className="font-medium text-gray-700 mb-4">Payment Screenshot</h2>
              <div className="relative h-72 bg-gray-100 rounded overflow-hidden mb-4">
                <Image src={order.paymentScreenshot} alt="Payment" fill className="object-contain" />
              </div>
              <div className="flex gap-3">
                {order.paymentStatus !== "VERIFIED" && (
                  <button
                    onClick={() => act("accept-payment")}
                    disabled={loading === "accept-payment"}
                    className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    ✓ Accept Payment
                  </button>
                )}
                {order.paymentStatus !== "REJECTED" && (
                  <div className="flex-1 space-y-2">
                    <input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason..."
                      className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => act("reject-payment", { rejectionReason })}
                      disabled={loading === "reject-payment"}
                      className="w-full bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600 disabled:opacity-60"
                    >
                      ✗ Reject Payment
                    </button>
                  </div>
                )}
              </div>
              {order.paymentStatus === "VERIFIED" && (
                <p className="text-green-700 text-sm mt-2 font-medium">✓ Payment Verified</p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-lg p-5 border border-gray-100">
            <h2 className="font-medium text-gray-700 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                    <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-xs text-[#A8975E]">Cost: {formatPrice(item.costPrice * item.quantity)}</p>
                    <p className="text-xs text-emerald-600">Profit: {formatPrice((item.price - item.costPrice) * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}
              {order.shippingFee > 0 && <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{formatPrice(order.shippingFee)}</span></div>}
              <div className="flex justify-between font-medium text-gray-800 pt-2 border-t"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              <div className="flex justify-between text-xs text-[#A8975E]"><span>COGS</span><span>{formatPrice(totalCOGS)}</span></div>
              <div className="flex justify-between text-xs text-emerald-600 font-medium"><span>Gross Profit</span><span>{formatPrice(grossProfit)}</span></div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-lg p-5 border border-gray-100">
            <h2 className="font-medium text-gray-700 mb-4">Update Status</h2>
            <div className="flex gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              <button
                onClick={() => act("update-status", { status: newStatus })}
                disabled={loading === "update-status"}
                className="px-4 py-2 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60"
              >
                Update
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg p-5 border border-gray-100">
            <h2 className="font-medium text-gray-700 mb-4">Internal Notes</h2>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Private admin notes..."
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm mb-3"
            />
            <button
              onClick={() => act("update-admin-notes", { adminNotes })}
              className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 text-xs"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-lg p-5 border border-gray-100">
            <h2 className="font-medium text-gray-700 mb-3">Customer</h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-gray-800">{order.customerName}</p>
              <p>{order.customerEmail}</p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Shipping Address</p>
              <p className="text-sm text-gray-600">{formatAddress(shipping)}</p>
            </div>
            {Object.entries(parseJson<Record<string, string>>(order.customData || "{}", {})).map(([k, v]) => (
              <div key={k} className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">{k}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{v}</p>
              </div>
            ))}
            {order.promoCodeUsed && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400">Promo Used</p>
                <p className="text-sm font-medium text-[#A8975E]">{order.promoCodeUsed}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg p-5 border border-gray-100">
            <h2 className="font-medium text-gray-700 mb-4">Timeline</h2>
            <div className="space-y-3">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8975E] mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">{h.status.replace(/_/g, " ")}</p>
                    {h.note && <p className="text-gray-400">{h.note}</p>}
                    <p className="text-gray-400">{format(new Date(h.createdAt), "d MMM, HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
