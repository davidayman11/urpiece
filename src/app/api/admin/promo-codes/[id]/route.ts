import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const data = await req.json();
  const code = await prisma.promoCode.update({
    where: { id },
    data: {
      discountType: data.discountType,
      discountValue: parseFloat(data.discountValue),
      minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
      maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
      isActive: data.isActive,
      requiresLogin: !!data.requiresLogin,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return NextResponse.json(code);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
