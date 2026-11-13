"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Preset {
  id: string;
  name: string;
  values: string[];
}

export default function VariantPresetsClient({ presets: initial }: { presets: Preset[] }) {
  const router = useRouter();
  const [presets, setPresets] = useState(initial);
  const [newName, setNewName] = useState("");
  const [newValues, setNewValues] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editValues, setEditValues] = useState("");

  const create = async () => {
    if (!newName.trim() || !newValues.trim()) return;
    setSaving(true);
    const values = newValues.split(",").map((v) => v.trim()).filter(Boolean);
    const res = await fetch("/api/admin/variant-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, values }),
    });
    setSaving(false);
    if (res.ok) {
      setNewName("");
      setNewValues("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed to save");
    }
  };

  const startEdit = (p: Preset) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditValues(p.values.join(", "));
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const values = editValues.split(",").map((v) => v.trim()).filter(Boolean);
    const res = await fetch(`/api/admin/variant-presets/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, values }),
    });
    setSaving(false);
    if (res.ok) {
      setEditId(null);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed to save");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this preset?")) return;
    await fetch(`/api/admin/variant-presets/${id}`, { method: "DELETE" });
    setPresets((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Variant Presets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Save common option groups (e.g. Colors: Gold, Silver, Red) to reuse across products without retyping.
        </p>
      </div>

      {/* Add new */}
      <div className="bg-white rounded-lg border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Add New Preset</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Preset name (e.g. Colors, Sizes)</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Colors"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Values — comma separated</label>
            <input
              value={newValues}
              onChange={(e) => setNewValues(e.target.value)}
              placeholder="Gold, Silver, Red, White"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
            />
            {newValues.trim() && (
              <div className="flex flex-wrap gap-1 mt-2">
                {newValues.split(",").map((v) => v.trim()).filter(Boolean).map((v, i) => (
                  <span key={i} className="text-xs bg-[#A8975E]/10 text-[#A8975E] px-2 py-0.5 rounded-full">{v}</span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={create}
            disabled={saving || !newName.trim() || !newValues.trim()}
            className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded hover:bg-[#8A7A4A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Preset"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-50">
        {presets.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No presets yet — add one above.</p>
        ) : (
          presets.map((p) => (
            <div key={p.id} className="p-4">
              {editId === p.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                  />
                  <input
                    value={editValues}
                    onChange={(e) => setEditValues(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="text-xs text-white bg-[#A8975E] px-3 py-1 rounded disabled:opacity-60">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.values.map((v, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => startEdit(p)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
