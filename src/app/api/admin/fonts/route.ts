import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeFontConfig } from "@/lib/fonts";

/** Save the font chosen for each section of the site. Body: { areas: { [section]: { heading?, body? } } } */
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const config = normalizeFontConfig(await req.json().catch(() => ({})));
  if (Object.keys(config.areas).length === 0) {
    await prisma.siteSetting.deleteMany({ where: { key: "fonts" } });
  } else {
    const value = JSON.stringify(config);
    await prisma.siteSetting.upsert({ where: { key: "fonts" }, update: { value }, create: { key: "fonts", value } });
  }
  return NextResponse.json(config);
}
