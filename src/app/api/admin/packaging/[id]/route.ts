import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { packagingData } from "@/lib/packaging-input";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const data = packagingData(await req.json());
  if (!data) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  return NextResponse.json(await prisma.packagingOption.update({ where: { id }, data }));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.packagingOption.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
