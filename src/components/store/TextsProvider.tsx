"use client";

import { createContext, useContext } from "react";
import { TEXT_DEFAULTS, formatText, type TFunction, type TextVars } from "@/lib/texts";
import { textStyleToCss, type TextStyles } from "@/lib/fonts";

interface Ctx { texts: Record<string, string>; styles: TextStyles }
const TextsCtx = createContext<Ctx>({ texts: TEXT_DEFAULTS, styles: {} });

/** Gives client components the editable texts (and their font / bold / underline). Mounted once in the store layout. */
export function TextsProvider({ texts, styles = {}, children }: { texts: Record<string, string>; styles?: TextStyles; children: React.ReactNode }) {
  return <TextsCtx.Provider value={{ texts, styles }}>{children}</TextsCtx.Provider>;
}

/** Client components:  const t = useT();  t("checkout.continue")  t("cart.add", { amount }) — plain strings */
export function useT(): TFunction {
  const { texts } = useContext(TextsCtx);
  return (key, vars) => formatText(texts[key] ?? TEXT_DEFAULTS[key] ?? key, vars);
}

/**
 * A text shown on the page:  <Txt k="cart.title" />  or  <Txt k="cart.add" vars={{ amount }} />
 * Looks exactly like plain text unless the admin gave it a font / bold / underline in Site Text.
 */
export function Txt({ k, vars }: { k: string; vars?: TextVars }) {
  const { texts, styles } = useContext(TextsCtx);
  const text = formatText(texts[k] ?? TEXT_DEFAULTS[k] ?? k, vars);
  const css = textStyleToCss(styles[k]);
  return css ? <span style={css}>{text}</span> : <>{text}</>;
}
