import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

/** Minimal shape of a section (so this works with the Prisma row or a plain object) */
interface Sec { id: string; type: string; content: string; sortOrder?: number }

const key = (page: string) => `sectionOrder:${page}`;

/** The order saved from Admin > Pages (ids), or null when the page still uses its default layout. */
export async function getSavedOrder(page: string): Promise<string[] | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: key(page) } });
    if (!row) return null;
    const v = JSON.parse(row.value);
    return Array.isArray(v) && v.length ? v.filter((x) => typeof x === "string") : null;
  } catch {
    return null;
  }
}

export async function saveOrder(page: string, ids: string[]) {
  const value = JSON.stringify(ids);
  await prisma.siteSetting.upsert({ where: { key: key(page) }, update: { value }, create: { key: key(page), value } });
}

export async function clearOrder(page: string) {
  await prisma.siteSetting.deleteMany({ where: { key: key(page) } });
}

/**
 * The order the home page has always used: hero, strips under the hero, categories, strips under categories,
 * featured products, bundles, strips under featured, editorial, banner, custom sections, reviews, bottom strips.
 */
export function defaultOrder<T extends Sec>(sections: T[]): T[] {
  const byType = (type: string) => sections.filter((s) => s.type === type);
  const first = (type: string) => byType(type).slice(0, 1);
  const strips = (pos: string) =>
    byType("marquee").filter((s) => (parseJson<Record<string, string>>(s.content, {}).position || "hero") === pos);
  const out = [
    ...first("hero"), ...strips("hero"),
    ...first("categories"), ...strips("categories"),
    ...first("featured"), ...first("bundles"), ...strips("featured"),
    ...first("editorial"), ...first("banner"),
    ...byType("custom"), ...byType("reviews"), ...strips("bottom"),
  ];
  const seen = new Set(out.map((s) => s.id));
  return [...out, ...sections.filter((s) => !seen.has(s.id))];
}

/** Sections in the saved order; sections added later (not in the saved list) go at the end. */
export function applyOrder<T extends Sec>(sections: T[], saved: string[] | null, groupByType = true): T[] {
  // only the home page has a built-in layout; other pages keep the Sort Order they already have
  const fallback = (rows: T[]) => (groupByType ? defaultOrder(rows) : rows);
  if (!saved) return fallback(sections);
  const byId = new Map(sections.map((s) => [s.id, s]));
  const listed = saved.map((id) => byId.get(id)).filter((s): s is T => !!s);
  const inList = new Set(listed.map((s) => s.id));
  return [...listed, ...fallback(sections.filter((s) => !inList.has(s.id)))];
}
