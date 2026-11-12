import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBundle } from "@/lib/bundle-input";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const r = parseBundle(await req.json());
  if (!r.data) return NextResponse.json({ error: r.error }, { status: 400 });
  const { items, ...b } = r.data;
  const clash = await prisma.bundle.findFirst({ where: { slug: b.slug, NOT: { id } } });
  if (clash) return NextResponse.json({ error: "A bundle with this link name already exists" }, { status: 400 });

  const bundle = await prisma.$transaction(async (tx) => {
    await tx.bundleItem.deleteMany({ where: { bundleId: id } });
    return tx.bundle.update({
      where: { id },
      data: { ...b, items: { create: items.map((i, idx) => ({ ...i, sortOrder: idx })) } },
    });
  });
  return NextResponse.json(bundle);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.bundle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
