import type { TextDef } from "./types";

const G = "Cart";

export const cartTexts: TextDef[] = [
  { key: "cart.empty.title", group: G, label: "Cart (empty) — heading", default: "Your cart is empty" },
  { key: "cart.empty.subtitle", group: G, label: "Cart (empty) — subtitle", default: "Discover our curated pieces and find your glow." },
  { key: "cart.empty.shopNow", group: G, label: "Cart (empty) — Shop Now button", default: "Shop Now" },
  { key: "cart.title", group: G, label: "Cart — page heading", default: "Your Cart" },
  { key: "cart.item.bundle", group: G, label: "Cart — Bundle tag on an item", default: "Bundle" },
  { key: "cart.clear", group: G, label: "Cart — Clear cart button", default: "Clear cart" },
  { key: "cart.clearConfirm", group: G, label: "Cart — Clear cart confirmation question", default: "Remove all items from your cart?" },
  { key: "cart.item.remove", group: G, label: "Cart — Remove button", default: "Remove" },
  { key: "cart.summary.title", group: G, label: "Cart — Order Summary heading", default: "Order Summary" },
  { key: "cart.summary.subtotal", group: G, label: "Cart — Subtotal label", default: "Subtotal" },
  { key: "cart.summary.packaging", group: G, label: "Cart — Packaging label (also on each item)", default: "Packaging" },
  { key: "cart.summary.shipping", group: G, label: "Cart — Shipping label", default: "Shipping" },
  { key: "cart.summary.free", group: G, label: "Cart — Free shipping value", default: "Free" },
  { key: "cart.summary.calculatedAtCheckout", group: G, label: "Cart — Shipping calculated at checkout", default: "Calculated at checkout" },
  { key: "cart.summary.freeUnlocked", group: G, label: "Cart — Free shipping unlocked message", default: "You've unlocked free shipping!" },
  { key: "cart.summary.addMoreForFree", group: G, label: "Cart — Add more for free shipping message", default: "Add {amount} more for free shipping" },
  { key: "cart.summary.total", group: G, label: "Cart — Total label", default: "Total" },
  { key: "cart.summary.checkoutButton", group: G, label: "Cart — Proceed to Checkout button", default: "Proceed to Checkout" },
  { key: "cart.summary.continueShopping", group: G, label: "Cart — Continue Shopping link", default: "Continue Shopping" },
];
