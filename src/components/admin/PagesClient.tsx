"use client";

import { useState, useCallback } from "react";
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
    fields: ["tagline", "taglineColor", "heading", "headingColor", "subheading", "buttonText", "buttonUrl", "secondaryText", "secondaryUrl", "image", "height"],
  },
  {
    type: "banner", label: "Banner", page: "home",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "body", "buttonText", "buttonUrl", "image"],
  },
  {
    type: "editorial", label: "Editorial / Split", page: "home",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "body", "buttonText", "buttonUrl", "image"],
  },
  {
    type: "categories", label: "Shop by Category Section", page: "home",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "linkText", "categoryIds"],
  },
  {
    type: "featured", label: "Featured Products Section", page: "home",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "linkText", "productMode", "productLimit", "productIds"],
  },
  {
    type: "bundles", label: "Bundles Section", page: "home",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "linkText", "bundleMode", "bundleLimit", "bundleIds"],
  },
  {
    type: "marquee", label: "Scrolling Strip (icon + moving text)", page: "home",
    fields: ["messages", "icon", "bgColor", "textColor", "iconColor", "speed", "direction", "position"],
  },
  {
    type: "about", label: "About Page Content", page: "about",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "body", "quote"],
  },
  {
    type: "contact", label: "Contact Page Content", page: "contact",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "supportEmail", "paymentNote", "shippingNote"],
  },
  {
    type: "announcement", label: "Announcement Bar (scrolling, top of site)", page: "site",
    fields: ["messages", "bgColor", "textColor", "speed", "barUrl"],
  },
  {
    type: "settings", label: "Site Settings (Footer / Nav)", page: "site",
    fields: ["tagline", "brandDescription", "contactEmail", "paymentNote", "shippingNote", "copyright"],
  },
  {
    type: "reviews", label: "Reviews photos (scrollable)", page: "*",
    fields: ["eyebrow", "eyebrowColor", "heading", "headingColor", "bgColor", "photos"],
  },
  {
    type: "custom", label: "Custom Section (fully customizable)", page: "*",
    fields: [],
  },
];

const CUSTOM_FIELD_OPTIONS: { key: string; label: string }[] = [
  { key: "eyebrow", label: "Eyebrow (small top label)" },
  { key: "heading", label: "Heading" },
  { key: "subheading", label: "Subheading" },
  { key: "body", label: "Body Text" },
  { key: "image", label: "Image / Photo" },
  { key: "button", label: "Button / CTA" },
  { key: "quote", label: "Quote (italic)" },
  { key: "bgColor", label: "Background Color" },
  { key: "textColor", label: "Text Color" },
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
  linkText: "Link Text (e.g. All Pieces / View All)",
  messages: "Messages (one per line — they scroll across)",
  icon: "Icon between messages",
  iconColor: "Icon Color",
  direction: "Scroll direction",
  position: "Where on the home page",
  bgColor: "Background Color",
  textColor: "Text Color",
  speed: "Scroll time in seconds for one loop (lower = faster, default 30)",
  barUrl: "Link when clicked (optional)",
  height: "Banner height",
  categoryIds: "Which categories to show",
  bundleMode: "Which bundles to show",
  bundleLimit: "How many bundles to show (default 4)",
  bundleIds: "Choose the bundles (in the order they appear)",
  productMode: "Which products to show",
  productLimit: "How many products to show (default 8)",
  productIds: "Choose the products (in the order they appear)",
  photos: "Review photos (customer screenshots / photos)",
  taglineColor: "Tagline Color",
  eyebrowColor: "Eyebrow Text Color",
  headingColor: "Heading Color",
};

