"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { EGYPT_GOVERNORATES } from "@/lib/checkout-fields";
import type { Governorate, ShippingZone } from "@prisma/client";

type Gov = Governorate & { zones: ShippingZone[] };
type Edit = { city: string; price: string; isActive: boolean };

const card = "bg-white rounded-lg border border-gray-100";
const inp = "border border-gray-200 rounded px-3 py-2 text-sm";

export default function ShippingClient({
  governorates, unassigned, freeShippingMin,
}: { governorates: Gov[]; unassigned: ShippingZone[]; freeShippingMin: number | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [govName, setGovName] = useState("");
  const [govEdits, setGovEdits] = useState<Record<string, { name: string; isActive: boolean }>>({});
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [newCity, setNewCity] = useState<Record<string, { city: string; price: string }>>({});
  const [assign, setAssign] = useState<Record<string, string>>({});

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

  /* ---------- governorates ---------- */
  const addGov = async () => {
    if (!govName.trim()) return alert("Enter a governorate name");
    if (await call("/api/admin/governorates", "POST", { name: govName })) setGovName("");
  };
  const addAllEgypt = async () => {
    if (!confirm("Add all 27 Egyptian governorates? Ones you already have are skipped.")) return;
    await call("/api/admin/governorates", "POST", { names: EGYPT_GOVERNORATES });
  };
  const saveGov = async (g: Gov) => {
    const e = govEdits[g.id];
    if (!e) return;
    if (await call(`/api/admin/governorates/${g.id}`, "PUT", e)) {
      setGovEdits((s) => { const n = { ...s }; delete n[g.id]; return n; });
    }
  };
  const removeGov = async (g: Gov) => {
    if (!confirm(`Delete "${g.name}"? Its ${g.zones.length} cities are kept but become unassigned.`)) return;
    await call(`/api/admin/governorates/${g.id}`, "DELETE");
  };

  /* ---------- cities ---------- */
  const addCity = async (g: Gov) => {
    const n = newCity[g.id];
    if (!n?.city.trim()) return alert("Enter a city name");
    if (await call("/api/admin/shipping", "POST", { city: n.city, price: parseFloat(n.price) || 0, governorateId: g.id })) {
      setNewCity((s) => ({ ...s, [g.id]: { city: "", price: "" } }));
    }
  };
  const saveCity = async (z: ShippingZone, governorateId: string | null) => {
    const e = edits[z.id];
    if (!e) return;
    if (await call(`/api/admin/shipping/${z.id}`, "PUT", { city: e.city, price: parseFloat(e.price) || 0, isActive: e.isActive, governorateId })) {
      setEdits((s) => { const n = { ...s }; delete n[z.id]; return n; });
    }
  };
  const removeCity = async (z: ShippingZone) => {
    if (!confirm(`Delete ${z.city}?`)) return;
    await call(`/api/admin/shipping/${z.id}`, "DELETE");
  };
  const assignCity = async (z: ShippingZone) => {
    const gid = assign[z.id];
    if (!gid) return alert("Choose a governorate");
    await call(`/api/admin/shipping/${z.id}`, "PUT", { city: z.city, price: z.price, isActive: z.isActive, governorateId: gid });
  };

  const cityRow = (z: ShippingZone, governorateId: string | null, extra?: React.ReactNode) => {
    const e = edits[z.id] ?? { city: z.city, price: String(z.price), isActive: z.isActive };
    const dirty = !!edits[z.id];
    const set = (patch: Partial<Edit>) => setEdits((s) => ({ ...s, [z.id]: { ...e, ...patch } }));
    return (
      <div key={z.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input value={e.city} onChange={(ev) => set({ city: ev.target.value })} className={`flex-1 ${inp}`} />
        <input
          type="number" min="0" value={e.price} onChange={(ev) => set({ price: ev.target.value })}
          className={`sm:w-28 ${inp}`} title={formatPrice(parseFloat(e.price) || 0)} aria-label="Shipping price"
        />
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={e.isActive} onChange={(ev) => set({ isActive: ev.target.checked })} /> Active
        </label>
        {extra}
        <div className="flex gap-3 text-xs">
          {dirty && <button onClick={() => saveCity(z, governorateId)} disabled={busy} className="text-[#A8975E] hover:underline">Save</button>}
          <button onClick={() => removeCity(z)} className="text-red-500 hover:underline">Delete</button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Shipping</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add the governorates you deliver to, and the cities in each one with its own shipping price. Customers pick a
          governorate first, then one of its cities.
        </p>
      </div>

      <p className="text-xs text-gray-500 bg-white border border-gray-100 rounded-lg p-4">
        Want free shipping over a certain amount?{" "}
        <Link href="/admin/discounts" className="text-[#A8975E] hover:underline">Set it up in Discounts →</Link>
        {freeShippingMin ? ` (currently free over ${formatPrice(freeShippingMin)})` : ""}
      </p>

      {/* Add governorate */}
      <div className={`${card} p-5 space-y-3`}>
        <h2 className="font-medium text-gray-700 text-sm">Add a governorate</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={govName} onChange={(e) => setGovName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGov()}
            placeholder="Governorate (e.g. Cairo)" className={`flex-1 ${inp}`}
          />
          <button onClick={addGov} disabled={busy} className="px-5 py-2 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60">
            Add
          </button>
        </div>
        <button onClick={addAllEgypt} disabled={busy} className="text-xs text-[#A8975E] hover:underline">
          + Add all 27 Egyptian governorates at once
        </button>
      </div>

      {governorates.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          No governorates yet. Until you add some (with at least one city each), checkout uses the simple list of cities below.
        </p>
      )}

      {/* Governorates */}
      {governorates.map((g) => {
        const ge = govEdits[g.id] ?? { name: g.name, isActive: g.isActive };
        const gDirty = !!govEdits[g.id];
        const setGe = (patch: Partial<typeof ge>) => setGovEdits((s) => ({ ...s, [g.id]: { ...ge, ...patch } }));
        const activeCities = g.zones.filter((z) => z.isActive).length;
        const nc = newCity[g.id] ?? { city: "", price: "" };
        return (
          <section key={g.id} className={card}>
            <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-50 bg-gray-50/60 rounded-t-lg">
              <input value={ge.name} onChange={(e) => setGe({ name: e.target.value })} className={`flex-1 min-w-[10rem] font-medium ${inp}`} aria-label="Governorate name" />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={ge.isActive} onChange={(e) => setGe({ isActive: e.target.checked })} /> Active
              </label>
              {gDirty && <button onClick={() => saveGov(g)} disabled={busy} className="text-xs text-[#A8975E] hover:underline">Save</button>}
              <button onClick={() => removeGov(g)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>

            <div className="p-4 space-y-2">
              {activeCities === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                  No active cities yet — this governorate is hidden at checkout until you add one.
                </p>
              )}
              {g.zones.map((z) => cityRow(z, g.id))}

              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-50">
                <input
                  value={nc.city} onChange={(e) => setNewCity((s) => ({ ...s, [g.id]: { ...nc, city: e.target.value } }))}
                  onKeyDown={(e) => e.key === "Enter" && addCity(g)}
                  placeholder={`Add a city in ${g.name}`} className={`flex-1 ${inp}`}
                />
                <input
                  type="number" min="0" value={nc.price} onChange={(e) => setNewCity((s) => ({ ...s, [g.id]: { ...nc, price: e.target.value } }))}
                  placeholder="Price (EGP)" className={`sm:w-28 ${inp}`}
                />
                <button onClick={() => addCity(g)} disabled={busy} className="px-4 py-2 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60">
                  Add city
                </button>
              </div>
            </div>
          </section>
        );
      })}

      {/* Unassigned (older cities not attached to a governorate) */}
      {unassigned.length > 0 && (
        <section className={`${card} p-4 space-y-3`}>
          <div>
            <h2 className="font-medium text-gray-700 text-sm">Cities without a governorate</h2>
            <p className="text-xs text-gray-400 mt-1">
              {governorates.length > 0
                ? "These are not shown at checkout. Assign each one to a governorate."
                : "These are used at checkout until you set up governorates. Assign them once you have."}
            </p>
          </div>
          {unassigned.map((z) =>
            cityRow(
              z,
              null,
              governorates.length > 0 ? (
                <span className="flex items-center gap-1">
                  <select
                    value={assign[z.id] || ""} onChange={(e) => setAssign((s) => ({ ...s, [z.id]: e.target.value }))}
                    className="border border-gray-200 rounded px-2 py-2 text-xs" aria-label="Assign to governorate"
                  >
                    <option value="">Assign to…</option>
                    {governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button onClick={() => assignCity(z)} disabled={busy} className="text-xs text-[#A8975E] hover:underline">Move</button>
                </span>
              ) : null
            )
          )}
        </section>
      )}
    </div>
  );
}
