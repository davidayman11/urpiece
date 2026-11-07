import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.popup.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
