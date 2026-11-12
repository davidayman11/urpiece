import type { TextDef } from "./types";

const S = "Shop page";
const C = "Product cards & buy box";
const B = "Bundles";

export const catalogTexts: TextDef[] = [
  { key: "shop.meta.title", group: S, label: "Shop — Browser tab title", default: "Shop" },
  { key: "shop.banner.allCollections", group: S, label: "Shop — Banner small heading (no category)", default: "All Collections" },
  { key: "shop.banner.title", group: S, label: "Shop — Main heading", default: "Shop" },
  { key: "shop.count.one", group: S, label: "Shop — Piece count (1 item)", default: "{count} piece" },
  { key: "shop.count.many", group: S, label: "Shop — Piece count (several items)", default: "{count} pieces" },
  { key: "shop.empty.title", group: S, label: "Shop — No results title", default: "No pieces found" },
  { key: "shop.empty.text", group: S, label: "Shop — No results text", default: "Try a different filter or search term." },
  { key: "shop.filters.all", group: S, label: "Shop filters — All button", default: "All" },
  { key: "shop.filters.sortNewest", group: S, label: "Shop filters — Sort: Newest", default: "Newest" },
  { key: "shop.filters.sortPriceAsc", group: S, label: "Shop filters — Sort: price low to high", default: "Price: Low–High" },
  { key: "shop.filters.sortPriceDesc", group: S, label: "Shop filters — Sort: price high to low", default: "Price: High–Low" },

  { key: "card.viewPiece", group: C, label: "Product card — Hover label", default: "View Piece" },
  { key: "card.outOfStock", group: C, label: "Product card — Out of stock badge", default: "Out of Stock" },
  { key: "card.lowStock", group: C, label: "Product card — Low stock badge", default: "Low Stock" },
  { key: "card.featured", group: C, label: "Product card — Featured badge", default: "Featured" },
  { key: "buy.noVariants", group: C, label: "Buy box — Product has no variants", default: "This product has no variants available." },
  { key: "buy.variantOutOfStock", group: C, label: "Buy box — Variant out of stock", default: "This variant is out of stock" },
  { key: "buy.lowStock", group: C, label: "Buy box — Low stock warning", default: "Only {count} left — order soon" },
  { key: "buy.soldOut", group: C, label: "Buy box — Sold out button", default: "Sold Out" },
  { key: "buy.added", group: C, label: "Buy box — Added to cart button", default: "Added ✓" },
  { key: "buy.addToCart", group: C, label: "Buy box — Add to cart button", default: "Add to Cart" },

  { key: "bundle.card.badge", group: B, label: "Bundle card — Bundle badge", default: "Bundle" },
  { key: "bundle.card.save", group: B, label: "Bundle card — Save percent badge", default: "Save {pct}%" },
  { key: "bundle.card.outOfStock", group: B, label: "Bundle card — Out of stock badge", default: "Out of stock" },
  { key: "bundle.card.pieces", group: B, label: "Bundle card — Number of pieces", default: "{count} pieces" },
  { key: "bundle.card.from", group: B, label: "Bundle card — 'From' prefix before price", default: "From " },
  { key: "bundle.buy.save", group: B, label: "Bundle buy box — Save amount badge", default: "Save {amount}" },
  { key: "bundle.buy.itemOutOfStock", group: B, label: "Bundle buy box — Item out of stock message", default: "One of the chosen items is out of stock." },
  { key: "bundle.buy.notEnough", group: B, label: "Bundle buy box — Not enough stock message", default: "Not enough stock for that quantity." },
  { key: "bundle.buy.less", group: B, label: "Bundle buy box — Decrease quantity (accessibility label)", default: "Less" },
  { key: "bundle.buy.more", group: B, label: "Bundle buy box — Increase quantity (accessibility label)", default: "More" },
  { key: "bundle.buy.added", group: B, label: "Bundle buy box — Added button", default: "Added to cart ✓" },
  { key: "bundle.buy.outOfStock", group: B, label: "Bundle buy box — Out of stock button", default: "Out of stock" },
  { key: "bundle.buy.add", group: B, label: "Bundle buy box — Add to cart button", default: "Add bundle to cart" },
  { key: "bundle.buy.viewCart", group: B, label: "Bundle buy box — View cart link", default: "View cart →" },
  { key: "bundle.list.metaTitle", group: B, label: "Bundles page — Browser tab title", default: "Bundles" },
  { key: "bundle.list.eyebrow", group: B, label: "Bundles page — Small heading", default: "Better together" },
  { key: "bundle.list.title", group: B, label: "Bundles page — Main heading", default: "Bundles" },
  { key: "bundle.list.subtitle", group: B, label: "Bundles page — Subtitle", default: "Curated sets at a special price." },
  { key: "bundle.list.empty", group: B, label: "Bundles page — No bundles message", default: "No bundles right now — check back soon." },
  { key: "bundle.page.metaFallback", group: B, label: "Bundle page — Browser tab title fallback", default: "Bundle" },
  { key: "bundle.page.badge", group: B, label: "Bundle page — Bundle badge on image", default: "Bundle" },
  { key: "bundle.page.pieces", group: B, label: "Bundle page — Pieces, one price", default: "{count} pieces, one price" },
];
