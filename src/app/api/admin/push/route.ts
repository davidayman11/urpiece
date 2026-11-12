import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPublicKey } from "@/lib/push";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json({ publicKey: await getPublicKey() });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  await prisma.pushSubscription.upsert({
    where: { endpoint: String(endpoint) },
    update: { p256dh: String(keys.p256dh), auth: String(keys.auth) },
    create: { endpoint: String(endpoint), p256dh: String(keys.p256dh), auth: String(keys.auth) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { endpoint } = await req.json();
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint: String(endpoint) } });
  return NextResponse.json({ ok: true });
}
