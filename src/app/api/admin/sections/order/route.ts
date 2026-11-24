import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { saveOrder, clearOrder } from "@/lib/section-order";

/** Save the order of a page's sections (ids from top to bottom). An empty list goes back to the default layout. */
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { pageSlug, ids } = await req.json();
  const page = String(pageSlug || "");
  if (!page) return NextResponse.json({ error: "Missing page" }, { status: 400 });
  if (!Array.isArray(ids) || ids.length === 0) {
    await clearOrder(page);
    return NextResponse.json({ ok: true, reset: true });
  }
  const valid = await prisma.siteSection.findMany({ where: { pageSlug: page, id: { in: ids.map(String) } }, select: { id: true } });
  const ok = new Set(valid.map((s) => s.id));
  await saveOrder(page, ids.map(String).filter((id: string) => ok.has(id)));
  return NextResponse.json({ ok: true });
}
