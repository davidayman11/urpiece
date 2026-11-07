import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await prisma.paymentSettings.findFirst();
  return NextResponse.json(settings || {});
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { instapayId, instapayPhone, instructions } = await req.json();
  const existing = await prisma.paymentSettings.findFirst();
  if (existing) {
    const s = await prisma.paymentSettings.update({
      where: { id: existing.id },
      data: { instapayId, instapayPhone, instructions },
    });
    return NextResponse.json(s);
  }
  const s = await prisma.paymentSettings.create({ data: { instapayId, instapayPhone, instructions } });
  return NextResponse.json(s);
}
