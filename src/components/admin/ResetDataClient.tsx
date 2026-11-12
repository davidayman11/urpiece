"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Counts { orders: number; customers: number; addresses: number; withScreenshot: number }

export default function ResetDataClient() {
  const router = useRouter();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [orders, setOrders] = useState(true);
  const [customers, setCustomers] = useState(true);
  const [promo, setPromo] = useState(true);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const load = () => fetch("/api/admin/reset-data").then((r) => (r.ok ? r.json() : null)).then(setCounts).catch(() => {});
  useEffect(() => { if (open) load(); }, [open]);

  const run = async () => {
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/reset-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm, orders, customers, resetPromoUsage: promo }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Something went wrong");
    setMsg(
      `Done. Deleted ${d.orders} order${d.orders === 1 ? "" : "s"}, ${d.customers} customer${d.customers === 1 ? "" : "s"} and ${d.addresses} saved address${d.addresses === 1 ? "" : "es"}` +
      (d.filesDeleted ? `, plus ${d.filesDeleted} payment screenshot${d.filesDeleted === 1 ? "" : "s"}.` : ".")
    );
    setConfirm("");
    load();
    router.refresh();
  };

  const ready = confirm === "DELETE" && (orders || customers) && !busy;

  return (
    <div className="max-w-xl rounded-lg border border-red-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium text-red-700">Danger zone — delete test data</h2>
          <p className="text-xs text-gray-500 mt-1">Permanently removes orders and/or customers. It cannot be undone.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-red-600 hover:underline shrink-0">{open ? "Hide" : "Show"}</button>
      </div>

      {open && (
        <div className="space-y-4">
          <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded px-3 py-2">
            Tip: on the Orders page, click <strong>Export to Excel</strong> first if you want a copy of the orders.
          </p>

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-1" checked={orders} onChange={(e) => setOrders(e.target.checked)} />
            <span>
              <span className="block text-gray-800">All orders{counts ? ` (${counts.orders})` : ""}</span>
              <span className="block text-xs text-gray-400">With their items, notes and status history{counts ? `, and ${counts.withScreenshot} uploaded payment screenshot${counts.withScreenshot === 1 ? "" : "s"}` : ""}.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-1" checked={customers} onChange={(e) => setCustomers(e.target.checked)} />
            <span>
              <span className="block text-gray-800">All customers and accounts{counts ? ` (${counts.customers})` : ""}</span>
              <span className="block text-xs text-gray-400">Sign-ups and guest customers{counts ? `, with ${counts.addresses} saved address${counts.addresses === 1 ? "" : "es"}` : ""}. Signed-in customers are signed out.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-1" checked={promo} disabled={!orders} onChange={(e) => setPromo(e.target.checked)} />
            <span>
              <span className="block text-gray-800">Reset the &quot;times used&quot; counter of promo codes to 0</span>
              <span className="block text-xs text-gray-400">So limited codes work again.</span>
            </span>
          </label>

          <p className="text-xs text-gray-500">
            <strong>Not touched:</strong> your admin login, products and stock levels, categories, promo codes, settings, texts and photos.
            Stock is not changed — adjust it in Products if needed.
          </p>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Type <strong>DELETE</strong> to confirm</label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-40 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          <button
            onClick={run}
            disabled={!ready}
            className="px-5 py-2.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
          {msg && <p className={`text-sm ${msg.startsWith("Done") ? "text-green-700" : "text-red-600"}`}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
