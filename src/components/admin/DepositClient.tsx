"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import type { DepositRule } from "@prisma/client";

interface Settings { depositEnabled: boolean; depositAllowFull: boolean; depositAddShipping: boolean }
interface RuleForm { minAmount: string; maxAmount: string; type: "FIXED" | "PERCENT"; value: string; isActive: boolean }
const emptyRule = (): RuleForm => ({ minAmount: "0", maxAmount: "", type: "FIXED", value: "", isActive: true });

const card = "bg-white rounded-lg p-6 border border-gray-100 space-y-4";
const inp = "border border-gray-200 rounded px-3 py-2 text-sm";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-[#A8975E]" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

const describe = (r: { minAmount: number; maxAmount: number | null; type: string; value: number }) => {
  const range =
    r.maxAmount == null
      ? `${formatPrice(r.minAmount)} and above`
      : r.minAmount > 0 ? `${formatPrice(r.minAmount)} up to ${formatPrice(r.maxAmount)}` : `under ${formatPrice(r.maxAmount)}`;
  return `Orders ${range} → deposit ${r.type === "PERCENT" ? `${r.value}% of the order` : formatPrice(r.value)}`;
};

export default function DepositClient({ settings, rules }: { settings: Settings; rules: DepositRule[] }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<RuleForm>(emptyRule());
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/deposit-settings", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); }
    else alert("Failed to save");
  };

  const open = (r?: DepositRule) => {
    setEditId(r?.id ?? null);
    setForm(r ? { minAmount: String(r.minAmount), maxAmount: r.maxAmount == null ? "" : String(r.maxAmount), type: r.type === "PERCENT" ? "PERCENT" : "FIXED", value: String(r.value), isActive: r.isActive } : emptyRule());
    setFormOpen(true);
  };
  const saveRule = async () => {
    setBusy(true);
    const res = await fetch(editId ? `/api/admin/deposit-rules/${editId}` : "/api/admin/deposit-rules", {
      method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) { setFormOpen(false); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); alert(d.error || "Could not save"); }
  };
  const del = async (r: DepositRule) => {
    if (!confirm("Delete this deposit rule?")) return;
    await fetch(`/api/admin/deposit-rules/${r.id}`, { method: "DELETE" });
    router.refresh();
  };
  const toggle = async (r: DepositRule) => {
    await fetch(`/api/admin/deposit-rules/${r.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...r, isActive: !r.isActive }),
    });
    router.refresh();
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className={card}>
        <div>
          <h2 className="font-medium text-gray-700">Deposit</h2>
          <p className="text-xs text-gray-400 mt-1">
            Let customers pay only part of the order now (a deposit) and the rest on delivery. The deposit is worked out
            from the order amount <strong>without shipping</strong>, using the rules below.
          </p>
        </div>

        {([
          ["depositEnabled", "Turn deposits on", "When off, customers always pay the full amount."],
          ["depositAllowFull", "Let customers choose to pay in full instead", "When off, a matching order must pay the deposit."],
          ["depositAddShipping", "Add the shipping fee to the deposit", "The customer transfers the deposit + shipping now."],
        ] as const).map(([key, title, hint]) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-800">{title}</p>
              <p className="text-xs text-gray-400">{hint}</p>
            </div>
            <Toggle on={s[key]} onChange={(v) => setS((x) => ({ ...x, [key]: v }))} />
          </div>
        ))}
        <button onClick={saveSettings} disabled={saving} className="px-6 py-2.5 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60">
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save deposit settings"}
        </button>
      </div>

      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-gray-700 text-sm">Deposit rules</h3>
            <p className="text-xs text-gray-400 mt-1">
              Example: &quot;from 0 up to 500 → deposit 100 EGP&quot; and &quot;from 500 → 30%&quot;. An order that matches no rule pays in full.
            </p>
          </div>
          <button onClick={() => open()} className="text-xs bg-[#A8975E] text-white px-3 py-2 rounded hover:bg-[#8A7A4A] shrink-0">+ Add rule</button>
        </div>

        {rules.length === 0 && <p className="text-sm text-gray-400 text-center py-3">No rules yet.</p>}
        {rules.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 border-t border-gray-50 pt-3">
            <p className={`text-sm ${r.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>{describe(r)}</p>
            <div className="flex items-center gap-3 shrink-0">
              <Toggle on={r.isActive} onChange={() => toggle(r)} />
              <button onClick={() => open(r)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
              <button onClick={() => del(r)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}

        {formOpen && (
          <div className="border border-[#A8975E]/40 bg-[#A8975E]/5 rounded p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">{editId ? "Edit rule" : "New rule"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Order amount from (EGP)</label>
                <input type="number" min="0" value={form.minAmount} onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))} className={`w-full ${inp}`} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">…up to, not including (EGP)</label>
                <input type="number" min="0" value={form.maxAmount} placeholder="no limit" onChange={(e) => setForm((f) => ({ ...f, maxAmount: e.target.value }))} className={`w-full ${inp}`} />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Deposit the customer pays now</label>
              <div className="flex gap-2">
                <input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} className={`flex-1 min-w-0 ${inp}`} />
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RuleForm["type"] }))} className={inp}>
                  <option value="FIXED">EGP</option>
                  <option value="PERCENT">% of the order</option>
                </select>
              </div>
            </div>
            {parseFloat(form.value) > 0 && (
              <p className="text-xs text-emerald-700">
                {describe({ minAmount: parseFloat(form.minAmount) || 0, maxAmount: form.maxAmount === "" ? null : parseFloat(form.maxAmount), type: form.type, value: parseFloat(form.value) })}
              </p>
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active
              </label>
              <div className="flex gap-2">
                <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50">Cancel</button>
                <button onClick={saveRule} disabled={busy} className="px-5 py-2 text-sm bg-[#A8975E] text-white rounded hover:bg-[#8A7A4A] disabled:opacity-60">{busy ? "Saving..." : "Save rule"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
