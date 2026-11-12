export interface TextDef {
  /** unique, dot-separated: "<area>.<place>.<what>", e.g. "product.shipping.title" */
  key: string;
  /** section in the Admin > Site Text page, e.g. "Product page" */
  group: string;
  /** what the admin sees, e.g. "Shipping & Returns — heading" */
  label: string;
  /** the text used until the admin changes it */
  default: string;
  /** show a big text box in the admin (for paragraphs) */
  multiline?: boolean;
  /** "sections" = a list of {title, body} blocks the admin can add, remove and reorder (stored as JSON) */
  kind?: "text" | "sections";
}

/** One extra block of text on a page (e.g. a "Warranty" box under a product). */
export interface TextSection { title: string; body: string }

const MAX_SECTIONS = 12;

/** Clean up whatever was typed: trims, drops empty blocks, limits sizes. Always returns a safe list. */
export function normalizeSections(input: unknown): TextSection[] {
  const list = Array.isArray(input) ? input : [];
  const out: TextSection[] = [];
  for (const raw of list) {
    const title = String((raw as TextSection)?.title ?? "").replace(/\r\n/g, "\n").trim().slice(0, 80);
    const body = String((raw as TextSection)?.body ?? "").replace(/\r\n/g, "\n").trim().slice(0, 3000);
    if (!title && !body) continue;
    out.push({ title, body });
    if (out.length >= MAX_SECTIONS) break;
  }
  return out;
}

/** Read the stored JSON text; bad / empty data gives an empty list. */
export function parseSections(raw?: string | null): TextSection[] {
  try { return normalizeSections(JSON.parse(raw || "[]")); } catch { return []; }
}

export type TextVars = Record<string, string | number>;

/** Replaces {name} placeholders: format("Add {amount} more", { amount: "EGP 50" }) */
export function formatText(text: string, vars?: TextVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type TFunction = (key: string, vars?: TextVars) => string;
