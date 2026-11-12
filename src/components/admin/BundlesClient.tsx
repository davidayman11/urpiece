"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice, slugify } from "@/lib/utils";
import { bundlePrice } from "@/lib/bundles";
import type { Bundle, BundleItem } from "@prisma/client";

type Variant = { id: string; name: string; price: number; isActive: boolean };
type Product = { id: string; name: string; isActive: boolean; variants: Variant[] };
type BundleWithItems = Bundle & { items: BundleItem[] };

interface ItemForm { productId: string; variantId: string }
interface Form {
  name: string; slug: string; description: string; image: string; isActive: boolean;
  priceType: "FIXED" | "PERCENT"; priceValue: string; items: ItemForm[];
}
const emptyForm = (): Form => ({
  name: "", slug: "", description: "", image: "", isActive: true,
  priceType: "FIXED", priceValue: "", items: [{ productId: "", variantId: "" }, { productId: "", variantId: "" }],
});

const inp = "border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]";

export default function BundlesClient({ bundles, products }: { bundles: BundleWithItems[]; products: Product[] }) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const byId = new Map(products.map((p) => [p.id, p]));
  const activeVariants = (p?: Product) => (p ? p.variants.filter((v) => v.isActive) : []);

  /** Regular price of one bundle item: the chosen variant, or the cheapest variant when the customer chooses */
  const itemPrice = (i: ItemForm) => {
    const p = byId.get(i.productId);
    if (!p) return 0;
    const vs = activeVariants(p);
    if (i.variantId) return vs.find((v) => v.id === i.variantId)?.price ?? 0;
    return vs.length ? Math.min(...vs.map((v) => v.price)) : 0;
  };
  const listTotal = form.items.reduce((s, i) => s + itemPrice(i), 0);
  const pv = parseFloat(form.priceValue) || 0;
  const price = pv > 0 ? bundlePrice(form.priceType, pv, listTotal) : 0;
  const hasChoice = form.items.some((i) => i.productId && !i.variantId);

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (b: BundleWithItems) => {
    setForm({
      name: b.name, slug: b.slug, description: b.description || "", image: b.image || "", isActive: b.isActive,
      priceType: b.priceType === "PERCENT" ? "PERCENT" : "FIXED", priceValue: String(b.priceValue),
      items: b.items.map((i) => ({ productId: i.productId, variantId: i.variantId || "" })),
    });
    setEditId(b.id);
    setModal(true);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "bundles");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setUploading(false);
    if (d.url) setForm((f) => ({ ...f, image: d.url }));
    else alert(d.error || "Upload failed");
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch(editId ? `/api/admin/bundles/${editId}` : "/api/admin/bundles", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        slug: form.slug || slugify(form.name),
        items: form.items.filter((i) => i.productId).map((i) => ({ productId: i.productId, variantId: i.variantId || null })),
      }),
    });
    setSaving(false);
    if (res.ok) { setModal(false); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); alert(d.error || "Could not save"); }
  };

  const remove = async (b: BundleWithItems) => {
    if (!confirm(`Delete the bundle "${b.name}"?`)) return;
    await fetch(`/api/admin/bundles/${b.id}`, { method: "DELETE" });
    router.refresh();
  };

  const summary = (b: BundleWithItems) => {
    const parts = b.items.map((i) => {
      const p = byId.get(i.productId);
      const vs = activeVariants(p);
      return i.variantId ? vs.find((v) => v.id === i.variantId)?.price ?? 0 : vs.length ? Math.min(...vs.map((v) => v.price)) : 0;
    });
    const total = parts.reduce((s, x) => s + x, 0);
    return { total, price: bundlePrice(b.priceType, b.priceValue, total) };
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Bundles</h1>
          <p className="text-sm text-gray-500 mt-1">Sell products together at a special price — a fixed price, or a % off the total.</p>
        </div>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">+ New bundle</button>
      </div>

      {bundles.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-10 text-center text-sm text-gray-400">
          No bundles yet. Click <strong>+ New bundle</strong> to create your first one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bundles.map((b) => {
            const s = summary(b);
            return (
              <div key={b.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="relative w-20 h-24 bg-[#EDE6D4] rounded overflow-hidden shrink-0">
                    {b.image && <Image src={b.image} alt={b.name} fill className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-800 truncate">{b.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {b.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {b.items.length} products ·{" "}
                      {b.items.map((i) => byId.get(i.productId)?.name || "?").join(", ")}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="text-gray-400 line-through mr-2">{formatPrice(s.total)}</span>
                      <span className="font-medium text-[#A8975E]">{formatPrice(s.price)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 px-4 py-2 bg-gray-50 text-xs">
                  <button onClick={() => openEdit(b)} className="text-[#A8975E] hover:underline">Edit</button>
                  <a href={`/bundle/${b.slug}`} target="_blank" rel="noopener" className="text-gray-500 hover:underline">View on site</a>
                  <button onClick={() => remove(b)} className="text-red-500 hover:underline ml-auto">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Edit bundle" : "New bundle"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bundle name *</label>
                  <input className={`w-full ${inp}`} value={form.name} placeholder="e.g. Gold Gift Set"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editId ? f.slug : slugify(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Link name</label>
                  <input className={`w-full ${inp}`} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea rows={3} className={`w-full ${inp}`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Photo</label>
                <div className="flex items-center gap-3">
                  {form.image && <div className="relative w-16 h-20 rounded overflow-hidden bg-gray-100"><Image src={form.image} alt="" fill className="object-cover" /></div>}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="text-sm text-gray-500" />
                  {uploading && <span className="text-xs text-[#A8975E]">Uploading…</span>}
                  {form.image && <button onClick={() => setForm((f) => ({ ...f, image: "" }))} className="text-xs text-red-500">Remove</button>}
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">Products in the bundle *</label>
                  <button onClick={() => setForm((f) => ({ ...f, items: [...f.items, { productId: "", variantId: "" }] }))} className="text-xs text-[#A8975E] hover:underline">+ Add product</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, idx) => {
                    const p = byId.get(it.productId);
                    const set = (patch: Partial<ItemForm>) =>
                      setForm((f) => ({ ...f, items: f.items.map((x, j) => (j === idx ? { ...x, ...patch } : x)) }));
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 border border-gray-100 rounded p-2">
                        <select className={`flex-1 ${inp}`} value={it.productId} onChange={(e) => set({ productId: e.target.value, variantId: "" })}>
                          <option value="">Choose a product…</option>
                          {products.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}{pr.isActive ? "" : " (hidden)"}</option>)}
                        </select>
                        <select className={`sm:w-52 ${inp}`} value={it.variantId} disabled={!p} onChange={(e) => set({ variantId: e.target.value })}>
                          <option value="">Customer chooses</option>
                          {activeVariants(p).map((v) => <option key={v.id} value={v.id}>{v.name} — {formatPrice(v.price)}</option>)}
                        </select>
                        <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== idx) }))} className="text-red-500 text-lg px-2" aria-label="Remove">×</button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pick a specific option to fix it (e.g. one colour), or leave &quot;Customer chooses&quot; so the shopper selects size/colour. Add the same product twice if the bundle has two of it.
                </p>
              </div>

              {/* Price */}
              <div className="border border-gray-100 rounded p-3 space-y-3">
                <label className="text-xs text-gray-500 block">Bundle price</label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded border border-gray-200 overflow-hidden text-sm">
                    {(["FIXED", "PERCENT"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, priceType: t }))}
                        className={`px-3 py-2 ${form.priceType === t ? "bg-[#A8975E] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                        {t === "FIXED" ? "Fixed price (EGP)" : "% off the total"}
                      </button>
                    ))}
                  </div>
                  <input type="number" min="0" value={form.priceValue} onChange={(e) => setForm((f) => ({ ...f, priceValue: e.target.value }))}
                    placeholder={form.priceType === "FIXED" ? "e.g. 1200" : "e.g. 15"} className={`w-32 ${inp}`} />
                </div>
                {listTotal > 0 && pv > 0 && (
                  <p className="text-xs text-emerald-700">
                    {hasChoice ? "From " : ""}{formatPrice(listTotal)} → <strong>{formatPrice(price)}</strong>
                    {listTotal > price && ` · customer saves ${formatPrice(listTotal - price)} (${Math.round(((listTotal - price) / listTotal) * 100)}%)`}
                    {hasChoice && " (based on the cheapest options)"}
                  </p>
                )}
                <p className="text-[11px] text-gray-400">A bundle price replaces product sales on those items. Promo codes and order discounts still apply to the bundle.</p>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active (visible in the store)
              </label>
            </div>

            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded hover:bg-[#8A7A4A] disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Update bundle" : "Create bundle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
