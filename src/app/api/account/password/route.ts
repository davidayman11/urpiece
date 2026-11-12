import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCustomer, createCustomerSession } from "@/lib/customer-auth";
import { passwordSchema, firstError } from "@/lib/customer-validation";

export async function PUT(req: NextRequest) {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = passwordSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const row = await prisma.customer.findUnique({ where: { id: c.id } });
  if (!row?.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, row.passwordHash))) {
    return NextResponse.json({ error: "Your current password is incorrect" }, { status: 400 });
  }
  // Bumping sessionVersion signs out every other device
  const updated = await prisma.customer.update({
    where: { id: c.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 11), sessionVersion: { increment: 1 } },
  });
  await createCustomerSession(updated);
  return NextResponse.json({ ok: true });
}
