import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const products = await prisma.product.findMany({
    include: { variants: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, slug, description, categoryId, isActive, isFeatured, images, variants, salePercent, saleType } = body;
  const type = saleType === "FIXED" ? "FIXED" : "PERCENT";
  const saleValue = type === "PERCENT" ? Math.min(100, Math.max(0, Number(salePercent) || 0)) : Math.max(0, Number(salePercent) || 0);

  if (!name || !variants?.length) {
    return NextResponse.json({ error: "Name and at least one variant are required" }, { status: 400 });
  }

  const finalSlug = slug || slugify(name);
  const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      name,
      slug: finalSlug,
      description,
      categoryId: categoryId || null,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      salePercent: saleValue,
      saleType: type,
      images: JSON.stringify(images || []),
      variants: {
        create: variants.map((v: { name: string; price: number; costPrice: number; inventory: number; sku?: string; options?: string }) => ({
          name: v.name,
          price: v.price,
          costPrice: v.costPrice,
          inventory: v.inventory || 0,
          sku: v.sku || null,
          options: v.options || "{}",
        })),
      },
    },
    include: { variants: true },
  });

  return NextResponse.json(product, { status: 201 });
}
