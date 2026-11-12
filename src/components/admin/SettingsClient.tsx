"use client";

import { useState } from "react";
import type { PaymentSettings } from "@prisma/client";

import { parseFieldModes, parseCustomFields, BUILTIN_FIELDS, type CustomField, type FieldMode } from "@/lib/checkout-fields";

type ExtraField = { id: string; label: string; value: string; type: "text" | "link" | "qr" };

function parseExtra(raw?: string | null): ExtraField[] {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

export default function SettingsClient({ settings }: { settings: PaymentSettings | null }) {
  const [form, setForm] = useState({
    instapayId: settings?.instapayId || "",
    instapayPhone: settings?.instapayPhone || "",
    instructions: settings?.instructions || "Transfer the total amount via InstaPay. Upload your receipt screenshot after the transfer.",
  });
  const [extra, setExtra] = useState<ExtraField[]>(parseExtra(settings?.extraFields));
  const [modes, setModes] = useState(parseFieldModes(settings?.requiredFields));
  const [custom, setCustom] = useState<CustomField[]>(parseCustomFields(settings?.customFields));
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, extraFields: extra, requiredFields: modes, customFields: custom }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else alert("Failed to save");
  };

  const updateExtra = (id: string, patch: Partial<ExtraField>) =>
    setExtra((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const uploadQr = async (id: string, file: File) => {
    setUploadingId(id);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "payment");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploadingId(null);
    if (data.url) updateExtra(id, { value: data.url });
    else alert(data.error || "Upload failed");
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

      <div className="bg-white rounded-lg p-6 border border-gray-100 space-y-4">
        <div>
          <h2 className="font-medium text-gray-700">Checkout form</h2>
          <p className="text-xs text-gray-400 mt-1">
            Choose how each customer detail behaves at checkout. Name and email can&apos;t be hidden.
            If you have shipping cities set up, the city is always required (it decides the shipping price).
          </p>
        </div>
        {BUILTIN_FIELDS.map(({ key, label, canHide }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{label}</span>
            <select
              value={modes[key]}
              onChange={(e) => setModes((m) => ({ ...m, [key]: e.target.value as FieldMode }))}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm"
            >
              <option value="required">Required</option>
              <option value="optional">Optional</option>
              {canHide && <option value="hidden">Hidden</option>}
            </select>
          </div>
        ))}

        {/* Custom checkout fields */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Your own fields</h3>
            <button
              onClick={() =>
                setCustom((l) => [...l, { id: Math.random().toString(36).slice(2), label: "", type: "text", required: false, placeholder: "", options: [] }])
              }
              className="text-xs text-[#A8975E] hover:underline"
            >
              + Add field
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Add any extra question to checkout (e.g. Gift message, Landmark, Preferred delivery time). Answers appear on the order.
          </p>
          {custom.map((f) => {
            const patch = (p: Partial<CustomField>) => setCustom((l) => l.map((x) => (x.id === f.id ? { ...x, ...p } : x)));
            return (
              <div key={f.id} className="border border-gray-100 rounded p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={f.label}
                    onChange={(e) => patch({ label: e.target.value })}
                    placeholder="Field label"
                    className="border border-gray-200 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => patch({ type: e.target.value as CustomField["type"] })}
                    className="border border-gray-200 rounded px-3 py-2 text-sm"
                  >
                    <option value="text">Short text</option>
                    <option value="textarea">Long text</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
                {f.type === "select" ? (
                  <textarea
                    value={(f.options || []).join("\n")}
                    onChange={(e) => patch({ options: e.target.value.split("\n") })}
                    placeholder={"One choice per line\nMorning\nEvening"}
                    rows={3}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    value={f.placeholder || ""}
                    onChange={(e) => patch({ placeholder: e.target.value })}
                    placeholder="Placeholder hint (optional)"
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  />
                )}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={f.required} onChange={(e) => patch({ required: e.target.checked })} />
                    Required
                  </label>
                  <button onClick={() => setCustom((l) => l.filter((x) => x.id !== f.id))} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-60"
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

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

        {/* Custom fields */}
        <div className="pt-2 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Extra payment info</h3>
            <button
              onClick={() =>
                setExtra((l) => [...l, { id: Math.random().toString(36).slice(2), label: "", value: "", type: "text" }])
              }
              className="text-xs text-[#A8975E] hover:underline"
            >
              + Add field
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Add anything else customers need to pay: another wallet, a payment link, or a QR code. Shown on the checkout payment step.
          </p>
          {extra.map((f) => (
            <div key={f.id} className="border border-gray-100 rounded p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={f.label}
                  onChange={(e) => updateExtra(f.id, { label: e.target.value })}
                  placeholder="Label (e.g. Vodafone Cash)"
                  className="border border-gray-200 rounded px-3 py-2 text-sm"
                />
                <select
                  value={f.type}
                  onChange={(e) => updateExtra(f.id, { type: e.target.value as ExtraField["type"], value: "" })}
                  className="border border-gray-200 rounded px-3 py-2 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="link">Link</option>
                  <option value="qr">QR code (image)</option>
                </select>
              </div>
              {f.type === "qr" ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadQr(f.id, e.target.files[0])}
                    className="text-sm text-gray-500"
                  />
                  {uploadingId === f.id && <p className="text-xs text-[#A8975E]">Uploading...</p>}
                  {f.value && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.value} alt="QR" className="w-28 h-28 object-contain border border-gray-100 rounded" />
                  )}
                </div>
              ) : (
                <input
                  value={f.value}
                  onChange={(e) => updateExtra(f.id, { value: e.target.value })}
                  placeholder={f.type === "link" ? "https://..." : "Value"}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                />
              )}
              <button
                onClick={() => setExtra((l) => l.filter((x) => x.id !== f.id))}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
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
