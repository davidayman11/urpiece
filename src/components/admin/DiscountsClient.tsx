"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import type { DiscountRule } from "@prisma/client";

interface Settings {
  discountMode: "STACK" | "ONE";
  salesEnabled: boolean;
  promosEnabled: boolean;
  freeShippingMin: number | null;
}

interface RuleForm {
  name: string; nameAr: string; minAmount: string; minItems: string; type: "PERCENT" | "FIXED"; value: string;
  isActive: boolean; startsAt: string; endsAt: string;
}

const emptyRule = (): RuleForm => ({ name: "", nameAr: "", minAmount: "", minItems: "", type: "PERCENT", value: "", isActive: true, startsAt: "", endsAt: "" });

const toLocal = (d?: Date | string | null) => {
  if (!d) return "";
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};

const card = "bg-white rounded-lg p-5 border border-gray-100 space-y-3";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-[#A8975E]" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function DiscountsClient({
  settings, rules, activePromos, salesCount,
}: { settings: Settings; rules: DiscountRule[]; activePromos: number; salesCount: number }) {
  const router = useRouter();
  const [mode, setMode] = useState(settings.discountMode);
  const [salesOn, setSalesOn] = useState(settings.salesEnabled);
  const [promosOn, setPromosOn] = useState(settings.promosEnabled);
  const [freeOn, setFreeOn] = useState(settings.freeShippingMin != null);
  const [freeMin, setFreeMin] = useState(settings.freeShippingMin ? String(settings.freeShippingMin) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyRule());
  const [ruleSaving, setRuleSaving] = useState(false);

  const saveSettings = async () => {
    if (freeOn && !(parseFloat(freeMin) > 0)) return alert("Enter the amount for free shipping, or turn it off");
    setSaving(true);
    const res = await fetch("/api/admin/discount-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discountMode: mode, salesEnabled: salesOn, promosEnabled: promosOn,
        freeShippingMin: freeOn ? freeMin : "",
      }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); }
    else alert("Failed to save");
  };

  const openCreate = () => { setForm(emptyRule()); setEditId(null); setModal("create"); };
  const openEdit = (r: DiscountRule) => {
    setEditId(r.id);
    setForm({
      name: r.name, nameAr: r.nameAr || "", minAmount: r.minAmount ? String(r.minAmount) : "", minItems: r.minItems ? String(r.minItems) : "", type: r.type === "FIXED" ? "FIXED" : "PERCENT",
      value: String(r.value), isActive: r.isActive, startsAt: toLocal(r.startsAt), endsAt: toLocal(r.endsAt),
    });
    setModal("edit");
  };
  const saveRule = async () => {
    setRuleSaving(true);
    const res = await fetch(editId ? `/api/admin/discount-rules/${editId}` : "/api/admin/discount-rules", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      }),
    });
    setRuleSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); alert(d.error || "Save failed"); }
  };
  const delRule = async (r: DiscountRule) => {
    if (!confirm(`Delete "${r.name}"?`)) return;
    await fetch(`/api/admin/discount-rules/${r.id}`, { method: "DELETE" });
    router.refresh();
  };
  const toggleRule = async (r: DiscountRule) => {
    await fetch(`/api/admin/discount-rules/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, isActive: !r.isActive }),
    });
    router.refresh();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Discounts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every discount your store can give, in one place — and how they work together.
        </p>
      </div>

      {/* Stacking */}
      <div className={card}>
        <h2 className="font-medium text-gray-700 text-sm">How discounts combine</h2>
        {([
          ["STACK", "Customers can use more than one discount at once", "Every discount that applies is added together (sale prices + order discount + promo code + free shipping)."],
          ["ONE", "Only one discount — the best one", "If several apply, the customer automatically gets whichever saves them the most, and the others are skipped."],
        ] as const).map(([value, title, desc]) => (
          <label key={value} className={`flex gap-3 p-3 rounded border cursor-pointer ${mode === value ? "border-[#A8975E] bg-[#A8975E]/5" : "border-gray-100 hover:bg-gray-50"}`}>
            <input type="radio" name="mode" checked={mode === value} onChange={() => setMode(value)} className="mt-1" />
            <span>
              <span className="block text-sm font-medium text-gray-800">{title}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Types */}
      <div className={card}>
        <h2 className="font-medium text-gray-700 text-sm">Discount types</h2>
        <p className="text-xs text-gray-400">Turn each type on or off for the whole store.</p>

        <div className="flex items-start justify-between gap-4 py-3 border-t border-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-800">Product sales</p>
            <p className="text-xs text-gray-500">
              A % or EGP sale set on each product (with optional start/end time). {salesCount} product{salesCount === 1 ? "" : "s"} on sale.{" "}
              <Link href="/admin/products" className="text-[#A8975E] hover:underline">Manage in Products →</Link>
            </p>
          </div>
          <Toggle on={salesOn} onChange={setSalesOn} />
        </div>

        <div className="flex items-start justify-between gap-4 py-3 border-t border-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-800">Promo codes</p>
            <p className="text-xs text-gray-500">
              Codes customers type at checkout. {activePromos} active.{" "}
              <Link href="/admin/promo-codes" className="text-[#A8975E] hover:underline">Manage codes →</Link>
            </p>
          </div>
          <Toggle on={promosOn} onChange={setPromosOn} />
        </div>

        <div className="flex items-start justify-between gap-4 py-3 border-t border-gray-50">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Free shipping</p>
            <p className="text-xs text-gray-500">Shipping becomes free once the order reaches this amount (after other discounts).</p>
            {freeOn && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Free shipping over</span>
                <input
                  type="number"
                  min="0"
                  value={freeMin}
                  onChange={(e) => setFreeMin(e.target.value)}
                  placeholder="1000"
                  className="w-28 border border-gray-200 rounded px-3 py-1.5 text-sm"
                />
                <span className="text-sm text-gray-600">EGP</span>
              </div>
            )}
          </div>
          <Toggle on={freeOn} onChange={setFreeOn} />
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60"
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      {/* Order discounts */}
      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium text-gray-700 text-sm">Order discounts (automatic)</h2>
            <p className="text-xs text-gray-400 mt-1">
              No code needed. Example: &quot;Spend 800 EGP, get 10% off&quot;. If several qualify, the biggest one applies.
            </p>
          </div>
          <button onClick={openCreate} className="text-xs bg-[#A8975E] text-white px-3 py-2 rounded hover:bg-[#8A7A4A] shrink-0">
            + Add discount
          </button>
        </div>

        {rules.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No automatic discounts yet.</p>}
        {rules.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 border-t border-gray-50 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">{r.name}</p>
              <p className="text-xs text-gray-500">
                {r.type === "FIXED" ? formatPrice(r.value) : `${r.value}%`} off
                {r.minItems > 0 ? ` · ${r.minItems}+ products` : ""}
                {r.minAmount > 0 ? ` · orders over ${formatPrice(r.minAmount)}` : r.minItems > 0 ? "" : " · any order"}
                {r.startsAt || r.endsAt ? ` · ${r.startsAt ? new Date(r.startsAt).toLocaleDateString() : "now"} → ${r.endsAt ? new Date(r.endsAt).toLocaleDateString() : "no end"}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Toggle on={r.isActive} onChange={() => toggleRule(r)} />
              <button onClick={() => openEdit(r)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
              <button onClick={() => delRule(r)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md my-8 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Edit discount" : "Add discount"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name (shown to customers)</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Spend 800, save 10%"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name (Arabic)</label>
                <input dir="rtl" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="بالعربية (optional)"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Number of products at least</label>
                  <input type="number" min="0" value={form.minItems} onChange={(e) => setForm((f) => ({ ...f, minItems: e.target.value }))} placeholder="0 = any number"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Order total at least (EGP)</label>
                  <input type="number" min="0" value={form.minAmount} onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))} placeholder="0 = any order"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 -mt-2">
                Example: 5 products and 25% off = &quot;buy 5 pieces, get 25% off&quot;. You can set the order total too (both must be met).
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Discount</label>
                  <div className="flex gap-1">
                    <input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                      className="w-full min-w-0 border border-gray-200 rounded px-3 py-2 text-sm" />
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RuleForm["type"] }))}
                      className="border border-gray-200 rounded px-2 py-2 text-sm">
                      <option value="PERCENT">%</option>
                      <option value="FIXED">EGP</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Starts (optional)</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Ends (optional)</label>
                  <input type="datetime-local" value={form.endsAt} min={form.startsAt || undefined} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={saveRule} disabled={ruleSaving} className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded hover:bg-[#8A7A4A] disabled:opacity-60">
                {ruleSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
