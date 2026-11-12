import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const b = await req.json();
  const n = Number(b.freeShippingMin);
  const data = {
    discountMode: b.discountMode === "ONE" ? "ONE" : "STACK",
    salesEnabled: b.salesEnabled !== false,
    promosEnabled: b.promosEnabled !== false,
    freeShippingMin: b.freeShippingMin === "" || b.freeShippingMin == null || !Number.isFinite(n) || n <= 0 ? null : n,
  };
  const existing = await prisma.paymentSettings.findFirst();
  if (existing) await prisma.paymentSettings.update({ where: { id: existing.id }, data });
  else await prisma.paymentSettings.create({ data });
  return NextResponse.json(data);
}
