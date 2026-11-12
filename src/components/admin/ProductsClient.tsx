"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatPrice, parseJson, slugify } from "@/lib/utils";
import { salePrice, saleLabel } from "@/lib/pricing";
import type { Product, Variant, Category } from "@prisma/client";

type ProductWithVariants = Product & { variants: Variant[]; category: Category | null };

interface Props {
  products: ProductWithVariants[];
  categories: Category[];
}

interface VariantForm {
  id?: string;
  name: string;
  price: string;
  costPrice: string;
  inventory: string;
  options: string;
  sku: string;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  salePercent: string;
  saleType: "PERCENT" | "FIXED";
  images: string[];
  variants: VariantForm[];
}

const emptyVariant = (): VariantForm => ({
  name: "", price: "", costPrice: "", inventory: "0", options: "", sku: "",
});

const emptyForm = (): ProductForm => ({
  name: "", slug: "", description: "", categoryId: "", isActive: true, isFeatured: false, salePercent: "", saleType: "PERCENT",
  images: [], variants: [emptyVariant()],
});

export default function ProductsClient({ products: initial, categories }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setModal("create"); };
  const openEdit = (p: ProductWithVariants) => {
    setEditId(p.id);
    setForm({
      name: p.name, slug: p.slug, description: p.description || "",
      categoryId: p.categoryId || "", isActive: p.isActive, isFeatured: p.isFeatured,
      salePercent: p.salePercent ? String(p.salePercent) : "",
      saleType: p.saleType === "FIXED" ? "FIXED" : "PERCENT",
      images: parseJson<string[]>(p.images, []),
      variants: p.variants.map((v) => ({
        id: v.id, name: v.name, price: String(v.price), costPrice: String(v.costPrice),
        inventory: String(v.inventory), options: v.options, sku: v.sku || "",
      })),
    });
    setModal("edit");
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      salePercent: parseFloat(form.salePercent) || 0,
      saleType: form.saleType,
      variants: form.variants.map((v) => ({
        ...v,
        price: parseFloat(v.price) || 0,
        costPrice: parseFloat(v.costPrice) || 0,
        inventory: parseInt(v.inventory) || 0,
      })),
    };
    const url = editId ? `/api/admin/products/${editId}` : "/api/admin/products";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else { const d = await res.json(); alert(d.error || "Save failed"); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A] transition-colors">
          + Add Product
        </button>
      </div>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Product</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Category</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Variants</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Stock</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Price</th>
              <th className="text-left p-4 text-xs text-gray-500 font-medium">Status</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No products found</td></tr>
            ) : (
              filtered.map((p) => {
                const imgs = parseJson<string[]>(p.images, []);
                const totalStock = p.variants.reduce((a, v) => a + v.inventory, 0);
                const minPrice = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#EDE6D4] overflow-hidden shrink-0">
                          {imgs[0] && <Image src={imgs[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{p.category?.name || "—"}</td>
                    <td className="p-4 text-gray-500">{p.variants.length}</td>
                    <td className="p-4">
                      <span className={totalStock === 0 ? "text-red-600" : "text-gray-700"}>{totalStock}</span>
                    </td>
                    <td className="p-4 text-gray-700">
                      {p.salePercent > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-1">{formatPrice(minPrice)}</span>
                          {formatPrice(salePrice(minPrice, p.salePercent, p.saleType))}
                          <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">{saleLabel(p.salePercent, p.saleType)}</span>
                        </>
                      ) : formatPrice(minPrice)}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isActive ? "Active" : "Hidden"}
                      </span>
                      {p.isFeatured && (
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#A8975E]/10 text-[#A8975E]">Featured</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(p)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">{editId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
                  >
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
                    Featured
                  </label>
                </div>
              </div>

              {/* Sale */}
              <div className="border border-gray-100 rounded p-3 space-y-1">
                <label className="text-xs text-gray-500 block">Sale discount — leave empty for no sale</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex rounded border border-gray-200 overflow-hidden text-sm">
                    {(["PERCENT", "FIXED"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, saleType: t }))}
                        className={`px-3 py-2 ${form.saleType === t ? "bg-[#A8975E] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                      >
                        {t === "PERCENT" ? "% Percent" : "EGP Amount"}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={form.saleType === "PERCENT" ? 100 : undefined}
                    value={form.salePercent}
                    onChange={(e) => setForm((f) => ({ ...f, salePercent: e.target.value }))}
                    placeholder={form.saleType === "PERCENT" ? "e.g. 20" : "e.g. 50"}
                    className="w-32 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E]"
                  />
                  {parseFloat(form.salePercent) > 0 && form.variants[0]?.price && (
                    <span className="text-xs text-emerald-600">
                      {formatPrice(parseFloat(form.variants[0].price))} → {formatPrice(salePrice(parseFloat(form.variants[0].price), parseFloat(form.salePercent), form.saleType))}
                    </span>
                  )}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && uploadImages(e.target.files)}
                  className="text-sm text-gray-500"
                />
                {uploading && <p className="text-xs text-[#A8975E] mt-1">Uploading...</p>}
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <Image src={img} alt="" fill className="object-cover rounded" />
                        <button
                          onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">Variants (Price / Cost Price / Stock)</label>
                  <button
                    onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }))}
                    className="text-xs text-[#A8975E] hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="space-y-3">
                  {form.variants.map((v, i) => (
                    <div key={i} className="border border-gray-100 rounded p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400">Variant Name</label>
                          <input
                            value={v.name}
                            onChange={(e) => setForm((f) => { const vs = [...f.variants]; vs[i] = { ...vs[i], name: e.target.value }; return { ...f, variants: vs }; })}
                            placeholder="e.g. Small / Gold"
                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">SKU (optional)</label>
                          <input
                            value={v.sku}
                            onChange={(e) => setForm((f) => { const vs = [...f.variants]; vs[i] = { ...vs[i], sku: e.target.value }; return { ...f, variants: vs }; })}
                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400">Selling Price (EGP) *</label>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => setForm((f) => { const vs = [...f.variants]; vs[i] = { ...vs[i], price: e.target.value }; return { ...f, variants: vs }; })}
                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#A8975E]">Cost Price (EGP) *</label>
                          <input
                            type="number"
                            value={v.costPrice}
                            onChange={(e) => setForm((f) => { const vs = [...f.variants]; vs[i] = { ...vs[i], costPrice: e.target.value }; return { ...f, variants: vs }; })}
                            className="w-full border border-[#A8975E]/30 rounded px-2 py-1.5 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">Stock</label>
                          <input
                            type="number"
                            value={v.inventory}
                            onChange={(e) => setForm((f) => { const vs = [...f.variants]; vs[i] = { ...vs[i], inventory: e.target.value }; return { ...f, variants: vs }; })}
                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      {v.price && v.costPrice && (
                        <p className="text-xs text-emerald-600">
                          Profit: {formatPrice(parseFloat(v.price) - parseFloat(v.costPrice))} / unit
                        </p>
                      )}
                      {form.variants.length > 1 && (
                        <button
                          onClick={() => setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove variant
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded hover:bg-[#8A7A4A] disabled:opacity-60"
              >
                {saving ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
