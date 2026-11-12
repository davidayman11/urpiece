"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import type { ShippingZone } from "@prisma/client";

export default function ShippingClient({ zones, freeShippingMin }: { zones: ShippingZone[]; freeShippingMin: number | null }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, { city: string; price: string; isActive: boolean }>>({});

  const call = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed");
      return false;
    }
    router.refresh();
    return true;
  };

  const add = async () => {
    if (!city.trim()) return alert("Enter a city name");
    if (await call("/api/admin/shipping", "POST", { city, price: parseFloat(price) || 0 })) {
      setCity(""); setPrice("");
    }
  };

  const saveRow = async (z: ShippingZone) => {
    const e = edits[z.id];
    if (!e) return;
    if (await call(`/api/admin/shipping/${z.id}`, "PUT", { city: e.city, price: parseFloat(e.price) || 0, isActive: e.isActive })) {
      setEdits((s) => { const n = { ...s }; delete n[z.id]; return n; });
    }
  };

  const remove = async (z: ShippingZone) => {
    if (!confirm(`Delete ${z.city}?`)) return;
    await call(`/api/admin/shipping/${z.id}`, "DELETE");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Shipping</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cities shown in the checkout dropdown, each with its own shipping price.
        </p>
      </div>

      <p className="text-xs text-gray-500 bg-white border border-gray-100 rounded-lg p-4">
        Want free shipping over a certain amount?{" "}
        <Link href="/admin/discounts" className="text-[#A8975E] hover:underline">Set it up in Discounts →</Link>
        {freeShippingMin ? ` (currently free over ${formatPrice(freeShippingMin)})` : ""}
      </p>

      <div className="bg-white rounded-lg p-5 border border-gray-100 space-y-3">
        <h2 className="font-medium text-gray-700 text-sm">Add a city</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (e.g. Cairo)"
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Shipping price (EGP)"
            className="sm:w-48 border border-gray-200 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={add}
            disabled={busy}
            className="px-5 py-2 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-50">
        {zones.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No cities yet. Until you add one, checkout shows a free-text city field with no shipping fee.
          </p>
        )}
        {zones.map((z) => {
          const e = edits[z.id] ?? { city: z.city, price: String(z.price), isActive: z.isActive };
          const dirty = !!edits[z.id];
          const set = (patch: Partial<typeof e>) => setEdits((s) => ({ ...s, [z.id]: { ...e, ...patch } }));
          return (
            <div key={z.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                value={e.city}
                onChange={(ev) => set({ city: ev.target.value })}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                value={e.price}
                onChange={(ev) => set({ price: ev.target.value })}
                className="sm:w-32 border border-gray-200 rounded px-3 py-2 text-sm"
                title={formatPrice(parseFloat(e.price) || 0)}
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={e.isActive} onChange={(ev) => set({ isActive: ev.target.checked })} />
                Active
              </label>
              <div className="flex gap-3 text-xs">
                {dirty && (
                  <button onClick={() => saveRow(z)} disabled={busy} className="text-[#A8975E] hover:underline">Save</button>
                )}
                <button onClick={() => remove(z)} className="text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
