"use client";

import { createContext, useContext } from "react";
import { TEXT_DEFAULTS, formatText, type TFunction, type TextVars } from "@/lib/texts";
import { textStyleToCss, type TextStyles } from "@/lib/fonts";
import { stripRich } from "@/lib/rich";
import type { Lang } from "@/lib/lang";
import RichText from "@/components/RichText";

interface Ctx { texts: Record<string, string>; styles: TextStyles; lang: Lang }
const TextsCtx = createContext<Ctx>({ texts: TEXT_DEFAULTS, styles: {}, lang: "en" });

/** Gives client components the editable texts (and their font / bold / underline). Mounted once in the store layout. */
export function TextsProvider({ texts, styles = {}, lang = "en", children }: { texts: Record<string, string>; styles?: TextStyles; lang?: Lang; children: React.ReactNode }) {
  return <TextsCtx.Provider value={{ texts, styles, lang }}>{children}</TextsCtx.Provider>;
}

/** The language the visitor is viewing the store in. */
export function useLang(): Lang {
  return useContext(TextsCtx).lang;
}

/** Client components:  const t = useT();  t("checkout.continue")  t("cart.add", { amount }) — plain strings */
export function useT(): TFunction {
  const { texts } = useContext(TextsCtx);
  // plain strings never show formatting markers (they cannot display bold / underline)
  return (key, vars) => formatText(stripRich(texts[key] ?? TEXT_DEFAULTS[key] ?? key), vars);
}

/**
 * A text shown on the page:  <Txt k="cart.title" />  or  <Txt k="cart.add" vars={{ amount }} />
 * Looks exactly like plain text unless the admin gave it a font / bold / underline in Site Text.
 */
export function Txt({ k, vars }: { k: string; vars?: TextVars }) {
  const { texts, styles, lang } = useContext(TextsCtx);
  // a Latin-only font chosen in Site Text has no Arabic letters, so it is skipped in the Arabic version
  const style = styles[k] && lang === "ar" ? { ...styles[k], font: undefined } : styles[k];
  return <RichText text={texts[k] ?? TEXT_DEFAULTS[k] ?? k} vars={vars} style={textStyleToCss(style)} />;
}
