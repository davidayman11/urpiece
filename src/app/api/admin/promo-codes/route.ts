import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await req.json();
  if (!data.code || !data.discountValue) return NextResponse.json({ error: "Code and discount value required" }, { status: 400 });
  const existing = await prisma.promoCode.findUnique({ where: { code: data.code.toUpperCase() } });
  if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 400 });
  const code = await prisma.promoCode.create({
    data: {
      code: data.code.toUpperCase(),
      discountType: data.discountType || "PERCENTAGE",
      discountValue: parseFloat(data.discountValue),
      minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
      maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return NextResponse.json(code, { status: 201 });
}
