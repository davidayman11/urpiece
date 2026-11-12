import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseRule } from "@/lib/discount-rule";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const r = parseRule(await req.json());
  if (!r.data) return NextResponse.json({ error: r.error }, { status: 400 });
  const rule = await prisma.discountRule.create({ data: r.data });
  return NextResponse.json(rule, { status: 201 });
}
