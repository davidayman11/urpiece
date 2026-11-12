import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const safeJson = (s: string): Record<string, string> => {
  try { return JSON.parse(s || "{}") || {}; } catch { return {}; }
};

/** Excel (.xlsx) export of orders. Filters: ?status= &q= &from=YYYY-MM-DD &to=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q");
  const from = sp.get("from");
  const to = sp.get("to");

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
          ] }
        : {}),
      ...(from || to
        ? { createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
          } }
        : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const orderRows = orders.map((o) => {
    const a = safeJson(o.shippingAddress);
    const custom = safeJson(o.customData);
    return {
      "Order #": o.orderNumber,
      Date: o.createdAt.toISOString().slice(0, 16).replace("T", " "),
      Customer: o.customerName,
      Email: o.customerEmail,
      Phone: o.customerPhone || "",
      Governorate: a.governorate || "",
      City: a.city || "",
      Building: a.building || "",
      Street: a.address || "",
      Status: o.status,
      "Payment status": o.paymentStatus,
      "Payment type": o.paymentType === "DEPOSIT" ? "Deposit" : "Full",
      Items: o.items.map((i) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity}`).join("; "),
      Subtotal: o.subtotal,
      Discount: o.discount,
      "Promo code": o.promoCodeUsed || "",
      Shipping: o.shippingFee,
      Total: o.total,
      "Paid now": o.paymentType === "DEPOSIT" ? o.amountDue : o.total,
      "Due on delivery": o.paymentType === "DEPOSIT" ? o.balanceDue : 0,
      "Extra answers": Object.entries(custom).map(([k, v]) => `${k}: ${v}`).join("; "),
    };
  });

  const itemRows = orders.flatMap((o) =>
    o.items.map((i) => ({
      "Order #": o.orderNumber,
      Date: o.createdAt.toISOString().slice(0, 10),
      Product: i.productName,
      Variant: i.variantName || "",
      Quantity: i.quantity,
      "Unit price": i.price,
      "Unit cost": i.costPrice,
      "Line total": i.price * i.quantity,
      "Line profit": (i.price - i.costPrice) * i.quantity,
    }))
  );

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(orderRows);
  ws1["!cols"] = Object.keys(orderRows[0] || { a: 1 }).map((k) => ({ wch: Math.min(40, Math.max(10, k.length + 2)) }));
  XLSX.utils.book_append_sheet(wb, ws1, "Orders");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), "Items");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="urpiece-orders-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
