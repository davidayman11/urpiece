import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const zones = await prisma.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { city: "asc" }] });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { city, price, isActive, governorateId } = await req.json();
  const govId = governorateId || null;
  const name = String(city || "").trim();
  if (!name) return NextResponse.json({ error: "City name is required" }, { status: 400 });
  const exists = await prisma.shippingZone.findFirst({ where: { city: name, governorateId: govId } });
  if (exists) return NextResponse.json({ error: "This city already exists" }, { status: 400 });
  const count = await prisma.shippingZone.count();
  const zone = await prisma.shippingZone.create({
    data: { city: name, governorateId: govId, price: Math.max(0, Number(price) || 0), isActive: isActive ?? true, sortOrder: count },
  });
  return NextResponse.json(zone, { status: 201 });
}
