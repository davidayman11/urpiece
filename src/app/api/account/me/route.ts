import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/texts/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { profileSchema, firstError } from "@/lib/customer-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const t = await getT();
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: t("account.api.notSignedIn") }, { status: 401 });
  return NextResponse.json({ customer: { id: c.id, name: c.name, email: c.email, phone: c.phone } });
}

export async function PUT(req: NextRequest) {
  const t = await getT();
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: t("account.api.notSignedIn") }, { status: 401 });
  const parsed = profileSchema(t).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error, t) }, { status: 400 });
  const u = await prisma.customer.update({
    where: { id: c.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  return NextResponse.json({ customer: { id: u.id, name: u.name, email: u.email, phone: u.phone } });
}
