import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { parseJson } from "@/lib/utils";
import { truncateChars } from "@/lib/text-safe";

export const dynamic = "force-dynamic";

const STR_FIELDS = ["productId", "variantId", "productName", "variantName", "productNameAr", "variantNameAr", "image", "bundleId", "packagingName"] as const;

function sanitize(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const out: Record<string, string | number>[] = [];
  for (const r of raw.slice(0, 50)) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const item: Record<string, string | number> = {};
    for (const k of STR_FIELDS) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) item[k] = truncateChars(v.trim(), k === "image" ? 1000 : 200);
    }
    const price = Number(o.price);
    const qty = Math.floor(Number(o.quantity));
    if (!item.productName || !Number.isFinite(price) || price < 0 || !Number.isFinite(qty) || qty < 1) continue;
    item.price = price;
    item.quantity = Math.min(qty, 999);
    const pp = Number(o.packagingPrice);
    if (o.packagingPrice != null && Number.isFinite(pp) && pp >= 0) item.packagingPrice = pp;
    out.push(item);
  }
  return out;
}

export async function POST(req: NextRequest) {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const items = sanitize(body?.items);
  if (items.length === 0) {
    await prisma.customerCart.deleteMany({ where: { customerId: c.id } });
  } else {
    const data = JSON.stringify(items);
    await prisma.customerCart.upsert({
      where: { customerId: c.id },
      create: { customerId: c.id, items: data },
      update: { items: data },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const c = await getCustomer();
  if (!c) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const cart = await prisma.customerCart.findUnique({ where: { customerId: c.id } });
  return NextResponse.json({ items: cart ? parseJson<unknown[]>(cart.items, []) : [], updatedAt: cart?.updatedAt ?? null });
}
