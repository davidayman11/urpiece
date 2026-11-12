"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSections, type TextDef, type TextSection } from "@/lib/texts/types";
import { FONT_CATALOG, FONT_CATEGORY_LABELS, TEXT_SIZES, textStyleToCss, type FontCategory, type TextSize, type TextStyle, type TextStyles } from "@/lib/fonts";
import { hasRich, toggleMarker, type RichKind } from "@/lib/rich";
import RichText from "@/components/RichText";

const placeholdersOf = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[0]))];

/** Add / remove / reorder your own text boxes (stored as JSON in one text value). */
function SectionsEditor({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  // keep blanks while typing: parse leniently without dropping half-typed boxes
  let list: TextSection[] = [];
  try { const p = JSON.parse(value || "[]"); list = Array.isArray(p) ? p.map((x) => ({ title: String(x?.title ?? ""), body: String(x?.body ?? "") })) : []; } catch { list = []; }
  const set = (next: TextSection[]) => onChange(JSON.stringify(next));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    set(n);
  };
  return (
    <div className="space-y-3">
      {list.length === 0 && <p className="text-xs text-gray-400">No extra boxes yet.</p>}
      {list.map((sec, i) => (
        <div key={i} className="border border-[#A8975E]/40 bg-[#A8975E]/[0.04] rounded p-3 flex gap-3">
          <div className="flex flex-col shrink-0">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="text-[10px] px-1.5 py-1 text-gray-500 hover:text-[#A8975E] disabled:opacity-25">▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down" className="text-[10px] px-1.5 py-1 text-gray-500 hover:text-[#A8975E] disabled:opacity-25">▼</button>
          </div>
          <div className="flex-1 space-y-2">
            <input
              value={sec.title}
              onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              placeholder="Box heading (e.g. Warranty)"
              maxLength={80}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A8975E]"
            />
            <textarea
              value={sec.body}
              onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
              placeholder="What the box says…"
              rows={3}
              maxLength={3000}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A8975E]"
            />
            <button type="button" onClick={() => set(list.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Remove this box</button>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-gray-400">
        Tip: put <code className="bg-gray-100 px-1 rounded">**</code> around words for <strong>bold</strong>, <code className="bg-gray-100 px-1 rounded">__</code> for <u>underline</u>, <code className="bg-gray-100 px-1 rounded">&apos;&apos;</code> for <em>italic</em>, <code className="bg-gray-100 px-1 rounded">~~</code> for <s>strikethrough</s>. Example: <code className="bg-gray-100 px-1 rounded">Valid for **1 year**</code>
      </p>
      {list.length < 12 && (
        <button type="button" onClick={() => set([...list, { title: "", body: "" }])} className="text-sm text-[#A8975E] hover:underline">
          + Add a box
        </button>
      )}
    </div>
  );
}

const STYLE_CATEGORIES: FontCategory[] = ["serif", "sans", "script", "arabic"];

const BTN_LOOK: Record<string, string> = { bold: "font-bold", italic: "italic", underline: "underline", strike: "line-through" };
const BTN_LABEL: Record<string, string> = { bold: "B", italic: "I", underline: "U", strike: "S" };
const BTN_TITLE: Record<string, string> = { bold: "Bold", italic: "Italic", underline: "Underline", strike: "Strikethrough" };

function StyleButton({ kind, on, onClick }: { kind: RichKind; on?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={BTN_TITLE[kind]}
      aria-pressed={on}
      // keep the words selected in the text box while clicking
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`w-7 h-7 rounded border text-sm ${BTN_LOOK[kind]} ${on ? "bg-[#A8975E] text-white border-[#A8975E]" : "bg-white text-gray-600 border-gray-200 hover:border-[#A8975E]"}`}
    >
      {BTN_LABEL[kind]}
    </button>
  );
}

export default function TextsClient({
  defs, overrides, styles: initialStyles, noStyle, lang = "en",
}: { defs: TextDef[]; overrides: Record<string, string>; styles: TextStyles; noStyle: string[]; lang?: "en" | "ar" }) {
  const noStyleSet = new Set(noStyle);
  const [styles, setStyles] = useState<TextStyles>(initialStyles);
  const [savedStyles, setSavedStyles] = useState(JSON.stringify(initialStyles));
  const setStyle = (key: string, patch: Partial<TextStyle>) =>
    setStyles((st) => {
      const next: TextStyle = { ...(st[key] || {}), ...patch };
      if (!next.font) delete next.font;
      if (!next.bold) delete next.bold;
      if (!next.italic) delete next.italic;
      if (!next.underline) delete next.underline;
      if (!next.strike) delete next.strike;
      if (!next.size) delete next.size;
      if (!next.color) delete next.color;
      const all = { ...st };
      if (Object.keys(next).length) all[key] = next; else delete all[key];
      return all;
    });
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(defs.map((d) => [d.key, overrides[d.key] ?? d.default]))
  );
  const [saved, setSaved] = useState<Record<string, string>>(values); // what is stored right now
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const formatSelection = (key: string, kind: RichKind) => {
    const el = fieldRefs.current[key];
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) { alert("First select some words in the box (drag over them), then click the button."); return; }
    const r = toggleMarker(el.value, start, end, kind);
    setValues((st) => ({ ...st, [key]: r.value }));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(r.start, r.end); });
  };
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, TextDef[]>();
    for (const d of defs) map.set(d.group, [...(map.get(d.group) || []), d]);
    return [...map.entries()];
  }, [defs]);

  const needle = q.trim().toLowerCase();
  const matches = (d: TextDef) =>
    !needle || d.label.toLowerCase().includes(needle) || d.default.toLowerCase().includes(needle) || (values[d.key] || "").toLowerCase().includes(needle);

  const stylesDirty = JSON.stringify(styles) !== savedStyles;
  const dirtyKeys = [...defs.filter((d) => values[d.key] !== saved[d.key]).map((d) => d.key), ...(stylesDirty ? ["__styles"] : [])];
  const changedCount = defs.filter((d) => values[d.key] !== d.default || styles[d.key]).length;

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/texts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, values, styles }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(values);
      setSavedStyles(JSON.stringify(styles));
      setDone(true);
      setTimeout(() => setDone(false), 2500);
      router.refresh();
    } else alert("Could not save");
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Site Text</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every word customers see on the store — menus, buttons, labels, messages — can be changed here.
          Texts like <code className="bg-gray-100 px-1 rounded">{"{count}"}</code> are filled in automatically, so keep them where the number or name should appear.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-[#F7F5F0]/95 backdrop-blur flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search texts…"
          className="flex-1 min-w-[12rem] border border-gray-200 rounded-md px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#A8975E]"
        />
        <span className="text-xs text-gray-500">{changedCount} changed from default</span>
        <button
          onClick={save}
          disabled={saving || dirtyKeys.length === 0}
          className="px-5 py-2 bg-[#A8975E] text-white rounded text-sm hover:bg-[#8A7A4A] disabled:opacity-50"
        >
          {done ? "✓ Saved!" : saving ? "Saving…" : dirtyKeys.length ? `Save ${dirtyKeys.length} change${dirtyKeys.length === 1 ? "" : "s"}` : "Save"}
        </button>
      </div>

      {groups.length === 0 && <p className="text-sm text-gray-400">No texts registered yet.</p>}

      {groups.map(([group, list]) => {
        const shown = list.filter(matches);
        if (shown.length === 0) return null;
        const edited = shown.filter((d) => values[d.key] !== d.default).length;
        return (
          <details key={group} open={!!needle || undefined} className="bg-white rounded-lg border border-gray-100 group/section">
            <summary className="cursor-pointer select-none flex items-center justify-between px-5 py-3 font-medium text-gray-700">
              <span>{group} <span className="text-xs text-gray-400 font-normal">· {shown.length} texts</span></span>
              {edited > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#A8975E]/15 text-[#8A7A4A]">{edited} edited</span>}
            </summary>
            <div className="px-5 pb-4 divide-y divide-gray-50">
              {shown.map((d) => {
                const v = values[d.key] ?? d.default;
                const changed = v !== d.default;
                if (d.kind === "sections") {
                  const count = parseSections(v).length;
                  return (
                    <div key={d.key} className="py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-xs text-gray-500">{d.label}</label>
                        <span className="text-[11px] text-gray-400">{count} box{count === 1 ? "" : "es"}</span>
                      </div>
                      <SectionsEditor value={v} onChange={(json) => setValues((st) => ({ ...st, [d.key]: json }))} />
                    </div>
                  );
                }
                const missing = placeholdersOf(d.default).filter((p) => !v.includes(p));
                const Field = d.multiline || d.default.length > 70 ? "textarea" : "input";
                return (
                  <div key={d.key} className="py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-xs text-gray-500">{d.label}</label>
                      {changed && (
                        <button
                          onClick={() => setValues((s) => ({ ...s, [d.key]: d.default }))}
                          className="text-[11px] text-[#A8975E] hover:underline shrink-0"
                        >
                          Reset to default
                        </button>
                      )}
                    </div>
                    <Field
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      ref={(el: HTMLInputElement & HTMLTextAreaElement | null) => { fieldRefs.current[d.key] = el; }}
                      value={v}
                      onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setValues((s) => ({ ...s, [d.key]: e.target.value }))}
                      {...(Field === "textarea" ? { rows: Math.min(6, Math.max(2, Math.ceil(v.length / 70))) } : {})}
                      className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-[#A8975E] ${changed ? "border-[#A8975E]/60 bg-[#A8975E]/5" : "border-gray-200"}`}
                    />
                    {!noStyleSet.has(d.key) ? (
                      <div className="mt-2 space-y-2 rounded border border-gray-100 bg-gray-50 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-gray-500 w-24 shrink-0">Selected words</span>
                          {(["bold", "italic", "underline", "strike"] as RichKind[]).map((k) => (
                            <StyleButton key={k} kind={k} onClick={() => formatSelection(d.key, k)} />
                          ))}
                          <span className="text-[10px] text-gray-400">Select words above, then click</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-gray-500 w-24 shrink-0">Whole text</span>
                          {lang === "en" && (
                          <select
                            value={styles[d.key]?.font || ""}
                            onChange={(e) => setStyle(d.key, { font: e.target.value || undefined })}
                            aria-label="Font for this text"
                            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white max-w-[10rem]"
                          >
                            <option value="">Default font</option>
                            {STYLE_CATEGORIES.map((c) => (
                              <optgroup key={c} label={FONT_CATEGORY_LABELS[c]}>
                                {FONT_CATALOG.filter((f) => f.category === c).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                              </optgroup>
                            ))}
                          </select>
                          )}
                          <select
                            value={styles[d.key]?.size || ""}
                            onChange={(e) => setStyle(d.key, { size: (e.target.value || undefined) as TextSize | undefined })}
                            aria-label="Size of this text"
                            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
                          >
                            <option value="">Normal size</option>
                            {TEXT_SIZES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-[11px] text-gray-500" title="Text colour">
                            <input
                              type="color"
                              value={styles[d.key]?.color || "#1c1711"}
                              onChange={(e) => setStyle(d.key, { color: e.target.value })}
                              className="w-7 h-7 rounded border border-gray-200 cursor-pointer bg-white p-0.5"
                              aria-label="Text colour"
                            />
                            {styles[d.key]?.color && (
                              <button type="button" onClick={() => setStyle(d.key, { color: undefined })} className="text-[10px] hover:underline">default colour</button>
                            )}
                          </label>
                          {(["bold", "italic", "underline", "strike"] as RichKind[]).map((k) => (
                            <StyleButton key={k} kind={k} on={!!styles[d.key]?.[k]} onClick={() => setStyle(d.key, { [k]: !styles[d.key]?.[k] })} />
                          ))}
                          {styles[d.key] && (
                            <button type="button" onClick={() => setStyles((st) => { const n = { ...st }; delete n[d.key]; return n; })} className="text-[11px] text-gray-500 hover:underline">Clear style</button>
                          )}
                        </div>
                        {(hasRich(v) || styles[d.key]) && (
                          <div className="rounded border border-gray-100 bg-[#F5EFE2] px-3 py-2 text-sm text-[#1C1711]">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 mr-2">Preview</span>
                            <RichText text={v} vars={Object.fromEntries([...v.matchAll(/\{(\w+)\}/g)].map((m) => [m[1], m[0]]))} style={textStyleToCss(styles[d.key])} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-1.5">Formatting is not available for this one (it is shown inside a box, tab title or pop-up).</p>
                    )}
                    {changed && <p className="text-[11px] text-gray-400 mt-1">Default: {d.default}</p>}
                    {missing.length > 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">Heads up: the default includes {missing.join(", ")} — it won&apos;t show if you remove it.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
