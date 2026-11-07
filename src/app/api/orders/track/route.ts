import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const orders = await prisma.order.findMany({
    where: { customerEmail: email.toLowerCase() },
    include: { items: { select: { productName: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}
