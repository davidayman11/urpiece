import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json();
  const { name, slug, description, categoryId, isActive, isFeatured, images, variants, salePercent, saleType } = body;
  const type = saleType === "FIXED" ? "FIXED" : "PERCENT";
  const saleValue = type === "PERCENT" ? Math.min(100, Math.max(0, Number(salePercent) || 0)) : Math.max(0, Number(salePercent) || 0);

  // Update product
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      categoryId: categoryId || null,
      isActive,
      isFeatured,
      salePercent: saleValue,
      saleType: type,
      images: JSON.stringify(images || []),
    },
  });

  // Handle variants: upsert each
  for (const v of variants) {
    if (v.id) {
      await prisma.variant.update({
        where: { id: v.id },
        data: {
          name: v.name,
          price: v.price,
          costPrice: v.costPrice,
          inventory: v.inventory,
          sku: v.sku || null,
          options: v.options || "{}",
        },
      });
    } else {
      await prisma.variant.create({
        data: {
          productId: id,
          name: v.name,
          price: v.price,
          costPrice: v.costPrice,
          inventory: v.inventory || 0,
          sku: v.sku || null,
          options: v.options || "{}",
        },
      });
    }
  }

  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
