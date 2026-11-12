import type { TextDef } from "./types";
import { chromeTexts } from "./chrome";
import { homeTexts } from "./home";
import { catalogTexts } from "./catalog";
import { productTexts } from "./product";
import { cartTexts } from "./cart";
import { checkoutTexts } from "./checkout";
import { accountTexts } from "./account";
import { ordersTexts } from "./orders";

/** Every text on the storefront that the admin can change. Add new texts to the file for their area. */
export const TEXT_DEFS: TextDef[] = [
  ...chromeTexts, ...homeTexts, ...catalogTexts, ...productTexts,
  ...cartTexts, ...checkoutTexts, ...accountTexts, ...ordersTexts,
];

export const TEXT_DEFAULTS: Record<string, string> = Object.fromEntries(TEXT_DEFS.map((d) => [d.key, d.default]));

export { formatText } from "./types";
export { parseSections, normalizeSections } from "./types";
export type { TextDef, TFunction, TextVars, TextSection } from "./types";
