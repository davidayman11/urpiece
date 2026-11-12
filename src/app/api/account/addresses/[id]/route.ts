import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { addressSchema, firstError } from "@/lib/customer-validation";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, customerId: string) {
  return prisma.address.findFirst({ where: { id, customerId } });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  if (!(await owned(id, c.id))) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  const parsed = addressSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const address = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.address.updateMany({ where: { customerId: c.id }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: parsed.data });
  });
  return NextResponse.json({ address });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const a = await owned(id, c.id);
  if (!a) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  await prisma.address.delete({ where: { id } });
  // Keep one default if any addresses remain
  if (a.isDefault) {
    const next = await prisma.address.findFirst({ where: { customerId: c.id }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ ok: true });
}
