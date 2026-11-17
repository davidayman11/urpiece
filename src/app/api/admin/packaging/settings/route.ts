import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPackagingSettings } from "@/lib/packaging-settings";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await getPackagingSettings());
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const value = JSON.stringify({ oneFree: body?.oneFree !== false });
  await prisma.siteSetting.upsert({ where: { key: "packaging" }, update: { value }, create: { key: "packaging", value } });
  return NextResponse.json({ ok: true });
}
