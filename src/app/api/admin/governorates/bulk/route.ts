import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Give every HIDDEN governorate one shipping price and show it at checkout.
 * Body: { price: number }. Governorates that are already active (and priced) are not touched.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const price = Number((await req.json().catch(() => ({}))).price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Enter a shipping price (0 for free shipping)" }, { status: 400 });
  }
  const r = await prisma.governorate.updateMany({ where: { isActive: false }, data: { isActive: true, shippingPrice: price } });
  return NextResponse.json({ updated: r.count });
}
