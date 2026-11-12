import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBundle } from "@/lib/bundle-input";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const r = parseBundle(await req.json());
  if (!r.data) return NextResponse.json({ error: r.error }, { status: 400 });
  const { items, ...b } = r.data;
  if (await prisma.bundle.findUnique({ where: { slug: b.slug } })) {
    return NextResponse.json({ error: "A bundle with this link name already exists" }, { status: 400 });
  }
  const count = await prisma.bundle.count();
  const bundle = await prisma.bundle.create({
    data: { ...b, sortOrder: count, items: { create: items.map((i, idx) => ({ ...i, sortOrder: idx })) } },
  });
  return NextResponse.json(bundle, { status: 201 });
}
