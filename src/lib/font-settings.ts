import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { normalizeFontConfig, normalizeTextStyles, type FontConfig, type TextStyles } from "@/lib/fonts";
import { TEXT_DEFAULTS } from "@/lib/texts";

const parse = (raw: string | undefined): unknown => { try { return JSON.parse(raw || "null"); } catch { return null; } };

/** Saved font choices (per section) and per-text styles. Cached for one request; falls back to "nothing set". */
export const getFontSettings = cache(async (): Promise<{ config: FontConfig; styles: TextStyles }> => {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.siteSetting.findMany({ where: { key: { in: ["fonts", "textStyles"] } } });
  } catch { /* table not there yet: the site renders with the default fonts */ }
  const by = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    config: normalizeFontConfig(parse(by.fonts)),
    styles: normalizeTextStyles(parse(by.textStyles), (k) => k in TEXT_DEFAULTS),
  };
});
