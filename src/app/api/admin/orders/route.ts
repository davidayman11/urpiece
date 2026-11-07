import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q");

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ orderNumber: { contains: q } }, { customerName: { contains: q } }, { customerEmail: { contains: q } }] } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
