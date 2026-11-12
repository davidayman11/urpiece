import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { addressSchema, firstError } from "@/lib/customer-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { customerId: c.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = addressSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const count = await prisma.address.count({ where: { customerId: c.id } });
  if (count >= 10) return NextResponse.json({ error: "You can save up to 10 addresses" }, { status: 400 });
  const makeDefault = parsed.data.isDefault || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { customerId: c.id }, data: { isDefault: false } });
    return tx.address.create({ data: { ...parsed.data, isDefault: makeDefault, customerId: c.id } });
  });
  return NextResponse.json({ address }, { status: 201 });
}
