import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const n = Math.floor(Number((await req.json()).threshold));
  if (!Number.isFinite(n) || n < 0 || n > 1000) {
    return NextResponse.json({ error: "Enter a number between 0 and 1000" }, { status: 400 });
  }
  const existing = await prisma.paymentSettings.findFirst();
  if (existing) await prisma.paymentSettings.update({ where: { id: existing.id }, data: { lowStockThreshold: n } });
  else await prisma.paymentSettings.create({ data: { lowStockThreshold: n } });
  return NextResponse.json({ threshold: n });
}
