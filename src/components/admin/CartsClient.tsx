"use client";

import { useEffect, useMemo, useState } from "react";
import RichEditor from "@/components/admin/RichEditor";
import { fillTemplate, toPlain, toWhatsApp, sanitizeHtml } from "@/lib/rich-message";
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

const DEFAULT_TEMPLATE =
  "<p>Hi {name},</p><p>You left some items in your cart at <b>UrPiece</b>:</p><p>{items}</p><p><b>Total: {total}</b></p><p>Complete your order here: {link}</p>";
const TEMPLATE_KEY = "urpiece-cart-reminder-template";

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

  // the message you write is remembered in this browser
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { const saved = localStorage.getItem(TEMPLATE_KEY); if (saved) setTemplate(saved); } catch { /* storage unavailable */ }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const changeTemplate = (html: string) => {
    setTemplate(html);
    try { localStorage.setItem(TEMPLATE_KEY, html); } catch { /* storage unavailable */ }
  };
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

  /** The template filled in for one customer, as clean HTML */
  const messageHtml = (r: CartRow) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return sanitizeHtml(
      fillTemplate(template, {
        name: r.name,
        total: formatPrice(cartValue(r)),
        link: `${origin}/cart`,
        items: r.items.map((i) => ({
          text: `${i.name}${i.variant ? ` (${i.variant})` : ""}${i.packagingName ? ` + ${i.packagingName}` : ""} x${i.quantity}`,
        })),
      })
    );
  };

  // WhatsApp keeps bold / italic / strikethrough; the email link can only carry plain text
  const copyFormatted = async (r: CartRow) => {
    const html = messageHtml(r);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([toWhatsApp(html)], { type: "text/plain" }),
        }),
      ]);
    } catch {
      try { await navigator.clipboard.writeText(toWhatsApp(html)); } catch { return; }
    }
    setCopied(r.id);
    setTimeout(() => setCopied(""), 1500);
  };

  // built when clicked (needs the browser), so nothing depends on the template while the page loads
  const sendWhatsApp = (r: CartRow) => {
    if (!r.phone) return;
    window.open(`https://wa.me/${normalizePhone(r.phone)}?text=${encodeURIComponent(toWhatsApp(messageHtml(r)))}`, "_blank", "noopener,noreferrer");
  };
  const sendEmail = (r: CartRow) => {
    window.location.href = `mailto:${r.email}?subject=${encodeURIComponent("You left something in your cart")}&body=${encodeURIComponent(toPlain(messageHtml(r)))}`;
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="text-xs font-medium text-gray-500">
            Reminder message. The buttons add the customer&apos;s name, cart items, total and link.
          </label>
          <button type="button" onClick={() => changeTemplate(DEFAULT_TEMPLATE)} className="text-xs text-gray-500 hover:underline">Reset to default</button>
        </div>
        <RichEditor value={template} onChange={changeTemplate} placeholders={["{name}", "{items}", "{total}", "{link}"]} />
        <p className="text-[11px] text-gray-400">
          You can paste text with its formatting. <b>WhatsApp</b> shows bold, italic and strikethrough. <b>Email</b> opens as plain text, so for a styled email use <b>Copy formatted</b> and paste it into your email.
        </p>
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
                    <button type="button" onClick={() => sendEmail(r)} className={`${btn} text-white border-transparent`} style={{ backgroundColor: "#A8975E" }}>Email reminder</button>
                    {r.phone && (
                      <button type="button" onClick={() => sendWhatsApp(r)} className={`${btn} text-white border-transparent`} style={{ backgroundColor: "#A8975E" }}>WhatsApp reminder</button>
                    )}
                    <button type="button" onClick={() => copyFormatted(r)} className={`${btn} border-gray-200 text-gray-600 hover:bg-gray-50`}>
                      {copied === r.id ? "Copied" : "Copy formatted"}
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
