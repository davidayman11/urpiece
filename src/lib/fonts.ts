/**
 * Fonts the admin can pick from. Every name here was checked against Google Fonts, and
 * ONLY these names ever reach the page's CSS (nothing typed by the admin is inserted).
 */

export type FontCategory = "serif" | "sans" | "script" | "arabic";

export interface FontDef {
  name: string;
  category: FontCategory;
  /** weights requested from Google, e.g. "400;500;600" ("" = the font only has a regular weight) */
  weights: string;
  /** already loaded by the site layout (no extra download needed) */
  preloaded?: boolean;
}

export const FONT_CATALOG: FontDef[] = [
  // Serif
  { name: "Cormorant Garamond", category: "serif", weights: "", preloaded: true },
  { name: "Playfair Display", category: "serif", weights: "400;500;600" },
  { name: "Lora", category: "serif", weights: "400;500;600" },
  { name: "EB Garamond", category: "serif", weights: "400;500;600" },
  { name: "Cinzel", category: "serif", weights: "400;500;600" },
  { name: "Marcellus", category: "serif", weights: "" },
  { name: "Bodoni Moda", category: "serif", weights: "400;500;600" },
  { name: "DM Serif Display", category: "serif", weights: "" },
  { name: "Libre Baskerville", category: "serif", weights: "400;700" },
  // Sans-serif
  { name: "Jost", category: "sans", weights: "", preloaded: true },
  { name: "Inter", category: "sans", weights: "300;400;500;600" },
  { name: "Poppins", category: "sans", weights: "300;400;500;600" },
  { name: "Montserrat", category: "sans", weights: "300;400;500;600" },
  { name: "Lato", category: "sans", weights: "300;400;700" },
  { name: "Raleway", category: "sans", weights: "300;400;500;600" },
  { name: "Nunito Sans", category: "sans", weights: "300;400;600" },
  { name: "DM Sans", category: "sans", weights: "300;400;500" },
  { name: "Work Sans", category: "sans", weights: "300;400;500" },
  // Script / handwriting
  { name: "Great Vibes", category: "script", weights: "" },
  { name: "Dancing Script", category: "script", weights: "400;500;600" },
  { name: "Allura", category: "script", weights: "" },
  // Arabic (these also include Latin letters)
  { name: "Cairo", category: "arabic", weights: "300;400;500;600" },
  { name: "Tajawal", category: "arabic", weights: "300;400;500" },
  { name: "Almarai", category: "arabic", weights: "300;400;700" },
  { name: "IBM Plex Sans Arabic", category: "arabic", weights: "300;400;500;600" },
  { name: "El Messiri", category: "arabic", weights: "400;500;600" },
  { name: "Amiri", category: "arabic", weights: "400;700" },
  { name: "Noto Naskh Arabic", category: "arabic", weights: "400;500;600" },
  { name: "Reem Kufi", category: "arabic", weights: "400;500;600" },
];

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  serif: "Serif (classic, elegant)",
  sans: "Sans-serif (clean, modern)",
  script: "Script (handwritten)",
  arabic: "Arabic + Latin",
};

const BY_NAME = new Map(FONT_CATALOG.map((f) => [f.name, f]));
export const isCatalogFont = (name: unknown): name is string => typeof name === "string" && BY_NAME.has(name);

const FALLBACK: Record<FontCategory, string> = {
  serif: "Georgia, serif",
  sans: "system-ui, sans-serif",
  script: "cursive",
  arabic: "system-ui, sans-serif",
};

/** CSS font-family value for a catalog font, or "" if the name is not in the catalog. */
export function fontStack(name: string | undefined): string {
  const f = name ? BY_NAME.get(name) : undefined;
  return f ? `"${f.name}", ${FALLBACK[f.category]}` : "";
}

/* ------------------------------------------------------------------ sections of the site */

export interface FontArea { key: string; label: string; hint: string }

export const FONT_AREAS: FontArea[] = [
  { key: "site", label: "Whole website", hint: "Used everywhere unless a section below has its own font" },
  { key: "announce", label: "Announcement bar", hint: "The scrolling bar at the very top" },
  { key: "menu", label: "Menu bar & side menu", hint: "Logo, menu links, the slide-out menu" },
  { key: "hero", label: "Home — top banner", hint: "The big picture with the main title" },
  { key: "categories", label: "Home — Shop by Category", hint: "" },
  { key: "featured", label: "Home — Featured products", hint: "" },
  { key: "bundles", label: "Bundles (home section + bundle pages)", hint: "" },
  { key: "banner", label: "Home — wide banner", hint: "" },
  { key: "editorial", label: "Home — picture + text section", hint: "" },
  { key: "strip", label: "Scrolling strip", hint: "The moving line with small icons" },
  { key: "shop", label: "Shop page", hint: "Product list and filters" },
  { key: "product", label: "Product page", hint: "Title, price, description, boxes below" },
  { key: "cart", label: "Cart", hint: "" },
  { key: "checkout", label: "Checkout", hint: "Details, payment and review" },
  { key: "account", label: "Sign in / Sign up / My account", hint: "" },
  { key: "orders", label: "Orders (list, order page, find my order)", hint: "" },
  { key: "about", label: "About page", hint: "" },
  { key: "contact", label: "Contact page", hint: "" },
  { key: "footer", label: "Footer", hint: "" },
  { key: "popup", label: "Popups", hint: "" },
];
const AREA_KEYS = new Set(FONT_AREAS.map((a) => a.key));

