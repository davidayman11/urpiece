import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const arabic = (d: Record<string, unknown>) => ({
  headingAr: String(d.headingAr || "").trim() || null,
  bodyAr: String(d.bodyAr || "").trim() || null,
  buttonTextAr: String(d.buttonTextAr || "").trim() || null,
  promoCode: String(d.promoCode || "").trim().toUpperCase() || null,
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const data = await req.json();
  const popup = await prisma.popup.update({
    where: { id },
    data: { ...data, ...arabic(data), pages: JSON.stringify(data.pages || ["*"]) },
  });
  return NextResponse.json(popup);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.popup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
