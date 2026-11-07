"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { products: number } };

interface Props { categories: CategoryWithCount[] }

interface Form { name: string; description: string; image: string; isActive: boolean; sortOrder: string }
const emptyForm = (): Form => ({ name: "", description: "", image: "", isActive: true, sortOrder: "0" });

export default function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal("create"); };
  const openEdit = (c: CategoryWithCount) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description || "", image: c.image || "", isActive: c.isActive, sortOrder: String(c.sortOrder) });
    setModal("edit");
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "categories");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm((f) => ({ ...f, image: data.url }));
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const url = editId ? `/api/admin/categories/${editId}` : "/api/admin/categories";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) || 0 }),
    });
    setSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else { const d = await res.json(); alert(d.error || "Save failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Categories</h1>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">
          + Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 && (
          <p className="text-gray-400 col-span-full text-center py-10">No categories yet</p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="relative h-32 bg-[#EDE6D4]">
              {cat.image && <Image src={cat.image} alt={cat.name} fill className="object-cover" />}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cat._count.products} products</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {cat.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(cat)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
                <button onClick={() => del(cat.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{editId ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Image</label>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} className="text-sm" />
                {uploading && <p className="text-xs text-[#A8975E]">Uploading...</p>}
                {form.image && <div className="relative h-20 mt-2"><Image src={form.image} alt="" fill className="object-cover rounded" /></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Active
                  </label>
                </div>
              </div>
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
