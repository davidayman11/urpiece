import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseRule } from "@/lib/discount-rule";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const r = parseRule(await req.json());
  if (!r.data) return NextResponse.json({ error: r.error }, { status: 400 });
  const rule = await prisma.discountRule.update({ where: { id }, data: r.data });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.discountRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
