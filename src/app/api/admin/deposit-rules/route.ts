import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseDepositRule } from "@/lib/deposit-rule";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const r = parseDepositRule(await req.json());
  if (!r.data) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json(await prisma.depositRule.create({ data: r.data }), { status: 201 });
}
