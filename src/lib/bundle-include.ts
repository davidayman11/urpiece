/** Prisma include used wherever a bundle is shown in the store. */
export const bundleInclude = {
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      product: {
        select: {
          name: true, nameAr: true, images: true, slug: true, isActive: true,
          variants: { select: { id: true, name: true, nameAr: true, price: true, inventory: true, isActive: true, images: true }, orderBy: { price: "asc" as const } },
        },
      },
    },
  },
};
