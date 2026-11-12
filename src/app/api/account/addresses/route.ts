import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/texts/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { addressSchema, firstError } from "@/lib/customer-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const t = await getT();
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: t("account.api.notSignedIn") }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { customerId: c.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const t = await getT();
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: t("account.api.notSignedIn") }, { status: 401 });
  const parsed = addressSchema(t).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error, t) }, { status: 400 });

  const count = await prisma.address.count({ where: { customerId: c.id } });
  if (count >= 10) return NextResponse.json({ error: t("account.api.addressLimit") }, { status: 400 });
  const makeDefault = parsed.data.isDefault || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { customerId: c.id }, data: { isDefault: false } });
    return tx.address.create({ data: { ...parsed.data, isDefault: makeDefault, customerId: c.id } });
  });
  return NextResponse.json({ address }, { status: 201 });
}
