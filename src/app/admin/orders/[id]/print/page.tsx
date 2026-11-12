import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseJson } from "@/lib/utils";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Print order" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; auto?: string }>;
}

export default async function PrintOrderPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const { type, auto } = await searchParams;

  const [order, site] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { items: true } }),
    prisma.siteSection.findFirst({ where: { pageSlug: "site", type: "settings" } }),
  ]);
  if (!order) notFound();

  const s = parseJson<Record<string, string>>(order.shippingAddress, {});
  const custom = Object.entries(parseJson<Record<string, string>>(order.customData, {}));
  const siteC = site ? parseJson<Record<string, string>>(site.content, {}) : {};
  const isLabel = type === "label";
  const deposit = order.paymentType === "DEPOSIT";
  // What the courier should collect: the unpaid balance (deposit orders), else nothing
  const collect = deposit ? order.balanceDue : 0;
  const addressLines = [
    [s.building && `Building ${s.building}`, s.address].filter(Boolean).join(", "),
    [s.city, s.governorate].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div className="print-root">
      <style>{`
        @page { size: ${isLabel ? "100mm 150mm" : "A4"}; margin: ${isLabel ? "5mm" : "14mm"}; }
        body { background: #fff !important; }
        .print-root { color: #111; font-family: Arial, Helvetica, sans-serif; background: #fff; }
        @media print { .no-print { display: none !important; } .sheet { box-shadow: none !important; margin: 0 !important; } }
        .sheet { background: #fff; margin: 16px auto; box-shadow: 0 2px 18px rgba(0,0,0,.12); }
      `}</style>

      <div className="no-print flex items-center justify-center gap-3 py-4 bg-gray-100">
        <PrintButton auto={auto === "1"} />
        <a href={`/admin/orders/${order.id}/print?type=${isLabel ? "invoice" : "label"}`} className="text-sm text-gray-600 underline">
          Switch to {isLabel ? "invoice" : "shipping label"}
        </a>
        <a href={`/admin/orders/${order.id}`} className="text-sm text-gray-600 underline">← Back to order</a>
      </div>

      {isLabel ? (
        <div className="sheet" style={{ width: "100mm", padding: "5mm", boxSizing: "border-box", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #111", paddingBottom: 6 }}>
            <strong style={{ letterSpacing: 3, textTransform: "uppercase", fontSize: 15 }}>UrPiece</strong>
            <span style={{ fontSize: 11 }}>{format(order.createdAt, "d MMM yyyy")}</span>
          </div>
          <p style={{ margin: "10px 0 2px", fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Ship to</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{order.customerName}</p>
          {order.customerPhone && <p style={{ margin: "4px 0", fontSize: 18, fontWeight: 700 }}>{order.customerPhone}</p>}
          {addressLines.map((l, i) => <p key={i} style={{ margin: "2px 0", fontSize: 15 }}>{l}</p>)}
          {custom.map(([k, v]) => <p key={k} style={{ margin: "6px 0 0", fontSize: 12 }}><strong>{k}:</strong> {v}</p>)}

          <div style={{ marginTop: 12, padding: "8px 10px", border: "2px solid #111", textAlign: "center" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Collect on delivery</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{collect > 0 ? formatPrice(collect) : "PAID"}</div>
          </div>

          <div style={{ marginTop: 12, fontSize: 11 }}>
            <strong>Order {order.orderNumber}</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
              {order.items.map((i) => (
                <li key={i.id}>{i.quantity}× {i.productName}{i.variantName ? ` — ${i.variantName}` : ""}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="sheet" style={{ width: "210mm", maxWidth: "100%", padding: "14mm", boxSizing: "border-box", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 26, letterSpacing: 6, textTransform: "uppercase", fontWeight: 300 }}>UrPiece</div>
              {siteC.contactEmail && <div style={{ color: "#555", marginTop: 4 }}>{siteC.contactEmail}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>INVOICE</div>
              <div style={{ marginTop: 4 }}>{order.orderNumber}</div>
              <div style={{ color: "#555" }}>{format(order.createdAt, "d MMMM yyyy")}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 40, marginTop: 28 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#777", marginBottom: 4 }}>Bill / ship to</div>
              <div style={{ fontWeight: 700 }}>{order.customerName}</div>
              {addressLines.map((l, i) => <div key={i}>{l}</div>)}
              {order.customerPhone && <div>{order.customerPhone}</div>}
              {order.customerEmail && <div>{order.customerEmail}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#777", marginBottom: 4 }}>Payment</div>
              <div>{deposit ? "Deposit + cash on delivery" : "Paid in full (InstaPay)"}</div>
              <div>Status: {order.paymentStatus.replace(/_/g, " ")}</div>
              {order.promoCodeUsed && <div>Promo: {order.promoCodeUsed}</div>}
              {custom.map(([k, v]) => <div key={k}>{k}: {v}</div>)}
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 28 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #111", textAlign: "left" }}>
                <th style={{ padding: "8px 4px" }}>Item</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Price</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Qty</th>
                <th style={{ padding: "8px 4px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px 4px" }}>
                    {i.productName}
                    {i.variantName && <div style={{ color: "#666", fontSize: 11 }}>{i.variantName}</div>}
                    {i.bundleName && <div style={{ color: "#666", fontSize: 11 }}>Bundle: {i.bundleName}</div>}
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{formatPrice(i.price)}</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{i.quantity}</td>
                  <td style={{ padding: "8px 4px", textAlign: "right" }}>{formatPrice(i.price * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginLeft: "auto", width: 260, marginTop: 16 }}>
            {[
              ["Subtotal", formatPrice(order.subtotal)],
              ...(order.discount > 0 ? [["Discount", `−${formatPrice(order.discount)}`]] : []),
              ["Shipping", order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>{k}</span><span>{v}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", marginTop: 4, borderTop: "2px solid #111", fontWeight: 700, fontSize: 16 }}>
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
            {deposit && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>Deposit paid</span><span>{formatPrice(order.amountDue)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: 700 }}><span>Due on delivery</span><span>{formatPrice(order.balanceDue)}</span></div>
              </>
            )}
          </div>

          <p style={{ marginTop: 40, textAlign: "center", color: "#666", fontSize: 12 }}>
            Thank you for shopping with UrPiece{siteC.tagline ? ` — ${siteC.tagline}` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