const COLOR_FIELDS = new Set(["taglineColor", "eyebrowColor", "headingColor", "bgColor", "textColor", "iconColor"]);
const SELECT_FIELDS: Record<string, { value: string; label: string }[]> = {
  height: [
    { value: "medium", label: "Medium — next section peeks in (recommended)" },
    { value: "tall", label: "Tall" },
    { value: "compact", label: "Compact" },
    { value: "full", label: "Full screen" },
  ],
  bundleMode: [
    { value: "all", label: "All active bundles" },
    { value: "selected", label: "Only the bundles I choose" },
  ],
  productMode: [
    { value: "featured", label: "Only products marked Featured" },
    { value: "all", label: "All products (newest first)" },
    { value: "selected", label: "Only the products I choose" },
  ],
  icon: [
    { value: "heart", label: "Heart" }, { value: "truck", label: "Delivery truck" }, { value: "star", label: "Star" },
    { value: "sparkle", label: "Sparkle" }, { value: "gift", label: "Gift" }, { value: "shield", label: "Shield / guarantee" },
    { value: "diamond", label: "Diamond" }, { value: "none", label: "No icon" },
  ],
  direction: [{ value: "left", label: "Right to left (default)" }, { value: "right", label: "Left to right" }],
  position: [
    { value: "hero", label: "Under the hero image" }, { value: "categories", label: "Under Shop by Category" },
    { value: "featured", label: "Under Featured Products" }, { value: "bottom", label: "Bottom of the page" },
  ],
};
const COLOR_DEFAULTS: Record<string, string> = {
  taglineColor: "#A8975E",
  eyebrowColor: "#A8975E",
  headingColor: "#1C1711",
  bgColor: "#1C1711",
  textColor: "#F5EFE2",
  iconColor: "#C4B07A",
};
const COLOR_DEFAULTS_BY_TYPE: Record<string, Record<string, string>> = { reviews: { bgColor: "#F5EFE2" } };

const TEXTAREA_FIELDS = new Set(["messages", "body", "subheading", "brandDescription", "paymentNote", "shippingNote", "copyright", "quote"]);
const AR_FIELDS = new Set(["tagline", "heading", "subheading", "eyebrow", "body", "quote", "buttonText", "secondaryText", "brandDescription", "paymentNote", "shippingNote", "copyright", "linkText", "messages"]);
const URL_FIELDS = new Set(["buttonUrl", "secondaryUrl", "barUrl"]);

const PAGE_SLUG_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  contact: "Contact",
  site: "Site Settings",
};

const parseIds = (raw?: string): string[] => {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
};

interface ReviewPhotoDraft { url: string; caption: string; caption_ar: string }
const parsePhotos = (raw?: string): ReviewPhotoDraft[] => {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v)
      ? v.filter((x) => x && typeof x.url === "string").map((x) => ({ url: x.url, caption: x.caption || "", caption_ar: x.caption_ar || "" }))
      : [];
  } catch { return []; }
};

interface PickItem { id: string; name: string; note?: string }

