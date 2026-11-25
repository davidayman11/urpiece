import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 8;
const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 30) : []);
const catsOf = (p: { categoryId: string | null; categoryIds: string }) => {
  let list: string[] = [];
  try { const j = JSON.parse(p.categoryIds || "[]"); if (Array.isArray(j)) list = j; } catch { /* ignore */ }
  if (p.categoryId) list.push(p.categoryId);
  return [...new Set(list)];
};

/**
 * Suggestions from what the visitor viewed (newest first) and has in the cart.
 * Same-category items score highest (cart counts more than viewed); popular / featured items fill the rest.
 */
export async function POST(req: NextRequest) {
  let body: { viewed?: unknown; cart?: unknown; exclude?: unknown } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const viewed = ids(body.viewed);
  const cart = ids(body.cart);
  const exclude = new Set([...ids(body.exclude), ...cart]);

  const sources = await prisma.product.findMany({
    where: { id: { in: [...new Set([...viewed, ...cart])] } },
    select: { id: true, categoryId: true, categoryIds: true },
  });
  const weight = new Map<string, number>(); // category -> interest
  const bump = (id: string, w: number) => {
    const p = sources.find((s) => s.id === id);
    if (p) for (const c of catsOf(p)) weight.set(c, (weight.get(c) || 0) + w);
  };
  viewed.forEach((id, i) => bump(id, Math.max(1, 3 - i * 0.3)));
  cart.forEach((id) => bump(id, 4));

  const candidates = await prisma.product.findMany({
    where: { isActive: true, id: { notIn: [...exclude, ...viewed.slice(0, 1)] }, variants: { some: { isActive: true, inventory: { gt: 0 } } } },
    include: { variants: { where: { isActive: true } }, category: true },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    take: 120,
  });

  const scored = candidates.map((p, i) => {
    const interest = catsOf(p).reduce((a, c) => a + (weight.get(c) || 0), 0);
    const seen = viewed.includes(p.id) ? -2 : 0; // seen before: still allowed, but new items first
    return { p, score: interest * 10 + (p.isFeatured ? 2 : 0) + seen + (candidates.length - i) / candidates.length };
  });
  scored.sort((a, b) => b.score - a.score);
  return NextResponse.json({ products: scored.slice(0, LIMIT).map((x) => x.p) });
}
