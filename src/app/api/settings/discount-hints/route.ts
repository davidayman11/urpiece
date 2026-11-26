import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Public: the automatic "buy N products, get a discount" rules that are on right now (for the cart message). */
export async function GET() {
  const now = new Date();
  const rules = await prisma.discountRule.findMany({
      where: { isActive: true, minItems: { gt: 0 }, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      orderBy: { minItems: "asc" },
      select: { minItems: true, minAmount: true, type: true, value: true },
    });
  return NextResponse.json({ rules });
}
