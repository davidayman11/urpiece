"use client";

import { useState } from "react";
import Image from "next/image";

const PAGE_OPTIONS = [
  { label: "Home", value: "/" },
  { label: "Shop — All", value: "/shop" },
  { label: "Shop — Necklaces", value: "/shop?category=necklaces" },
  { label: "Shop — Earrings", value: "/shop?category=earrings" },
  { label: "Shop — Rings", value: "/shop?category=rings" },
  { label: "Shop — Bracelets", value: "/shop?category=bracelets" },
  { label: "About", value: "/about" },
  { label: "Contact", value: "/contact" },
  { label: "My Orders", value: "/orders" },
];
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Popup } from "@prisma/client";

interface Form {
  title: string; heading: string; body: string;
  headingAr: string; bodyAr: string; buttonTextAr: string;
  buttonText: string; buttonUrl: string; image: string;
  promoCode: string;
  frequency: string; isActive: boolean;
  startsAt: string; expiresAt: string;
}
const emptyForm = (): Form => ({
  title: "", heading: "", body: "", headingAr: "", bodyAr: "", buttonTextAr: "", buttonText: "Shop Now", buttonUrl: "/shop",
  image: "", promoCode: "", frequency: "ONCE_PER_SESSION", isActive: true, startsAt: "", expiresAt: "",
});

export default function PopupsAdminClient({ popups, products, promoCodes }: { popups: Popup[]; products: { slug: string; name: string }[]; promoCodes: string[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "popups");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, image: data.url }));
      else alert("Upload failed");
    } catch { alert("Upload failed"); }
    setUploading(false);
  };

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal("create"); };
  const openEdit = (p: Popup) => {
    setEditId(p.id);
    setForm({
      title: p.title, heading: p.heading || "", body: p.body || "",
      headingAr: p.headingAr || "", bodyAr: p.bodyAr || "", buttonTextAr: p.buttonTextAr || "",
      buttonText: p.buttonText || "", buttonUrl: p.buttonUrl || "",
      image: p.image || "", promoCode: p.promoCode || "", frequency: p.frequency, isActive: p.isActive,
      startsAt: p.startsAt ? new Date(p.startsAt).toISOString().split("T")[0] : "",
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().split("T")[0] : "",
    });
    setModal("edit");
  };

  const save = async () => {
    setSaving(true);
    const url = editId ? `/api/admin/popups/${editId}` : "/api/admin/popups";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, startsAt: form.startsAt || null, expiresAt: form.expiresAt || null }),
    });
    setSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else alert("Save failed");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this popup?")) return;
    await fetch(`/api/admin/popups/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Popups</h1>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">
          + Add Popup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {popups.length === 0 && (
          <p className="text-gray-400 col-span-full text-center py-10">No popups yet</p>
        )}
        {popups.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800">{p.title}</p>
                {p.heading && <p className="text-sm text-gray-500 mt-0.5">{p.heading}</p>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {p.isActive ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span>👁 {p.views} views</span>
              <span>🖱 {p.clicks} clicks</span>
              <span>{p.frequency.replace(/_/g, " ")}</span>
            </div>
            {p.expiresAt && <p className="text-xs text-gray-400 mt-2">Expires: {format(new Date(p.expiresAt), "d MMM yyyy")}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => openEdit(p)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
              <button onClick={() => del(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{editId ? "Edit Popup" : "Add Popup"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { label: "Title (internal) *", key: "title" as keyof Form },
                { label: "Heading", key: "heading" as keyof Form },
                { label: "Heading (Arabic)", key: "headingAr" as keyof Form, rtl: true },
                { label: "Body text", key: "body" as keyof Form, textarea: true },
                { label: "Body text (Arabic)", key: "bodyAr" as keyof Form, textarea: true, rtl: true },
                { label: "Button Text", key: "buttonText" as keyof Form },
                { label: "Button Text (Arabic)", key: "buttonTextAr" as keyof Form, rtl: true },
              ].map(({ label, key, textarea, rtl }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  {textarea ? (
                    <textarea dir={rtl ? "rtl" : undefined} placeholder={rtl ? "بالعربية (optional)" : undefined} value={String(form[key])} onChange={f(key)} rows={3} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                  ) : (
                    <input dir={rtl ? "rtl" : undefined} placeholder={rtl ? "بالعربية (optional)" : undefined} value={String(form[key])} onChange={f(key)} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Image</label>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} className="text-sm" />
                {uploading && <p className="text-xs text-[#A8975E] mt-1">Uploading...</p>}
                {form.image && (
                  <div className="mt-2">
                    <div className="relative h-24 w-full"><Image src={form.image} alt="" fill className="object-cover rounded" /></div>
                    <button type="button" onClick={() => setForm((p) => ({ ...p, image: "" }))} className="text-xs text-red-500 hover:underline mt-1">Remove image</button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Button goes to</label>
                <select value={form.buttonUrl} onChange={f("buttonUrl")} className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                  <option value="">— Select a page or product —</option>
                  <optgroup label="Pages">
                    {PAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Products">
                    {products.map((p) => (
                      <option key={p.slug} value={`/product/${p.slug}`}>{p.name}</option>
                    ))}
                  </optgroup>
                  {form.buttonUrl && !PAGE_OPTIONS.some((o) => o.value === form.buttonUrl) && !products.some((p) => `/product/${p.slug}` === form.buttonUrl) && (
                    <option value={form.buttonUrl}>{form.buttonUrl}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Promo code to show (customers can copy it)</label>
                <select value={form.promoCode} onChange={f("promoCode")} className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                  <option value="">— No promo code —</option>
                  {promoCodes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {form.promoCode && !promoCodes.includes(form.promoCode) && <option value={form.promoCode}>{form.promoCode} (not active)</option>}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Pick one of your active promo codes (create codes in Promo Codes).</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                <select value={form.frequency} onChange={f("frequency")} className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                  <option value="ONCE_PER_SESSION">Once Per Session</option>
                  <option value="ONCE_EVER">Once Ever</option>
                  <option value="EVERY_VISIT">Every Visit</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Starts At</label>
                  <input type="date" value={form.startsAt} onChange={f("startsAt")} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Expires At</label>
                  <input type="date" value={form.expiresAt} onChange={f("expiresAt")} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
                Active
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