/** Checklist with search. `ordered` keeps the order items were picked in and lets you move them. */
function PickerList({
  items, selected, onChange, ordered, emptyNote,
}: { items: PickItem[]; selected: string[]; onChange: (ids: string[]) => void; ordered?: boolean; emptyNote?: string }) {
  const [q, setQ] = useState("");
  const byId = new Map(items.map((i) => [i.id, i]));
  const chosen = selected.filter((id) => byId.has(id));
  const shown = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => onChange(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);
  const move = (i: number, d: -1 | 1) => {
    const n = [...chosen];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };

  return (
    <div className="border border-gray-200 rounded p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500">{chosen.length} selected</span>
        <button type="button" onClick={() => onChange(items.map((i) => i.id))} className="text-[#A8975E] hover:underline">Select all</button>
        <button type="button" onClick={() => onChange([])} className="text-gray-500 hover:underline">Clear</button>
        {emptyNote && chosen.length === 0 && <span className="text-gray-400">{emptyNote}</span>}
      </div>

      {ordered && chosen.length > 0 && (
        <ol className="space-y-1">
          {chosen.map((id, i) => (
            <li key={id} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
              <span className="w-5 text-xs text-gray-400">{i + 1}</span>
              <span className="flex-1 truncate">{byId.get(id)?.name}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] px-1 text-gray-500 disabled:opacity-25" aria-label="Move up">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === chosen.length - 1} className="text-[10px] px-1 text-gray-500 disabled:opacity-25" aria-label="Move down">▼</button>
              <button type="button" onClick={() => toggle(id)} className="text-xs text-red-500" aria-label="Remove">×</button>
            </li>
          ))}
        </ol>
      )}

      {items.length > 8 && (
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm" />
      )}
      <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
        {shown.length === 0 && <p className="text-xs text-gray-400 py-2">Nothing found</p>}
        {shown.map((i) => (
          <label key={i.id} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={chosen.includes(i.id)} onChange={() => toggle(i.id)} />
            <span className="flex-1 truncate">{i.name}</span>
            {i.note && <span className="text-[10px] text-gray-400">{i.note}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

type Opt = { id: string; name: string; isActive: boolean; isFeatured?: boolean };

export default function PagesClient({
  sections: initial, categories = [], products = [], bundleOpts = [],
}: { sections: SiteSection[]; categories?: Opt[]; products?: Opt[]; bundleOpts?: { id: string; name: string; isActive: boolean }[] }) {
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
  const [customFields, setCustomFields] = useState<string[]>([]);

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

  const typesForPage = (slug: string) => [
    ...SECTION_TYPES.filter((t) => t.page === slug && t.type !== "custom" && t.type !== "reviews"),
    ...(["home", "about", "contact"].includes(slug) ? [SECTION_TYPES.find((t) => t.type === "reviews")!] : []),
    SECTION_TYPES.find((t) => t.type === "custom")!,
  ];

  const photos = parsePhotos(content.photos);
  const setPhotos = (next: ReviewPhotoDraft[]) => setContent((c) => ({ ...c, photos: JSON.stringify(next) }));
  const uploadPhotos = async (files: FileList) => {
    setUploading(true);
    const added: ReviewPhotoDraft[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "sections");
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) added.push({ url: data.url, caption: "", caption_ar: "" });
      } catch { /* skip failed file */ }
    }
    setContent((c) => ({ ...c, photos: JSON.stringify([...parsePhotos(c.photos), ...added]) }));
    setUploading(false);
  };

  const addCustomField = useCallback((key: string) => {
    setCustomFields((prev) => {
      const next = [...prev, key];
      setContent((c) => ({ ...c, _fields: JSON.stringify(next) }));
      return next;
    });
  }, []);

  const removeCustomField = useCallback((key: string) => {
    setCustomFields((prev) => {
      const next = prev.filter((f) => f !== key);
      setContent((c) => ({ ...c, _fields: JSON.stringify(next) }));
      return next;
    });
  }, []);

  const openCreate = () => {
    setEditId(null);
    const defaultType = typesForPage(activeTab)[0]?.type || "hero";
    setPageSlug(activeTab);
    setSectionType(defaultType);
    setContent({});
    setCustomFields([]);
    setIsVisible(true);
    setSortOrder(sections.filter((s) => s.pageSlug === activeTab).length * 10);
    setModal("create");
  };

  const openEdit = (s: SiteSection) => {
    setEditId(s.id);
    setPageSlug(s.pageSlug);
    setSectionType(s.type);
    const c = parseJson<Record<string, string>>(s.content, {});
    setContent(c);
    if (s.type === "custom") {
      try {
        const f = JSON.parse(c._fields || "[]");
        setCustomFields(Array.isArray(f) ? f : []);
      } catch { setCustomFields([]); }
    } else {
      setCustomFields([]);
    }
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
                  {c._label || c.heading || c.tagline || c.eyebrow || `${s.type} section`}
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
                  onChange={(e) => { setSectionType(e.target.value); setContent({}); setCustomFields([]); }}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                >
                  {typesForPage(pageSlug).map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
              </div>

              {sectionType === "custom" && (
                <div className="space-y-4">
                  {/* Admin label */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Section Name (shown in admin list)</label>
                    <input
                      value={content._label || ""}
                      onChange={(e) => setContent((c) => ({ ...c, _label: e.target.value }))}
                      placeholder="e.g. Our Story, Why Us, Brand Promise…"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  {/* Layout */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Layout</label>
                    <select
                      value={content._layout || "centered"}
                      onChange={(e) => setContent((c) => ({ ...c, _layout: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    >
                      <option value="centered">Centered — text in the middle</option>
                      <option value="image-right">Split — image right, text left</option>
                      <option value="image-left">Split — image left, text right</option>
                      <option value="full-image">Full-width image with text overlay</option>
                    </select>
                  </div>
                  {/* Added fields */}
                  {customFields.map((fieldKey) => (
                    <div key={fieldKey} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {CUSTOM_FIELD_OPTIONS.find((f) => f.key === fieldKey)?.label || fieldKey}
                        </span>
                        <button type="button" onClick={() => removeCustomField(fieldKey)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      </div>
                      {fieldKey === "button" ? (
                        <div className="space-y-2">
                          <input value={content.buttonText || ""} onChange={(e) => setContent((c) => ({ ...c, buttonText: e.target.value }))} placeholder="Button text (e.g. Shop Now)" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                          <input dir="rtl" value={content.buttonText_ar || ""} onChange={(e) => setContent((c) => ({ ...c, buttonText_ar: e.target.value }))} placeholder="نص الزر بالعربية (optional)" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                          <select value={content.buttonUrl || ""} onChange={(e) => setContent((c) => ({ ...c, buttonUrl: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                            <option value="">— Select a destination page —</option>
                            {PAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      ) : fieldKey === "image" ? (
                        <div className="space-y-2">
                          <input type="text" value={content.image || ""} onChange={(e) => setContent((c) => ({ ...c, image: e.target.value }))} placeholder="Paste image URL…" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            {uploading ? "Uploading…" : "Upload photo"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "image")} />
                          </label>
                          {content.image && <div className="relative h-24 rounded overflow-hidden border border-gray-100"><Image src={content.image} alt="" fill className="object-cover" /></div>}
                        </div>
                      ) : fieldKey === "bgColor" || fieldKey === "textColor" ? (
                        <div className="flex items-center gap-2">
                          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(content[fieldKey] || "") ? content[fieldKey] : (fieldKey === "bgColor" ? "#1C1711" : "#F5EFE2")} onChange={(e) => setContent((c) => ({ ...c, [fieldKey]: e.target.value }))} className="w-10 h-9 border border-gray-200 rounded cursor-pointer bg-white p-0.5" />
                          <input value={content[fieldKey] || ""} onChange={(e) => setContent((c) => ({ ...c, [fieldKey]: e.target.value }))} placeholder="#hex" className="w-32 border border-gray-200 rounded px-3 py-2 text-sm" />
                          {content[fieldKey] && <button type="button" onClick={() => setContent((c) => { const n = { ...c }; delete n[fieldKey]; return n; })} className="text-xs text-gray-400 hover:underline">Reset</button>}
                        </div>
                      ) : TEXTAREA_FIELDS.has(fieldKey) ? (
                        <div className="space-y-2">
                          <textarea value={content[fieldKey] || ""} onChange={(e) => setContent((c) => ({ ...c, [fieldKey]: e.target.value }))} rows={4} placeholder={fieldKey === "body" ? "Use \\n\\n to separate paragraphs" : ""} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                          {AR_FIELDS.has(fieldKey) && <textarea dir="rtl" value={content[fieldKey + "_ar"] || ""} onChange={(e) => setContent((c) => ({ ...c, [fieldKey + "_ar"]: e.target.value }))} rows={3} placeholder="بالعربية (optional)" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input value={content[fieldKey] || ""} onChange={(e) => setContent((c) => ({ ...c, [fieldKey]: e.target.value }))} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                          {AR_FIELDS.has(fieldKey) && <input dir="rtl" value={content[fieldKey + "_ar"] || ""} onChange={(e) => setContent((c) => ({ ...c, [fieldKey + "_ar"]: e.target.value }))} placeholder="بالعربية (optional)" className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Add field buttons */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Add a field to this section</label>
                    <div className="flex flex-wrap gap-2">
                      {CUSTOM_FIELD_OPTIONS.filter((f) => !customFields.includes(f.key)).map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => addCustomField(f.key)}
                          className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-full hover:border-[#A8975E] hover:text-[#A8975E] transition-colors"
                        >
                          + {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sectionType !== "custom" && currentTypeDef?.fields.map((field) => {
                if (field === "bundleIds" && (content.bundleMode || "all") !== "selected") return null;
                if (field === "bundleLimit" && (content.bundleMode || "all") === "selected") return null;
                if (field === "productIds" && (content.productMode || "featured") !== "selected") return null;
                if (field === "productLimit" && (content.productMode || "featured") === "selected") return null;
                return (
                <div key={field}>
                  <label className="text-xs text-gray-500 mb-1 block">{FIELD_LABELS[field] || field}</label>
                  {field === "photos" ? (
                    <div className="space-y-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {uploading ? "Uploading…" : "Upload photos (you can pick several)"}
                        <input type="file" accept="image/*" multiple className="hidden"
                          onChange={(e) => { if (e.target.files?.length) uploadPhotos(e.target.files); e.target.value = ""; }} />
                      </label>
                      {photos.length === 0 && <p className="text-xs text-gray-400">No photos yet</p>}
                      {photos.map((p, i) => (
                        <div key={p.url + i} className="flex gap-3 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                          <div className="relative w-16 h-20 rounded overflow-hidden shrink-0">
                            <Image src={p.url} alt="" fill unoptimized className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <input value={p.caption} placeholder="Caption, e.g. customer name (optional)"
                              onChange={(e) => setPhotos(photos.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" />
                            <input dir="rtl" value={p.caption_ar} placeholder="الاسم بالعربية (optional)"
                              onChange={(e) => setPhotos(photos.map((x, j) => (j === i ? { ...x, caption_ar: e.target.value } : x)))}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" />
                          </div>
                          <div className="flex flex-col items-center justify-between shrink-0">
                            <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="text-xs text-red-500" aria-label="Remove">×</button>
                            <div className="flex gap-1">
                              <button type="button" disabled={i === 0} aria-label="Move left" className="text-xs px-1 text-gray-500 disabled:opacity-25"
                                onClick={() => { const n = [...photos]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setPhotos(n); }}>◀</button>
                              <button type="button" disabled={i === photos.length - 1} aria-label="Move right" className="text-xs px-1 text-gray-500 disabled:opacity-25"
                                onClick={() => { const n = [...photos]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setPhotos(n); }}>▶</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : field === "categoryIds" ? (
                    <PickerList
                      items={categories.map((c) => ({ id: c.id, name: c.name, note: c.isActive ? undefined : "hidden" }))}
                      selected={parseIds(content.categoryIds)}
                      onChange={(ids) => setContent((c) => ({ ...c, categoryIds: JSON.stringify(ids) }))}
                      emptyNote="Nothing ticked = show all categories"
                    />
                  ) : field === "bundleIds" ? (
                    <PickerList
                      ordered
                      items={bundleOpts.map((b) => ({ id: b.id, name: b.name, note: b.isActive ? undefined : "hidden" }))}
                      selected={parseIds(content.bundleIds)}
                      onChange={(ids) => setContent((c) => ({ ...c, bundleIds: JSON.stringify(ids) }))}
                    />
                  ) : field === "bundleLimit" ? (
                    <input
                      type="number" min="1" max="12" placeholder="4"
                      value={content.bundleLimit || ""}
                      onChange={(e) => setContent((c) => ({ ...c, bundleLimit: e.target.value }))}
                      className="w-28 border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  ) : field === "productIds" ? (
                    <PickerList
                      ordered
                      items={products.map((p) => ({ id: p.id, name: p.name, note: p.isActive ? (p.isFeatured ? "featured" : undefined) : "hidden" }))}
                      selected={parseIds(content.productIds)}
                      onChange={(ids) => setContent((c) => ({ ...c, productIds: JSON.stringify(ids) }))}
                    />
                  ) : field === "productLimit" ? (
                    <input
                      type="number" min="1" max="48" placeholder="8"
                      value={content.productLimit || ""}
                      onChange={(e) => setContent((c) => ({ ...c, productLimit: e.target.value }))}
                      className="w-28 border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  ) : field === "image" ? (
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
                  ) : COLOR_FIELDS.has(field) ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(content[field] || "") ? content[field] : COLOR_DEFAULTS_BY_TYPE[sectionType]?.[field] ?? COLOR_DEFAULTS[field]}
                        onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                        className="w-10 h-9 border border-gray-200 rounded cursor-pointer bg-white p-0.5"
                      />
                      <input
                        value={content[field] || ""}
                        onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                        placeholder="Default (e.g. #A8975E)"
                        className="w-40 border border-gray-200 rounded px-3 py-2 text-sm"
                      />
                      {content[field] && (
                        <button
                          type="button"
                          onClick={() => setContent((c) => { const n = { ...c }; delete n[field]; return n; })}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Reset to default
                        </button>
                      )}
                    </div>
                  ) : SELECT_FIELDS[field] ? (
                    <select
                      value={content[field] || SELECT_FIELDS[field][0].value}
                      onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    >
                      {SELECT_FIELDS[field].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
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
                      rows={field === "body" ? 5 : field === "messages" ? 4 : 3}
                      placeholder={field === "body" ? "Use \\n\\n to separate paragraphs" : field === "messages" ? "Free shipping over 1000 EGP\nNew arrivals every week" : ""}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      value={content[field] || ""}
                      onChange={(e) => setContent((c) => ({ ...c, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  )}
                  {AR_FIELDS.has(field) && (
                    <div className="mt-2">
                      <label className="text-xs text-gray-500 mb-1 block">{FIELD_LABELS[field] || field} — Arabic</label>
                      {TEXTAREA_FIELDS.has(field) ? (
                        <textarea
                          dir="rtl"
                          value={content[field + "_ar"] || ""}
                          onChange={(e) => setContent((c) => ({ ...c, [field + "_ar"]: e.target.value }))}
                          rows={field === "body" ? 5 : field === "messages" ? 4 : 3}
                          placeholder="بالعربية (optional — English is shown if empty)"
                          className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <input
                          dir="rtl"
                          value={content[field + "_ar"] || ""}
                          onChange={(e) => setContent((c) => ({ ...c, [field + "_ar"]: e.target.value }))}
                          placeholder="بالعربية (optional — English is shown if empty)"
                          className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
                );
              })}

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
