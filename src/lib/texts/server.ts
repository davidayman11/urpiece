import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { TEXT_DEFAULTS, AR_DEFAULTS, formatText, type TFunction } from "./index";
import { stripRich } from "@/lib/rich";
import { getLang } from "@/lib/lang-server";
import type { Lang } from "@/lib/lang";

/** Admin edits of Arabic texts are stored under "ar:<key>"; English edits under "<key>". */
export const AR_PREFIX = "ar:";

/** Defaults + whatever the admin changed, for one language. Cached for the duration of one request. */
const load = cache(async (lang: Lang): Promise<Record<string, string>> => {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.siteText.findMany();
  } catch {
    // table not there yet / database hiccup: the site must still render with the defaults
  }
  // Arabic: the Arabic default if we have one, otherwise the English text (so nothing is ever blank)
  const out: Record<string, string> = lang === "ar" ? { ...TEXT_DEFAULTS, ...AR_DEFAULTS } : { ...TEXT_DEFAULTS };
  for (const r of rows) {
    const isAr = r.key.startsWith(AR_PREFIX);
    if ((lang === "ar") !== isAr) continue;
    const key = isAr ? r.key.slice(AR_PREFIX.length) : r.key;
    if (key in TEXT_DEFAULTS) out[key] = r.value;
  }
  return out;
});

/** Texts for a language (defaults to the visitor's language). */
export async function getTexts(lang?: Lang): Promise<Record<string, string>> {
  return load(lang ?? (await getLang()));
}

/** Server components / route handlers:  const t = await getT();  t("cart.title")  t("cart.add", { amount }) */
export async function getT(lang?: Lang): Promise<TFunction> {
  const texts = await getTexts(lang);
  return (key, vars) => formatText(stripRich(texts[key] ?? TEXT_DEFAULTS[key] ?? key), vars);
}
