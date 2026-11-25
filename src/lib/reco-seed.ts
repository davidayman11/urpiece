import { prisma } from "@/lib/prisma";

const FLAG = "recoSeeded";

export async function recoIsSeeded(): Promise<boolean> {
  return !!(await prisma.siteSetting.findUnique({ where: { key: FLAG } }));
}

/**
 * Until now "Recommended for you" was a fixed row at the bottom of the home, product and cart pages.
 * The first time Admin > Pages opens, it becomes a normal section on each of those pages (so it can be moved,
 * edited, hidden or deleted). Done once only; deleting it later keeps it deleted.
 */
export async function seedRecoSections() {
  if (await recoIsSeeded()) return;
  for (const page of ["home", "product", "cart"]) {
    const has = await prisma.siteSection.count({ where: { pageSlug: page, type: "recommended" } });
    if (has) continue;
    const last = await prisma.siteSection.findFirst({ where: { pageSlug: page }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    await prisma.siteSection.create({ data: { pageSlug: page, type: "recommended", isVisible: true, sortOrder: (last?.sortOrder ?? 0) + 1, content: JSON.stringify({ _label: "Recommended for you", _position: "bottom" }) } });
  }
  await prisma.siteSetting.upsert({ where: { key: FLAG }, update: { value: "1" }, create: { key: FLAG, value: "1" } });
}
