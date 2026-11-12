import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { TEXT_DEFAULTS, TEXT_DEFS, normalizeSections } from "@/lib/texts";
import { normalizeTextStyles } from "@/lib/fonts";

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
    if (TEXT_DEFS.find((d) => d.key === key)?.kind === "sections") {
      // a list of {title, body} blocks: store only a cleaned-up copy
      let parsed: unknown = [];
      try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { /* treated as empty */ }
      const clean = normalizeSections(parsed);
      if (clean.length === 0) removes.push(key);
      else upserts.push({ key, value: JSON.stringify(clean) });
      continue;
    }
    const value = String(raw ?? "").replace(/\r\n/g, "\n").trim().slice(0, 3000);
    if (!value || value === TEXT_DEFAULTS[key]) removes.push(key);
    else upserts.push({ key, value });
  }

  // font / bold / underline chosen for individual texts
  if (body && "styles" in body) {
    const styles = normalizeTextStyles(body.styles, (k) => k in TEXT_DEFAULTS);
    if (Object.keys(styles).length === 0) {
      await prisma.siteSetting.deleteMany({ where: { key: "textStyles" } });
    } else {
      const value = JSON.stringify(styles);
      await prisma.siteSetting.upsert({ where: { key: "textStyles" }, update: { value }, create: { key: "textStyles", value } });
    }
  }

  await prisma.$transaction([
    prisma.siteText.deleteMany({ where: { key: { in: removes } } }),
    ...upserts.map((u) =>
      prisma.siteText.upsert({ where: { key: u.key }, update: { value: u.value }, create: u })
    ),
  ]);
  return NextResponse.json({ saved: upserts.length, reset: removes.length });
}
