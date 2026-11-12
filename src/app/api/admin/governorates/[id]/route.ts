import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { name, nameAr, isActive, shippingPrice } = await req.json();
  const clean = String(name || "").trim();
  if (!clean) return NextResponse.json({ error: "Governorate name is required" }, { status: 400 });
  const clash = await prisma.governorate.findFirst({ where: { name: { equals: clean, mode: "insensitive" }, NOT: { id } } });
  if (clash) return NextResponse.json({ error: "That governorate already exists" }, { status: 400 });
  const g = await prisma.governorate.update({ where: { id }, data: { name: clean, nameAr: String(nameAr || "").trim() || null, isActive: isActive ?? true, shippingPrice: Math.max(0, Number(shippingPrice) || 0) } });
  return NextResponse.json(g);
}

// Its cities stay (they become "unassigned") — they are not deleted
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.governorate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
