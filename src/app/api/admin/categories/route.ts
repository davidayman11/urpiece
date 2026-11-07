import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const cats = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { name, description, image, isActive, sortOrder } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Category slug already exists" }, { status: 400 });

  const cat = await prisma.category.create({
    data: { name, slug, description, image, isActive: isActive ?? true, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(cat, { status: 201 });
}
