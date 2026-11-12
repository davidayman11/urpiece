import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { freeShippingMin } = await req.json();
  const n = Number(freeShippingMin);
  const value = freeShippingMin === null || freeShippingMin === "" || !Number.isFinite(n) || n <= 0 ? null : n;
  const existing = await prisma.paymentSettings.findFirst();
  if (existing) {
    await prisma.paymentSettings.update({ where: { id: existing.id }, data: { freeShippingMin: value } });
  } else {
    await prisma.paymentSettings.create({ data: { freeShippingMin: value } });
  }
  return NextResponse.json({ freeShippingMin: value });
}
