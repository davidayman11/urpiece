import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const zones = await prisma.shippingZone.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }],
    select: { city: true, price: true },
  });
  return NextResponse.json(zones);
}
