"use client";

import { useState } from "react";
import { useT } from "@/components/store/TextsProvider";

export default function CopyButton({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch { /* clipboard unavailable */ }
      }}
      className="text-[10px] tracking-[0.2em] uppercase text-[#A8975E] border border-[#A8975E]/40 px-3 py-1.5 hover:bg-[#A8975E] hover:text-[#F5EFE2] transition-colors"
    >
      {copied ? t("orders.copy.copied") : t("orders.copy.copy")}
    </button>
  );
}
