import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { type, content, isVisible, sortOrder } = await req.json();
  const section = await prisma.siteSection.update({
    where: { id },
    data: { type, content: JSON.stringify(content || {}), isVisible, sortOrder },
  });
  return NextResponse.json(section);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.siteSection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
