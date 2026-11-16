import { cleanPackagingIds } from "@/lib/packaging-input";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { splitPhotos } from "@/lib/product-images";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await req.json();
  const { name, nameAr, descriptionAr, slug, description, categoryId, categoryIds, isActive, isFeatured, packagingEnabled, packagingIds, images, variants, salePercent, saleType, saleStartsAt, saleEndsAt } = body;
  const catIds = Array.isArray(categoryIds) ? categoryIds : (categoryId ? [categoryId] : []);
  const primaryCatId = catIds[0] || categoryId || null;
  const nn = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  const photos = splitPhotos(images);
  const toDate = (v: unknown) => (v ? new Date(v as string) : null);
  const type = saleType === "FIXED" ? "FIXED" : "PERCENT";
  const saleValue = type === "PERCENT" ? Math.min(100, Math.max(0, Number(salePercent) || 0)) : Math.max(0, Number(salePercent) || 0);

  // Update product
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      nameAr: nn(nameAr),
      descriptionAr: nn(descriptionAr),
      categoryId: primaryCatId,
      categoryIds: JSON.stringify(catIds),
      isActive,
      isFeatured,
      packagingEnabled: !!packagingEnabled,
      packagingIds: cleanPackagingIds(packagingIds),
      salePercent: saleValue,
      saleType: type,
      saleStartsAt: toDate(saleStartsAt),
      saleEndsAt: toDate(saleEndsAt),
      images: JSON.stringify(photos.general),
    },
  });

  // Handle variants: upsert each
  for (const v of variants) {
    if (v.id) {
      await prisma.variant.update({
        where: { id: v.id },
        data: {
          name: v.name,
          nameAr: nn(v.nameAr),
          price: v.price,
          costPrice: v.costPrice,
          inventory: v.inventory,
          sku: v.sku || null,
          options: v.options || "{}",
          images: JSON.stringify(photos.forVariant(String(v.key || v.id))),
        },
      });
    } else {
      await prisma.variant.create({
        data: {
          productId: id,
          images: JSON.stringify(photos.forVariant(String(v.key || ""))),
          name: v.name,
          nameAr: nn(v.nameAr),
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
