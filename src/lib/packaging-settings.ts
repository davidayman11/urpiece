import { prisma } from "@/lib/prisma";

/** Store-wide packaging settings (Admin > Packaging). oneFree: with 2+ packages on an item, one is free. Default on. */
export async function getPackagingSettings(): Promise<{ oneFree: boolean }> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "packaging" } });
    if (!row) return { oneFree: true };
    return { oneFree: JSON.parse(row.value).oneFree !== false };
  } catch {
    return { oneFree: true };
  }
}
