import type { TextDef } from "./types";

const G = "Product page";

export const productTexts: TextDef[] = [
  { key: "product.outOfStock", group: G, label: "Out of stock badge", default: "Out of Stock" },
  { key: "product.lowStock", group: G, label: "Low stock badge ({count} = pieces left)", default: "Low Stock — only {count} left" },
  { key: "product.viewSingular", group: G, label: "Word after the view count when it is 1", default: "view" },
  { key: "product.viewPlural", group: G, label: "Word after the view count when it is more than 1", default: "views" },
  { key: "product.packaging.title", group: G, label: "Packaging — heading above the packaging choices", default: "Choose your packaging" },
  { key: "product.packaging.totalWith", group: G, label: "Packaging — total line (price + packaging)", default: "Total with packaging" },
  { key: "product.packaging.hint", group: G, label: "Packaging — hint under the heading", default: "Choose one or more, or none." },
  { key: "product.packaging.freeAbove", group: G, label: "Packaging — note when it is free on bigger items ({amount})", default: "Free on items {amount} or more" },
  { key: "product.packaging.oneFree", group: G, label: "Packaging — pick which package is free (shown when 2+ are chosen)", default: "One package is free. Choose which one:" },
  { key: "product.packaging.free", group: G, label: "Packaging — free option price", default: "Free" },
  { key: "product.shipping.title", group: G, label: "Shipping & Returns — heading", default: "Shipping & Returns" },
  {
    key: "product.shipping.body", group: G, label: "Shipping & Returns — text", multiline: true,
    default: "Orders are shipped within 2–5 business days. Contact us for returns within 7 days of receipt.",
  },
  { key: "product.care.title", group: G, label: "Care Instructions — heading", default: "Care Instructions" },
  {
    key: "product.care.body", group: G, label: "Care Instructions — text", multiline: true,
    default: "Store in a cool, dry place away from direct sunlight. Clean gently with a soft cloth.",
  },
  {
    key: "product.extraSections", group: G, kind: "sections", default: "[]",
    label: "Extra boxes under the product (add your own, e.g. Warranty or Size guide)",
  },
];
