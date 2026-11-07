import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, notes: { orderBy: { createdAt: "asc" } }, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { action, status, paymentStatus, rejectionReason, adminNotes, note } = await req.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "accept-payment") {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { paymentStatus: "VERIFIED", status: "CONFIRMED" },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId: id, status: "CONFIRMED", note: "Payment verified by admin" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject-payment") {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { paymentStatus: "REJECTED", rejectionReason, status: "PAYMENT_REJECTED" },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId: id, status: "PAYMENT_REJECTED", note: rejectionReason },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "update-status" && status) {
    await prisma.$transaction([
      prisma.order.update({ where: { id }, data: { status } }),
      prisma.orderStatusHistory.create({ data: { orderId: id, status, note: note || undefined } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "add-note" && note) {
    await prisma.orderNote.create({ data: { orderId: id, content: note, isAdmin: true } });
    return NextResponse.json({ ok: true });
  }

  if (action === "update-admin-notes") {
    await prisma.order.update({ where: { id }, data: { adminNotes } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
