"use client";

import { useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/rich-message";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholders?: string[];
}

const TOOLS: { cmd: string; label: string; title: string; cls?: string }[] = [
  { cmd: "bold", label: "B", title: "Bold (Ctrl+B)", cls: "font-bold" },
  { cmd: "italic", label: "I", title: "Italic (Ctrl+I)", cls: "italic" },
  { cmd: "underline", label: "U", title: "Underline (Ctrl+U)", cls: "underline" },
  { cmd: "strikeThrough", label: "S", title: "Strikethrough", cls: "line-through" },
  { cmd: "insertUnorderedList", label: "Bullets", title: "Bulleted list" },
  { cmd: "insertOrderedList", label: "Numbers", title: "Numbered list" },
];

export default function RichEditor({ value, onChange, placeholders = [] }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");

  // Put the value in the editor on first load and when it is changed from outside (Reset)
  useEffect(() => {
    const el = ref.current;
    if (el && value !== last.current) {
      el.innerHTML = value;
      last.current = value;
    }
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const clean = sanitizeHtml(el.innerHTML);
    last.current = clean;
    onChange(clean);
  };

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const link = () => {
    const url = window.prompt("Link address (https://...)");
    if (url) run("createLink", url.trim());
  };

  const onPaste = (e: React.ClipboardEvent) => {
    // keep the formatting of what was copied (bold, lists, links...) but drop everything else
    const html = e.clipboardData.getData("text/html");
    if (!html) return; // plain text paste works as normal
    e.preventDefault();
    document.execCommand("insertHTML", false, sanitizeHtml(html));
    emit();
  };

  const keep = (e: React.MouseEvent) => e.preventDefault(); // keep the text selected when a button is clicked
  const btn = "px-2.5 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gray-50 text-gray-700";

  return (
    <div className="border border-gray-200 rounded bg-white">
      <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-gray-100 bg-gray-50/60">
        {TOOLS.map((t) => (
          <button key={t.cmd} type="button" title={t.title} onMouseDown={keep} onClick={() => run(t.cmd)} className={`${btn} ${t.cls || ""}`}>
            {t.label}
          </button>
        ))}
        <button type="button" title="Add a link" onMouseDown={keep} onClick={link} className={btn}>Link</button>
        <button type="button" title="Remove formatting from the selected text" onMouseDown={keep} onClick={() => run("removeFormat")} className={btn}>Clear</button>
        <button type="button" title="Undo" onMouseDown={keep} onClick={() => run("undo")} className={btn}>Undo</button>
        <button type="button" title="Redo" onMouseDown={keep} onClick={() => run("redo")} className={btn}>Redo</button>
        {placeholders.length > 0 && <span className="mx-1 h-5 w-px bg-gray-200" />}
        {placeholders.map((p) => (
          <button key={p} type="button" title={`Insert ${p}`} onMouseDown={keep} onClick={() => run("insertText", p)} className={`${btn} text-[#8A7A4A] border-[#A8975E]/40`}>
            {p}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onPaste={onPaste}
        onBlur={emit}
        className="min-h-[160px] max-h-[360px] overflow-y-auto p-3 text-sm text-gray-800 leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-2"
      />
    </div>
  );
}
