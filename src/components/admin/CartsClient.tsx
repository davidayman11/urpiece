"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { formatPrice } from "@/lib/utils";

export interface CartRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orders: number;
  updatedAt: string;
  items: { name: string; variant: string; image: string; price: number; quantity: number; packagingName: string; packagingPrice: number }[];
}

const DEFAULT_TEMPLATE = `Hi {name},

You left some items in your cart at urpiece:

{items}

Total: {total}

Complete your order here: {link}`;

const HOUR = 3600_000;

function cartValue(r: CartRow) {
  return r.items.reduce((s, i) => s + (i.price + i.packagingPrice) * i.quantity, 0);
}

function normalizePhone(p: string) {
  let d = p.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "20" + d.slice(1);
  else if (!d.startsWith("20")) d = "20" + d;
  return d;
}

export default function CartsClient({ rows, now }: { rows: CartRow[]; now: number }) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [q, setQ] = useState("");
  const [age, setAge] = useState("all");
  const [copied, setCopied] = useState("");

  const filtered = useMemo(() => {
    const min = age === "1h" ? HOUR : age === "24h" ? 24 * HOUR : 0;
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (now - new Date(r.updatedAt).getTime() < min) return false;
      if (!s) return true;
      return [r.name, r.email, r.phone || ""].some((v) => v.toLowerCase().includes(s));
    });
  }, [rows, q, age, now]);

  const totalValue = filtered.reduce((s, r) => s + cartValue(r), 0);

  const message = (r: CartRow) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const lines = r.items
      .map((i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""}${i.packagingName ? ` + ${i.packagingName}` : ""} x${i.quantity}`)
      .join("\n");
    return template
      .replaceAll("{name}", r.name)
      .replaceAll("{items}", lines)
      .replaceAll("{total}", formatPrice(cartValue(r)))
      .replaceAll("{link}", `${origin}/cart`);
  };

  const copy = async (r: CartRow) => {
    try {
      await navigator.clipboard.writeText(message(r));
      setCopied(r.id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const btn = "px-3 py-1.5 rounded text-xs font-medium border";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800">Carts</h1>
        <span className="text-sm text-gray-500">
          {filtered.length} cart{filtered.length === 1 ? "" : "s"} · {formatPrice(totalValue)} total value
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-2">
        <label className="text-xs font-medium text-gray-500">
          Reminder message template — use {"{name}"}, {"{items}"}, {"{total}"}, {"{link}"}
        </label>
        <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={7} className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone..." className="border border-gray-200 rounded px-3 py-2 text-sm bg-white w-72 max-w-full" />
        <select value={age} onChange={(e) => setAge(e.target.value)} className="border border-gray-200 rounded px-3 py-2 text-sm bg-white">
          <option value="all">All carts</option>
          <option value="1h">Older than 1 hour</option>
          <option value="24h">Older than 24 hours</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-gray-400">No carts found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const msg = message(r);
            const wa = r.phone ? `https://wa.me/${normalizePhone(r.phone)}?text=${encodeURIComponent(msg)}` : "";
            const mail = `mailto:${r.email}?subject=${encodeURIComponent("You left something in your cart")}&body=${encodeURIComponent(msg)}`;
            return (
              <div key={r.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col lg:flex-row gap-4 lg:items-start">
                <div className="lg:w-64 shrink-0 text-sm space-y-0.5">
                  <p className="font-medium text-gray-800">{r.name}</p>
                  <p className="text-gray-600 break-all">{r.email}</p>
                  <p className="text-gray-500">{r.phone || "—"}</p>
                  <p className="text-xs text-gray-400">
                    Updated {formatDistanceToNow(new Date(r.updatedAt), { addSuffix: true })} ·{" "}
                    {r.orders > 0 ? `${r.orders} previous order${r.orders === 1 ? "" : "s"}` : "No orders yet"}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {r.items.map((i, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      {i.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.image} alt="" className="w-10 h-10 object-cover rounded border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 truncate">{i.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {[i.variant, i.packagingName && `Packaging: ${i.packagingName}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="text-gray-500">x{i.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="lg:w-48 shrink-0 space-y-2 lg:text-right">
                  <p className="font-semibold text-gray-800">{formatPrice(cartValue(r))}</p>
                  <div className="flex gap-2 flex-wrap lg:justify-end">
                    <a href={mail} className={`${btn} text-white border-transparent`} style={{ backgroundColor: "#A8975E" }}>Email reminder</a>
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} text-white border-transparent`} style={{ backgroundColor: "#A8975E" }}>WhatsApp reminder</a>
                    )}
                    <button type="button" onClick={() => copy(r)} className={`${btn} border-gray-200 text-gray-600 hover:bg-gray-50`}>
                      {copied === r.id ? "Copied" : "Copy message"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
