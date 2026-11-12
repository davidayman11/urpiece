import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** How much would be deleted (shown before the admin confirms). */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const [orders, customers, addresses, withScreenshot] = await Promise.all([
    prisma.order.count(),
    prisma.customer.count(),
    prisma.address.count(),
    prisma.order.count({ where: { paymentScreenshot: { not: null } } }),
  ]);
  return NextResponse.json({ orders, customers, addresses, withScreenshot });
}

/**
 * PERMANENTLY delete test data. Body: { confirm: "DELETE", orders: boolean, customers: boolean, resetPromoUsage: boolean }
 *  - orders: every order (items, notes and status history go with it) + the uploaded payment screenshots
 *  - customers: every customer account and guest customer record + their saved addresses
 * Never touches: admin users, products, categories, promo codes (only their "used" counters, if asked), settings, texts, photos.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Type DELETE (in capital letters) to confirm.' }, { status: 400 });
  }
  const wantOrders = body.orders === true;
  const wantCustomers = body.customers === true;
  if (!wantOrders && !wantCustomers) {
    return NextResponse.json({ error: "Tick what you want to delete." }, { status: 400 });
  }

  // payment screenshots are personal data: collect their addresses first, delete the files after the database is cleaned
  const screenshots = wantOrders
    ? (await prisma.order.findMany({ where: { paymentScreenshot: { not: null } }, select: { paymentScreenshot: true } }))
        .map((o) => o.paymentScreenshot as string)
    : [];

  const result = await prisma.$transaction(async (tx) => {
    const out = { orders: 0, customers: 0, addresses: 0, promoReset: 0 };
    if (wantOrders) {
      out.orders = (await tx.order.deleteMany({})).count;
      if (body.resetPromoUsage === true) out.promoReset = (await tx.promoCode.updateMany({ data: { usedCount: 0 } })).count;
    }
    if (wantCustomers) {
      out.addresses = await tx.address.count();
      out.customers = (await tx.customer.deleteMany({})).count; // saved addresses go with them
    }
    return out;
  });

  let filesDeleted = 0;
  if (screenshots.length > 0) {
    try {
      await del(screenshots);
      filesDeleted = screenshots.length;
    } catch (e) {
      console.error("Could not delete some payment screenshots:", e);
    }
  }
  return NextResponse.json({ ...result, filesDeleted });
}
