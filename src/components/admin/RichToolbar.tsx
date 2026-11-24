"use client";

import type { RichKind } from "@/lib/rich";

const BUTTONS: { kind: RichKind; label: string; title: string; look: string }[] = [
  { kind: "bold", label: "B", title: "Bold", look: "font-bold" },
  { kind: "italic", label: "I", title: "Italic", look: "italic" },
  { kind: "underline", label: "U", title: "Underline", look: "underline" },
  { kind: "strike", label: "S", title: "Strikethrough", look: "line-through" },
  { kind: "sm", label: "A−", title: "Smaller", look: "text-[11px]" },
  { kind: "lg", label: "A+", title: "Larger", look: "text-sm" },
  { kind: "xl", label: "A++", title: "Much larger", look: "text-[15px] font-medium" },
  { kind: "xxl", label: "A+++", title: "Huge", look: "text-[17px] font-medium" },
];

/** Buttons that format the words selected in a text box (bold, italic, underline, strikethrough and 4 sizes) */
export default function RichToolbar({ onFormat }: { onFormat: (kind: RichKind) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {BUTTONS.map((b) => (
        <button
          key={b.kind}
          type="button"
          title={b.title}
          aria-label={b.title}
          // keep the words selected in the text box while clicking
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onFormat(b.kind)}
          className={`min-w-7 h-7 px-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:border-[#A8975E] hover:text-[#8A7A4A] ${b.look}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
