"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";

interface Expense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
}

const CATEGORIES = ["Shipping", "Packaging", "Marketing", "Operations", "Procurement", "Other"];

interface Form { category: string; description: string; amount: string; date: string }
const emptyForm = (): Form => ({
  category: "Operations",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
});

export default function ExpensesClient() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/expenses");
    const data = await res.json();
    setExpenses(data);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal("create"); };
  const openEdit = (e: Expense) => {
    setEditId(e.id);
    setForm({ category: e.category, description: e.description || "", amount: String(e.amount), date: e.date.split("T")[0] });
    setModal("edit");
  };

  const save = async () => {
    setSaving(true);
    const url = editId ? `/api/admin/expenses/${editId}` : "/api/admin/expenses";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setModal(null); load(); }
    else alert("Save failed");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    load();
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Total: {formatPrice(total)}</p>
        </div>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">
          + Add Expense
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Date</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Category</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Description</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Amount</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No expenses recorded</td></tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{format(new Date(e.date), "d MMM yyyy")}</td>
                  <td className="p-4">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{e.category}</span>
                  </td>
                  <td className="p-4 text-gray-600">{e.description || "—"}</td>
                  <td className="p-4 font-medium text-gray-800">{formatPrice(e.amount)}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(e)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
                      <button onClick={() => del(e.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{editId ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category *</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (EGP) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded">Cancel</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