/* ------------------------------------------------------------------ settings shapes */

export interface AreaFonts { heading?: string; body?: string }
export interface FontConfig { areas: Record<string, AreaFonts> }

/** Formatting of one individual text (set in Admin > Site Text). */
export interface TextStyle { font?: string; bold?: boolean; underline?: boolean }
export type TextStyles = Record<string, TextStyle>;

/** Keep only known sections and catalog fonts. */
export function normalizeFontConfig(input: unknown): FontConfig {
  const src = (input && typeof input === "object" ? (input as { areas?: unknown }).areas : undefined) as Record<string, AreaFonts> | undefined;
  const areas: Record<string, AreaFonts> = {};
  for (const [key, v] of Object.entries(src && typeof src === "object" ? src : {})) {
    if (!AREA_KEYS.has(key) || !v || typeof v !== "object") continue;
    const heading = isCatalogFont(v.heading) ? v.heading : undefined;
    const body = isCatalogFont(v.body) ? v.body : undefined;
    if (heading || body) areas[key] = { ...(heading ? { heading } : {}), ...(body ? { body } : {}) };
  }
  return { areas };
}

/** Keep only known text keys, catalog fonts and true flags; drop entries that change nothing. */
export function normalizeTextStyles(input: unknown, validKeys: Set<string> | ((k: string) => boolean)): TextStyles {
  const ok = typeof validKeys === "function" ? validKeys : (k: string) => validKeys.has(k);
  const out: TextStyles = {};
  for (const [key, v] of Object.entries(input && typeof input === "object" ? (input as TextStyles) : {})) {
    if (!ok(key) || !v || typeof v !== "object") continue;
    const s: TextStyle = {};
    if (isCatalogFont(v.font)) s.font = v.font;
    if (v.bold === true) s.bold = true;
    if (v.underline === true) s.underline = true;
    if (s.font || s.bold || s.underline) out[key] = s;
  }
  return out;
}

/* ------------------------------------------------------------------ CSS + Google link */

/**
 * CSS that applies the chosen fonts. Variables --site-font-heading / --site-font-body are read by
 * `.font-serif` (headings) and the page body (see globals.css); each section only overrides what was set.
 */
export function buildFontCss(config: FontConfig): string {
  const rules: string[] = [];
  for (const area of FONT_AREAS) {
    const f = config.areas[area.key];
    if (!f) continue;
    const decl: string[] = [];
    const h = fontStack(f.heading);
    const b = fontStack(f.body);
    if (h) decl.push(`--site-font-heading:${h}`);
    if (b) decl.push(`--site-font-body:${b}`);
    if (decl.length === 0) continue;
    if (area.key === "site") {
      rules.push(`:root{${decl.join(";")}}`);
    } else {
      rules.push(`[data-font-area="${area.key}"]{${decl.join(";")};font-family:var(--site-font-body)}`);
    }
  }
  return rules.join("\n");
}

/** Every catalog font used by the sections or by individual text styles, minus the ones already loaded. */
export function fontsInUse(config: FontConfig, styles: TextStyles): string[] {
  const used = new Set<string>();
  for (const f of Object.values(config.areas)) { if (f.heading) used.add(f.heading); if (f.body) used.add(f.body); }
  for (const s of Object.values(styles)) if (s.font) used.add(s.font);
  return [...used].filter((n) => !BY_NAME.get(n)?.preloaded).sort();
}

/** One Google Fonts stylesheet URL for the given catalog font names ("" if none). */
export function buildFontsUrl(names: string[]): string {
  const parts = names
    .map((n) => BY_NAME.get(n))
    .filter((f): f is FontDef => !!f)
    .map((f) => `family=${f.name.replace(/ /g, "+")}${f.weights ? `:wght@${f.weights}` : ""}`);
  return parts.length ? `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap` : "";
}

/** Inline style for one styled text (used by <Txt>). Returns undefined when nothing is set. */
export function textStyleToCss(s: TextStyle | undefined): React.CSSProperties | undefined {
  if (!s) return undefined;
  const css: React.CSSProperties = {};
  const stack = fontStack(s.font);
  if (stack) css.fontFamily = stack;
  if (s.bold) css.fontWeight = 700;
  if (s.underline) { css.textDecoration = "underline"; css.textUnderlineOffset = "0.2em"; }
  return Object.keys(css).length ? css : undefined;
}
