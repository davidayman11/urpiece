import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getT } from "@/lib/texts/server";
import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customer-auth";
import { registerSchema, firstError } from "@/lib/customer-validation";

export async function POST(req: NextRequest) {
  const t = await getT();
  const parsed = registerSchema(t).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error, t) }, { status: 400 });
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: t("account.api.emailExists") }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 11);
  const now = new Date();
  // A guest record from an old order is claimed, but only orders placed from now on show in "My orders"
  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: { name, phone: phone || existing.phone, passwordHash, registeredAt: now, sessionVersion: { increment: 1 } },
      })
    : await prisma.customer.create({
        data: { email, name, phone: phone || null, passwordHash, registeredAt: now },
      });

  await createCustomerSession(customer);
  return NextResponse.json({ ok: true }, { status: 201 });
}
