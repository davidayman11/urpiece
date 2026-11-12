import { arChrome } from "./chrome";
import { arHome } from "./home";
import { arCatalog } from "./catalog";
import { arProduct } from "./product";
import { arCart } from "./cart";
import { arCheckout } from "./checkout";
import { arAccount } from "./account";
import { arOrders } from "./orders";

/** Arabic default wording for every store text (key -> Arabic). A key missing here falls back to English. */
export const AR_DEFAULTS: Record<string, string> = {
  ...arChrome, ...arHome, ...arCatalog, ...arProduct, ...arCart, ...arCheckout, ...arAccount, ...arOrders,
};
