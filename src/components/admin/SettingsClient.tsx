"use client";

import { useState } from "react";
import type { PaymentSettings } from "@prisma/client";

export default function SettingsClient({ settings }: { settings: PaymentSettings | null }) {
  const [form, setForm] = useState({
    instapayId: settings?.instapayId || "",
    instapayPhone: settings?.instapayPhone || "",
    instructions: settings?.instructions || "Transfer the total amount via InstaPay. Upload your receipt screenshot after the transfer.",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else alert("Failed to save");
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

      <div className="bg-white rounded-lg p-6 border border-gray-100 space-y-5">
        <h2 className="font-medium text-gray-700">InstaPay Payment Settings</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">InstaPay ID / Username</label>
          <input
            value={form.instapayId}
            onChange={(e) => setForm((f) => ({ ...f, instapayId: e.target.value }))}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
          <input
            value={form.instapayPhone}
            onChange={(e) => setForm((f) => ({ ...f, instapayPhone: e.target.value }))}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Customer Instructions</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            rows={4}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60"
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
