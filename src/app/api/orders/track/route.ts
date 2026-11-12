import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/texts/server";

/**
 * A guest finds their order with the order number AND the email used at checkout.
 * Returns the private link for that order. Never lists orders; the same message is returned
 * whether the number or the email was wrong.
 */
export async function POST(req: NextRequest) {
  const t = await getT();
  const body = await req.json().catch(() => ({}));
  const orderNumber = String(body.orderNumber || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();
  const notFound = () => NextResponse.json({ error: t("orders.track.notFound") }, { status: 404 });
  if (!orderNumber || !email) return notFound();

  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true, customerEmail: true, accessToken: true } });
  if (!order || order.customerEmail.trim().toLowerCase() !== email) return notFound();

  // Orders placed before guest links existed get a token the first time they are looked up
  const token = order.accessToken || randomBytes(16).toString("hex");
  if (!order.accessToken) await prisma.order.update({ where: { id: order.id }, data: { accessToken: token } });
  return NextResponse.json({ url: `/orders/${encodeURIComponent(orderNumber)}?t=${token}` });
}
