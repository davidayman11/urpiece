"use client";

import { useEffect } from "react";

export default function PrintButton({ auto }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [auto]);
  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-[#1C1711] text-white px-5 py-2 text-sm rounded hover:bg-[#5A5040]"
    >
      🖨 Print
    </button>
  );
}
