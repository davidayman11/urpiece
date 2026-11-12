"use client";

import { createContext, useContext } from "react";
import { TEXT_DEFAULTS, formatText, type TFunction } from "@/lib/texts";

const TextsCtx = createContext<Record<string, string>>(TEXT_DEFAULTS);

/** Gives client components the editable texts. Mounted once in the store layout. */
export function TextsProvider({ texts, children }: { texts: Record<string, string>; children: React.ReactNode }) {
  return <TextsCtx.Provider value={texts}>{children}</TextsCtx.Provider>;
}

/** Client components:  const t = useT();  t("checkout.continue")  t("cart.add", { amount }) */
export function useT(): TFunction {
  const texts = useContext(TextsCtx);
  return (key, vars) => formatText(texts[key] ?? TEXT_DEFAULTS[key] ?? key, vars);
}
