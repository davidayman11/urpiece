import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, values } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const preset = await prisma.variantPreset.update({
    where: { id },
    data: { name: name.trim(), values: JSON.stringify((values || []).map((v: string) => String(v).trim()).filter(Boolean)) },
  });
  return NextResponse.json({ id: preset.id, name: preset.name, values: JSON.parse(preset.values) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.variantPreset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
