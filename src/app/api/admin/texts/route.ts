import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { TEXT_DEFAULTS } from "@/lib/texts";

/**
 * Save the texts the admin edited. Body: { values: { [key]: string } }.
 * A value that is empty or equal to the default removes the override (the default is used again).
 */
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const values: Record<string, unknown> = body?.values && typeof body.values === "object" ? body.values : {};

  const upserts: { key: string; value: string }[] = [];
  const removes: string[] = [];
  for (const [key, raw] of Object.entries(values)) {
    if (!(key in TEXT_DEFAULTS)) continue; // ignore unknown keys
    const value = String(raw ?? "").replace(/\r\n/g, "\n").trim().slice(0, 3000);
    if (!value || value === TEXT_DEFAULTS[key]) removes.push(key);
    else upserts.push({ key, value });
  }

  await prisma.$transaction([
    prisma.siteText.deleteMany({ where: { key: { in: removes } } }),
    ...upserts.map((u) =>
      prisma.siteText.upsert({ where: { key: u.key }, update: { value: u.value }, create: u })
    ),
  ]);
  return NextResponse.json({ saved: upserts.length, reset: removes.length });
}
