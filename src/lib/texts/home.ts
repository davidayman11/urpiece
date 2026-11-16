import type { TextDef } from "./types";

const H = "Home page";
const A = "About page";
const C = "Contact page";

export const homeTexts: TextDef[] = [
  { key: "home.hero.scroll", group: H, label: "Hero — \"scroll down\" hint under the banner", default: "Scroll" },
  { key: "home.hero.imageAlt", group: H, label: "Hero — background image alt text", default: "Hero" },
  { key: "home.categories.shopNow", group: H, label: "Category cards — Shop Now hover text", default: "Shop Now" },
  { key: "home.marquee.region", group: H, label: "Scrolling strip — screen reader label", default: "Highlights" },

  { key: "reviews.prev", group: H, label: "Reviews photos — previous arrow (screen reader)", default: "Previous" },
  { key: "reviews.next", group: H, label: "Reviews photos — next arrow (screen reader)", default: "Next" },
  { key: "reviews.close", group: H, label: "Reviews photos — close enlarged photo (screen reader)", default: "Close" },

  { key: "about.metaTitle", group: A, label: "Browser tab title", default: "About" },

  { key: "contact.metaTitle", group: C, label: "Browser tab title", default: "Contact" },
  { key: "contact.support.title", group: C, label: "Order Support box — heading", default: "Order Support" },
  { key: "contact.support.body", group: C, label: "Order Support box — text (email shown below)", multiline: true, default: "For order inquiries, tracking, or returns, email us at:" },
  { key: "contact.payment.title", group: C, label: "Payment box — heading", default: "Payment" },
  { key: "contact.shipping.title", group: C, label: "Shipping box — heading", default: "Shipping" },
];
