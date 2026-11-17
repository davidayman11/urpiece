"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { PackagingOption } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

interface Form { name: string; nameAr: string; image: string; price: string; freeAbove: string; sortOrder: string; isActive: boolean }
const empty = (): Form => ({ name: "", nameAr: "", image: "", price: "0", freeAbove: "", sortOrder: "0", isActive: true });

export default function PackagingClient({ options, enabledCount, oneFree: initialOneFree }: { options: PackagingOption[]; enabledCount: number; oneFree: boolean }) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [oneFree, setOneFree] = useState(initialOneFree);

  const saveOneFree = async (on: boolean) => {
    setOneFree(on);
    const res = await fetch("/api/admin/packaging/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oneFree: on }) });
    if (!res.ok) { setOneFree(!on); alert("Could not save"); }
  };

  const openCreate = () => { setForm(empty()); setEditId(null); setModal(true); };
  const openEdit = (o: PackagingOption) => {
    setForm({ name: o.name, nameAr: o.nameAr || "", image: o.image || "", price: String(o.price), freeAbove: o.freeAbove ? String(o.freeAbove) : "", sortOrder: String(o.sortOrder), isActive: o.isActive });
    setEditId(o.id);
    setModal(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "packaging");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, image: data.url }));
      else alert("Upload failed");
    } catch { alert("Upload failed"); }
    setUploading(false);
  };

  const save = async () => {
    if (!form.name.trim()) { alert("Enter a name"); return; }
    setSaving(true);
    const res = await fetch(editId ? `/api/admin/packaging/${editId}` : "/api/admin/packaging", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setModal(false); router.refresh(); } else alert("Save failed");
  };

  const toggle = async (o: PackagingOption) => {
    await fetch(`/api/admin/packaging/${o.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...o, isActive: !o.isActive }),
    });
    router.refresh();
  };

  const del = async (o: PackagingOption) => {
    if (!confirm(`Delete "${o.name}"? Orders that already used it keep their record.`)) return;
    await fetch(`/api/admin/packaging/${o.id}`, { method: "DELETE" });
    router.refresh();
  };

  const input = "w-full border border-gray-200 rounded px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Packaging</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gift boxes and wrapping customers can add. Turn <b>Offer packaging</b> on or off for each product in Products.
            {" "}{enabledCount} product{enabledCount === 1 ? "" : "s"} offer packaging now.
          </p>
        </div>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">+ Add packaging</button>
      </div>

      <label className="flex items-start gap-3 bg-white rounded-lg border border-gray-100 p-4 cursor-pointer">
        <input type="checkbox" className="mt-1" checked={oneFree} onChange={(e) => saveOneFree(e.target.checked)} />
        <span className="text-sm text-gray-700">
          <b>One free package</b> when a customer chooses more than one for the same item.
          <span className="block text-xs text-gray-500 mt-0.5">The customer picks which one is free and the others keep their price. Packages that are already free (by the &quot;free when the item costs at least&quot; rule) do not use up the free one. Saved when you tick it.</span>
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">No packaging yet</p>}
        {options.map((o) => (
          <div key={o.id} className={`bg-white rounded-lg border border-gray-100 overflow-hidden ${o.isActive ? "" : "opacity-60"}`}>
            <div className="relative h-40 bg-gray-50">
              {o.image ? <Image src={o.image} alt="" fill sizes="320px" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-3xl">📦</div>}
            </div>
            <div className="p-4">
              <p className="font-medium text-gray-800">{o.name}</p>
              {o.nameAr && <p dir="rtl" className="text-sm text-gray-500">{o.nameAr}</p>}
              <p className="text-sm text-[#A8975E] mt-1">{o.price > 0 ? `+ ${formatPrice(o.price)}` : "Free"}</p>
              {o.freeAbove ? <p className="text-xs text-green-700 mt-0.5">Free when the item costs {formatPrice(o.freeAbove)} or more</p> : null}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <button onClick={() => openEdit(o)} className="text-[#A8975E] hover:underline">Edit</button>
                <button onClick={() => toggle(o)} className="text-gray-500 hover:underline">{o.isActive ? "Turn off" : "Turn on"}</button>
                <button onClick={() => del(o)} className="text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{editId ? "Edit packaging" : "Add packaging"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="White box with roses" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name (Arabic)</label>
                <input dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className={input} placeholder="بالعربية (optional)" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Photo</label>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} className="text-sm" />
                {uploading && <p className="text-xs text-[#A8975E] mt-1">Uploading...</p>}
                {form.image && (
                  <div className="mt-2">
                    <div className="relative h-28 w-full"><Image src={form.image} alt="" fill className="object-cover rounded" /></div>
                    <button type="button" onClick={() => setForm({ ...form, image: "" })} className="text-xs text-red-500 hover:underline mt-1">Remove photo</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Extra price (EGP, 0 = free)</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Order (small first)</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={input} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Free when the item costs at least (EGP) — optional</label>
                <input type="number" min="0" value={form.freeAbove} onChange={(e) => setForm({ ...form, freeAbove: e.target.value })} className={input} placeholder="e.g. 300 (leave empty = never free)" />
                <p className="text-[11px] text-gray-400 mt-1">Example: extra price 100 and 300 here means this packaging costs 100 on cheaper items and is free on items that cost 300 or more.</p>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active (customers can choose it)
              </label>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded">Cancel</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded disabled:opacity-60">{saving ? "Saving..." : editId ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
