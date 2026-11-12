"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { PromoCode } from "@prisma/client";

interface Form {
  code: string; discountType: string; discountValue: string;
  minOrderAmount: string; maxDiscount: string; usageLimit: string;
  isActive: boolean; requiresLogin: boolean; startsAt: string; expiresAt: string;
}
const emptyForm = (): Form => ({
  code: "", discountType: "PERCENTAGE", discountValue: "",
  minOrderAmount: "", maxDiscount: "", usageLimit: "",
  isActive: true, requiresLogin: false, startsAt: "", expiresAt: "",
});

export default function PromoCodesClient({ codes }: { codes: PromoCode[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal("create"); };
  const openEdit = (c: PromoCode) => {
    setEditId(c.id);
    setForm({
      code: c.code, discountType: c.discountType, discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      isActive: c.isActive,
      requiresLogin: c.requiresLogin,
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().split("T")[0] : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "",
    });
    setModal("edit");
  };

  const save = async () => {
    setSaving(true);
    const url = editId ? `/api/admin/promo-codes/${editId}` : "/api/admin/promo-codes";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else { const d = await res.json(); alert(d.error || "Save failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const isExpired = (c: PromoCode) => c.expiresAt && new Date(c.expiresAt) < new Date();
  const isFull = (c: PromoCode) => c.usageLimit && c.usedCount >= c.usageLimit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Promo Codes</h1>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">
          + Add Code
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Code</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Discount</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Usage</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Expires</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {codes.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No promo codes</td></tr>
            ) : (
              codes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono font-medium text-gray-800">{c.code}</td>
                  <td className="p-4 text-gray-600">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `EGP ${c.discountValue}`}
                    {c.minOrderAmount ? <span className="text-xs text-gray-400 ml-1">(min {c.minOrderAmount})</span> : null}
                    {c.requiresLogin && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Login required</span>}
                  </td>
                  <td className="p-4 text-gray-500">
                    {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {c.expiresAt ? format(new Date(c.expiresAt), "d MMM yyyy") : "No expiry"}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      !c.isActive ? "bg-gray-100 text-gray-500"
                      : isExpired(c) ? "bg-red-100 text-red-700"
                      : isFull(c) ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                    }`}>
                      {!c.isActive ? "Disabled" : isExpired(c) ? "Expired" : isFull(c) ? "Exhausted" : "Active"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
                      <button onClick={() => del(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{editId ? "Edit Code" : "Add Promo Code"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  disabled={!!editId}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono uppercase disabled:bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                    <option value="PERCENTAGE">Percentage %</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Value *</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Min Order</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max Discount</label>
                  <input type="number" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Starts At</label>
                  <input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Expires At</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer border border-gray-100 rounded p-3">
                <input type="checkbox" className="mt-1" checked={form.requiresLogin} onChange={(e) => setForm((f) => ({ ...f, requiresLogin: e.target.checked }))} />
                <span>
                  <span className="block text-gray-800">Customer must be signed in to use this code</span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    Guests who try it are asked to sign in or create an account first. Leave unticked and anyone can use the code.
                  </span>
                </span>
              </label>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded">Cancel</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
