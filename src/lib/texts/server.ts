import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { TEXT_DEFAULTS, formatText, type TFunction } from "./index";
import { stripRich } from "@/lib/rich";

/** Defaults + whatever the admin changed. Cached for the duration of one request. */
export const getTexts = cache(async (): Promise<Record<string, string>> => {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.siteText.findMany();
  } catch {
    // table not there yet / database hiccup: the site must still render with the defaults
  }
  const out: Record<string, string> = { ...TEXT_DEFAULTS };
  for (const r of rows) if (r.key in TEXT_DEFAULTS) out[r.key] = r.value;
  return out;
});

/** Server components / route handlers:  const t = await getT();  t("cart.title")  t("cart.add", { amount }) */
export async function getT(): Promise<TFunction> {
  const texts = await getTexts();
  return (key, vars) => formatText(stripRich(texts[key] ?? TEXT_DEFAULTS[key] ?? key), vars);
}
