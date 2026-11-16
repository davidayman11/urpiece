import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/utils";
import { splitPhotos } from "@/lib/product-images";

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
  const { name, nameAr, descriptionAr, slug, description, categoryId, categoryIds, isActive, isFeatured, packagingEnabled, images, variants, salePercent, saleType, saleStartsAt, saleEndsAt } = body;
  const catIds = Array.isArray(categoryIds) ? categoryIds : (categoryId ? [categoryId] : []);
  const primaryCatId = catIds[0] || categoryId || null;
  const nn = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  const photos = splitPhotos(images);
  const toDate = (v: unknown) => (v ? new Date(v as string) : null);
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
      nameAr: nn(nameAr),
      descriptionAr: nn(descriptionAr),
      categoryId: primaryCatId,
      categoryIds: JSON.stringify(catIds),
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      packagingEnabled: !!packagingEnabled,
      salePercent: saleValue,
      saleType: type,
      saleStartsAt: toDate(saleStartsAt),
      saleEndsAt: toDate(saleEndsAt),
      images: JSON.stringify(photos.general),
      variants: {
        create: variants.map((v: { key?: string; name: string; nameAr?: string; price: number; costPrice: number; inventory: number; sku?: string; options?: string }) => ({
          images: JSON.stringify(photos.forVariant(String(v.key || ""))),
          name: v.name,
          nameAr: nn(v.nameAr),
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
