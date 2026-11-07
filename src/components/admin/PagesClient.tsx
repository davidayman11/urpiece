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

const PAGE_SLUGS = [
  { label: "Home Page", value: "home" },
  { label: "About Page", value: "about" },
  { label: "Contact Page", value: "contact" },
  { label: "Site Settings", value: "site" },
];

const SECTION_TYPES = [
  {
    type: "hero", label: "Hero Section", page: "home",
    fields: ["tagline", "heading", "subheading", "buttonText", "buttonUrl", "secondaryText", "secondaryUrl", "image"],
  },
  {
    type: "banner", label: "Banner", page: "home",
    fields: ["eyebrow", "heading", "body", "buttonText", "buttonUrl", "image"],
  },
  {
    type: "editorial", label: "Editorial / Split", page: "home",
    fields: ["eyebrow", "heading", "body", "buttonText", "buttonUrl", "image"],
  },
  {
    type: "featured", label: "Featured Products", page: "home",
    fields: ["heading", "subheading"],
  },
  {
    type: "about", label: "About Page Content", page: "about",
    fields: ["eyebrow", "heading", "body", "quote"],
  },
  {
    type: "contact", label: "Contact Page Content", page: "contact",
    fields: ["eyebrow", "heading", "supportEmail", "paymentNote", "shippingNote"],
  },
  {
    type: "settings", label: "Site Settings (Footer / Nav)", page: "site",
    fields: ["tagline", "brandDescription", "contactEmail", "paymentNote", "shippingNote", "copyright"],
  },
];

const FIELD_LABELS: Record<string, string> = {
  tagline: "Tagline",
  heading: "Heading",
  subheading: "Subheading",
  eyebrow: "Eyebrow Text (small label above heading)",
  body: "Body Text",
  quote: "Quote (italic pull quote)",
  buttonText: "Button Text",
  buttonUrl: "Button Link",
  secondaryText: "Secondary Link Text (e.g. Our Story)",
  secondaryUrl: "Secondary Link Destination",
  image: "Image",
  brandDescription: "Brand Description (footer tagline paragraph)",
  contactEmail: "Contact Email",
  supportEmail: "Support Email",
  paymentNote: "Payment Info",
  shippingNote: "Shipping Info",
  copyright: "Copyright Line",
};

const TEXTAREA_FIELDS = new Set(["body", "subheading", "brandDescription", "paymentNote", "shippingNote", "copyright", "quote"]);
const URL_FIELDS = new Set(["buttonUrl", "secondaryUrl"]);

const PAGE_SLUG_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  contact: "Contact",
  site: "Site Settings",
};

export default function PagesClient({ sections: initial }: { sections: SiteSection[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [pageSlug, setPageSlug] = useState("home");
  const [sectionType, setSectionType] = useState("hero");
  const [content, setContent] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

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

  const typesForPage = (slug: string) => SECTION_TYPES.filter((t) => t.page === slug);

  const openCreate = () => {
    setEditId(null);
    const defaultType = typesForPage(activeTab)[0]?.type || "hero";
    setPageSlug(activeTab);
    setSectionType(defaultType);
    setContent({});
    setIsVisible(true);
    setSortOrder(sections.filter((s) => s.pageSlug === activeTab).length * 10);
    setModal("create");
  };

  const openEdit = (s: SiteSection) => {
    setEditId(s.id);
    setPageSlug(s.pageSlug);
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
      : { pageSlug, type: sectionType, content, isVisible, sortOrder };
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

  const currentTypeDef = SECTION_TYPES.find((t) => t.type === sectionType);
  const tabSections = sections.filter((s) => s.pageSlug === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Pages & Content</h1>
          <p className="text-sm text-gray-500 mt-1">Edit every piece of text and image on the site</p>
        </div>
        <button onClick={openCreate} className="bg-[#A8975E] text-white px-4 py-2 text-sm rounded-md hover:bg-[#8A7A4A]">
          + Add Section
        </button>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {PAGE_SLUGS.map((p) => (
          <button
            key={p.value}
            onClick={() => setActiveTab(p.value)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === p.value
                ? "border-[#A8975E] text-[#A8975E] font-medium"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tabSections.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-lg border border-gray-50">
            <p>No sections yet for this page. Click <strong>+ Add Section</strong> to get started.</p>
          </div>
        )}
        {tabSections.map((s) => {
          const c = parseJson<Record<string, string>>(s.content, {});
          return (
            <div key={s.id} className={`bg-white rounded-lg border p-4 flex items-center gap-4 ${s.isVisible ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="w-2 h-10 rounded bg-[#A8975E]/30" />
              {c.image && (
                <div className="relative w-16 h-12 rounded overflow-hidden shrink-0">
                  <Image src={c.image} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-[#A8975E]/10 text-[#A8975E] px-2 py-0.5 rounded">{s.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 truncate font-medium">
                  {c.heading || c.tagline || c.eyebrow || `${s.type} section`}
                </p>
                {c.subheading || c.body ? (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.subheading || c.body}</p>
                ) : null}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => toggleVisibility(s)} className="text-xs text-gray-500 hover:text-gray-800">
                  {s.isVisible ? "Hide" : "Show"}
                </button>
                <button onClick={() => openEdit(s)} className="text-xs text-[#A8975E] hover:underline font-medium">Edit</button>
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
              <div>
                <h2 className="font-semibold">{editId ? "Edit Section" : "Add Section"}</h2>
                {editId && <p className="text-xs text-gray-400 mt-0.5">Page: {PAGE_SLUG_LABELS[pageSlug] || pageSlug}</p>}
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              {!editId && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Page</label>
                  <select
                    value={pageSlug}
                    onChange={(e) => {
                      setPageSlug(e.target.value);
                      const firstType = typesForPage(e.target.value)[0]?.type || "hero";
                      setSectionType(firstType);
                      setContent({});
                    }}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  >
                    {PAGE_SLUGS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Section Type</label>
                <select
                  value={sectionType}
                  onChange={(e) => { setSectionType(e.target.value); setContent({}); }}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                >
                  {typesForPage(pageSlug).map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
              </div>

              {currentTypeDef?.fields.map((field) => (
                <div key={field}>
                  <label className="text-xs text-gray-500 mb-1 block">{FIELD_LABELS[field] || field}</label>
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          {uploading ? "Uploading…" : "Upload photo"}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], field)} />
                        </label>
                        {content[field] && <span className="text-xs text-green-600">✓ Image set</span>}
                      </div>
                      {content[field] && (
                        <div className="relative h-24 rounded overflow-hidden border border-gray-100">
                          <Image src={content[field]} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  ) : URL_FIELDS.has(field) ? (
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
                  ) : TEXTAREA_FIELDS.has(field) ? (
                    <textarea
                      value={content[field] || ""}
                      onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                      rows={field === "body" ? 5 : 3}
                      placeholder={field === "body" ? "Use \\n\\n to separate paragraphs" : ""}
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
                  <input type="number" value={sortOrder}
                    onChange={(e) => setSortOrder(+e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
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
              <button onClick={save} disabled={saving}
                className="px-6 py-2 text-sm bg-[#A8975E] text-white rounded disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
