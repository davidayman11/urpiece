import { prisma } from "@/lib/prisma";

export interface LowStockItem {
  productId: string;
  productName: string;
  variantName: string;
  inventory: number;
}

/** Active variants of active products at or below the alert level (set in the admin). */
export async function getLowStock() {
  const settings = await prisma.paymentSettings.findFirst({ select: { lowStockThreshold: true } });
  const threshold = settings?.lowStockThreshold ?? 5;
  const variants = await prisma.variant.findMany({
    where: { isActive: true, inventory: { lte: threshold }, product: { isActive: true } },
    include: { product: { select: { id: true, name: true } } },
    orderBy: [{ inventory: "asc" }, { updatedAt: "desc" }],
  });
  const items: LowStockItem[] = variants.map((v) => ({
    productId: v.product.id,
    productName: v.product.name,
    variantName: v.name,
    inventory: v.inventory,
  }));
  return { threshold, items, count: items.length };
}
