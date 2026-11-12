import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { city, cityAr, price, isActive, governorateId } = await req.json();
  const govId = governorateId || null;
  const name = String(city || "").trim();
  if (!name) return NextResponse.json({ error: "City name is required" }, { status: 400 });
  const clash = await prisma.shippingZone.findFirst({ where: { city: name, governorateId: govId, NOT: { id } } });
  if (clash) return NextResponse.json({ error: "This city already exists" }, { status: 400 });
  const zone = await prisma.shippingZone.update({
    where: { id },
    data: { city: name, cityAr: String(cityAr || "").trim() || null, governorateId: govId, price: Math.max(0, Number(price) || 0), isActive: isActive ?? true },
  });
  return NextResponse.json(zone);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.shippingZone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
