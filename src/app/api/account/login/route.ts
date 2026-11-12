import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customer-auth";
import { loginSchema } from "@/lib/customer-validation";

// Used so a missing account takes as long to answer as a wrong password
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 11);

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => ({})));
  const fail = () => NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  if (!parsed.success) return fail();
  const { email, password } = parsed.data;

  const customer = await prisma.customer.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  const ok = await bcrypt.compare(password, customer?.passwordHash || DUMMY_HASH);
  if (!customer || !customer.passwordHash || !ok) return fail();

  await createCustomerSession(customer);
  return NextResponse.json({ ok: true });
}
