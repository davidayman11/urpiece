/** Store languages. English is the default; the visitor's choice is remembered in a cookie. */
export type Lang = "en" | "ar";

export const LANG_COOKIE = "urpiece_lang";
export const LANGS: Lang[] = ["en", "ar"];

export const isLang = (v: unknown): v is Lang => v === "en" || v === "ar";
export const dirOf = (lang: Lang): "ltr" | "rtl" => (lang === "ar" ? "rtl" : "ltr");
