import type { TextDef } from "./types";

const G = "Product page";

export const productTexts: TextDef[] = [
  { key: "product.outOfStock", group: G, label: "Out of stock badge", default: "Out of Stock" },
  { key: "product.lowStock", group: G, label: "Low stock badge ({count} = pieces left)", default: "Low Stock — only {count} left" },
  { key: "product.viewSingular", group: G, label: "Word after the view count when it is 1", default: "view" },
  { key: "product.viewPlural", group: G, label: "Word after the view count when it is more than 1", default: "views" },
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
