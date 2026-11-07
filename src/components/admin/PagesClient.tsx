"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseJson } from "@/lib/utils";
import type { SiteSection } from "@prisma/client";

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

const SECTION_TYPES = [
  { type: "hero", label: "Hero Section", fields: ["heading", "subheading", "buttonText", "buttonUrl", "image"] },
  { type: "banner", label: "Banner", fields: ["eyebrow", "heading", "body", "buttonText", "buttonUrl", "image"] },
  { type: "featured", label: "Featured Products", fields: ["heading", "subheading"] },
];

export default function PagesClient({ sections: initial }: { sections: SiteSection[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [sectionType, setSectionType] = useState("hero");
  const [content, setContent] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, field: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "sections");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setContent((c) => ({ ...c, [field]: data.url }));
    setUploading(false);
  };

  const openCreate = () => {
    setEditId(null);
    setSectionType("hero");
    setContent({});
    setIsVisible(true);
    setSortOrder(sections.length * 10);
    setModal("create");
  };

  const openEdit = (s: SiteSection) => {
    setEditId(s.id);
    setSectionType(s.type);
    setContent(parseJson<Record<string, string>>(s.content, {}));
    setIsVisible(s.isVisible);
    setSortOrder(s.sortOrder);
    setModal("edit");
  };

  const save = async () => {
    setSaving(true);
    const url = editId ? `/api/admin/sections/${editId}` : "/api/admin/sections";
    const method = editId ? "PUT" : "POST";
    const body = editId
      ? { type: sectionType, content, isVisible, sortOrder }
      : { pageSlug: "home", type: sectionType, content, isVisible, sortOrder };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setModal(null); router.refresh(); }
    else alert("Save failed");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const toggleVisibility = async (s: SiteSection) => {
    await fetch(`/api/admin/sections/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: s.type, content: parseJson(s.content, {}), isVisible: !s.isVisible, sortOrder: s.sortOrder }),
    });
    router.refresh();
  };

  const currentType = SECTION_TYPES.find((t) => t.type === sectionType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Pages & Sections</h1>
          <p className="text-sm text-gray-500 mt-1">Homepage sections — drag to reorder (future)</p>
        </div>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">
          + Add Section
        </button>
      </div>

      <div className="space-y-3">
        {sections.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-lg border border-gray-50">
            <p>No sections yet. Add a hero section to get started.</p>
          </div>
        )}
        {sections.map((s) => {
          const c = parseJson<Record<string, string>>(s.content, {});
          return (
            <div key={s.id} className={`bg-white rounded-lg border p-4 flex items-center gap-4 ${s.isVisible ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="w-2 h-10 rounded bg-[#A8975E]/30" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#A8975E]/10 text-[#A8975E] px-2 py-0.5 rounded">{s.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isVisible ? "Visible" : "Hidden"}
                  </span>
                  <span className="text-xs text-gray-400">Order: {s.sortOrder}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1 truncate">{c.heading || c.eyebrow || `${s.type} section`}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => toggleVisibility(s)} className="text-xs text-gray-500 hover:text-gray-800">
                  {s.isVisible ? "Hide" : "Show"}
                </button>
                <button onClick={() => openEdit(s)} className="text-xs text-[#A8975E] hover:underline">Edit</button>
                <button onClick={() => del(s.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">{editId ? "Edit Section" : "Add Section"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Section Type</label>
                <select
                  value={sectionType}
                  onChange={(e) => { setSectionType(e.target.value); setContent({}); }}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                >
                  {SECTION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
              </div>

              {currentType?.fields.map((field) => (
                <div key={field}>
                  <label className="text-xs text-gray-500 mb-1 block capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                  {field === "image" ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={content[field] || ""}
                        onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                        placeholder="Paste image URL…"
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {uploading ? "Uploading…" : "Upload photo"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], field)} />
                        </label>
                        {content[field] && <span className="text-xs text-green-600">✓ Image set</span>}
                      </div>
                      {content[field] && (
                        <div className="relative h-24 rounded overflow-hidden border border-gray-100">
                          <Image src={content[field]} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  ) : field === "buttonUrl" ? (
                    <select
                      value={content[field] || ""}
                      onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    >
                      <option value="">— Select a page —</option>
                      {PAGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field === "body" || field === "subheading" ? (
                    <textarea
                      value={content[field] || ""}
                      onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      value={content[field] || ""}
                      onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
                  <input type="number" value={sortOrder} onChange={(e) => setSortOrder(+e.target.value)} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
                    Visible
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
