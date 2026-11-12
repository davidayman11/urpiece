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
}

export type TextVars = Record<string, string | number>;

/** Replaces {name} placeholders: format("Add {amount} more", { amount: "EGP 50" }) */
export function formatText(text: string, vars?: TextVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type TFunction = (key: string, vars?: TextVars) => string;
