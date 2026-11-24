import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

/**
 * The content of a page's main block (About / Contact page content), combined from every visible section of that type.
 * If the admin created more than one, the most recently saved value of each field wins, so a new section
 * never makes the older settings disappear and an edit always shows up.
 */
export async function loadMainSection(pageSlug: string, type: string): Promise<{ type: string; content: string } | null> {
  const rows = await prisma.siteSection.findMany({
    where: { pageSlug, type, isVisible: true },
    orderBy: { updatedAt: "asc" },
  });
  if (rows.length === 0) return null;
  const merged: Record<string, string> = {};
  for (const r of rows) {
    const c = parseJson<Record<string, string>>(r.content, {});
    for (const [k, v] of Object.entries(c)) {
      // a later section overrides, but an empty value never wipes out a filled one
      if (typeof v === "string" && v.trim() !== "" && v !== "[]") merged[k] = v;
    }
  }
  return { type, content: JSON.stringify(merged) };
}
