import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code, total } = await req.json();
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const now = new Date();
  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });

  if (!promo) return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
  if (!promo.isActive) return NextResponse.json({ error: "This code is no longer active" }, { status: 400 });
  if (promo.startsAt && promo.startsAt > now) return NextResponse.json({ error: "This code is not yet active" }, { status: 400 });
  if (promo.expiresAt && promo.expiresAt < now) return NextResponse.json({ error: "This code has expired" }, { status: 400 });
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return NextResponse.json({ error: "This code has reached its usage limit" }, { status: 400 });
  if (promo.minOrderAmount && total < promo.minOrderAmount) {
    return NextResponse.json({ error: `Minimum order of ${promo.minOrderAmount} required` }, { status: 400 });
  }

  let discount = 0;
  if (promo.discountType === "PERCENTAGE") {
    discount = (total * promo.discountValue) / 100;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  } else {
    discount = promo.discountValue;
  }

  return NextResponse.json({ code: promo.code, discount: Math.round(discount * 100) / 100 });
}
