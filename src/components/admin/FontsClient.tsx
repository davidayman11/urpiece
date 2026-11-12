"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FONT_AREAS, FONT_CATALOG, FONT_CATEGORY_LABELS, fontStack,
  type FontCategory, type FontConfig,
} from "@/lib/fonts";

const DEFAULT_HEADING = "Cormorant Garamond";
const DEFAULT_BODY = "Jost";
const CATEGORIES: FontCategory[] = ["serif", "sans", "script", "arabic"];

function FontSelect({ value, onChange, blank, label }: { value: string; onChange: (v: string) => void; blank: string; label: string }) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500 block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A8975E]"
      >
        <option value="">{blank}</option>
        {CATEGORIES.map((c) => (
          <optgroup key={c} label={FONT_CATEGORY_LABELS[c]}>
            {FONT_CATALOG.filter((f) => f.category === c).map((f) => (
              <option key={f.name} value={f.name}>{f.name}{f.preloaded ? " (current default)" : ""}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export default function FontsClient({ initial }: { initial: FontConfig }) {
  const router = useRouter();
  const [areas, setAreas] = useState<FontConfig["areas"]>(initial.areas);
  const [saved, setSaved] = useState(JSON.stringify(initial.areas));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const dirty = JSON.stringify(areas) !== saved;
  const set = (key: string, part: "heading" | "body", v: string) =>
    setAreas((a) => {
      const cur = { ...(a[key] || {}) };
      if (v) cur[part] = v; else delete cur[part];
      const next = { ...a };
      if (cur.heading || cur.body) next[key] = cur; else delete next[key];
      return next;
    });

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/fonts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ areas }) });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setAreas(d.areas); setSaved(JSON.stringify(d.areas)); setDone(true);
      setTimeout(() => setDone(false), 2500);
      router.refresh();
    } else alert("Could not save");
  };

  const siteH = areas.site?.heading;
  const siteB = areas.site?.body;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Fonts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose the fonts for the whole website, or for each section on its own. <strong>Headings</strong> are the big titles;
          <strong> Text</strong> is everything else. Leave a box on its first option to keep the default (or the whole-website choice).
          To change one single word or sentence (font, <strong>bold</strong>, <u>underline</u>), use <strong>Site Text</strong>.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-[#F7F5F0]/95 backdrop-blur flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-500">{Object.keys(areas).length} section{Object.keys(areas).length === 1 ? "" : "s"} with their own font</span>
        <button onClick={() => setAreas({})} disabled={Object.keys(areas).length === 0} className="text-xs text-gray-500 hover:underline disabled:opacity-40">Reset everything to default</button>
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="ml-auto px-5 py-2 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-50"
        >
          {done ? "✓ Saved!" : saving ? "Saving…" : dirty ? "Save changes" : "Save"}
        </button>
      </div>

      {FONT_AREAS.map((area) => {
        const cur = areas[area.key] || {};
        const isSite = area.key === "site";
        const heading = cur.heading || (isSite ? "" : siteH) || DEFAULT_HEADING;
        const body = cur.body || (isSite ? "" : siteB) || DEFAULT_BODY;
        const changed = !!(cur.heading || cur.body);
        return (
          <section key={area.key} className={`bg-white rounded-lg border p-5 space-y-4 ${isSite ? "border-[#A8975E]/60" : "border-gray-100"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-gray-800">{area.label}</h2>
                {area.hint && <p className="text-xs text-gray-400 mt-0.5">{area.hint}</p>}
              </div>
              {changed && (
                <button onClick={() => setAreas((a) => { const n = { ...a }; delete n[area.key]; return n; })} className="text-xs text-[#A8975E] hover:underline shrink-0">
                  Reset
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <FontSelect label="Headings (titles)" value={cur.heading || ""} onChange={(v) => set(area.key, "heading", v)} blank={isSite ? `Default (${DEFAULT_HEADING})` : "Same as whole website"} />
              <FontSelect label="Text (everything else)" value={cur.body || ""} onChange={(v) => set(area.key, "body", v)} blank={isSite ? `Default (${DEFAULT_BODY})` : "Same as whole website"} />
            </div>
            <div className="rounded border border-gray-100 bg-[#F5EFE2] px-4 py-3">
              <p style={{ fontFamily: fontStack(heading) }} className="text-2xl text-[#1C1711] leading-tight">Your Glow, Your Piece</p>
              <p style={{ fontFamily: fontStack(body) }} className="text-sm text-[#5A5040] mt-1">
                Handmade jewelry for every day. Free delivery over 1000 EGP — مجوهرات مصنوعة بحب
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
