import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseDepositRule } from "@/lib/deposit-rule";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const r = parseDepositRule(await req.json());
  if (!r.data) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json(await prisma.depositRule.update({ where: { id }, data: r.data }));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.depositRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
