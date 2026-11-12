import Link from "next/link";
import type { LowStockItem } from "@/lib/low-stock";

export default function LowStockCard({ items, threshold }: { items: LowStockItem[]; threshold: number }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, 10);
  return (
    <div className="mt-6 bg-white rounded-lg border border-amber-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-gray-800">
          Low stock <span className="text-sm text-gray-400 font-normal">· {items.length} item{items.length === 1 ? "" : "s"} at {threshold} or fewer</span>
        </h2>
        <Link href="/admin/products?stock=low" className="text-xs text-[#A8975E] hover:underline">View all →</Link>
      </div>
      <ul className="divide-y divide-gray-50 text-sm">
        {shown.map((i, idx) => (
          <li key={idx} className="flex items-center justify-between py-2">
            <span className="text-gray-700">
              {i.productName} <span className="text-gray-400">· {i.variantName}</span>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${i.inventory === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
              {i.inventory === 0 ? "Out of stock" : `${i.inventory} left`}
            </span>
          </li>
        ))}
      </ul>
      {items.length > shown.length && <p className="text-xs text-gray-400 mt-2">+ {items.length - shown.length} more</p>}
    </div>
  );
}
