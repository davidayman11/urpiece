import type { TextDef } from "./types";

const M = "Menu";
const F = "Footer";
const P = "Popup";

export const chromeTexts: TextDef[] = [
  { key: "nav.brand", group: M, label: "Brand name (menu bar and drawer)", default: "UrPiece" },
  { key: "nav.openMenu", group: M, label: "Hamburger button — screen reader label", default: "Open menu" },
  { key: "nav.closeMenu", group: M, label: "Drawer close button — screen reader label", default: "Close menu" },
  { key: "nav.menu.home", group: M, label: "Menu — Home link", default: "Home" },
  { key: "nav.menu.shop", group: M, label: "Menu — Shop link", default: "Shop" },
  { key: "nav.menu.bundles", group: M, label: "Menu — Bundles link", default: "Bundles" },
  { key: "nav.menu.about", group: M, label: "Menu — About link", default: "About" },
  { key: "nav.menu.contact", group: M, label: "Menu — Contact link", default: "Contact" },
  { key: "nav.menu.orders", group: M, label: "Menu — My Orders link", default: "My Orders" },
  { key: "nav.account", group: M, label: "Account icon — label when signed in", default: "My account" },
  { key: "nav.signIn", group: M, label: "Sign in (icon label and drawer link)", default: "Sign in" },
  { key: "nav.greeting", group: M, label: "Account icon tooltip when signed in ({name} = first name)", default: "Hi, {name}" },
  { key: "nav.cart", group: M, label: "Cart icon — label", default: "Cart" },
  { key: "nav.drawer.greetingAccount", group: M, label: "Drawer — signed-in link ({name} = first name)", default: "Hi, {name} · My account" },
  { key: "nav.drawer.createAccount", group: M, label: "Drawer — Create account link", default: "Create account" },
  { key: "nav.drawer.collections", group: M, label: "Drawer — Collections heading", default: "Collections" },
  { key: "nav.drawer.necklaces", group: M, label: "Drawer — Necklaces link", default: "Necklaces" },
  { key: "nav.drawer.earrings", group: M, label: "Drawer — Earrings link", default: "Earrings" },
  { key: "nav.drawer.rings", group: M, label: "Drawer — Rings link", default: "Rings" },
  { key: "nav.drawer.bracelets", group: M, label: "Drawer — Bracelets link", default: "Bracelets" },
  { key: "announce.region", group: M, label: "Announcement bar — screen reader label", default: "Announcements" },

  { key: "footer.brand", group: F, label: "Footer — brand name", default: "UrPiece" },
  { key: "footer.tagline", group: F, label: "Footer — tagline (used if not set in site settings)", default: "Your Glow, Your Piece" },
  {
    key: "footer.brandDescription", group: F, label: "Footer — brand description (used if not set in site settings)", multiline: true,
    default: "Premium jewelry and accessories curated for the woman who knows her worth.",
  },
  { key: "footer.contactEmail", group: F, label: "Footer — contact email (used if not set in site settings)", default: "hello@urpiece.com" },
  { key: "footer.paymentNote", group: F, label: "Footer — payment note (used if not set in site settings)", default: "Payment via InstaPay" },
  { key: "footer.shippingNote", group: F, label: "Footer — shipping note (used if not set in site settings)", default: "Orders shipped within 2–5 business days" },
  { key: "footer.copyright", group: F, label: "Footer — copyright ({year} = current year; used if not set in site settings)", default: "© {year} UrPiece. All rights reserved." },
  { key: "footer.navigate", group: F, label: "Footer — Navigate column heading", default: "Navigate" },
  { key: "footer.contact", group: F, label: "Footer — Contact column heading", default: "Contact" },
  { key: "footer.link.shop", group: F, label: "Footer — Shop link", default: "Shop" },
  { key: "footer.link.about", group: F, label: "Footer — About link (column and bottom bar)", default: "About" },
  { key: "footer.link.contact", group: F, label: "Footer — Contact link (column and bottom bar)", default: "Contact" },
  { key: "footer.link.orders", group: F, label: "Footer — My Orders link", default: "My Orders" },

  { key: "popup.close", group: P, label: "Popup — close (X) button screen reader label", default: "Close" },
  { key: "popup.imageAlt", group: P, label: "Popup — image alt text", default: "Promo" },
  { key: "popup.noThanks", group: P, label: "Popup — dismiss link", default: "No thanks" },

  { key: "site.title", group: "Browser tab & search results", label: "Site name shown in the browser tab and on every page title", default: "UrPiece" },
  { key: "site.description", group: "Browser tab & search results", label: "Site description shown in Google / when the link is shared", default: "Premium jewelry and accessories.", multiline: true },
];
